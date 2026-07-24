"""Attach the parallel Greek to the Testaments of the Twelve Patriarchs.

Our English (public/data/pseudepigrapha/testaments/<slug>.json, scripts era: ANF
Roberts-Donaldson) stores each testament chapter as ONE verse — so, as with Justin Martyr,
the parallel unit is the CHAPTER: the whole Greek chapter is attached to that single verse.
The Greek keeps its verse numbers inline ("1. … 2. …") so students can still see the
standard versification (the numbers are skipped by the parsing-pane tokenizer).

Greek source: Greek Wikisource, "Διαθῆκαι των ΙΒ' Πατριαρχών" (the traditional text as
printed in the public-domain editions, with the standard chapter/verse divisions). Its
chapter counts match our ANF English exactly (verified: 7, 9, 19, 26, 7, 10, 7, 9, 8, 8,
20, 12), so chapter N maps to chapter N throughout.

Usage:  python3 scripts/build-testaments-greek.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

API = ('https://el.wikisource.org/w/api.php?action=query&titles='
       '%CE%94%CE%B9%CE%B1%CE%B8%CE%AE%CE%BA%CE%B1%CE%B9%20%CF%84%CF%89%CE%BD%20'
       '%CE%99%CE%92%27%20%CE%A0%CE%B1%CF%84%CF%81%CE%B9%CE%B1%CF%81%CF%87%CF%8E%CE%BD'
       '&prop=revisions&rvprop=content&rvslots=main&format=json')
CACHE = Path('/tmp/ocp-cache/testaments-wiki.json')
DATA = Path('public/data/pseudepigrapha/testaments')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

GREEK_SRC = ('Greek: the traditional text of the Testaments (public-domain editions), '
             'via Greek Wikisource.')

# Wikisource testament heading → our file slug (same order as the text).
SLUGS = {
    'ΡΟΥΒΗΜ': 'reuben', 'ΣΥΜΕΩΝ': 'simeon', 'ΛΕΥΙ': 'levi', 'ΙΟΥΔΑ': 'judah',
    'ΙΣΑΧΑΡ': 'issachar', 'ΖΑΒΟΥΛΩΝ': 'zebulun', 'ΔΑΝ': 'dan', 'ΝΕΦΘΑΛΕΙΜ': 'naphtali',
    'ΓΑΔ': 'gad', 'ΑΣΗΡ': 'asher', 'ΙΩΣΗΦ': 'joseph', 'ΒΕΝΙΑΜΙΝ': 'benjamin',
}

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(no_cache):
    if CACHE.exists() and not no_cache:
        return json.loads(CACHE.read_text(encoding='utf-8'))
    req = urllib.request.Request(API, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_bytes(data)
    return json.loads(data)


def clean(wikitext):
    t = re.sub(r'\{\{[^}]*\}\}', '', wikitext)     # templates
    t = re.sub(r"''+", '', t)                      # bold/italic markup
    t = re.sub(r'\[\[(?:[^]|]*\|)?([^]]*)\]\]', r'\1', t)   # links → label
    return t


def main():
    no_cache = '--no-cache' in sys.argv
    d = fetch(no_cache)
    content = clean(list(d['query']['pages'].values())[0]['revisions'][0]['slots']['main']['*'])

    heads = list(re.finditer(r'==\s*ΔΙΑΘΗΚΗ\s+([Α-ΩΪΫ]+)[^=]*==', content))
    for i, h in enumerate(heads):
        name = h.group(1)
        slug = SLUGS[name]
        seg = content[h.end(): heads[i + 1].start() if i + 1 < len(heads) else len(content)]
        chapters = {}
        for m in re.finditer(r'===\s*ΚΕΦΑΛΑΙΟ\s+(\d+)\s*===\s*(.*?)(?====|\Z)', seg, re.S):
            n = int(m.group(1))
            text = re.sub(r'\s+', ' ', m.group(2)).strip()
            if text:
                chapters[n] = text

        path = DATA / f'{slug}.json'
        doc = json.loads(path.read_text(encoding='utf-8'))
        attached = 0
        for ch in doc['chapters']:
            g = chapters.get(ch['number'])
            if g and ch['verses']:
                ch['verses'][0]['greek'] = g
                attached += 1
        doc['greek'] = True
        if GREEK_SRC not in doc['attribution']:
            doc['attribution'] = doc['attribution'].rstrip() + ' ' + GREEK_SRC
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'{slug:10s} chapters {len(doc["chapters"]):2d}, greek attached {attached:2d}'
              + ('' if attached == len(doc['chapters']) else '  ← INCOMPLETE'))


if __name__ == '__main__':
    main()
