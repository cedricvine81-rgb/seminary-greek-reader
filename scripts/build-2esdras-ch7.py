"""Restore 2 Esdras 7 in full, with the seventy verses the King James Version never had.

WHY THIS EXISTS
Our 2 Esdras is the KJV, and its chapter 7 runs 1-70. Modern editions run 1-140. That is not
a numbering convention we could ignore: eight cross-references in the Backgrounds apparatus
pointed into chapter 7 and landed nowhere, among them 4 Ezra 7:118 — "O thou Adam, what hast
thou done?" — which is the Second-Temple text most often set beside Romans 5.

THE LACUNA
Every Latin manuscript behind the KJV descends from Codex Sangermanensis I, from which a
single leaf had been cut out very early. Seventy verses went with it. The KJV therefore
prints 7:1-35, then continues at what it calls 7:36 but which is really 7:106. So:

    KJV 7:1-35    = modern 7:1-35
    (absent)      = modern 7:36-105     the leaf, recovered by Bensly in 1875
    KJV 7:36-70   = modern 7:106-140    the same text under numbers 70 too low

Both halves of that were broken for us: the fragment was missing outright, and the tail was
misaddressed.

SOURCE, AND WHY THE WHOLE CHAPTER
The Revised Version's Apocrypha (1895) was the first English edition ever to print 2 Esdras
complete — its own note at 7:35 reads "The passage from verse [36] to verse [105], formerly
missing, has been restored to the text." It is public domain, and being a revision of the KJV
it keeps the same register, so the join is a revision's distance and not a change of voice.

Chapter 7 is replaced whole rather than having the fragment spliced into the KJV. Splicing
would put two seams inside one chapter; taking the chapter entire puts them at chapter
breaks, which is where 2 Baruch 85-87 was joined for the same reason. Chapters 1-6 and 8-16
are untouched KJV.

Usage:  python3 scripts/build-2esdras-ch7.py [--no-cache]     (from the repo root)
"""
import html
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SRC = 'https://ebible.org/eng-rv/2ES07.htm'
CACHE = Path('/tmp/4ezra/rv7.html')
OUT = Path('public/data/apocrypha/2esdras.json')

ATTRIBUTION = (
    '2 Esdras, King James Version (1611), public domain. Source: Wikisource. Chapter 7 is '
    'given instead in the Revised Version (Apocrypha, 1895), also public domain, source '
    'ebible.org: the KJV was made from Latin manuscripts that had lost a leaf, so it lacks '
    '7:36-105 entirely and numbers the remainder seventy verses low (KJV 7:36-70 = 7:106-140). '
    'The Revised Version was the first English edition to print the chapter complete, and '
    'restores both the missing verses and the standard numbering used in citation. Chapters '
    '3-14 are also cited as "4 Ezra" in scholarly literature; chapters 1-2 and 15-16 '
    '("5 Ezra"/"6 Ezra") are later Christian additions.'
)


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


VERSE = re.compile(r'<span class="verse" id="V(\d+)">')
# A footnote is an anchor carrying its marker AND the note itself in a nested popup span.
# Dropping the whole anchor takes the daggers out of the reading text with it.
NOTE = re.compile(r'(?is)<a[^>]*class="notemark".*?</a>')


def main():
    raw = fetch('--no-cache' in sys.argv)

    body = raw[:raw.index("<ul class='tnav'>", raw.rindex('id="V'))]
    body = NOTE.sub(' ', body)

    parts = VERSE.split(body)
    verses = {}
    for i in range(1, len(parts) - 1, 2):
        txt = html.unescape(re.sub(r'<[^>]+>', ' ', parts[i + 1])).replace('\xa0', ' ')
        txt = re.sub(r'\s+', ' ', txt).strip()
        txt = re.sub(r'^\d+\s*', '', txt)          # the span carries its own number as text
        if txt:
            verses[int(parts[i])] = txt

    nums = sorted(verses)
    if nums != list(range(1, 141)):
        raise SystemExit(f'refusing to write: got {len(nums)} verses '
                         f'({min(nums)}..{max(nums)}), expected a gapless 1..140')
    # The two joins this whole script exists for. If either moved, the numbering is not what
    # we think it is and nothing below should be trusted.
    if 'Adam' not in verses[118]:
        raise SystemExit('refusing to write: 7:118 is not the Adam lament; numbering is off')
    if 'Abraham' not in verses[106]:
        raise SystemExit('refusing to write: 7:106 is not the Abraham verse (KJV 7:36)')
    stray = [n for n in nums if re.search(r'[*†‡§]', verses[n])]
    if stray:
        raise SystemExit(f'refusing to write: footnote markers survived in verses {stray}')

    doc = json.loads(OUT.read_text(encoding='utf-8'))
    doc['attribution'] = ATTRIBUTION
    doc['chapters'] = [
        {'number': 7, 'verses': [{'number': n, 'text': verses[n]} for n in nums]}
        if c['number'] == 7 else c
        for c in doc['chapters']
    ]
    OUT.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print(f'chapter 7: {len(nums)} verses (was 70)')
    for n in (35, 36, 105, 106, 118, 140):
        print(f'  7:{n:>3}  {verses[n][:88]}')


if __name__ == '__main__':
    main()
