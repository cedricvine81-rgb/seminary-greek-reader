# Builds the Psalms of Solomon for the Texts library.
#
# WHY THIS ONE, SPECIFICALLY: it is the fullest Second Temple statement of national restoration
# under a Davidic king — Psalm 17 in particular — and therefore the closest Jewish parallel to
# New Testament messianic hope. Its absence was the one real gap flagged on the Theology page's
# Israel topic, and any "Messiah" topic built without it would be missing its central witness.
#
# Text: tr. G. Buchanan Gray in R. H. Charles, ed., "The Apocrypha and Pseudepigrapha of the Old
# Testament in English" (Oxford, 1913) — public domain (1913 + 95 years, expired). Digitised by
# the Wesley Center Online, which serves the whole book on one page.
#
# TWO NUMBERINGS, AND ONLY ONE OF THEM IS CITABLE. Gray prints his own sequential verse number at
# each line start AND the standard verse number in parentheses wherever a standard verse begins —
# including in the middle of a line. The two drift apart: Gray's 23 is the standard 21. Everyone
# cites the standard one, so PsSol 17:21 is "raise up unto them their king, the son of David";
# building on Gray's own numbers would have filed that under 17:23 and quietly mis-cited the most
# quoted verse in the book.
#
# So: a parenthesised marker starts a new verse, everything else continues the current one, and
# Gray's line numbers are used only before the first marker (where the two systems still agree).
# Unnumbered lines are the later lines of a couplet and must be joined, not dropped.
#
# THE DIGITISATION HAS TYPOS. Psalm 17 prints "29 (21)" where the run of markers either side makes
# it plainly (27) — Gray is exactly two ahead there — and psalms 14 and 15 do the same. Taken at
# face value those produce two verses numbered 17:21, and a citation that lands on whichever the
# reader met first. So the parser tracks the Gray-to-standard offset and, when a marker would run
# BACKWARDS, treats it as a typo and derives the number from the offset instead. Every correction
# is printed, and a final check refuses to write the file if any psalm still has a duplicate or
# out-of-order verse.
#
# Output: public/data/pseudepigrapha-b/psalms-of-solomon.json in the standard prose shape.
# Usage:  python3 scripts/build-psalms-of-solomon.py   (from the repo root)

import html
import json
import re
import sys
import urllib.request
from pathlib import Path

URL = ('http://wesley.nnu.edu/sermons-essays-books/noncanonical-literature/'
       'noncanonical-literature-ot-pseudepigrapha/the-psalms-of-solomon/')
CACHE = Path('/tmp/pssol.html')
OUT = Path('public/data/pseudepigrapha-b/psalms-of-solomon.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1'

ATTRIBUTION = (
    'Psalms of Solomon, tr. G. Buchanan Gray, in R. H. Charles, ed., "The Apocrypha and '
    'Pseudepigrapha of the Old Testament in English" (Oxford, 1913); public domain. '
    'Digitised by the Wesley Center Online.'
)

# Gray's headings are worded every which way — "A Psalm Of Solomon. Concerning Jerusalem.",
# "A Conversation of Solomon with the Men-pleasers.", "In Hope. Of Solomon." — and psalms 1 and 3
# carry none at all. So headings CANNOT delimit the psalms; only 6 of 18 match any one pattern.
# The verse numbering can: every psalm opens "N 1 text", and all eighteen of those are present.
# Drive the parse from that and treat a heading as an optional title picked up on the way past.
HEADING = re.compile(r'^\d{1,2}\.\s+(\D.*)$')
PSALM_START = re.compile(r'^(\d{1,2})\s+1\s+(\S.*)$')
VERSE = re.compile(r'^(\d{1,3})\s+(.*)$')
# The standard verse marker, anywhere in a line: "(21)". Bare "(4)" only — not "(that sprang)"
# or "perennial(ly)", which is why this insists on digits and nothing else.
STANDARD = re.compile(r'\((\d{1,3})\)')


def fetch() -> str:
    if CACHE.exists():
        return CACHE.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(URL, headers={'User-Agent': UA})
    body = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
    CACHE.write_text(body, encoding='utf-8')
    return body


def lines_of(page: str) -> list[str]:
    page = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', page)
    # Turn block boundaries into newlines FIRST, so a heading can't be glued to the verse under it.
    page = re.sub(r'(?i)<(p|br|div|h[1-6]|tr|li)\b[^>]*>', '\n', page)
    text = html.unescape(re.sub(r'(?s)<[^>]+>', '', page))
    out = []
    for raw in text.split('\n'):
        line = re.sub(r'[ \t\xa0]+', ' ', raw).strip()
        if line:
            out.append(line)
    return out


def parse(lines: list[str]) -> tuple[list[dict], list[str]]:
    """Psalms in the STANDARD versification, with typo corrections logged."""
    chapters: list[dict] = []
    fixes: list[str] = []
    psalm = None
    gray_n = 0
    verse = None
    seen_marker = False
    offset = 0            # gray_n - standard_n, from the last marker we trusted
    pending_title = ''

    def add(number: int, text: str):
        nonlocal verse
        text = text.strip()
        if verse is not None and verse['number'] == number:
            verse['text'] = (verse['text'] + ' ' + text).strip()
            return
        verse = {'number': number, 'text': text}
        psalm['verses'].append(verse)

    def feed(text: str):
        nonlocal seen_marker, offset
        parts = STANDARD.split(text)
        head = parts[0]
        if head.strip():
            n = gray_n if not seen_marker else (verse['number'] if verse else gray_n)
            add(n, head)
        for i in range(1, len(parts), 2):
            marked = int(parts[i])
            last = verse['number'] if verse else 0
            if marked < last:
                # Runs strictly backwards — a typo. (Equal is not: a marker often just restates
                # the verse already open, and merging it is correct.) Rebuild it from the offset established either side.
                derived = gray_n - offset
                fixes.append(f"psalm {psalm['number']}: marker ({marked}) after verse {last} "
                             f"-> read as ({derived}) from Gray {gray_n} with offset {offset}")
                marked = derived
            else:
                offset = gray_n - marked
            seen_marker = True
            add(marked, parts[i + 1] if i + 1 < len(parts) else '')

    for line in lines:
        m = HEADING.match(line)
        if m:
            pending_title = m.group(1).strip()
            continue
        m = PSALM_START.match(line)
        if m and int(m.group(1)) == len(chapters) + 1:
            psalm = {'number': int(m.group(1)), 'title': pending_title, 'verses': []}
            chapters.append(psalm)
            verse, seen_marker, gray_n, offset = None, False, 1, 0
            pending_title = ''
            feed(m.group(2))
            continue
        if psalm is None:
            continue
        m = VERSE.match(line)
        if m:
            gray_n = int(m.group(1))
            feed(m.group(2))
        elif verse is not None:
            feed(line)
    return chapters, fixes


def main() -> int:
    chapters, fixes = parse(lines_of(fetch()))
    for f in fixes:
        print('  corrected: ' + f)
    if len(chapters) != 18:
        print(f'expected 18 psalms, parsed {len(chapters)}', file=sys.stderr)
        return 1
    empty = [c['number'] for c in chapters if not c['verses']]
    if empty:
        print(f'psalms with no verses: {empty}', file=sys.stderr)
        return 1
    # A duplicate or out-of-order verse number means a citation lands on the wrong text. Refuse.
    broken = []
    for c in chapters:
        ns = [v['number'] for v in c['verses']]
        if len(set(ns)) != len(ns) or ns != sorted(ns):
            broken.append((c['number'], ns))
    if broken:
        for n, ns in broken:
            print(f'psalm {n} has duplicate/out-of-order verses: {ns}', file=sys.stderr)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'work': 'Psalms of Solomon',
        'attribution': ATTRIBUTION,
        'chapters': [
            {'number': c['number'], 'title': c['title'],
             'verses': [{'number': v['number'], 'text': v['text']} for v in c['verses']]}
            for c in chapters
        ],
    }, ensure_ascii=False, indent=1), encoding='utf-8')

    total = sum(len(c['verses']) for c in chapters)
    print(f'{OUT}: {len(chapters)} psalms, {total} verses')
    for c in chapters:
        print(f"   {c['number']:>2}: {len(c['verses']):>2} verses   {c['title'][:60]}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
