r"""Split the three Philo sections that were merged into their predecessor by a spacing variant.

THE DEFECT. build-philo.py splits Yonge's running text on the section markers his source page
prints. Those markers are normally "(218)", but in three places the page prints them with a space
inside the parens -- "( 218)" -- which the builder's marker pattern does not match. The result is
that the marked section is silently swallowed by the one before it, and its number disappears from
the file entirely:

    alleg-interp 3.217   ... shall Sarah, who is ninety years old, have a son?' "( 218) Abraham ...
    embassy      1.291   ... And thy great grandmother ...( 292) "On which account, no one ...
    flight       1.95    ... he forbids what may not be done. [...]( 96) And these are the very ...

A scan of the whole corpus for r'\(\s*\d{1,4}\s*\)' finds these three occurrences and no others.

WHY THE SPLIT IS SAFE. The script does not guess where a section ought to begin: it splits exactly
at a marker that is physically present in the text, and only when the number that marker names is
absent from the chapter (i.e. the section really is missing, not merely cross-referenced). Both
halves keep every character of the original apart from the marker itself. If either check fails --
no marker, or the number already exists -- that entry is skipped and reported, never forced.

The Greek confirms the split independently. Before the fix, English 95 of On Flight ran to 1031
characters against 340 for Greek 95; afterwards the two halves line up with Greek 95 and 96, and
build-philo-greek.py attaches a Greek text to the newly restored section, which previously had none.

Rerunning is safe: once split, the marker is gone and the number exists, so the script reports
'already split' and changes nothing.

Usage:  python3 scripts/fix-philo-merged-sections.py [--write]
        (run from the repo root; without --write it only reports)
        Afterwards, re-run scripts/build-philo-greek.py so the new sections get their Greek.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# (slug, chapter number, section holding the marker, section the marker names)
MERGES = [
    ('alleg-interp', 3, 217, 218),
    ('embassy', 1, 291, 292),
    ('flight', 1, 95, 96),
]


def split_one(slug, ch_num, holder, missing, write):
    path = ROOT / 'public/data/philo' / f'{slug}.json'
    doc = json.loads(path.read_text(encoding='utf-8'))
    chapter = next(c for c in doc['chapters'] if c.get('number') == ch_num)
    verses = chapter['verses']
    numbers = {v['number'] for v in verses}

    if missing in numbers:
        print(f'{slug} {ch_num}.{holder}: already split (§{missing} exists)')
        return False

    idx = next(i for i, v in enumerate(verses) if v['number'] == holder)
    verse = verses[idx]
    marker = re.search(rf'\(\s*{missing}\s*\)', verse['text'])
    if not marker:
        print(f'{slug} {ch_num}.{holder}: NO marker for §{missing} — skipped, nothing changed')
        return False

    head = verse['text'][:marker.start()].strip()
    tail = verse['text'][marker.end():].strip()
    if not head or not tail:
        print(f'{slug} {ch_num}.{holder}: marker at an edge — skipped, nothing changed')
        return False

    # The holder keeps its own Greek; the new section has none until build-philo-greek.py runs.
    new = {k: v for k, v in verse.items() if k not in ('text', 'greek')}
    new['number'] = missing
    new['text'] = tail
    verse['text'] = head
    verses.insert(idx + 1, new)

    print(f'{slug} {ch_num}.{holder}: split at {marker.group(0)!r} '
          f'-> §{holder} {len(head)} chars, §{missing} {len(tail)} chars')
    print(f'    §{holder} ends : ...{head[-60:]!r}')
    print(f'    §{missing} starts: {tail[:60]!r}...')

    if write:
        path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return True


def main():
    write = '--write' in sys.argv
    changed = sum(split_one(*m, write) for m in MERGES)
    print(f'\n{changed} section(s) split' + ('' if write else '  (dry run — pass --write)'))
    if changed and write:
        print('now re-run: python3 scripts/build-philo-greek.py')


main()
