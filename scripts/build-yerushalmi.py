# Fetches the Jerusalem Talmud (Talmud Yerushalmi) — all 39 tractates — in Heinrich
# Guggenheimer's translation and commentary (de Gruyter, 1999-2015), which Sefaria carries
# under CC-BY, and writes each into the shared prose chapter -> verse JSON shape
# (public/data/yerushalmi/<slug>.json).
#
# CC-BY, not CC-BY-NC: the Yerushalmi is the one Talmud we can ship. The Bavli's only good
# English (Koren-Steinsaltz, the William Davidson edition) is CC-BY-NC, which a paid app
# cannot use; its Aramaic (Wikisource, CC-BY-SA) is available if we ever want text-only.
#
# STRUCTURE. Sefaria stores the Yerushalmi three deep — Chapter / Halakhah / Segment — while
# our prose works are two deep, and scholarship cites it as "y. Ber. 1:1" = chapter:halakhah.
# So each halakhah becomes one verse, with its segments joined. Citations then resolve at
# exactly the granularity they are written in, and the Venice folio some citations add
# ("y. Ber. 1:1 (3a)") is simply ignored by the matcher in prose-texts.ts.
#
# Guggenheimer's footnotes are part of the CC-BY text and are dropped here: they are dense
# text-critical apparatus keyed to his printed page, of no use in a reading pane.
#
# Usage:  python3 scripts/build-yerushalmi.py   (fetches over HTTPS, caching under /tmp;
#         pass --no-cache to force re-fetch). Run from the repo root. Prints a report and
#         validates against the Backgrounds cross-reference dataset.

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
VERSION = ('The Jerusalem Talmud, translation and commentary by Heinrich W. Guggenheimer. '
           'Berlin, De Gruyter, 1999-2015')
CACHE = Path('/tmp/yerushalmi')
OUT_DIR = Path('public/data/yerushalmi')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = ('Text: the Jerusalem Talmud, translation and commentary by Heinrich W. Guggenheimer '
          '(Berlin: De Gruyter, 1999-2015), CC-BY. Source: Sefaria (sefaria.org).')

# slug, display tractate name, English gloss, SBL citation abbreviation(s).
# The abbreviations are the Mishnah ones with a "y." prefix, since the cross-reference
# dataset cites both series the same way ("m. Ber. 1:1" / "y. Ber. 1:1").
YERUSHALMI = [
    ('berakhot',      'Berakhot',      'Blessings',                  ['y. Ber.']),
    ('peah',          'Peah',          'Corner of the Field',        ['y. Peʾah']),
    ('demai',         'Demai',         'Doubtfully Tithed Produce',  ['y. Demai']),
    ('kilayim',       'Kilayim',       'Mixed Kinds',                ['y. Kilʾayim', 'y. Kil.']),
    ('sheviit',       'Sheviit',       'The Sabbatical Year',        ['y. Šeb.']),
    ('terumot',       'Terumot',       'Heave Offerings',            ['y. Terumot', 'y. Ter.']),
    ('maasrot',       'Maasrot',       'Tithes',                     ['y. Maʿaś.']),
    ('maaser-sheni',  'Maaser Sheni',  'The Second Tithe',           ['y. Maʿaś. Š.']),
    ('challah',       'Challah',       'Dough Offering',             ['y. Ḥal.']),
    ('orlah',         'Orlah',         'Fruit of Young Trees',       ['y. ʿOrlah']),
    ('bikkurim',      'Bikkurim',      'First Fruits',               ['y. Bik.']),
    ('shabbat',       'Shabbat',       'Sabbath',                    ['y. Šabb.']),
    ('eruvin',        'Eruvin',        'Sabbath Boundaries',         ['y. ʿErub.']),
    ('pesachim',      'Pesachim',      'Passover',                   ['y. Pesaḥ.']),
    ('yoma',          'Yoma',          'The Day of Atonement',       ['y. Yoma']),
    ('shekalim',      'Shekalim',      'Shekels',                    ['y. Šeqal.']),
    ('sukkah',        'Sukkah',        'The Booth',                  ['y. Sukkah']),
    ('rosh-hashanah', 'Rosh Hashanah', 'The New Year',               ['y. Roš Haš.']),
    ('beitzah',       'Beitzah',       'The Egg',                    ['y. Beṣah']),
    ('taanit',        'Taanit',        'Fasts',                      ['y. Taʿan.']),
    ('megillah',      'Megillah',      'The Scroll of Esther',       ['y. Meg.']),
    ('chagigah',      'Chagigah',      'The Festival Offering',      ['y. Ḥag.']),
    ('moed-katan',    'Moed Katan',    'The Minor Festival',         ['y. Moʾed Qaṭ.']),
    ('yevamot',       'Yevamot',       'Levirate Marriages',         ['y. Yebam.', 'y. Yeb.']),
    ('sotah',         'Sotah',         'The Suspected Adulteress',   ['y. Soṭah']),
    ('ketubot',       'Ketubot',       'Marriage Contracts',         ['y. Ketub.']),
    ('nedarim',       'Nedarim',       'Vows',                       ['y. Ned.']),
    ('nazir',         'Nazir',         'The Nazirite',               ['y. Naz.']),
    ('gittin',        'Gittin',        'Bills of Divorce',           ['y. Giṭ.']),
    ('kiddushin',     'Kiddushin',     'Betrothals',                 ['y. Qidd.']),
    ('bava-kamma',    'Bava Kamma',    'The First Gate',             ['y. B. Qam.']),
    ('bava-metzia',   'Bava Metzia',   'The Middle Gate',            ['y. B. Meṣiʿa']),
    ('bava-batra',    'Bava Batra',    'The Last Gate',              ['y. B. Bat.', 'y. B. Batr.']),
    ('sanhedrin',     'Sanhedrin',     'The Court',                  ['y. Sanh.']),
    ('shevuot',       'Shevuot',       'Oaths',                      ['y. Šebu.']),
    ('avodah-zarah',  'Avodah Zarah',  'Idolatry',                   ['y. ʿAbod. Zar.']),
    ('makkot',        'Makkot',        'Lashes',                     ['y. Mak.']),
    ('horayot',       'Horayot',       'Rulings',                    ['y. Hor.']),
    ('niddah',        'Niddah',        'The Menstruant',             ['y. Nid.']),
]

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def fetch(index: str, no_cache: bool):
    """The tractate's text as Sefaria stores it: chapter -> halakhah -> segment."""
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (index.replace(' ', '_') + '.json')
    if cached.exists() and not no_cache:
        raw = cached.read_bytes()
    else:
        url = API + urllib.parse.quote(index) + '?version=english|' + urllib.parse.quote(VERSION)
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        raw = urllib.request.urlopen(req, timeout=90, context=_ctx).read()
        cached.write_bytes(raw)
        time.sleep(0.4)
    payload = json.loads(raw)
    versions = payload.get('versions') or []
    if not versions:
        raise SystemExit(f'{index}: Sefaria returned no "{VERSION[:40]}…" version')
    # Guard the licence at build time: if Sefaria ever re-licenses this edition, the build
    # should stop rather than quietly embed something we may not ship.
    lic = versions[0].get('license')
    if lic != 'CC-BY':
        raise SystemExit(f'{index}: expected a CC-BY version, Sefaria reports {lic!r}')
    return versions[0].get('text') or []


def clean(s: str) -> str:
    # Guggenheimer's footnote markers are <sup> anchors; the notes themselves are separate
    # segments Sefaria wraps in <i>. Strip the markup, keep the text, squash the whitespace.
    s = re.sub(r'<sup[^>]*>.*?</sup>', ' ', s, flags=re.S)
    s = html.unescape(s)
    s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def build_work(slug, tractate, gloss, abbrevs, no_cache):
    text = fetch('Jerusalem Talmud ' + tractate, no_cache)
    chapters = []
    for ci, halakhot in enumerate(text, start=1):
        verses = []
        for hi, segments in enumerate(halakhot, start=1):
            # Depth 3 → 2: one halakhah is one verse, its segments joined. A tractate that
            # is only two deep (no per-halakhah segments) is handled by the isinstance check.
            if isinstance(segments, str):
                body = clean(segments)
            else:
                body = ' '.join(x for x in (clean(s) for s in segments if isinstance(s, str)) if x)
            if body:
                verses.append({'number': hi, 'text': body})
        if verses:
            chapters.append({'number': ci, 'verses': verses})
    doc = {'work': f'Jerusalem Talmud {tractate}', 'attribution': ATTRIB, 'chapters': chapters}
    path = OUT_DIR / f'{slug}.json'
    path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return {'slug': slug, 'tractate': tractate, 'gloss': gloss, 'abbrevs': abbrevs,
            'chapters': len(chapters), 'verses': sum(len(c['verses']) for c in chapters),
            'kb': round(path.stat().st_size / 1024), 'doc': doc}


def resolve(text, works):
    s = re.sub(r'^(cf\.|idem,)\s*', '', text.strip())
    for w in works:
        for ab in sorted(w['abbrevs'], key=len, reverse=True):
            m = re.match(re.escape(ab) + r'\s+(\d+)(?::(\d+))?', s)
            if m:
                return (w['slug'], int(m.group(1)), int(m.group(2)) if m.group(2) else None)
    return None


def validate(results):
    """Every "y. …" citation in the Backgrounds dataset should land on real text."""
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])
            if re.sub(r'^(cf\.|idem,)\s*', '', c['text'].strip()).startswith('y. ')]
    hit = miss = unmapped = 0
    misses = []
    for text in cits:
        r = resolve(text, results)
        if not r:
            unmapped += 1
            misses.append(('UNMAPPED', text))
            continue
        slug, ch, v = r
        doc = by_slug[slug]['doc']
        chap = next((c for c in doc['chapters'] if c['number'] == ch), None)
        if chap and (v is None or any(vv['number'] == v for vv in chap['verses'])):
            hit += 1
        else:
            miss += 1
            misses.append((f'{slug} {ch}:{v} missing', text))
    print(f'\nValidation: {len(cits)} Yerushalmi citations | resolved+found={hit} '
          f'resolved-but-missing={miss} unmapped={unmapped}')
    for why, text in misses:
        print(f'   MISS  {text:30s} -> {why}')


def registry(results):
    """The prose-texts.ts rows, so the registry can be pasted rather than retyped."""
    print('\n// paste into the YERUSHALMI table in src/lib/prose-texts.ts')
    for r in results:
        note = 'Yer' + r['tractate'].replace(' ', '')
        abbrevs = ', '.join(f"'{a}'" for a in r['abbrevs'])
        print(f"  {{ slug: 'y-{r['slug']}', name: 'y. {r['tractate']} ({r['gloss']})', "
              f"noteBook: '{note}', chapters: {r['chapters']}, abbrevs: [{abbrevs}] }},")


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, tractate, gloss, abbrevs in YERUSHALMI:
        r = build_work(slug, tractate, gloss, abbrevs, no_cache)
        results.append(r)
        print(f'{slug:15s} chapters={r["chapters"]:2d} halakhot={r["verses"]:4d}  {r["kb"]:5d} KB')
    print(f'\n{len(results)} tractates | {sum(r["chapters"] for r in results)} chapters | '
          f'{sum(r["verses"] for r in results)} halakhot | '
          f'{round(sum(r["kb"] for r in results) / 1024, 1)} MB total')
    validate(results)
    registry(results)


if __name__ == '__main__':
    main()
