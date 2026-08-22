# Fetches C. D. Yonge's public-domain translation of Philo (one HTML page per treatise
# from earlychristianwritings.com/yonge/) and parses each into the shared prose
# chapter -> verse JSON shape (public/data/philo/<slug>.json), the same shape the rest of
# the embedded prose corpus uses (see src/lib/prose-texts.ts).
#
#   chapter = Philo BOOK number,  verse = Cohn-Wendland SECTION number.
#
# Yonge's pages carry the Cohn-Wendland section numbers in parentheses, which is exactly
# what the Backgrounds cross-reference dataset cites ("Philo, Moses 2.70", "Creation 30"),
# so citations resolve to the precise section. Two marker styles occur:
#   * single-book treatises use bare "(30)"           -> book comes from the page
#   * a treatise whose books share one page (Dreams)   uses "(1.195)" / "(2.4)"
#     -> book comes from the marker's leading number
# Multi-book treatises split across several pages (Moses I/II, Special Laws I-IV, ...)
# use bare markers on each page; the book number is the page's declared volume index.
#
# The source is HTTP (no TLS), declared iso-8859-1 but really latin-1 with a couple of
# quirky bytes (0xF9 stands in for an em-dash); non-ASCII otherwise only appears inside
# the {..} editorial/footnote braces, which are stripped.
#
# Usage:  python3 scripts/build-philo.py
#   (fetches over the network, caching pages under /tmp/philo-yonge/; pass --no-cache to
#    force re-fetch). Run from the repo root. After building it prints a validation report
#    of how many "Philo, ..." cross-reference citations resolve to a real section.

import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE = 'http://www.earlychristianwritings.com/yonge/'
CACHE = Path('/tmp/philo-yonge')
OUT_DIR = Path('public/data/philo')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
ATTRIB = 'Text: C. D. Yonge’s translation of Philo (1854–1855), public domain. Section numbers follow the Cohn-Wendland edition. Source: earlychristianwritings.com/yonge.'
# Yonge stops at Book III of the Questions and Answers on Genesis. Book IV (Genesis
# 18-28) survives complete only in Armenian, and its sole full English — Marcus, Loeb
# Supplement I (1953) — is in copyright, so it cannot be added. Said plainly in the
# work's attribution rather than left as a silent gap.
QG_NOTE = (' Yonge renders only Books I-III of the Questions and Answers on Genesis; Book IV '
           '(on Genesis 18-28) is not included here, because the work survives complete only '
           'in Armenian and the sole full English — Ralph Marcus, Loeb Classical Library '
           'Supplement I (1953) — is in copyright.')

# slug, display name, noteBook (stable note-anchor prefix), multiBook, [(bookNo|None, page)]
# bookNo None means "read the book number from the marker" (only Dreams, whose two books
# share one page). Order follows the site's own table of contents.
PHILO = [
    ('creation',      'On the Creation',                         'PhiloOpif',    False, [(1, 'book1')]),
    ('alleg-interp',  'Allegorical Interpretation',              'PhiloLeg',     True,  [(1, 'book2'), (2, 'book3'), (3, 'book4')]),
    ('cherubim',      'On the Cherubim',                         'PhiloCher',    False, [(1, 'book5')]),
    ('sacrifices',    'On the Sacrifices of Abel and Cain',      'PhiloSacr',    False, [(1, 'book6')]),
    ('worse',         'That the Worse Attacks the Better',       'PhiloDet',     False, [(1, 'book7')]),
    ('posterity',     'On the Posterity of Cain',                'PhiloPost',    False, [(1, 'book8')]),
    ('giants',        'On the Giants',                           'PhiloGig',     False, [(1, 'book9')]),
    ('unchangeable',  'On the Unchangeableness of God',          'PhiloDeus',    False, [(1, 'book10')]),
    ('husbandry',     'On Husbandry',                            'PhiloAgr',     False, [(1, 'book11')]),
    ('planter',       'On Noah’s Work as a Planter',             'PhiloPlant',   False, [(1, 'book12')]),
    ('drunkenness',   'On Drunkenness',                          'PhiloEbr',     False, [(1, 'book13')]),
    ('sobriety',      'On Sobriety',                             'PhiloSobr',    False, [(1, 'book14')]),
    ('confusion',     'On the Confusion of Tongues',             'PhiloConf',    False, [(1, 'book15')]),
    ('migration',     'On the Migration of Abraham',             'PhiloMigr',    False, [(1, 'book16')]),
    ('heir',          'Who Is the Heir of Divine Things?',       'PhiloHer',     False, [(1, 'book17')]),
    ('congress',      'On Mating with the Preliminary Studies',  'PhiloCongr',   False, [(1, 'book18')]),
    ('flight',        'On Flight and Finding',                   'PhiloFug',     False, [(1, 'book19')]),
    ('names',         'On the Change of Names',                  'PhiloMut',     False, [(1, 'book20')]),
    ('dreams',        'On Dreams',                               'PhiloSomn',    True,  [(None, 'book21')]),
    ('abraham',       'On the Life of Abraham',                  'PhiloAbr',     False, [(1, 'book22')]),
    ('joseph',        'On the Life of Joseph',                   'PhiloIos',     False, [(1, 'book23')]),
    ('moses',         'On the Life of Moses',                    'PhiloMos',     True,  [(1, 'book24'), (2, 'book25')]),
    ('decalogue',     'On the Decalogue',                        'PhiloDecal',   False, [(1, 'book26')]),
    ('spec-laws',     'On the Special Laws',                     'PhiloSpec',    True,  [(1, 'book27'), (2, 'book28'), (3, 'book29'), (4, 'book30')]),
    ('virtues',       'On the Virtues',                          'PhiloVirt',    False, [(1, 'book31')]),
    ('rewards',       'On Rewards and Punishments',              'PhiloPraem',   False, [(1, 'book32')]),
    ('good-person',   'Every Good Man Is Free',                  'PhiloProb',    False, [(1, 'book33')]),
    ('contemplative', 'On the Contemplative Life',               'PhiloContempl',False, [(1, 'book34')]),
    ('eternity',      'On the Eternity of the World',            'PhiloAet',     False, [(1, 'book35')]),
    ('flaccus',       'Against Flaccus',                         'PhiloFlacc',   False, [(1, 'book36')]),
    ('hypothetica',   'Hypothetica (Apology for the Jews)',      'PhiloHypoth',  False, [(1, 'book37')]),
    ('providence',    'On Providence',                           'PhiloProv',    True,  [(1, 'book38'), (2, 'book39')]),
    ('embassy',       'On the Embassy to Gaius',                 'PhiloLegat',   False, [(1, 'book40')]),
    ('qg',            'Questions and Answers on Genesis',        'PhiloQG',      True,  [(1, 'book41'), (2, 'book42'), (3, 'book43')]),
    ('world',         'On the World (Appendix)',                 'PhiloWorld',   False, [(1, 'book44')]),
    ('fragments',     'Fragments (Appendix)',                    'PhiloFrag',    False, [(1, 'book45')]),
]

MARKER_RE = re.compile(r'\((\d+)(?:\.(\d+))?\)')
# A Roman-numeral chapter header (e.g. "XVII.") or a "BOOK 2" heading always immediately
# precedes a section marker, so after slicing it lands as trailing junk on the *previous*
# section's text — strip it off the tail.
TRAIL_JUNK_RE = re.compile(r'(?:\s+(?:BOOK\s+[0-9IVXLC]+|[IVXLCDM]{1,6})\.?)+\s*$')


def fetch(page: str, no_cache: bool) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / f'{page}.html'
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(BASE + f'{page}.html', headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=30).read()
    cached.write_bytes(data)
    time.sleep(0.5)  # be polite to the host
    return data


def page_to_text(raw: bytes) -> str:
    h = raw.decode('latin-1')
    h = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h)
    # Trim the site footer that follows the treatise body.
    for sentinel in ('<hr width="50%"', 'Tables of Contents</a>', 'Go to the'):
        idx = h.find(sentinel)
        if idx != -1:
            h = h[:idx]
            break
    # The source hard-wraps its HTML, so a literal newline is a display line break, NOT a
    # paragraph boundary. Flatten those first, so that after the next line a '\n' means one
    # thing only: a real <p>/<br>/<div>/<hr>. Without this the marker-less fallback below
    # emitted one "verse" per display line, cut mid-sentence (world, fragments, providence I).
    # The marker path is unaffected: it collapses \s+ within each section either way.
    h = h.replace('\r', ' ').replace('\n', ' ')
    h = re.sub(r'(?i)<(p|br|div|hr)\b[^>]*>', '\n', h)   # keep paragraph boundaries
    t = html.unescape(re.sub(r'<[^>]+>', ' ', h))
    t = t.replace('\xf9', '—')            # this source's stand-in byte for an em-dash
    t = re.sub(r'\{[^{}]*\}', ' ', t)      # drop {*}/{**...}/{7} editorial + footnote braces
    # Drop the leading site nav/breadcrumb — it always ends with the "The Works of Philo"
    # header immediately before the treatise title.
    head = t[:2500]
    cut = head.rfind('The Works of Philo')
    if cut != -1:
        t = t[cut + len('The Works of Philo'):]
    return t


def parse_page(raw: bytes, page_book):
    """Return list of (book, section, text) for one treatise page. Pages that carry no
    Cohn-Wendland "(n)" markers (the two appendices and the Providence I fragment are
    continuous prose) fall back to one verse per paragraph so they still read cleanly."""
    t = page_to_text(raw)
    markers = list(MARKER_RE.finditer(t))
    out = []
    if not markers:
        book = page_book if page_book is not None else 1
        n = 0
        for para in t.split('\n'):
            para = re.sub(r'\s+', ' ', para).strip()
            para = re.sub(r'^[IVXLCDM]{1,6}\.\s+', '', para)   # drop a leading Roman header
            if len(para) < 60:            # skip stray title/heading fragments
                continue
            n += 1
            out.append((book, n, para))
        return out
    for i, m in enumerate(markers):
        end = markers[i + 1].start() if i + 1 < len(markers) else len(t)
        text = t[m.start() + len(m.group(0)):end]
        text = TRAIL_JUNK_RE.sub('', text)
        text = re.sub(r'\s+', ' ', text).strip()
        if m.group(2):                     # "(book.section)"
            book, section = int(m.group(1)), int(m.group(2))
        else:                              # bare "(section)"
            book, section = page_book, int(m.group(1))
        if book is None:                   # Dreams page with a stray bare marker — skip
            continue
        out.append((book, section, text))
    return out


def build_work(slug, name, note_book, multi, pages, no_cache):
    by_book = {}
    for page_book, page in pages:
        for book, section, text in parse_page(fetch(page, no_cache), page_book):
            by_book.setdefault(book, {})[section] = text
    # The reader builds a work's chapter list as 1..N (buildQueue in TextsReader.tsx), so
    # chapter numbers must run contiguously from 1. Cited multi-book treatises already do;
    # only the uncited Hypothetica fragments carry Eusebius book numbers (5,6,7,11), which
    # are renumbered here to 1..N (nothing in Backgrounds references them by book).
    ordered = sorted(by_book)
    contiguous = ordered == list(range(1, len(ordered) + 1))
    chapters = []
    for i, book in enumerate(ordered):
        verses = [{'number': s, 'text': by_book[book][s]} for s in sorted(by_book[book])]
        chapters.append({'number': book if contiguous else i + 1, 'verses': verses})
    doc = {'work': name, 'attribution': ATTRIB + (QG_NOTE if slug == 'qg' else ''), 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    nverses = sum(len(c['verses']) for c in chapters)
    return {'slug': slug, 'chapters': len(chapters), 'verses': nverses,
            'books': [c['number'] for c in chapters], 'doc': doc}


# ── Citation resolution (mirrors the parseCitation logic in prose-texts.ts) so the build
#    can validate itself against the real cross-reference dataset. ──
ABBREVS = {  # slug -> (list of citation abbreviations, multiBook)
    'creation': (['Creation'], False), 'alleg-interp': (['Alleg. Interp.'], True),
    'cherubim': (['Cherubim'], False), 'sacrifices': (['Sacrifices'], False),
    'worse': (['Worse'], False), 'posterity': (['Posterity'], False),
    'giants': (['Giants'], False), 'unchangeable': (['Unchangeableness', 'Deus'], False),
    'husbandry': (['Husbandry'], False), 'planter': (['Planter'], False),
    'drunkenness': (['Drunkenness'], False), 'sobriety': (['Sobriety'], False),
    'confusion': (['Confusion'], False), 'migration': (['Migration'], False),
    'heir': (['Heir'], False), 'congress': (['Congress', 'Preliminary Studies'], False),
    'flight': (['Flight'], False), 'names': (['Change of Names', 'Names'], False),
    'dreams': (['Dreams'], True), 'abraham': (['On the Life of Abraham', 'Abraham'], False),
    'joseph': (['Joseph'], False), 'moses': (['Moses'], True),
    'decalogue': (['Decalogue'], False), 'spec-laws': (['Spec. Laws', 'Special Laws'], True),
    'virtues': (['Virtues'], False), 'rewards': (['Rewards'], False),
    'good-person': (['Good Person'], False), 'contemplative': (['Contemplative'], False),
    'eternity': (['Eternity'], False), 'flaccus': (['Flaccus'], False),
    'hypothetica': (['Hypothetica'], False), 'providence': (['Providence'], True),
    'embassy': (['Embassy'], False), 'qg': (['QG'], True),
    'world': (['On the World'], False), 'fragments': ([], False),
}


def resolve(text):
    """Return (slug, chapter, verse) or None — same rules the app's parseCitation uses."""
    s = re.sub(r'^cf\.\s*', '', text.strip())
    s = re.sub(r'^idem,\s*', '', s)
    pm = re.match(r'Philo,?\s+(.+)$', s)
    if not pm:
        return None
    tail = pm.group(1).strip()
    for slug, (abbrevs, multi) in ABBREVS.items():
        for ab in sorted(abbrevs, key=len, reverse=True):
            if tail.startswith(ab) and re.match(r'\s+(?:\d|§)', tail[len(ab):]):
                rest = tail[len(ab):]
                sec = re.search(r'§\s*(\d+)', rest)
                if sec:
                    lead = re.match(r'\s*(\d+)', rest)
                    chapter = int(lead.group(1)) if (multi and lead) else 1
                    return (slug, chapter, int(sec.group(1)))
                nums = re.match(r'\s*(\d+(?:\.\d+)*)', rest)
                parts = [int(x) for x in nums.group(1).split('.')]
                if multi:
                    chapter = parts[0] if len(parts) >= 2 else 1
                    verse = parts[-1] if len(parts) >= 2 else parts[0]
                else:
                    chapter, verse = 1, parts[0]
                return (slug, chapter, verse)
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = []
    for e in data['entries']:
        for c in e.get('citations', []):
            if c.get('type') == 'Philo' and c['text'].strip().replace('cf. ', '').startswith(('Philo', 'cf. Philo')):
                cits.append(c['text'])
    cits = [c for c in cits if 'Philostratus' not in c]
    hit = miss = unmapped = 0
    misses = []
    for text in cits:
        r = resolve(text)
        if not r:
            unmapped += 1
            misses.append(('UNMAPPED', text))
            continue
        slug, ch, v = r
        doc = by_slug.get(slug, {}).get('doc')
        found = doc and any(c['number'] == ch and any(vv['number'] == v for vv in c['verses']) for c in doc['chapters'])
        if found:
            hit += 1
        else:
            miss += 1
            misses.append((f'{slug} {ch}:{v} not in text', text))
    print(f'\nValidation: {len(cits)} Philo citations | resolved+found={hit} '
          f'resolved-but-missing={miss} unmapped={unmapped}')
    for why, text in misses:
        print(f'   MISS  {text:40s} -> {why}')


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, name, note_book, multi, pages in PHILO:
        r = build_work(slug, name, note_book, multi, pages, no_cache)
        results.append(r)
        print(f'{slug:14s} books={r["books"]} verses={r["verses"]}')
    validate(results)


if __name__ == '__main__':
    main()
