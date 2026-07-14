# The per-book Whiston text we built Jewish War & Antiquities from (Project Gutenberg) omitted
# the prefaces/proems, so each book opens with a run of Greek-only §§ and the English column
# looks empty. Perseus's Whiston edition (perseus-eng2) DOES include the prefaces, keyed by
# Niese §. This fills each book's leading Greek-only run (the proem, folded into chapter 1)
# with Perseus's Whiston English at its range-start §§ — touching ONLY empty §§, so hand-aligned
# sections are never overwritten. Run from the repo root; needs network (Perseus TEI).

import json, importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location('b', 'scripts/build-josephus-greek.py')
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)

WORK_URN = {'jewish-war': 'tlg004', 'antiquities': 'tlg001', 'against-apion': 'tlg003', 'life': 'tlg002'}

for work, urn in WORK_URN.items():
    eng_at = {(bk, n): t for (bk, n, t) in b.perseus_english_ranges(urn)}
    filled = 0
    for f in sorted(Path(f'public/data/josephus/{work}').glob('*.json'), key=lambda p: int(p.stem) if p.stem.isdigit() else 0):
        if f.name == 'index.json':
            continue
        d = json.loads(f.read_text()); book = d['number']; changed = False
        secs = d['chapters'][0]['sections']            # proem lives at the front of chapter 1
        i = 0
        while i < len(secs) and not secs[i].get('text'):   # leading Greek-only run = the proem
            n = secs[i]['number']
            if (book, n) in eng_at and eng_at[(book, n)].strip():
                secs[i]['text'] = eng_at[(book, n)].strip(); changed = True; filled += 1
            i += 1
        if changed:
            f.write_text(json.dumps(d, ensure_ascii=False), encoding='utf-8')
    print(f'{work:14s} proem English blocks filled: {filled}')
