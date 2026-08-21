#!/usr/bin/env python3
"""Strip Wesley Center website boilerplate welded onto the LAST verse of four works.

The Wesley Center Online pages carry a copyright notice, a site menu and an editor's credit
below the text. The build that scraped them kept that furniture and appended it to the final
verse, so the English column ends works like 3 Baruch with "Contact the webmaster ... An
Institute of the Church of the Nazarene" presented as part of verse 17:4.

This is the same class of defect as the Wikisource page furniture in the Testament of Solomon
(scripts/fix-tsolomon-page-chrome.py), but harder to see: the junk is INSIDE a real verse rather
than in verses of its own, so a scan for junk-only verses misses it.

Each cut is anchored on the exact phrase that begins the boilerplate; the real text before it is
kept untouched. Idempotent: guards on _boilerplateStripped, and re-cutting is a no-op anyway.
"""
import json, sys

# work file -> (chapter, verse, phrase the boilerplate starts with)
TARGETS = [
    ('public/data/pseudepigrapha/3baruch.json',            17,  4, 'Edited by Wesley Caspers'),
    ('public/data/pseudepigrapha-b/psalms-of-solomon.json', 18, 12, 'Edited and slightly adapted by George Lyons'),
    ('public/data/pseudepigrapha/jubilees.json',            50, 13, 'Scanned and Edited by Joshua Williams'),
    ('public/data/pseudepigrapha/lae.json',                 51,  3, 'Scanned and Edited by Joshua Williams'),
]

def main():
    changed = 0
    for path, ch, vn, marker in TARGETS:
        with open(path, encoding='utf-8') as f:
            data = json.load(f)

        verse = next((v for c in data['chapters'] if c['number'] == ch
                        for v in c['verses'] if v['number'] == vn), None)
        if verse is None:
            print(f'{path}: {ch}:{vn} not found', file=sys.stderr)
            return 1

        text = verse['text']
        idx = text.find(marker)
        if idx == -1:
            if data.get('_boilerplateStripped'):
                print(f'{path}: already clean')
                continue
            print(f'ABORT: {path} {ch}:{vn} has no marker {marker!r}', file=sys.stderr)
            return 1

        kept = text[:idx].rstrip()
        if not kept:
            print(f'ABORT: {path} {ch}:{vn} would be emptied', file=sys.stderr)
            return 1

        verse['text'] = kept
        data['_boilerplateStripped'] = {'chapter': ch, 'verse': vn,
                                        'charsRemoved': len(text) - len(kept),
                                        'why': 'Wesley Center site notice appended to the last verse'}
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        changed += 1
        print(f'{path.split("/")[-1]:<26} {ch}:{vn}  {len(text)} -> {len(kept)} chars '
              f'(-{len(text)-len(kept)})   now ends: ...{kept[-46:]!r}')
    print(f'\n{changed} file(s) repaired')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
