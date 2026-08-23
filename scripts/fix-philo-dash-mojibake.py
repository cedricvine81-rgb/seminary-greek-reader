#!/usr/bin/env python3
r"""Repair the two dash mojibake in the Philo corpus.

Found by a corpus-wide non-ASCII scan while translating the Fragments:

  U+00FB  'u-circumflex' stands for an EN DASH inside a scripture range
          ("#Ge 27:24<fb>27" -> "#Ge 27:24-27").  6 occurrences: fragments 1, qg 5.
  U+0097  a raw C1 control byte stands for an EM DASH ("profits" + ctrl + "so
          very uncertain").  3 occurrences, all in joseph.

Deliberately NOT touched: the systematic 'µ' and '÷' inside Yonge's Greek
transliterations ("anthroµpos", "m÷et÷er").  Those are the source's way of
writing a macron, they run to hundreds of instances, and they are consistent --
that is a convention, not damage.

Idempotent: reports "already clean" on a second run.  Writes the corpus's
canonical COMPACT json, because build-philo-greek.py re-normalises anything else.
"""
import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'philo'
RANGE_DASH = re.compile(r'(?<=\d)û\s*(?=\d)')
CONTROL_EM_DASH = '\u0097'


def main() -> int:
    total = 0
    for path in sorted(DATA.glob('*.json')):
        if path.name.endswith('.morph.json'):
            continue
        doc = json.loads(path.read_text(encoding='utf-8'))
        if 'chapters' not in doc:
            continue
        hits = 0
        for chapter in doc['chapters']:
            for verse in chapter['verses']:
                before = verse['text']
                after = RANGE_DASH.sub('–', before).replace(CONTROL_EM_DASH, '—')
                if after != before:
                    verse['text'] = after
                    hits += 1
        if hits:
            path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
            print(f'{path.name}: {hits} section(s) repaired')
            total += hits
    print(f'{total} section(s) repaired' if total else 'already clean')
    return 0


if __name__ == '__main__':
    sys.exit(main())
