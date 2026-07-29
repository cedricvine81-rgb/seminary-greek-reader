"""Rebuild 3 Baruch from Hughes's English, recovering chapters 4 and 12.

WHY THIS EXISTS
Our 3 Baruch had 15 chapters, not 17: "3 Bar. 4:8" (the vine that deceived Adam, quoted
constantly on the fall) and all of chapter 12 resolved to nothing. The audit first read that
as missing text, but it is not — the text was always there, run into its neighbours. Chapter
4 sat inside chapter 3 as verses 9-17, and chapter 12 inside chapter 11 as verse 12, which
still begins "1, And as I was conversing with them…" with its own verse markers stranded in
the prose.

The cause is in the source page's markup. Wesley Center prints the chapter number in a red
<span>, but not uniformly: chapter 1 carries a full stop ("1."), the rest do not, and every
one pads with &nbsp; entities inside the span. A reader of that page written to expect one
shape misses the others — chapters 4 and 12 among them.

So chapters come from the red spans, matched loosely enough to accept all three shapes, and
the run is checked to be a complete 1..17 before anything is written.

VERSE NUMBERING — A LIMIT WORTH KNOWING
Charles's APOT sets verse numbers at the start of a printed LINE, not of a sentence, so once
the page is linearised they fall mid-clause: chapter 1 reads "1 Verily I Baruch was weeping…
and that 2 Nebuchadnezzar the king was permitted…", where the sense-break belongs before
"Lord, why didst Thou". Splitting on them therefore gives verses that begin mid-sentence.
That is the source's own convention and matches what we already shipped, so this build keeps
it rather than re-cutting the text by sense, which would be our invention rather than
Hughes's division.

Source: wesley.nnu.edu/biblical_studies/noncanon/ot/pseudo/3baruch.htm (now gone; read from
the Wayback Machine). H. M. Hughes's translation in R. H. Charles, APOT (1913), public domain.

Usage:  python3 scripts/build-3baruch.py [--no-cache]      (from the repo root)
"""
import html
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SNAP = ('http://web.archive.org/web/20071016145849id_/'
        'http://wesley.nnu.edu/biblical_studies/noncanon/ot/pseudo/3baruch.htm')
CACHE = Path('/tmp/3bar/hughes.html')
OUT = Path('public/data/pseudepigrapha/3baruch.json')

ATTRIBUTION = ('The Greek Apocalypse of Baruch (3 Baruch), tr. H. M. Hughes in R. H. Charles, '
               'The Apocrypha and Pseudepigrapha of the Old Testament (1913), public domain. '
               'Source: Wesley Center Online. Verse numbers follow the printed edition, which '
               'sets them at the head of a line rather than a sentence, so a verse may open '
               'mid-clause.')

# The chapter number in its red span: "1." on the first, bare elsewhere, always padded with
# &nbsp; — and once with the padding sitting outside the digits. Accept all of it.
CHAP = re.compile(r'<span style="color:red">\s*(\d{1,2})\.?(?:\s|&nbsp;|<[^>]+>)*</span>')
# Verse numbers are bare digits inline; "1And I Baruch" shows they may abut the next word.
VERSE = re.compile(r'(?<![\d])(\d{1,2})[,.]?\s*(?=[A-Za-z])')


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


def plain(fragment):
    t = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', fragment)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t)).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', t).strip()


def split_verses(chunk):
    parts = VERSE.split(chunk)
    verses, lead = {}, parts[0].strip(' ,.;')
    for i in range(1, len(parts) - 1, 2):
        txt = re.sub(r'\s{2,}', ' ', parts[i + 1]).strip(' ,;')
        if txt:
            verses[int(parts[i])] = txt
    # Text before the first marker belongs to the verse before it (or to verse 1).
    if lead and 1 not in verses:
        verses[1] = lead
    return verses


def main():
    raw = fetch('--no-cache' in sys.argv)
    marks = [(int(m.group(1)), m.start(), m.end()) for m in CHAP.finditer(raw)]
    kept, cur = [], 0
    for n, s, e in marks:
        if n == cur + 1 and n <= 17:
            kept.append((n, s, e)); cur = n

    got = [n for n, _, _ in kept]
    if got != list(range(1, 18)):
        raise SystemExit(f'refusing to write: expected chapters 1..17, parsed {got}')

    chapters = []
    for i, (n, _s, e) in enumerate(kept):
        end = kept[i + 1][1] if i + 1 < len(kept) else len(raw)
        verses = split_verses(plain(raw[e:end]))
        if not verses:
            raise SystemExit(f'refusing to write: chapter {n} parsed no verses')
        chapters.append({'number': n,
                         'verses': [{'number': v, 'text': verses[v]} for v in sorted(verses)]})

    OUT.write_text(json.dumps({
        'work': '3 Baruch (Greek Apocalypse)',
        'attribution': ATTRIBUTION,
        'chapters': chapters,
    }, ensure_ascii=False), encoding='utf-8')

    total = sum(len(c['verses']) for c in chapters)
    print(f'{len(chapters)} chapters, {total} verses')
    for c in chapters:
        print(f"  ch {c['number']:>2}: {len(c['verses']):>2} verses")


if __name__ == '__main__':
    main()
