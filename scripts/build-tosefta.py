# Fetches the Tosefta in Hebrew from Sefaria into the shared prose chapter -> verse JSON shape
# (public/data/tosefta/<slug>.json).
#
# EDITION. Sefaria carries two families: the plain text (Zuckermandel / Machon Mamre), which is
# PUBLIC DOMAIN, and "Tosefta X (Lieberman)", Saul Lieberman's critical edition of 1955-88, which
# is not. Only the public-domain family is fetched, and the version is chosen per tractate BY
# LICENCE rather than by name — the titles are inconsistent ("Tosefta B'rachot", "Tosefta Pei'ah
# - Machon Mamre", "Tosefta Terumot"), so matching on a name would silently take the wrong text.
#
# HEBREW ONLY. Sefaria's English for the Tosefta is the CC0 community translation, which is
# partial in the same way the Bavli's is; a half-translated tractate reads as our failure rather
# than its. The text is chapter -> halakhah, which maps onto our prose shape directly, and
# citations are written "t. Ber. 3:7".
#
# Usage:  python3 scripts/build-tosefta.py   (caches under /tmp/tosefta; --no-cache to refetch).
#         Run from the repo root.

import hashlib
import html
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

VERSIONS = 'https://www.sefaria.org/api/texts/versions/'
API = 'https://www.sefaria.org/api/v3/texts/'
CACHE = Path('/tmp/tosefta')
OUT_DIR = Path('public/data/tosefta')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = ('Text: the Tosefta (Zuckermandel / Machon Mamre), public domain. '
          'Source: Sefaria (sefaria.org). Hebrew only — no English translation is included.')

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


class _Strip(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []

    def handle_data(self, d):
        self.out.append(d)

    def handle_starttag(self, tag, attrs):
        if tag in ('br', 'p'):
            self.out.append(' ')

    def text(self):
        return ''.join(self.out)


def clean(s):
    p = _Strip()
    p.feed(s or '')
    return re.sub(r'\s+', ' ', html.unescape(p.text())).strip()


def fetch(url, key, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (hashlib.md5(key.encode('utf-8')).hexdigest() + '.json')
    if f.exists() and not no_cache:
        try:
            return json.loads(f.read_bytes())
        except Exception:
            pass
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        raw = urllib.request.urlopen(req, timeout=90, context=_ctx).read()
    except Exception:
        return None
    f.write_bytes(raw)
    time.sleep(0.3)
    try:
        return json.loads(raw)
    except Exception:
        return None


def slugify(title):
    return re.sub(r'[^a-z0-9]+', '-', title.replace('Tosefta ', '').lower()).strip('-')


def main():
    no_cache = '--no-cache' in sys.argv
    tractates = [t for t in json.load(open('/tmp/tosefta.json')) if '(Lieberman)' not in t]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    results, skipped = [], []
    for title in tractates:
        q = urllib.parse.quote(title.replace(' ', '_'))
        versions = fetch(VERSIONS + q, f'v_{title}', no_cache) or []
        # By LICENCE, never by name.
        pd = next((v for v in versions
                   if v.get('language') == 'he' and v.get('license') == 'Public Domain'), None)
        if not pd:
            skipped.append((title, 'no public-domain Hebrew version'))
            continue
        vt = pd['versionTitle']
        payload = fetch(f'{API}{q}?version=hebrew|{urllib.parse.quote(vt)}', f't_{title}', no_cache)
        got = (payload or {}).get('versions') or []
        if not got or got[0].get('license') != 'Public Domain':
            skipped.append((title, 'version fetch failed or licence changed'))
            continue
        chapters = []
        for ci, hals in enumerate(got[0].get('text') or [], start=1):
            if isinstance(hals, str):
                hals = [hals]
            verses = [{'number': hi, 'greek': clean(h)}
                      for hi, h in enumerate(hals or [], start=1)
                      if isinstance(h, str) and clean(h)]
            if verses:
                chapters.append({'number': ci, 'verses': verses})
        if not chapters:
            skipped.append((title, 'no text'))
            continue
        slug = slugify(title)
        doc = {'work': f't. {title.replace("Tosefta ", "")}', 'attribution': ATTRIB,
               'greek': True, 'chapters': chapters}
        p = OUT_DIR / f'{slug}.json'
        p.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        results.append((slug, title.replace('Tosefta ', ''), len(chapters),
                        sum(len(c['verses']) for c in chapters), round(p.stat().st_size / 1024)))
        print(f'  {slug:18} chapters={len(chapters):3} halakhot={sum(len(c["verses"]) for c in chapters):5}')

    print(f'\n{len(results)} tractates | '
          f'{sum(r[2] for r in results)} chapters | {sum(r[3] for r in results)} halakhot | '
          f'{round(sum(r[4] for r in results)/1024, 1)} MB')
    for t, why in skipped:
        print(f'   SKIPPED {t}: {why}')

    print('\n// paste into the TOSEFTA table in src/lib/prose-texts.ts')
    for slug, name, chs, _, _ in results:
        note = 'Tos' + name.replace(' ', '')
        # Tractate names carry apostrophes (Ta'anit, Me'ilah); escape them or the emitted
        # single-quoted TypeScript will not parse.
        q = lambda v: v.replace("'", "\\'")
        print(f"  {{ slug: 't-{slug}', name: 't. {q(name)}', noteBook: '{q(note)}', chapters: {chs} }},")


if __name__ == '__main__':
    main()
