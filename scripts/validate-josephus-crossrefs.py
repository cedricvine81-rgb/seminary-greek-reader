# Validates the staged Niese Josephus (/tmp/josephus-niese) against the Backgrounds
# cross-reference dataset. Two checks per Josephus citation that carries a Niese "§N":
#   1. RESOLVES: book N and section §N exist in the built data (so the cross-ref will land).
#   2. AGREES:  our Whiston->Niese milestone map sends the citation's Whiston book.chapter.
#      section to the SAME §N that Evans printed independently — an external check that the
#      milestone alignment is correct.
# Usage: python3 scripts/validate-josephus-crossrefs.py

import json, re
from pathlib import Path

STAGE = Path('/tmp/josephus-niese')
WORK_DIR = {'Ant.': 'antiquities', 'J.W.': 'jewish-war', 'Ag. Ap.': 'against-apion', 'Life': 'life'}

def load_sections(work):
    secs = {}
    for f in (STAGE / work).glob('*.json'):
        d = json.loads(f.read_text())
        secs[d['number']] = {v['number'] for v in d['verses']}
    return secs

built = {w: load_sections(w) for w in set(WORK_DIR.values())}
mig = {(e['work'], e['wbook'], e['wchapter'], e['wsection']): e['niese']
       for e in json.loads((STAGE / 'note-migration.json').read_text())['entries']}

data = json.loads(Path('public/data/backgrounds-crossrefs.json').read_text())
def strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from strings(v)
    elif isinstance(o, list):
        for v in o: yield from strings(v)
cites = sorted(set(s for s in strings(data['entries']) if re.search(r'§', s) and re.search(r'Ant\.|J\.W\.|Ag\. Ap\.|\bLife\b', s)))

# Patterns: <work> <book>.<ch>.<sec>? ... §<niese>[–..]
pat = re.compile(r'(Ant\.|J\.W\.|Ag\. Ap\.|Life)\s+(\d+)(?:\.(\d+))?(?:\.(\d+))?\s*§+\s*(\d+)')
resolve_ok = resolve_bad = agree_ok = agree_bad = agree_na = 0
bad_resolve, bad_agree = [], []
for s in cites:
    m = pat.search(s)
    if not m:
        continue
    tok, book, wch, wsec, niese = m.group(1), int(m.group(2)), m.group(3), m.group(4), int(m.group(5))
    work = WORK_DIR[tok]
    # Life: single book -> book 1
    bk = 1 if tok == 'Life' else book
    # 1. resolves?
    if niese in built[work].get(bk, set()):
        resolve_ok += 1
    else:
        resolve_bad += 1; bad_resolve.append((s, f'{work} bk{bk} §{niese}'))
    # 2. agrees? (only for milestone works with full book.ch.sec)
    if work in ('jewish-war', 'antiquities') and wch and wsec:
        mapped = mig.get((work, book, int(wch), int(wsec)))
        if mapped is None:
            agree_na += 1
        elif mapped == niese:
            agree_ok += 1
        else:
            agree_bad += 1; bad_agree.append((s, f'Whiston {book}.{wch}.{wsec}->§{mapped}, Evans §{niese}'))

print(f'Josephus citations with §: {len(cites)}')
print(f'\n1) RESOLVE (book+§ exists in built data):  ok={resolve_ok}  miss={resolve_bad}')
for s, why in bad_resolve[:12]: print(f'     MISS  {s[:60]:60s} -> {why}')
print(f'\n2) AGREE (our milestone map == Evans §), JW/Ant with full ref:')
print(f'     agree={agree_ok}  disagree={agree_bad}  no-map={agree_na}')
for s, why in bad_agree[:12]: print(f'     DIFF  {s[:55]:55s} -> {why}')
