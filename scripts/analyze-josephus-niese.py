# ANALYSIS ONLY (writes nothing to public/). Validates whether the Perseus Greek's embedded
# Whiston_chapter/Whiston_section milestones line up with the existing embedded Whiston English
# (public/data/josephus/<work>/<book>.json). That alignment is the precondition for a safe
# Niese renumber: it's what lets us (a) attach English to each Niese section and (b) migrate
# existing notes from Whiston (book.chapter.section) anchors to Niese (book.section).
#
# Usage: python3 scripts/analyze-josephus-niese.py [work]   (work = jewish-war | antiquities | ...)

import json, re, ssl, sys, urllib.request
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0526/'
WORK_URN = {'jewish-war': 'tlg004', 'antiquities': 'tlg001', 'against-apion': 'tlg003', 'life': 'tlg002'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
try:
    CTX = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    CTX = ssl._create_unverified_context()

def fetch(urn):
    cache = Path(f'/tmp/josephus-{urn}-grc.xml')
    if cache.exists():
        return cache.read_bytes()
    req = urllib.request.Request(f'{RAW}{urn}/tlg0526.{urn}.perseus-grc2.xml', headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=90, context=CTX).read()
    cache.write_bytes(data)
    return data

def parse_greek(urn):
    """Walk the Greek in document order. Return {(book, niese_sec): (wchapter, wsection)}.
    wchapter/wsection track the most recent Whiston milestone seen."""
    xml = fetch(urn).decode('utf-8', 'replace')
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml)
    body = xml[xml.find('<body'):]
    out = {}
    book = wch = wsec = None
    # Stream tokens in order: book divs, section divs, and Whiston milestones.
    tok = re.compile(r'<div[^>]*subtype="book"[^>]*\bn="([^"]*)"|'
                     r'<div[^>]*subtype="section"[^>]*\bn="([^"]*)"|'
                     r'<milestone[^>]*\bn="([^"]*)"[^>]*unit="Whiston_chapter"|'
                     r'<milestone[^>]*\bn="([^"]*)"[^>]*unit="Whiston_section"')
    for m in tok.finditer(body):
        bk, sec, mc, ms = m.groups()
        if bk is not None:
            book, wch, wsec = bk, None, None
        elif mc is not None:
            wch = mc; wsec = None
        elif ms is not None:
            wsec = ms
        elif sec is not None:
            out[(book, sec)] = (wch, wsec)
    return out

def load_english(work):
    """{(book:int, chapter:int, section:int)} keys present in the embedded Whiston English."""
    keys = set()
    d = Path(f'public/data/josephus/{work}')
    for f in sorted(d.glob('*.json')):
        if f.name == 'index.json':
            continue
        b = json.loads(f.read_text())
        bn = b['number']
        for ch in b['chapters']:
            for s in ch['sections']:
                keys.add((bn, ch['number'], s['number']))
    return keys

def norm_ch(wch):
    # Whiston chapter milestone is "pr." for the proem, else a number.
    if wch is None: return None
    if wch.strip('.').lower() in ('pr', 'proem', 'preface'): return 0
    return int(wch) if wch.isdigit() else None

def main():
    work = sys.argv[1] if len(sys.argv) > 1 else 'jewish-war'
    urn = WORK_URN[work]
    greek = parse_greek(urn)
    eng = load_english(work)

    # Build Greek-side Whiston keys (book, wch, wsec) and the Niese sections under each.
    from collections import defaultdict
    gkeys = defaultdict(list)         # (book,wch,wsec) -> [niese_sec,...]
    no_milestone = []
    for (bk, sec), (wch, wsec) in greek.items():
        c, s = norm_ch(wch), (int(wsec) if wsec and wsec.isdigit() else None)
        if c is None or s is None:
            no_milestone.append((bk, sec)); continue
        gkeys[(int(bk), c, s)].append(int(sec))

    gset = set(gkeys)
    print(f'\n=== {work} ({urn}) ===')
    print(f'Greek Niese sections total: {len(greek)}')
    print(f'  sections with no clean Whiston milestone: {len(no_milestone)}  e.g. {no_milestone[:5]}')
    print(f'Distinct Whiston (book,chapter,section) in GREEK milestones: {len(gset)}')
    print(f'Distinct Whiston (book,chapter,section) in ENGLISH json:     {len(eng)}')

    inboth = gset & eng
    g_only = gset - eng
    e_only = eng - gset
    print(f'  in BOTH:        {len(inboth)}')
    print(f'  GREEK only:     {len(g_only)}   (Niese sections that would get NO English)')
    print(f'  ENGLISH only:   {len(e_only)}   (English sections no Greek maps to)')
    # proem breakdown
    proem = [k for k in g_only if k[1] == 0]
    print(f'    of GREEK-only, proem (chapter 0): {len(proem)}')
    print(f'  sample GREEK-only (non-proem):  {[k for k in sorted(g_only) if k[1]!=0][:8]}')
    print(f'  sample ENGLISH-only:            {sorted(e_only)[:8]}')

    # English coverage of Niese sections (the real question for parallel display)
    covered = sum(len(v) for k, v in gkeys.items() if k in eng)
    print(f'Niese sections that map to an English section: {covered}/{len(greek)} '
          f'({100*covered//max(len(greek),1)}%)')

if __name__ == '__main__':
    main()
