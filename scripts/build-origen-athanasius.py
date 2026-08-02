"""Build Origen and Athanasius (parallel Greek + English) for the Texts library.

  · Origen, Against Celsus (Contra Celsum)  — Perseus' Greek in the First1KGreek tree
    (tlg2042.tlg001.perseus-grc1), book → chapter, with Frederick Crombie's Ante-Nicene
    Fathers English (1885) from New Advent. Eight books plus a six-chapter preface.
  · Athanasius, On the Incarnation (tlg2035.tlg002), chapter → section, with the Nicene and
    Post-Nicene Fathers English (Archibald Robertson, 1892).
  · Athanasius, Four Discourses Against the Arians (tlg2035.tlg130/131/132/117), flat chapters.

NOT INCLUDED, deliberately:
  · De decretis. First1KGreek files tlg2035.tlg003 under that title, but the text is not the
    treatise — it is the documentary appendix, Constantine's letters against Eusebius and
    Theognis ("Κατὰ Εὐσεβίου καὶ Θεογνίου"), some 8 KB in two chapters. Pairing it with NPNF's
    De Decretis would set unrelated texts side by side.
  · Origen's De oratione and Exhortation to Martyrdom have Greek here but no public-domain
    English translation; the ANF volumes do not include them.

TWO ENGLISH SHAPES. New Advent marks the ANF Contra Celsum and the NPNF On the Incarnation with
"<h2>Chapter N. …</h2>", but the Four Discourses with a plain numbered paragraph ("1. Of all
other heresies…") under thematic chapter headings — and it is those numbers, not the headings,
that answer to the Greek chapters. Both parsers are below.

MODEL. Chapter-level pairing throughout, as in build-eusebius-pe.py and build-clement.py: the
English divides to chapter (or to the numbered section that is the Greek's chapter), so a row is
one chapter, and where the Greek runs finer its section numbers ride inline.

Output: public/data/fathers/<slug>.json

Usage:  python3 scripts/build-origen-athanasius.py [--no-cache]    (run from the repo root)
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

FIRST1K = 'https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/'
NEWADVENT = 'https://www.newadvent.org/fathers/{}.htm'
CACHE = Path('/tmp/fathers')
OUT = Path('public/data/fathers')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

ORIGEN_ATTRIB = ('Greek: Origen, Contra Celsum (Koetschau), via the First Thousand Years of Greek '
                 '(Open Greek and Latin), CC BY-SA 4.0. English: Frederick Crombie’s translation '
                 '(Ante-Nicene Fathers, vol. 4, 1885), public domain, via newadvent.org. The '
                 'English divides to chapter, so it stands beside the whole Greek chapter.')
ORIGEN_PRAEF_ATTRIB = ('Greek: Origen, Contra Celsum (Koetschau), via the First Thousand Years of '
                       'Greek (Open Greek and Latin), CC BY-SA 4.0. Greek only: the Ante-Nicene '
                       'Fathers prints the preface as one continuous block, which cannot be set '
                       'against the six chapters Koetschau divides it into without putting the '
                       'whole of it beside the first.')
ATHAN_ATTRIB = ('Greek: Athanasius, via the First Thousand Years of Greek (Open Greek and Latin), '
                'CC BY-SA 4.0. English: Archibald Robertson’s translation (Nicene and Post-Nicene '
                'Fathers, second series, vol. 4, 1892), public domain, via newadvent.org. The '
                'English divides to chapter, so it stands beside the whole Greek chapter.')

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


def chapters_with_sections(div):
    """{chapter: text} for a div whose children are chapters, folding any section children in
    with their numbers inline (sections 2+ only — the reader already prints "1")."""
    out = {}
    for c in div.findall('t:div', NS):
        if not (c.get('n') or '').isdigit():
            continue
        secs = {int(s.get('n')): strip_text(s) for s in c.findall('t:div', NS)
                if (s.get('n') or '').isdigit() and strip_text(s)}
        if secs:
            order = sorted(secs)
            lead_is_one = order[0] == 1
            text = ' '.join((secs[s] if (i == 0 and lead_is_one) else f'{s} {secs[s]}')
                            for i, s in enumerate(order))
        else:
            text = strip_text(c)
        if text:
            out[int(c.get('n'))] = text
    return out


# ── English (New Advent) ─────────────────────────────────────────────────────────────────
# New Advent heads the ANF Contra Celsum "<h2>Chapter 5</h2>" — no full stop — but the NPNF On
# the Incarnation with a bare number and one, "<h2>5. For God has not only made us…</h2>". Both
# the word and the stop must therefore be optional: insisting on "Chapter" paired none of On the
# Incarnation's 57 chapters, and insisting on the stop paired none of Contra Celsum's 621.
_H2_CHAPTER = re.compile(r'(?is)<h2>\s*(?:Chapter\s+)?(\d+)\s*\.?(.*?)</h2>')


def _clean(chunk):
    cut = re.search(r'(?is)<h2>\s*About this page', chunk)
    if cut:
        chunk = chunk[:cut.start()]
    chunk = re.sub(r'(?is)<(script|style|table|select)\b.*?</\1>', ' ', chunk)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'(?s)<[^>]+>', ' ', chunk))).strip()


def newadvent_h2_chapters(page, no_cache):
    """{chapter: text} from a page whose chapters are <h2>Chapter N. …</h2>."""
    raw = fetch(NEWADVENT.format(page), f'na-{page}.htm', no_cache).decode('utf-8', 'replace')
    marks = list(_H2_CHAPTER.finditer(raw))
    out = {}
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(raw)
        text = _clean(raw[m.end():end])
        if text:
            out[int(m.group(1))] = text
    return out


def newadvent_numbered(page, no_cache):
    """{section: text} for a page whose divisions are numbered paragraphs ("1. Of all other…").

    The thematic <h2> headings are dropped first: they sit between a chapter's number and its
    text, and leaving them in hid the opening section of every chapter behind its own heading.
    A number only starts a new section when it is the one expected next — otherwise a quoted
    "1." inside the argument would silently restart the numbering."""
    raw = fetch(NEWADVENT.format(page), f'na-{page}.htm', no_cache).decode('utf-8', 'replace')
    cut = re.search(r'(?is)<h2>\s*About this page', raw)
    if cut:
        raw = raw[:cut.start()]
    raw = re.sub(r'(?is)<h2>.*?</h2>', ' <p> ', raw)
    out, cur = {}, None
    for para in re.split(r'(?is)</p>', raw):
        text = _clean(para)
        if not text:
            continue
        m = re.match(r'^(\d+)\.\s+(.{20,})$', text, re.S)
        if m and int(m.group(1)) == (cur or 0) + 1:
            cur = int(m.group(1))
            out[cur] = m.group(2)
        elif cur is not None:
            out[cur] += ' ' + text
    return out


# ── Assembly ─────────────────────────────────────────────────────────────────────────────
def write_work(slug, name, attrib, grc, eng):
    chapters = [{'number': ch, 'verses': [
        {'number': 1, 'text': (eng or {}).get(ch, ''), 'greek': grc[ch]}]} for ch in sorted(grc)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': chapters}
    if not eng:
        doc['greekOnly'] = True
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return slug, len(chapters), sum(1 for c in chapters if c['verses'][0]['text'])


def main():
    no_cache = '--no-cache' in sys.argv
    rows = []

    # Origen, Against Celsus — the Greek's top-level divs are the books, plus a "praef".
    ed = edition(fetch(FIRST1K + 'tlg2042/tlg001/tlg2042.tlg001.perseus-grc1.xml',
                       'celsum.xml', no_cache))
    for b in ed.findall('t:div', NS):
        bn = b.get('n')
        grc = chapters_with_sections(b)
        if not grc:
            continue
        if bn == 'praef':
            rows.append(write_work('origen-celsus-praef', 'Origen, Against Celsus (Preface)',
                                   ORIGEN_PRAEF_ATTRIB, grc, None))
        elif bn.isdigit():
            eng = newadvent_h2_chapters(f'0416{int(bn)}', no_cache)
            rows.append(write_work(f'origen-celsus-{int(bn)}',
                                   f'Origen, Against Celsus (Book {int(bn)})',
                                   ORIGEN_ATTRIB, grc, eng))

    # Athanasius, On the Incarnation — 57 chapters either side.
    ed = edition(fetch(FIRST1K + 'tlg2035/tlg002/tlg2035.tlg002.1st1K-grc1.xml',
                       'athan-tlg002.xml', no_cache))
    rows.append(write_work('athanasius-incarnation',
                           'Athanasius, On the Incarnation of the Word',
                           ATHAN_ATTRIB, chapters_with_sections(ed),
                           newadvent_h2_chapters('2802', no_cache)))

    # Athanasius, Four Discourses Against the Arians — NPNF's numbered sections answer to the
    # Greek chapters; its <h2> headings are thematic groupings and do not.
    for w, bk, page in [('tlg130', 1, '28161'), ('tlg131', 2, '28162'),
                        ('tlg132', 3, '28163'), ('tlg117', 4, '28164')]:
        ed = edition(fetch(FIRST1K + f'tlg2035/{w}/tlg2035.{w}.1st1K-grc1.xml',
                           f'athan-{w}.xml', no_cache))
        name = f'Athanasius, Against the Arians (Discourse {bk})'
        if bk == 4:
            name += ' [spurious]'
        rows.append(write_work(f'athanasius-arians-{bk}', name, ATHAN_ATTRIB,
                               chapters_with_sections(ed),
                               newadvent_numbered(page, no_cache)))

    print(f'{"work":32} {"chapters":>9} {"with English":>13}')
    for slug, nch, paired in rows:
        flag = '' if paired == nch else f'   <<< {nch - paired} without English'
        print(f'{slug:32} {nch:>9} {paired:>13}{flag}')
    tot = sum(r[1] for r in rows); pair = sum(r[2] for r in rows)
    print(f'\n{len(rows)} works, {tot} chapters, {pair} paired with English ({pair / tot:.1%})')


if __name__ == '__main__':
    main()
