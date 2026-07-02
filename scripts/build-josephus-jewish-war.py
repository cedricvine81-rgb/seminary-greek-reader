# Parses Whiston's translation of Josephus's The Wars of the Jews (Project Gutenberg
# eBook #2850, public domain) into per-book JSON files under
# public/data/josephus/jewish-war/, keyed by Book -> Chapter -> Section to match the
# traditional citation scheme (and Perseus's URL scheme) used elsewhere in the app.
# Adapted from build-josephus-antiquities.py — this edition's table of contents is
# indented (e.g. " BOOK I.") while the real body headers are flush-left ("BOOK I."),
# so no second-occurrence trick is needed to skip past it; and its FOOTNOTES markers
# are labelled per book ("WAR BOOK 1 FOOTNOTES") rather than bare "FOOTNOTES:".
#
# Usage: curl -sL https://www.gutenberg.org/cache/epub/2850/pg2850.txt -o /tmp/pg2850.txt
#        python3 scripts/build-josephus-jewish-war.py /tmp/pg2850.txt public/data/josephus/jewish-war

import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT_DIR = Path(sys.argv[2])
OUT_DIR.mkdir(parents=True, exist_ok=True)

ROMAN_VALUES = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}


def roman_to_int(s: str) -> int:
    total = 0
    prev = 0
    for ch in reversed(s):
        v = ROMAN_VALUES[ch]
        if v < prev:
            total -= v
        else:
            total += v
            prev = v
    return total


text = SRC.read_text(encoding='utf-8')
lines = text.split('\n')

# Body starts at the last flush-left "BOOK I." (the table of contents' copy is
# indented, e.g. " BOOK I.", so it never matches this flush-left check at all —
# but take the *last* match rather than assuming exactly one, in case a given
# Gutenberg edition's TOC happens to be flush-left too).
book_i_idx = [i for i, l in enumerate(lines) if l.startswith('BOOK I.')]
if not book_i_idx:
    raise SystemExit('no "BOOK I." found')
body_start = book_i_idx[-1]
end_idx = next(i for i, l in enumerate(lines) if l.startswith('*** END OF THE PROJECT GUTENBERG'))
body_lines = lines[body_start:end_idx]

BOOK_RE = re.compile(r'^BOOK ([IVXLC]+)\.\s*(.*)$')
CHAPTER_RE = re.compile(r'^CHAPTER (\d+)\.?\s*(.*)$')
# See build-josephus-antiquities.py for the full rationale behind this pattern.
SECTION_MARKER_RE = re.compile(r'(?:\A|\s)(\d{1,3})\.\s+(?=(?:\d{1,3}\s+)?[A-Z"“‘\[])')
# This edition labels its footnote blocks per book/preface ("WAR PREFACE FOOTNOTES",
# "WAR BOOK 1 FOOTNOTES") rather than Antiquities' bare "FOOTNOTES:". Book 7's marker
# also has its first footnote entry run onto the same line with no break ("WAR BOOK 7
# FOOTNOTES 2 (return) [..."), so this only requires the marker at line start — any
# trailing text on that line is recovered separately (see the split loop below).
FOOTNOTE_START_RE = re.compile(r'^[A-Z0-9 ]*FOOTNOTES:?\s*(.*)$')
FOOTNOTE_ENTRY_RE = re.compile(r'^(\d+)\s+\(return\)\s*\[\s*(.*)$')


def flush_paragraph(buf):
    joined = ' '.join(s.strip() for s in buf if s.strip())
    return re.sub(r'\s+', ' ', joined).strip()


def _next_chunk(block, i):
    """Starting at a blank line index i, skip the blank run and collect the next
    contiguous group of non-blank lines (up to the following blank line, header,
    or end of block). Returns (chunk_lines, index_after_chunk)."""
    j = i
    while j < len(block) and block[j].strip() == '':
        j += 1
    chunk = []
    while j < len(block) and block[j].strip() != '':
        chunk.append(block[j])
        j += 1
    return chunk, j


def consume_title(block, start, first_fragment):
    """Book/Chapter titles often wrap onto following lines, right up until the
    blank line that separates the heading from the real body. Fold those
    continuation lines into the title instead of leaving them to leak into the
    body as bogus (unnumbered) content. A stray blank line dropped in the middle
    of a wrap is tolerated the same way build-josephus-antiquities.py does."""
    parts = [first_fragment.strip()]
    i = start + 1
    while i < len(block):
        if block[i].strip() == '':
            chunk, after = _next_chunk(block, i)
            if not chunk:
                break  # trailing blank(s) at end of block
            first_line = chunk[0]
            if BOOK_RE.match(first_line) or CHAPTER_RE.match(first_line) or FOOTNOTE_START_RE.match(first_line):
                break
            have_title = any(p for p in parts)
            word_count = sum(len(l.split()) for l in chunk)
            if (not have_title) or (word_count <= 12 and not SECTION_MARKER_RE.match(flush_paragraph(chunk))):
                parts.append(flush_paragraph(chunk))
                i = after
                continue
            break
        parts.append(block[i].strip())
        i += 1
    return ' '.join(p for p in parts if p), i


# ── Pass 1: split body into Book blocks ──
book_starts = []
i = 0
while i < len(body_lines):
    m = BOOK_RE.match(body_lines[i])
    if m:
        title, content_start = consume_title(body_lines, i, m.group(2))
        book_starts.append((i, content_start, roman_to_int(m.group(1)), title))
        i = content_start
    else:
        i += 1
book_starts.append((len(body_lines), len(body_lines), None, None))

books_out = []
for bi in range(len(book_starts) - 1):
    _, content_start, num, title = book_starts[bi]
    end = book_starts[bi + 1][0]
    if num is None:
        continue
    full_block = body_lines[content_start:end]

    fn_match = next(((i, FOOTNOTE_START_RE.match(l)) for i, l in enumerate(full_block) if FOOTNOTE_START_RE.match(l)), None)
    if fn_match:
        fn_idx, m = fn_match
        block = full_block[:fn_idx]
        trailing = m.group(1).strip()
        footnote_lines = ([trailing] if trailing else []) + full_block[fn_idx + 1:]
    else:
        block = full_block
        footnote_lines = []

    # ── Pass 2: split the book block into Chapter blocks ──
    chapter_starts = []
    i = 0
    while i < len(block):
        m = CHAPTER_RE.match(block[i])
        if m:
            ctitle, ccontent_start = consume_title(block, i, m.group(2))
            chapter_starts.append((i, ccontent_start, int(m.group(1)), ctitle))
            i = ccontent_start
        else:
            i += 1
    chapter_starts.append((len(block), len(block), None, None))

    # Chapter numbers this book's headers actually named — used below to recognize
    # when a whole "CHAPTER N" heading was dropped from the transcription (e.g. Book
    # IV jumps straight from "CHAPTER 4." to "CHAPTER 6.", Book VII from 4 to 6).
    real_chapter_nums = {cs[2] for cs in chapter_starts if cs[2] is not None}

    chapters_out = []
    for ci in range(len(chapter_starts) - 1):
        _, cstart, cnum, ctitle = chapter_starts[ci]
        cend = chapter_starts[ci + 1][0]
        if cnum is None:
            continue
        section_lines = block[cstart:cend]

        if not any(l.strip() for l in section_lines):
            continue

        flat = flush_paragraph(section_lines)
        matches = list(SECTION_MARKER_RE.finditer(flat))

        sections_out = []
        if matches:
            preamble = flat[:matches[0].start()].strip()
            if preamble:
                sections_out.append({'number': 1, 'text': preamble})
            for mi, m in enumerate(matches):
                start = m.end()
                end = matches[mi + 1].start() if mi + 1 < len(matches) else len(flat)
                sections_out.append({'number': int(m.group(1)), 'text': flat[start:end].strip()})
        else:
            sections_out = [{'number': 1, 'text': flat}]

        # A section number that drops instead of increasing means a chapter boundary
        # was silently dropped from the source (its heading never made it into this
        # transcription, but its body text is still here, glued onto the prior
        # chapter). Only split on this when the next chapter number is confirmed
        # missing from the real headers — otherwise a genuine mid-chapter numbering
        # quirk could be misread as a missing heading.
        restart_at = next((i for i in range(1, len(sections_out))
                            if sections_out[i]['number'] < sections_out[i - 1]['number']), None)
        if restart_at is not None and (cnum + 1) not in real_chapter_nums:
            chapters_out.append({'number': cnum, 'title': ctitle, 'sections': sections_out[:restart_at]})
            chapters_out.append({'number': cnum + 1, 'title': '', 'sections': sections_out[restart_at:]})
        else:
            chapters_out.append({'number': cnum, 'title': ctitle, 'sections': sections_out})

    if not chapters_out:
        continue

    # ── Book-level footnotes ──
    notes_out = []
    note_starts = []
    for i, l in enumerate(footnote_lines):
        m = FOOTNOTE_ENTRY_RE.match(l)
        if m:
            note_starts.append((i, int(m.group(1)), m.group(2)))
    note_starts.append((len(footnote_lines), None, None))
    for ni in range(len(note_starts) - 1):
        nstart, nnum, nfirst = note_starts[ni]
        nend = note_starts[ni + 1][0]
        if nnum is None:
            continue
        buf = [nfirst] + footnote_lines[nstart + 1:nend]
        note_text = flush_paragraph(buf)
        note_text = re.sub(r'\]\s*$', '', note_text).strip()
        notes_out.append({'number': nnum, 'text': note_text})

    books_out.append({
        'number': num, 'title': title, 'chapters': chapters_out,
        **({'notes': notes_out} if notes_out else {}),
    })

# ── Write per-book files + an index ──
index = []
for b in books_out:
    out_path = OUT_DIR / f"{b['number']}.json"
    out_path.write_text(json.dumps(b, ensure_ascii=False), encoding='utf-8')
    index.append({
        'number': b['number'],
        'title': b['title'],
        'chapters': [{'number': c['number'], 'title': c['title'], 'sections': len(c['sections'])} for c in b['chapters']],
    })

(OUT_DIR / 'index.json').write_text(json.dumps({
    'work': 'The Wars of the Jews',
    'author': 'Flavius Josephus',
    'translator': 'William Whiston',
    'attribution': 'Flavius Josephus, The Wars of the Jews, tr. William Whiston (1737), public domain. Source: Project Gutenberg eBook #2850 (gutenberg.org/ebooks/2850).',
    'books': index,
}, ensure_ascii=False, indent=2), encoding='utf-8')

total_sections = sum(len(c['sections']) for b in books_out for c in b['chapters'])
total_chapters = sum(len(b['chapters']) for b in books_out)
print(f'books={len(books_out)} chapters={total_chapters} sections={total_sections}')
