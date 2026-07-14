# Builds Niese-numbered, dual Greek+English Josephus from the Perseus canonical TEI
# (github.com/PerseusDL/canonical-greekLit, tlg0526; Greek = Niese 1885-1895, English =
# Whiston 1737; digital edition CC-BY-SA 4.0). Output shape (one file per book):
#   { number: <book>, verses: [ { number: <niese §>, text: <english>, greek: <grc>,
#                                 wref: "<whiston chapter>.<whiston section>"|null } ] }
#
# Two alignment strategies (see scripts/analyze-josephus-niese.py for why):
#   * Jewish War (tlg004) & Antiquities (tlg001): the Greek carries Whiston_chapter/
#     Whiston_section milestones, so each Niese section is mapped to a Whiston (chapter,
#     section) and given that section's English from the EXISTING embedded Whiston text
#     (public/data/josephus/<work>/<book>.json). This also yields the note-migration map.
#   * Against Apion (tlg003) & Life (tlg002): no milestones; use Perseus's own Whiston
#     English (perseus-eng2), which is divided at Niese-range granularity — each English
#     block is attached to its starting Niese section (later sections in the range inherit
#     an empty english + a pointer, so nothing is duplicated).
#
# Writes to a STAGING dir (default /tmp/josephus-niese) and prints a validation report.
# Nothing under public/ is touched. Usage: python3 scripts/build-josephus-greek.py [--out DIR]

import json, re, ssl, sys, urllib.request
from collections import defaultdict
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0526/'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
WORKS = {  # work-dir -> (urn, has_whiston_milestones)
    'jewish-war':    ('tlg004', True),
    'antiquities':   ('tlg001', True),
    'against-apion': ('tlg003', False),
    'life':          ('tlg002', False),
}
WORK_NAME = {'jewish-war': 'Josephus, The Jewish War', 'antiquities': 'Josephus, Antiquities of the Jews',
             'against-apion': 'Josephus, Against Apion', 'life': 'Josephus, The Life'}
ATTRIB = ('Text: William Whiston’s translation of Josephus, 1737 (public domain); Greek ed. '
          'B. Niese, 1885–1895. Digital edition: Perseus Digital Library, CC-BY-SA 4.0 '
          '(perseus.tufts.edu). Sections numbered per Niese.')
try:
    CTX = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    CTX = ssl._create_unverified_context()


def fetch(urn, lang):
    cache = Path(f'/tmp/josephus-{urn}-{lang}.xml')
    if cache.exists():
        return cache.read_bytes()
    url = f'{RAW}{urn}/tlg0526.{urn}.perseus-{lang}.xml'
    data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}),
                                  timeout=120, context=CTX).read()
    cache.write_bytes(data)
    return data


def section_texts(urn, lang):
    """Ordered list of events preserving document order:
    ('book', n) | ('wch', n) | ('wsec', n) | ('sec', n, text). Book is None if the work has
    no book divisions (Life). Whiston milestones may sit BETWEEN section divs (Jewish War) or
    INSIDE them at the leading edge (Antiquities); both placements are captured, so a section
    that begins a new Whiston chapter/section is tagged with it."""
    xml = fetch(urn, lang).decode('utf-8', 'replace')
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml)
    body = xml[xml.find('<body'):]
    events = []
    sec_div = re.compile(r'<div\b[^>]*subtype="section"[^>]*\bn="([^"]*)"[^>]*>(.*?)</div>', re.S)
    marker = re.compile(r'<div\b[^>]*subtype="book"[^>]*\bn="([^"]*)"|'
                        r'<milestone[^>]*\bn="([^"]*)"[^>]*unit="Whiston_chapter"|'
                        r'<milestone[^>]*\bn="([^"]*)"[^>]*unit="Whiston_section"')

    def emit_markers(chunk):
        for mm in marker.finditer(chunk):
            bk, wc, ws = mm.groups()
            if bk is not None: events.append(('book', bk))
            elif wc is not None: events.append(('wch', wc))
            elif ws is not None: events.append(('wsec', ws))

    pos = 0
    for sm in sec_div.finditer(body):
        emit_markers(body[pos:sm.start()])   # markers between sections (Jewish War style)
        emit_markers(sm.group(2))            # markers inside the section (Antiquities style)
        txt = re.sub(r'<[^>]+>', ' ', sm.group(2))
        txt = re.sub(r'\s+', ' ', txt).strip()
        events.append(('sec', sm.group(1), txt))
        pos = sm.end()
    return events


def greek_with_whiston(urn):
    """[(book:int, niese:int, greek, (wch,wsec)|None)] in order."""
    book = wch = wsec = None
    out = []
    for e in section_texts(urn, 'grc2'):
        if e[0] == 'book': book = e[1]
        elif e[0] == 'wch': wch = e[1]; wsec = None
        elif e[0] == 'wsec': wsec = e[1]
        elif e[0] == 'sec':
            b = int(book) if (book and book.isdigit()) else 1
            n = int(e[1]) if e[1].isdigit() else None
            if n is None: continue
            wref = None
            if wch is not None and wsec is not None:
                c = 0 if wch.strip('.').lower() in ('pr', 'proem', 'preface') else (int(wch) if wch.isdigit() else None)
                s = int(wsec) if wsec.isdigit() else None
                if c is not None and s is not None: wref = (c, s)
            out.append((b, n, e[2], wref))
    return out


def perseus_english_ranges(urn):
    """For milestone-less works: [(book:int, start_niese:int, english)] — each Perseus
    English block keyed by the Niese section it starts at."""
    book = None
    out = []
    for e in section_texts(urn, 'eng2'):
        if e[0] == 'book': book = e[1]
        elif e[0] == 'sec':
            b = int(book) if (book and book.isdigit()) else 1
            n = int(e[1]) if e[1].isdigit() else None
            if n is not None: out.append((b, n, e[2]))
    return out


def load_english_structure(work):
    """From the existing embedded Whiston text return:
      texts:   {(book,wch,wsec): english}
      btitle:  {book: book-title}
      ctitle:  {(book,wch): chapter-title}"""
    texts, btitle, ctitle = {}, {}, {}
    for f in sorted(Path(f'public/data/josephus/{work}').glob('*.json')):
        if f.name == 'index.json': continue
        d = json.loads(f.read_text())
        b = d['number']; btitle[b] = d.get('title', '')
        for ch in d['chapters']:
            ctitle[(b, ch['number'])] = ch.get('title', '')
            for s in ch['sections']:
                texts[(b, ch['number'], s['number'])] = s['text']
    return texts, btitle, ctitle


def build_milestone_work(work, urn):
    """Chapters = Whiston chapters; sections = Niese §§ (with Greek). English is attached to
    the FIRST § of each Whiston section only (later §§ of that section are Greek-only) so no
    English paragraph is duplicated across the §§ it spans."""
    greek = greek_with_whiston(urn)
    texts, btitle, ctitle = load_english_structure(work)
    # book -> chapter(wch) -> list of section dicts
    books = defaultdict(lambda: defaultdict(list))
    migration = []
    stats = {'sections': 0, 'with_greek': 0, 'with_english': 0, 'greek_only': 0}
    seen_wsec = set()        # (book, wch, wsec) already given its English
    for (b, niese, grc, wref) in greek:
        stats['sections'] += 1
        stats['with_greek'] += 1 if grc else 0
        wch = wref[0] if wref else 0        # proem/unmarked -> chapter 0
        en = ''
        if wref is not None:
            key = (b, wref[0], wref[1])
            if key not in seen_wsec:
                en = texts.get(key, '')
                seen_wsec.add(key)
                migration.append((work, b, wref[0], wref[1], niese))   # first § of this Whiston section
        if en: stats['with_english'] += 1
        else: stats['greek_only'] += 1
        books[b][wch].append({'number': niese, 'text': en, 'greek': grc})
    return _assemble(work, books, btitle, ctitle), migration, stats


def build_range_work(work, urn):
    """No Whiston milestones (Against Apion, Life). One chapter per book; sections = Niese §§
    with Greek; Perseus's Whiston English attaches at each range-start section."""
    greek = greek_with_whiston(urn)
    _, btitle, _ = load_english_structure(work)
    eng_at = {(b, n): t for (b, n, t) in perseus_english_ranges(urn)}
    books = defaultdict(lambda: defaultdict(list))
    stats = {'sections': 0, 'with_greek': 0, 'with_english': 0, 'greek_only': 0}
    for (b, niese, grc, _wref) in greek:
        stats['sections'] += 1
        stats['with_greek'] += 1 if grc else 0
        en = eng_at.get((b, niese), '')
        if en: stats['with_english'] += 1
        else: stats['greek_only'] += 1
        books[b][1].append({'number': niese, 'text': en, 'greek': grc})
    return _assemble(work, books, btitle, {}), [], stats


def _assemble(work, books, btitle, ctitle):
    """books[book][wch] -> [section dicts]  ==>  {book: doc} in chapter->section shape.
    Whiston chapter numbers are preserved (so cross-refs like 6.5.3 still resolve to chapter
    5). The proem / unmarked sections land in chapter 0; since the reader numbers chapters
    from 1, fold chapter 0's Greek-only sections onto the front of the book's first real
    chapter rather than introducing a 0."""
    out = {}
    for b in sorted(books):
        chdict = books[b]
        proem = chdict.pop(0, [])
        realchaps = sorted(chdict)
        if proem:
            if realchaps:
                chdict[realchaps[0]] = proem + chdict[realchaps[0]]
            else:
                chdict[1] = proem
            realchaps = sorted(chdict)
        chapters = [{'number': wch, 'title': ctitle.get((b, wch), ''),
                     'sections': chdict[wch]} for wch in realchaps]
        out[b] = {'number': b, 'title': btitle.get(b, ''), 'work': WORK_NAME[work],
                  'attribution': ATTRIB, 'greek': True, 'chapters': chapters}
    return out


def main():
    out_dir = Path('/tmp/josephus-niese')
    if '--out' in sys.argv:
        out_dir = Path(sys.argv[sys.argv.index('--out') + 1])
    out_dir.mkdir(parents=True, exist_ok=True)
    all_migration = []
    print(f'Writing staging output to {out_dir}\n')
    for work, (urn, has_ms) in WORKS.items():
        docs, migration, stats = (build_milestone_work if has_ms else build_range_work)(work, urn)
        wd = out_dir / work
        wd.mkdir(exist_ok=True)
        for b, doc in docs.items():
            (wd / f'{b}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        all_migration += migration
        sec, ge, en = stats['sections'], stats['with_greek'], stats['with_english']
        nchap = sum(len(d['chapters']) for d in docs.values())
        print(f'{work:14s} books={len(docs):2d} chapters={nchap:4d} sections={sec:5d} '
              f'greek={ge:5d} english_blocks={en:5d} '
              f'| {"milestone" if has_ms else "perseus-range"}')
    # note-migration map: unique Whiston (work,book,chapter,section) -> FIRST Niese section
    first = {}
    for (w, wb, wc, ws, ni) in all_migration:
        k = (w, wb, wc, ws)
        if k not in first or ni < first[k]:
            first[k] = ni
    mig = {'note': 'Whiston (work, book, chapter, section) -> Niese section (first covering)',
           'entries': [{'work': w, 'wbook': wb, 'wchapter': wc, 'wsection': ws, 'niese': ni}
                       for (w, wb, wc, ws), ni in sorted(first.items())]}
    (out_dir / 'note-migration.json').write_text(json.dumps(mig, ensure_ascii=False), encoding='utf-8')
    print(f'\nNote-migration: {len(first)} unique Whiston sections mapped to a Niese anchor')


if __name__ == '__main__':
    main()
