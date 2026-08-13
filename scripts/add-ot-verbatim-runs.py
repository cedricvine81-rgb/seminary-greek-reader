#!/usr/bin/env python3
"""Ship the reviewed verbatim runs into the cross-reference apparatus.

find-ot-verbatim-runs.py produces the candidate list; this adds the reviewed subset. The
review decisions are encoded as rules rather than a hand-marked file, so the pipeline can be
re-run when the corpus or the curated table changes:

  · pairs the curated table already links are skipped (no duplicate rows)
  · Samuel–Kings ‖ Chronicles and the other known synoptic pairs are skipped — the Synopsis
    tab already sets those side by side, and there are thousands of them
  · at most 2 runs per verse-pair and 8 per book-pair, so the Chronicler's genealogies do not
    bury everything else
  · each citation SHOWS THE SHARED WORDS and says it was found by matching wording, so a
    reader can judge it rather than take it on trust

Bidirectional, like every other OT link here. gen "ot-verbatim"; a re-run replaces the batch.
"""
import json
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
XREFS = REPO / 'public' / 'data' / 'backgrounds-crossrefs.json'
RUNS = REPO / '.ot-runs' / 'review.json'
GEN = 'ot-verbatim'
MAX_PER_VERSE_PAIR = 2
MAX_PER_BOOK_PAIR = 8

data = json.loads(XREFS.read_text())
entries = data['entries']
for e in entries:
    e['citations'] = [c for c in e['citations'] if c.get('gen') != GEN]
entries = [e for e in entries if e['citations']]

# What the curated layer already says, so we don't repeat it.
curated = set()
for e in entries:
    for c in e['citations']:
        r = c.get('ref')
        if r and c.get('gen') == 'ot-intertext':
            curated.add(((e['book'], e['chapter'], e['verseStart']), (r['book'], r['chapter'], r['verse'])))

index = {(e['book'], e['chapter'], e['verseStart'], e['verseEnd']): e for e in entries}
runs = json.loads(RUNS.read_text())
runs.sort(key=lambda c: -c['score'])

per_verse, per_book, added = defaultdict(int), defaultdict(int), 0
for c in runs:
    a = (c['aOsis'], c['aCh'], c['aV'])
    b = (c['bOsis'], c['bCh'], c['bV'])
    if (a, b) in curated or (b, a) in curated:
        continue
    bp = frozenset((c['aOsis'], c['bOsis']))
    vp = frozenset((a, b))
    if per_verse[vp] >= MAX_PER_VERSE_PAIR or per_book[bp] >= MAX_PER_BOOK_PAIR:
        continue
    per_verse[vp] += 1
    per_book[bp] += 1
    note = (f'Shares {c["words"]} words with this passage, letter for letter: '
            f'“{c["text"]}” — found by matching wording across books.')
    for (src, dst, dstLabel) in ((a, b, c['b']), (b, a, c['a'])):
        key = (src[0], src[1], src[2], src[2])
        e = index.get(key)
        if not e:
            e = {'book': src[0], 'chapter': src[1], 'endChapter': src[1],
                 'verseStart': src[2], 'verseEnd': src[2],
                 'label': f'{src[0]} {src[1]}:{src[2]}', 'citations': [], 'gen': GEN}
            index[key] = e
            entries.append(e)
        text = f'{dst[0]} {dst[1]}:{dst[2]}'
        if any(x.get('text') == text and x.get('gen') == GEN for x in e['citations']):
            continue
        e['citations'].append({'text': text, 'type': 'OT', 'kind': 'Verbatim', 'gen': GEN,
                               'note': note, 'ref': {'book': dst[0], 'chapter': dst[1], 'verse': dst[2]}})
        added += 1

entries.sort(key=lambda e: (e['book'], e['chapter'], e['verseStart']))
data['entries'] = entries
marker = 'Verbatim parallels between Old Testament books'
if marker not in data.get('attribution', ''):
    data['attribution'] += (
        ' Verbatim parallels between Old Testament books were found mechanically, by matching '
        'runs of seven or more consecutive words letter for letter across the consonantal text, '
        'and are labelled as such with the shared wording shown.')
XREFS.write_text(json.dumps(data, ensure_ascii=False))
print(f'{added} verbatim citations across {len(per_book)} book-pairs')
