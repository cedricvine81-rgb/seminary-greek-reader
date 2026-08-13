#!/usr/bin/env python3
"""Merge the pipeline's ops with human review decisions → shippable SP verse text.

Reads  .sp-flags/<osis>_p*.json   (the aligned streams)
       .sp-reviews/<osis>_reviews.json  (exported by review.html: {page: {flagIdx: {code,val}}})
Writes public/data/sp/<osis>.json  { "ch:v": "<consonantal text>" } — RESOLVED VERSES ONLY.

Decision codes per flag kind:
  sub:  1 = SP reads the OCR word · 2 = SP = MT (OCR error) · 3 = custom (val) · 4 = junk→drop word
  mt :  1 = SP omits this word    · 2 = OCR missed it, keep MT · 3 = custom · 4 = keep MT
  sp :  1 = genuine SP plus, keep · 2 = not in SP, drop        · 3 = custom · 4 = junk, drop

STRICT BY DESIGN: a verse containing any UNdecided flag is not emitted at all. Shipping a
guess as "the Samaritan reading" is the one failure this project must never have. Re-run
after each review session; coverage grows verse by verse.
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
FLAGS = REPO / '.sp-flags'
REVIEWS = REPO / '.sp-reviews'
OUT = REPO / 'public' / 'data' / 'sp'


def main():
    osis = sys.argv[1]
    rf = REVIEWS / f'{osis}_reviews.json'
    decisions = json.loads(rf.read_text())['decisions'] if rf.exists() else {}

    verses = defaultdict(list)      # ref -> words
    unresolved = set()
    for f in sorted(FLAGS.glob(f'{osis}_p*.json')):
        d = json.loads(f.read_text())
        page_dec = decisions.get(str(d['page']), {})
        fi = 0
        for op in d['ops']:
            kind = op[0]
            ref = op[-1]
            if kind == '=':
                verses[ref].append(op[1])
                continue
            dec = page_dec.get(str(fi))
            fi += 1
            if not dec:
                unresolved.add(ref)
                continue
            code, val = dec['code'], dec.get('val')
            if kind == 'sub':
                w = {1: op[2], 2: op[1], 3: val, 4: None}[code]
            elif kind == 'mt':
                w = {1: None, 2: op[1], 3: val, 4: op[1]}[code]
            else:  # sp
                w = {1: op[1], 2: None, 3: val, 4: None}[code]
            if w:
                verses[ref].append(w)

    OUT.mkdir(parents=True, exist_ok=True)
    resolved = {ref: ' '.join(ws) for ref, ws in verses.items() if ref not in unresolved}
    dest = OUT / f'{osis}.json'
    dest.write_text(json.dumps({
        'attribution': 'Samaritan Pentateuch: digitized for this app from A. von Gall, '
                       'Der hebräische Pentateuch der Samaritaner (1918, public domain), '
                       'OCR aligned against the MT and every difference human-verified '
                       'against the page image. Unpointed. Verses appear as review completes.',
        'verses': dict(sorted(resolved.items())),
    }, ensure_ascii=False))
    print(f'{osis}: {len(resolved)} verses resolved, {len(unresolved)} awaiting review '
          f'→ {dest.relative_to(REPO)}')


if __name__ == '__main__':
    main()
