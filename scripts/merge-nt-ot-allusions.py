# Merges the scholarly NT-OT intertextual-allusions table (originally a Word table,
# extracted to scripts/data/nt-ot-allusions-raw.json — see that file's header) into
# public/data/backgrounds-crossrefs.json, the Backgrounds page's cross-reference
# apparatus. Each row becomes one 'OT'-type citation (or several, when the OT Source
# column lists more than one passage) carrying kind/source/note metadata alongside the
# existing text/type/ref shape, appended to the matching NT entry (creating one if it
# doesn't already exist).
#
# Usage: python3 scripts/merge-nt-ot-allusions.py

import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RAW_PATH = REPO / 'scripts' / 'data' / 'nt-ot-allusions-raw.json'
BOOKS_PATH = REPO / 'public' / 'data' / 'books.json'
CROSSREFS_PATH = REPO / 'public' / 'data' / 'backgrounds-crossrefs.json'

raw = json.loads(RAW_PATH.read_text(encoding='utf-8'))
books = json.loads(BOOKS_PATH.read_text(encoding='utf-8'))
crossrefs = json.loads(CROSSREFS_PATH.read_text(encoding='utf-8'))


def norm(s: str) -> str:
    return re.sub(r'[\s.]', '', s).lower()


def book_alias_map(book_list):
    m = {}
    for b in book_list:
        for alias in (b['osisId'], b['name'], b['abbrev']):
            m[norm(alias)] = b['osisId']
    return m


NT_MAP = book_alias_map(books['gnt'])
OT_MAP = book_alias_map(books['lxx'])
NT_NAME = {b['osisId']: b['abbrev'] for b in books['gnt']}
OT_NAME = {b['osisId']: b['abbrev'] for b in books['lxx']}

NT_REF_RE = re.compile(r'^((?:\d\s?)?[A-Za-z.]+)\s+(\d+):(\d+)[a-c]?(?:[–\-](\d+)[a-c]?)?$')
# A full OT reference part: "Book Ch:Verse..." (verse tail may contain commas/ranges,
# e.g. "19:10,14,18" or "4:2–13,11–14" — kept verbatim in the display text).
OT_FULL_RE = re.compile(r'^((?:\d\s?)?[A-Za-z.]+)\s+(\d+):(.+)$')
# A bare "Ch:Verse..." part that inherits the book from the previous part in the list.
OT_CHVERSE_RE = re.compile(r'^(\d+):(.+)$')
FIRST_NUM_RE = re.compile(r'\d+')


def parse_nt_ref(text: str):
    m = NT_REF_RE.match(text.strip())
    if not m:
        raise ValueError(f'unparseable NT reference: {text!r}')
    book_tok, chapter, vs, ve = m.groups()
    osis = NT_MAP.get(norm(book_tok))
    if not osis:
        raise ValueError(f'unknown NT book {book_tok!r} in {text!r}')
    chapter = int(chapter)
    vs = int(vs)
    ve = int(ve) if ve else vs
    return {'book': osis, 'chapter': chapter, 'endChapter': chapter, 'verseStart': vs, 'verseEnd': ve}


def parse_ot_parts(text: str):
    """Yields (display_text, ref-or-None) for each ';'-separated OT citation part,
    inheriting the book (and chapter, for bare verse lists) from the previous part."""
    cur_book_tok = None
    cur_osis = None
    cur_chapter = None
    for part in text.split(';'):
        part = part.strip()
        m = OT_FULL_RE.match(part)
        if m:
            book_tok, chapter, verse_tail = m.groups()
            osis = OT_MAP.get(norm(book_tok))
            cur_book_tok, cur_osis, cur_chapter = book_tok, osis, int(chapter)
            display = part
        else:
            m = OT_CHVERSE_RE.match(part)
            if not m:
                raise ValueError(f'unparseable OT reference part: {part!r} (in {text!r})')
            chapter, verse_tail = m.groups()
            osis, cur_chapter = cur_osis, int(chapter)
            display = f'{cur_book_tok} {part}' if cur_book_tok else part
        first_verse_m = FIRST_NUM_RE.search(verse_tail)
        ref = None
        if osis and first_verse_m:
            ref = {'book': osis, 'chapter': cur_chapter, 'verse': int(first_verse_m.group())}
        elif not osis:
            print(f'  (no local text for OT book in {display!r} — leaving unlinked)')
        yield display, ref


entries_by_key = {}
for e in crossrefs['entries']:
    key = (e['book'], e['chapter'], e['endChapter'], e['verseStart'], e['verseEnd'])
    entries_by_key.setdefault(key, e)

added_citations = 0
added_entries = 0
errors = []

for row in raw:
    try:
        nt = parse_nt_ref(row['nt'])
    except ValueError as exc:
        errors.append(str(exc))
        continue

    key = (nt['book'], nt['chapter'], nt['endChapter'], nt['verseStart'], nt['verseEnd'])
    entry = entries_by_key.get(key)
    if entry is None:
        abbrev = NT_NAME[nt['book']]
        label = f'{abbrev} {nt["chapter"]}:{nt["verseStart"]}'
        if nt['verseEnd'] != nt['verseStart']:
            label += f'–{nt["verseEnd"]}'
        entry = {**nt, 'label': label, 'citations': []}
        crossrefs['entries'].append(entry)
        entries_by_key[key] = entry
        added_entries += 1

    existing_texts = {c['text'] for c in entry['citations']}
    try:
        parts = list(parse_ot_parts(row['ot']))
    except ValueError as exc:
        errors.append(str(exc))
        continue

    for display, ref in parts:
        if display in existing_texts:
            continue  # already covered by the Evans-derived dataset
        citation = {'text': display, 'type': 'OT', 'kind': row['type'], 'source': row['source'], 'note': row['note']}
        if ref:
            citation['ref'] = ref
        entry['citations'].append(citation)
        existing_texts.add(display)
        added_citations += 1

if errors:
    print(f'{len(errors)} row(s) failed to parse:')
    for e in errors:
        print(' -', e)

# Keep entries in canonical NT order (by book's position in books.json, then chapter/verse).
NT_ORDER = {b['osisId']: i for i, b in enumerate(books['gnt'])}
crossrefs['entries'].sort(key=lambda e: (NT_ORDER.get(e['book'], 999), e['chapter'], e['verseStart']))

ADDITIONAL_ATTRIBUTION = (
    ' Additional NT–OT intertextual citations (quotations and allusions) adapted from '
    'G.K. Beale & D.A. Carson (eds.), Commentary on the New Testament Use of the Old Testament '
    '(Baker Academic, 2007); R.T. France, The Gospel of Matthew (NICNT, Eerdmans, 2007); '
    'Richard B. Hays, Echoes of Scripture in the Letters of Paul (Yale UP, 1989); and other '
    'named commentaries per citation. Used for instructional purposes in a login-gated course tool.'
)
if ADDITIONAL_ATTRIBUTION not in crossrefs['attribution']:
    crossrefs['attribution'] += ADDITIONAL_ATTRIBUTION

CROSSREFS_PATH.write_text(json.dumps(crossrefs, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'entries: {len(crossrefs["entries"])} (+{added_entries} new)')
print(f'citations added: {added_citations}')
