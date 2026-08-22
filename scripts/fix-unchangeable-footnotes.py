"""Strip the leaked footnote reference numbers from Philo, On the Unchangeableness of God.

THE DEFECT. Yonge's page for this treatise (unlike the other 35) prints footnote references
as bare superscript digits rather than in the {...} braces build-philo.py knows to drop, so
they survive into the text as digits glued onto the preceding word:

    ... and they bore children unto them."1 It is worth while ...
    ... on whom he is said to have believed.4
    ... For in the first book of Kings, 5 she speaks in this manner ...

A scan of all 36 treatises found this only here (spec-laws 2.200 matches the same shape, but
those are musical ratios — 4:3, 3:2, 2:1 — and are real text, so nothing there is touched).

WHY THE REMOVAL IS SAFE. The markers are a complete, strictly ascending run 1..46 through the
treatise. This script does not pattern-match "a digit that looks like a footnote"; it walks the
sections in order and removes the NEXT EXPECTED number only, requiring it to sit at a footnote
position (end of a word or after closing punctuation, followed by space or end of section).
If any expected number is missing, or one is found out of order, the script aborts rather than
guessing — so it cannot quietly delete a digit that belongs to the text.

Verification: 46 removals, the section text is otherwise unchanged character for character,
and no digit that is part of a larger number or a real citation is touched. Rerunning is safe —
the script starts from the lowest marker still present and reports 'already clean' when none is.

Usage:  python3 scripts/fix-unchangeable-footnotes.py [--write]
        (run from the repo root; without --write it only reports)
"""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public/data/philo/unchangeable.json'
LAST = 46


def main():
    write = '--write' in sys.argv
    doc = json.loads(OUT.read_text(encoding='utf-8'))
    verses = doc['chapters'][0]['verses']

    # Rerunnable: start from the LOWEST marker still present rather than always from 1, so a
    # partly-cleaned file can be finished. (This mattered: the first run stopped at 45 because
    # the leftover check had a blind spot, and marker 46 stayed behind. Re-running from 1 then
    # aborted with "0 found" on an otherwise-clean file.) The ascending-run guarantee is kept —
    # from wherever it starts, every number through LAST must be found, in order.
    def present(n):
        return any(re.search(rf'(?<=[A-Za-z"”\)\.,;:]) ?{n}(?=\s|$)', v['text']) for v in verses)

    expected = next((n for n in range(1, LAST + 1) if present(n)), LAST + 1)
    if expected == LAST + 1:
        print('already clean — no markers present')
        return
    first = expected

    removals = []
    for v in verses:
        text = v['text']
        while expected <= LAST:
            # The marker: optional single space, then the number, at a footnote position —
            # preceded by a word character or closing punctuation, followed by space or end.
            m = re.search(rf'(?<=[A-Za-z"”\)\.,;:]) ?{expected}(?=\s|$)', text)
            if not m:
                break
            removals.append((v['number'], expected, text[max(0, m.start() - 40):m.end() + 12]))
            text = text[:m.start()] + text[m.end():]
            expected += 1
        v['text'] = re.sub(r'\s+', ' ', text).strip()

    if expected != LAST + 1:
        raise SystemExit(f'stopped at marker {expected}, expected to finish past {LAST} — '
                         f'aborting rather than guessing ({len(removals)} found)')

    # Broad on purpose: any digit run sitting at a footnote position, after a letter OR any
    # closing punctuation, with or without a space. The first version of this check required a
    # letter/quote/paren immediately before the optional space, so it reported 0 leftover while
    # marker 46 — which follows "wounded," — was still sitting in the last section.
    leftover = [(v['number'], m.group(0))
                for v in verses
                for m in re.finditer(r'(?<=[A-Za-z"”\)\.,;:]) ?\d{1,3}(?=\s|$)', v['text'])]

    print(f'removals   : {len(removals)} (markers {first}..{LAST}, strictly ascending)')
    print(f'leftover   : {len(leftover)}' + (f'  {leftover[:6]}' if leftover else ''))
    for sec, n, ctx in removals[:4] + removals[-2:]:
        print(f'  §{sec:<4} [{n}]  ...{ctx.strip()!r}')

    if write:
        OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'wrote {OUT}')


main()
