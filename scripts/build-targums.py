# Fetches the public-domain Aramaic-Targum translations that the Backgrounds cross-reference
# dataset cites most — Targum Isaiah (C. W. H. Pauli, 1871) and Targum Pseudo-Jonathan on the
# Pentateuch (J. W. Etheridge, 1862) — from the Sefaria API and writes each into the shared
# prose chapter -> verse JSON shape (public/data/targums/<slug>.json), the same shape the
# rest of the embedded prose corpus uses (see src/lib/prose-texts.ts).
#
# Sefaria serves these as its DEFAULT English versions (both public domain), with the text as
# a [chapter][verse] array aligned to the Masoretic chapter:verse numbering the dataset cites
# ("Tg. Isa. 6:9", "Tg. Ps.-J. Gen 3:15"). Targum Onkelos is deferred: Sefaria only carries a
# modern (CC-BY-NC) Onkelos English, not a public-domain one.
#
# Usage:  python3 scripts/build-targums.py   (fetches over HTTPS, caching under /tmp; pass
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

API = 'https://www.sefaria.org/api/texts/'
CACHE = Path('/tmp/targums')
OUT_DIR = Path('public/data/targums')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
PAULI = 'Text: C. W. H. Pauli’s translation of the Targum on Isaiah (“The Chaldee Paraphrase”, 1871), public domain. Source: Sefaria (sefaria.org).'
ETHERIDGE = 'Text: J. W. Etheridge’s translation of Targum Pseudo-Jonathan (1862), public domain. Source: Sefaria (sefaria.org).'

# slug, display name, noteBook, Sefaria index, citation abbreviation, attribution.
TARGUMS = [
    ('tg-isaiah',       'Targum Isaiah',                     'TgIsa',  'Targum Jonathan on Isaiah',      'Tg. Isa.',        PAULI),
    ('tg-psj-genesis',  'Targum Pseudo-Jonathan (Genesis)',  'TgPsJGen','Targum Jonathan on Genesis',     'Tg. Ps.-J. Gen',  ETHERIDGE),
    ('tg-psj-exodus',   'Targum Pseudo-Jonathan (Exodus)',   'TgPsJExod','Targum Jonathan on Exodus',      'Tg. Ps.-J. Exod', ETHERIDGE),
    ('tg-psj-leviticus','Targum Pseudo-Jonathan (Leviticus)','TgPsJLev','Targum Jonathan on Leviticus',   'Tg. Ps.-J. Lev',  ETHERIDGE),
    ('tg-psj-numbers',  'Targum Pseudo-Jonathan (Numbers)',  'TgPsJNum','Targum Jonathan on Numbers',     'Tg. Ps.-J. Num',  ETHERIDGE),
    ('tg-psj-deuteronomy','Targum Pseudo-Jonathan (Deuteronomy)','TgPsJDeut','Targum Jonathan on Deuteronomy','Tg. Ps.-J. Deut',ETHERIDGE),
]

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def fetch(index: str, no_cache: bool) -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (index.replace(' ', '_') + '.json')
    if cached.exists() and not no_cache:
        return json.loads(cached.read_text())
    url = API + urllib.parse.quote(index) + '?context=0&pad=0'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=45, context=_ctx).read()
    cached.write_bytes(data)
    time.sleep(0.4)
    return json.loads(data)


def clean(s: str) -> str:
    s = html.unescape(s)                     # &lt;mymr'&gt; → <mymr'>, &amp; → & …
    # Strip real HTML tags (italics, footnote sup, line breaks, …).
    s = re.sub(r'</?(?:i|b|u|em|strong|sup|sub|br|span|a|small|big|p|div)(?:\s[^>]*)?>', ' ', s, flags=re.I)
    # What's left in angle brackets is Etheridge's Aramaic transliteration glosses
    # (e.g. "the Word <mymr'>") — keep them, in parentheses, rather than as stray tags.
    s = re.sub(r'<\s*([^<>]+?)\s*>', r'(\1)', s)
    return re.sub(r'\s+', ' ', s).strip()


def build_work(slug, name, note_book, index, abbrev, attribution, no_cache):
    doc_json = fetch(index, no_cache)
    text = doc_json.get('text') or []
    chapters = []
    for ci, verses in enumerate(text, start=1):
        out = []
        for vi, v in enumerate(verses, start=1):
            t = clean(v) if isinstance(v, str) else ''
            if t:
                out.append({'number': vi, 'text': t})
        if out:
            chapters.append({'number': ci, 'verses': out})
    doc = {'work': name, 'attribution': attribution, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    nums = [c['number'] for c in chapters]
    return {'slug': slug, 'abbrev': abbrev, 'chapters': len(chapters), 'maxch': nums[-1] if nums else 0,
            'verses': sum(len(c['verses']) for c in chapters), 'doc': doc}


def resolve(text, works):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    # Longest abbrev first so "Tg. Ps.-J. Gen" wins before any shorter prefix.
    for w in sorted(works, key=lambda w: -len(w['abbrev'])):
        m = re.match(re.escape(w['abbrev']) + r'\s+(\d+)[:.](\d+)', s)
        if m:
            return (w['slug'], int(m.group(1)), int(m.group(2)))
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    abbrs = tuple(r['abbrev'] for r in results)
    cits = []
    for e in data['entries']:
        for c in e.get('citations', []):
            if re.sub(r'^cf\.\s*', '', c['text'].strip()).startswith(abbrs):
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
        found = chap and any(vv['number'] == v for vv in chap['verses'])
        if found: hit += 1
        else: miss += 1; misses.append((f'{slug} {ch}:{v} not in text', text))
    print(f'\nValidation: {len(cits)} Targum citations (embedded works) | resolved+found={hit} '
          f'resolved-but-missing={miss} unmapped={unmapped}')
    for why, text in misses:
        print(f'   MISS  {text:34s} -> {why}')


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, name, note_book, index, abbrev, attribution in TARGUMS:
        r = build_work(slug, name, note_book, index, abbrev, attribution, no_cache)
        results.append(r)
        print(f'{slug:22s} chapters={r["chapters"]:3d} (max {r["maxch"]:3d}) verses={r["verses"]:5d}')
    validate(results)


if __name__ == '__main__':
    main()
