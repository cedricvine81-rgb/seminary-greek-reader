"""Attach the parallel Greek to the Letter of Aristeas we already carry in English.

English: H. T. Andrews' translation (Charles' Apocrypha & Pseudepigrapha, 1913), stored as one
chapter whose verses are the standard §§1-322 (public/data/pseudepigrapha/aristeas.json; some
§§ Andrews merged into their neighbour, so a few numbers are absent on the English side).

Greek: H. St. J. Thackeray's edition (appendix to Swete, "An Introduction to the Old Testament
in Greek", public domain), in the Online Critical Pseudepigrapha's encoding
(github.com/OnlineCriticalPseudepigrapha, LetAris.xml) — one <div number="§"> per section,
single Thackeray reading per unit. Both sides use the SAME section numbers, so Greek §N is
attached to English verse N directly; §§ missing on either side are reported and skipped.

Usage:  python3 scripts/build-aristeas-greek.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SRC = ('https://raw.githubusercontent.com/OnlineCriticalPseudepigrapha/'
       'Online-Critical-Pseudepigrapha/master/static/docs/LetAris.xml')
CACHE = Path('/tmp/ocp-cache')
DATA = Path('public/data/pseudepigrapha/aristeas.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

GREEK_SRC = ('Greek: H. St. J. Thackeray’s edition of the Letter of Aristeas (appendix to '
             'Swete’s Introduction to the Old Testament in Greek, public domain), via the '
             'Online Critical Pseudepigrapha.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / 'LetAris.xml'
    if cached.exists() and not no_cache:
        return cached.read_text(encoding='utf-8')
    req = urllib.request.Request(SRC, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
    cached.write_bytes(data)
    return data.decode('utf-8')


def parse_sections(xml):
    """{§: greek} from the OCP encoding — first reading of each unit (single-witness text)."""
    sections = {}
    for m in re.finditer(r'<div number="(\d+)"[^>]*>(.*?)</div>', xml, re.S):
        n = int(m.group(1))
        readings = re.findall(r'<reading[^>]*>(.*?)</reading>', m.group(2), re.S)
        text = ' '.join(re.sub(r'<[^>]+>', ' ', r) for r in readings)
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            sections[n] = text
    return sections


def main():
    no_cache = '--no-cache' in sys.argv
    greek = parse_sections(fetch(no_cache))
    doc = json.loads(DATA.read_text(encoding='utf-8'))
    verses = doc['chapters'][0]['verses']

    attached = 0
    for v in verses:
        g = greek.get(v['number'])
        if g:
            v['greek'] = g
            attached += 1
    doc['greek'] = True
    if GREEK_SRC not in doc['attribution']:
        doc['attribution'] = doc['attribution'].rstrip() + ' ' + GREEK_SRC
    DATA.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding='utf-8')

    eng = {v['number'] for v in verses}
    print(f'greek §§: {len(greek)}; english verses: {len(verses)}; attached: {attached}')
    print('greek-only §§ (no english verse):', sorted(set(greek) - eng))
    print('english-only verses (no greek §):', sorted(eng - set(greek)))


if __name__ == '__main__':
    main()
