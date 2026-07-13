# Fetches J. B. Lightfoot & J. R. Harmer's translation of the Apostolic Fathers (1891,
# public domain) from earlychristianwritings.com and parses each work into the shared prose
# chapter -> verse JSON shape (public/data/apostolic-fathers/<slug>.json), the same shape
# the rest of the embedded prose corpus uses (see src/lib/prose-texts.ts).
#
# The Lightfoot pages carry the standard chapter:verse versification inline — sometimes with
# a work prefix ("1Clem 1:1"), most often bare ("1:1"), and Didache wraps its Old-Testament
# quotations in {..}. A single "(chapter):(verse)" scan handles them all. The Ignatian
# letters number their salutation as chapter 0; since the reader needs chapters to run
# 1..N, chapter 0 is folded into the start of chapter 1.
#
# Usage:  python3 scripts/build-apostolic-fathers.py   (fetches, caching under /tmp; pass
#         --no-cache to force re-fetch). Run from the repo root. Prints a validation report
#         of how many "Apostolic Fathers" cross-reference citations resolve to a real verse.

import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE = 'http://www.earlychristianwritings.com/text/'
CACHE = Path('/tmp/apostolic-fathers')
OUT_DIR = Path('public/data/apostolic-fathers')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = 'Text: J. B. Lightfoot & J. R. Harmer’s translation of the Apostolic Fathers (1891), public domain. Source: earlychristianwritings.com.'

# slug, display name, noteBook (stable note-anchor prefix), page (…-lightfoot.html),
# citation abbreviation(s) used in the Backgrounds dataset.
AF = [
    ('1clement',    '1 Clement',                       'AF1Clem',   '1clement',                ['1 Clem.']),
    ('2clement',    '2 Clement',                       'AF2Clem',   '2clement',                ['2 Clem.']),
    ('ign-ephesians','Ignatius to the Ephesians',      'AFIgnEph',  'ignatius-ephesians',      ['Ign. Eph.']),
    ('ign-magnesians','Ignatius to the Magnesians',    'AFIgnMag',  'ignatius-magnesians',     ['Ign. Magn.']),
    ('ign-trallians','Ignatius to the Trallians',      'AFIgnTrall','ignatius-trallians',      ['Ign. Trall.']),
    ('ign-romans',  'Ignatius to the Romans',          'AFIgnRom',  'ignatius-romans',         ['Ign. Rom.']),
    ('ign-philadelphians','Ignatius to the Philadelphians','AFIgnPhld','ignatius-philadelphians',['Ign. Phld.']),
    ('ign-smyrnaeans','Ignatius to the Smyrnaeans',    'AFIgnSmyrn','ignatius-smyrnaeans',     ['Ign. Smyrn.']),
    ('ign-polycarp','Ignatius to Polycarp',            'AFIgnPol',  'ignatius-polycarp',       ['Ign. Pol.']),
    ('polycarp',    'Polycarp to the Philippians',     'AFPolPhil', 'polycarp',                ['Pol. Phil.']),
    ('didache',     'The Didache',                     'AFDid',     'didache',                 ['Did.']),
    ('barnabas',    'The Epistle of Barnabas',         'AFBarn',    'barnabas',                ['Barn.']),
    ('diognetus',   'The Epistle to Diognetus',        'AFDiogn',   'diognetus',               ['Diogn.']),
    ('mart-polycarp','The Martyrdom of Polycarp',      'AFMartPol', 'martyrdompolycarp',       ['Mart. Pol.']),
]

# Prefix tokens that precede a marker on the prefixed pages and a "CHAPTER n" header on the
# Ignatian pages — both leak onto the tail of the previous verse after slicing.
TRAIL_JUNK_RE = re.compile(r'(?:\s+(?:1Clem|2Clem|Polycarp|Barnabas|Didache|CHAPTER\s+\d+))+\s*$', re.I)
MARKER_RE = re.compile(r'(\d+):(\d+)')


def fetch(page: str, no_cache: bool) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / f'{page}.html'
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(BASE + f'{page}-lightfoot.html', headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=30).read()
    cached.write_bytes(data)
    time.sleep(0.5)
    return data


def parse(raw: bytes):
    """Return {chapter: {verse: text}} for one work."""
    h = raw.decode('latin-1')
    h = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h)
    for sentinel in ('<hr width="50%"', 'Tables of Contents</a>', 'Go to the'):
        idx = h.find(sentinel)
        if idx != -1:
            h = h[:idx]
            break
    t = html.unescape(re.sub(r'<[^>]+>', ' ', h))
    t = t.replace('{', ' ').replace('}', ' ')      # Lightfoot brace-marks OT quotations
    t = t.replace('_', '')                          # …and _underscores_ for italic quotations
    markers = list(MARKER_RE.finditer(t))
    by_ch: dict = {}
    for i, m in enumerate(markers):
        end = markers[i + 1].start() if i + 1 < len(markers) else len(t)
        text = TRAIL_JUNK_RE.sub('', t[m.end():end])
        text = re.sub(r'\s+', ' ', text).strip()
        ch, vs = int(m.group(1)), int(m.group(2))
        by_ch.setdefault(ch, {})[vs] = text

    # Fold the Ignatian salutation (chapter 0) into the opening of chapter 1.
    if 0 in by_ch:
        intro = ' '.join(by_ch[0][v] for v in sorted(by_ch[0])).strip()
        if 1 in by_ch and intro:
            v1 = min(by_ch[1])
            by_ch[1][v1] = f'{intro} {by_ch[1][v1]}'.strip()
        del by_ch[0]
    return by_ch


def build_work(slug, name, note_book, page, abbrevs, no_cache):
    by_ch = parse(fetch(page, no_cache))
    chapters = [{'number': ch, 'verses': [{'number': v, 'text': by_ch[ch][v]} for v in sorted(by_ch[ch])]}
                for ch in sorted(by_ch)]
    doc = {'work': name, 'attribution': ATTRIB, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    nums = [c['number'] for c in chapters]
    contiguous = nums == list(range(1, len(nums) + 1))
    return {'slug': slug, 'chapters': len(chapters), 'verses': sum(len(c['verses']) for c in chapters),
            'contiguous': contiguous, 'doc': doc, 'abbrevs': abbrevs}


# ── Citation resolution (mirrors parseCitation in prose-texts.ts) for self-validation. ──
def resolve(text, works):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    s = re.sub(r'^idem,\s*', '', s)
    for w in works:
        for ab in w['abbrevs']:
            m = re.match(re.escape(ab) + r'\s+(\d+)(?:[:.](\d+))?', s)
            if m:
                return (w['slug'], int(m.group(1)), int(m.group(2)) if m.group(2) else None)
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    abbr_re = re.compile(r'^(cf\.\s*)?(1 Clem\.|2 Clem\.|Ign\.|Pol\. Phil\.|Did\.|Barn\.|Diogn\.|Mart\. Pol\.)')
    cits = []
    for e in data['entries']:
        for c in e.get('citations', []):
            if abbr_re.match(c['text'].strip()):
                cits.append(c['text'])
    hit = miss = unmapped = 0
    misses = []
    for text in cits:
        r = resolve(text, results)
        if not r:
            unmapped += 1; misses.append(('UNMAPPED', text)); continue
        slug, ch, v = r
        doc = by_slug[slug]['doc']
        chap = next((c for c in doc['chapters'] if c['number'] == ch), None)
        found = chap and (v is None or any(vv['number'] == v for vv in chap['verses']))
        if found: hit += 1
        else: miss += 1; misses.append((f'{slug} {ch}:{v} not in text', text))
    print(f'\nValidation: {len(cits)} Apostolic-Fathers citations | resolved+found={hit} '
          f'resolved-but-missing={miss} unmapped={unmapped}')
    for why, text in misses:
        print(f'   MISS  {text:44s} -> {why}')


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, name, note_book, page, abbrevs in AF:
        r = build_work(slug, name, note_book, page, abbrevs, no_cache)
        results.append(r)
        flag = '' if r['contiguous'] else '  ⚠ NON-CONTIGUOUS'
        print(f'{slug:22s} chapters={r["chapters"]:3d} verses={r["verses"]:4d}{flag}')
    validate(results)


if __name__ == '__main__':
    main()
