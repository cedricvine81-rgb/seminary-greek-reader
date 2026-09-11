#!/usr/bin/env python3
"""Give Barnabas 1 and 9 their Greek.

build-apostolic-fathers-greek.py attaches Greek only when a chapter's section numbering
matches the Greek's exactly. In Barnabas 1 and 9 it does not: Lightfoot's English merges two
of the Greek's sections into a single verse each time —

    EN Barn. 1:7  =  GRC 1:7 + 1:8   ("...But I, not as though I were a teacher...")
    EN Barn. 9:2  =  GRC 9:2 + 9:3   ("...And again He saith; Hear, O heaven...")

so both chapters were skipped wholesale and 15 sections have been showing no Greek at all.
The builder now carries a MERGES table for exactly these two chapters; this script applies it
to the shipped corpus without re-deriving every other work's Greek, which would pull in
unrelated upstream punctuation changes.

Dry run by default; --write applies. Idempotent.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'public/data/apostolic-fathers/barnabas.json'

spec = importlib.util.spec_from_file_location('afg', ROOT / 'scripts/build-apostolic-fathers-greek.py')
afg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(afg)


def main():
    write = '--write' in sys.argv
    grc = afg.parse_sections(afg.fetch(afg.WORKS['barnabas']['rel'], False))
    doc = json.loads(TARGET.read_text(encoding='utf-8'))

    filled = []
    for chap in doc['chapters']:
        ch = str(chap['number'])
        merge = afg.MERGES.get(('barnabas', ch))
        if not merge:
            continue
        gsec = {k[1]: v for k, v in grc.items() if k[0] == ch}
        plan = afg.merge_plan(gsec, chap['verses'], merge)
        assert plan is not None, f'merge plan for Barnabas {ch} does not consume the chapter exactly'
        for v in chap['verses']:
            g = ' '.join(gsec[n] for n in plan[str(v['number'])])
            if v.get('greek') != g:
                filled.append((ch, v['number'], len(g), '+'.join(plan[str(v['number'])])))
                if write:
                    v['greek'] = g

    if not filled:
        print('Barnabas 1 and 9 already carry their Greek — nothing to do.')
        return
    print(f'{"ref":>6} {"chars":>6}  from Greek section(s)')
    for ch, vn, n, src in filled:
        print(f'{ch+":"+str(vn):>6} {n:>6}  {src}')
    if write:
        TARGET.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        print(f'\nWROTE — {len(filled)} sections given their Greek.')
    else:
        print(f'\nDRY RUN — {len(filled)} sections would be filled. Re-run with --write.')


if __name__ == '__main__':
    main()
