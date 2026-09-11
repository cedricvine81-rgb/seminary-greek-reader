#!/usr/bin/env python3
"""Re-derive the Apostolic Fathers' ENGLISH with the builder's current clean-up pass.

build-apostolic-fathers.py gains clean-up rules as source artifacts are found (a ®LA1¯
typesetting code, a stray "~y", double-escaped "&amp;gt;"). A full rebuild would apply them
but would also throw away the Greek that build-apostolic-fathers-greek.py attached afterwards,
and the chapter-level collapse applied to the Didache and Diognetus. This script re-parses each
page and rewrites ONLY the English, leaving `greek`, `lang` and the chapter shape alone.

Handles both corpus shapes: section-level (one verse per Greek section) and chapter-level
(one collapsed verse per chapter, as the Didache and Diognetus are stored).

Dry run by default; --write applies. Idempotent.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'public/data/apostolic-fathers'

spec = importlib.util.spec_from_file_location('afb', ROOT / 'scripts/build-apostolic-fathers.py')
afb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(afb)


def main():
    write = '--write' in sys.argv
    changed_total = 0
    for slug, name, note_book, page, abbrevs in afb.AF:
        path = DATA / f'{slug}.json'
        if not path.exists():
            continue
        by_ch = afb.parse(afb.fetch(page, no_cache=False))
        doc = json.loads(path.read_text(encoding='utf-8'))
        changed = []
        for chap in doc['chapters']:
            secs = by_ch.get(chap['number'])
            if not secs:
                continue
            if len(chap['verses']) == 1 and len(secs) > 1:
                # chapter-level: the whole chapter is one collapsed English row
                fresh = {1: ' '.join(secs[v] for v in sorted(secs))}
            else:
                fresh = secs
            for v in chap['verses']:
                new = fresh.get(v['number'])
                if new is not None and new != v['text']:
                    changed.append((chap['number'], v['number'], v['text'], new))
                    if write:
                        v['text'] = new
        if changed:
            changed_total += len(changed)
            print(f'{slug}: {len(changed)} verse(s)')
            for ch, vn, before, after in changed[:4]:
                print(f'    {ch}:{vn}  -{len(before)} +{len(after)} chars')
            if write:
                path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    if not changed_total:
        print('All Apostolic Fathers English already matches the builder — nothing to do.')
    elif write:
        print(f'\nWROTE — {changed_total} verse(s) repaired.')
    else:
        print(f'\nDRY RUN — {changed_total} verse(s) would change. Re-run with --write.')


if __name__ == '__main__':
    main()
