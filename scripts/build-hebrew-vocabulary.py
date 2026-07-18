#!/usr/bin/env python3
"""Build a frequency-ordered Hebrew vocabulary for the Vocab flashcards — the parallel of the
Greek Biblical Greek Vocabulary Builder (src/data/bgvb-vocabulary.json).

Sources (all already in the app / public domain):
- public/data/mt/*.json (OSHB/MorphHB) — count each lemma's occurrences (Hebrew only, lang≠A)
  and take a representative morphology for its part of speech.
- public/data/hebrew-lexicon.json — the pointed dictionary lemma per Strong's number.
- Open Scriptures HebrewLexicon LexicalIndex.xml — a clean one-word gloss per Strong's
  (e.g. "father", "beginning"); falls back to the lexicon's Strong's gloss.

The top 1036 lemmas by frequency are split into 7 sections whose sizes match the Greek exactly
(158/152/158/143/134/138/153), so the two decks line up section-for-section. Output shape mirrors
BgvbWord: { word, inflection, gloss, pos, section, freq, order }.

Usage: python3 scripts/build-hebrew-vocabulary.py
"""
import collections
import json
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MT = REPO / 'public' / 'data' / 'mt'
LEX = REPO / 'public' / 'data' / 'hebrew-lexicon.json'
OUT = REPO / 'src' / 'data' / 'hebrew-vocabulary.json'
LEXICAL_INDEX = 'https://raw.githubusercontent.com/openscriptures/HebrewLexicon/master/LexicalIndex.xml'
NS = '{http://openscriptures.github.com/morphhb/namespace}'

SECTION_SIZES = [158, 152, 158, 143, 134, 138, 153]   # = the Greek section sizes
TOTAL = sum(SECTION_SIZES)                              # 1036

POS_MAP = {'N': 'Noun', 'V': 'Verb', 'A': 'Adj', 'R': 'Prep', 'C': 'Conj',
           'D': 'Adv', 'P': 'Pron', 'T': 'Particle', 'S': 'Particle'}


def pos_label(morph: str) -> str:
    if morph.startswith('Td'):
        return 'Art'
    return POS_MAP.get(morph[:1], 'Particle')


def fetch(url: str) -> str:
    env = {**os.environ, 'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
    return subprocess.run(['curl', '-s', url], capture_output=True, text=True, env=env).stdout


def clean_index_glosses() -> dict[str, str]:
    """strong number -> clean one-word gloss from LexicalIndex (prefer the primary aug='a')."""
    idx = ET.fromstring(fetch(LEXICAL_INDEX))
    out: dict[str, str] = {}
    best_aug: dict[str, str] = {}
    for entry in idx.iter(f'{NS}entry'):
        xref = entry.find(f'{NS}xref')
        d = entry.find(f'{NS}def')
        if xref is None or d is None or not (d.text or '').strip():
            continue
        strong, aug = xref.get('strong'), xref.get('aug')
        if not strong:
            continue
        if strong not in out or aug == 'a' and best_aug.get(strong) != 'a':
            out[strong] = d.text.strip()
            best_aug[strong] = aug or ''
    return out


def main() -> None:
    lex = json.loads(LEX.read_text())
    index_gloss = clean_index_glosses()

    freq: collections.Counter = collections.Counter()
    pos_votes: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    for f in sorted(MT.glob('*.json')):
        chap = json.loads(f.read_text())
        for v in chap['verses']:
            for w in v['words']:
                if w.get('lang') == 'A':          # skip Aramaic — keep the deck purely Hebrew
                    continue
                s = re.sub(r'[^0-9]', '', str(w.get('strongs', '')))
                if not s:
                    continue
                freq[s] += 1
                pos_votes[s][pos_label(w.get('morph', '') or '')] += 1

    ranked = [s for s, _ in freq.most_common() if lex.get(s, {}).get('lemma')][:TOTAL]

    out = []
    cuts = []
    acc = 0
    for n in SECTION_SIZES:
        acc += n
        cuts.append(acc)
    for rank, s in enumerate(ranked, start=1):
        section = next(i + 1 for i, c in enumerate(cuts) if rank <= c)
        entry = lex.get(s, {})
        gloss = index_gloss.get(s) or entry.get('gloss') or ''
        pos = pos_votes[s].most_common(1)[0][0] if pos_votes[s] else 'Particle'
        out.append({
            'word': entry.get('lemma', ''),
            'inflection': None,
            'gloss': gloss,
            'pos': pos,
            'section': section,
            'freq': freq[s],
            'order': rank,
        })

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0))
    # Coverage per section, for the UI's "up to N% of the Hebrew Bible" labels.
    total_tokens = sum(freq.values())
    cum = 0
    cov = {}
    for sec, size in enumerate(SECTION_SIZES, start=1):
        seg = [w for w in out if w['section'] == sec]
        cum += sum(w['freq'] for w in seg)
        cov[sec] = round(cum / total_tokens * 100, 1)
    print(f'Hebrew vocabulary: {len(out)} words -> {OUT.relative_to(REPO)}')
    print('section sizes:', SECTION_SIZES)
    print('cumulative coverage %:', cov)


if __name__ == '__main__':
    main()
