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
import unicodedata
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


ACROSTIC = 'ΙΗΣΟΥΣΧΡΕΙΣΤΟΣΘΕΟΥΥΙΟΣΣΩΤΗΡ'   # 27 letters; ΣΤΑΥΡΟΣ follows in the Greek only


def is_acrostic_header(el):
    """True for the block that merely SPELLS OUT the acrostic, e.g.

        ΙΗσΟΥσΧΡΕΙ σΤΟσΘΕοΥΥΙΟσΣωΤΗΡ

    The edition prints it as a heading above Sib. Or. 8's acrostic to show what the initial
    letters make ("Jesus Christ, Son of God, Saviour"). It is not a verse, but it sat in its own
    <p> and so was counted as book 8 line 221, pushing every line after it up by one and putting
    the whole back half of the book out of step with Geffcken. Matched on the bare letters, since
    the scan's case and spacing are erratic (σ for Σ, ο for Ο, ω for Ω).
    """
    txt = ''.join(el.itertext())
    letters = ''.join(c for c in bare(txt) if c.isalpha())
    return letters == bare(ACROSTIC)


def bare(text):
    """Accent- and breathing-stripped lower-case, for matching regardless of the
    precomposed form the edition happens to use (ώ is U+1F7D here, not U+03CE)."""
    return ''.join(c for c in unicodedata.normalize('NFD', text)
                   if unicodedata.category(c) != 'Mn').lower()


def initial(text):
    """First alphabetic letter, bare and upper-case (leading *, 〈 and free-standing
    breathing marks are editorial)."""
    t = text.lstrip('*〈 ⟨')
    for ch in unicodedata.normalize('NFD', t):
        if unicodedata.category(ch) == 'Mn' or not ch.isalpha():
            continue
        return ch.upper()
    return ''


def latin_lines(el):
    """Augustine's Latin acrostic lines, with the marginal Greek acrostic letters the
    edition prints beside some of them ("Υ Celsum", "Τ j Tartareumque") removed."""
    txt = re.sub(r'<[^>]+>', '', ''.join(el.itertext()))
    out = []
    for raw in txt.split('\n'):
        t = re.sub(r'\s+', ' ', raw).strip()
        if not t:
            continue
        t = re.sub(r'^[\u0370-\u03ff\u1f00-\u1fff]\s*j?\s*', '', t)   # marginal Greek letter
        if t:
            out.append(t)
    return out


def book_lines(div):
    """Extract (line_number, text) for one book.

    The edition sets verse lines as newline-separated text inside <p>, with <lb n="N"/>
    milestones every fifth line. So: walk the div in document order, collect text with its
    newlines, and use each milestone to (re)anchor the running line number.

    It does NOT "self-correct any drift", which this docstring used to claim and which hid a
    real bug for as long as it stood: a milestone can only pull the counter back if the
    monotonicity guard at the end of this function lets it, and that guard refuses any decrease.
    Drift therefore became permanent. Both halves are fixed below — blank segments no longer
    consume numbers, and every override the guard performs is now printed.
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
            elif n and re.fullmatch(r'\d+[a-z]', n):
                # SUPPLEMENTARY LINE. Geffcken numbers an inserted verse "28a" — four exist in
                # the corpus (4.28a, 14.269a, 14.270a, 14.298a). An integer line number cannot
                # express one, and treating it as an unnumbered line made it consume the next
                # integer, so every line after it in that book was off by one. It now takes its
                # BASE number with the full label in `ref`, and advances nothing.
                parts.append(('sub', n))
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

    latin = []
    for child in div:
        tag = child.tag.replace(TEI, '')
        if tag in ('p', 'lg') and is_acrostic_header(child):
            continue                          # a heading, not a verse line — see above
        if tag in ('p', 'lg') and not is_greek_block(child):
            # The edition's Latin: Augustine's verse rendering of the Book 8 acrostic
            # (City of God 18.23). Kept aside — it must not drive the Greek line counter,
            # which is what its own <lb> numbering did.
            latin.extend(latin_lines(child))
            continue
        walk(child)

    # Flatten into lines, applying anchors.
    #
    # ONLY A LINE WITH CONTENT MAY CONSUME A LINE NUMBER. `walk` drops <note> and <head>
    # subtrees but still keeps their TAILS, and those tails are the XML's own indentation
    # newlines — as are the tails of <pb/> page breaks. Counting every '\n' therefore burned a
    # number per blank segment, and Geffcken sets his apparatus criticus inside the same <p> as
    # the verse, so each book lost 4-8 numbers at its first big footnote block and every line
    # after it was mis-numbered (book 4's line 11 came out as 16). The blank segments are
    # discarded a few lines below anyway; they must not advance `pending` on the way.
    lines, buf, pending, sub = [], '', None, None
    for p in parts:
        if isinstance(p, tuple):
            if p[0] == 'anchor':
                pending = p[1]
            else:
                sub = p[1]
            continue
        for ch in p:
            if ch == '\n':
                if buf.strip():
                    if sub is not None:
                        lines.append((int(re.match(r'(\d+)', sub).group(1)), buf, sub))
                        sub = None
                    else:
                        lines.append((pending, buf, None))
                        if pending is not None:
                            pending += 1
                buf = ''
            else:
                buf += ch
    if buf.strip():
        lines.append((pending, buf, sub))

    # Number: anchored lines keep their number; unanchored ones count back/forward from
    # the nearest anchor so lines before the first milestone (1-4) are numbered too.
    out = []
    for i, (n, t, sfx) in enumerate(lines):
        t = re.sub(r'\s+', ' ', t).strip()
        if t:
            out.append([n, t, sfx])
    # backfill from the first anchored line
    first_anchor = next((i for i, r in enumerate(out) if r[0] is not None), None)
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
        elif row[2] is None:
            run = row[0]
    out = [(n, t, sfx) for n, t, sfx in out if t and GREEK_CH.search(t)]

    # TRANSPOSED MILESTONES IN THE SOURCE. Book 5 marks its lines 516 and 517 in the wrong
    # order — the XML reads <lb n="515"/>, <lb n="517"/>, <lb n="516"/>, <lb n="518"/> — so
    # document order and the edition's numbering disagree over one pair. The NUMBERS are the
    # ground truth (they are Geffcken's, and his printed book 5 runs 515, 516, 517, 518), so the
    # lines are restored to numeric order rather than forced monotonic, which is what the
    # collision guard below used to do: it renumbered 516 as 518 and pushed every later line in
    # the book up by one. Only whole, already-numbered lines move, and only when every number is
    # distinct — so this cannot silently reorder anything else.
    nums = [n for n, _, sfx in out if sfx is None]
    if nums != sorted(nums) and len(set(nums)) == len(nums):
        moved = [n for n, sn in zip(nums, sorted(nums)) if n != sn]
        print(f"      transposed milestones in the source, restored to numeric order: {moved}")
        out.sort(key=lambda r: (r[0], r[2] or ''))

    # A line number must identify one line; if the edition's milestones still leave a
    # collision, keep the first and let later lines run on from it.
    #
    # EVERY OVERRIDE HERE IS REPORTED, because this guard is how the old numbering bug became
    # permanent rather than self-correcting. Blank segments used to consume line numbers, so by
    # the next milestone the counter had run ahead; the milestone tried to pull it back, this
    # guard refused the decrease and forced last + 1, and the inflation was locked in for the
    # rest of the book. A silent override means the count and the edition disagree — which is
    # exactly what must never pass unnoticed again.
    seen, fixed, last, overrides = set(), [], 0, []
    for n, t, sfx in out:
        if sfx is not None:                 # supplementary line: shares its base's number
            fixed.append((n, t, sfx))
            continue
        if n in seen or n <= last:
            overrides.append((n, last + 1))
            n = last + 1
        seen.add(n)
        last = n
        fixed.append((n, t, None))
    if overrides:
        print(f"      ⚠ {len(overrides)} milestone override(s): "
              f"{['%s->%s' % o for o in overrides[:6]]}")
    return fixed, latin


def attach_latin(verses, latin):
    """Pair Augustine's 27 Latin lines with the Greek acrostic lines they render.

    Pairing is by ACROSTIC LETTER, not by position: the Greek here carries one extra line
    inside the acrostic, so counting lines would slip by one part-way through. Walking the
    expected letter sequence instead makes the pairing self-correcting and self-verifying —
    if the letters do not all match, nothing is attached.
    """
    start = next((i for i, v in enumerate(verses)
                  if initial(v['greek']) == 'Ι' and bare(v['greek'])[:20].lstrip('*〈 ⟨῾᾿').startswith('ιδρωσει')),
                 None)
    if start is None:
        return 0
    matched, j = [], start
    for letter in ACROSTIC:
        while j < len(verses) and initial(verses[j]['greek']) != letter:
            j += 1
        if j >= len(verses):
            return 0                      # sequence broke — attach nothing
        matched.append(j)
        j += 1
    if len(matched) != len(latin):
        return 0
    for idx, lat in zip(matched, latin):
        verses[idx]['text'] = lat
    return len(matched)


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
        lines, latin = book_lines(div)
        # `ref` carries the edition's own label and is what the reader shows and cites
        # (TextsReader: `row.ref ?? row.num`), so a supplementary line reads "4:28a".
        verses = [dict({'number': n, 'text': '', 'greek': t},
                       **({'ref': f'{b}:{sfx}'} if sfx else {})) for n, t, sfx in lines]
        if latin:
            attach_latin(verses, latin)
        chapters.append({'number': int(b),
                         'verses': verses})
        report.append((b, len(lines), max((n for n, _, _ in lines), default=0)))

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
