"""Build Quintilian, Institutio Oratoria (parallel Latin + English) for the Texts library.

The great Roman handbook of rhetorical education (c. 95 CE) — essential background for the
rhetoric of the New Testament epistles. Both texts from the Perseus canonical-latinLit corpus
(github.com/PerseusDL/canonical-latinLit, CC BY-SA 3.0):
  · Latin    phi1002.phi001.perseus-lat2.xml — book → chapter → section.
  · English  phi1002.phi001.perseus-eng2.xml — the Rev. John Selby Watson translation (1856,
             public domain), same book → chapter → section division.

LATIN, NOT GREEK. The app has no Latin morphology, so this ships WITHOUT a parsing pane
(no .morph.json sidecar). The Latin sits in the reader's first column (labelled "Latin" via
the catalog's primaryLabel), Watson's English beside it. One work per book (12 books; the
so-called book 13 in the TEI is the prefatory letter to Trypho, folded in as book 1's
front-matter is not — it is shipped as its own short work). Cited "Quint. Inst. 10.1.2"
= book 10, chapter 1, section 2.

Alignment is on the exact (book, chapter, section) triple: where both editions carry it the
row is parallel; where only the Latin does (the English transcription has gaps) the row is
Latin-only. This can never mis-pair an English section under the wrong Latin one.

Output: public/data/quintilian/inst-<book>.json, one per book.
Usage:  python3 scripts/build-quintilian.py [--no-cache]     (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = ('https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/data/'
       'phi1002/phi001/')
LAT = 'phi1002.phi001.perseus-lat2.xml'
ENG = 'phi1002.phi001.perseus-eng2.xml'
CACHE = Path('/tmp/perseus-quintilian')
OUT = Path('public/data/quintilian')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

ATTRIBUTION = ('Latin: Quintilian, Institutio Oratoria, ed. H. E. Butler. English: the Rev. '
               'John Selby Watson (1856), public domain. Digital edition: Perseus Digital '
               'Library, CC BY-SA 3.0. Latin only — the app has no Latin parsing pane.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(name, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / name
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(RAW + name, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=90, context=_ctx).read()
    cached.write_bytes(data)
    return data


def sections(xml_bytes):
    """{(book, chapter, section): text}. Resolved via a parent map so every section div is
    captured regardless of any intermediate wrappers (an earlier direct-child walk silently
    dropped ~a third of the English). A section with no chapter ancestor is a book preface
    → chapter 0. Non-numeric book/chapter/section values are skipped."""
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    root = ET.fromstring(xml)
    parent = {c: p for p in root.iter() for c in p}

    def num(v):
        return int(v) if (v or '').isdigit() else None

    def ancestor_textparts(el):
        # {subtype: n} gathered from every textpart div above this element.
        ctx = {}
        cur = parent.get(el)
        while cur is not None:
            if cur.get('type') == 'textpart' and cur.get('subtype'):
                ctx.setdefault(cur.get('subtype'), cur.get('n'))
            cur = parent.get(cur)
        return ctx

    # Document order, so a chapter-less section can be told apart: the genuine prooemium
    # sits BEFORE the book's first numbered chapter; a chapter-less section appearing later
    # is an orphan (the English transcription drops some chapter wrappers) and must NOT be
    # filed as a preface — that mixed unrelated text into "chapter 0" and mis-paired it.
    order = {el: i for i, el in enumerate(root.iter())}
    secs = []
    first_num_chapter_idx = {}  # book -> earliest doc index of a numbered-chapter section
    for d in root.iter('{http://www.tei-c.org/ns/1.0}div'):
        if d.get('subtype') != 'section' or d.get('type') != 'textpart':
            continue
        ctx = ancestor_textparts(d)
        b, s, ch = num(ctx.get('book')), num(d.get('n')), num(ctx.get('chapter'))
        secs.append((order[d], d, b, ch, s))
        if b is not None and ch is not None:
            first_num_chapter_idx[b] = min(first_num_chapter_idx.get(b, 1 << 62), order[d])

    out = {}
    for idx, d, b, ch, s in secs:
        if b is None or s is None:
            continue
        if ch is None:
            # Preface only if it precedes the first numbered chapter of its book; else drop.
            if idx >= first_num_chapter_idx.get(b, 1 << 62):
                continue
            ch = 0
        t = re.sub(r'\s+', ' ', ''.join(d.itertext())).strip()
        if t:
            out[(b, ch, s)] = t
    return out


def main():
    no_cache = '--no-cache' in sys.argv
    lat = sections(fetch(LAT, no_cache))
    eng = sections(fetch(ENG, no_cache))
    OUT.mkdir(parents=True, exist_ok=True)

    # CHAPTER-LEVEL PARALLEL (the Eusebius model). Watson (1856) and Butler subdivide
    # *sections* differently, so a section-by-section pairing only matches ~64%. Their
    # CHAPTER numbers agree, though, so pair whole chapters: the Latin column carries the
    # chapter's sections joined with their numbers inline (superscripted §1 aside), and the
    # English column the whole chapter. Coarser citation (chapter precision), near-complete
    # English. One work per book.
    def join_sections(edition, b, ch):
        secs = sorted((s, edition[(b, c, s)]) for (bk, c, s) in edition if bk == b and c == ch)
        if not secs:
            return ''
        lead_is_one = secs[0][0] == 1
        return ' '.join((t if (i == 0 and lead_is_one) else f'{s} {t}')
                        for i, (s, t) in enumerate(secs))

    books = sorted(set(b for (b, _, _) in lat))
    total_ch = eng_hits = 0
    summary = []
    for b in books:
        chapters = []
        for ch in sorted(set(c for (bk, c, _) in lat if bk == b)):
            e = join_sections(eng, b, ch)
            if e:
                eng_hits += 1
            total_ch += 1
            chapters.append({'number': ch, 'verses': [
                {'number': 1, 'text': e, 'greek': join_sections(lat, b, ch)}]})
        doc = {
            'work': f'Quintilian, Institutio Oratoria (Book {b})',
            'attribution': ATTRIBUTION,
            'greek': True,        # occupies the first ("original") column — Latin here
            'chapters': chapters,
        }
        (OUT / f'inst-{b}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        summary.append((b, len(chapters)))

    print(f'{"book":>4} {"chapters":>8}')
    for b, nch in summary:
        print(f'{b:>4} {nch:>8}')
    print(f'\ntotal: {len(books)} books, {total_ch} chapters; '
          f'English paired {eng_hits}/{total_ch} chapters ({100*eng_hits//total_ch}%).')


if __name__ == '__main__':
    main()
