"""Rebuild the Life of Adam and Eve, recovering chapters 3, 32 and 37.

!! NOT FINISHED — DOES NOT YET WRITE CORRECT DATA. The repo still ships the 48-chapter
!! file; run this only while working on it, and check the output before keeping it.

WHY THIS EXISTS
We shipped 48 of the 51 chapters. The audit read 3, 32 and 37 as missing text; they are not.
All three are present in the source and were run into the chapter before them, so the
preceding chapter silently carried two chapters' worth of text.

WHERE IT STANDS
The diagnosis is settled and the chapter recovery works — 51 chapters, no gaps, and the word
count rises (nothing is lost). What is not right yet is the verse detail:

  · 32:1 and 37:1 are still missing. Their text is the unmarked paragraph that trails the
    previous chapter's last verse; the attempt to cut it back off at the last paragraph
    break does not fire, so it stays attached to 31:3 and 36:2. Debug why the newline is
    not where it is expected — plain() keeps \n, but the verse text handed to the split may
    already have been normalised upstream.
  · 3:1 keeps a stray leading "I" (that chapter's verse 1 is a Roman numeral, not arabic).
  · 15 comes out as verses [1, 3]: the transcription labels one unit "1,2" and the second
    number is dropped rather than recorded.

Fix those three and the build is shippable; the surrounding logic is verified.

Two different causes, and they need different handling:

  · Chapter 3 IS marked in the source — "iii I And Adam arose and walked seven days" — but
    its verse 1 is a Roman "I" where every other chapter uses arabic. A reader written for
    one shape missed it.

  · Chapters 32 and 37 are NOT marked at all. The transcription runs xxxi 1, 2, 3 straight
    into "And Adam answered and said: 'Hear me, my sons…'" (32:1) and xxxvi 1, 2 straight
    into "Then Seth and his mother went off…" (37:1).

An unmarked chapter is still recoverable here, because the VERSE numbering restarts at the
boundary: the unmarked paragraph is followed by "2", which cannot follow verse 3 of the
previous chapter. So a verse number that fails to continue the run marks a chapter break,
and the chapter's number follows from its position — the break between xxxi and xxxiii can
only be 32. That is structural, not a guess about where the sense divides.

Source: wesley.nnu.edu/biblical_studies/noncanon/ot/pseudo/adamnev.htm (now gone; read from
the Wayback Machine). R. H. Charles's translation of the Latin Vita Adae et Evae, APOT
(1913), public domain.

Usage:  python3 scripts/build-lae.py [--no-cache]      (from the repo root)
"""
import html
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SNAP = ('http://web.archive.org/web/20040923054334id_/'
        'http://wesley.nnu.edu/biblical_studies/noncanon/ot/pseudo/adamnev.htm')
CACHE = Path('/tmp/lae/wesley.html')
OUT = Path('public/data/pseudepigrapha/lae.json')

ATTRIBUTION = (
    'The Books of Adam and Eve (the Latin Life of Adam and Eve), tr. R. H. Charles, The '
    'Apocrypha and Pseudepigrapha of the Old Testament (1913), public domain. Source: Wesley '
    'Center Online. Chapters 32 and 37 carry no chapter number in that transcription; they '
    'are placed here where the verse numbering restarts, between the chapters that bracket '
    'them.'
)

ROMAN = {'i': 1, 'v': 5, 'x': 10, 'l': 50, 'c': 100}


def roman(s):
    total = prev = 0
    for ch in reversed(s.lower()):
        if ch not in ROMAN:
            return None
        v = ROMAN[ch]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total or None


def fetch(no_cache):
    if CACHE.exists() and not no_cache:
        return CACHE.read_text(encoding='utf-8', errors='replace')
    try:
        ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
    except Exception:
        ctx = ssl._create_unverified_context()
    req = urllib.request.Request(SNAP, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=90, context=ctx).read().decode('utf-8', 'replace')
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(data, encoding='utf-8')
    return data


# A chapter opens with a lowercase Roman numeral; a verse number is arabic, except chapter
# 3's verse 1, which is Roman "I".
CH = re.compile(r'(?:^|\s)([ivxlc]{1,7})\s+(?=[IVX1-9])')
VS = re.compile(r'(?:^|\s)(\d{1,2})(?:\s*,\s*\d{1,2})?\s+(?=[A-Za-z\'"(\[])')


def plain(raw):
    t = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', raw)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t)).replace('\xa0', ' ')
    return re.sub(r'[ \t]+', ' ', t)


def main():
    x = plain(fetch('--no-cache' in sys.argv))

    # Chapter openings, kept only as a rising run so a stray numeral cannot reopen a chapter.
    # Allow a forward gap: an unmarked chapter means the next PRINTED numeral is cur+2, and
    # a strict cur+1 test would reject it and lose the whole rest of the work.
    marks, cur = [], 0
    for m in CH.finditer(x):
        n = roman(m.group(1))
        if n and cur < n <= min(cur + 2, 51):
            marks.append((n, m.start(), m.end())); cur = n
    if not marks:
        raise SystemExit('refusing to write: no chapter markers found')

    chapters = {}
    for i, (n, _mstart, start) in enumerate(marks):
        # stop at the NEXT marker's start, or its numeral trails into this chapter's text
        end = marks[i + 1][1] if i + 1 < len(marks) else len(x)
        body = x[start:end]
        # Split the chunk on its verse numbers. Verse 1 carries no marker at a marked
        # chapter opening (the numeral served), so lead text is verse 1.
        parts = VS.split(body)
        seq = []
        if parts[0].strip():
            seq.append((1, parts[0]))
        for k in range(1, len(parts) - 1, 2):
            seq.append((int(parts[k]), parts[k + 1]))

        # A verse number that does not continue the run means the NEXT chapter began here
        # without a printed numeral (32 and 37). Split there and carry on.
        run, prev, extra = {}, 0, []
        for num, txt in seq:
            if num <= prev:
                extra.append((num, txt))
            elif extra:
                extra.append((num, txt))
            else:
                run[num] = txt; prev = num
        if extra and run:
            last = max(run)
            head, sep, tail = run[last].rpartition('\n')
            if sep and tail.strip():
                run[last] = head
                extra.insert(0, (1, tail))
        chapters[n] = run
        if extra:
            # The unmarked chapter takes the number the printed sequence skipped — the break
            # between xxxi and xxxiii can only be 32. Its verse 1 is the unmarked lead
            # paragraph, which is why `extra` may open at 2.
            chapters[n + 1] = {num: txt for num, txt in extra}

    out = chapters

    doc_chapters = []
    for n in sorted(out):
        verses = [{'number': v, 'text': re.sub(r'\s+', ' ', out[n][v]).strip(' ;,')}
                  for v in sorted(out[n]) if out[n][v].strip()]
        if verses:
            doc_chapters.append({'number': n, 'verses': verses})

    OUT.write_text(json.dumps({
        'work': 'Life of Adam and Eve',
        'attribution': ATTRIBUTION,
        'chapters': doc_chapters,
    }, ensure_ascii=False), encoding='utf-8')

    nums = [c['number'] for c in doc_chapters]
    print(f'{len(doc_chapters)} chapters, {sum(len(c["verses"]) for c in doc_chapters)} verses')
    print(f'range {min(nums)}..{max(nums)}; absent: {[n for n in range(1, 52) if n not in nums]}')


if __name__ == '__main__':
    main()
