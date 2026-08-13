#!/usr/bin/env python3
"""Give the Backgrounds cross-reference apparatus OT anchors.

The apparatus (public/data/backgrounds-crossrefs.json) was built NT-first: 3,052 entries
anchored on NT verses. This script derives OT-anchored entries from data already in the
repo — no scraping:

  1. REVERSED NT CITATIONS. Every NT entry that cites an OT verse (citation types OT/LXX,
     1,800+ of them) is flipped: reading Gen 5:1 now surfaces "cited at Matt 1:1", opening
     the NT verse in the right pane exactly as OT refs already open from NT anchors.
     Multiple NT citers of one OT verse merge into a single entry.

  2. TARGUM ROWS. The six embedded targums (Pseudo-Jonathan Pentateuch, Targum Isaiah) are
     verse-aligned translations of MT books, so every chapter of those books gets a row
     whose citation ("Tg. Ps.-J. Gen 1") matchProseCitation resolves to the embedded work —
     one click from the Hebrew text to its Aramaic interpretive tradition. One row per
     chapter, not per verse: a per-verse row would repeat the same fact 5,800 times.

Generated entries carry `"gen": "ot-anchors"` so re-runs replace them idempotently and the
hand-curated apparatus is never touched.

Usage:  python3 scripts/add-ot-backgrounds-crossrefs.py
"""
import json
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / 'public' / 'data' / 'backgrounds-crossrefs.json'
BOOKS = REPO / 'public' / 'data' / 'books.json'

NT = {'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil',
      'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet',
      '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'}

# osisId → (citation abbreviation, chapter count) for the embedded targums.
TARGUMS = {
    'Gen':  ('Tg. Ps.-J. Gen', 50, 'Targum Pseudo-Jonathan'),
    'Exod': ('Tg. Ps.-J. Exod', 40, 'Targum Pseudo-Jonathan'),
    'Lev':  ('Tg. Ps.-J. Lev', 27, 'Targum Pseudo-Jonathan'),
    'Num':  ('Tg. Ps.-J. Num', 36, 'Targum Pseudo-Jonathan'),
    'Deut': ('Tg. Ps.-J. Deut', 34, 'Targum Pseudo-Jonathan'),
    'Isa':  ('Tg. Isa.', 66, 'Targum Jonathan (Isaiah)'),
}


def main():
    d = json.loads(DATA.read_text(encoding='utf-8'))
    entries = [e for e in d['entries'] if e.get('gen') != 'ot-anchors']

    # ── 1. Reverse the NT→OT citations ────────────────────────────────────────
    by_ot_verse = defaultdict(list)   # (book, ch, v) → NT citer citations
    for e in entries:
        if e['book'] not in NT:
            continue
        for c in e['citations']:
            if c.get('type') not in ('OT', 'LXX') or not c.get('ref'):
                continue
            r = c['ref']
            if not all(k in r for k in ('book', 'chapter', 'verse')):
                continue
            key = (r['book'], r['chapter'], r['verse'])
            cite = {
                'text': e['label'],
                'type': 'NT',
                'ref': {'book': e['book'], 'chapter': e['chapter'], 'verse': e['verseStart']},
            }
            # The forward citation's note explains the connection — carry it back.
            if c.get('note'):
                cite['note'] = c['note']
            if all(x['text'] != cite['text'] for x in by_ot_verse[key]):
                by_ot_verse[key].append(cite)

    generated = []
    for (book, ch, v), cites in sorted(by_ot_verse.items()):
        generated.append({
            'book': book, 'chapter': ch, 'endChapter': ch,
            'verseStart': v, 'verseEnd': v,
            'label': f'{book} {ch}:{v}',
            'citations': sorted(cites, key=lambda c: c['text']),
            'gen': 'ot-anchors',
        })

    # ── 2. Targum rows, one per chapter ───────────────────────────────────────
    for osis, (abbrev, chapters, name) in TARGUMS.items():
        for ch in range(1, chapters + 1):
            generated.append({
                'book': osis, 'chapter': ch, 'endChapter': ch,
                'verseStart': 1, 'verseEnd': 199,
                'label': f'{osis} {ch}',
                'citations': [{
                    # The registry's citation parsers need chapter:verse — :1 opens the
                    # chapter from its head.
                    'text': f'{abbrev} {ch}:1',
                    'type': 'Rabbinic',
                    'note': f'{name} — the Aramaic interpretive rendering of this chapter, read in the synagogue tradition.',
                }],
                'gen': 'ot-anchors',
            })

    d['entries'] = entries + generated
    DATA.write_text(json.dumps(d, ensure_ascii=False), encoding='utf-8')
    nt_rev = len(by_ot_verse)
    print(f'kept {len(entries)} curated entries')
    print(f'generated {nt_rev} reversed-NT anchors + {len(generated) - nt_rev} targum chapter rows')
    print(f'total {len(d["entries"])} entries, {DATA.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
