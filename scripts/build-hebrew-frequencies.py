#!/usr/bin/env python3
"""Count how often each Hebrew lemma occurs in the Masoretic text.

The Exegesis glossary ("show words less frequent than N×") worked only for Greek: the Greek
corpus ships a lexeme object per word carrying gloss AND frequency, while MT words carry only
a Strong's number and a morphology code. This produces the missing half — a compact
Strong's → count map over the whole Hebrew Bible — so the same control works on a Hebrew
passage. The gloss comes from the Hebrew lexicon we already ship.

Counts every occurrence, including a Strong's that appears inside a compound word's
morphemes (a preposition or suffix welded onto a noun is still an occurrence of that word).

    python3 scripts/build-hebrew-frequencies.py   →  public/data/hebrew-freq.json
"""
import json
import re
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MT = REPO / 'public' / 'data' / 'mt'
OUT = REPO / 'public' / 'data' / 'hebrew-freq.json'
NUM = re.compile(r'(\d+)')


def main():
    counts = Counter()
    files = sorted(MT.glob('*.json'))
    for f in files:
        data = json.loads(f.read_text())
        for v in data.get('verses', []):
            for w in v.get('words', []):
                got = set()
                m = NUM.match(str(w.get('strongs') or ''))
                if m:
                    got.add(m.group(1))
                for mm in w.get('morphemes', []):
                    m2 = NUM.match(str(mm.get('strongs') or ''))
                    if m2:
                        got.add(m2.group(1))
                for s in got:
                    counts[s] += 1
    OUT.write_text(json.dumps(dict(sorted(counts.items(), key=lambda kv: -kv[1])), separators=(',', ':')))
    print(f'{len(files)} chapters · {len(counts)} distinct lemmas · '
          f'{sum(counts.values()):,} occurrences → {OUT.relative_to(REPO)}')
    top = list(counts.items())[:5]
    print('  commonest:', ', '.join(f'{s}×{n}' for s, n in sorted(counts.items(), key=lambda kv: -kv[1])[:5]))


if __name__ == '__main__':
    main()
