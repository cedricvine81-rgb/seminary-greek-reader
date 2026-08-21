#!/usr/bin/env python3
"""Repair the Odes of Solomon: three verse numbers mangled by the OCR of the printed page.

The sacred-texts.com scan of J. Rendel Harris's translation ("The Forgotten Books of Eden", 1926)
lost three verse numbers to OCR. NO TEXT IS MISSING anywhere in this work — in all three cases the
words are present and only the number that should have started a record was destroyed, so the
verse was absorbed into its neighbour and became uncitable and unsearchable:

  * Ode 8:18  — printed "18 I took pleasure in them…". The OCR read the initial "I" of "I took"
                as a third digit, producing a record numbered 181 whose text opens "took pleasure".
                Numeric sorting then threw it to the END of the Ode, after v. 26. Renumbered to 18,
                the swallowed "I" restored, and re-sorted back between vv. 17 and 19.
  * Ode 9:4   — the "4" was read as "q" and left sitting inline in v. 3
                ("…your end is immortality. q Be enriched in God the Father…"). Split at the q.
  * Ode 16:18 — the "18" was read as "IS" and left sitting inline in v. 17
                ("…speak the beauty of God: IS And there is nothing that is without the Lord…").
                Split at the IS.

Ode 8 gains no verse (it is a renumber); Odes 9 and 16 gain one each, so the work goes 505 -> 507.

NOT defects, and deliberately left alone:
  * Ode 2 is a single record reading "( No part of this Ode has ever been identified.)" — the Ode
    is genuinely lost, and that parenthesis is Harris's own note.
  * Ode 3 starts at verse 2 — the manuscript's opening is lost, which is likewise genuine.
  * Ode 1 has only 4 verses — it survives only as quoted in the Pistis Sophia.

An earlier integrity scan reported "157 missing verses" here. That was an artifact: the bogus 181
inflated Ode 8's number range to 1-181, so 163 verse numbers that never existed were counted as
gaps. The real figure is the three above.

Idempotent: re-running on a repaired file is a no-op (guards on `_verseNumbersRepaired`).

Usage:  python3 scripts/fix-odes-verse-numbers.py     (run from the repo root)
"""
import json, re, sys

SRC = 'public/data/pseudepigrapha-b/odes-of-solomon.json'


def words(doc):
    """Every word in the work, for the before/after loss check."""
    return re.findall(r"[\w']+", ' '.join(
        v['text'] for c in doc['chapters'] for v in c['verses']))


def chapter(doc, n):
    for c in doc['chapters']:
        if c['number'] == n:
            return c
    raise KeyError(n)


def split_at(chap, verse_no, marker, new_no):
    """Split verse `verse_no` at `marker`, the mis-OCR'd number, into itself + `new_no`."""
    vs = chap['verses']
    i = next(k for k, v in enumerate(vs) if v['number'] == verse_no)
    head, sep, tail = vs[i]['text'].partition(marker)
    if not sep:
        raise SystemExit(f"Ode {chap['number']}:{verse_no}: marker {marker!r} not found")
    vs[i]['text'] = head.strip()
    vs.insert(i + 1, {**vs[i], 'number': new_no, 'text': tail.strip()})


def main():
    doc = json.load(open(SRC))
    if doc.get('_verseNumbersRepaired'):
        print('already repaired — nothing to do')
        return 0

    before = words(doc)
    counts_before = {c['number']: len(c['verses']) for c in doc['chapters']}

    # Ode 8: 181 -> 18, restore the "I" the number ate, and put it back in sequence.
    ode8 = chapter(doc, 8)
    bad = next((v for v in ode8['verses'] if v['number'] == 181), None)
    if bad is None:
        raise SystemExit('Ode 8: expected a record numbered 181')
    bad['number'] = 18
    if not bad['text'].startswith('I '):
        bad['text'] = 'I ' + bad['text']
    ode8['verses'].sort(key=lambda v: v['number'])

    # Odes 9 and 16: numbers left inline as letters.
    split_at(chapter(doc, 9), 3, ' q ', 4)
    split_at(chapter(doc, 16), 17, ' IS ', 18)
    chapter(doc, 9)['verses'].sort(key=lambda v: v['number'])
    chapter(doc, 16)['verses'].sort(key=lambda v: v['number'])

    after = words(doc)
    # The three restored characters are the only permitted change to the word stream:
    # "I" gained in Ode 8, and the q / IS tokens dropped in Odes 9 and 16.
    lost = [w for w in ('q', 'IS') if before.count(w) - after.count(w) != 1]
    if lost:
        raise SystemExit(f'word-stream check failed for {lost}')
    if len(after) != len(before) - 1:
        raise SystemExit(f'word count moved unexpectedly: {len(before)} -> {len(after)}')

    doc['_verseNumbersRepaired'] = True
    with open(SRC, 'w') as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write('\n')

    for n in (8, 9, 16):
        c = chapter(doc, n)
        print(f'Ode {n:>2}: {counts_before[n]} -> {len(c["verses"])} verses, '
              f'numbers {[v["number"] for v in c["verses"]][-4:]}')
    print(f'\ntotal verses: {sum(len(c["verses"]) for c in doc["chapters"])}')
    print(f'words: {len(before)} -> {len(after)}  (q and IS dropped, I restored)')
    return 0


sys.exit(main())
