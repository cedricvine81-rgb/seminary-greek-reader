# Builds the Jastrow dictionary index that powers click-to-look-up in the Talmud Bavli
# (public/data/jastrow.json.gz).
#
# Marcus Jastrow, "A Dictionary of the Targumim, the Talmud Babli and Yerushalmi, and the
# Midrashic Literature" (London: Luzac, 1903) — public domain, and still the standard English
# dictionary of Talmudic Aramaic. Sefaria hosts it and serves it through two APIs:
#   /api/words/completion/<prefix>/Jastrow Dictionary  → [[searchable form, headword], …]
#   /api/words/<headword>                              → the entry, with senses
#
# WHY A DICTIONARY AND NOT A PARSER. The Bavli text we ship (Wikisource Vilna) carries no
# morphology, and no licensable tagger for Talmudic Aramaic exists — it is a different dialect
# from the Biblical Aramaic of Daniel and Ezra, heavily abbreviated, and switches into Hebrew
# mid-sentence. A guessed parse shown with the confidence of our gold-tagged corpora would be
# worse than none. A dictionary entry is something Jastrow actually said, and where a form is
# ambiguous the reader is shown every candidate rather than one invented answer.
#
# Usage:  python3 scripts/build-jastrow.py   (caches every fetch under /tmp/jastrow, so it can
#         be interrupted and resumed; pass --no-cache to refetch). Run from the repo root.

import hashlib
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
import zlib
from html.parser import HTMLParser
from pathlib import Path

API = 'https://www.sefaria.org/api/words/'
COMPLETION = 'https://www.sefaria.org/api/words/completion/'
LEXICON = 'Jastrow Dictionary'
CACHE = Path('/tmp/jastrow')
OUT = Path('public/data/jastrow.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'
# Politeness: Sefaria serves this for free, and the whole dictionary is ~24k requests.
DELAY = 0.15
MAX_SENSES = 4
MAX_SENSE_CHARS = 700

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')

# Nikud, cantillation, and the punctuation Jastrow's headwords carry.
NIKUD = re.compile(r'[֑-ׇ]')
NON_LETTER = re.compile(r'[^א-ת]')
FINALS = str.maketrans('ךםןףץ', 'כמנפצ')


def normalize(s: str) -> str:
    """A form reduced to bare consonants, finals folded — how forms are matched."""
    return NON_LETTER.sub('', NIKUD.sub('', s or '')).translate(FINALS)


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []

    def handle_data(self, d):
        self.out.append(d)

    def text(self):
        return re.sub(r'\s+', ' ', ''.join(self.out)).strip()


def strip_html(s: str) -> str:
    p = _Text()
    p.feed(s or '')
    return p.text()


def fetch(url: str, key: str, no_cache: bool):
    CACHE.mkdir(parents=True, exist_ok=True)
    # Hash the key: the keys are Hebrew, and sanitising them to ASCII collapsed every one of
    # them onto the same filename — all 22 letters came back with alef's entries.
    f = CACHE / (hashlib.md5(key.encode('utf-8')).hexdigest() + '.json')
    if f.exists() and not no_cache:
        try:
            return json.loads(f.read_bytes())
        except Exception:
            pass
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        raw = urllib.request.urlopen(req, timeout=45, context=_ctx).read()
    except Exception:
        return None
    f.write_bytes(raw)
    time.sleep(DELAY)
    try:
        return json.loads(raw)
    except Exception:
        return None


def senses_of(entry) -> list:
    """Jastrow's definitions for one entry, flattened and de-marked-up."""
    out = []

    def walk(node):
        if len(out) >= MAX_SENSES:
            return
        if isinstance(node, list):
            for n in node:
                walk(n)
        elif isinstance(node, dict):
            d = strip_html(node.get('definition') or '')
            if d:
                out.append(d[:MAX_SENSE_CHARS])
            walk(node.get('senses'))

    walk((entry.get('content') or {}).get('senses'))
    return out


def main():
    no_cache = '--no-cache' in sys.argv

    # 1. Every searchable form and the headword it belongs to.
    forms: dict[str, set] = {}
    headwords: set = set()
    for L in LETTERS:
        rows = fetch(f'{COMPLETION}{urllib.parse.quote(L)}/{urllib.parse.quote(LEXICON)}?limit=9000',
                     f'completion_{L}', no_cache) or []
        for row in rows:
            if not isinstance(row, list) or len(row) < 2:
                continue
            form, hw = row[0], row[1]
            n = normalize(form)
            if not n or not hw:
                continue
            forms.setdefault(n, set()).add(hw)
            headwords.add(hw)
        print(f'  {L}: {len(rows):5d} rows | forms so far {len(forms):6d}', flush=True)

    print(f'\n{len(headwords)} headwords, {len(forms)} distinct searchable forms')

    # 2. Each headword's senses.
    entries: dict[str, dict] = {}
    missing = 0
    for i, hw in enumerate(sorted(headwords), start=1):
        d = fetch(f'{API}{urllib.parse.quote(hw)}?lexicon={urllib.parse.quote(LEXICON)}',
                  f'hw_{hw}', no_cache)
        if not d:
            missing += 1
            continue
        for e in d:
            if e.get('parent_lexicon') != LEXICON or e.get('headword') != hw:
                continue
            s = senses_of(e)
            if not s:
                continue
            rec = {'s': s}
            # Jastrow labels the part of speech in his own terms ("m.", "f.", "v.").
            morph = strip_html(((e.get('content') or {}).get('morphology')) or '')
            if morph:
                rec['m'] = morph[:60]
            entries[hw] = rec
            break
        if i % 500 == 0:
            print(f'  {i}/{len(headwords)} entries fetched ({len(entries)} with senses)', flush=True)

    # 3. Drop forms whose headwords all turned out to have no usable entry.
    index = {}
    for form, hws in forms.items():
        keep = [h for h in sorted(hws) if h in entries]
        if keep:
            index[form] = keep

    doc = {
        'attribution': ('Marcus Jastrow, A Dictionary of the Targumim, the Talmud Babli and '
                        'Yerushalmi, and the Midrashic Literature (London: Luzac, 1903) — public '
                        'domain. Source: Sefaria (sefaria.org).'),
        'entries': entries,
        'forms': index,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    # Written uncompressed: the browser fetches this directly and the CDN gzips it in transit
    # (3.4 MB over the wire). A .gz in public/ would arrive still compressed, since a static
    # host sets Content-Type from the extension and no Content-Encoding.
    OUT.write_bytes(json.dumps(doc, ensure_ascii=False).encode('utf-8'))
    print(f'\n{OUT}: {len(entries)} entries · {len(index)} forms · '
          f'{OUT.stat().st_size / 1024 / 1024:.1f} MB'
          + (f' · {missing} headwords failed to fetch' if missing else ''))


if __name__ == '__main__':
    main()
