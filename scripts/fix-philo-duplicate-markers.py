#!/usr/bin/env python3
"""Repair Philo sections that a LEAKED FOOTNOTE NUMBER overwrote.

Found while translating On the Special Laws. Yonge's pages carry the Cohn-Wendland
section numbers as "(5)", and they also carry footnote reference numbers in exactly
the same shape -- e.g. the heading line

    THOU SHALT NOT BEAR FALSE Witness (5) {#ex 20:16.} VIII. (41) ...

where that "(5)" is footnote 5, not section 5. build-philo.py's MARKER_RE matches both,
and build_work stores sections with

    by_book.setdefault(book, {})[section] = text     # last marker wins

so the LATER (footnote) occurrence silently overwrote the real section, usually with the
empty string, because the brace-stripped footnote is immediately followed by the next
real marker.

The FIRST occurrence of a section marker on a page is the real one -- footnote numbers
restart low and so always collide from behind. This script re-parses every page through
build-philo.py's own page_to_text/MARKER_RE (so the two cannot drift, the same guard the
line-wrap fix uses) and restores the first occurrence wherever the corpus disagrees.

A corpus-wide scan found the damage bounded to three sections, all in Special Laws IV
(4.5, 4.23, 4.24), all left empty. This script audits every page anyway and reports what
it finds, so the claim is measured rather than assumed.

Idempotent: reports "already clean" on a second run. Writes the corpus's canonical
COMPACT json, because build-philo.py re-normalises anything else.

Usage:  python3 scripts/fix-philo-duplicate-markers.py [--audit-only]
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'public' / 'data' / 'philo'


def load_builder():
    spec = importlib.util.spec_from_file_location('build_philo', Path(__file__).parent / 'build-philo.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def first_occurrences(bp, raw, page_book):
    """{(book, section): text} taking the FIRST marker for each section, plus the set of
    (book, section) keys that had more than one marker on the page."""
    t = bp.page_to_text(raw)
    markers = list(bp.MARKER_RE.finditer(t))
    seen, dupes = {}, set()
    for i, m in enumerate(markers):
        end = markers[i + 1].start() if i + 1 < len(markers) else len(t)
        text = t[m.start() + len(m.group(0)):end]
        text = bp.TRAIL_JUNK_RE.sub('', text)
        text = ' '.join(text.split())
        if m.group(2):
            key = (int(m.group(1)), int(m.group(2)))
        else:
            key = (page_book, int(m.group(1)))
        if key[0] is None:
            continue
        if key in seen:
            dupes.add(key)
            continue                      # keep the first
        seen[key] = text
    return seen, dupes


def main() -> int:
    audit_only = '--audit-only' in sys.argv
    bp = load_builder()
    total_dupes = total_fixed = 0
    for slug, name, note_book, multi, pages in bp.PHILO:
        path = DATA / f'{slug}.json'
        if not path.exists():
            continue
        doc = json.loads(path.read_text(encoding='utf-8'))
        by_book = {c['number']: {v['number']: v for v in c['verses']} for c in doc['chapters']}
        fixed = []
        for page_book, page in pages:
            good, dupes = first_occurrences(bp, bp.fetch(page, False), page_book)
            total_dupes += len(dupes)
            for (book, section) in sorted(dupes):
                verse = by_book.get(book, {}).get(section)
                if verse is None or verse['text'] == good[(book, section)]:
                    continue
                verse['text'] = good[(book, section)]
                fixed.append(f'{book}.{section}')
        if fixed:
            total_fixed += len(fixed)
            print(f'{slug}: restored {len(fixed)} section(s): {", ".join(fixed)}')
            if not audit_only:
                path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    print(f'duplicate markers seen: {total_dupes}')
    print(f'{total_fixed} section(s) repaired' if total_fixed else 'already clean')
    return 0


if __name__ == '__main__':
    sys.exit(main())
