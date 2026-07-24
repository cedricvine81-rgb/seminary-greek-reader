"""Add the parallel Greek to the three Apostolic Fathers still carried English-only:
the Martyrdom of Polycarp, the Didache, and the Epistle to Diognetus.

Our English is Lightfoot–Harmer (scripts/build-apostolic-fathers.py), chapter → verse. How the
Greek attaches depends on whether that versification matches the Greek's sections:

  · Martyrdom of Polycarp (First1KGreek tlg1484, CC BY-SA) — our verse numbers ARE the Greek
    section numbers, so the Greek attaches per verse (section-level, like 1 Clement etc.).
  · The Didache (First1KGreek tlg1311) — our English is versified far more finely than the
    Greek's six-or-so sections per chapter, so no per-verse mapping exists. Each chapter becomes
    a single parallel row: the whole English chapter beside the whole Greek chapter (section
    numbers kept inline), the model used for Eusebius and the Testaments.
  · Epistle to Diognetus (Greek Wikisource; not in First1KGreek) — same chapter-level model.

These works have no saved notes (verified), so collapsing the Didache/Diognetus English to one
row per chapter strands nothing.

Usage:  python3 scripts/build-af-remaining-greek.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/'
WIKI = ('https://el.wikisource.org/w/api.php?action=query&titles='
        '%CE%95%CF%80%CE%B9%CF%83%CF%84%CE%BF%CE%BB%CE%AE%20%CF%80%CF%81%CE%BF%CF%82%20'
        '%CE%94%CE%B9%CF%8C%CE%B3%CE%BD%CE%B7%CF%84%CE%BF%CE%BD'
        '&prop=revisions&rvprop=content&rvslots=main&format=json')
CACHE = Path('/tmp/af-remaining')
DATA = Path('public/data/apostolic-fathers')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

SRC_F1K = ('Greek: First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0 '
           '(opengreekandlatin.org).')
SRC_WIKI = 'Greek: the text of the Epistle to Diognetus via Greek Wikisource (public domain).'

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(url, name, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / name
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
    cached.write_bytes(data)
    return data


def tei_sections(xml_bytes):
    """{chapter:int -> {section:int -> text}} from a First1KGreek chapter→section edition."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    ed = ET.fromstring(xml).find('.//t:body', NS).find('t:div', NS)
    out = {}
    for c in ed.findall('t:div', NS):
        if c.get('subtype') != 'chapter' or not (c.get('n') or '').isdigit():
            continue
        secs = {}
        for s in c.findall('t:div', NS):
            if s.get('subtype') == 'section' and (s.get('n') or '').isdigit():
                t = re.sub(r'\s+', ' ', ''.join(s.itertext())).strip()
                if t:
                    secs[int(s.get('n'))] = t
        if secs:
            out[int(c.get('n'))] = secs
    return out


def inline_greek(secs):
    """Join a chapter's sections into one string, section 1 unnumbered (the verse marker covers
    it) and 2+ prefixed with their number — matches the Eusebius/Testaments inline style."""
    order = sorted(secs)
    lead1 = order and order[0] == 1
    return ' '.join((secs[s] if (i == 0 and lead1) else f'{s} {secs[s]}')
                    for i, s in enumerate(order))


# ── Martyrdom of Polycarp — section-level ───────────────────────────────────────────────
def build_martyrdom(no_cache):
    grc = tei_sections(fetch(RAW + 'tlg1484/tlg001/tlg1484.tlg001.1st1K-grc1.xml',
                             'mart.xml', no_cache))
    path = DATA / 'mart-polycarp.json'
    doc = json.loads(path.read_text(encoding='utf-8'))
    attached = total = 0
    for ch in doc['chapters']:
        secs = grc.get(ch['number'], {})
        for v in ch['verses']:
            total += 1
            if v['number'] in secs:
                v['greek'] = secs[v['number']]
                attached += 1
    doc['greek'] = True
    doc['attribution'] = doc['attribution'].rstrip() + ' ' + SRC_F1K
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    print(f'mart-polycarp   section-level: {attached}/{total} verses got Greek')


# ── The Didache — chapter-level (collapse English, whole Greek chapter) ──────────────────
def build_didache(no_cache):
    grc = tei_sections(fetch(RAW + 'tlg1311/tlg001/tlg1311.tlg001.1st1K-grc1.xml',
                             'didache.xml', no_cache))
    collapse_chapter_level(DATA / 'didache.json', grc, SRC_F1K, 'didache')


# ── Epistle to Diognetus — chapter-level (Greek Wikisource) ──────────────────────────────
def diognetus_greek(no_cache):
    raw = json.loads(fetch(WIKI, 'diognetus.json', no_cache))
    content = list(raw['query']['pages'].values())[0]['revisions'][0]['slots']['main']['*']
    content = re.sub(r'\{\{Τίτλος[^}]*\}\}', '', content)
    content = re.sub(r'\[\[[^]]*\]\]', '', content)
    out = {}
    # Chapters are "{{c|<Roman>}}"; sections inside are "N." — keep them inline.
    parts = re.split(r'\{\{c\|([IVXL]+)\}\}', content)
    roman = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9,
             'X': 10, 'XI': 11, 'XII': 12}
    for i in range(1, len(parts), 2):
        ch = roman.get(parts[i])
        if ch:
            body = re.sub(r'\s+', ' ', re.sub(r"''+", '', parts[i + 1])).strip()
            out[ch] = {1: body}     # already carries inline "N." section numbers
    # The Wikisource text opens chapter 1 "Ἐπιστολὴ ὁρῶ" (nonsensical — "Epistle I see"); every
    # critical edition reads "Ἐπειδὴ ὁρῶ" ("Since I see", matching the English). Restore it.
    if 1 in out:
        out[1][1] = re.sub(r'^Ἐπιστολὴ\b', 'Ἐπειδὴ', out[1][1])
    return out


def build_diognetus(no_cache):
    collapse_chapter_level(DATA / 'diognetus.json', diognetus_greek(no_cache), SRC_WIKI, 'diognetus')


def collapse_chapter_level(path, grc, src, label):
    doc = json.loads(path.read_text(encoding='utf-8'))
    attached = 0
    for ch in doc['chapters']:
        english = ' '.join(v['text'] for v in ch['verses'])
        secs = grc.get(ch['number'])
        greek = inline_greek(secs) if secs else None
        verse = {'number': 1, 'text': english}
        if greek:
            verse['greek'] = greek
            attached += 1
        ch['verses'] = [verse]
    doc['greek'] = True
    doc['attribution'] = doc['attribution'].rstrip() + ' ' + src
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    print(f'{label:14} chapter-level: {attached}/{len(doc["chapters"])} chapters got Greek')


def main():
    no_cache = '--no-cache' in sys.argv
    build_martyrdom(no_cache)
    build_didache(no_cache)
    build_diognetus(no_cache)


if __name__ == '__main__':
    main()
