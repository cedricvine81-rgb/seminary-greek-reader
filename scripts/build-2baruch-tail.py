"""Complete 2 Baruch: add chapters 85 (in full), 86 and 87.

WHY THIS EXISTS
Our 2 Baruch stopped at 85:2 — mid-sentence, and eight verses of 85 plus the whole of 86 and
87 were absent, so the Epistle simply had no ending. That was not our importer: the Wesley
Center transcription we took the work from ends at 85:2 with a literal "finish" marker.

Charles's 1896 edition has the text, but it is a critical edition whose apparatus and
commentary interleave with the body; separating the two out of linearised OCR is unreliable
(the same wall met on Box's Apocalypse of Abraham). His 1918 SPCK volume — the same
"Translations of Early Documents" series as the Testaments and Box — prints the translation
alone, and OCRs cleanly.

WHY THE WHOLE OF 85, NOT JUST 85:3-15
The 1913 (APOT) and 1918 (SPCK) forms of Charles's translation differ in wording — 1913 has
"Know, moreover, that ... our fathers had helpers", 1918 "Know ye, moreover, that ... those
our fathers had helpers". Splicing 1918 onto 1913 mid-chapter would put a seam inside a
sentence-run. So chapter 85 is taken whole from 1918, and the seam falls at a chapter break
where it belongs. Chapters 1-84 are untouched.

Source: archive.org/details/apocalypseofbaru00char (Charles, The Apocalypse of Baruch, SPCK
1918), public domain.

Usage:  python3 scripts/build-2baruch-tail.py [--no-cache]     (from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SRC = 'https://archive.org/download/apocalypseofbaru00char/apocalypseofbaru00char_djvu.txt'
CACHE = Path('/tmp/2bar/c1918.txt')
OUT = Path('public/data/pseudepigrapha/2baruch.json')

ATTRIBUTION = (
    '2 Baruch (The Syriac Apocalypse of Baruch), translated by R. H. Charles, public domain. '
    'Chapters 1-84 follow the Wesley Center Online text of his 1913 translation, which ends '
    'at 85:2; chapters 85-87 are supplied from his 1918 edition (SPCK, Translations of Early '
    'Documents), so the seam falls at a chapter break rather than inside one.'
)

# Running heads and the printer's colophon, which sit inside the text block.
NOISE = re.compile(r'THE APOCALYPSE OF BARUCH \d+|\d+ THE APOCALYPSE OF BARUCH'
                   r'|Here endeth the Book of Baruch.*', re.I)
# Charles's OCR slips in this volume, all unambiguous.
FIXES = [("3'our", 'your'), ('supphcation', 'supplication'), ('w^e', 'we'), ('haye', 'have'),
         ('w^ill', 'will'), ('Avill', 'will'), ('tlie', 'the'),
         # Broken across a line in the print. Listed individually because a blanket
         # "join hyphen + space" would turn long-suffering into longsuffering.
         ('repent- ance', 'repentance'), ('long- suffering', 'long-suffering')]


def fetch(no_cache):
    if CACHE.exists() and not no_cache:
        return CACHE.read_text(encoding='utf-8', errors='replace')
    try:
        ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
    except Exception:
        ctx = ssl._create_unverified_context()
    req = urllib.request.Request(SRC, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=180, context=ctx).read().decode('utf-8', 'replace')
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(data, encoding='utf-8')
    return data


def clean(t):
    t = NOISE.sub(' ', t)
    # Collapse whitespace FIRST: the line-break repairs below are written with a single
    # space, but in the raw scan the break is a newline.
    t = re.sub(r'\s+', ' ', t)
    for bad, good in FIXES:
        t = t.replace(bad, good)
    return t.strip(' ;,')


def main():
    raw = re.sub(r'[ \t]+', ' ', fetch('--no-cache' in sys.argv))

    start = raw.find('LXXXV. [Know ye, moreover')
    end = raw.find('Here endeth the Book of Baruch')
    if start < 0 or end < 0 or end <= start:
        raise SystemExit('refusing to write: could not locate chapters 85-87 in the 1918 text')
    span = raw[start:end]

    # The chapter numerals are unreliable here — the OCR prints 86 as "LXXXVL" with no full
    # stop at all, and 87 as "LXXXVn", and there is an editorial title ("LXXXVIL The Epistle
    # to the nine and a half Tribes is sent.") that looks like a chapter opening but is not.
    # For three chapters it is both safer and clearer to anchor on their opening words, which
    # can be checked by eye against the scan.
    OPENINGS = [
        (85, '[Know ye, moreover'),
        (86, 'When, therefore, ye receive this my'),
        (87, 'And it came to pass when I had'),
    ]
    picked = {}
    for i, (n, anchor) in enumerate(OPENINGS):
        at = span.find(anchor)
        if at < 0:
            raise SystemExit(f'refusing to write: could not find the opening of chapter {n}')
        stop = len(span)
        for _m, nxt in OPENINGS[i + 1:]:
            j = span.find(nxt, at + 1)
            if j > 0:
                stop = j
                break
        # Trim the numeral (and any editorial title) that trails the previous chapter.
        body = span[at:stop]
        # A chapter's tail can carry the next numeral, an editorial title, and then a
        # second numeral ("… fare ye well." LXXXVIL The Epistle to the nine and a half
        # Tribes is sent. LXXXVn.) — strip the whole run, not just one item.
        body = re.sub(r'(?:\s*"|\s*\bLXXX[VILn]{0,4}\.?'
                      r'|\s*The Epistle to the nine and a half\s*Tribes is sent\.)+\s*$',
                      ' ', body)
        picked[n] = body

    chapters = {}
    for n, body in picked.items():
        parts = re.split(r'(?:^|\s)(\d{1,2})\.\s+(?=[A-Z"\[(])', body)
        verses = {}
        if parts[0].strip():
            verses[1] = clean(parts[0].lstrip('[').strip())
        for k in range(1, len(parts) - 1, 2):
            txt = clean(parts[k + 1])
            if txt:
                verses[int(parts[k])] = txt
        chapters[n] = verses

    for n in (85, 86, 87):
        if not chapters.get(n):
            raise SystemExit(f'refusing to write: chapter {n} parsed no verses')

    doc = json.loads(OUT.read_text(encoding='utf-8'))
    kept = [c for c in doc['chapters'] if c['number'] < 85]
    for n in (85, 86, 87):
        kept.append({'number': n, 'verses': [{'number': v, 'text': chapters[n][v]}
                                             for v in sorted(chapters[n])]})
    doc['chapters'] = kept
    doc['attribution'] = ATTRIBUTION
    OUT.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print(f'{len(kept)} chapters, {sum(len(c["verses"]) for c in kept)} verses')
    for n in (85, 86, 87):
        c = [x for x in kept if x['number'] == n][0]
        print(f'  ch {n}: {len(c["verses"])} verses — {c["verses"][0]["text"][:70]}…')


if __name__ == '__main__':
    main()
