#!/usr/bin/env python3
"""Cost a candidate LXX text against what the app already depends on.

Answers the four questions that decide whether a replacement text is cheap or expensive:

  1. ENGLISH  — does every verse id the English is keyed to still exist?
                public/data/brenton/<Book>.json is { "Jonah.1.1": "Now the word..." }, keyed by
                verse id and holding no reference to any Greek token. So the English survives a
                text swap for free EXCEPT where a verse id disappears. Those verses orphan.
                This is the constraint that decides Brenton-vs-Swete, so it is reported first.

  2. NOTES    — VerseNote anchors on (book, chapter, verse). Survives wherever the id survives.

  3. HIGHLIGHTS — Highlight stores character offsets into the verse's canonical Greek string.
                Survives only where that string is byte-identical. Anywhere else the offsets are
                meaningless and the highlight must be migrated or dropped.

  4. INVENTORY — books and chapters gained or lost.

Usage:
  python3 scripts/lxx-manifest.py --dir public/data/lxx      --out /tmp/ref.json  --label current
  python3 scripts/lxx-manifest.py --dir /path/to/candidate   --out /tmp/cand.json --label brenton
  python3 scripts/lxx-diff.py --ref /tmp/ref.json --candidate /tmp/cand.json [--json out.json]

Self-test (should report a clean diff):
  python3 scripts/lxx-diff.py --ref /tmp/ref.json --candidate /tmp/ref.json
"""
import argparse
import json
import sys
from pathlib import Path

ENGLISH_DIR = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'brenton'


def verse_ids(manifest):
    out = {}
    for book, chapters in manifest['books'].items():
        for ch, verses in chapters.items():
            for vid, meta in verses.items():
                out[vid] = (book, ch, meta['sha'])
    return out


def english_ids():
    """Every verse id the shipped English is keyed to, by book."""
    if not ENGLISH_DIR.is_dir():
        return None
    ids = {}
    for path in sorted(ENGLISH_DIR.glob('*.json')):
        book = path.stem
        try:
            ids[book] = set(json.loads(path.read_text(encoding='utf-8')).keys())
        except json.JSONDecodeError:
            continue
    return ids


def section(title):
    print()
    print(title)
    print('─' * len(title))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ref', required=True, help='manifest of the corpus in production')
    ap.add_argument('--candidate', required=True, help='manifest of the replacement text')
    ap.add_argument('--json', default=None, help='write the machine-readable impact report here')
    ap.add_argument('--list', type=int, default=12, help='how many examples to print per finding')
    args = ap.parse_args()

    ref = json.loads(Path(args.ref).read_text(encoding='utf-8'))
    cand = json.loads(Path(args.candidate).read_text(encoding='utf-8'))

    print(f'reference  {ref["label"]:<28} {ref["totals"]}')
    print(f'candidate  {cand["label"]:<28} {cand["totals"]}')

    r_ids, c_ids = verse_ids(ref), verse_ids(cand)
    lost = sorted(set(r_ids) - set(c_ids))
    gained = sorted(set(c_ids) - set(r_ids))
    shared = set(r_ids) & set(c_ids)
    changed = sorted(v for v in shared if r_ids[v][2] != c_ids[v][2])

    # ── 1. English ───────────────────────────────────────────────────────────
    section('1. ENGLISH — verses whose translation would orphan')
    eng = english_ids()
    already, new_orphans = [], []
    if eng is None:
        print('  ! public/data/brenton not found — skipped')
    else:
        all_eng = {vid for ids in eng.values() for vid in ids}
        orphans = sorted(all_eng - set(c_ids))
        already = sorted(all_eng - set(r_ids))
        new_orphans = sorted(set(orphans) - set(already))
        print(f'  English verse ids           {len(all_eng)}')
        print(f'  already unpaired today      {len(already)}')
        print(f'  NEWLY orphaned by the swap  {len(new_orphans)}')
        if new_orphans:
            by_book = {}
            for vid in new_orphans:
                by_book.setdefault(vid.split('.')[0], []).append(vid)
            for book, vids in sorted(by_book.items(), key=lambda kv: -len(kv[1])):
                print(f'    {book:<10} {len(vids):>6}   e.g. {", ".join(vids[:3])}')
        else:
            print('  ✓ every English verse still has a Greek verse')

    # ── 2. Notes ─────────────────────────────────────────────────────────────
    section('2. NOTES — VerseNote anchors that would break')
    print(f'  verse ids lost              {len(lost)}')
    if lost:
        for vid in lost[:args.list]:
            print(f'    - {vid}')
        if len(lost) > args.list:
            print(f'    … {len(lost) - args.list} more')
    else:
        print('  ✓ no verse ids disappear; every note anchor survives')

    # ── 3. Highlights ────────────────────────────────────────────────────────
    section('3. HIGHLIGHTS — verses whose Greek string changes')
    pct = (100.0 * len(changed) / len(shared)) if shared else 0.0
    print(f'  shared verses               {len(shared)}')
    print(f'  Greek text identical        {len(shared) - len(changed)}')
    print(f'  Greek text CHANGED          {len(changed)}  ({pct:.1f}%)')
    print('  → highlights on changed verses have meaningless offsets; migrate or drop.')
    print('  → run the SQL in docs/provenance.md first: if the row count is tiny, drop and notify.')
    if changed:
        for vid in changed[:args.list]:
            print(f'    ~ {vid}')
        if len(changed) > args.list:
            print(f'    … {len(changed) - args.list} more')

    # ── 4. Inventory ─────────────────────────────────────────────────────────
    section('4. INVENTORY — books and chapters')
    r_books, c_books = set(ref['books']), set(cand['books'])
    for label, s in (('books only in reference', r_books - c_books),
                     ('books only in candidate', c_books - r_books)):
        print(f'  {label:<26} {len(s)}' + (f'   {", ".join(sorted(s))}' if s else ''))
    for book in sorted(r_books & c_books):
        r_ch, c_ch = set(ref['books'][book]), set(cand['books'][book])
        if r_ch != c_ch:
            print(f'    {book}: ref-only ch {sorted(r_ch - c_ch)}  cand-only ch {sorted(c_ch - r_ch)}')
    if gained:
        print(f'  verse ids gained            {len(gained)}   e.g. {", ".join(gained[:3])}')

    # ── verdict ──────────────────────────────────────────────────────────────
    section('VERDICT')
    blocking = len(new_orphans) or len(lost)
    if not blocking and not changed:
        print('  ✓ identical structure and text — nothing downstream moves.')
    elif not blocking:
        print('  ✓ no verse id moves: English, notes and the derived indexes key cleanly.')
        print(f'  → only {len(changed)} verse(s) change Greek text; highlights are the sole migration.')
    else:
        print('  ✗ verse ids move. English pairing and note anchors are affected —')
        print('    resolve the versification before costing anything else.')

    if args.json:
        report = {
            'reference': ref['label'], 'candidate': cand['label'],
            'verses_lost': lost, 'verses_gained': gained, 'greek_changed': changed,
            'english_newly_orphaned': new_orphans,
            'english_already_unpaired': already,
            'books_lost': sorted(r_books - c_books), 'books_gained': sorted(c_books - r_books),
        }
        Path(args.json).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'\n  report -> {args.json}')

    return 1 if blocking else 0


if __name__ == '__main__':
    sys.exit(main())
