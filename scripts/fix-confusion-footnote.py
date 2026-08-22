"""Strip the one leaked translator's footnote from Philo, On the Confusion of Tongues 138.

THE DEFECT. Yonge's note 37 on this section — a textual remark about the Greek his source
prints — was set inline on the source page rather than in the {...} braces build-philo.py drops,
so it survived into the section text, wedged into the middle of a sentence:

    ... But when he says, "I am he who 37The text has aoratois, "invisible," but I have
    followed Mangey's translation, who reads arrheµktois. The remainder of the sentence is
    exceedingly corrupt. stands before Thee" he appears indeed to be displayed ...

WHY THE REMOVAL IS SAFE. A scan of all 36 treatises for the leak signature (a footnote digit
glued to the capitalised start of a note) found this occurrence and no other. The span removed
is matched literally, from the digit through the trailing 'corrupt. ', so nothing outside the
note can be touched; if the span is not found the script reports and changes nothing. What
remains is Yonge's own sentence, unbroken: '... "I am he who stands before Thee" ...'.

The 'corrupt' hits elsewhere in the corpus (good-person 79, posterity 165, unchangeable 105/122/
136/142/143, spec-laws 313 etc.) are all ordinary prose — 'corrupt the principle of equality',
'corruptible matter' — and are deliberately left alone.

Usage:  python3 scripts/fix-confusion-footnote.py [--write]
        (run from the repo root; without --write it only reports)
"""
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public/data/philo/confusion.json'
SECTION = 138
NOTE = ('37The text has aoratois, "invisible," but I have followed Mangey\'s translation, '
        'who reads arrheµktois. The remainder of the sentence is exceedingly corrupt. ')


def main():
    write = '--write' in sys.argv
    doc = json.loads(OUT.read_text(encoding='utf-8'))
    verses = doc['chapters'][0]['verses']
    verse = next(v for v in verses if v['number'] == SECTION)

    if NOTE not in verse['text']:
        print('already clean — the note is not present')
        return

    before = verse['text']
    verse['text'] = before.replace(NOTE, '', 1)
    i = before.index(NOTE)
    print(f'§{SECTION}: removed {len(NOTE)} chars')
    print(f'  before: ...{before[max(0, i - 40):i + len(NOTE) + 30]!r}...')
    print(f'  after : ...{verse["text"][max(0, i - 40):i + 30]!r}...')

    if write:
        OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'wrote {OUT}')


main()
