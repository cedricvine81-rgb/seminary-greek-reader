r"""Strip the two footnote reference digits glued to a closing quote in the Philo corpus.

THE DEFECT. In two places a footnote number on Yonge's page survived into the section text,
wedged between a closing quotation mark and the em-dash that follows it:

    flight    1.192   ... "the cataracts of heaven were opened"58--by heaven I here mean the mind ...
    migration 1.97    ... and tablets, all jewels of gold,"49--everything, in short, of which ...

They were missed by the earlier footnote sweep (scripts/fix-unchangeable-footnotes.py), whose
pattern required whitespace or end-of-section after the number; here a '--' follows instead.

WHY THE REMOVAL IS SAFE. A scan of the whole corpus for a digit run glued directly to a closing
quote finds these two and no others. In both the digit sits between the quotation mark that ends
a scriptural citation and the dash that resumes Philo's own sentence, a position no real number
in the text ever occupies; removing it leaves '...opened"--by heaven...' reading correctly. The
match is anchored to the closing quote on the left and the dash on the right, so it cannot touch
a number that belongs to the prose. Rerunning reports 'already clean'.

Usage:  python3 scripts/fix-philo-inline-footnote-digits.py [--write]
        (run from the repo root; without --write it only reports)
"""
import json
import re
import sys
from pathlib import Path

PHILO = Path(__file__).resolve().parent.parent / 'public/data/philo'
MARKER = re.compile(r'(?<=["”])\d{1,3}(?=--)')
# (slug, chapter, section) — the only two places in the corpus with this shape.
SITES = [('flight', 1, 192), ('migration', 1, 97)]


def main():
    write = '--write' in sys.argv
    removed = 0
    for slug, ch_num, sec in SITES:
        path = PHILO / f'{slug}.json'
        doc = json.loads(path.read_text(encoding='utf-8'))
        chapter = next(c for c in doc['chapters'] if c.get('number') == ch_num)
        verse = next(v for v in chapter['verses'] if v['number'] == sec)

        m = MARKER.search(verse['text'])
        if not m:
            print(f'{slug} {ch_num}.{sec}: already clean')
            continue
        i = m.start()
        print(f'{slug} {ch_num}.{sec}: removed [{m.group(0)}]  ...{verse["text"][max(0, i - 45):i + 45]!r}...')
        verse['text'] = MARKER.sub('', verse['text'])
        removed += 1
        if write:
            path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print(f'\n{removed} marker(s) removed' + ('' if write else '  (dry run — pass --write)'))


main()
