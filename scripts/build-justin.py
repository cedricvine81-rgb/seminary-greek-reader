# Fetches Justin Martyr's works (Dialogue with Trypho, First & Second Apology) in the
# Roberts-Donaldson / ANF public-domain translation from New Advent — whose chapter markup
# is clean ("<h2>Chapter N. …</h2>"), unlike the earlychristianwritings copy used for
# Irenaeus. Writes each into the shared prose chapter -> verse JSON shape
# (public/data/justin/<slug>.json). The ANF English of Justin has no section numbers, so
# citations resolve at the chapter level ("Dial. 32.1" -> chapter 32); each chapter is
# stored as paragraph-sized verses for readable navigation. Adds to the Church Fathers
# category alongside Irenaeus.
#
# Usage:  python3 scripts/build-justin.py   (fetches, caching under /tmp; --no-cache to
#         refetch). Run from the repo root. Prints a validation report.

import html
import json
import re
import ssl
import sys
import time
import urllib.request
from pathlib import Path

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')

BASE = 'https://www.newadvent.org/fathers/'
CACHE = Path('/tmp/justin')
OUT_DIR = Path('public/data/justin')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = 'Text: the Roberts-Donaldson translation of Justin Martyr (Ante-Nicene Fathers, 1885), public domain. Source: newadvent.org. Divided by chapter.'

# slug, display name, noteBook, [page ids], citation-abbrev core (matched after "Justin[ Martyr],").
JUSTIN = [
    ('justin-dialogue', 'Justin Martyr, Dialogue with Trypho', 'JustinDial',
     ['01281', '01282', '01283', '01284', '01285', '01286', '01287', '01288', '01289'], 'Dial.'),
    ('justin-1apology', 'Justin Martyr, First Apology', 'Justin1Apol', ['0126'], '1 Apol.'),
    ('justin-2apology', 'Justin Martyr, Second Apology', 'Justin2Apol', ['0127'], '2 Apol.'),
]

# New Advent sometimes combines chapters in one heading ("Chapters 73, 74. …",
# "Chapters 5 and 6. …", "Chapters 138-139. …"); capture the whole number spec.
HDR = re.compile(r'(?is)<h2>\s*Chapters?\s+([\d,\-–\s]+?(?:and\s+\d+)?)\s*[.:]')


def chapter_nums(spec: str):
    out = []
    for part in re.split(r'\s*(?:,|and)\s*', spec.strip()):
        rng = re.match(r'(\d+)\s*[-–]\s*(\d+)$', part.strip())
        if rng:
            out += list(range(int(rng.group(1)), int(rng.group(2)) + 1))
        elif re.match(r'\d+$', part.strip()):
            out.append(int(part.strip()))
    return out


def fetch(page: str, no_cache: bool) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / f'{page}.html'
    if cached.exists() and not no_cache:
        return cached.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(BASE + f'{page}.htm', headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=45, context=_ctx).read()
    cached.write_bytes(data)
    time.sleep(0.4)
    return data.decode('utf-8', errors='replace')


def parse_into(h: str, chapters: dict):
    h = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h)
    cut = h.find('Translated by')                        # New Advent's translator credit / footer
    if cut != -1:
        h = h[:cut]
    heads = list(HDR.finditer(h))
    for i, m in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(h)
        verses = []
        for p in re.findall(r'(?is)<p\b[^>]*>(.*?)</p>', h[m.end():end]):
            txt = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', p))).strip()
            if len(txt) >= 20:
                verses.append({'number': len(verses) + 1, 'text': txt})
        if verses:
            for n in chapter_nums(m.group(1)):           # a combined heading fills each chapter
                chapters[n] = verses


def build_work(slug, name, note_book, pages, core, no_cache):
    chapters: dict = {}
    for page in pages:
        parse_into(fetch(page, no_cache), chapters)
    # The reader needs chapters 1..N contiguous; New Advent occasionally merges/omits a
    # chapter header (e.g. 1 Apol. has no separate ch 5). Alias any interior gap to the
    # previous chapter's content so navigation stays contiguous (the gaps aren't cited).
    out, last = [], None
    for n in range(1, (max(chapters) if chapters else 0) + 1):
        if n in chapters:
            last = chapters[n]
        if last is not None:
            out.append({'number': n, 'verses': last})
    doc = {'work': name, 'attribution': ATTRIB, 'chapters': out}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    nums = [c['number'] for c in out]
    return {'slug': slug, 'core': core, 'chapters': len(out), 'maxch': nums[-1] if nums else 0,
            'contiguous': nums == list(range(1, len(nums) + 1)), 'doc': doc}


def resolve(text, works):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    for w in works:
        m = re.match(r'Justin(?: Martyr)?, ' + re.escape(w['core']) + r'\s+(\d+)', s)
        if m:
            return (w['slug'], int(m.group(1)))
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])
            if re.match(r'(cf\.\s*)?Justin(?: Martyr)?, (Dial\.|1 Apol\.|2 Apol\.)', c['text'].strip())]
    hit = miss = 0
    misses = []
    for text in cits:
        r = resolve(text, results)
        if not r:
            miss += 1; misses.append(('UNMAPPED', text)); continue
        slug, ch = r
        if any(c['number'] == ch for c in by_slug[slug]['doc']['chapters']):
            hit += 1
        else:
            miss += 1; misses.append((f'{slug} ch {ch} missing', text))
    print(f'\nValidation: {len(cits)} Justin citations | resolved+found={hit} miss={miss} (chapter-level)')
    for why, text in misses:
        print(f'   MISS  {text:34s} -> {why}')


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, name, note_book, pages, core in JUSTIN:
        r = build_work(slug, name, note_book, pages, core, no_cache)
        results.append(r)
        flag = '' if r['contiguous'] else f'  ⚠ gaps (max {r["maxch"]})'
        print(f'{slug:16s} chapters={r["chapters"]:3d}{flag}')
    validate(results)


if __name__ == '__main__':
    main()
