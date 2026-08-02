"""Build Eusebius, Praeparatio Evangelica (parallel Greek + English) for the Texts library.

The Preparation for the Gospel is the single richest surviving quarry of lost Hellenistic and
Jewish-Hellenistic literature: Eusebius quotes Alexander Polyhistor, Artapanus, Eupolemus,
Aristobulus, Philo of Byblos, Numenius, Porphyry and many others at length, and for most of them
this is the only text we have. Fifteen books, 4,279 sections.

TWO SOURCES, unlike the Ecclesiastical History which has both halves in one repository:
  · Greek   First1KGreek tlg2018.tlg001.1st1K-grc1.xml (CC BY-SA 4.0) — Gaisford's text,
            divided book → chapter → SECTION, the standard citation unit ("PE 9.17.2").
  · English E. H. Gifford's translation (1903), public domain, from Roger Pearse's transcription
            at tertullian.org, one page per book. That page states its own public-domain status.

MODEL. Follows scripts/build-eusebius.py exactly, so the two Eusebius works read alike: the
English divides only to chapter, so the CHAPTER is the parallel unit — one row holding the whole
English chapter beside the whole Greek chapter, with the section numbers kept inline in the Greek
(the reader superscripts them) so a citation to a section is still visible. Splitting the Greek
into section rows while the English stayed one block made the columns drift apart there, and
would here. One work per book; the preface is chapter 0 ("praef" in the Greek, "PREFACE" in
Gifford).

Output: public/data/eusebius/pe-<book>.json, one per book.

Usage:  python3 scripts/build-eusebius-pe.py [--no-cache]     (run from the repo root)
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

GRC_URL = ('https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/'
           'tlg2018/tlg001/tlg2018.tlg001.1st1K-grc1.xml')
ENG_URL = 'https://www.tertullian.org/fathers/eusebius_pe_{0:02d}_book{0}.htm'
CACHE = Path('/tmp/eusebius-pe')
OUT = Path('public/data/eusebius')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
BOOKS = range(1, 16)

ATTRIBUTION = ('Greek: Eusebius, Praeparatio Evangelica (Gaisford), via the First Thousand Years '
               'of Greek (Open Greek and Latin), CC BY-SA 4.0. English: E. H. Gifford’s '
               'translation (1903), public domain, transcribed by Roger Pearse '
               '(tertullian.org). The English divides only to chapter, so it stands beside the '
               'whole Greek chapter, whose section numbers are kept inline.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()

ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}


def roman_to_int(s):
    total = 0
    for i, ch in enumerate(s):
        v = ROMAN[ch]
        total += -v if i + 1 < len(s) and v < ROMAN[s[i + 1]] else v
    return total


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


def greek_sections(no_cache):
    """{book: {chapter: {section: text}}} — chapter 0 is the preface."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '',
                 fetch(GRC_URL, 'pe-grc.xml', no_cache).decode('utf-8', 'replace'))
    ed = ET.fromstring(xml).find('.//t:body/t:div', NS)
    out = {}
    for b in ed.findall('t:div', NS):
        if not (b.get('n') or '').isdigit():
            continue
        chapters = {}
        for c in b.findall('t:div', NS):
            n = c.get('n')
            cn = 0 if n == 'praef' else int(n) if (n or '').isdigit() else None
            if cn is None:
                continue
            secs = {}
            for s in c.findall('t:div', NS):
                t = strip_text(s)
                if t and (s.get('n') or '').isdigit():
                    secs[int(s.get('n'))] = t
            if not secs:                       # a chapter with no section divs is one block
                t = strip_text(c)
                if t:
                    secs[1] = t
            if secs:
                chapters[cn] = secs
        out[int(b.get('n'))] = chapters
    return out


# ── English ──────────────────────────────────────────────────────────────────────────────
# Gifford's footnote markers are superscript links; the apparatus itself is moved to the foot of
# the page under a rule, and the contents table sits above the text in its own <table>.
_FOOTNOTE_MARK = re.compile(r'(?is)<a\s+href="#\d+"[^>]*>.*?</a>')
# A heading paragraph is "CHAPTER XXIII", but from Book 15 onward Gifford also gives the chapter
# a title in the same paragraph — "CHAPTER XXIII ---- OF THE SUN." — and requiring the paragraph
# to hold nothing but the numeral found only 22 of Book 15's 62 chapters. Anything up to the
# closing tag is allowed after the numeral, capped so a body paragraph that merely begins with
# the word cannot be swallowed.
_HEADING = re.compile(r'(?is)<p>\s*(?:<[^>]+>\s*)*(PREFACE|CHAPTER\s+([IVXLC]+))\b(?:(?!</p>).){0,220}</p>')


def english_chapters(book, no_cache):
    """{chapter: text} for one book, chapter 0 being the preface."""
    raw = fetch(ENG_URL.format(book), f'pe-eng-{book}.htm', no_cache).decode('utf-8', 'replace')
    # Body text runs from the end of the contents table to the footnote apparatus.
    start = raw.lower().find('</table>')
    start = start + len('</table>') if start >= 0 else 0
    end = raw.lower().find('[footnotes moved to the end')
    if end < 0:
        end = len(raw)
    else:                                       # back up to the rule that introduces them
        hr = raw.lower().rfind('<hr', 0, end)
        end = hr if hr > start else end
    body = _FOOTNOTE_MARK.sub('', raw[start:end])

    marks = [(m.start(), m.end(), m.group(1), m.group(2)) for m in _HEADING.finditer(body)]
    out = {}
    for i, (s, e, label, roman) in enumerate(marks):
        nxt = marks[i + 1][0] if i + 1 < len(marks) else len(body)
        chunk = body[e:nxt]
        chunk = re.sub(r'(?is)<(script|style|table)\b.*?</\1>', ' ', chunk)
        text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'(?s)<[^>]+>', ' ', chunk))).strip()
        if not text:
            continue
        out[0 if label.upper() == 'PREFACE' else roman_to_int(roman.upper())] = text
    return out


def main():
    no_cache = '--no-cache' in sys.argv
    grc = greek_sections(no_cache)
    OUT.mkdir(parents=True, exist_ok=True)

    rows, unmatched = [], []
    for bk in BOOKS:
        eng = english_chapters(bk, no_cache)
        # In Books 8, 14 and 15 the Greek has no separate preface: its chapter 1 IS the proem,
        # opening ΠΡΟΟΙΜΙΟΝ, and Gifford heads the same text "PREFACE". Left alone that put the
        # English on a chapter 0 the Greek does not have while chapter 1 showed no translation.
        # Only remapped when the Greek genuinely has no chapter 0 to claim it.
        if 0 in eng and 1 not in eng and 0 not in grc.get(bk, {}):
            eng[1] = eng.pop(0)
        chapters = []
        n_sec = eng_hits = 0
        for ch in sorted(grc.get(bk, {})):
            secs = grc[bk][ch]
            e = eng.get(ch)
            if e:
                eng_hits += 1
            else:
                unmatched.append(f'{bk}.{ch}')
            # Number sections 2+ inline; the reader already prints "1" as the verse marker, so
            # numbering the first as well would show a doubled "1 1". A chapter whose sections
            # do not start at 1 is numbered throughout.
            order = sorted(secs)
            lead_is_one = order and order[0] == 1
            greek = ' '.join((secs[s] if (i == 0 and lead_is_one) else f'{s} {secs[s]}')
                             for i, s in enumerate(order))
            n_sec += len(secs)
            chapters.append({'number': ch, 'verses': [{'number': 1, 'text': e or '', 'greek': greek}]})
        doc = {
            'work': f'Eusebius, Preparation for the Gospel (Book {bk})',
            'attribution': ATTRIBUTION,
            'greek': True,
            'chapters': chapters,
        }
        (OUT / f'pe-{bk}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        rows.append((bk, len(chapters), n_sec, eng_hits, len(eng)))

    print(f'{"book":>4} {"chapters":>9} {"sections":>9} {"eng paired":>11} {"eng found":>10}')
    for bk, nch, nsec, hits, nfound in rows:
        flag = '' if hits == nch else f'   <<< {nch - hits} chapter(s) without English'
        print(f'{bk:>4} {nch:>9} {nsec:>9} {hits:>11} {nfound:>10}{flag}')
    tot_ch = sum(r[1] for r in rows); tot_hits = sum(r[3] for r in rows)
    print(f'\ntotal: {tot_ch} chapters, {sum(r[2] for r in rows)} sections, '
          f'{tot_hits} paired with English ({tot_hits / tot_ch:.1%})')
    if unmatched:
        print(f'chapters with no English ({len(unmatched)}): {" ".join(unmatched[:40])}')


if __name__ == '__main__':
    main()
