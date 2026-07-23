"""Add the parallel Greek original to the Apostolic Fathers works we already carry in English.

Our Apostolic Fathers are Lightfoot–Harmer's public-domain English (scripts/build-apostolic-fathers.py),
stored chapter → verse. This script fetches the Greek from the First Thousand Years of Greek project
(github.com/OpenGreekAndLatin/First1KGreek, CC BY-SA 4.0, TEI XML) and writes it back onto each verse's
`greek` field, so the Texts reader shows a parallel Greek | English layout (as it already does for
Epictetus and Josephus).

ALIGNMENT SAFETY. The Greek is divided chapter → section; our English is versified by the same
Lightfoot–Harmer scheme, so section N usually equals verse N. But some works (notably the Didache)
were versified more finely on our side, so a section can span several of our verses. Attaching Greek
by number there would put the wrong Greek beside the English. To make misalignment impossible, Greek
is attached for a chapter ONLY when our verse-numbers are exactly the Greek's section-numbers; any
chapter that doesn't match is left English-only. The report prints per-work coverage.

Usage:  python3 scripts/build-apostolic-fathers-greek.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/'
CACHE = Path('/tmp/first1k')
DATA = Path('public/data/apostolic-fathers')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

GREEK_SRC = ('Greek: First Thousand Years of Greek (Open Greek and Latin), '
             'CC BY-SA 4.0 (opengreekandlatin.org).')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()

# Each work → its First1KGreek TEI path. Ignatius' seven letters share one file (the middle
# recension, tlg1443.tlg001), split by <div subtype="epistle">; `epistle` selects the letter.
WORKS = {
    '1clement':          {'rel': 'tlg1271/tlg001/tlg1271.tlg001.1st1K-grc1.xml'},
    '2clement':          {'rel': 'tlg1271/tlg002/tlg1271.tlg002.1st1K-grc1.xml'},
    'barnabas':          {'rel': 'tlg1216/tlg001/tlg1216.tlg001.opp-grc1.xml'},
    'didache':           {'rel': 'tlg1311/tlg001/tlg1311.tlg001.1st1K-grc1.xml'},
    'polycarp':          {'rel': 'tlg1622/tlg001/tlg1622.tlg001.1st1K-grc1.xml'},
    'ign-ephesians':     {'rel': 'tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml', 'epistle': '1', 'fold_praef': True},
    'ign-magnesians':    {'rel': 'tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml', 'epistle': '2', 'fold_praef': True},
    'ign-trallians':     {'rel': 'tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml', 'epistle': '3', 'fold_praef': True},
    'ign-romans':        {'rel': 'tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml', 'epistle': '4', 'fold_praef': True},
    'ign-philadelphians':{'rel': 'tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml', 'epistle': '5', 'fold_praef': True},
    'ign-smyrnaeans':    {'rel': 'tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml', 'epistle': '6', 'fold_praef': True},
    'ign-polycarp':      {'rel': 'tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml', 'epistle': '7', 'fold_praef': True},
    # No First1KGreek source located for the Epistle to Diognetus or the Martyrdom of Polycarp;
    # they stay English-only for now.
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


def section_text(div):
    return re.sub(r'\s+', ' ', ''.join(div.itertext())).strip()


def parse_sections(xml_bytes, epistle=None, fold_praef=False):
    """Return {(chapter, section): greek} for a work, restricted to one epistle if given."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx)
                continue
            c = dict(ctx)
            c[div.get('subtype')] = div.get('n')
            if div.get('subtype') == 'section':
                out[(c.get('chapter'), div.get('n'))] = section_text(div)
            else:
                walk(div, c)

    body = root.find('.//t:body', NS)
    if epistle is not None:
        # Descend into the matching <div subtype="epistle" n="…"> first.
        target = None
        for div in body.iter('{http://www.tei-c.org/ns/1.0}div'):
            if div.get('subtype') == 'epistle' and div.get('n') == epistle:
                target = div
                break
        if target is None:
            return {}
        walk(target, {})
    else:
        walk(body, {})

    # Our Ignatian English folds the salutation into 1:1; the Greek keeps it as a separate
    # `praef` chapter. Prepend it to chapter 1, section 1 so the pairing lines up.
    if fold_praef:
        praef = ' '.join(t for (ch, _), t in sorted(out.items()) if ch == 'praef')
        if praef:
            body1 = out.get(('1', '1'), '')
            out[('1', '1')] = (praef + ' ' + body1).strip()
        for k in [k for k in out if k[0] == 'praef']:
            del out[k]
    return out


def apply_greek(slug, greek):
    """Attach Greek per verse where a chapter's verse-numbers exactly match the section-numbers."""
    path = DATA / f'{slug}.json'
    doc = json.loads(path.read_text(encoding='utf-8'))

    # Group Greek sections by chapter.
    by_ch = {}
    for (ch, sec), t in greek.items():
        by_ch.setdefault(ch, {})[sec] = t

    matched_ch = 0
    matched_v = 0
    total_v = 0
    skipped = []
    for chap in doc['chapters']:
        total_v += len(chap['verses'])
        ch = str(chap['number'])
        gsec = by_ch.get(ch, {})
        our_nums = {str(v['number']) for v in chap['verses']}
        # Strict: identical numbering, so section N unambiguously belongs to verse N.
        if gsec and our_nums == set(gsec):
            for v in chap['verses']:
                g = gsec[str(v['number'])]
                if g:
                    v['greek'] = g
                    matched_v += 1
            matched_ch += 1
        elif gsec:
            skipped.append(ch)

    # A work whose English is versified too differently to align (the Didache) ends up with a
    # handful of matched verses and a near-empty Greek column — worse than none. Require the
    # bulk of the work to align before treating it as a parallel-Greek text.
    if total_v == 0 or matched_v / total_v < 0.5:
        return {'slug': slug, 'greek': False, 'matched_v': matched_v, 'total_v': total_v,
                'matched_ch': matched_ch, 'skipped': skipped}

    doc['greek'] = True
    if GREEK_SRC not in doc['attribution']:
        doc['attribution'] = doc['attribution'].rstrip() + ' ' + GREEK_SRC
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return {'slug': slug, 'greek': True, 'matched_v': matched_v, 'total_v': total_v,
            'matched_ch': matched_ch, 'skipped': skipped}


def main():
    no_cache = '--no-cache' in sys.argv
    got_greek = []
    print(f'{"work":20} {"verses w/Greek":>16} {"chapters skipped":>18}')
    for slug, cfg in WORKS.items():
        greek = parse_sections(fetch(cfg['rel'], no_cache), cfg.get('epistle'), cfg.get('fold_praef', False))
        r = apply_greek(slug, greek)
        flag = '' if r['greek'] else '   (none — left English-only)'
        skip = f"  skipped ch {','.join(r['skipped'])}" if r['skipped'] else ''
        print(f'{slug:20} {r["matched_v"]:>7}/{r["total_v"]:<7} {len(r["skipped"]):>10}{flag}{skip}')
        if r['greek']:
            got_greek.append(slug)

    print(f'\nWorks now carrying Greek ({len(got_greek)}):')
    print('  ' + ', '.join(f"'{s}'" for s in got_greek))
    print('\nAdd these slugs to AF_GREEK in src/lib/prose-texts.ts so the catalog shows the Greek column.')


if __name__ == '__main__':
    main()
