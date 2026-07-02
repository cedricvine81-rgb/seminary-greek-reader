# Parses Whiston's translation of Josephus's Antiquities of the Jews (Project
# Gutenberg eBook #2848, public domain) into per-book JSON files under
# public/data/josephus/antiquities/, keyed by Book -> Chapter -> Section to match
# the traditional citation scheme (and Perseus's URL scheme) used elsewhere in the app.
#
# Usage: curl -sL https://www.gutenberg.org/cache/epub/2848/pg2848.txt -o /tmp/pg2848.txt
#        python3 scripts/build-josephus-antiquities.py /tmp/pg2848.txt public/data/josephus/antiquities

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

# Find real body bounds: body starts at the SECOND occurrence of "BOOK I." (first is
# in the global table of contents), and ends at the Gutenberg end marker.
book_i_idx = [i for i, l in enumerate(lines) if l.startswith('BOOK I.')]
if len(book_i_idx) < 2:
    raise SystemExit(f'expected 2 occurrences of "BOOK I." (TOC + body), found {len(book_i_idx)}')
body_start = book_i_idx[1]
end_idx = next(i for i, l in enumerate(lines) if l.startswith('*** END OF THE PROJECT GUTENBERG'))
body_lines = lines[body_start:end_idx]

BOOK_RE = re.compile(r'^BOOK ([IVXLC]+)\.\s*(.*)$')
CHAPTER_RE = re.compile(r'^CHAPTER (\d+)\.?\s*(.*)$')
# A real section marker is a number+period+space followed by a capitalized word (or
# opening quote/bracket) — as opposed to a footnote reference digit, which Gutenberg's
# plain-text conversion drops in bare (no trailing period) mid-sentence, e.g. "...die
# himself also. 10 Grant this boon...". Whiston's line-wrapped print also sometimes
# lands a real section marker mid-line rather than at a line start (e.g. Ant. 11.5.6:
# "...priesthood. 6. Now there was..."), and occasionally right after a footnote digit
# glued straight onto the prior period with no space (e.g. "...only.15 5. When God
# gave..."), so this matches against the whole flattened chapter text (not per
# physical line) and only requires *some* preceding whitespace, not a strict
# end-of-sentence lookbehind. A footnote digit can also land right after a real
# section marker (e.g. "7. 22 Now this king Saul..."), so the lookahead tolerates
# one optional bare digit-run before the capitalized word it's actually checking for.
SECTION_MARKER_RE = re.compile(r'(?:\A|\s)(\d{1,3})\.\s+(?=(?:\d{1,3}\s+)?[A-Z"“‘\[])')
FOOTNOTE_START_RE = re.compile(r'^FOOTNOTES:?\s*$')
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
    body as bogus (unnumbered) content.

    A handful of titles also have a stray blank line dropped in the *middle* of
    the wrap (e.g. Ant. 13.2: "...Concerning The Death" / "" / "Of Demetrius." /
    "" / "1. Now..."). Real paragraphs in this source never contain an internal
    blank line — they're one unbroken run of wrapped lines — so a very short
    chunk (a handful of words) sitting between two blank lines is a leftover
    title fragment, not a one-line chapter body; a real body chunk (numbered or
    not) runs much longer before its own terminating blank line."""
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
            # Before any title text has been gathered at all (e.g. a bare
            # "CHAPTER 3" header with no inline title, Ant. 16.3), this first
            # chunk after the blank *is* the title, however long — there's
            # nowhere else for it to come from. Only once real title text
            # exists does a short trailing chunk become suspect as a leftover
            # fragment rather than the start of the real body.
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

    # Footnotes are compiled once at the end of each *book* (all its chapters'
    # notes together, renumbered from 1), not per chapter — confirmed by there
    # being exactly one "FOOTNOTES:" marker per book in the source. Split that
    # off before chapter-splitting so it isn't misattributed to whichever
    # chapter happens to be last.
    fn_idx = next((i for i, l in enumerate(full_block) if FOOTNOTE_START_RE.match(l)), len(full_block))
    block = full_block[:fn_idx]
    footnote_lines = full_block[fn_idx + 1:]

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

    chapters_out = []
    for ci in range(len(chapter_starts) - 1):
        _, cstart, cnum, ctitle = chapter_starts[ci]
        cend = chapter_starts[ci + 1][0]
        if cnum is None:
            continue
        section_lines = block[cstart:cend]

        # Skip orphan/duplicate headings with no actual body text (e.g.
        # Gutenberg's stray duplicate Book VIII mini-TOC, where one heading runs
        # straight into the next with nothing in between).
        if not any(l.strip() for l in section_lines):
            continue

        # ── Sections ── (flatten first so a section marker buried mid-line, not
        # just at a physical line start, is still found — see SECTION_MARKER_RE)
        flat = flush_paragraph(section_lines)
        matches = list(SECTION_MARKER_RE.finditer(flat))

        sections_out = []
        if matches:
            # Text before the first explicit marker: normally empty (chapters
            # almost always open with "1. ..."), but a few chapters (e.g. Ant.
            # 16.11) open with an unnumbered lead-in before their first labeled
            # section — keep that as an implicit section 1, matching how Perseus's
            # digital edition numbers the same passages.
            preamble = flat[:matches[0].start()].strip()
            if preamble:
                sections_out.append({'number': 1, 'text': preamble})
            for mi, m in enumerate(matches):
                start = m.end()
                end = matches[mi + 1].start() if mi + 1 < len(matches) else len(flat)
                sections_out.append({'number': int(m.group(1)), 'text': flat[start:end].strip()})
        else:
            # A handful of short chapters (e.g. Ant. 1.9) have a single unnumbered
            # paragraph instead of Whiston's usual numbered sections.
            sections_out = [{'number': 1, 'text': flat}]

        chapters_out.append({'number': cnum, 'title': ctitle, 'sections': sections_out})

    if not chapters_out:
        # Whole-book orphan (Gutenberg's stray duplicate Book VIII mini-TOC).
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
    'work': 'Antiquities of the Jews',
    'author': 'Flavius Josephus',
    'translator': 'William Whiston',
    'attribution': 'Flavius Josephus, Antiquities of the Jews, tr. William Whiston (1737), public domain. Source: Project Gutenberg eBook #2848 (gutenberg.org/ebooks/2848).',
    'books': index,
}, ensure_ascii=False, indent=2), encoding='utf-8')

total_sections = sum(len(c['sections']) for b in books_out for c in b['chapters'])
total_chapters = sum(len(b['chapters']) for b in books_out)
print(f'books={len(books_out)} chapters={total_chapters} sections={total_sections}')
