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
    t = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', t)            # hyphenation across lines
    t = re.sub(r'\n?\s*\d{1,3}\s+THE\s+TESTAMENTS\s+OF\s*', '\n', t)   # running heads
    t = re.sub(r'\n?\s*THE\s+TWELVE\s+PATRIARCHS\s+\d{1,3}\s*', '\n', t)
    t = re.sub(r'[ \t]+', ' ', t)
    # "ll" misread as U or h, only inside a word between letters
    for bad, good in (('shaU', 'shall'), ('shah', 'shall'), ('wiU', 'will'), ('aU', 'all'),
                      ('faU', 'fall'), ('caU', 'call'), ('teU', 'tell'), ('fuU', 'full'),
                      ('smaU', 'small'), ('weU', 'well'), ('kiU', 'kill'), ('iU', 'ill'),
                      ('foUow', 'follow'), ('beUy', 'belly'), ('eviU', 'evil')):
        t = re.sub(r'\b' + bad + r'\b', good, t)
        t = re.sub(r'\b' + bad.capitalize() + r'\b', good.capitalize(), t)
    return t


def parse_charles(raw):
    """{slug: {chapter: {verse: text}}} from the OCR."""
    t = clean_ocr(raw)
    spans = [(m.start(), m.group(1)) for m in re.finditer(HEADING, t)]
    # keep the first run of 12 headings in order (later ones are the index)
    spans = spans[:12]
    out = {}
    for i, (pos, _name) in enumerate(spans):
        end = spans[i + 1][0] if i + 1 < len(spans) else len(t)
        body = t[pos:end]
        out[SLUGS[i]] = parse_testament(body)
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
VERSE = re.compile(r'(?<![\d.,])(\d{1,3})\s*\.\s+(?=[A-Za-z(\[\'"“‘])')
# Editorial section headers ("VI. 5-12. An Exhortation to obey Levi") carry digits that
# would otherwise read as verse markers. Their ranges appear as arabic or as lowercase
# roman ("I. i-io. Introduction").
SECTION_HDR = re.compile(
    r'(?:^|\n)\s*[IVXLC]{1,8}[.,]?\s*(?:\d{1,3}|[ivxl]{1,6})\s*[-–]\s*'
    r'(?:[IVXLC]{1,8}[.,]?\s*)?(?:\d{1,3}|[ivxlo]{1,6})\s*\.[^\n]*', re.I)


# A chapter turn, inside the text that trails a chapter's last verse: the opening numeral,
# then the unnumbered verse 1. The numeral is only located, never read — the scan drops its
# period ("IL And now hear me") and misreads arabic verse numbers as Roman ("II." for 11),
# so its value cannot be trusted. Position in the stream gives the chapter number instead.
TURN = re.compile(r'\s(?=[IVXLCDJ]{1,8}[.,]?\s+[A-Z])')


def parse_testament(body):
    """{chapter: {verse: text}} — chapters cut where the verse numbering restarts."""
    body = SECTION_HDR.sub('\n', body)
    body = re.sub(r'(?:^|\n)\s*THE\s+TESTAMENT\s+OF[^\n]*', '\n', body)
    body = re.sub(r'\s*\n\s*', ' ', body).strip()

    parts = VERSE.split(body)
    stream = []
    if parts and parts[0].strip():
        stream.append((1, parts[0]))
    for i in range(1, len(parts) - 1, 2):
        stream.append((int(parts[i]), parts[i + 1]))

    chapters, cur, ch, prev = {}, {}, 1, 0
    for n, txt in stream:
        if n <= prev:
            # The numbering restarted, so this chapter's verse 1 — which the print leaves
            # unnumbered — is sitting at the tail of the verse just stored. Cut it back off
            # at the chapter numeral.
            tail = cur.pop(prev, '')
            splits = list(TURN.finditer(tail))
            if splits:
                at = splits[-1].start()
                cur[prev] = clean(tail[:at])
                chapters[ch] = cur
                ch, cur = ch + 1, {1: clean(re.sub(r'^[IVXLCDJ]{1,8}[.,]?\s+', '', tail[at:].strip()))}
            else:
                cur[prev] = clean(tail)
                chapters[ch] = cur
                ch, cur = ch + 1, {}
        cur[n] = clean(txt)
        prev = n
    if cur:
        chapters[ch] = cur
    return chapters


def clean(t):
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


def main():
    charles = parse_charles(fetch('--no-cache' in sys.argv))
    mismatches, written = [], 0

    for slug in SLUGS:
        f = DATA / f'{slug}.json'
        d = json.loads(f.read_text(encoding='utf-8'))
        en = charles.get(slug, {})
        for c in d['chapters']:
            n = c['number']
            gv = greek_verses(c['verses'][0].get('greek'))
            ev = en.get(n, {})
            if not gv:
                mismatches.append(f'{slug} {n}: no Greek verse numbers')
                continue
            if not ev:
                mismatches.append(f'{slug} {n}: Charles chapter not parsed')
                continue
            if max(gv) != max(ev) or len(gv) != len(ev):
                mismatches.append(f'{slug} {n}: Greek has {len(gv)} verses (max {max(gv)}), '
                                  f'Charles {len(ev)} (max {max(ev)}) — left undivided')
                continue
            c['verses'] = [{'number': v, 'text': ev.get(v, ''), 'greek': gv[v]}
                           for v in sorted(gv)]
        d['attribution'] = ATTRIBUTION
        f.write_text(json.dumps(d, ensure_ascii=False), encoding='utf-8')
        written += 1

    tot = sum(len(json.loads((DATA / f'{s}.json').read_text())['chapters']) for s in SLUGS)
    vs = sum(len(c['verses']) for s in SLUGS
             for c in json.loads((DATA / f'{s}.json').read_text())['chapters'])
    print(f'{written} testaments, {tot} chapters, {vs} verses')
    print(f'agreed and divided: {tot - len(mismatches)}/{tot} chapters')
    if mismatches:
        print(f'\n{len(mismatches)} chapters left undivided (sources disagree):')
        for m in mismatches:
            print('  ' + m)


if __name__ == '__main__':
    main()
