"""Build the Shepherd of Hermas (English + parallel Greek) for the Texts library.

English: J. B. Lightfoot's translation from earlychristianwritings.com/text/shepherd-lightfoot
.html (public domain). Its paragraphs are marked "c[k]:v" — c = the chapter within the current
Vision/Mandate/Similitude, k = the continuous chapter (the Whittaker/Joly 1-114 numbering
modern editions cite), v = the verse. Vision 1 is marked plain "c:v" (there c == k).

Greek: First Thousand Years of Greek (github.com/OpenGreekAndLatin/First1KGreek, CC BY-SA 4.0),
tlg1419.tlg001 — TEI divided book (the 27 traditional units: Visions 1-5, Mandates 1-12,
Similitudes 1-10) → chapter → section, which flattens exactly onto the continuous numbering.

MARKER HEALING. The ECW transcription typos a few continuous-chapter brackets (e.g. Vision
3.6 opens "5[13]:1" again instead of "6[14]:1"). No text is missing — the paragraph count per
unit matches the Greek's section count — so a verse number that fails to advance within a
chapter starts the NEXT continuous chapter. The healed structure is then checked against the
Greek layout: same 114 chapters, and (where they agree) the same verse numbers.

ALIGNMENT SAFETY (same rule as build-apostolic-fathers-greek.py): Greek is attached to a
chapter's verses ONLY when the English verse numbers are exactly the Greek section numbers;
chapters that versify differently stay English-only and are reported.

The work is stored as ONE prose work: chapters 1-114, each with a `label` ("Vision 3.6",
"Mandate 12.1", "Similitude 9.14") for the reader's headings; both citation styles
("Herm. Vis. 2.1.3", "Herm. Mand. 9", "Herm. 78.9") resolve in prose-texts.ts.

Usage:  python3 scripts/build-hermas.py [--no-cache]     (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ECW = 'https://www.earlychristianwritings.com/text/shepherd-lightfoot.html'
TEI = ('https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/'
       'data/tlg1419/tlg001/tlg1419.tlg001.1st1K-grc1.xml')
CACHE = Path('/tmp/first1k-hermas')
OUT = Path('public/data/apostolic-fathers/hermas.json')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

ATTRIBUTION = ('Text: J. B. Lightfoot’s translation of the Shepherd of Hermas (1891), public '
               'domain, via earlychristianwritings.com. Greek: First Thousand Years of Greek '
               '(Open Greek and Latin), CC BY-SA 4.0. Chapters follow the continuous 1–114 '
               'numbering; traditional Vision/Mandate/Similitude references are shown with '
               'each chapter.')

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


# ── Greek: TEI → {continuous chapter: {'label', 'sections': {n: text}}} ─────────────────────

def unit_label(book):
    if book <= 5:
        return 'Vision', book
    if book <= 17:
        return 'Mandate', book - 5
    return 'Similitude', book - 17


def parse_greek(xml_bytes):
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    edition = root.find('.//t:body/t:div', NS)
    chapters = {}
    cont = 0
    for b in edition.findall('t:div', NS):
        kind, unit_n = unit_label(int(b.get('n')))
        chs = b.findall('t:div', NS)
        for c in chs:
            cont += 1
            label = f'{kind} {unit_n}' if len(chs) == 1 else f'{kind} {unit_n}.{c.get("n")}'
            sections = {}
            for s in c.findall('t:div', NS):
                text = re.sub(r'\s+', ' ', ''.join(s.itertext())).strip()
                if text:
                    sections[int(s.get('n'))] = text
            chapters[cont] = {'label': label, 'sections': sections}
    return chapters


# ── English: ECW HTML → [(continuous chapter, verse, text)] with healed markers ─────────────

def parse_english(html):
    paras = re.findall(r'<P>\s*(\d+)(?:\[(\d+)\])?:(\d+)\b(.*?)</P>', html, re.I | re.S)
    out = []
    cont = 0          # healed continuous chapter
    prev_verse = 0
    for ch, bracket, verse, body in paras:
        verse = int(verse)
        marked = int(bracket) if bracket else int(ch)   # Vision 1 has no brackets (c == k)
        if marked > cont:
            cont = marked                                # marker advances: trust it
        elif verse <= prev_verse:
            cont += 1                                    # typo'd marker: verse reset ⇒ next chapter
        prev_verse = verse
        text = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', body)).strip()
        out.append((cont, verse, text))
    return out


def main():
    no_cache = '--no-cache' in sys.argv
    greek = parse_greek(fetch(TEI, 'tlg1419.xml', no_cache))
    english = parse_english(fetch(ECW, 'shepherd-lightfoot.html', no_cache).decode('utf-8', 'replace'))

    # Assemble English chapters
    chapters = {}
    for cont, verse, text in english:
        chapters.setdefault(cont, {})[verse] = text

    # Structure check against the Greek layout
    problems = []
    if set(chapters) != set(greek):
        problems.append(f'chapter sets differ: english-only {sorted(set(chapters) - set(greek))}, '
                        f'greek-only {sorted(set(greek) - set(chapters))}')
    aligned = 0
    for cont in sorted(chapters):
        g = greek.get(cont)
        if g and set(chapters[cont]) == set(g['sections']):
            aligned += 1
    total = len(chapters)

    docs = []
    for cont in sorted(chapters):
        g = greek.get(cont, {'label': f'Chapter {cont}', 'sections': {}})
        match = set(chapters[cont]) == set(g['sections'])
        verses = []
        for v in sorted(chapters[cont]):
            row = {'number': v, 'text': chapters[cont][v]}
            if match and v in g['sections']:
                row['greek'] = g['sections'][v]
            verses.append(row)
        docs.append({'number': cont, 'label': g['label'], 'verses': verses})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'work': 'The Shepherd of Hermas',
        'attribution': ATTRIBUTION,
        'greek': True,
        'chapters': docs,
    }, ensure_ascii=False, indent=1), encoding='utf-8')

    n_verses = sum(len(c['verses']) for c in docs)
    n_greek = sum(1 for c in docs for v in c['verses'] if 'greek' in v)
    print(f'chapters: {len(docs)} (greek layout: {len(greek)})')
    print(f'verse-aligned chapters: {aligned}/{total}')
    print(f'verses: {n_verses}, with greek: {n_greek} ({100 * n_greek // max(n_verses, 1)}%)')
    for p in problems:
        print('PROBLEM:', p)
    misaligned = [f"{c['number']} ({c['label']})" for c in docs
                  if not any('greek' in v for v in c['verses'])]
    if misaligned:
        print('english-only chapters:', ', '.join(misaligned))
    # Label table for prose-texts.ts spot-checks
    print('labels:', docs[0]['label'], '…', docs[25]['label'], '…', docs[49]['label'], '…', docs[-1]['label'])


if __name__ == '__main__':
    main()
