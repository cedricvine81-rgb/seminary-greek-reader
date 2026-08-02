"""Build Clement of Alexandria (parallel Greek + English) for the Texts library.

Clement's four major works, 1,065 sections of Stromateis alone. The Greek needs BOTH Greek
repositories — no single one has all of it:
  · Protrepticus        First1KGreek tlg0555.tlg001 (12 chapters)
  · Paedagogus          First1KGreek tlg0555.tlg002 (book → chapter)
  · Stromateis          PerseusDL    tlg0555.tlg004 (book → chapter → section) — NOT in
                        First1KGreek, which is why both are fetched here
  · Quis dives salvetur First1KGreek tlg0555.tlg006 (42 chapters)

English: the Roberts–Donaldson translation (Ante-Nicene Fathers vol. 2, 1885), public domain,
from New Advent, whose chapter markup is clean ("<h2>Chapter N. …</h2>") — the same source and
reason as scripts/build-justin.py.

MODEL. The English divides to chapter and the Greek sometimes to section, so the CHAPTER is the
parallel unit throughout, as in scripts/build-eusebius-pe.py: one row holding the whole English
chapter beside the whole Greek chapter, with the Stromateis section numbers kept inline in the
Greek so "Strom. 1.5.28" is still findable on the page.

STROMATEIS BOOK 3 HAS NO ENGLISH. The ANF translators declined to render it, printing the Latin
of the 1715 Potter edition instead because of its subject matter (marriage and the sects'
sexual teaching), so New Advent's book-3 page is Latin under "Caput" headings. That book ships
as Greek alone rather than passing Latin off as the translation.

Output: public/data/clement/<slug>.json

Usage:  python3 scripts/build-clement.py [--no-cache]      (run from the repo root)
"""
import html
import json
import re
import ssl
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

PERSEUS = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0555/'
FIRST1K = 'https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0555/'
NEWADVENT = 'https://www.newadvent.org/fathers/{}.htm'
CACHE = Path('/tmp/clement')
OUT = Path('public/data/clement')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

GRC_ATTRIB = 'Greek: {}. English: the Roberts–Donaldson translation (Ante-Nicene Fathers, vol. 2, 1885), public domain, via newadvent.org. The English divides to chapter, so it stands beside the whole Greek chapter.'
F1K_CREDIT = 'ed. Stählin, via the First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0'
PERSEUS_CREDIT = 'ed. Dindorf, via the Perseus Digital Library, CC-BY-SA 4.0'
NO_ENGLISH = ('Greek only: the Ante-Nicene Fathers translators left this book untranslated, '
              'printing the Latin of Potter’s edition in its place, so there is no public-domain '
              'English to set beside it.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(url, name, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / name
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=120, context=_ctx).read()
    cached.write_bytes(data)
    time.sleep(0.4)
    return data


# ── Greek ────────────────────────────────────────────────────────────────────────────────
def strip_text(el):
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()


def edition(xml_bytes):
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    return ET.fromstring(xml).find('.//t:body/t:div', NS)


def flat_chapters(ed):
    """{chapter: text} for a work divided straight to chapter (Protrepticus, Quis dives)."""
    out = {}
    for c in ed.findall('t:div', NS):
        if (c.get('n') or '').isdigit():
            t = strip_text(c)
            if t:
                out[int(c.get('n'))] = t
    return out


def book_chapters(ed):
    """{book: {chapter: text}} for a book → chapter work (Paedagogus)."""
    out = {}
    for b in ed.findall('t:div', NS):
        if not (b.get('n') or '').isdigit():
            continue
        out[int(b.get('n'))] = {int(c.get('n')): strip_text(c)
                                for c in b.findall('t:div', NS)
                                if (c.get('n') or '').isdigit() and strip_text(c)}
    return out


def book_chapter_sections(ed):
    """{book: {chapter: joined text with section numbers inline}} (Stromateis)."""
    out = {}
    for b in ed.findall('t:div', NS):
        if not (b.get('n') or '').isdigit():
            continue
        chapters = {}
        for c in b.findall('t:div', NS):
            if not (c.get('n') or '').isdigit():
                continue
            secs = {int(s.get('n')): strip_text(s) for s in c.findall('t:div', NS)
                    if (s.get('n') or '').isdigit() and strip_text(s)}
            if not secs:
                t = strip_text(c)
                if t:
                    secs = {1: t}
            if not secs:
                continue
            order = sorted(secs)
            lead_is_one = order[0] == 1
            # As in build-eusebius-pe.py: the reader already prints "1" as the verse marker, so
            # only sections 2+ take an inline number.
            chapters[int(c.get('n'))] = ' '.join(
                (secs[s] if (i == 0 and lead_is_one) else f'{s} {secs[s]}')
                for i, s in enumerate(order))
        out[int(b.get('n'))] = chapters
    return out


# ── English (New Advent) ─────────────────────────────────────────────────────────────────
_H2 = re.compile(r'(?is)<h2>\s*Chapter\s+(\d+)\s*\.?(.*?)</h2>')


def newadvent_chapters(page, no_cache):
    """{chapter: text} from a New Advent page whose chapters are <h2>Chapter N. …</h2>."""
    raw = fetch(NEWADVENT.format(page), f'na-{page}.htm', no_cache).decode('utf-8', 'replace')
    marks = list(_H2.finditer(raw))
    out = {}
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(raw)
        chunk = raw[m.end():end]
        # New Advent closes each page with an "About this page" block and the site chrome.
        cut = re.search(r'(?is)<h2>\s*About this page', chunk)
        if cut:
            chunk = chunk[:cut.start()]
        chunk = re.sub(r'(?is)<(script|style|table|select)\b.*?</\1>', ' ', chunk)
        text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'(?s)<[^>]+>', ' ', chunk))).strip()
        if text:
            out[int(m.group(1))] = text
    return out


_ROMAN_SEC = re.compile(r'(?m)^\s*([IVXL]+)\s*\.\s+')


def quis_dives_chapters(no_cache):
    """{chapter: text} for Who is the Rich Man, whose New Advent page is one continuous text
    with the sections marked by a Roman numeral at the start of a paragraph."""
    raw = fetch(NEWADVENT.format('0207'), 'na-0207.htm', no_cache).decode('utf-8', 'replace')
    body = raw
    cut = re.search(r'(?is)<h2>\s*About this page', body)
    if cut:
        body = body[:cut.start()]
    body = re.sub(r'(?is)<(script|style|table|select)\b.*?</\1>', ' ', body)
    paras = re.split(r'(?is)</p>', body)
    out, cur = {}, None
    roman = {'I': 1, 'V': 5, 'X': 10, 'L': 50}
    def to_int(s):
        t = 0
        for i, ch in enumerate(s):
            v = roman[ch]
            t += -v if i + 1 < len(s) and v < roman[s[i + 1]] else v
        return t
    for p in paras:
        text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'(?s)<[^>]+>', ' ', p))).strip()
        if not text:
            continue
        m = re.match(r'^([IVXL]+)\s*\.\s+(.*)$', text)
        if m:
            cur = to_int(m.group(1))
            out[cur] = m.group(2)
        elif cur is not None:
            out[cur] += ' ' + text
    return out


# ── Assembly ─────────────────────────────────────────────────────────────────────────────
def write_work(slug, name, attrib, chapters_map, eng_map):
    """chapters_map / eng_map are {chapter: text}; a chapter with no English keeps its Greek."""
    chapters = [{'number': ch, 'verses': [
        {'number': 1, 'text': (eng_map or {}).get(ch, ''), 'greek': chapters_map[ch]}]}
        for ch in sorted(chapters_map)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': chapters}
    if not eng_map:
        doc['greekOnly'] = True
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    paired = sum(1 for c in chapters if c['verses'][0]['text'])
    return slug, len(chapters), paired


def main():
    no_cache = '--no-cache' in sys.argv
    rows = []

    # Protrepticus — flat chapters both sides; English pages are zero-padded (020801..020812).
    grc = flat_chapters(edition(fetch(FIRST1K + 'tlg001/tlg0555.tlg001.1st1K-grc1.xml',
                                      'protr.xml', no_cache)))
    eng = {}
    for ch in sorted(grc):
        page = f'0208{ch:02d}'
        got = newadvent_chapters(page, no_cache)
        if ch in got:
            eng[ch] = got[ch]
    rows.append(write_work('clement-protrepticus', 'Clement of Alexandria, Exhortation to the Greeks',
                           GRC_ATTRIB.format(f'Clement, Protrepticus, {F1K_CREDIT}'), grc, eng))

    # Paedagogus — three books, one work each.
    paed = book_chapters(edition(fetch(FIRST1K + 'tlg002/tlg0555.tlg002.1st1K-grc1.xml',
                                       'paed.xml', no_cache)))
    for bk in sorted(paed):
        eng = newadvent_chapters(f'0209{bk}', no_cache)
        rows.append(write_work(f'clement-paedagogus-{bk}',
                               f'Clement of Alexandria, The Instructor (Book {bk})',
                               GRC_ATTRIB.format(f'Clement, Paedagogus, {F1K_CREDIT}'),
                               paed[bk], eng))

    # Stromateis — eight books from Perseus; book 3's English is Latin in the ANF, so it is
    # built Greek-only rather than shipping Potter's Latin as a translation.
    strom = book_chapter_sections(edition(fetch(PERSEUS + 'tlg004/tlg0555.tlg004.perseus-grc2.xml',
                                                'strom.xml', no_cache)))
    for bk in sorted(strom):
        eng = None if bk == 3 else newadvent_chapters(f'0210{bk}', no_cache)
        attrib = GRC_ATTRIB.format(f'Clement, Stromateis, {PERSEUS_CREDIT}')
        if bk == 3:
            attrib = f'Greek: Clement, Stromateis, {PERSEUS_CREDIT}. {NO_ENGLISH}'
        rows.append(write_work(f'clement-stromateis-{bk}',
                               f'Clement of Alexandria, Stromateis (Book {bk})',
                               attrib, strom[bk], eng))

    # Who is the Rich Man that Shall be Saved? — flat chapters, Roman-numeral English sections.
    grc = flat_chapters(edition(fetch(FIRST1K + 'tlg006/tlg0555.tlg006.1st1K-grc1.xml',
                                      'quis.xml', no_cache)))
    rows.append(write_work('clement-quis-dives',
                           'Clement of Alexandria, Who is the Rich Man that Shall be Saved?',
                           GRC_ATTRIB.format(f'Clement, Quis dives salvetur, {F1K_CREDIT}'),
                           grc, quis_dives_chapters(no_cache)))

    print(f'{"work":36} {"chapters":>9} {"with English":>13}')
    for slug, nch, paired in rows:
        flag = '' if paired == nch else f'   <<< {nch - paired} without English'
        print(f'{slug:36} {nch:>9} {paired:>13}{flag}')
    tot = sum(r[1] for r in rows); pair = sum(r[2] for r in rows)
    print(f'\n{len(rows)} works, {tot} chapters, {pair} paired with English ({pair / tot:.1%})')


if __name__ == '__main__':
    main()
