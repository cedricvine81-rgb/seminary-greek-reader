r"""Remove the footnote spliced into the middle of a sentence in Philo, That the Worse Attacks 88.

THE DEFECT. A footnote on Yonge's page — his verse rendering of Ovid, Metamorphoses 1.84-86,
which belongs to section 85 ('for all of them bend their heads downwards') — was dropped into the
running text of section 88 instead, splitting a phrase in half:

    ... what are the limits of their movements, of their from their birth / With downcast eyes
    gaze on their kindred earth, / He bids man walk erect, and scan the heaven / From which he
    springs, to which his hopes are given." beginning and of their end; how they are adapted ...

The tail of the note's first line ('from their birth'), the three verse lines, and the note's
closing quotation mark all sit between 'of their' and 'beginning', where Philo's own sentence
reads 'of their beginning and of their end'.

WHY THE REMOVAL IS SAFE. The spliced span is bounded on both sides by the halves of one phrase,
and removing exactly it restores 'of their beginning and of their end' — the reading the sentence
requires and that the surrounding clauses ('how they are moved', 'how they are adapted') confirm.
Nothing outside the span is touched. A scan of the whole corpus for the note's signature (verse
line-break slashes inside a section) finds this occurrence and no other; the note text itself is
editorial apparatus, not Philo, so no content of the treatise is lost.

Rerunning is safe: with the span gone the script reports 'already clean'.

Usage:  python3 scripts/fix-worse-spliced-footnote.py [--write]
        (run from the repo root; without --write it only reports)
"""
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public/data/philo/worse.json'
SECTION = 88
SPLICED = (' from their birth / With downcast eyes gaze on their kindred earth, '
           '/ He bids man walk erect, and scan the heaven / From which he springs, '
           'to which his hopes are given."')


def main():
    write = '--write' in sys.argv
    doc = json.loads(OUT.read_text(encoding='utf-8'))
    verse = next(v for v in doc['chapters'][0]['verses'] if v['number'] == SECTION)

    if SPLICED not in verse['text']:
        print('already clean — the spliced note is not present')
        return

    i = verse['text'].index(SPLICED)
    print(f'§{SECTION}: removing {len(SPLICED)} chars')
    print(f'  before: ...{verse["text"][max(0, i - 55):i + len(SPLICED) + 35]!r}...')
    verse['text'] = verse['text'].replace(SPLICED, '', 1)
    print(f'  after : ...{verse["text"][max(0, i - 55):i + 35]!r}...')

    if write:
        OUT.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        print(f'wrote {OUT}')


main()
