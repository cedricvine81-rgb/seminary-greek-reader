# Fetches the Mishnah tractates the Backgrounds dataset cites, in Dr. Joshua Kulp's "Mishnah
# Yomit" translation (CC-BY — free to reuse with attribution) from the Sefaria API, and
# writes each into the shared prose chapter -> verse JSON shape (public/data/mishnah/
# <slug>.json), where verse = the mishnah number ("m. Sanh. 4:5" -> chapter 4, mishnah 5).
# One work per tractate. (Danby's public-domain Mishnah isn't fetchably available; the CC0
# Community translation is only partial, so Kulp CC-BY is the complete open option.)
#
# Usage:  python3 scripts/build-mishnah.py   (fetches over HTTPS, caching under /tmp; pass
#         --no-cache to force re-fetch). Run from the repo root. Prints a validation report.

import html
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = 'https://www.sefaria.org/api/v3/texts/'
VERSION = 'Mishnah Yomit by Dr. Joshua Kulp'
CACHE = Path('/tmp/mishnah')
OUT_DIR = Path('public/data/mishnah')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = 'Text: the Mishnah translated by Dr. Joshua Kulp (Mishnah Yomit), CC-BY. Source: Sefaria (sefaria.org).'

# slug, display name, Sefaria index, citation abbreviation(s) used in the dataset.
MISHNAH = [
    ('sanhedrin', 'Mishnah Sanhedrin', 'Mishnah Sanhedrin', ['m. Sanh.']),
    ('nedarim',   'Mishnah Nedarim',   'Mishnah Nedarim',   ['m. Ned.']),
    ('berakhot',  'Mishnah Berakhot',  'Mishnah Berakhot',  ['m. Ber.']),
    ('makkot',    'Mishnah Makkot',    'Mishnah Makkot',    ['m. Mak.']),
    ('yoma',      'Mishnah Yoma',      'Mishnah Yoma',      ['m. Yoma']),
    ('ketubot',   'Mishnah Ketubot',   'Mishnah Ketubot',   ['m. Ketub.']),
    ('keritot',   'Mishnah Keritot',   'Mishnah Keritot',   ['m. Ker.']),
    ('kiddushin', 'Mishnah Kiddushin', 'Mishnah Kiddushin', ['m. Qidd.']),
    ('tamid',     'Mishnah Tamid',     'Mishnah Tamid',     ['m. Tamid']),
    ('nazir',     'Mishnah Nazir',     'Mishnah Nazir',     ['m. Naz.']),
    ('yevamot',   'Mishnah Yevamot',   'Mishnah Yevamot',   ['m. Yebam.', 'm. Yeb.']),
    ('temurah',   'Mishnah Temurah',   'Mishnah Temurah',   ['m. Temurah']),
    ('negaim',    'Mishnah Negaim',    'Mishnah Negaim',    ['m. Neg.']),
    ('bava-batra','Mishnah Bava Batra','Mishnah Bava Batra',['m. B. Bat.']),
    ('terumot',   'Mishnah Terumot',   'Mishnah Terumot',   ['m. Terumot']),
    ('demai',     'Mishnah Demai',     'Mishnah Demai',     ['m. Demai']),
    ('niddah',    'Mishnah Niddah',    'Mishnah Niddah',    ['m. Nid.']),
    ('yadayim',   'Mishnah Yadayim',   'Mishnah Yadayim',   ['m. Yad.']),
    ('bava-kamma','Mishnah Bava Kamma','Mishnah Bava Kamma',['m. B. Qam.']),
    ('bikkurim',  'Mishnah Bikkurim',  'Mishnah Bikkurim',  ['m. Bik.']),
    ('sotah',     'Mishnah Sotah',     'Mishnah Sotah',     ['m. Soṭah']),
    ('chullin',   'Mishnah Chullin',   'Mishnah Chullin',   ['m. Ḥul.']),
    ('avot',      'Pirkei Avot',       'Pirkei Avot',       ['m. ʾAbot', 'm. Abot']),
    ('gittin',    'Mishnah Gittin',    'Mishnah Gittin',    ['m. Giṭ.']),
    ('taanit',    'Mishnah Taanit',    'Mishnah Taanit',    ['m. Taʿan.']),
    ('eduyot',    'Mishnah Eduyot',    'Mishnah Eduyot',    ['m. ʿEd.']),
    ('pesachim',  'Mishnah Pesachim',  'Mishnah Pesachim',  ['m. Pesaḥ.']),
    ('eruvin',    'Mishnah Eruvin',    'Mishnah Eruvin',    ['m. ʿErub.']),
    ('shabbat',   'Mishnah Shabbat',   'Mishnah Shabbat',   ['m. Šabb.']),
    ('tahorot',   'Mishnah Tahorot',   'Mishnah Tahorot',   ['m. Ṭohor.']),
    ('chagigah',  'Mishnah Chagigah',  'Mishnah Chagigah',  ['m. Ḥag.']),
    ('peah',      'Mishnah Peah',      'Mishnah Peah',      ['m. Peʾah']),
    ('beitzah',   'Mishnah Beitzah',   'Mishnah Beitzah',   ['m. Beṣah']),
    ('shevuot',   'Mishnah Shevuot',   'Mishnah Shevuot',   ['m. Šebu.']),
    ('zevachim',  'Mishnah Zevachim',  'Mishnah Zevachim',  ['m. Zebaḥ.']),
    ('sheviit',   'Mishnah Sheviit',   'Mishnah Sheviit',   ['m. Šeb.']),
    ('shekalim',  'Mishnah Shekalim',  'Mishnah Shekalim',  ['m. Šeqal.']),
    ('bava-metzia','Mishnah Bava Metzia','Mishnah Bava Metzia',['m. B. Meṣiʿa']),
    ('moed-katan','Mishnah Moed Katan','Mishnah Moed Katan',['m. Moʾed Qaṭ.']),
    ('avodah-zarah','Mishnah Avodah Zarah','Mishnah Avodah Zarah',['m. ʿAbod. Zar.']),
]

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def fetch(index: str, no_cache: bool) -> list:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (index.replace(' ', '_') + '.json')
    if cached.exists() and not no_cache:
        raw = cached.read_bytes()
    else:
        url = API + urllib.parse.quote(index) + '?version=english|' + urllib.parse.quote(VERSION)
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        raw = urllib.request.urlopen(req, timeout=45, context=_ctx).read()
        cached.write_bytes(raw)
        time.sleep(0.4)
    versions = json.loads(raw).get('versions') or []
    return versions[0].get('text') if versions else []


def clean(s: str) -> str:
    s = html.unescape(s)
    s = re.sub(r'<[^>]+>', ' ', s)      # strip <i>, footnote sup, etc.
    return re.sub(r'\s+', ' ', s).strip()


def build_work(slug, name, index, abbrevs, no_cache):
    text = fetch(index, no_cache)
    chapters = []
    for ci, mishnahs in enumerate(text, start=1):
        verses = [{'number': vi, 'text': clean(m)} for vi, m in enumerate(mishnahs, start=1)
                  if isinstance(m, str) and clean(m)]
        if verses:
            chapters.append({'number': ci, 'verses': verses})
    doc = {'work': name, 'attribution': ATTRIB, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return {'slug': slug, 'abbrevs': abbrevs, 'chapters': len(chapters),
            'verses': sum(len(c['verses']) for c in chapters), 'doc': doc}


def resolve(text, works):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    for w in works:
        for ab in sorted(w['abbrevs'], key=len, reverse=True):
            m = re.match(re.escape(ab) + r'\s+(\d+)(?::(\d+))?', s)
            if m:
                return (w['slug'], int(m.group(1)), int(m.group(2)) if m.group(2) else None)
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])
            if re.sub(r'^cf\.\s*', '', c['text'].strip()).startswith('m. ')]
    hit = miss = unmapped = 0
    misses = []
    for text in cits:
        r = resolve(text, results)
        if not r:
            unmapped += 1; misses.append(('UNMAPPED', text)); continue
        slug, ch, v = r
        doc = by_slug[slug]['doc']
        chap = next((c for c in doc['chapters'] if c['number'] == ch), None)
        if chap and (v is None or any(vv['number'] == v for vv in chap['verses'])):
            hit += 1
        else:
            miss += 1; misses.append((f'{slug} {ch}:{v} missing', text))
    print(f'\nValidation: {len(cits)} Mishnah citations | resolved+found={hit} '
          f'resolved-but-missing={miss} unmapped={unmapped}')
    for why, text in misses:
        print(f'   MISS  {text:30s} -> {why}')


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, name, index, abbrevs in MISHNAH:
        r = build_work(slug, name, index, abbrevs, no_cache)
        results.append(r)
        print(f'{slug:12s} chapters={r["chapters"]:2d} mishnahs={r["verses"]:4d}')
    validate(results)


if __name__ == '__main__':
    main()
