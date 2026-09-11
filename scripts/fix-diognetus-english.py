#!/usr/bin/env python3
"""Repair the English of the Epistle to Diognetus.

Lightfoot's source page mis-numbers seven markers: after 7:2 it prints "2:3 … 2:9" for
what is plainly 7:3–7:9. Read literally — as build-apostolic-fathers.py did — those
markers overwrite the REAL Diognetus 2:3–2:9, so seven sections of Lightfoot vanished
from the app, and chapter 7 stopped dead at 7:2 with its second half filed under
chapter 2. Both columns of chapter 2 and chapter 7 have been wrong ever since.

build-apostolic-fathers.py now refuses a backward marker of that shape, so a full
rebuild is already correct. This script applies the same repair to the shipped corpus
WITHOUT a full rebuild, because diognetus.json has since been collapsed to chapter
level and had Greek attached, and a plain rebuild would throw the Greek away.

Dry run by default; --write applies. Idempotent.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'public/data/apostolic-fathers/diognetus.json'

spec = importlib.util.spec_from_file_location('afb', ROOT / 'scripts/build-apostolic-fathers.py')
afb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(afb)


def main():
    write = '--write' in sys.argv
    by_ch = afb.parse(afb.fetch('diognetus', no_cache=False))

    doc = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = []
    for ch in doc['chapters']:
        secs = by_ch.get(ch['number'])
        if not secs:
            print(f'  ch {ch["number"]}: no sections parsed — skipped')
            continue
        english = ' '.join(secs[v] for v in sorted(secs))
        verse = ch['verses'][0]
        if verse['text'] != english:
            changed.append((ch['number'], len(verse['text']), len(english)))
            if write:
                verse['text'] = english

    if not changed:
        print('Diognetus English already correct — nothing to do.')
        return

    print(f'{"ch":>4} {"before":>8} {"after":>8}  {"delta":>7}')
    for n, a, b in changed:
        print(f'{n:>4} {a:>8} {b:>8}  {b-a:>+7}')
    if write:
        TARGET.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        print(f'\nWROTE {TARGET.relative_to(ROOT)} — {len(changed)} chapters repaired.')
    else:
        print(f'\nDRY RUN — {len(changed)} chapters would change. Re-run with --write.')


if __name__ == '__main__':
    main()
