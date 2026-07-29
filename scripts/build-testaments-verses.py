"""Give the Testaments of the Twelve Patriarchs their verse divisions.

WHY THIS EXISTS
Our Testaments stored each chapter as a single unit, so "T. Levi 18:7" — the form
scholarship and our own cross-reference apparatus use — could only ever open the whole
chapter. The Greek we already ship carries the standard verse numbers inline; the English
(ANF, Roberts-Donaldson) is undivided prose, and its sentence count matches the Greek verse
count in only 33% of chapters, so the divisions cannot be inferred from it.

So the English is replaced by R. H. Charles's translation (1917, SPCK "Translations of
Early Documents"; public domain), which is verse-numbered and is the rendering whose
numbering the field cites. The Greek is split on its own inline numbers.

THE CHECK THAT MAKES THIS SAFE
The two sources are independent — the Greek from Greek Wikisource, the English from a 1917
scan — so their verse counts agree only if both were read correctly. Every chapter is
compared, and a mismatch is reported rather than papered over. Chapters that disagree keep
the Greek's division (it is the citation anchor) and are listed at the end of the run.

OCR
The scan is clean but has the usual "ll" confusions (shaU, shah, wiU) and hyphenates across
line breaks. Both are repaired; anything unrepaired shows up as a verse-count mismatch.

Usage:  python3 scripts/build-testaments-verses.py [--no-cache]     (from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SRC = 'https://archive.org/download/testamentsoftwel00char/testamentsoftwel00char_djvu.txt'
CACHE = Path('/tmp/t12/charles-1917.txt')
DATA = Path('public/data/pseudepigrapha/testaments')

ATTRIBUTION = (
    'English: R. H. Charles, The Testaments of the Twelve Patriarchs (SPCK, 1917), public '
    'domain — the translation whose chapter and verse numbering scholarship cites. '
    'Greek: the traditional text of the Testaments (public-domain editions), via Greek '
    'Wikisource.'
)

# Heading order in Charles = our file slugs.
SLUGS = ['reuben', 'simeon', 'levi', 'judah', 'issachar', 'zebulun',
         'dan', 'naphtali', 'gad', 'asher', 'joseph', 'benjamin']
HEADING = re.compile(r'THE\s+TESTAMENT\s+OF\s+([A-Z]+)')

ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}


def roman_to_int(s):
    """Roman numerals as the scan renders them — 'XVIIL' is XVIII with a misread final I."""
    s = s.upper().replace('J', 'I')
    # A trailing L after I's is a misread I (XVIIL -> XVIII); L only follows X legitimately.
    if len(s) > 1 and s.endswith('L') and s[-2] == 'I':
        s = s[:-1] + 'I'
    total = prev = 0
    for ch in reversed(s):
        if ch not in ROMAN:
            return None
        v = ROMAN[ch]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total or None


def clean_ocr(t):
    t = t.replace('—', '—').replace('‘', '‘').replace('’', '’')
    # Running heads FIRST. A word hyphenated across a page break has the head sitting between
    # its halves ("keep His com-" / "THE TWELVE PATRIARCHS 103" / "mandments"), so repairing
    # the hyphen first glues the word to the head instead — which is how "comTHE TWELVE
    # PATRIARCHS 103 mandments" ended up inside T. Benjamin 3:1.
    t = re.sub(r'\n?\s*\d{1,3}\s+THE\s+TESTAMENTS\s+OF\s*', '\n', t)   # running heads
    # The recto head is "THE TWELVE PATRIARCHS <page>", but the scan mangles TWELVE every way
    # it can — T\\VEL\\'E, TWEU'E, T\\AELVE, TWEU^E, T\\\\TLVE — and the page number with it
    # ("6i", "loi"). Matching on PATRIARCHS instead catches all of them. A head left in place
    # takes the following verse number with it: that is how T. Levi 6:3 went missing.
    t = re.sub(r'\n[^\n]{0,30}PATRIARCHS[^\n]{0,8}\n', '\n', t)
    t = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', t)            # hyphenation across lines
    t = re.sub(r'[ \t]+', ' ', t)
    # "ll" misread as U or h, only inside a word between letters
    for bad, good in (('shaU', 'shall'), ('shah', 'shall'), ('wiU', 'will'), ('aU', 'all'),
                      ('faU', 'fall'), ('caU', 'call'), ('teU', 'tell'), ('fuU', 'full'),
                      ('smaU', 'small'), ('weU', 'well'), ('kiU', 'kill'), ('iU', 'ill'),
                      ('foUow', 'follow'), ('beUy', 'belly'), ('eviU', 'evil')):
        t = re.sub(r'\b' + bad + r'\b', good, t)
        t = re.sub(r'\b' + bad.capitalize() + r'\b', good.capitalize(), t)
    # Digits misread as letters in verse-marker position. Only the unambiguous ones: "I." is
    # left alone because it is also the Roman numeral opening chapter 1, and rewriting it
    # would break the chapter detection that depends on those numerals.
    t = re.sub(r'(?<![A-Za-z0-9])g\.(?=\s+[A-Z])', '9.', t)
    t = re.sub(r'(?<![A-Za-z0-9])ii\.(?=\s+[A-Z])', '11.', t)
    t = re.sub(r'(?<![A-Za-z0-9])S\.(?=\s+[A-Z])', '8.', t)
    # "10" set as the letters l-o: "lo. And wine and strong drink I drank not" is T. Reuben 1:10.
    t = re.sub(r'(?<![A-Za-z0-9])lo\.(?=\s+[A-Z])', '10.', t)
    # 5 printed as a caret: "^. Then shall the sceptre of my kingdom shine forth" is
    # T. Judah 24:5. Anchored to the start of a line, because Charles also uses ^ to close
    # a bracket round words absent from the Armenian ('...my infirmity"^. My land...'),
    # which would otherwise read as a verse and invent one.
    t = re.sub(r'(?<=\n)\^\.(?=\s+[A-Z])', '5.', t)
    return t


def fix_eleven(t):
    """"II." after verse 10 is the digits 11, not the Roman numeral.

    The typeface makes 11 and II identical, so the scan prints T. Gad 5:11 as "II. Since,
    therefore, my liver…". Read as a numeral it looks like the start of chapter 2, which
    split the chapter there and cost the next chapter its verse 1. It cannot be fixed
    blindly — "II." really does open chapter 2 elsewhere — so it is only rewritten where
    the verse run has just reached 10.
    """
    out, last = [], 0
    for piece in re.split(r'(?<![\d.,])(\d{1,3})\s*\.\s', t):
        if piece.isdigit() and len(piece) <= 3:
            last = int(piece)
            out.append(piece + '. ')
        else:
            if last == 10:
                # anywhere in the verse-10 text, not only at its start
                piece = re.sub(r'(?<=\s)II\.(?=\s+[A-Za-z])', '11.', piece, count=1)
            out.append(piece)
    return ''.join(out)


def parse_charles(raw):
    """{slug: [run, ...]} from the OCR — runs, not chapters; see align_runs."""
    t = fix_eleven(clean_ocr(raw))
    spans = [(m.start(), m.end(), m.group(1)) for m in re.finditer(HEADING, t)]
    # keep the first run of 12 headings in order (later ones are the index)
    spans = spans[:12]
    out = {}
    for i, (pos, hend, _name) in enumerate(spans):
        end = spans[i + 1][0] if i + 1 < len(spans) else len(t)
        # From the END of the heading — and the heading wraps ("THE TESTAMENT OF ASHER, THE
        # TENTH / SON OF JACOB AND ZILPAH"), so drop the continuation line too, or it lands
        # inside the chapter's verse 1.
        body = t[hend:end]
        # HEADING stops at the testament's name, so the rest of the heading block still
        # follows (", THE TENTH / SON OF JACOB AND ZILPAH"). Drop everything through the
        # blank line that closes it, or it lands inside that chapter's verse 1.
        body = re.sub(r'^.*?\n\s*\n', '', body, count=1, flags=re.S)
        out[SLUGS[i]] = verse_runs(body)
    return out


# The scan's ROMAN numerals are too damaged to segment chapters with: it prints II as "IL",
# III as "II", VI as "VL". Taking "II." for chapter 2 where the print means 3 would shift a
# whole chapter's worth of verses and never announce itself. The arabic VERSE numbers, by
# contrast, come through clean.
#
# So chapters are not read from the numerals at all. A testament is taken as one stream of
# numbered verses, and a chapter ends where the numbering RESTARTS — a number that does not
# continue the run. That boundary is then checked against the verse count of the Greek
# chapter, which came from an unrelated source; both have to agree.
# The scan sometimes drops a stray quote between the verse number's stop and the text
# ("3.' And I saw concerning him"), which is how T. Levi 11:3 went missing.
VERSE = re.compile(r'(?<![\d.,])(\d{1,3})\s*\.\s*[\'"‘’“”]?\s+(?=[A-Za-z(\[\'"“‘])')
# Editorial section headers ("VI. 5-12. An Exhortation to obey Levi") carry digits that
# would otherwise read as verse markers. Their ranges appear as arabic or as lowercase
# roman ("I. i-io. Introduction").
# The title wraps ("I. i-VI. 6. Asher on the Two Faces of Vice and Virtue / the Good and the
# Evil Tendency"), so removing only the line carrying the range left the remainder to be read
# as text — T. Reuben 1:1 came out as the words "and Repentance" and nothing else. Consume
# the whole header block, up to the blank line that closes it.
SECTION_HDR = re.compile(
    r'(?:^|\n)\s*[IVXLCn]{1,8}[.,]?\s*(?:\d{1,3}|[ivxlgo]{1,6})\s*[-–]\s*'
    r'(?:[IVXLCn]{1,8}[.,]?\s*)?(?:\d{1,3}|[ivxlgo]{1,6})\s*\.[\s\S]*?(?=\n\s*\n)', re.I)


# A chapter turn, inside the text that trails a chapter's last verse: the opening numeral,
# then the unnumbered verse 1. The numeral is only located, never read — the scan drops its
# period ("IL And now hear me") and misreads arabic verse numbers as Roman ("II." for 11),
# so its value cannot be trusted. Position in the stream gives the chapter number instead.
TURN = re.compile(r'\s(?=[IVXLCDJ]{1,8}[.,]?\s+[A-Z])')
# Fallback for a numeral the scan has mangled past that pattern: lowercase ("in." for III,
# T. Reuben 3) or followed by a word whose own first letter was misread ("V. rpor\"\" evil are
# women", T. Reuben 5). Only tried when the strict form finds nothing, and only immediately
# after sentence-ending punctuation, so it cannot cut into the middle of a sentence.
# The stop after the numeral is REQUIRED here. Without it the bare pronoun "I" reads as a
# numeral, and since the last match wins, "…what I did. I saw a man in distress" split at
# the pronoun and lost it — T. Zebulun 7:1 opened "saw a man in distress".
TURN_LOOSE = re.compile(r'(?<=[.;!?])\s(?=[IVXLCDJivxlcdjn]{1,6}[.,]\s+\S)')


def align_runs(runs, expected):
    """Fit the runs of verses cut from the scan onto the chapters the Greek says exist.

    A reset in the numbering is a good chapter signal but not a perfect one: the scan drops
    the odd verse number (so two chapters run together into one run) and sometimes prints a
    stray number that looks like a restart (so one chapter breaks into two). Left alone,
    either mistake shifts every chapter after it — which is why matching by position alone
    stalled at 67 of 142.

    So the runs are aligned to the expected chapter lengths, allowing a run to be merged
    with its neighbour or split in two, and the alignment is chosen to fit the most
    chapters exactly. An error then costs one chapter instead of all the rest.

    Returns [{verse: text}] positionally per chapter, with None where nothing fits.
    """
    n, m = len(runs), len(expected)
    NEG = float('-inf')
    # score[i][j] = best number of exactly-matching chapters using runs[i:] for expected[j:]
    score = [[NEG] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    score[n][m] = 0
    for i in range(n, -1, -1):
        for j in range(m, -1, -1):
            if i == n and j == m:
                continue
            best, mv = NEG, None
            if i < n and j < m:                      # run i is chapter j
                s = score[i + 1][j + 1]
                if s > NEG:
                    best, mv = s + (1 if len(runs[i]) == expected[j] else 0), ('take', 1, 1)
            if i + 1 < n and j < m:                  # a missed reset: two runs are one chapter
                s = score[i + 2][j + 1]
                if s > NEG:
                    got = len(runs[i]) + len(runs[i + 1])
                    cand = s + (1 if got == expected[j] else 0)
                    if cand > best:
                        best, mv = cand, ('merge', 2, 1)
            if i < n and j + 1 < m:                  # a stray number: one run is two chapters
                s = score[i + 1][j + 2]
                if s > NEG and len(runs[i]) == expected[j] + expected[j + 1]:
                    if s + 2 > best:                  # both halves land exactly or not at all
                        best, mv = s + 2, ('split', 1, 2)
            if i < n and j == m:                     # leftover run (front matter): drop it
                s = score[i + 1][j]
                if s > NEG and s > best:
                    best, mv = s, ('drop', 1, 0)
            # A stray fragment belonging to no chapter — the scan prints a number the text
            # does not carry, or a header's digits survive as a run. T. Judah opens with a
            # spurious [1, 3] and T. Reuben has a bare [4]; without a way to pass over them
            # every later chapter was compared against its neighbour's run. Only short runs
            # may be skipped, so this cannot discard a real chapter to force a fit.
            if i < n and j < m and len(runs[i]) <= 2:
                s = score[i + 1][j]
                if s > NEG and s > best:
                    best, mv = s, ('skip', 1, 0)
            if j < m and i == n:                     # chapter with nothing left: unfilled
                s = score[i][j + 1]
                if s > NEG and s > best:
                    best, mv = s, ('gap', 0, 1)
            score[i][j], back[i][j] = best, mv

    out, i, j = [], 0, 0
    while j < m:
        mv = back[i][j]
        if mv is None:
            out.append(None); j += 1; continue
        kind, di, dj = mv
        if kind == 'take':
            out.append(runs[i])
        elif kind == 'merge':
            merged = dict(runs[i])
            base = max(merged) if merged else 0
            for k, v in runs[i + 1].items():
                merged[base + k] = v
            out.append(merged)
        elif kind == 'split':
            first = {k: v for k, v in runs[i].items() if k <= expected[j]}
            rest = {k - expected[j]: v for k, v in runs[i].items() if k > expected[j]}
            out.append(first); out.append(rest);
        elif kind == 'gap':
            out.append(None)
        elif kind in ('drop', 'skip'):
            pass                                     # this run belongs to no chapter
        i += di; j += dj
    return out


def verse_runs(body):
    """The testament as runs of verses, cut where the numbering restarts."""
    body = SECTION_HDR.sub('\n', body)
    body = re.sub(r'(?:^|\n)\s*THE\s+TESTAMENT\s+OF[^\n]*', '\n', body)
    body = re.sub(r'\s*\n\s*', ' ', body).strip()

    parts = VERSE.split(body)
    stream = []
    if parts and parts[0].strip():
        stream.append((1, parts[0]))
    for i in range(1, len(parts) - 1, 2):
        stream.append((int(parts[i]), parts[i + 1]))

    runs, cur, prev = [], {}, 0
    for n, txt in stream:
        if n <= prev:
            # The numbering restarted, so the next chapter's verse 1 — which the print
            # leaves unnumbered — is sitting at the tail of the verse just stored. Cut it
            # back off at the chapter numeral.
            tail = cur.pop(prev, '')
            splits = list(TURN.finditer(tail)) or list(TURN_LOOSE.finditer(tail))
            if splits:
                at = splits[-1].start()
                cur[prev] = clean(tail[:at])
                runs.append(cur)
                # Strip the opening numeral, but never a bare "I" with no stop after it —
                # that is the pronoun, not chapter one.
                head = re.sub(r'^(?:[IVXLCDJivxlcdjn]{1,8}[.,]\s+|[IVXLCDJ]{2,8}\s+(?=[A-Z]))',
                              '', tail[at:].strip())
                cur = {1: clean(head)}
            else:
                cur[prev] = clean(tail)
                runs.append(cur)
                cur = {}
        cur[n] = clean(txt)
        prev = n
    if cur:
        runs.append(cur)
    return runs


def clean(t):
    # A chapter's opening numeral, left at the head of its verse 1. Verses reached here by
    # several paths (first run of a testament, a chapter turn, a run merged by align_runs),
    # so it is stripped once here rather than at each of them. Never a bare "I" without a
    # stop — that is the pronoun.
    t = re.sub(r'^\s*[IVXLCDJivxlcdjn]{1,6}[.,]\s+(?=[A-Z\[\'"])', '', t.lstrip())
    t = re.sub(r'^\s*L\s+(?=[A-Z])', '', t)
    return re.sub(r'\s{2,}', ' ', t).strip(' ;,')


GREEK_VERSE = re.compile(r'(?<![\w])(\d{1,3})\.\s')


def greek_verses(g):
    parts = GREEK_VERSE.split(g or '')
    out = {}
    for i in range(1, len(parts) - 1, 2):
        out[int(parts[i])] = parts[i + 1].strip()
    return out


def fetch(no_cache):
    if CACHE.exists() and not no_cache:
        return CACHE.read_text(encoding='utf-8', errors='replace')
    try:
        ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
    except Exception:
        ctx = ssl._create_unverified_context()
    req = urllib.request.Request(SRC, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=120, context=ctx).read().decode('utf-8', 'replace')
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(data, encoding='utf-8')
    return data


def chapter_greek(chapter):
    """{verse: greek} for a chapter, however it is currently stored.

    Once a chapter has been divided its Greek no longer carries the inline verse numbers —
    they became the rows. Reading only the undivided form made this script destroy its own
    expectation on a second run: every already-divided chapter looked like ZERO verses, which
    threw the alignment for the chapters around it. Handling both shapes makes it idempotent,
    so it can be re-run to pick up chapters that failed last time.
    """
    verses = chapter.get('verses') or []
    if len(verses) > 1:
        return {v['number']: v.get('greek', '') for v in verses}
    return greek_verses(verses[0].get('greek') if verses else '')


def main():
    charles = parse_charles(fetch('--no-cache' in sys.argv))
    undivided, divided, total = [], 0, 0

    for slug in SLUGS:
        f = DATA / f'{slug}.json'
        d = json.loads(f.read_text(encoding='utf-8'))
        greek = [chapter_greek(c) for c in d['chapters']]
        aligned = align_runs(charles.get(slug, []), [len(g) for g in greek])

        for i, c in enumerate(d['chapters']):
            total += 1
            gv, ev = greek[i], (aligned[i] if i < len(aligned) else None)
            n = c['number']
            if not gv:
                undivided.append(f'{slug} {n}: the Greek carries no verse numbers')
                continue
            # Divide only where the two independent sources agree on the verse count. A
            # disagreement means one of them was misread, and there is no way to tell which
            # — so the chapter is left exactly as it was rather than divided on a guess.
            if not ev or len(ev) != len(gv) or sorted(ev) != sorted(gv):
                got = len(ev) if ev else 0
                undivided.append(f'{slug} {n}: Greek {len(gv)} verses, Charles {got}')
                continue
            c['verses'] = [{'number': v, 'text': ev[v], 'greek': gv[v]} for v in sorted(gv)]
            divided += 1

        # Charles is only credited where his verses were actually used.
        if any(len(c['verses']) > 1 for c in d['chapters']):
            d['attribution'] = ATTRIBUTION
        f.write_text(json.dumps(d, ensure_ascii=False), encoding='utf-8')

    print(f'divided {divided}/{total} chapters (both sources agree on the verse count)')
    if undivided:
        print(f'\n{len(undivided)} left whole — sources disagree, so no division was guessed:')
        for u in undivided:
            print('  ' + u)


if __name__ == '__main__':
    main()
