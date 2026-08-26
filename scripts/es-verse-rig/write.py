#!/usr/bin/env python3
"""Merge per-VERSE Spanish batches into per-chapter files and verify.

Generic verse-level writer for Greco-Roman works whose chapters hold several verses
(Plato: chapter = Stephanus page, verse = section a-e). Batches are JSON files named
<prefix>-b*.json shaped {"<chapter>": {"<verse>": "text", ...}, ...}.

Usage: cd <your batch dir> && python3 <repo>/scripts/es-verse-rig/write.py \\
           <corpus-slug> <batch-prefix> "<source-note>" "<chapter-note>"
(Batches are read from $ES_BATCH_DIR, defaulting to the current directory.)
e.g.:  python3 es-verse-write.py plato-apology apo "Traducción propia..." "La numeración..."

Verifies: every corpus chapter AND verse has a translation, no extras, none empty; prints
the es/greek length ratio per chapter so a truncated batch shows up as a low ratio.
"""
import json, sys, os, glob

ROOT = '/Users/cvine/dev/seminary-greek-reader'
# Batches live wherever you are working, NOT next to this script.
SCRATCH = os.environ.get('ES_BATCH_DIR', os.getcwd())

slug, prefix, _source, _note = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
OUT = os.path.join(ROOT, f'public/data/es/greco/{slug}')

corpus = json.load(open(os.path.join(ROOT, f'public/data/greco/{slug}.json')))
chapters = {str(c['number']): {str(v['number']): v.get('greek') or '' for v in c['verses']}
            for c in corpus['chapters']}

es = {}
for path in sorted(glob.glob(os.path.join(SCRATCH, f'{prefix}-b*.json'))):
    batch = json.load(open(path))
    for ch, verses in batch.items():
        if not isinstance(verses, dict):
            sys.exit(f'BAD SHAPE in {path}: chapter {ch} is not a verse map')
        dest = es.setdefault(ch, {})
        for vk, text in verses.items():
            if vk in dest:
                sys.exit(f'DUPLICATE {ch}:{vk} (second copy in {path})')
            dest[vk] = text.strip()

missing_ch = sorted(set(chapters) - set(es), key=lambda x: int(x))
extra_ch = sorted(set(es) - set(chapters), key=lambda x: int(x))
if missing_ch: sys.exit(f'MISSING chapters: {missing_ch}')
if extra_ch: sys.exit(f'EXTRA chapters: {extra_ch}')
problems = []
for ch in chapters:
    missing_v = sorted(set(chapters[ch]) - set(es[ch]), key=lambda x: int(x))
    extra_v = sorted(set(es[ch]) - set(chapters[ch]), key=lambda x: int(x))
    empty = [v for v, t in es[ch].items() if not t]
    if missing_v: problems.append(f'ch {ch}: MISSING verses {missing_v}')
    if extra_v: problems.append(f'ch {ch}: EXTRA verses {extra_v}')
    if empty: problems.append(f'ch {ch}: EMPTY verses {empty}')
if problems: sys.exit('\n'.join(problems))

os.makedirs(OUT, exist_ok=True)
ratios = []
for ch in sorted(es, key=int):
    doc = {'_source': _source, '_note': _note, 'verses': es[ch]}
    with open(os.path.join(OUT, f'{ch}.json'), 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False)
    grc = sum(len(g) for g in chapters[ch].values())
    ratios.append((int(ch), sum(len(t) for t in es[ch].values()) / max(1, grc)))

ratios.sort()
nverses = sum(len(v) for v in es.values())
print(f'wrote {len(es)} chapters / {nverses} verses -> {OUT}')
lows = [(k, round(r, 2)) for k, r in ratios if r < 0.7]
highs = [(k, round(r, 2)) for k, r in ratios if r > 2.2]
print('es/greek ratio  min %.2f  max %.2f  mean %.2f' % (
    min(r for _, r in ratios), max(r for _, r in ratios),
    sum(r for _, r in ratios) / len(ratios)))
if lows: print('LOW ratios (check for truncation):', lows)
if highs: print('HIGH ratios (check for padding):', highs)
