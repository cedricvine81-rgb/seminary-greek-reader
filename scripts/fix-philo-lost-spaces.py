r"""Restore the four lost word spaces in the Philo corpus.

THE DEFECT. Four places in Yonge's source pages lost the space between two words, leaving a
run-together token that is not an English word:

    alleg-interp 3.111   the whole race of animals is irrational andunder the guidance only ...
    alleg-interp 3.247   ... inasmuch as he does everything in accordance withvice.
    flight       1.10    ... the legitimate authority of kingly power. Of thiscompany Jacob is ...
    heir         1.42    ... but not of sincere friendship for us, I willexplain without any ...

HOW THESE FOUR WERE FOUND, AND WHY THE LIST STOPS AT FOUR. Every token in the corpus matching a
short function word glued to a following word was collected, then filtered to those where the
whole token is not a dictionary word but the tail is. That left these four plus two families that
are NOT defects and are deliberately untouched:

  * Yonge's own closed compounds, where the source simply sets no hyphen: allwise, allglorious,
    allperfect, allknowing, allnourishing, allaccomplished, allproductive, allwealthy,
    beforementioned, aforementioned, hegoat/hegoats. These read as single words in his prose and
    are consistent across treatises, so changing them would be editing the translator, not
    repairing a scrape.
  * Ordinary words the system dictionary lacks in inflected form: became, offence(s), aether,
    betake, befallen, incurred, whosoever, and so on.

Each of the four is a single occurrence in its file, matched with its surrounding context so it
cannot hit anything else, and the replacement only inserts a space. Rerunning is safe.

Usage:  python3 scripts/fix-philo-lost-spaces.py [--write]
        (run from the repo root; without --write it only reports)
"""
import json
import sys
from pathlib import Path

PHILO = Path(__file__).resolve().parent.parent / 'public/data/philo'
# (slug, chapter, section, broken token, repaired token)
FIXES = [
    ('alleg-interp', 3, 111, 'irrational andunder the', 'irrational and under the'),
    ('alleg-interp', 3, 247, 'in accordance withvice.', 'in accordance with vice.'),
    ('flight', 1, 10, 'Of thiscompany Jacob', 'Of this company Jacob'),
    ('heir', 1, 42, 'I willexplain without', 'I will explain without'),
]


def main():
    write = '--write' in sys.argv
    fixed = 0
    for slug, ch_num, sec, broken, repaired in FIXES:
        path = PHILO / f'{slug}.json'
        doc = json.loads(path.read_text(encoding='utf-8'))
        chapter = next(c for c in doc['chapters'] if c.get('number') == ch_num)
        verse = next(v for v in chapter['verses'] if v['number'] == sec)

        if repaired in verse['text'] and broken not in verse['text']:
            print(f'{slug} {ch_num}.{sec}: already fixed')
            continue
        n = verse['text'].count(broken)
        if n != 1:
            print(f'{slug} {ch_num}.{sec}: expected 1 occurrence of {broken!r}, found {n} — skipped')
            continue

        verse['text'] = verse['text'].replace(broken, repaired)
        print(f'{slug} {ch_num}.{sec}: {broken!r} -> {repaired!r}')
        fixed += 1
        if write:
            path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print(f'\n{fixed} space(s) restored' + ('' if write else '  (dry run — pass --write)'))


main()
