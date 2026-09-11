#!/usr/bin/env python3
"""Attach Greek to the Apostolic Fathers chapters whose numbering does not match one-to-one.

build-apostolic-fathers-greek.py attaches Greek only when a chapter's section numbering matches
the Greek's exactly. Where Lightfoot's English MERGES two of the Greek's sections into a single
verse, the whole chapter was skipped and the reader got no Greek at all:

    Barnabas   1  (EN 1:7 = GRC 1:7+1:8)         9  (EN 9:2 = GRC 9:2+9:3)
    1 Clement  5, 15, 18, 44, 50

The builder now carries a MERGES table for exactly those chapters; this script applies it to the
shipped corpus without re-deriving every work's Greek, which would pull in unrelated upstream
punctuation changes (~124 sections differ that way).

NOT covered, deliberately: 1 Clement 8, where the English SPLITS one Greek section across three
verses. Re-dividing the Greek is a judgment call, not a table lookup, so that chapter keeps no
Greek column. (Its Spanish is still made from the Greek — the translation is not bound by how
the corpus attaches it.)

Dry run by default; --write applies. Idempotent.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'public/data/apostolic-fathers'

spec = importlib.util.spec_from_file_location('afg', ROOT / 'scripts/build-apostolic-fathers-greek.py')
afg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(afg)


def main():
    write = '--write' in sys.argv
    slugs = sorted({slug for slug, _ in afg.MERGES})
    filled_total = 0

    for slug in slugs:
        path = DATA / f'{slug}.json'
        grc = afg.parse_sections(afg.fetch(afg.WORKS[slug]['rel'], False),
                                 afg.WORKS[slug].get('epistle'),
                                 afg.WORKS[slug].get('fold_praef', False))
        doc = json.loads(path.read_text(encoding='utf-8'))
        filled = []
        for chap in doc['chapters']:
            ch = str(chap['number'])
            merge = afg.MERGES.get((slug, ch))
            if not merge:
                continue
            gsec = {k[1]: v for k, v in grc.items() if k[0] == ch}
            plan = afg.merge_plan(gsec, chap['verses'], merge)
            assert plan is not None, f'{slug} {ch}: merge plan does not consume the chapter exactly'
            for v in chap['verses']:
                g = ' '.join(gsec[n] for n in plan[str(v['number'])])
                if v.get('greek') != g:
                    filled.append((ch, v['number'], '+'.join(plan[str(v['number'])])))
                    if write:
                        v['greek'] = g
        if filled:
            filled_total += len(filled)
            print(f'{slug}: {len(filled)} section(s)')
            for ch, vn, src in filled:
                print(f'    {ch}:{vn}  <- Greek {src}')
            if write:
                path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    if not filled_total:
        print('Every merged chapter already carries its Greek — nothing to do.')
    elif write:
        print(f'\nWROTE — {filled_total} sections given their Greek.')
    else:
        print(f'\nDRY RUN — {filled_total} sections would be filled. Re-run with --write.')


if __name__ == '__main__':
    main()
