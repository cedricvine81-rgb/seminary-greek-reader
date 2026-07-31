# Fetches the Babylonian Talmud in Aramaic — all 37 tractates of the Wikisource Talmud Bavli
# (the Vilna text, CC-BY-SA via Sefaria) — into the shared prose chapter -> verse JSON shape
# (public/data/bavli/<tractate>.json).
#
# ARAMAIC ONLY, and deliberately so. The Bavli's one good English is the Koren-Steinsaltz
# William Davidson edition, which Sefaria carries under CC-BY-NC: a subscription app cannot
# ship it without permission (a request is out with Sefaria/Koren). The CC0 community
# translation is far too patchy to stand in — Sanhedrin 90a is 22% translated and whole dapim
# are missing. So this gives readers the text itself, and the English stays absent rather than
# arriving half-done. If permission comes through, the same files gain an `text` field.
#
# DAF NUMBERING. Sefaria stores a tractate as a flat array of dapim, two per folio, starting at
# 1a — so index 0 is 1a, index 1 is 1b, index 2 is 2a, and dapim 1a/1b are empty in every
# tractate (a Talmud begins at 2a). Our prose works are chapter -> verse, so:
#     chapter = index + 1        (1-based, and what parseCitation computes)
#     verse   = the line within the daf
#     label   = the daf as scholarship writes it ("2a"), via ProseWork.chapterLabel
# Empty dapim are skipped, so a tractate's chapters start at 3 and the registry records the
# actual chapter numbers.
#
# Usage:  python3 scripts/build-bavli.py   (fetches over HTTPS, caching under /tmp; pass
#         --no-cache to force re-fetch). Run from the repo root. Prints a report and
#         validates against the Backgrounds cross-reference dataset.

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

API = 'https://www.sefaria.org/api/v3/texts/'
VERSION = 'Wikisource Talmud Bavli'
CACHE = Path('/tmp/bavli')
OUT_DIR = Path('public/data/bavli')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = ('Text: the Babylonian Talmud (Vilna), Hebrew Wikisource, CC BY-SA 4.0. '
          'Source: Sefaria (sefaria.org). Aramaic only — no English translation is included.')

# slug, Sefaria index, display name, English gloss, SBL citation abbreviation(s).
BAVLI = [
    ('berakhot',     'Berakhot',      'Berakhot',      'Blessings',                ['b. Ber.']),
    ('shabbat',      'Shabbat',       'Shabbat',       'Sabbath',                  ['b. Šabb.']),
    ('eruvin',       'Eruvin',        'Eruvin',        'Sabbath Boundaries',       ['b. ʿErub.']),
    ('pesachim',     'Pesachim',      'Pesachim',      'Passover',                 ['b. Pesaḥ.']),
    ('rosh-hashanah','Rosh Hashanah', 'Rosh Hashanah', 'The New Year',             ['b. Roš Haš.']),
    ('yoma',         'Yoma',          'Yoma',          'The Day of Atonement',     ['b. Yoma']),
    ('sukkah',       'Sukkah',        'Sukkah',        'The Booth',                ['b. Sukkah']),
    ('beitzah',      'Beitzah',       'Beitzah',       'The Egg',                  ['b. Beṣah']),
    ('taanit',       'Taanit',        'Taanit',        'Fasts',                    ['b. Taʿan.']),
    ('megillah',     'Megillah',      'Megillah',      'The Scroll of Esther',     ['b. Meg.']),
    ('moed-katan',   'Moed Katan',    'Moed Katan',    'The Minor Festival',       ['b. Moʾed Qaṭ.', 'b. Moʾed Qaṭan']),
    ('chagigah',     'Chagigah',      'Chagigah',      'The Festival Offering',    ['b. Ḥag.']),
    ('yevamot',      'Yevamot',       'Yevamot',       'Levirate Marriages',       ['b. Yebam.', 'b. Yeb.']),
    ('ketubot',      'Ketubot',       'Ketubot',       'Marriage Contracts',       ['b. Ketub.']),
    ('nedarim',      'Nedarim',       'Nedarim',       'Vows',                     ['b. Ned.']),
    ('nazir',        'Nazir',         'Nazir',         'The Nazirite',             ['b. Naz.']),
    ('sotah',        'Sotah',         'Sotah',         'The Suspected Adulteress', ['b. Soṭah']),
    ('gittin',       'Gittin',        'Gittin',        'Bills of Divorce',         ['b. Giṭ.']),
    ('kiddushin',    'Kiddushin',     'Kiddushin',     'Betrothals',               ['b. Qidd.']),
    ('bava-kamma',   'Bava Kamma',    'Bava Kamma',    'The First Gate',           ['b. B. Qam.']),
    ('bava-metzia',  'Bava Metzia',   'Bava Metzia',   'The Middle Gate',          ['b. B. Meṣiʿa']),
    ('bava-batra',   'Bava Batra',    'Bava Batra',    'The Last Gate',            ['b. B. Bat.', 'b. B. Batr.']),
    ('sanhedrin',    'Sanhedrin',     'Sanhedrin',     'The Court',                ['b. Sanh.']),
    ('makkot',       'Makkot',        'Makkot',        'Lashes',                   ['b. Mak.']),
    ('shevuot',      'Shevuot',       'Shevuot',       'Oaths',                    ['b. Šebu.']),
    ('avodah-zarah', 'Avodah Zarah',  'Avodah Zarah',  'Idolatry',                 ['b. ʿAbod. Zar.']),
    ('horayot',      'Horayot',       'Horayot',       'Rulings',                  ['b. Hor.']),
    ('zevachim',     'Zevachim',      'Zevachim',      'Animal Sacrifices',        ['b. Zebaḥ.']),
    ('menachot',     'Menachot',      'Menachot',      'Meal Offerings',           ['b. Menaḥ.']),
    ('chullin',      'Chullin',       'Chullin',       'Non-Consecrated Animals',  ['b. Ḥul.']),
    ('bekhorot',     'Bekhorot',      'Bekhorot',      'Firstborns',               ['b. Bek.']),
    ('arakhin',      'Arakhin',       'Arakhin',       'Valuations',               ['b. ʿArak.']),
    ('temurah',      'Temurah',       'Temurah',       'Substitution',             ['b. Temurah']),
    ('keritot',      'Keritot',       'Keritot',       'Excisions',                ['b. Ker.']),
    ('meilah',       'Meilah',        'Meilah',        'Sacrilege',                ['b. Meʿil.']),
    ('tamid',        'Tamid',         'Tamid',         'The Daily Offering',       ['b. Tamid']),
    ('niddah',       'Niddah',        'Niddah',        'The Menstruant',           ['b. Nid.']),
]

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def daf_label(index: int) -> str:
    """Array index → the daf as it is cited. 0 → '1a', 2 → '2a', 3 → '2b'."""
    return f'{index // 2 + 1}{"a" if index % 2 == 0 else "b"}'


class _Stripper(HTMLParser):
    """Plain text of one line. The Wikisource text marks the Mishnah's opening words with
    <big><strong>, and carries the occasional <br>; none of it survives into our shape."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []

    def handle_data(self, data):
        self.out.append(data)

    def handle_starttag(self, tag, attrs):
        if tag in ('br', 'p'):
            self.out.append(' ')

    def text(self) -> str:
        return ''.join(self.out)


def clean(s: str) -> str:
    p = _Stripper()
    p.feed(s)
    return re.sub(r'\s+', ' ', html.unescape(p.text())).strip()


def fetch(index: str, no_cache: bool):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (index.replace(' ', '_') + '.json')
    if cached.exists() and not no_cache:
        raw = cached.read_bytes()
    else:
        url = API + urllib.parse.quote(index) + '?version=hebrew|' + urllib.parse.quote(VERSION)
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        raw = urllib.request.urlopen(req, timeout=120, context=_ctx).read()
        cached.write_bytes(raw)
        time.sleep(0.4)
    payload = json.loads(raw)
    versions = payload.get('versions') or []
    if not versions:
        raise SystemExit(f'{index}: Sefaria returned no "{VERSION}" version')
    # Guard the licence at build time, as the Yerushalmi build does: if this text is ever
    # re-licensed, stop rather than quietly embedding something we may not ship.
    lic = versions[0].get('license')
    if lic != 'CC-BY-SA':
        raise SystemExit(f'{index}: expected a CC-BY-SA version, Sefaria reports {lic!r}')
    return versions[0].get('text') or []


def build_work(slug, index, name, gloss, abbrevs, no_cache):
    dapim = fetch(index, no_cache)
    chapters = []
    for i, lines in enumerate(dapim):
        if not isinstance(lines, list):
            continue
        verses = [{'number': n, 'greek': t}
                  for n, t in ((n, clean(x)) for n, x in enumerate(lines, start=1) if isinstance(x, str))
                  if t]
        # 1a and 1b are empty in every tractate — a Talmud opens at 2a.
        if verses:
            chapters.append({'number': i + 1, 'verses': verses})
    doc = {'work': f'b. {name}', 'attribution': ATTRIB, 'greek': True, 'chapters': chapters}
    path = OUT_DIR / f'{slug}.json'
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return {'slug': slug, 'name': name, 'gloss': gloss, 'abbrevs': abbrevs,
            'chapters': [c['number'] for c in chapters],
            'lines': sum(len(c['verses']) for c in chapters),
            'kb': round(path.stat().st_size / 1024), 'doc': doc}


# "b. Ber. 28b" → the chapter number that daf lives at.
def chapter_of(daf: int, side: str) -> int:
    return (daf - 1) * 2 + (2 if side == 'b' else 1)


def resolve(text, works):
    s = re.sub(r'^(cf\.|idem,)\s*', '', text.strip())
    for w in works:
        for ab in sorted(w['abbrevs'], key=len, reverse=True):
            m = re.match(re.escape(ab) + r'\s+(\d+)([ab])', s)
            if m:
                return (w['slug'], chapter_of(int(m.group(1)), m.group(2)))
    return None


def validate(results):
    """Every "b. …" citation in the Backgrounds dataset should land on a daf we hold."""
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])
            if re.sub(r'^(cf\.|idem,)\s*', '', c['text'].strip()).startswith('b. ')]
    hit = miss = unmapped = 0
    misses = []
    for text in cits:
        r = resolve(text, results)
        if not r:
            unmapped += 1
            misses.append(('UNMAPPED', text))
            continue
        slug, ch = r
        if ch in by_slug[slug]['chapters']:
            hit += 1
        else:
            miss += 1
            misses.append((f'{slug} daf-chapter {ch} not held', text))
    print(f'\nValidation: {len(cits)} Bavli citations | resolved+found={hit} '
          f'resolved-but-missing={miss} unmapped={unmapped}')
    for why, text in misses[:25]:
        print(f'   MISS  {text:28s} -> {why}')


def registry(results):
    print('\n// paste into the BAVLI table in src/lib/prose-texts.ts')
    for r in results:
        note = 'Bav' + r['name'].replace(' ', '')
        abbrevs = ', '.join(f"'{a}'" for a in r['abbrevs'])
        last = r['chapters'][-1] if r['chapters'] else 0
        print(f"  {{ slug: 'b-{r['slug']}', name: 'b. {r['name']} ({r['gloss']})', "
              f"noteBook: '{note}', chapters: {last}, firstChapter: {r['chapters'][0] if r['chapters'] else 1}, "
              f"abbrevs: [{abbrevs}] }},")


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, index, name, gloss, abbrevs in BAVLI:
        r = build_work(slug, index, name, gloss, abbrevs, no_cache)
        results.append(r)
        last = daf_label(r['chapters'][-1] - 1) if r['chapters'] else '—'
        print(f'{slug:15s} dapim={len(r["chapters"]):3d} (to {last:>4s}) lines={r["lines"]:5d}  {r["kb"]:5d} KB')
    print(f'\n{len(results)} tractates | {sum(len(r["chapters"]) for r in results)} dapim | '
          f'{sum(r["lines"] for r in results)} lines | '
          f'{round(sum(r["kb"] for r in results) / 1024, 1)} MB total')
    validate(results)
    registry(results)


if __name__ == '__main__':
    main()
