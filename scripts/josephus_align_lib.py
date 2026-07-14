# Helpers for the manual per-§ Josephus alignment effort (see build-josephus-align.py for the
# API-automated version). extract() dumps a chapter's unaligned blocks for hand-alignment;
# apply() writes per-§ text back, validating that each block's parts reproduce the original
# Whiston English verbatim (whitespace-normalized) so a bad split can't corrupt the data.

import json, re
from pathlib import Path


def _norm(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def _chapter(work, book, chapter):
    f = Path(f'public/data/josephus/{work}/{book}.json')
    doc = json.loads(f.read_text())
    ch = next(c for c in doc['chapters'] if c['number'] == chapter)
    return f, doc, ch


def _blocks(ch):
    """[(indices, section_numbers, english)] for Whiston-section blocks spanning >1 §."""
    secs = ch['sections']
    out, i = [], 0
    while i < len(secs):
        if not secs[i].get('text'):
            i += 1; continue
        j = i + 1
        while j < len(secs) and not secs[j].get('text'):
            j += 1
        if j - i > 1:
            out.append((list(range(i, j)), [secs[k]['number'] for k in range(i, j)], secs[i]['text']))
        i = j
    return out


def extract(work, book, chapter):
    f, doc, ch = _chapter(work, book, chapter)
    print(f'=== {work} book {book} chapter {chapter}: {ch.get("title","")[:70]} ===')
    for idxs, nums, english in _blocks(ch):
        print(f'\n----- BLOCK §§{nums[0]}-{nums[-1]} ({len(nums)} sections) -----')
        for k in idxs:
            print(f'  §{ch["sections"][k]["number"]} GRC: {ch["sections"][k].get("greek","")}')
        print(f'  ENGLISH (split into {len(nums)} parts): {english}')


def apply(work, book, chapter, mapping):
    """mapping: {section_number: english_part}. Validates per block, then writes."""
    f, doc, ch = _chapter(work, book, chapter)
    num_to_idx = {s['number']: i for i, s in enumerate(ch['sections'])}
    for idxs, nums, english in _blocks(ch):
        if not all(n in mapping for n in nums):
            missing = [n for n in nums if n not in mapping]
            raise SystemExit(f'block §§{nums[0]}-{nums[-1]}: missing parts for {missing}')
        joined = _norm(' '.join(mapping[n] for n in nums))
        if joined != _norm(english):
            raise SystemExit(f'block §§{nums[0]}-{nums[-1]}: parts do not reproduce the English.\n'
                             f'  got : {joined[:200]}\n  want: {_norm(english)[:200]}')
    for n, text in mapping.items():
        ch['sections'][num_to_idx[n]]['text'] = text.strip()
    f.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    print(f'{work} book {book} chapter {chapter}: applied {len(mapping)} section texts')
