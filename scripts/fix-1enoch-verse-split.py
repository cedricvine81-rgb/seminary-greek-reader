#!/usr/bin/env python3
"""Repair 1 Enoch: un-bundle verses and lift the parallel-column readings out of the text.

The Wikisource build flattened Charles's PARALLEL COLUMNS (Ethiopic | Greek/Latin) into single
verse strings, keeping the wiki table syntax (`{| class="wikitable"`, `||`, `|}`). Where a column
carried its own verse numbers, those verses ended up with no record of their own — 30 of them,
including 1 En 90:20/37/38, which could not be cited or searched at all.

This script:
  * splits the bundled verses into their proper records (ch 90: 15 -> 42, ch 106: 16 -> 19),
  * puts the second-column reading in a `variant` field instead of inline in `text`,
  * strips every wiki-table token from `text`,
  * leaves the reader untouched: `variant` is extra data the prose reader simply ignores.

Idempotent: re-running on a repaired file is a no-op.
"""
import json, re, sys

SRC = 'public/data/pseudepigrapha/1enoch.json'
TABLE = re.compile(r'\{\|[^|]*?\|-[^|]*?\|\s*|\{\|\s*class="wikitable"[^|]*\|-\s*\|\s*|\|\}')

def clean(s):
    s = TABLE.sub(' ', s)
    s = s.replace('{| class="wikitable"', ' ').replace('|-', ' ').replace('|}', ' ')
    s = re.sub(r'!\s*!?!?\s*Greek', ' ', s).replace('! Ethiopic', ' ')
    s = re.sub(r'\s*\|\s*', ' ', s)
    return re.sub(r'\s{2,}', ' ', s).strip()

def split_numbered(s, expect):
    """Split 'text 16. text 19. text' into [(None,head),(16,..),(19,..)] for the given numbers."""
    if not expect: return [(None, s)]
    pat = '|'.join(rf'(?<![\d.]){n}\.\s' for n in expect)
    parts, last, out = list(re.finditer(pat, s)), 0, []
    out.append((None, s[:parts[0].start()])) if parts else out.append((None, s))
    for i, m in enumerate(parts):
        end = parts[i+1].start() if i+1 < len(parts) else len(s)
        num = int(m.group(0).strip().rstrip('.'))
        out.append((num, s[m.end():end]))
    return out

def main():
    doc = json.load(open(SRC))
    if doc.get('_verseSplitRepaired'):
        print('already repaired — nothing to do'); return 0
    by = {c['number']: c for c in doc['chapters']}
    report = []

    # ---- ch 90: records 13 and 15 carry vv. 16-42 --------------------------------
    c = by[90]; rec = {v['number']: v['text'] for v in c['verses']}
    r13, r15 = rec[13], rec[15]
    eth13, rest13 = r13.split('||', 1)
    col13, tail13 = rest13.split('|}', 1)          # col13 -> v.16 ; tail13 -> v.19
    eth15, rest15 = r15.split('||', 1)
    col15, tail15 = rest15.split('|}', 1)          # col15 -> vv.17-18 ; tail15 -> vv.20-42
    v = {n: clean(rec[n]) for n in range(1, 13)}
    v[13] = clean(eth13); v[14] = clean(rec[14]); v[15] = clean(eth15)
    for n, t in split_numbered(col13, [16])[1:]: v[n] = clean(t)
    for n, t in split_numbered(col15, [17, 18])[1:]: v[n] = clean(t)
    for n, t in split_numbered(tail13, [19])[1:]: v[n] = clean(t)
    for n, t in split_numbered(tail15, list(range(20, 43)))[1:]: v[n] = clean(t)
    c['verses'] = [{'number': n, 'text': v[n]} for n in sorted(v)]
    report.append(('90', 15, len(c['verses'])))

    # ---- ch 106: v.17 is stranded in record 14; record 16 holds 18-19 + a Latin column ----
    c = by[106]; rec = {x['number']: x['text'] for x in c['verses']}
    v = {n: clean(rec[n]) for n in rec}
    head14, v17 = split_numbered(rec[14], [17])
    v[14] = clean(head14[1]); v[17] = clean(v17[1])
    eth16, latin = rec[16].split('||', 1)
    parts16 = split_numbered(eth16, [18, 19])
    v[16] = clean(parts16[0][1])
    for n, t in parts16[1:]: v[n] = clean(t)
    c['verses'] = [{'number': n, 'text': v[n]} for n in sorted(v)]
    for x in c['verses']:
        if x['number'] == 19: x['variant'] = clean(latin)   # the Latin recension
    report.append(('106', 16, len(c['verses'])))

    # ---- ch 22, 27, 32, 89: records all present; lift the second column out of `text` ----
    for n in (22, 27, 32, 89):
        c = by[n]; moved = 0
        for x in c['verses']:
            if '||' in x['text']:
                eth, col = x['text'].split('||', 1)
                x['text'], var = clean(eth), clean(col)
                if var: x['variant'] = var; moved += 1
            else:
                x['text'] = clean(x['text'])
        report.append((str(n), len(c['verses']), len(c['verses'])))

    doc['_verseSplitRepaired'] = True
    json.dump(doc, open(SRC, 'w'), ensure_ascii=False, indent=1)
    print(f"{'ch':>5} {'before':>7} {'after':>6}")
    for a, b, cc in report: print(f"{a:>5} {b:>7} {cc:>6}")
    print(f"\ntotal verses: {sum(len(x['verses']) for x in doc['chapters'])}")
    return 0

sys.exit(main())
