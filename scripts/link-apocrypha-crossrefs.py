# Adds `ref` fields to backgrounds-crossrefs.json citations for the Apocrypha /
# deuterocanonical books that are now embedded in the LXX corpus (public/data/lxx/),
# so the Backgrounds page opens them as in-app Greek text in the right column instead
# of linking out to Wikisource. This is the same treatment OT/LXX citations already
# get; the Apocrypha were only left unlinked before because their text wasn't embedded
# yet (see also scripts/build-2esdras.py for 2 Esdras, which lives outside the LXX).
#
# The render logic in BackgroundsView.tsx short-circuits the external-link path the
# moment a citation has a `ref` (`!c.ref ? secondTempleUrl(...) : null`), so adding the
# ref is all that's needed — the citation then loads via /api/reader (which falls back
# from NA1904 to each book's native LXX corpus).
#
# Deliberately NOT touched:
#   - Barn. (Epistle of Barnabas), Odes Sol. (Odes of Solomon), 2/3/4 Bar., 2/3 En.,
#     Jub., T. * , etc. — genuine pseudepigrapha, not embedded; must stay external.
#   - 2 Esdr / 4 Ezra — embedded separately (public/data/apocrypha/2esdras.json) and
#     already resolved at render time by parse2EsdrasRef, so they need no `ref` here.
#   - Pr Man — the Prayer of Manasseh is Ode 12 in the LXX, but relabeling a "Pr Man N"
#     citation as "Odes 12:N" would confuse; left external to Wikisource's clearer page.
#   - MT-numbered OT Psalms etc. — would need MT->LXX psalm-number conversion; out of scope.
#
# Usage: python3 scripts/link-apocrypha-crossrefs.py

import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CROSSREFS = REPO / 'public' / 'data' / 'backgrounds-crossrefs.json'
BOOKS = REPO / 'public' / 'data' / 'books.json'

d = json.loads(CROSSREFS.read_text(encoding='utf-8'))
lxx_osis = {b['osisId'] for b in json.loads(BOOKS.read_text(encoding='utf-8'))['lxx']}
LXX_DIR = REPO / 'public' / 'data' / 'lxx'


def chapter_exists(osis: str, chapter: int) -> bool:
    return (LXX_DIR / f'{osis}_{chapter}.json').exists()

# Multi-chapter books: "<label> C:V…" -> {book, chapter C, verse V (first verse cited)}.
# The trailing space in each pattern is what keeps "Bar " from matching "Barn." and
# "1 Macc" from matching anything else.
CHAPTER_VERSE = [
    (re.compile(r'^Sir (\d+):(\d+)'),     'Sir'),
    (re.compile(r'^Wis (\d+):(\d+)'),     'Wis'),
    (re.compile(r'^Tob (\d+):(\d+)'),     'Tob'),
    (re.compile(r'^Jdt (\d+):(\d+)'),     'Jdt'),
    (re.compile(r'^Bar (\d+):(\d+)'),     'Bar'),
    (re.compile(r'^1 Macc (\d+):(\d+)'),  '1Macc'),
    (re.compile(r'^2 Macc (\d+):(\d+)'),  '2Macc'),
    (re.compile(r'^3 Macc (\d+):(\d+)'),  '3Macc'),
    (re.compile(r'^4 Macc (\d+):(\d+)'),  '4Macc'),
    (re.compile(r'^1 Esdr? (\d+):(\d+)'), '1Esd'),
]
# Single-chapter books cited as "<label> V" (no colon). The (?!:) guards against a
# stray "C:V" form being misread as verse C.
VERSE_ONLY = [
    (re.compile(r'^Sus (\d+)(?!:)'),    'Sus'),
    (re.compile(r'^Bel (\d+)(?!:)'),    'Bel'),
    (re.compile(r'^Ep Jer (\d+)(?!:)'), 'EpJer'),
]

# A leading "cf. " / "idem, " is editorial, not part of the reference — strip before matching.
STRIP_PREFIX = re.compile(r'^(?:cf\.\s*|idem,\s*)+')

linked = 0
by_book = {}
for e in d['entries']:
    for c in e['citations']:
        if c.get('ref'):
            continue
        text = STRIP_PREFIX.sub('', c['text'])
        matched = None
        for rx, osis in CHAPTER_VERSE:
            m = rx.match(text)
            if m:
                matched = (osis, int(m.group(1)), int(m.group(2)))
                break
        if not matched:
            for rx, osis in VERSE_ONLY:
                m = rx.match(text)
                if m:
                    matched = (osis, 1, int(m.group(1)))
                    break
        if not matched:
            continue
        osis, chapter, verse = matched
        if osis not in lxx_osis:
            print(f'  ! {osis} not in LXX corpus — skipping "{c["text"]}"')
            continue
        # Some source citations carry impossible chapter numbers (e.g. "Wis 54:15" —
        # Wisdom has 19 chapters; "3 Macc 48:10" — 3 Macc has 7). Linking those would
        # load "No text found", strictly worse than the working external link, so leave
        # them external. Guard on the actual chapter file existing.
        if not chapter_exists(osis, chapter):
            print(f'  ! {osis} {chapter} does not exist — leaving external: "{c["text"]}"')
            continue
        c['ref'] = {'book': osis, 'chapter': chapter, 'verse': verse}
        linked += 1
        by_book[osis] = by_book.get(osis, 0) + 1

CROSSREFS.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'linked {linked} Apocrypha citations to embedded text:')
for osis in sorted(by_book):
    print(f'  {osis:8} {by_book[osis]}')
