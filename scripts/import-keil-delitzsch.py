#!/usr/bin/env python3
"""Build verse-keyed commentary JSON for Keil & Delitzsch's Commentary on the Old
Testament (1861-1875; English tr. T&T Clark; public domain) from Bible Hub's per-chapter
pages — the same source precedent as build-rhetoric-bengel.py.

Page anatomy (biblehub.com/commentaries/kad/<slug>/<ch>.htm): one <div class="chap"> whose
verse sections each open with

    <div class="versenum"><a href="/<slug>/<ch>-<v>.htm">Genesis 1:2</a></div>
    <div class="verse">…KJV text…</div>
    …commentary HTML until the next versenum…

The KJV text div is dropped (the app shows its own text pane); the commentary is reduced to
the Robertson whitelist (p/b/i/em/strong). Where the link text names a RANGE within the
chapter ("Genesis 4:3-7") the entry is replicated across those verses, so the scroll-tracked
pane never goes silent inside a span K&D treats as one unit. Ranges that cross chapters keep
only the verses of the current chapter.

Output: public/data/commentary/keil-delitzsch/<osisId>.json   { "<ch>:<v>": "<html>" }
Pages are cached under .kad-cache/ so re-runs are cheap.

Usage:  python3 scripts/import-keil-delitzsch.py [startBookOsis]
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / 'public' / 'data' / 'commentary' / 'keil-delitzsch'
CACHE = REPO / '.kad-cache'
BOOKS_JSON = REPO / 'public' / 'data' / 'books.json'

SLUG = {
    'Gen': 'genesis', 'Exod': 'exodus', 'Lev': 'leviticus', 'Num': 'numbers',
    'Deut': 'deuteronomy', 'Josh': 'joshua', 'Judg': 'judges', 'Ruth': 'ruth',
    '1Sam': '1_samuel', '2Sam': '2_samuel', '1Kgs': '1_kings', '2Kgs': '2_kings',
    '1Chr': '1_chronicles', '2Chr': '2_chronicles', 'Ezra': 'ezra', 'Neh': 'nehemiah',
    'Esth': 'esther', 'Job': 'job', 'Ps': 'psalms', 'Prov': 'proverbs',
    'Eccl': 'ecclesiastes', 'Song': 'songs', 'Isa': 'isaiah', 'Jer': 'jeremiah',
    'Lam': 'lamentations', 'Ezek': 'ezekiel', 'Dan': 'daniel', 'Hos': 'hosea',
    'Joel': 'joel', 'Amos': 'amos', 'Obad': 'obadiah', 'Jonah': 'jonah', 'Mic': 'micah',
    'Nah': 'nahum', 'Hab': 'habakkuk', 'Zeph': 'zephaniah', 'Hag': 'haggai',
    'Zech': 'zechariah', 'Mal': 'malachi',
}

SECTION_RE = re.compile(
    r'<div class="versenum"><a href="/[^"]*?/(\d+)-(\d+)\.htm">([^<]*)</a></div>')
VERSE_TEXT_RE = re.compile(r'^\s*<div class="verse">.*?</div>', re.S)
# "…4:3-7" (range inside one chapter) vs "…1:1-2:3" (crosses chapters).
RANGE_RE = re.compile(r'(\d+):(\d+)\s*-\s*(?:(\d+):)?(\d+)\s*$')


def fetch(url: str, key: str) -> str:
    CACHE.mkdir(exist_ok=True)
    f = CACHE / key
    if f.exists():
        return f.read_text(encoding='utf-8')
    env = {**os.environ, 'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
    out = subprocess.run(
        ['curl', '-s', '-A', 'Mozilla/5.0', url], capture_output=True, env=env
    ).stdout.decode('utf-8', errors='replace')
    f.write_text(out, encoding='utf-8')
    time.sleep(0.35)   # politeness — one page every ~third of a second
    return out


def clean(raw: str) -> str:
    """Reduce to the Robertson whitelist: p/b/i/em/strong, attributes stripped."""
    t = raw
    t = re.sub(r'<a\b[^>]*>([\s\S]*?)</a>', r'\1', t)
    t = re.sub(r'<br\s*/?>', ' ', t)
    t = re.sub(r'<(?!/?(?:p|b|i|em|strong)\b)[^>]*>', '', t)
    t = re.sub(r'<(p|b|i|em|strong)\b[^>]*>', lambda m: f'<{m.group(1).lower()}>', t, flags=re.I)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'<(b|i|em|strong)>\s+', r'<\1>', t)
    t = re.sub(r'\s+</(b|i|em|strong)>', r'</\1>', t)
    t = re.sub(r'<p>\s*</p>', '', t)
    return t.strip()


def parse_page(html: str, chapter: int) -> dict:
    start = html.find('<div class="versenum"')
    if start < 0:
        return {}
    end = html.find('<div id="botbox"', start)
    region = html[start:end] if end > 0 else html[start:]

    entries = {}
    matches = list(SECTION_RE.finditer(region))
    for i, m in enumerate(matches):
        ch, v = int(m.group(1)), int(m.group(2))
        if ch != chapter:
            continue
        body = region[m.end(): matches[i + 1].start() if i + 1 < len(matches) else len(region)]
        body = VERSE_TEXT_RE.sub('', body, count=1)
        text = clean(body)
        if not text or len(text) < 40:   # a bare "see above" stub helps no one
            continue
        keys = [v]
        r = RANGE_RE.search(m.group(3))
        if r and r.group(3) is None:     # range within this chapter: replicate
            lo, hi = int(r.group(2)), int(r.group(4))
            if 0 < hi - lo <= 30:
                keys = list(range(lo, hi + 1))
        for k in keys:
            entries.setdefault(f'{chapter}:{k}', text)
    return entries


def main():
    mt = json.load(open(BOOKS_JSON))['mt']
    start_at = sys.argv[1] if len(sys.argv) > 1 else None
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    started = start_at is None
    total = 0
    for b in mt:
        osis = b['osisId']
        if not started:
            started = osis == start_at
            if not started:
                continue
        slug = SLUG[osis]
        book_entries = {}
        empty = 0
        for ch in range(1, b['totalChapters'] + 1):
            html = fetch(f'https://biblehub.com/commentaries/kad/{slug}/{ch}.htm', f'{osis}-{ch}.htm')
            got = parse_page(html, ch)
            if not got:
                empty += 1
            book_entries.update(got)
        dest = OUT_DIR / f'{osis}.json'
        dest.write_text(json.dumps(book_entries, ensure_ascii=False), encoding='utf-8')
        total += dest.stat().st_size
        print(f'{osis}: {len(book_entries)} verse entries, {dest.stat().st_size // 1024} KB'
              + (f'  ({empty} empty chapters)' if empty else ''), flush=True)
    print(f'Total {total / 1_048_576:.1f} MB')


if __name__ == '__main__':
    main()
