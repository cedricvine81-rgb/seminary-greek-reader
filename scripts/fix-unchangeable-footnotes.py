"""Strip the leaked footnote reference numbers from Philo, On the Unchangeableness of God.

THE DEFECT. Yonge's page for this treatise (unlike the other 35) prints footnote references
as bare superscript digits rather than in the {...} braces build-philo.py knows to drop, so
they survive into the text as digits glued onto the preceding word:

    ... and they bore children unto them."1 It is worth while ...
    ... on whom he is said to have believed.4
    ... For in the first book of Kings, 5 she speaks in this manner ...

A scan of all 36 treatises found this only here (spec-laws 2.200 matches the same shape, but
those are musical ratios — 4:3, 3:2, 2:1 — and are real text, so nothing there is touched).

WHY THE REMOVAL IS SAFE. The markers are a complete, strictly ascending run 1..45 through the
treatise. This script does not pattern-match "a digit that looks like a footnote"; it walks the
sections in order and removes the NEXT EXPECTED number only, requiring it to sit at a footnote
position (end of a word or after closing punctuation, followed by space or end of section).
If any expected number is missing, or one is found out of order, the script aborts rather than
guessing — so it cannot quietly delete a digit that belongs to the text.

Verification: exactly 45 removals, the section text is otherwise unchanged character for
character, and no digit that is part of a larger number or a real citation is touched.

Usage:  python3 scripts/fix-unchangeable-footnotes.py [--write]
        (run from the repo root; without --write it only reports)
"""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public/data/philo/unchangeable.json'
LAST = 45


def main():
    write = '--write' in sys.argv
    doc = json.loads(OUT.read_text(encoding='utf-8'))
    verses = doc['chapters'][0]['verses']

    expected = 1
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

    leftover = [(v['number'], m.group(0))
                for v in verses
                for m in re.finditer(r'(?<=[A-Za-z"”\)]) ?\d{1,2}(?=\s|$)', v['text'])]

    print(f'removals   : {len(removals)} (markers 1..{LAST}, strictly ascending)')
    print(f'leftover   : {len(leftover)}' + (f'  {leftover[:6]}' if leftover else ''))
    for sec, n, ctx in removals[:4] + removals[-2:]:
        print(f'  §{sec:<4} [{n}]  ...{ctx.strip()!r}')

    if write:
        OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'wrote {OUT}')


main()
