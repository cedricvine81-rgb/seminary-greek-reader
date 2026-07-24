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
    # Drop the chapter heading and editorial notes, then flatten the remaining text.
    for tag in ('head', 'note'):
        for el in div.findall(f't:{tag}', NS) + div.findall(f'.//t:{tag}', NS):
            el.clear(); el.text = el.tail = ''
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


def parse_pages(xml_bytes):
    """Plato: the Perseus editions divide to Stephanus PAGE (<div subtype="section" n="172">),
    the standard citation unit, with a/b/c/d/e sub-sections marked only by inline milestones.
    Return {page:int -> text} for the integer-numbered page divs."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}
    for div in root.findall('.//t:div[@subtype="section"]', NS):
        n = div.get('n')
        if n and n.isdigit():
            out[int(n)] = chapter_text(div)
    return out


def build_plato(slug, name, urn_dir, urn_base, no_cache):
    """One dialogue: chapter = Stephanus page, one verse per page (English + parallel Greek)."""
    grc = parse_pages(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache))
    eng = parse_pages(fetch(f'{urn_dir}/{urn_base}.perseus-eng2.xml', no_cache))
    pages = sorted(p for p in eng if eng[p])
    chapters = [{'number': p, 'verses': [
        {'number': 1, 'text': eng[p], **({'greek': grc[p]} if grc.get(p) else {})}]}
        for p in pages]
    doc = {'work': name, 'attribution': PLATO_ATTRIB, 'greek': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    n_grk = sum(1 for c in chapters for v in c['verses'] if 'greek' in v)
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': n_grk}]


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


def build_units(slug, name, urn_dir, urn_base, eng_suffix, book_sub, unit_sub, attrib, no_cache):
    """One work with a book→unit or flat-unit TEI (Aristotle treatises, Plutarch Lives/Moralia).
    With books: chapter = book, verse = unit (Eth. nic. 1.7 → book 1 §7; Plut. Ant. 25.2 → ch. 25
    §2). Without books: chapter = unit, one verse (Poet. 6; Plutarch Moralia by section)."""
    base = f'{urn_dir}/{urn_base}'
    grc = parse_units(fetch(f'{base}.perseus-grc2.xml', no_cache), book_sub, unit_sub)
    eng = parse_units(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache), book_sub, unit_sub)
    if book_sub:
        books = {}
        for (b, u), en in eng.items():
            if b and b.isdigit() and u and u.isdigit():
                books.setdefault(int(b), {})[int(u)] = (en, grc.get((b, u), ''))
        chapters = [{'number': bk, 'verses': [
            {'number': u, 'text': books[bk][u][0], **({'greek': books[bk][u][1]} if books[bk][u][1] else {})}
            for u in sorted(books[bk])]} for bk in sorted(books)]
    else:
        units = {int(u): (en, grc.get((None, u), '')) for (b, u), en in eng.items() if u and u.isdigit()}
        chapters = [{'number': u, 'verses': [
            {'number': 1, 'text': units[u][0], **({'greek': units[u][1]} if units[u][1] else {})}]}
            for u in sorted(units)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    n_grk = sum(1 for c in chapters for v in c['verses'] if 'greek' in v)
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': n_grk}]


APOLLODORUS_ATTRIB = ('Text: Apollodorus, The Library, tr. Sir James George Frazer (Loeb, '
                      '1921), public domain; Greek ed. Perseus. Digital edition: Perseus Digital '
                      'Library, CC-BY-SA 4.0 (perseus.tufts.edu).')


def parse_bcs(xml_bytes):
    """Return {(book, chapter, section): text} for a book→chapter→section TEI (Apollodorus)."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx); continue
            c = dict(ctx); c[div.get('subtype')] = div.get('n')
            if div.get('subtype') == 'section':
                out[(c.get('book'), c.get('chapter'), div.get('n'))] = chapter_text(div)
            else:
                walk(div, c)
    walk(root.find('.//t:body', NS), {})
    return out


def build_apollodorus(no_cache):
    """The Library — one work per book (chapter = chapter, verse = section), so "Apollod. 1.9.16"
    opens Book 1, chapter 9, section 16."""
    base = 'tlg0548/tlg001/tlg0548.tlg001'
    grc = parse_bcs(fetch(f'{base}.perseus-grc2.xml', no_cache))
    eng = parse_bcs(fetch(f'{base}.perseus-eng2.xml', no_cache))
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
        doc = {'work': f'Apollodorus, The Library (Book {bk})', 'attribution': APOLLODORUS_ATTRIB,
               'greek': True, 'chapters': chapters}
        slug = f'apollodorus-library-{bk}'
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
    # Aristotle — book→section (Ethics), book→chapter (Rhetoric), or flat chapters (Poetics).
    results += build_units('aristotle-nicomachean-ethics', 'Aristotle, Nicomachean Ethics',
                           'tlg0086/tlg010', 'tlg0086.tlg010', 'eng2', 'book', 'section', ARISTOTLE_ATTRIB, no_cache)
    results += build_units('aristotle-rhetoric', 'Aristotle, Rhetoric',
                           'tlg0086/tlg038', 'tlg0086.tlg038', 'eng2', 'book', 'chapter', ARISTOTLE_ATTRIB, no_cache)
    results += build_units('aristotle-poetics', 'Aristotle, Poetics',
                           'tlg0086/tlg034', 'tlg0086.tlg034', 'eng2', None, 'chapter', ARISTOTLE_ATTRIB, no_cache)
    # Plutarch — the Lives (Perrin's public-domain Loeb, chapter→section).
    results += build_units('plutarch-antony', 'Plutarch, Life of Antony',
                           'tlg0007/tlg058', 'tlg0007.tlg058', 'eng2', 'chapter', 'section', PLUTARCH_ATTRIB, no_cache)
    results += build_units('plutarch-alexander', 'Plutarch, Life of Alexander',
                           'tlg0007/tlg047', 'tlg0007.tlg047', 'eng2', 'chapter', 'section', PLUTARCH_ATTRIB, no_cache)
    # Plutarch, Moralia — On Isis and Osiris (Goodwin's public-domain translation, flat sections).
    results += build_units('plutarch-isis-osiris', 'Plutarch, On Isis and Osiris',
                           'tlg0007/tlg089', 'tlg0007.tlg089', 'eng4', None, 'section', PLUTARCH_MORALIA_ATTRIB, no_cache)
    # Apollodorus, The Library — the mythographic handbook (one work per book).
    results += build_apollodorus(no_cache)
    for r in results:
        print(f'{r["slug"]:26s} chapters={r["chapters"]:2d} verses={r["verses"]:4d}')
    validate(results)


if __name__ == '__main__':
    main()
