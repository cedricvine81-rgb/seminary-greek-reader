# Parses Whiston's translation of Josephus's two shorter works — Against Apion
# (Project Gutenberg #2849) and The Life / Vita (#2846) — into the same per-book JSON
# shape as build-josephus-antiquities.py, under public/data/josephus/against-apion/ and
# .../life/. Unlike the Antiquities and the War (Book -> Chapter -> Section), these two
# are shallower: Against Apion is Book -> Section (2 books, no chapters) and the Life is
# a single flat run of sections. To keep one JSON shape (and one viewer), each is modeled
# as book(s) with a single synthetic chapter (number 1) holding all the sections, so a
# citation "Ag. Ap. 1.22" -> book 1, chapter 1, section 22, and "Life 52" -> book 1,
# chapter 1, section 52.
#
# Usage:
#   curl -sL https://www.gutenberg.org/cache/epub/2849/pg2849.txt -o /tmp/apion.txt
#   curl -sL https://www.gutenberg.org/cache/epub/2846/pg2846.txt -o /tmp/life.txt
#   python3 scripts/build-josephus-apion-life.py /tmp/apion.txt /tmp/life.txt public/data/josephus

import json
import re
import sys
from pathlib import Path

APION_SRC = Path(sys.argv[1])
LIFE_SRC = Path(sys.argv[2])
OUT_ROOT = Path(sys.argv[3])

# Same section-marker heuristic the Antiquities/War parser uses: a number+period+space
# starting a sentence (optionally after a footnote-reference digit), matched against the
# whole flattened text so a marker that wraps mid-line is still found.
SECTION_MARKER_RE = re.compile(r'(?:\A|\s)(\d{1,3})\.\s+(?=(?:\d{1,3}\s+)?[A-Z"“‘\[])')


def flatten(lines):
    return re.sub(r'\s+', ' ', ' '.join(l.strip() for l in lines if l.strip())).strip()


def split_sections(lines):
    flat = flatten(lines)
    matches = list(SECTION_MARKER_RE.finditer(flat))
    out = []
    if not matches:
        return [{'number': 1, 'text': flat}] if flat else []
    # Any lead-in before the first "1." marker is dropped (these works open directly at §1).
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(flat)
        out.append({'number': int(m.group(1)), 'text': flat[start:end].strip()})
    return out


def body_lines(text):
    lines = text.split('\n')
    start = next(i for i, l in enumerate(lines) if l.startswith('*** START OF THE PROJECT GUTENBERG')) + 1
    end = next(i for i, l in enumerate(lines) if l.startswith('*** END OF THE PROJECT GUTENBERG'))
    return lines[start:end]


def write_book(work_dir, book_obj):
    (OUT_ROOT / work_dir).mkdir(parents=True, exist_ok=True)
    (OUT_ROOT / work_dir / f"{book_obj['number']}.json").write_text(
        json.dumps(book_obj, ensure_ascii=False), encoding='utf-8')


def write_index(work_dir, work_name, attribution, books):
    (OUT_ROOT / work_dir / 'index.json').write_text(json.dumps({
        'work': work_name,
        'author': 'Flavius Josephus',
        'translator': 'William Whiston',
        'attribution': attribution,
        'books': [{'number': b['number'], 'title': b['title'],
                   'chapters': [{'number': c['number'], 'title': c['title'], 'sections': len(c['sections'])}
                                for c in b['chapters']]} for b in books],
    }, ensure_ascii=False, indent=2), encoding='utf-8')


# ── Against Apion: 2 books, sections cut off at each book's "APION BOOK N FOOTNOTES" ──
def build_apion():
    lines = body_lines(APION_SRC.read_text(encoding='utf-8'))
    # Book markers: "BOOK 1." (arabic) and "BOOK II." (roman) — Gutenberg mixes the two.
    b1 = next(i for i, l in enumerate(lines) if re.match(r'^BOOK 1\.', l))
    b2 = next(i for i, l in enumerate(lines) if re.match(r'^BOOK (II|2)\.', l))
    fn1 = next(i for i, l in enumerate(lines) if 'BOOK 1 FOOTNOTES' in l)
    fn2 = next(i for i, l in enumerate(lines) if 'BOOK 2 FOOTNOTES' in l)
    books = [
        {'number': 1, 'title': '', 'chapters': [{'number': 1, 'title': '', 'sections': split_sections(lines[b1 + 1:fn1])}]},
        {'number': 2, 'title': '', 'chapters': [{'number': 1, 'title': '', 'sections': split_sections(lines[b2 + 1:fn2])}]},
    ]
    attribution = ('Flavius Josephus, Against Apion, tr. William Whiston (1737), public domain. '
                   'Source: Project Gutenberg eBook #2849 (gutenberg.org/ebooks/2849).')
    for b in books:
        write_book('against-apion', b)
    write_index('against-apion', 'Against Apion', attribution, books)
    return sum(len(c['sections']) for b in books for c in b['chapters'])


# ── The Life: one flat run of sections, no book/chapter markers ──
def build_life():
    lines = body_lines(LIFE_SRC.read_text(encoding='utf-8'))
    # Skip the "THE LIFE OF FLAVIUS JOSEPHUS" / by-line header down to the first "1." section.
    first = next(i for i, l in enumerate(lines) if re.match(r'^1\.\s', l))
    # The Life collects its footnotes at the end under a bare "Footnotes" line (no
    # "FOOTNOTES:" header like the Antiquities) — cut them off so "[Footnote 19: …]" text,
    # which contains section-like numbers, isn't misread as extra sections.
    fn = next((i for i, l in enumerate(lines) if re.match(r'^Footnotes\s*$', l, re.IGNORECASE)), len(lines))
    book = {'number': 1, 'title': 'The Life of Flavius Josephus',
            'chapters': [{'number': 1, 'title': '', 'sections': split_sections(lines[first:fn])}]}
    attribution = ('Flavius Josephus, The Life of Flavius Josephus, tr. William Whiston (1737), public '
                   'domain. Source: Project Gutenberg eBook #2846 (gutenberg.org/ebooks/2846).')
    write_book('life', book)
    write_index('life', 'The Life of Flavius Josephus', attribution, [book])
    return len(book['chapters'][0]['sections'])


ap = build_apion()
lf = build_life()
print(f'Against Apion: {ap} sections across 2 books')
print(f'The Life: {lf} sections')
