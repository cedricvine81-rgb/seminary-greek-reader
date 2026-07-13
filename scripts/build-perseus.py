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
    for r in results:
        print(f'{r["slug"]:26s} chapters={r["chapters"]:2d} verses={r["verses"]:4d}')
    validate(results)


if __name__ == '__main__':
    main()
