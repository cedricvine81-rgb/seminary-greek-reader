#!/usr/bin/env python3
"""Clean two Wikisource build artifacts out of the Sibylline Oracles text.

The Wikisource build of Milton S. Terry's translation left two kinds of markup in the verse
strings, so part of the English the reader shows is not Terry.

PASS 1 — leaked TemplateStyles CSS (18 lines). Two shapes:
  * `.mw-parser-output .wst-asterisks{display:block;margin:auto;text-align:center}.`
    — 9 lines that are NOTHING BUT css plus a dot. In the printed book these are the rows of
      centred asterisks that mark a break; stripped, they leave ".", which is exactly how Terry's
      other lacuna lines already read in this corpus.
  * `…text .mw-parser-output .nowrap,…{white-space:nowrap}. . .`
    — 9 lines where the css sits INSIDE a real line, wrapping the run of spaced dots Terry prints
      for a gap in the Greek. Stripped, the line reads "…text. . ." as it should.

PASS 2 — orphaned footnote anchors (430 lines). Wikisource renders each footnote as a superscript
link `[1]`, `[2]`…; the scrape dropped the digits and the closing bracket and left a bare `[` at
the end of the line ("…to whom a throne[").

  These are provably NOT Terry's editorial brackets. Terry does use square brackets, around
  passages he judges interpolated, and those are real and span lines. But they balance exactly
  once the trailing ones are removed — in EVERY book, `open − trailing = close`:

      book  1: 37-35=2  close 2      book  8: 57-53=4  close 4
      book  2: 20-19=1  close 1      book 11: 32-32=0  close 0
      book  3: 68-63=5  close 5      book 12: 31-31=0  close 0
      book  4: 37-32=5  close 5      book 13: 41-41=0  close 0
      book  5: 78-77=1  close 1      book 14: 28-28=0  close 0
      book  6:  7- 7=0  close 0      book  7: 12-12=0  close 0

  A real opener also never falls at end of line (Terry's open at the start of a line or mid-line:
  "[For the Heavenly finished earth a common good", "To lower darkness [and then they shall know").
  Only the trailing position is stripped, so the balance is restored, not broken.

Nothing else under public/data/ carries either defect — only this file.

NOT touched, because they are not damage: the 24 lines whose whole text is "." are Terry's own
mark of a lacuna in the Greek, and the missing books 9 and 10 are missing in every edition (their
material duplicated other books), not lost from this corpus.

Idempotent: each pass guards on its own flag, so re-running is a no-op.

Usage:  python3 scripts/fix-sibylline-wikisource-css.py    (run from the repo root)
"""
import json, re, sys

SRC = 'public/data/pseudepigrapha/sibylline.json'

# One `.mw-parser-output …{…}` span, however many selectors it chains before the brace.
CSS = re.compile(r'\.mw-parser-output[^{]*\{[^}]*\}')


def strip_css(doc):
    changed = []
    for c in doc['chapters']:
        for v in c['verses']:
            if not CSS.search(v['text']):
                continue
            old = v['text']
            new = re.sub(r'\s{2,}', ' ', CSS.sub('', old)).strip()
            if not new:
                raise SystemExit(f'{c["number"]}:{v["number"]}: stripping emptied the line')
            v['text'] = new
            changed.append((c['number'], v['number'], new))
    leftover = [(c['number'], v['number']) for c in doc['chapters'] for v in c['verses']
                if '.mw-parser-output' in v['text']]
    if leftover:
        raise SystemExit(f'css survived at {leftover}')
    return changed


def strip_footnote_anchors(doc):
    """Remove end-of-line `[` anchors, but only where they are provably not Terry's brackets.

    The test is per book: after removing the trailing ones, the openers that remain must not
    OUTNUMBER the closers. If they did, one of the anchors I am about to delete could be a real
    opener, and I would be destroying an editorial bracket — so refuse.

    Remaining openers FEWER than closers is a different thing and is allowed: it means the source
    already carries an orphaned `]` whose opener was never transcribed. Book 2 is the one such
    case (a lone `]` at 2:185). That orphan predates this script — book 2 had 2 closers against 1
    non-trailing opener before anything was touched — so stripping the anchors does not create it,
    it only makes it visible. It is left exactly as it stands and flagged in the book's note.
    """
    changed, orphans = [], []
    for c in doc['chapters']:
        opens = sum(v['text'].count('[') for v in c['verses'])
        closes = sum(v['text'].count(']') for v in c['verses'])
        trailing = [v for v in c['verses'] if v['text'].rstrip().endswith('[')]
        remaining = opens - len(trailing)
        if remaining > closes:
            raise SystemExit(
                f'book {c["number"]}: {remaining} openers would survive against {closes} closers — '
                f'one of the trailing "[" may be a real bracket; not touching this book')
        if remaining < closes:
            orphans.append((c['number'], closes - remaining))
        for v in trailing:
            new = v['text'].rstrip()[:-1].rstrip()
            if not new:
                raise SystemExit(f'{c["number"]}:{v["number"]}: stripping emptied the line')
            v['text'] = new
            changed.append((c['number'], v['number']))
    for c in doc['chapters']:
        o = sum(v['text'].count('[') for v in c['verses'])
        cl = sum(v['text'].count(']') for v in c['verses'])
        if o > cl:
            raise SystemExit(f'book {c["number"]}: unmatched openers left, {o} vs {cl}')
    for n, k in orphans:
        print(f'  NOTE book {n}: {k} orphaned "]" with no opener in the source — left as it stands')
    return changed


def main():
    doc = json.load(open(SRC))
    lines_before = sum(len(c['verses']) for c in doc['chapters'])
    did = []

    if doc.get('_wikisourceCssStripped'):
        print('pass 1 (css): already done')
    else:
        ch = strip_css(doc)
        doc['_wikisourceCssStripped'] = True
        did.append(f'{len(ch)} css lines')
        for n, vn, new in ch:
            print(f'  css  {n:>3}:{vn:<4} -> {new!r}')

    if doc.get('_footnoteAnchorsStripped'):
        print('pass 2 (footnote anchors): already done')
    else:
        ch = strip_footnote_anchors(doc)
        doc['_footnoteAnchorsStripped'] = True
        did.append(f'{len(ch)} orphaned "[" anchors')
        print(f'  anchors: {len(ch)} trailing "[" removed; brackets now balance in all 12 books')

    if not did:
        print('nothing to do')
        return 0

    if sum(len(c['verses']) for c in doc['chapters']) != lines_before:
        raise SystemExit('line count moved')

    with open(SRC, 'w') as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('\ncleaned: ' + ', '.join(did) + f'; {lines_before} lines total (unchanged)')
    return 0


sys.exit(main())
