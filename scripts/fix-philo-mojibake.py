r"""Repair the eight mojibake 'æ' characters in the Philo corpus.

THE DEFECT. Eight characters on Yonge's source pages arrived as 'æ' — a mis-decoded byte, not a
real ligature. A scan of all 36 treatises finds exactly eight, falling into two clearly separable
groups:

  (a) An opening single quote before reported speech, always closed later by a real "'" (6 cases):
        alleg-interp 3.217   ... and said, æShall a son be born to him who is a hundred years old;
        flight       1.1     ... said unto her: æThou handmaiden of Sarah, whence art thou come?
        planter      1.78    ... and he called that place, æThe Oath.'

  (b) A long-vowel mark inside a Greek transliteration (2 cases, both in one word):
        alleg-interp 1.82    the very name of confession (exomologeæseoæs)

WHY EACH REPLACEMENT IS THE RIGHT ONE. Group (b) is identified by position: 'æ' sitting directly
after an 'e' or an 'o' inside a run of letters. Yonge marks long vowels with 'µ' everywhere else in
this corpus — 'arrheµktois' (confusion 138), 'aitheµr' (confusion 156), 'poneµros' (posterity 94),
'metalloioµn' (posterity 93) — so 'exomologeæseoæs' becomes 'exomologeµseoµs', consistent with its
neighbours. Group (a) is everything else, and in all six the 'æ' opens a span closed by a plain
apostrophe, so "'" is the only reading that balances the quotation.

The two rules cannot collide: rule (b) requires a letter on both sides, rule (a) is applied only to
what rule (b) did not match. The script asserts that no 'æ' survives, and reports every change with
its context. Rerunning is safe — with no 'æ' left it reports 'already clean'.

Usage:  python3 scripts/fix-philo-mojibake.py [--write]
        (run from the repo root; without --write it only reports)
"""
import json
import re
import sys
from pathlib import Path

PHILO = Path(__file__).resolve().parent.parent / 'public/data/philo'
# 'æ' between two letters, right after a long-vowel-bearing e/o -> Yonge's macron mark.
MACRON = re.compile(r'(?<=[eo])æ(?=[a-z])')


def main():
    write = '--write' in sys.argv
    changes = []

    for path in sorted(PHILO.glob('*.json')):
        if path.name.endswith('.morph.json'):
            continue
        doc = json.loads(path.read_text(encoding='utf-8'))
        touched = False
        for chapter in doc.get('chapters', []):
            for verse in chapter['verses']:
                if 'æ' not in verse['text']:
                    continue
                before = verse['text']
                after = MACRON.sub('µ', before)
                after = after.replace('æ', "'")
                assert 'æ' not in after, 'a mojibake character survived both rules'
                for m in re.finditer('æ', before):
                    i = m.start()
                    kind = 'macron' if MACRON.match(before, i) else 'quote'
                    changes.append((path.name, chapter.get('number'), verse['number'],
                                    kind, before[max(0, i - 45):i + 45]))
                verse['text'] = after
                touched = True
        if touched and write:
            path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    if not changes:
        print('already clean — no mojibake present')
        return

    for name, ch, sec, kind, ctx in changes:
        print(f'{name:<20} {ch}.{sec:<4} [{kind}]  ...{ctx.strip()!r}...')
    print(f'\n{len(changes)} character(s) repaired' + ('' if write else '  (dry run — pass --write)'))


main()
