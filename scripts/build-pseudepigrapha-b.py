# Builds remaining public-domain Pseudepigrapha ("Group B") for the Texts library from clean
# HTML editions, mirrored through the Wayback Machine (the live sacred-texts.com is behind
# Cloudflare). Two works whose PD source *and* citation versification line up:
#
#   * Pseudo-Philo, Liber Antiquitatum Biblicarum (L.A.B.) — tr. M. R. James, "The Biblical
#     Antiquities of Philo" (1917, public domain). Source: sacred-texts.com/bib/bap/ —
#     one HTML page per chapter (I–LXV), verses numbered inline (chapter numeral = v1).
#   * Odes of Solomon — tr. J. Rendel Harris, as reprinted in "The Forgotten Books of Eden"
#     (Platt, 1926, public domain). Source: sacred-texts.com/bib/fbe/ — one page per Ode,
#     verses numbered at line starts.
#
# (Ahiqar is deliberately excluded: it is cited by the continuous Aramaic saying-numbers of
# the Lindenberger/OTP edition, which is copyrighted; the PD Syriac "Story of Ahikar" uses an
# unrelated chapter:verse scheme, so it cannot be embedded accurately from a PD source. The
# Testament of Moses and Ascension of Isaiah — R. H. Charles editions — are handled separately.)
#
# Output: public/data/pseudepigrapha-b/<slug>.json in the prose shape
#   { work, attribution, chapters:[{ number, verses:[{ number, text }] }] }
#
# Usage:  python3 scripts/build-pseudepigrapha-b.py   (run from the repo root; caches raw HTML
#         under /tmp/pseudb_cache). Prints a validation report against backgrounds-crossrefs.json.

import json
import re
import ssl
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET  # noqa: F401 (kept for parity; not used)
from pathlib import Path

CACHE = Path('/tmp/pseudb_cache'); CACHE.mkdir(parents=True, exist_ok=True)
OUT_DIR = Path('public/data/pseudepigrapha-b')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1'
WB = 'http://web.archive.org/web/{ts}id_/http://www.sacred-texts.com/bib/{sub}/{page}.htm'
CDX = ('http://web.archive.org/cdx/search/cdx?url=sacred-texts.com/bib/{sub}/{page}.htm'
       '&output=text&fl=timestamp&filter=statuscode:200&filter=mimetype:text/html&limit=1')

ATTRIB_LAB = ('Pseudo-Philo, Liber Antiquitatum Biblicarum, tr. M. R. James, "The Biblical '
              'Antiquities of Philo" (SPCK, 1917); public domain. Digitised by sacred-texts.com.')
ATTRIB_ODES = ('Odes of Solomon, tr. J. Rendel Harris, from "The Forgotten Books of Eden" '
               '(R. H. Platt, 1926); public domain. Digitised by sacred-texts.com.')
ATTRIB_ASC = ('Ascension of Isaiah, tr. R. H. Charles (1900); public domain. '
              'Text via earlychristianwritings.com.')
ASC_URL = 'http://www.earlychristianwritings.com/text/ascension.html'

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def _http(url, timeout=45):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for c in (_ctx, ssl._create_unverified_context()):
        try:
            return urllib.request.urlopen(req, timeout=timeout, context=c).read().decode('utf-8', 'replace')
        except ssl.SSLError:
            continue
    # last attempt raises
    return urllib.request.urlopen(req, timeout=timeout, context=_ctx).read().decode('utf-8', 'replace')


def fetch(sub, page):
    """Fetch a sacred-texts page via the Wayback Machine, cached, with backoff on 503/refusal."""
    cached = CACHE / f'{sub}_{page}.html'
    if cached.exists() and cached.stat().st_size > 300:
        return cached.read_text(encoding='utf-8', errors='replace')
    # resolve a snapshot timestamp
    ts = ''
    for attempt in range(6):
        try:
            ts = _http(CDX.format(sub=sub, page=page), timeout=30).strip().split('\n')[0].strip()
            if ts:
                break
        except Exception:
            pass
        time.sleep(2 + attempt * 2)
    if not ts:
        raise RuntimeError(f'no snapshot for {sub}/{page}')
    last = None
    for attempt in range(6):
        try:
            html = _http(WB.format(ts=ts, sub=sub, page=page), timeout=45)
            if len(html) > 300:
                cached.write_text(html, encoding='utf-8')
                time.sleep(0.8)
                return html
        except Exception as e:
            last = e
        time.sleep(3 + attempt * 3)
    raise RuntimeError(f'fetch failed {sub}/{page}: {last}')


# ── HTML cleaning helpers ────────────────────────────────────────────────────
def strip_html(s):
    s = re.sub(r'(?is)<table\b.*?</table>', ' ', s)               # right-margin cross-refs
    s = re.sub(r'(?is)<a\b[^>]*name=["\']?(?:page|fr|fn)[^>]*>.*?</a>', ' ', s)  # page/footnote anchors
    s = re.sub(r'(?is)<a\b[^>]*href=["\']?#fn[^>]*>.*?</a>', ' ', s)  # footnote refs
    s = re.sub(r'(?is)<[^>]+>', ' ', s)                          # remaining tags
    s = (s.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&mdash;', '—')
           .replace('&aacute;', 'á').replace('&acirc;', 'â').replace('&ecirc;', 'ê')
           .replace('&icirc;', 'î').replace('&ocirc;', 'ô').replace('&ucirc;', 'û')
           .replace('&eacute;', 'é').replace('&egrave;', 'è').replace('&auml;', 'ä')
           .replace('&ouml;', 'ö').replace('&uuml;', 'ü').replace('&rsquo;', '’')
           .replace('&lsquo;', '‘').replace('&hellip;', '…'))
    s = re.sub(r'&#\d+;', ' ', s)                    # numeric entities (footnote daggers, …)
    s = re.sub(r'&[a-z]+;', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+([,.;:!?])', r'\1', s)           # tidy spaces left by stripped footnote marks
    return s.strip()


ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
def roman_to_int(r):
    r = r.upper(); t = 0; p = 0
    for ch in reversed(r):
        v = ROMAN[ch]; t += v if v >= p else -v; p = v
    return t


def body_of(html):
    body = re.sub(r'(?is)<head.*?</head>', '', html)
    # keep only the content between the top nav rule and the bottom nav rule
    return body


# ── Pseudo-Philo (L.A.B.) ────────────────────────────────────────────────────
# Each bap page carries one chapter under an <H3>CHAPTER n</H3>, but James's edition also
# runs some short chapters straight on within the previous chapter's page, marked only by an
# inline Roman numeral at the start of a paragraph (e.g. "…Phadahel. XLIII. And it came to
# pass…"). So we walk the whole work paragraph-by-paragraph, tracking the running chapter:
# a paragraph led by a Roman numeral equal to the current chapter is its verse 1, and one
# equal to current+1 opens the next chapter (verse 1). Arabic "N." marks verse N.
ROMAN_RE = re.compile(r'^([IVXLCDM]+)\.\s+(.*)$')
ARABIC_RE = re.compile(r'^(\d+)\.\s+(.*)$')


# Both the chapter numeral (verse 1) and the arabic verse numbers appear INLINE in the running
# text — several verses share one <P>, and short chapters (43, 47) run straight on inside the
# previous chapter's paragraph. James's edition is also inconsistent about the full stop after a
# chapter numeral (e.g. "XXIX And after…" has none). So concatenate the whole work into one
# stream (headings + footnotes dropped) and walk it deterministically: at each step look for the
# *specific* next chapter numeral (Roman, trailing "." optional, followed by a capital) and the
# *specific* next verse number (arabic, "." required), and take whichever occurs first.
PARA_RE = re.compile(r'(?is)<p\b[^>]*>(.*?)</p>')
ROMAN_TABLE = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'),
               (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]


def int_to_roman(num):
    out = ''
    for val, sym in ROMAN_TABLE:
        while num >= val:
            out += sym; num -= val
    return out


H3_RE = re.compile(r'(?is)<h3[^>]*>\s*CHAPTER\s+([IVXLCDM]+)\.?\s*</h3>')


def build_lab():
    # Concatenate the whole work, keeping each <H3>CHAPTER n</H3> as a sentinel \x02n\x02 (the
    # authoritative chapter boundary — reliable even where the inline numeral drops its stop),
    # then walk the stream taking the earliest of: the next chapter sentinel, the next folded
    # chapter's inline Roman numeral (chs 43 & 47 have no <H3>), or the next verse number.
    chunks = []
    for n in range(17, 80):                      # bap17 = ch I … bap79 = ch LXV
        html = fetch('bap', f'bap{n:02d}')
        body = re.split(r'(?is)<h3[^>]*>\s*Footnotes', body_of(html))[0]
        body = H3_RE.sub(lambda m: f' \x02{roman_to_int(m.group(1))}\x02 ', body)
        for m in re.finditer(r'\x02\d+\x02|<p\b[^>]*>(.*?)</p>', body, re.S | re.I):
            if m.group(0).startswith('\x02'):
                chunks.append(m.group(0))
            else:
                t = strip_html(m.group(1) or '').replace('[paragraph continues]', '').strip()
                if t:
                    chunks.append(t)
    text = ' ' + re.sub(r'[^\S\x02]+', ' ', ' '.join(chunks))

    chapters = {}
    cur_ch, cur_v = 0, 0
    pos = seg = 0
    while True:
        sm = re.compile(r'\x02(\d+)\x02').search(text, pos)            # next H3 chapter
        cm = re.compile(rf'(?<!\S){int_to_roman(cur_ch + 1)}\.?\s+(?=[A-Z])').search(text, pos) if cur_ch else None
        vm = re.compile(rf'(?<!\S){cur_v + 1}\.\s+').search(text, pos) if cur_ch else None
        cands = [c for c in ((sm, 's'), (cm, 'c'), (vm, 'v')) if c[0]]
        if not cands:
            if cur_ch:
                chapters.setdefault(cur_ch, {})[cur_v] = text[seg:].strip()
            break
        mm, kind = min(cands, key=lambda c: c[0].start())
        if cur_ch:
            chapters.setdefault(cur_ch, {})[cur_v] = text[seg:mm.start()].strip()
        if kind == 'v':
            cur_v += 1
            seg = mm.end()
        elif kind == 'c':
            cur_ch, cur_v = cur_ch + 1, 1
            seg = mm.end()
        else:                                                          # sentinel: strip its numeral
            cur_ch, cur_v = int(mm.group(1)), 1
            after = re.match(rf'\s*{int_to_roman(cur_ch)}\.?\s+', text[mm.end():])
            seg = mm.end() + (after.end() if after else 0)
        pos = seg
    return finalize('pseudo-philo', 'Pseudo-Philo, Biblical Antiquities (L.A.B.)',
                    ATTRIB_LAB, chapters)


# ── Odes of Solomon ──────────────────────────────────────────────────────────
def build_odes():
    chapters = {}
    for n in range(195, 237):                    # fbe195 … fbe236 span the Odes (3–42)
        page = f'fbe{n:03d}'
        try:
            html = fetch('fbe', page)
        except Exception:
            continue
        body = body_of(html)
        parts = re.split(r'(?is)<h3[^>]*>\s*ODE\s+(\d+)\.?\s*</h3>', body)
        for i in range(1, len(parts), 2):
            ode = int(parts[i])
            seg = re.split(r'(?is)Next:', parts[i + 1])[0]
            verses = parse_ode_verses(seg)
            if not verses:
                # A lost Ode (e.g. Ode 2) carries only an editorial note; keep it as verse 1 so
                # the chapter sequence stays contiguous for the reader.
                note = strip_html(seg).strip() or 'This Ode has not survived.'
                verses = {1: note}
            chapters[ode] = verses
    return finalize('odes-of-solomon', 'Odes of Solomon', ATTRIB_ODES, chapters)


def parse_ode_verses(seg):
    # Verses are numbered at line starts; lines separated by <BR>. Some odes were lost —
    # a parenthetical "(No part of this Ode …)" note and no numbers → skip.
    seg = re.sub(r'(?is)<table\b.*?</table>', ' ', seg)
    lines = re.split(r'(?is)<br\s*/?>|</p>', seg)
    verses = {}
    cur = None
    for ln in lines:
        text = strip_html(ln)
        if not text:
            continue
        m = re.match(r'^(\d+)\s+(.*)$', text)
        if m:
            cur = int(m.group(1)); verses[cur] = m.group(2).strip()
        elif cur is not None:
            verses[cur] = (verses[cur] + ' ' + text).strip()
    # strip trailing "Hallelujah." editorial? keep it — it's part of the ode.
    return verses


# ── Ascension of Isaiah (incl. the Martyrdom of Isaiah, chs 1–5) ─────────────
def build_ascension():
    cached = CACHE / 'ascension.html'
    if cached.exists() and cached.stat().st_size > 1000:
        html = cached.read_text(encoding='utf-8', errors='replace')
    else:
        html = _http(ASC_URL, timeout=40)
        cached.write_text(html, encoding='utf-8')
    body = re.sub(r'(?is)<head.*?</head>', '', html)
    parts = re.split(r'(?is)<p>\s*CHAPTER\s+(\d+)\s*</p>', body)
    chapters = {}
    for i in range(1, len(parts), 2):
        ch = int(parts[i])
        seg = parts[i + 1]
        blocks = re.split(r'(?is)<p>', seg)
        verses = {}
        cur = None
        for b in blocks:
            if re.search(r'href=|copyright|Chronological|<script', b, re.I):
                break                                # reached the site's navigation footer
            text = strip_html(b)
            if not text:
                continue
            m = re.match(r'^(\d+)\.\s+(.*)$', text)
            if m:
                cur = int(m.group(1)); verses[cur] = m.group(2).strip()
            elif cur is None:
                cur = 1; verses[1] = text                 # unnumbered first para = v1
            else:
                verses[cur] = (verses[cur] + ' ' + text).strip()
        if verses:
            chapters[ch] = verses
    return finalize('ascension-of-isaiah', 'Ascension of Isaiah (with the Martyrdom of Isaiah)',
                    ATTRIB_ASC, chapters)


# ── shared finalize + validation ─────────────────────────────────────────────
def finalize(slug, name, attribution, chapters):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = {'work': name, 'attribution': attribution, 'chapters': [
        {'number': ch, 'verses': [{'number': v, 'text': chapters[ch][v]}
                                  for v in sorted(chapters[ch])]}
        for ch in sorted(chapters)]}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    nverses = sum(len(c['verses']) for c in doc['chapters'])
    print(f'{slug:20s} chapters={len(doc["chapters"]):3d} verses={nverses:4d}')
    return {'slug': slug, 'doc': doc}


def validate(results):
    by_slug = {r['slug']: r['doc'] for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])]
    tests = [
        ('pseudo-philo', re.compile(r'L\.?A\.?B\.?\s+(\d+):(\d+)')),
        ('odes-of-solomon', re.compile(r'Odes?\s+Sol\.?\s+(\d+):(\d+)')),
        ('ascension-of-isaiah', re.compile(r'Mart\.?\s*Isa\.?\s+(\d+):(\d+)')),
    ]
    for slug, pat in tests:
        doc = by_slug.get(slug)
        hit = miss = 0; misses = []
        for text in cits:
            m = pat.search(text)
            if not m:
                continue
            ch, v = int(m.group(1)), int(m.group(2))
            chap = doc and next((c for c in doc['chapters'] if c['number'] == ch), None)
            if chap and any(vv['number'] == v for vv in chap['verses']):
                hit += 1
            else:
                miss += 1; misses.append((text, f'{ch}:{v}'))
        print(f'  {slug}: hit={hit} miss={miss}')
        for t, r in misses[:20]:
            print(f'     MISS {t}  ({r})')


def main():
    results = []
    if '--odes-only' not in sys.argv:
        results.append(build_lab())
    if '--lab-only' not in sys.argv:
        results.append(build_odes())
    if '--lab-only' not in sys.argv and '--odes-only' not in sys.argv:
        results.append(build_ascension())
    validate(results)


if __name__ == '__main__':
    main()
