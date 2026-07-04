# Parses Brenton's English Septuagint (Sir Lancelot C. L. Brenton, 1851, public domain)
# from ebible.org's eng-Brenton USFM into per-book JSON under public/data/brenton/, for
# the protocanonical OT books. Companion to build-brenton-apocrypha.py (which does the 14
# deuterocanonical books); together they give every LXX work on the /texts page an English
# column. Brenton is translated from the Greek (Vaticanus), so its versification tracks the
# Rahlfs LXX the app shows far more closely than a Hebrew-based English (BSB/WEB) would —
# which is why it's the right parallel for the Septuagint OT here.
#
# A few LXX OT books diverge from Brenton's versification in places (Jeremiah's chapter
# order, Job's shorter LXX text, the Psalm 151 tail); where a Greek verse has no matching
# Brenton key the English column simply shows a dash for that verse.
#
# Output: public/data/brenton/<osisId>.json = { "<osisId>.<chapter>.<verse>": "text", … }
# keyed exactly like the apocrypha files so the reader's right column filters it by chapter.
#
# Usage:
#   curl -sL https://ebible.org/Scriptures/eng-Brenton_usfm.zip -o /tmp/brenton.zip
#   unzip -o /tmp/brenton.zip -d /tmp/brenton_usfm
#   python3 scripts/build-brenton-ot.py /tmp/brenton_usfm public/data/brenton

import json
import re
import sys
from pathlib import Path

USFM_DIR = Path(sys.argv[1])
OUT_DIR = Path(sys.argv[2])
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ebible USFM book code -> the app's LXX osisId (see src/lib/texts-catalog.ts). Samuel/Kings
# carry standard codes here (1SA/2SA/1KI/2KI) though the LXX calls them 1-4 Kingdoms; EZR is
# Brenton's "Esdras B" and lines up with the app's Ezra. Joshua/Judges map to the app's
# Vaticanus osisIds (JoshB/JudgB) — Brenton is Vaticanus-based, so the text matches.
BOOK_MAP = {
    'GEN': 'Gen', 'EXO': 'Exod', 'LEV': 'Lev', 'NUM': 'Num', 'DEU': 'Deut',
    'JOS': 'JoshB', 'JDG': 'JudgB', 'RUT': 'Ruth',
    '1SA': '1Sam', '2SA': '2Sam', '1KI': '1Kgs', '2KI': '2Kgs',
    '1CH': '1Chr', '2CH': '2Chr', 'EZR': 'Ezra', 'NEH': 'Neh',
    'JOB': 'Job', 'PSA': 'Ps', 'PRO': 'Prov', 'ECC': 'Eccl', 'SNG': 'Song',
    'ISA': 'Isa', 'JER': 'Jer', 'LAM': 'Lam', 'EZK': 'Ezek',
    'HOS': 'Hos', 'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obad', 'JON': 'Jonah',
    'MIC': 'Mic', 'NAM': 'Nah', 'HAB': 'Hab', 'ZEP': 'Zeph', 'HAG': 'Hag',
    'ZEC': 'Zech', 'MAL': 'Mal',
}

C_RE = re.compile(r'^\\c\s+(\d+)')
V_RE = re.compile(r'^\\v\s+(\d+)([a-z]?)\s?(.*)')  # verse number, optional sub-letter, text


def clean(text: str) -> str:
    # Footnotes and cross-references must be excised wholesale — their inner text is Greek
    # glosses and editorial notes ("Gr. pestilent.", "Hebraism."), not scripture. Remove the
    # whole \f…\f* / \x…\x* span BEFORE stripping the remaining character markers, otherwise
    # the generic strip would drop only the markers and leave the note text behind.
    text = re.sub(r'\\f\b.*?\\f\*', '', text)      # footnotes: \f + \fr … \ft …\f*
    text = re.sub(r'\\x\b.*?\\x\*', '', text)       # cross references: \x … \x*
    text = re.sub(r'\\[a-z]+[0-9]*\*', '', text)    # remaining closings: \add*, \sc*, \nd*
    text = re.sub(r'\\[a-z]+[0-9]*\b', '', text)    # remaining openings: \add, \sc, \nd, \q1
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

print('Brenton OT books written:')
for osis in sorted(total):
    print(f'  {osis:8} {total[osis]} verses')
print(f'total: {sum(total.values())} verses across {len(total)} books')
