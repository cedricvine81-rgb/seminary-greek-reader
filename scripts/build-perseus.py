# Builds Greco-Roman texts from the Perseus Digital Library's canonical TEI editions
# (github.com/PerseusDL/canonical-greekLit), which carry the standard book/chapter/section
# numbering the Backgrounds dataset cites (unlike the public-domain Gutenberg translations,
# whose section divisions don't line up). Both the Greek original and the English
# translation are stored, aligned section-by-section, into an extended prose JSON shape:
#   chapters:[{ number, verses:[{ number, text (English), greek }] }]
# so the Texts reader can show them in parallel.
#
# Starts with Epictetus — the Discourses (one work per book) and the Enchiridion.
#
# Licence: the underlying translations (George Long, 1877) and Greek are public domain, but
# Perseus licenses its digital editions CC-BY-SA 4.0; that is carried in the attribution.
#
# Usage:  python3 scripts/build-perseus.py   (fetches raw TEI from GitHub, caching under
#         /tmp; --no-cache to refetch). Run from the repo root. Prints a validation report.

import json
import re
import ssl
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/'
CACHE = Path('/tmp/perseus')
OUT_DIR = Path('public/data/greco')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
ATTRIB = ('Text: Epictetus, tr. George Long (1877); Greek ed. H. Schenkl. Digital edition: '
          'Perseus Digital Library, CC-BY-SA 4.0 (perseus.tufts.edu).')
ATTRIB_DL = ('Text: Diogenes Laertius, Lives of Eminent Philosophers, tr. R. D. Hicks (1925); '
             'Greek ed. Long. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(rel, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / rel.replace('/', '_')
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(RAW + rel, headers={'User-Agent': UA})
    try:
        data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
    except urllib.error.URLError:
        data = urllib.request.urlopen(req, timeout=60, context=ssl._create_unverified_context()).read()
    cached.write_bytes(data)
    time.sleep(0.3)
    return data


def chapter_text(div):
    # Drop the chapter heading, editorial notes, and the non-preferred half of an editorial
    # choice (<sic>/<orig>/<abbr> — keeping the accompanying <corr>/<reg>/<expan>), then flatten.
    # Some Perseus texts (Lucian) nest <sic><corr> malformedly, which would otherwise duplicate
    # the reading; dropping the <sic> subtree leaves a single corrected reading.
    for tag in ('head', 'note', 'sic', 'orig', 'abbr'):
        for el in div.findall(f't:{tag}', NS) + div.findall(f'.//t:{tag}', NS):
            tail = el.tail
            el.clear(); el.text = ''; el.tail = tail
    return re.sub(r'\s+', ' ', ''.join(div.itertext())).strip()


def parse_chapters(xml_bytes):
    """Return {(book|None, chapter): text} at chapter granularity (both the English and Greek
    Perseus editions divide to chapter; only the Greek goes to section, so we align on chapter)."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx); continue
            c = dict(ctx); c[div.get('subtype')] = div.get('n')
            if div.get('subtype') == 'chapter':
                out[(c.get('book'), div.get('n'))] = chapter_text(div)
            else:
                walk(div, c)
    walk(root.find('.//t:body', NS), {})
    return out


def parse_sections(xml_bytes):
    """Return {(book|None, section): text} at section granularity, keyed by the book and the
    (book-continuous) section number — used when both editions divide to section."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx); continue
            c = dict(ctx); c[div.get('subtype')] = div.get('n')
            if div.get('subtype') == 'section':
                out[(c.get('book'), div.get('n'))] = chapter_text(div)
            else:
                walk(div, c)
    walk(root.find('.//t:body', NS), {})
    return out


def build_sections(slug, name, urn_dir, urn_base, no_cache):
    """One work whose chapters are the books and whose verses are the (continuous) sections,
    with parallel Greek. Both Perseus editions divide to section, so alignment is exact."""
    grc = parse_sections(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache))
    eng = parse_sections(fetch(f'{urn_dir}/{urn_base}.perseus-eng2.xml', no_cache))
    books = {}
    for (b, sec), en in eng.items():
        if not (b and b.isdigit() and sec and sec.isdigit()):
            continue
        books.setdefault(int(b), {})[int(sec)] = (en, grc.get((b, sec), ''))
    chapters = [{'number': bk, 'verses': [
        {'number': sec, 'text': books[bk][sec][0], **({'greek': books[bk][sec][1]} if books[bk][sec][1] else {})}
        for sec in sorted(books[bk])]} for bk in sorted(books)]
    doc = {'work': name, 'attribution': ATTRIB_DL, 'greek': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters),
             'verses': sum(len(c['verses']) for c in chapters)}]


PLATO_ATTRIB = ('Text: the Loeb Classical Library translation (Plato in Twelve Volumes), public '
                'domain; Greek: J. Burnet’s edition. Digital edition: Perseus Digital Library, '
                'CC-BY-SA 4.0 (perseus.tufts.edu).')


# ── Milestone-aware splitting: recover the standard page+letter reference ────────────────
# Plato and the Plutarch Moralia are cited by a page reference marked only by inline milestones
# (Plato "<milestone unit='section' n='172a'>", Moralia "<milestone unit='stephpage' n='351c'>").
# These walk the text in document order and split it at those milestones so each lettered
# subsection becomes its own verse, carrying its reference ("172a").
def _ms_events(el, unit):
    if el.text:
        yield ('t', el.text)
    for c in el:
        tag = c.tag.split('}')[-1]
        if tag in ('note', 'head', 'sic', 'orig', 'abbr'):
            if c.tail:
                yield ('t', c.tail)
            continue
        elif tag == 'milestone' and c.get('unit') == unit:
            yield ('m', c.get('n'))
        else:
            yield from _ms_events(c, unit)
        if c.tail:
            yield ('t', c.tail)


def _segments(el, unit):
    """[(ref, text)] — the text following each `unit` milestone (text before the first merges
    into it)."""
    segs, lead, cur = [], [], None
    for kind, val in _ms_events(el, unit):
        if kind == 'm':
            segs.append([val, []]); cur = segs[-1][1]
        else:
            (cur if cur is not None else lead).append(val)
    if segs and lead:
        segs[0][1] = lead + segs[0][1]
    return [(n, re.sub(r'\s+', ' ', ''.join(p)).strip()) for n, p in segs]


def _pages_by_ref(xml_bytes, unit):
    """{page:int -> {ref:str -> text}} from the milestone references (e.g. 172 -> {'172a': …})."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    body = ET.fromstring(xml).find('.//t:body', NS)
    out = {}
    for ref, text in _segments(body, unit):
        m = re.match(r'(\d+)[a-z]*$', ref or '')
        if m and text:
            out.setdefault(int(m.group(1)), {})[ref] = text
    return out


def build_stephanus(slug, name, urn_dir, urn_base, eng_suffix, unit, attrib, no_cache):
    """A dialogue / Moralia essay indexed by its page reference: chapter = page number, one verse
    per lettered subsection carrying its standard ref ("172a"). English + parallel Greek."""
    grc = _pages_by_ref(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache), unit)
    eng = _pages_by_ref(fetch(f'{urn_dir}/{urn_base}.perseus-{eng_suffix}.xml', no_cache), unit)
    chapters = []
    for page in sorted(eng):
        verses = []
        for i, ref in enumerate(sorted(eng[page]), 1):
            v = {'number': i, 'ref': ref, 'text': eng[page][ref]}
            g = grc.get(page, {}).get(ref)
            if g:
                v['greek'] = g
            verses.append(v)
        chapters.append({'number': page, 'verses': verses})
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    n_grk = sum(1 for c in chapters for v in c['verses'] if 'greek' in v)
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': n_grk}]


def build_plato(slug, name, urn_dir, urn_base, no_cache):
    return build_stephanus(slug, name, urn_dir, urn_base, 'eng2', 'section', PLATO_ATTRIB, no_cache)


ARISTOTLE_ATTRIB = ('Text: the Loeb Classical Library translation (public domain); Greek: the '
                    'Bekker/Perseus edition. Digital edition: Perseus Digital Library, '
                    'CC-BY-SA 4.0 (perseus.tufts.edu).')
PLUTARCH_ATTRIB = ('Text: Plutarch’s Lives, tr. Bernadotte Perrin (Loeb, 1914–1926), public '
                   'domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, '
                   'CC-BY-SA 4.0 (perseus.tufts.edu).')
PLUTARCH_MORALIA_ATTRIB = ('Text: Plutarch’s Morals, tr. William W. Goodwin et al. (1874), '
                           'public domain; Greek ed. Perseus. Digital edition: Perseus Digital '
                           'Library, CC-BY-SA 4.0 (perseus.tufts.edu).')


def parse_units(xml_bytes, book_sub, unit_sub):
    """Return {(book|None, unit): text} for a book→unit (or flat unit) TEI. `book_sub` is the
    div subtype that carries the book number (None for treatises without books); `unit_sub` is
    the verse-level div subtype (a Nicomachean Ethics 'section', a Rhetoric/Poetics 'chapter')."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, book):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, book); continue
            sub = div.get('subtype')
            if book_sub and sub == book_sub:
                walk(div, div.get('n'))
            elif sub == unit_sub:
                out[(book, div.get('n'))] = chapter_text(div)
            else:
                walk(div, book)
    walk(root.find('.//t:body', NS), None)
    return out


def parse_unit_refs(xml_bytes, book_sub, unit_sub, ref_unit):
    """{(book,unit) -> ref} using the first `ref_unit` milestone inside each unit div — the
    standard reference (Aristotle's Bekker "page" milestone, "1094a")."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, book):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, book); continue
            sub = div.get('subtype')
            if book_sub and sub == book_sub:
                walk(div, div.get('n'))
            elif sub == unit_sub:
                ms = div.find(f'.//t:milestone[@unit="{ref_unit}"]', NS)
                if ms is not None and ms.get('n'):
                    out[(book, div.get('n'))] = ms.get('n')
            else:
                walk(div, book)
    walk(root.find('.//t:body', NS), None)
    return out


def build_greek_only(slug, name, urn_dir, urn_base, book_sub, unit_sub, attrib, no_cache):
    """A book→unit work with no aligned English on Perseus (Marcus Aurelius): chapter = book,
    verse = unit, Greek only. Translations divide the Meditations on a different chapter scheme
    than the critical Greek, so pairing an English by number would misalign — hence Greek-only."""
    grc = parse_units(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache), book_sub, unit_sub)
    books = {}
    for (b, u), gr in grc.items():
        if b and b.isdigit() and u and u.isdigit():
            books.setdefault(int(b), {})[int(u)] = gr
    chapters = [{'number': bk, 'verses': [
        {'number': u, 'text': '', 'greek': books[bk][u]} for u in sorted(books[bk])]} for bk in sorted(books)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'greekOnly': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters),
             'verses': sum(len(c['verses']) for c in chapters)}]


def build_line_poem(slug, name, urn_dir, urn_base, attrib, no_cache, chunk=150):
    """A continuous verse poem addressed by line number (Aratus's Phaenomena). Greek only; the
    lines are grouped into chapters of `chunk` for lazy loading, each verse keeping its poem line
    number as its reference (so "Phaen. 5" cites line 5)."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache).decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    lines = [re.sub(r'\s+', ' ', ''.join(l.itertext())).strip()
             for l in root.iter('{http://www.tei-c.org/ns/1.0}l')]
    lines = [l for l in lines if l]
    chapters = []
    for i in range(0, len(lines), chunk):
        block = lines[i:i + chunk]
        chapters.append({'number': i // chunk + 1, 'verses': [
            {'number': i + j + 1, 'ref': str(i + j + 1), 'text': '', 'greek': block[j]}
            for j in range(len(block))]})
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'greekOnly': True,
           'lineChunk': chunk, 'lineCount': len(lines), 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': len(lines)}]


def _div_text(el):
    """Text of a card/div, dropping headings, labels, and the card milestone."""
    for tag in ('head', 'label'):
        for x in el.findall(f't:{tag}', NS) + el.findall(f'.//t:{tag}', NS):
            tail = x.tail; x.clear(); x.text = ''; x.tail = tail
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()


def parse_lines(xml_bytes, per_book):
    """{(book|None, line): greek} from <l n=..>; book from the (case-insensitive) book div."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    NSU = '{http://www.tei-c.org/ns/1.0}'
    out = {}

    def add(book, l):
        n = l.get('n')
        if n and n.isdigit():
            t = re.sub(r'\s+', ' ', ''.join(l.itertext())).strip()
            if t:
                out[(book, int(n))] = t

    if per_book:
        for b in root.iter(NSU + 'div'):
            if (b.get('subtype') or '').lower() != 'book' or not (b.get('n') or '').isdigit():
                continue
            for l in b.iter(NSU + 'l'):
                add(int(b.get('n')), l)
    else:
        for l in root.iter(NSU + 'l'):
            add(None, l)
    return out


def parse_eng_chunks(xml_bytes, per_book):
    """{(book|None, startline): english}. Homer's Murray is book→card (card n = the starting
    line); Hesiod's Evelyn-White marks every ~5th line with <l n=..>. Either way the English is
    keyed by the line it starts at, so it can sit beside that Greek line (the rest are Greek-only,
    the Eusebius chunk model)."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    NSU = '{http://www.tei-c.org/ns/1.0}'
    out = {}
    has_cards = any((d.get('subtype') or '').lower() == 'card' for d in root.iter(NSU + 'div'))
    if has_cards:
        def walk(el, book):
            for d in el.findall('t:div', NS):
                st = (d.get('subtype') or '').lower()
                if st == 'book' and (d.get('n') or '').isdigit():
                    walk(d, int(d.get('n')))
                elif st == 'card' and (d.get('n') or '').isdigit():
                    t = _div_text(d)
                    if t:
                        out[(book if per_book else None, int(d.get('n')))] = t
                else:
                    walk(d, book)
        walk(root.find('.//t:body', NS), None)
    else:
        for l in root.iter(NSU + 'l'):
            n = l.get('n')
            if n and n.isdigit():
                t = re.sub(r'\s+', ' ', ''.join(l.itertext())).strip()
                if t:
                    out[(None, int(n))] = t
    return out


def build_line_parallel(slug, name, urn_dir, urn_base, eng_suffix, per_book, attrib, no_cache, chunk=150):
    """A verse work addressed by line (Homer, Hesiod). Murray's / Evelyn-White's Loeb English is
    not line-aligned — it comes in card / ~5-line groups — so each VERSE is that group: the group's
    Greek lines together (joined with newlines, which the reader renders as line breaks) beside the
    group's English, a Loeb facing layout that actually aligns. Homer: chapter = book, verse = the
    card (numbered by its first line, "Il. 1.1"). Hesiod: verses grouped into `chunk`-line chapters
    ("Theog. 116" opens the group containing line 116)."""
    import bisect
    from collections import defaultdict
    base = f'{urn_dir}/{urn_base}'
    grc = parse_lines(fetch(f'{base}.perseus-grc2.xml', no_cache), per_book)
    eng = parse_eng_chunks(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache), per_book)
    glane, elane = defaultdict(dict), defaultdict(dict)
    for (b, ln), t in grc.items():
        glane[b][ln] = t
    for (b, ln), t in eng.items():
        elane[b][ln] = t

    def group(book):
        """[(start_line, end_line, greek_block, english)] — each English chunk with the Greek
        lines that fall in its range (start ≤ line < next start)."""
        starts = sorted(elane.get(book, {}))
        buckets = defaultdict(list)
        for ln in sorted(glane[book]):
            i = bisect.bisect_right(starts, ln) - 1 if starts else -1
            key = starts[i] if i >= 0 else ln   # lines before the first chunk get their own group
            buckets[key].append(ln)
        out = []
        for start in sorted(buckets):
            lns = buckets[start]
            out.append((start, lns[-1], '\n'.join(glane[book][x] for x in lns),
                        elane.get(book, {}).get(start, '')))
        return out

    chapters = []
    if per_book:
        for b in sorted(glane):
            chapters.append({'number': b, 'verses': [
                {'number': s, 'ref': (str(s) if s == e else f'{s}–{e}'), 'text': en, 'greek': g}
                for (s, e, g, en) in group(b)]})
    else:
        by_ch = defaultdict(list)
        for (s, e, g, en) in group(None):
            by_ch[(s - 1) // chunk + 1].append(
                {'number': s, 'ref': (str(s) if s == e else f'{s}–{e}'), 'text': en, 'greek': g})
        for ch in sorted(by_ch):
            chapters.append({'number': ch, 'verses': by_ch[ch]})
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': chapters}
    if not per_book:
        doc['lineChunk'] = chunk
        doc['lineCount'] = len(glane[None])
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    tot = sum(len(c['verses']) for c in chapters)
    n_eng = sum(1 for c in chapters for v in c['verses'] if v['text'])
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': tot, 'eng': n_eng}]


def build_units(slug, name, urn_dir, urn_base, eng_suffix, book_sub, unit_sub, attrib, no_cache, ref_unit=None):
    """One work with a book→unit or flat-unit TEI (Aristotle treatises, Plutarch Lives/Moralia).
    With books: chapter = book, verse = unit (Eth. nic. 1.7 → book 1 §7; Plut. Ant. 25.2 → ch. 25
    §2). Without books: chapter = unit, one verse (Poet. 6). `ref_unit` attaches the standard
    reference milestone (Aristotle's Bekker number) to each verse."""
    base = f'{urn_dir}/{urn_base}'
    grc_bytes = fetch(f'{base}.perseus-grc2.xml', no_cache)
    grc = parse_units(grc_bytes, book_sub, unit_sub)
    eng = parse_units(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache), book_sub, unit_sub)
    refs = parse_unit_refs(grc_bytes, book_sub, unit_sub, ref_unit) if ref_unit else {}
    if book_sub:
        books = {}
        for (b, u), en in eng.items():
            if b and b.isdigit() and u and u.isdigit():
                books.setdefault(int(b), {})[int(u)] = (en, grc.get((b, u), ''), refs.get((b, u)))
        chapters = [{'number': bk, 'verses': [
            {'number': u, 'text': books[bk][u][0], **({'greek': books[bk][u][1]} if books[bk][u][1] else {}),
             **({'ref': books[bk][u][2]} if books[bk][u][2] else {})}
            for u in sorted(books[bk])]} for bk in sorted(books)]
    else:
        units = {int(u): (en, grc.get((None, u), ''), refs.get((None, u))) for (b, u), en in eng.items() if u and u.isdigit()}
        chapters = [{'number': u, 'verses': [
            {'number': 1, 'text': units[u][0], **({'greek': units[u][1]} if units[u][1] else {}),
             **({'ref': units[u][2]} if units[u][2] else {})}]}
            for u in sorted(units)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    n_grk = sum(1 for c in chapters for v in c['verses'] if 'greek' in v)
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': n_grk}]


MARCUS_ATTRIB = ('Greek: Marcus Aurelius, Τὰ εἰς ἑαυτόν (Meditations). Digital edition: Perseus '
                 'Digital Library, CC-BY-SA 4.0 (perseus.tufts.edu). Greek only — see the note on '
                 'the work.')
PHILOSTRATUS_ATTRIB = ('Greek: Philostratus, Life of Apollonius of Tyana (Τὰ ἐς τὸν Τυανέα '
                       'Ἀπολλώνιον). Digital edition: Perseus Digital Library, CC-BY-SA 4.0. '
                       'Greek only.')
DIO_ATTRIB = ('Greek: Dio Chrysostom, Orations (Λόγοι). Digital edition: Perseus Digital '
              'Library, CC-BY-SA 4.0. Greek only.')
ARATUS_ATTRIB = ('Greek: Aratus, Phaenomena. Digital edition: Perseus Digital Library, '
                 'CC-BY-SA 4.0. Greek only; cited by line (line 5 is quoted at Acts 17:28). See '
                 'the “Pagan Sources Quoted in the New Testament” collection for the proem with a '
                 'translation.')
XENOPHON_ATTRIB = ('Text: Xenophon, Memorabilia, tr. E. C. Marchant (Loeb, 1923), public domain; '
                   'Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0 '
                   '(perseus.tufts.edu).')
LUCIAN_ATTRIB = ('Text: The Works of Lucian, tr. H. W. Fowler & F. G. Fowler (Oxford, 1905), '
                 'public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, '
                 'CC-BY-SA 4.0 (perseus.tufts.edu).')
APOLLODORUS_ATTRIB = ('Text: Apollodorus, The Library, tr. Sir James George Frazer (Loeb, '
                      '1921), public domain; Greek ed. Perseus. Digital edition: Perseus Digital '
                      'Library, CC-BY-SA 4.0 (perseus.tufts.edu).')
HOMER_ATTRIB = ('Greek: Homer, ed. D. B. Monro & T. W. Allen (OCT). English: A. T. Murray '
                '(Loeb, 1919–1925), public domain — the prose translation is given per card '
                '(a group of lines) beside the Greek. Digital edition: Perseus Digital Library, '
                'CC-BY-SA 4.0 (perseus.tufts.edu).')
HESIOD_ATTRIB = ('Greek: Hesiod (Perseus). English: Hugh G. Evelyn-White (Loeb, 1914), public '
                 'domain, given per ~5-line group beside the Greek; cited by line. Digital '
                 'edition: Perseus Digital Library, CC-BY-SA 4.0 (perseus.tufts.edu).')
HERODOTUS_ATTRIB = ('Text: Herodotus, The Histories, tr. A. D. Godley (Loeb, 1920–1925), public '
                    'domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, '
                    'CC-BY-SA 4.0 (perseus.tufts.edu).')


def parse_bcs(xml_bytes):
    """Return {(book, chapter, section): text} for a book→chapter→section TEI (Apollodorus)."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx); continue
            sub = (div.get('subtype') or '').lower()   # Herodotus' English uses "Book" (capital)
            c = dict(ctx); c[sub] = div.get('n')
            if sub == 'section':
                out[(c.get('book'), c.get('chapter'), div.get('n'))] = chapter_text(div)
            else:
                walk(div, c)
    walk(root.find('.//t:body', NS), {})
    return out


def build_bcs(slug_prefix, name_fmt, urn_dir, urn_base, eng_suffix, attrib, no_cache):
    """A book→chapter→section work, one file per book (chapter = chapter, verse = section), so
    "Apollod. 1.9.16" / "Xen. Mem. 1.2.3" opens Book 1, chapter 9/2, section 16/3."""
    base = f'{urn_dir}/{urn_base}'
    grc = parse_bcs(fetch(f'{base}.perseus-grc2.xml', no_cache))
    eng = parse_bcs(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache))
    books = {}
    for (b, ch, sec), en in eng.items():
        if all(x and x.isdigit() for x in (b, ch, sec)):
            books.setdefault(int(b), {}).setdefault(int(ch), {})[int(sec)] = (en, grc.get((b, ch, sec), ''))
    results = []
    for bk in sorted(books):
        chapters = [{'number': ch, 'verses': [
            {'number': sec, 'text': books[bk][ch][sec][0],
             **({'greek': books[bk][ch][sec][1]} if books[bk][ch][sec][1] else {})}
            for sec in sorted(books[bk][ch])]} for ch in sorted(books[bk])]
        doc = {'work': name_fmt(bk), 'attribution': attrib, 'greek': True, 'chapters': chapters}
        slug = f'{slug_prefix}-{bk}'
        (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        results.append({'slug': slug, 'doc': doc, 'chapters': len(chapters),
                        'verses': sum(1 for c in chapters for v in c['verses'] if 'greek' in v)})
    return results


def build(slug_prefix, name_fmt, urn_dir, urn_base, per_book, no_cache):
    grc = parse_chapters(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache))
    eng = parse_chapters(fetch(f'{urn_dir}/{urn_base}.perseus-eng3.xml', no_cache))
    books = {}
    for (b, ch), en in eng.items():
        if not (ch and ch.isdigit() and int(ch) > 0):
            continue                              # skip the n="0" preface chapter
        bk = int(b) if (per_book and b and b.isdigit()) else 1
        books.setdefault(bk, {})[int(ch)] = (en, grc.get((b, ch), ''))

    works = []
    for bk in sorted(books):
        slug = f'{slug_prefix}-{bk}' if per_book else slug_prefix
        # One verse per chapter (English + parallel Greek); Epictetus chapters are short.
        chapters = [{'number': ch, 'verses': [
            {'number': 1, 'text': books[bk][ch][0], **({'greek': books[bk][ch][1]} if books[bk][ch][1] else {})}]}
            for ch in sorted(books[bk])]
        doc = {'work': name_fmt(bk), 'attribution': ATTRIB, 'greek': True, 'chapters': chapters}
        (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        works.append({'slug': slug, 'book': bk if per_book else None, 'doc': doc,
                      'chapters': len(chapters), 'verses': sum(len(c['verses']) for c in chapters)})
    return works


def resolve(text):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    m = re.match(r'Epictetus,?\s*Ench\.\s+(\d+)', s)                    # Enchiridion, chapter
    if m:
        return ('epictetus-enchiridion', int(m.group(1)), None)
    m = re.match(r'Epictetus(?:,?\s*Diatr\.)?\s+(\d+)\.(\d+)', s)       # Discourses, book.chapter[.sec]
    if m:
        return (f'epictetus-discourses-{m.group(1)}', int(m.group(2)), None)
    m = re.match(r'Diogenes Laertius(?:, Vit\. phil\.)?\s+(\d+(?:\.\d+)+)', s)  # book.…​.section
    if m:
        p = [int(x) for x in m.group(1).split('.')]
        return ('diogenes-laertius', p[0], p[-1])                       # chapter=book, verse=section
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])
            if re.sub(r'^cf\.\s*', '', c['text'].strip()).startswith(('Epictetus', 'Diogenes Laertius'))]
    hit = miss = 0; misses = []
    for text in cits:
        r = resolve(text)
        if not r:
            miss += 1; misses.append(('UNMAPPED', text)); continue
        slug, ch, v = r
        w = by_slug.get(slug)
        chap = w and next((c for c in w['doc']['chapters'] if c['number'] == ch), None)
        ok = chap and (v is None or any(vv['number'] == v for vv in chap['verses']))
        if ok:
            hit += 1
        else:
            miss += 1; misses.append((f'{slug} {ch}:{v} missing', text))
    print(f'\nValidation: {len(cits)} Epictetus+Diogenes citations | resolved+found={hit} miss={miss}')
    for why, text in misses[:20]:
        print(f'   MISS  {text:34s} -> {why}')


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    results += build('epictetus-discourses', lambda b: f'Epictetus, Discourses (Book {b})',
                     'tlg0557/tlg001', 'tlg0557.tlg001', True, no_cache)
    results += build('epictetus-enchiridion', lambda b: 'Epictetus, Enchiridion',
                     'tlg0557/tlg002', 'tlg0557.tlg002', False, no_cache)
    results += build_sections('diogenes-laertius', 'Diogenes Laertius, Lives of the Philosophers',
                              'tlg0004/tlg001', 'tlg0004.tlg001', no_cache)
    # Plato — the dialogues, cited by Stephanus page (chapter = page). slug, display name, work id.
    for slug, name, wid in [
        ('plato-symposium',  'Plato, Symposium',  'tlg011'),
        ('plato-timaeus',    'Plato, Timaeus',    'tlg031'),
        ('plato-apology',    'Plato, Apology',    'tlg002'),
        ('plato-crito',      'Plato, Crito',      'tlg003'),
        ('plato-phaedo',     'Plato, Phaedo',     'tlg004'),
        ('plato-phaedrus',   'Plato, Phaedrus',   'tlg012'),
        ('plato-gorgias',    'Plato, Gorgias',    'tlg023'),
        ('plato-protagoras', 'Plato, Protagoras', 'tlg022'),
    ]:
        results += build_plato(slug, name, f'tlg0059/{wid}', f'tlg0059.{wid}', no_cache)
    # Aristotle — book→section (Ethics), book→chapter (Rhetoric), or flat chapters (Poetics),
    # each verse tagged with its Bekker number (the standard reference) from the "page" milestone.
    results += build_units('aristotle-nicomachean-ethics', 'Aristotle, Nicomachean Ethics',
                           'tlg0086/tlg010', 'tlg0086.tlg010', 'eng2', 'book', 'section', ARISTOTLE_ATTRIB, no_cache, ref_unit='page')
    results += build_units('aristotle-rhetoric', 'Aristotle, Rhetoric',
                           'tlg0086/tlg038', 'tlg0086.tlg038', 'eng2', 'book', 'chapter', ARISTOTLE_ATTRIB, no_cache, ref_unit='page')
    results += build_units('aristotle-poetics', 'Aristotle, Poetics',
                           'tlg0086/tlg034', 'tlg0086.tlg034', 'eng2', None, 'chapter', ARISTOTLE_ATTRIB, no_cache, ref_unit='page')
    # Plutarch — the Lives (Perrin's public-domain Loeb, chapter→section).
    results += build_units('plutarch-antony', 'Plutarch, Life of Antony',
                           'tlg0007/tlg058', 'tlg0007.tlg058', 'eng2', 'chapter', 'section', PLUTARCH_ATTRIB, no_cache)
    results += build_units('plutarch-alexander', 'Plutarch, Life of Alexander',
                           'tlg0007/tlg047', 'tlg0007.tlg047', 'eng2', 'chapter', 'section', PLUTARCH_ATTRIB, no_cache)
    # Plutarch, Moralia — On Isis and Osiris. Goodwin's public-domain English has no Stephanus
    # milestones, so it stays section-aligned (1–80); each section carries its Stephanus page
    # reference ("351c", the standard Moralia citation) from the Greek's "stephpage" milestone.
    results += build_units('plutarch-isis-osiris', 'Plutarch, On Isis and Osiris',
                           'tlg0007/tlg089', 'tlg0007.tlg089', 'eng4', None, 'section', PLUTARCH_MORALIA_ATTRIB, no_cache, ref_unit='stephpage')
    # Lucian — the two works bearing on early Christianity (Fowler's public-domain English,
    # flat sections; cited by section). Alexander has 61 Greek but 59 English sections.
    results += build_units('lucian-peregrinus', 'Lucian, The Passing of Peregrinus',
                           'tlg0062/tlg042', 'tlg0062.tlg042', 'eng4', None, 'section', LUCIAN_ATTRIB, no_cache)
    results += build_units('lucian-alexander', 'Lucian, Alexander the False Prophet',
                           'tlg0062/tlg038', 'tlg0062.tlg038', 'eng4', None, 'section', LUCIAN_ATTRIB, no_cache)
    # Apollodorus, The Library — the mythographic handbook (one work per book).
    results += build_bcs('apollodorus-library', lambda b: f'Apollodorus, The Library (Book {b})',
                         'tlg0548/tlg001', 'tlg0548.tlg001', 'eng2', APOLLODORUS_ATTRIB, no_cache)
    # Xenophon, Memorabilia — the Socratic ethics (four books; cited Mem. book.chapter.section).
    results += build_bcs('xenophon-memorabilia', lambda b: f'Xenophon, Memorabilia (Book {b})',
                         'tlg0032/tlg002', 'tlg0032.tlg002', 'eng2', XENOPHON_ATTRIB, no_cache)
    # Marcus Aurelius, Meditations — Greek only (no aligned English on Perseus; cited Med. book.chapter).
    results += build_greek_only('marcus-aurelius-meditations', 'Marcus Aurelius, Meditations',
                                'tlg0562/tlg001', 'tlg0562.tlg001', 'book', 'chapter', MARCUS_ATTRIB, no_cache)
    # Philostratus, Life of Apollonius (chapter = book, verse = chapter) and Dio Chrysostom's
    # Orations (chapter = oration, verse = section) — Greek only on Perseus.
    results += build_greek_only('philostratus-apollonius', 'Philostratus, Life of Apollonius of Tyana',
                                'tlg0638/tlg001', 'tlg0638.tlg001', 'book', 'chapter', PHILOSTRATUS_ATTRIB, no_cache)
    results += build_greek_only('dio-chrysostom-orations', 'Dio Chrysostom, Orations',
                                'tlg0612/tlg001', 'tlg0612.tlg001', 'speech', 'section', DIO_ATTRIB, no_cache)
    # Aratus, Phaenomena — the full didactic poem (Greek only, cited by line; line 5 = Acts 17:28).
    results += build_line_poem('aratus-phaenomena', 'Aratus, Phaenomena',
                               'tlg0653/tlg001', 'tlg0653.tlg001', ARATUS_ATTRIB, no_cache)
    # Homer — Iliad & Odyssey: Greek line-by-line with Murray's Loeb English per card (chapter =
    # book, verse = line; "Il. 1.1" → Book 1, line 1).
    results += build_line_parallel('homer-iliad', 'Homer, Iliad',
                                   'tlg0012/tlg001', 'tlg0012.tlg001', 'eng3', True, HOMER_ATTRIB, no_cache)
    results += build_line_parallel('homer-odyssey', 'Homer, Odyssey',
                                   'tlg0012/tlg002', 'tlg0012.tlg002', 'eng3', True, HOMER_ATTRIB, no_cache)
    # Hesiod — the three poems, cited by line (Evelyn-White's English per ~5-line group).
    results += build_line_parallel('hesiod-theogony', 'Hesiod, Theogony',
                                   'tlg0020/tlg001', 'tlg0020.tlg001', 'eng2', False, HESIOD_ATTRIB, no_cache)
    results += build_line_parallel('hesiod-works-and-days', 'Hesiod, Works and Days',
                                   'tlg0020/tlg002', 'tlg0020.tlg002', 'eng2', False, HESIOD_ATTRIB, no_cache)
    results += build_line_parallel('hesiod-shield', 'Hesiod, Shield of Heracles',
                                   'tlg0020/tlg003', 'tlg0020.tlg003', 'eng2', False, HESIOD_ATTRIB, no_cache)
    # Herodotus, The Histories — book→chapter→section, one work per book (Godley's Loeb English;
    # "Hdt. 1.1.1" → Book 1, chapter 1, section 1).
    results += build_bcs('herodotus-histories', lambda b: f'Herodotus, The Histories (Book {b})',
                         'tlg0016/tlg001', 'tlg0016.tlg001', 'eng2', HERODOTUS_ATTRIB, no_cache)
    for r in results:
        print(f'{r["slug"]:26s} chapters={r["chapters"]:2d} verses={r["verses"]:4d}')
    validate(results)


if __name__ == '__main__':
    main()
