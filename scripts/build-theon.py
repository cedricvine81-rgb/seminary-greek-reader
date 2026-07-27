"""Build Aelius Theon, Progymnasmata (Greek only) for the Texts library.

Theon's handbook of preliminary rhetorical exercises (1st c. CE) — the progymnasmata
that underlie so much of the composition behind the New Testament epistles and gospels.
The Greek is from the First Thousand Years of Greek project (github.com/OpenGreekAndLatin/
First1KGreek, CC BY-SA 4.0), Walz's text: tlg0607.tlg001.1st1K-grc1.xml, divided into the
extant chapters (the exercises), each a run of paragraphs.

GREEK ONLY: the standard modern English (George A. Kennedy, 2003) is under copyright and no
public-domain translation exists, so this ships Greek-only (like Marcus Aurelius / Aratus) —
click-to-parse morphology, no translation column.

Output: public/data/greco/theon-progymnasmata.json
Usage:  python3 scripts/build-theon.py [--no-cache]     (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = ('https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/'
       'tlg0607/tlg001/tlg0607.tlg001.1st1K-grc1.xml')
CACHE = Path('/tmp/first1k-theon.xml')
OUT = Path('public/data/greco/theon-progymnasmata.json')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

ATTRIBUTION = ('Greek: Aelius Theon, Progymnasmata, ed. C. Walz (Rhetores Graeci). Digital '
               'edition: First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0. '
               'Greek only — the modern English (Kennedy, 2003) is under copyright.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(no_cache):
    if CACHE.exists() and not no_cache:
        return CACHE.read_bytes()
    req = urllib.request.Request(RAW, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=90, context=_ctx).read()
    CACHE.write_bytes(data)
    return data


def txt(el):
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()


def main():
    no_cache = '--no-cache' in sys.argv
    xml = re.sub(r'(?is)<note\b.*?</note>', '', fetch(no_cache).decode('utf-8', 'replace'))
    body = ET.fromstring(xml).find('.//t:body', NS)

    chapters = []
    titles = {}
    for div in body.iter('{http://www.tei-c.org/ns/1.0}div'):
        if div.get('subtype') != 'chapter':
            continue
        n = int(div.get('n'))
        head = div.find('t:head', NS)
        if head is not None:
            # Greek exercise title ("ΠΕΡΙ ΜΥΘΟΥ."), tidied of trailing punctuation.
            titles[n] = txt(head).rstrip('.,·').strip()
        paras = [txt(p) for p in div.findall('t:p', NS)]
        paras = [p for p in paras if p]
        verses = [{'number': i + 1, 'text': '', 'greek': p} for i, p in enumerate(paras)]
        chapters.append({'number': n, 'verses': verses})

    doc = {
        'work': 'Theon, Progymnasmata',
        'attribution': ATTRIBUTION,
        'greek': True,
        'greekOnly': True,
        'chapters': chapters,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print(f'Wrote {OUT}')
    print(f'{len(chapters)} chapters, {sum(len(c["verses"]) for c in chapters)} paragraphs.')
    for c in chapters:
        print(f'  ch {c["number"]}: {len(c["verses"])} ¶  — {titles.get(c["number"], "(proem)")}')
    print('\nGreek chapter titles (for prose-texts.ts chapterLabel map):')
    print('  ', {n: titles.get(n, 'Proem') for n in sorted(set(c["number"] for c in chapters))})


if __name__ == '__main__':
    main()
