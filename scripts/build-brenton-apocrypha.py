# Parses Brenton's English Septuagint (Sir Lancelot C. L. Brenton, 1851, public domain)
# from ebible.org's eng-Brenton USFM into per-book JSON under public/data/brenton/, for
# the deuterocanonical / Apocrypha books only. These are Brenton's own English of the
# Greek, so they sit verse-aligned next to the LXX Rahlfs Greek the app already shows,
# and — unlike the protocanonical OT — they have no BSB/WEB English available. The OT
# books are intentionally skipped (BSB/WEB already cover them, and Brenton's Vaticanus
# versification diverges from Rahlfs in a few OT books, e.g. Jeremiah).
#
# Output: public/data/brenton/<osisId>.json = { "<osisId>.<chapter>.<verse>": "text", … }
# keyed exactly like bsb-alignment.json so the right column can filter it by chapter.
#
# Usage:
#   curl -sL https://ebible.org/Scriptures/eng-Brenton_usfm.zip -o /tmp/brenton.zip
#   unzip -o /tmp/brenton.zip -d /tmp/brenton_usfm
#   python3 scripts/build-brenton-apocrypha.py /tmp/brenton_usfm public/data/brenton

import json
import re
import sys
from pathlib import Path

USFM_DIR = Path(sys.argv[1])
OUT_DIR = Path(sys.argv[2])
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ebible USFM file stem (book code) -> the app's LXX osisId. Prayer of Manasseh (MAN) is
# omitted: the app carries it as Ode 12, not a standalone book. Daniel-Greek additions
# (DAG) are omitted: Susanna/Bel are their own books here (SUS/BEL) and the rest live
# inside DanLXX with a different versification.
BOOK_MAP = {
    'TOB': 'Tob', 'JDT': 'Jdt', 'ESG': 'EsthGr', 'WIS': 'Wis', 'SIR': 'Sir',
    'BAR': 'Bar', 'LJE': 'EpJer', 'SUS': 'Sus', 'BEL': 'Bel',
    '1MA': '1Macc', '2MA': '2Macc', '1ES': '1Esd', '3MA': '3Macc', '4MA': '4Macc',
}

C_RE = re.compile(r'^\\c\s+(\d+)')
V_RE = re.compile(r'^\\v\s+(\d+)([a-z]?)\s?(.*)')  # verse number, optional sub-letter, text


def clean(text: str) -> str:
    # Strip USFM character-marker tokens, keeping their inner text: openings like \add,
    # \sc, \nd, \q1 and their closings \add*, \sc* — the Apocrypha books use no footnotes,
    # so there's nothing to excise wholesale.
    text = re.sub(r'\\[a-z]+[0-9]*\*', '', text)   # closings: \add*, \sc*, …
    text = re.sub(r'\\[a-z]+[0-9]*\b', '', text)   # openings: \add, \sc, \p, \q1, …
    return re.sub(r'\s+', ' ', text).strip()


def parse_book(path: Path):
    verses = {}  # chapter -> verse(int) -> list[str]
    chapter = None
    cur = None   # (chapter, verse) currently accumulating
    for raw in path.read_text(encoding='utf-8').split('\n'):
        line = raw.rstrip()
        mc = C_RE.match(line)
        if mc:
            chapter = int(mc.group(1)); cur = None; continue
        mv = V_RE.match(line)
        if mv:
            v = int(mv.group(1))  # sub-verse letter dropped -> merged into the base verse
            verses.setdefault(chapter, {}).setdefault(v, [])
            if mv.group(3).strip():
                verses[chapter][v].append(mv.group(3))
            cur = (chapter, v)
            continue
        if line.startswith('\\'):
            cur = None  # a structural/paragraph marker (\p, \d, \b, headers) — not verse text
            continue
        if cur and line.strip():  # continuation line of the current verse (wrapped text)
            verses[cur[0]][cur[1]].append(line)
    return verses


total = {}
for path in sorted(USFM_DIR.glob('*eng-Brenton.usfm')):
    m = re.search(r'-([0-9A-Z]{3})eng-Brenton', path.name)
    if not m or m.group(1) not in BOOK_MAP:
        continue
    osis = BOOK_MAP[m.group(1)]
    verses = parse_book(path)
    flat = {}
    for ch in sorted(verses):
        for v in sorted(verses[ch]):
            txt = clean(' '.join(verses[ch][v]))
            if txt:
                flat[f'{osis}.{ch}.{v}'] = txt
    (OUT_DIR / f'{osis}.json').write_text(json.dumps(flat, ensure_ascii=False), encoding='utf-8')
    total[osis] = len(flat)

print('Brenton Apocrypha books written:')
for osis in sorted(total):
    print(f'  {osis:8} {total[osis]} verses')
print(f'total: {sum(total.values())} verses across {len(total)} books')
