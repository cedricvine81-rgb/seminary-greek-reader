# Fetches Ante-Nicene Fathers texts (Roberts-Donaldson translation, public domain) from
# earlychristianwritings.com and parses them into the shared prose chapter -> verse JSON
# shape (public/data/anf/<slug>.json), the same shape the rest of the embedded prose corpus
# uses (see src/lib/prose-texts.ts).
#
# The ANF Irenaeus is divided by BOOK → CHAPTER → numbered SECTION (paragraphs open "1.",
# "2." …), so "Irenaeus, Haer. 3.11.8" resolves to book 3, chapter 11, section 8 — chapter =
# chapter, verse = section. One work per book (the prose model is chapter → verse). Currently
# covers Irenaeus, Against Heresies (Books 1-5); Justin & the other apologists await a cleaner
# public-domain source (this site's Justin chapter markup is inconsistent).
#
# Usage:  python3 scripts/build-anf.py   (fetches, caching under /tmp; --no-cache to refetch).
#         Run from the repo root. Prints a validation report.

import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE = 'http://www.earlychristianwritings.com/text/'
CACHE = Path('/tmp/anf')
OUT_DIR = Path('public/data/anf')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = 'Text: the Roberts-Donaldson translation of Irenaeus (Ante-Nicene Fathers, 1885), public domain. Source: earlychristianwritings.com. Chapter → numbered section (verse).'

# slug, display name, noteBook, page, Irenaeus book number, citation abbrev prefix.
ANF = [
    ('irenaeus-1', 'Irenaeus, Against Heresies (Book 1)', 'IrenHaer1', 'irenaeus-book1', 1, 'Irenaeus, Haer. 1'),
    ('irenaeus-2', 'Irenaeus, Against Heresies (Book 2)', 'IrenHaer2', 'irenaeus-book2', 2, 'Irenaeus, Haer. 2'),
    ('irenaeus-3', 'Irenaeus, Against Heresies (Book 3)', 'IrenHaer3', 'irenaeus-book3', 3, 'Irenaeus, Haer. 3'),
    ('irenaeus-4', 'Irenaeus, Against Heresies (Book 4)', 'IrenHaer4', 'irenaeus-book4', 4, 'Irenaeus, Haer. 4'),
    ('irenaeus-5', 'Irenaeus, Against Heresies (Book 5)', 'IrenHaer5', 'irenaeus-book5', 5, 'Irenaeus, Haer. 5'),
]

HDR = re.compile(r'(?:CHAPTER|Chapter)\s+([IVXLCDM]+)\s*\.?\s*-{1,2}\s*')
ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}


def roman_to_int(s: str) -> int:
    total = prev = 0
    for ch in reversed(s):
        v = ROMAN[ch]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total


def fetch(page: str, no_cache: bool) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / f'{page}.html'
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(BASE + f'{page}.html', headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=45).read()
    cached.write_bytes(data)
    time.sleep(0.4)
    return data


def parse(raw: bytes):
    h = raw.decode('latin-1')
    h = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h)
    for sentinel in ('<hr width="50%"', 'Tables of Contents</a>', 'Go to the'):
        idx = h.find(sentinel)
        if idx != -1:
            h = h[:idx]
            break
    h = re.sub(r'(?i)</?p\b[^>]*>', '\x00', h)          # paragraph boundary (unique sentinel)
    h = re.sub(r'(?i)<br\b[^>]*>', ' ', h)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', h))
    t = t.replace('\n', ' ').replace('\r', ' ')          # source line-wraps → space, not breaks
    heads = list(HDR.finditer(t))
    chapters = []
    for i, m in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(t)
        paras = [p for p in (re.sub(r'\s+', ' ', p).strip() for p in t[m.end():end].split('\x00')) if p]
        verses = []
        for para in paras[1:]:                            # paras[0] is the chapter title/argument
            sec = re.match(r'(\d{1,3})\.?\s+(.+)', para)  # "8. It is…" or "1 Now…" → section
            if sec and int(sec.group(1)) < 100:
                verses.append({'number': int(sec.group(1)), 'text': sec.group(2)})
            elif not verses and len(para) >= 40:          # a first section printed without its number
                verses.append({'number': 1, 'text': para})
            elif verses and len(para) >= 20:              # continuation of the current section
                verses[-1]['text'] += ' ' + para
        if verses:
            chapters.append({'number': roman_to_int(m.group(1)), 'verses': verses})
    return chapters


def build_work(slug, name, note_book, page, book, abbrev, no_cache):
    chapters = parse(fetch(page, no_cache))
    doc = {'work': name, 'attribution': ATTRIB, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    nums = [c['number'] for c in chapters]
    return {'slug': slug, 'book': book, 'abbrev': abbrev, 'chapters': len(chapters),
            'contiguous': nums == list(range(1, len(nums) + 1)), 'doc': doc}


def resolve(text, works):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    for w in works:
        m = re.match(re.escape(w['abbrev']) + r'\.(\d+)(?:\.(\d+))?', s)   # book.chapter[.section]
        if m:
            return (w['slug'], int(m.group(1)), int(m.group(2)) if m.group(2) else None)
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])
            if re.sub(r'^cf\.\s*', '', c['text'].strip()).startswith('Irenaeus, Haer.')]
    hit = miss = 0
    misses = []
    for text in cits:
        r = resolve(text, results)
        if not r:
            miss += 1; misses.append(('UNMAPPED', text)); continue
        slug, ch, sec = r
        doc = by_slug[slug]['doc']
        chap = next((c for c in doc['chapters'] if c['number'] == ch), None)
        if chap and (sec is None or any(v['number'] == sec for v in chap['verses'])):
            hit += 1
        else:
            miss += 1; misses.append((f'{slug} {ch}:{sec} missing', text))
    print(f'\nValidation: {len(cits)} Irenaeus citations | resolved+found={hit} miss={miss} '
          '(chapter → section)')
    for why, text in misses:
        print(f'   MISS  {text:34s} -> {why}')


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, name, note_book, page, book, abbrev in ANF:
        r = build_work(slug, name, note_book, page, book, abbrev, no_cache)
        results.append(r)
        flag = '' if r['contiguous'] else '  ⚠ NON-CONTIGUOUS'
        print(f'{slug:14s} chapters={r["chapters"]:3d}{flag}')
    validate(results)


if __name__ == '__main__':
    main()
