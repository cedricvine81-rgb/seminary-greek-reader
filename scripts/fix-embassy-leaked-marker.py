#!/usr/bin/env python3
"""Remove the one leaked line-number marker in the Philo corpus.

Embassy 1:200 reads "...pretext for carrying out his design.40,200 "There is a
city called Jamnia..." -- the "40,200" is the source page's own running
line-reference, glued onto the sentence by the scrape. A corpus-wide scan for
`(?<=[.!?])\\d+,\\d{3}\\s` finds exactly this one occurrence, so the fix is
complete, not a sample.

Idempotent: reports "already clean" on a second run. Writes the corpus's
canonical COMPACT json, because build-philo-greek.py re-normalises anything else.
"""
import json
import re
import sys
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'philo' / 'embassy.json'
MARKER = re.compile(r'(?<=[.!?])\d+,\d{3}(?=\s)')


def main() -> int:
    doc = json.loads(PATH.read_text(encoding='utf-8'))
    hits = 0
    for chapter in doc['chapters']:
        for verse in chapter['verses']:
            after = MARKER.sub('', verse['text'])
            if after != verse['text']:
                verse['text'] = after
                hits += 1
    if hits:
        PATH.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        print(f'{hits} section(s) repaired')
    else:
        print('already clean')
    return 0


if __name__ == '__main__':
    sys.exit(main())
