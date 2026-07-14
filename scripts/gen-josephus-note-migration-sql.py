# Generates the SQL that migrates existing Josephus note/highlight anchors from the old
# Whiston section numbering to the new Niese § numbering. Reads the mapping produced by
# build-josephus-greek.py (public/data/josephus is built from it; the map is re-derived here
# by re-running the builder's milestone pass is unnecessary — we read /tmp/josephus-niese/
# note-migration.json written by the last build).
#
# Anchor model (unchanged shape): VerseNote/Highlight (book, chapter, verse) where for
# Josephus book = "<short>.<josephus-book>" (Ant/JW/AgAp/Life), chapter = Whiston chapter,
# verse = section. Only verse changes: Whiston section -> its first Niese §. Chapter (the
# Whiston chapter) is preserved, so the anchor key stays within the same (book, chapter).
#
# Against Apion & Life have no milestone bridge, so their notes can't be auto-mapped — the
# script emits a SELECT to list them for manual review instead of touching them.
#
# Usage: python3 scripts/gen-josephus-note-migration-sql.py > scripts/josephus-note-migration.sql

import json, sys
from pathlib import Path

SHORT = {'jewish-war': 'JW', 'antiquities': 'Ant', 'against-apion': 'AgAp', 'life': 'Life'}
mig = json.loads(Path('/tmp/josephus-niese/note-migration.json').read_text())['entries']

rows = []
for e in mig:
    # Chapter 0 = proem sections, which are folded into chapter 1 in the new data and never
    # existed in the old English (so no old note anchors there) — skip them.
    if e['wchapter'] == 0:
        continue
    book = f"{SHORT[e['work']]}.{e['wbook']}"
    rows.append((book, e['wchapter'], e['wsection'], e['niese']))

def esc(s): return s.replace("'", "''")

out = []
out.append('-- Josephus note/highlight migration: Whiston section -> Niese § (verse remap).')
out.append('-- Preserves (book, chapter); only verse (and verseEnd for ranges) changes.')
out.append(f'-- Covers Jewish War + Antiquities ({len(rows)} section anchors). Run inside the')
out.append('-- transaction below. Against Apion & Life are listed separately (manual review).')
out.append('')
out.append('BEGIN;')
out.append('CREATE TEMP TABLE josephus_verse_map (book text, chapter int, old_verse int, new_verse int) ON COMMIT DROP;')
# chunked multi-row INSERTs
CH = 500
for i in range(0, len(rows), CH):
    chunk = rows[i:i + CH]
    vals = ',\n'.join(f"  ('{esc(b)}', {c}, {ov}, {nv})" for (b, c, ov, nv) in chunk)
    out.append('INSERT INTO josephus_verse_map (book, chapter, old_verse, new_verse) VALUES')
    out.append(vals + ';')
out.append('')
out.append('-- How many rows will change (run these SELECTs first if you want a preview):')
out.append('--   SELECT count(*) FROM "VerseNote" n JOIN josephus_verse_map m')
out.append('--     ON n.book=m.book AND n.chapter=m.chapter AND n.verse=m.old_verse;')
out.append('')
out.append('UPDATE "VerseNote" n SET verse = m.new_verse')
out.append('  FROM josephus_verse_map m')
out.append('  WHERE n.book = m.book AND n.chapter = m.chapter AND n.verse = m.old_verse;')
out.append('')
out.append('UPDATE "VerseNote" n SET "verseEnd" = m.new_verse')
out.append('  FROM josephus_verse_map m')
out.append('  WHERE n.book = m.book AND n.chapter = m.chapter AND n."verseEnd" = m.old_verse;')
out.append('')
out.append('UPDATE "Highlight" h SET verse = m.new_verse')
out.append('  FROM josephus_verse_map m')
out.append('  WHERE h.book = m.book AND h.chapter = m.chapter AND h.verse = m.old_verse;')
out.append('')
out.append('COMMIT;')
out.append('')
out.append('-- Against Apion & Life: no auto-mapping. Review these rows manually (if any):')
out.append('--   SELECT * FROM "VerseNote" WHERE book LIKE \'AgAp.%\' OR book LIKE \'Life.%\';')
out.append('--   SELECT * FROM "Highlight" WHERE book LIKE \'AgAp.%\' OR book LIKE \'Life.%\';')

sys.stdout.write('\n'.join(out) + '\n')
sys.stderr.write(f'Generated migration for {len(rows)} Whiston-section anchors (JW+Ant).\n')
