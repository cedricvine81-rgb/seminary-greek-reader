"""Build the Greek Sibylline Oracles as its own readable work.

WHY IT IS A SEPARATE WORK, NOT A PARALLEL COLUMN.
Our English Sibylline is Milton Terry's blank-verse translation (1899), line-numbered on its
own lines. The Greek (First1KGreek tlg1551, Geffcken's text, CC BY-SA 4.0) is numbered on the
Greek hexameter lines. Terry's English runs 1.17-1.32x longer than the Greek and the ratio
varies by book, so English line N is never Greek line N and the drift compounds within a book:

    book:      1     2     3     4     5     6     7     8    11    12    13    14
    Greek:   400   345   825   190   530    25   160   500   320   295   170   360
    Terry:   468   423   974   222   665    33   205   661   403   363   213   429
    ratio:  1.17  1.23  1.18  1.17  1.25  1.32  1.28  1.32  1.26  1.23  1.25  1.19

Pairing them line-by-line would therefore put the wrong Greek beside the English everywhere
past the first few lines. The book numbering DOES match exactly (1-8, 11-14 on both sides),
so the two are offered as sibling works a reader can open side by side, and the Greek gets
its own line numbers, parsing pane, search and highlighting.

Usage:  python3 scripts/build-sibylline-greek.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = ('https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/'
       'data/tlg1551/tlg001/tlg1551.tlg001.1st1K-grc1.xml')
CACHE = Path('/tmp/first1k-sibylline.xml')
OUT = Path('public/data/pseudepigrapha/sibylline-greek.json')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
TEI = '{http://www.tei-c.org/ns/1.0}'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
ATTRIB = ('Greek text of the Sibylline Oracles (ed. Geffcken). Digital edition: First Thousand '
          'Years of Greek (Open Greek and Latin), CC BY-SA 4.0 (opengreekandlatin.org). '
          'Line numbering is the Greek editionʼs and does not correspond to the line numbers of '
          'the English translation, which is a separate work.')

# Books to keep, in catalogue order. The Greek also carries a prose `praef` (the Byzantine
# prologue), which is not part of the numbered oracles and is skipped.
BOOKS = ['1', '2', '3', '4', '5', '6', '7', '8', '11', '12', '13', '14']

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(no_cache):
    if CACHE.exists() and not no_cache:
        return CACHE.read_bytes()
    req = urllib.request.Request(RAW, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=90, context=_ctx).read()
    CACHE.write_bytes(data)
    return data


GREEK_CH = re.compile(r'[\u0370-\u03ff\u1f00-\u1fff]')
LATIN_CH = re.compile(r'[A-Za-z]')


def is_greek_block(el):
    """True when a <p>/<lg> holds Greek verse rather than the edition's Latin.

    Book 8's acrostic is printed with Augustine's Latin rendering in an unmarked <p> that
    carries its own <lb> numbering; left in, it both injects Latin lines and resets the line
    counter (which produced duplicate line numbers). Script is the reliable discriminator.
    """
    txt = ''.join(el.itertext())
    g, l = len(GREEK_CH.findall(txt)), len(LATIN_CH.findall(txt))
    return g > l


def book_lines(div):
    """Extract (line_number, text) for one book.

    The edition sets verse lines as newline-separated text inside <p>, with <lb n="N"/>
    milestones every fifth line. So: walk the div in document order, collect text with its
    newlines, and use each milestone to (re)anchor the running line number — which both
    numbers the lines and self-corrects any drift.
    """
    parts = []   # 'text' chunks and ('anchor', n) markers, in document order

    def walk(el):
        tag = el.tag.replace(TEI, '')
        if tag in ('note', 'head'):          # apparatus + headings are not text lines
            if el.tail:
                parts.append(el.tail)
            return
        if tag == 'lb':
            n = el.get('n')
            if n and n.isdigit():
                parts.append(('anchor', int(n)))
            else:
                parts.append('\n')
        elif tag == 'gap':
            parts.append(' … ')              # lacuna in the manuscript
        if el.text:
            parts.append(el.text)
        for child in el:
            walk(child)
        if el.tail:
            parts.append(el.tail)

    for child in div:
        tag = child.tag.replace(TEI, '')
        if tag in ('p', 'lg') and not is_greek_block(child):
            continue          # the edition's Latin (Augustine's acrostic) — not oracle text
        walk(child)

    # Flatten into lines, applying anchors.
    lines, buf, pending = [], '', None
    for p in parts:
        if isinstance(p, tuple):
            pending = p[1]
            continue
        for ch in p:
            if ch == '\n':
                lines.append((pending, buf))
                buf = ''
                if pending is not None:
                    pending += 1
            else:
                buf += ch
    if buf.strip():
        lines.append((pending, buf))

    # Number: anchored lines keep their number; unanchored ones count back/forward from
    # the nearest anchor so lines before the first milestone (1-4) are numbered too.
    out = []
    for i, (n, t) in enumerate(lines):
        t = re.sub(r'\s+', ' ', t).strip()
        if t:
            out.append([n, t])
    # backfill from the first anchored line
    first_anchor = next((i for i, (n, _) in enumerate(out) if n is not None), None)
    if first_anchor is not None:
        base = out[first_anchor][0]
        for i in range(first_anchor - 1, -1, -1):
            base -= 1
            out[i][0] = base
    run = None
    for row in out:
        if row[0] is None:
            run = (run + 1) if run is not None else 1
            row[0] = run
        else:
            run = row[0]
    out = [(n, t) for n, t in out if t and GREEK_CH.search(t)]
    # A line number must identify one line; if the edition's milestones still leave a
    # collision, keep the first and let later lines run on from it.
    seen, fixed, last = set(), [], 0
    for n, t in out:
        if n in seen or n <= last:
            n = last + 1
        seen.add(n)
        last = n
        fixed.append((n, t))
    return fixed


def main():
    no_cache = '--no-cache' in sys.argv
    root = ET.fromstring(re.sub(r'(?is)<note\b.*?</note>', '',
                                fetch(no_cache).decode('utf-8', 'replace')))
    body = root.find('.//t:body', NS)

    divs = {}
    for div in body.iter(f'{TEI}div'):
        if div.get('subtype') == 'book':
            divs[div.get('n')] = div

    chapters, report = [], []
    for b in BOOKS:
        div = divs.get(b)
        if div is None:
            report.append((b, 0, 0))
            continue
        lines = book_lines(div)
        chapters.append({'number': int(b),
                         # Greek-only work: `text` (the English column) is deliberately empty,
                         # and the reader opens it in Greek-only mode.
                         'verses': [{'number': n, 'text': '', 'greek': t} for n, t in lines]})
        report.append((b, len(lines), max((n for n, _ in lines), default=0)))

    doc = {'work': 'Sibylline Oracles (Greek)', 'attribution': ATTRIB, 'greek': True,
           'chapters': chapters}
    OUT.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print(f'{"book":>5} {"lines":>7} {"max n":>7}')
    for b, c, mx in report:
        print(f'{b:>5} {c:>7} {mx:>7}')
    print(f'\ntotal lines: {sum(c for _, c, _ in report)}')
    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
