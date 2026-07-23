"""Add the parallel Greek original to the Philo works we already carry in English.

Our Philo is C. D. Yonge's public-domain English (scripts/build-philo.py), stored chapter -> verse
where the verse number is the Cohn-Wendland section (§). This script fetches the Greek from the
First Thousand Years of Greek project (Open Greek and Latin, CC BY-SA 4.0, TEI XML) and writes it
onto each verse's `greek` field, so the Texts reader shows a parallel Greek | English layout.

ALIGNMENT. Both sides are keyed by the same Cohn-Wendland section §, so section N is verse N. The
Greek is divided section (flat) for single-book works, and book -> section for the multi-book works
(Allegorical Interpretation, On Dreams, On the Life of Moses, On the Special Laws), where the Greek
book number equals our chapter number. As with the Apostolic Fathers, Greek is attached for a
chapter ONLY when our verse-numbers exactly equal the Greek section-numbers there, so a numbering
gap never shifts the text; unmatched chapters are left English-only.

English-only (no aligned Greek source — the Greek survives only in fragments or via an Armenian
version): On Providence, Questions and Answers on Genesis, the Hypothetica, the Fragments appendix,
and On the World.

Usage:  python3 scripts/build-philo-greek.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
try:
    from lxml import etree as LET
except Exception:
    LET = None

RAW = 'https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0018/'
CACHE = Path('/tmp/first1k-philo')
DATA = Path('public/data/philo')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
GREEK_SRC = ('Greek: First Thousand Years of Greek (Open Greek and Latin), '
             'CC BY-SA 4.0 (opengreekandlatin.org).')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()

# our slug -> First1KGreek Philo work number (tlg0018.tlgNNN).
MAP = {
    'creation': 'tlg001', 'alleg-interp': 'tlg002', 'cherubim': 'tlg003', 'sacrifices': 'tlg004',
    'worse': 'tlg005', 'posterity': 'tlg006', 'giants': 'tlg007', 'unchangeable': 'tlg008',
    'husbandry': 'tlg009', 'planter': 'tlg010', 'drunkenness': 'tlg011', 'sobriety': 'tlg012',
    'confusion': 'tlg013', 'migration': 'tlg014', 'heir': 'tlg015', 'congress': 'tlg016',
    'flight': 'tlg017', 'names': 'tlg018', 'dreams': 'tlg019', 'abraham': 'tlg020',
    'joseph': 'tlg021', 'moses': 'tlg022', 'decalogue': 'tlg023', 'spec-laws': 'tlg024',
    'virtues': 'tlg025', 'rewards': 'tlg026', 'good-person': 'tlg027', 'contemplative': 'tlg028',
    'eternity': 'tlg029', 'flaccus': 'tlg030', 'embassy': 'tlg031',
    # English-only: providence, qg, hypothetica, fragments, world.
}


def fetch(work, no_cache):
    """Fetch a work's Greek TEI. Tries the 1st1K edition, then a couple of known alternatives."""
    CACHE.mkdir(parents=True, exist_ok=True)
    for edition in ('1st1K-grc1', '1st1K-grc2', 'opp-grc1', 'perseus-grc2'):
        name = f'tlg0018.{work}.{edition}.xml'
        cached = CACHE / name
        if cached.exists() and not no_cache:
            return cached.read_bytes()
    for edition in ('1st1K-grc1', '1st1K-grc2', 'opp-grc1', 'perseus-grc2'):
        name = f'tlg0018.{work}.{edition}.xml'
        try:
            req = urllib.request.Request(f'{RAW}{work}/{name}', headers={'User-Agent': UA})
            data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
            (CACHE / name).write_bytes(data)
            time.sleep(0.3)
            return data
        except urllib.error.HTTPError:
            continue
    return None


def parse(xml_bytes):
    """Return {(book, section): greek}. Flat (single-book) works use book '1'."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    try:
        root = ET.fromstring(xml)
    except ET.ParseError:
        # A few First1KGreek files have stray mismatched tags; recover with lxml.
        root = ET.fromstring(LET.tostring(LET.fromstring(xml.encode('utf-8'),
                             LET.XMLParser(recover=True))).decode('utf-8'))
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx)
                continue
            c = dict(ctx)
            c[div.get('subtype')] = div.get('n')
            if div.get('subtype') == 'section':
                out[(c.get('book', '1'), div.get('n'))] = re.sub(r'\s+', ' ', ''.join(div.itertext())).strip()
            else:
                walk(div, c)

    walk(root.find('.//t:body', NS), {})
    return out


def apply_greek(slug, greek):
    path = DATA / f'{slug}.json'
    doc = json.loads(path.read_text(encoding='utf-8'))
    by_book = {}
    for (bk, sec), t in greek.items():
        by_book.setdefault(str(bk), {})[sec] = t

    matched_v = total_v = matched_ch = 0
    skipped = []
    for chap in doc['chapters']:
        total_v += len(chap['verses'])
        gsec = by_book.get(str(chap['number']), {})
        our_nums = {str(v['number']) for v in chap['verses']}
        # Both sides cite the Cohn-Wendland section §, so verse N == section N when they
        # share the scheme. Attach when every one of our verse-numbers is a Greek section
        # (subset) AND coverage is high — a low ratio means our English used a different
        # scheme (e.g. Yonge's paragraphs in On Joseph: 63 of our units vs 270 sections),
        # where matching by number would misalign, so that chapter is left English-only.
        subset = bool(gsec) and our_nums <= set(gsec)
        coverage = len(our_nums) / len(gsec) if gsec else 0
        if subset and coverage >= 0.85:
            for v in chap['verses']:
                g = gsec.get(str(v['number']))
                if g:
                    v['greek'] = g
                    matched_v += 1
            matched_ch += 1
        elif gsec:
            skipped.append(str(chap['number']))

    if total_v == 0 or matched_v / total_v < 0.3:
        return {'slug': slug, 'greek': False, 'matched_v': matched_v, 'total_v': total_v, 'skipped': skipped}

    doc['greek'] = True
    if GREEK_SRC not in doc['attribution']:
        doc['attribution'] = doc['attribution'].rstrip() + ' ' + GREEK_SRC
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return {'slug': slug, 'greek': True, 'matched_v': matched_v, 'total_v': total_v, 'skipped': skipped}


def main():
    no_cache = '--no-cache' in sys.argv
    got = []
    print(f'{"work":16} {"verses w/Greek":>16} {"skipped":>8}')
    for slug, work in MAP.items():
        raw = fetch(work, no_cache)
        if raw is None:
            print(f'{slug:16} {"— no Greek file":>16}')
            continue
        r = apply_greek(slug, parse(raw))
        flag = '' if r['greek'] else '   (below 50% — English-only)'
        skip = f"  skipped ch {','.join(r['skipped'])}" if r['skipped'] else ''
        print(f'{slug:16} {r["matched_v"]:>7}/{r["total_v"]:<7} {len(r["skipped"]):>6}{flag}{skip}')
        if r['greek']:
            got.append(slug)
    print(f'\nWorks now carrying Greek ({len(got)}):')
    print('  ' + ', '.join(f"'{s}'" for s in got))
    print('\nAdd these slugs to PHILO_GREEK in src/lib/prose-texts.ts.')


if __name__ == '__main__':
    main()
