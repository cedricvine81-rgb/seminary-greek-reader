"""Add the parallel Greek original to the Justin Martyr works we already carry in English.

Our Justin is the Roberts-Donaldson English (Ante-Nicene Fathers, via New Advent), stored
chapter -> verse but CHAPTER-oriented: most chapters are a single verse (the whole chapter);
a few are split into paragraph-verses. The Greek (First1KGreek / Perseus, CC BY-SA 4.0) is
also chapter-oriented — the Apologies divide only to chapter, the Dialogue to chapter->section.
Our English is versified on New Advent's paragraphs, which do NOT correspond to the Greek's
Marcovich sections, so there is no safe per-verse mapping.

The parallel unit is therefore the CHAPTER. Greek for a whole chapter is attached only where
our chapter is a single verse (verse == chapter), giving a clean chapter-to-chapter parallel;
chapters our English split into several paragraph-verses are left English-only, since the Greek
cannot be safely divided to match. Coverage is reported per work.

Usage:  python3 scripts/build-justin-greek.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0645/'
CACHE = Path('/tmp/first1k-justin')
DATA = Path('public/data/justin')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
GREEK_SRC = ('Greek: First Thousand Years of Greek / Perseus Digital Library, '
             'CC BY-SA 4.0 (opengreekandlatin.org).')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()

WORKS = {
    'justin-1apology': 'tlg001/tlg0645.tlg001.1st1K-grc1.xml',
    'justin-2apology': 'tlg002/tlg0645.tlg002.perseus-grc2.xml',
    'justin-dialogue': 'tlg003/tlg0645.tlg003.perseus-grc2.xml',
}


def fetch(rel, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / rel.replace('/', '_')
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(RAW + rel, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
    cached.write_bytes(data)
    time.sleep(0.3)
    return data


def parse_chapters(xml_bytes):
    """Return {chapter_n: full_greek_text}. The whole chapter div is flattened, so it works
    whether the chapter divides to section or not."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, chapter):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, chapter)
                continue
            if div.get('subtype') == 'chapter':
                # Flatten the whole chapter (drop its heading), sections and all.
                for head in div.findall('t:head', NS):
                    head.clear()
                out[div.get('n')] = re.sub(r'\s+', ' ', ''.join(div.itertext())).strip()
            else:
                walk(div, chapter)

    walk(root.find('.//t:body', NS), None)
    return out


def apply_greek(slug, greek):
    path = DATA / f'{slug}.json'
    doc = json.loads(path.read_text(encoding='utf-8'))

    matched = total = single = 0
    for chap in doc['chapters']:
        total += 1
        g = greek.get(str(chap['number']))
        # Only a single-verse chapter is a clean whole-chapter parallel. Multi-verse chapters
        # are our English paragraph-split, which the Greek can't be divided to match.
        if len(chap['verses']) == 1:
            single += 1
            if g:
                chap['verses'][0]['greek'] = g
                matched += 1

    if total == 0 or matched == 0:
        return {'slug': slug, 'greek': False, 'matched': matched, 'total': total, 'single': single}

    doc['greek'] = True
    if GREEK_SRC not in doc['attribution']:
        doc['attribution'] = doc['attribution'].rstrip() + ' ' + GREEK_SRC
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return {'slug': slug, 'greek': True, 'matched': matched, 'total': total, 'single': single}


def main():
    no_cache = '--no-cache' in sys.argv
    got = []
    print(f'{"work":18} {"chapters w/Greek":>16}  (of single-verse / total)')
    for slug, rel in WORKS.items():
        r = apply_greek(slug, parse_chapters(fetch(rel, no_cache)))
        pct = f'{100 * r["matched"] // r["total"]}%' if r['total'] else '—'
        print(f'{slug:18} {r["matched"]:>6}/{r["total"]:<6} {pct:>5}  '
              f'(single-verse chapters: {r["single"]}/{r["total"]})'
              f'{"" if r["greek"] else "  [English-only]"}')
        if r['greek']:
            got.append(slug)
    print(f'\nWorks now carrying Greek ({len(got)}):')
    print('  ' + ', '.join(f"'{s}'" for s in got))
    print('\nAdd these slugs to JUSTIN_GREEK in src/lib/prose-texts.ts.')


if __name__ == '__main__':
    main()
