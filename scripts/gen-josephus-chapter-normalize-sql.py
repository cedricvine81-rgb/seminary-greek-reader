# Generates the SQL that aligns existing Josephus note/highlight anchors with the new
# pure-Niese navigation (Book → §, no chapter column).
#
# Background: VerseNote/Highlight anchor Josephus as (book, chapter, verse) where
#   book    = "<short>.<josephus-book>"  (Ant/JW/AgAp/Life, e.g. "Ant.1")
#   chapter = the Whiston chapter
#   verse   = the Niese section §
# The § is unique within a book, so chapter is now redundant. The reader resolves a picked §
# back to its home chapter using the SAME per-book JSON this script reads — so this migration
# guarantees every stored note's chapter matches that map. For notes already stored with the
# correct Whiston chapter (the common case) it is a no-op (the `chapter <> new` guard skips
# them); it only rewrites stragglers whose chapter drifted or was never migrated (e.g. the
# Against Apion / Life notes the earlier § remap left for manual review). It never touches
# `book` or `verse`, so a note can never move to a different passage — only its now-internal
# chapter breadcrumb is corrected.
#
# Usage: python3 scripts/gen-josephus-chapter-normalize-sql.py > scripts/josephus-chapter-normalize.sql

import json, os, sys
from pathlib import Path

SHORT = {'jewish-war': 'JW', 'antiquities': 'Ant', 'against-apion': 'AgAp', 'life': 'Life'}
BASE = Path('public/data/josephus')

# One row per (book, chapter): the contiguous § range [lo, hi] that lives in that chapter.
ranges = []  # (book_str, chapter, lo, hi)
for work in sorted(os.listdir(BASE)):
    wdir = BASE / work
    if not wdir.is_dir():
        continue
    for f in sorted(wdir.glob('*.json')):
        if f.name == 'index.json':
            continue
        d = json.loads(f.read_text())
        book_str = f"{SHORT[work]}.{d['number']}"
        for c in d.get('chapters', []):
            secs = [s['number'] for s in c.get('sections', [])]
            if not secs:
                continue
            ranges.append((book_str, c['number'], min(secs), max(secs)))

def esc(s): return s.replace("'", "''")

out = []
out.append('-- Josephus note/highlight chapter normalization for pure-Niese navigation.')
out.append('-- Aligns each anchor\'s (now-internal) chapter with its § home chapter, derived from')
out.append(f'-- the current per-book JSON ({len(ranges)} chapter ranges). Never changes book/verse;')
out.append('-- a no-op for already-aligned notes. Run inside the transaction below.')
out.append('')
out.append('BEGIN;')
out.append('CREATE TEMP TABLE josephus_section_chapter (book text, chapter int, sec_lo int, sec_hi int) ON COMMIT DROP;')
CH = 500
for i in range(0, len(ranges), CH):
    chunk = ranges[i:i + CH]
    vals = ',\n'.join(f"  ('{esc(b)}', {c}, {lo}, {hi})" for (b, c, lo, hi) in chunk)
    out.append('INSERT INTO josephus_section_chapter (book, chapter, sec_lo, sec_hi) VALUES')
    out.append(vals + ';')
out.append('')
out.append('-- Preview: how many notes/highlights are misaligned (run these first if you like):')
out.append('--   SELECT n.id, n.book, n.chapter AS stored_ch, m.chapter AS correct_ch, n.verse')
out.append('--     FROM "VerseNote" n JOIN josephus_section_chapter m')
out.append('--       ON n.book = m.book AND n.verse BETWEEN m.sec_lo AND m.sec_hi')
out.append('--     WHERE n.chapter IS DISTINCT FROM m.chapter;')
out.append('')
out.append('UPDATE "VerseNote" n SET chapter = m.chapter')
out.append('  FROM josephus_section_chapter m')
out.append('  WHERE n.book = m.book AND n.verse BETWEEN m.sec_lo AND m.sec_hi')
out.append('    AND n.chapter IS DISTINCT FROM m.chapter;')
out.append('')
out.append('UPDATE "Highlight" h SET chapter = m.chapter')
out.append('  FROM josephus_section_chapter m')
out.append('  WHERE h.book = m.book AND h.verse BETWEEN m.sec_lo AND m.sec_hi')
out.append('    AND h.chapter IS DISTINCT FROM m.chapter;')
out.append('')
out.append('COMMIT;')

sys.stdout.write('\n'.join(out) + '\n')
sys.stderr.write(f'Generated chapter-normalize migration from {len(ranges)} chapter ranges.\n')
