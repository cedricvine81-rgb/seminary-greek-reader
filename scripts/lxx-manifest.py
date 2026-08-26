#!/usr/bin/env python3
"""Emit a structural manifest of an LXX corpus directory — the input to lxx-diff.py.

Why: the Rahlfs/CATSS-derived LXX in public/data/lxx is CC BY-NC-SA (see docs/provenance.md)
and has to be replaced with a public-domain text. Everything downstream of that swap — the
English pairing, user notes, user highlights, the derived indexes — keys off *verse ids* and,
for highlights, off the exact Greek string. This script captures both so the swap can be
costed before it happens rather than discovered afterwards.

Emits, per book/chapter:
  - the ordered verse ids
  - a sha1 of each verse's CANONICAL GREEK STRING

The canonical string is `' '.join(w['surface'] for w in verse['words'])` — that is precisely
what Highlight.startOffset/endOffset index into (see the comment on the Highlight model in
prisma/schema.prisma). If a verse's sha matches between two corpora, every highlight on that
verse survives the swap untouched. If it doesn't, the offsets are meaningless.

Input shape (the shape public/data/lxx already uses; normalize any candidate text to it first):
  { "book": "Jonah", "chapter": 1,
    "verses": [ { "id": "Jonah.1.1", "verse": 1, "words": [ { "surface": "καὶ", ... } ] } ] }

Usage:
  python3 scripts/lxx-manifest.py --dir public/data/lxx --out /tmp/lxx-current.json
  python3 scripts/lxx-manifest.py --dir /path/to/candidate --out /tmp/lxx-candidate.json
"""
import argparse
import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

FILENAME = re.compile(r'^(?P<book>.+)_(?P<chapter>\d+)\.json$')


def canonical_greek(verse):
    """The exact string Highlight offsets index into. Falls back to 'text' if words are absent."""
    words = verse.get('words')
    if words:
        return ' '.join(w.get('surface', '') for w in words)
    return (verse.get('text') or '').strip()


def build(corpus_dir):
    books = defaultdict(dict)
    skipped = []

    for path in sorted(corpus_dir.iterdir()):
        m = FILENAME.match(path.name)
        if not m:
            if path.is_file():
                skipped.append(path.name)
            continue

        book, chapter = m.group('book'), int(m.group('chapter'))
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as e:
            print(f'  ! {path.name}: {e}', file=sys.stderr)
            skipped.append(path.name)
            continue

        verses = {}
        for v in data.get('verses', []):
            vid = v.get('id')
            if not vid:
                continue
            greek = canonical_greek(v)
            verses[vid] = {
                'n': v.get('verse'),
                'words': len(v.get('words') or []),
                'chars': len(greek),
                'sha': hashlib.sha1(greek.encode('utf-8')).hexdigest()[:12],
            }
        books[book][str(chapter)] = verses

    return books, skipped


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dir', required=True, help='corpus directory of <Book>_<Ch>.json files')
    ap.add_argument('--out', required=True, help='manifest output path')
    ap.add_argument('--label', default=None, help='human label recorded in the manifest')
    args = ap.parse_args()

    corpus_dir = Path(args.dir)
    if not corpus_dir.is_dir():
        sys.exit(f'not a directory: {corpus_dir}')

    books, skipped = build(corpus_dir)

    n_ch = sum(len(chs) for chs in books.values())
    n_v = sum(len(vs) for chs in books.values() for vs in chs.values())
    n_w = sum(v['words'] for chs in books.values() for vs in chs.values() for v in vs.values())

    manifest = {
        'label': args.label or str(corpus_dir),
        'source_dir': str(corpus_dir),
        'books': dict(books),
        'totals': {'books': len(books), 'chapters': n_ch, 'verses': n_v, 'words': n_w},
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(manifest, ensure_ascii=False), encoding='utf-8')

    print(f'{manifest["label"]}')
    print(f'  books {len(books)}  chapters {n_ch}  verses {n_v}  words {n_w}')
    if skipped:
        print(f'  skipped {len(skipped)} non-chapter file(s): {", ".join(skipped[:6])}'
              + (' …' if len(skipped) > 6 else ''))
    print(f'  -> {out}')


if __name__ == '__main__':
    main()
