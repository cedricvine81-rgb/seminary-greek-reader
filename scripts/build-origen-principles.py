# Builds Origen, De Principiis (On First Principles) for the Texts library.
#
# WHY: the Themes "Satan and the origin of evil" page names its absence — it is the first
# Christian work to treat the fall of the devil as a doctrine to be argued rather than a story
# to be told, and the library held only Contra Celsum. It also bears on Free will, Resurrection
# and the Trinity, none of which had Origen's systematic voice.
#
# Text: the Ante-Nicene Fathers translation (Crombie, 1885) of Rufinus' Latin — public domain —
# from newadvent.org, which serves one page per book. (Wikisource's ANF vol. IV holds the
# Tertullian part of the volume but not this work.)
#
# WHAT LATIN, AND WHY IT MATTERS. Almost all of this survives only in Rufinus' Latin, and
# Rufinus said openly that he softened passages he thought heretical. Where the Greek survives
# it sometimes disagrees. So this is Origen at one remove, by a translator with a stated
# agenda, and a claim resting on a single sentence here should be checked before it is leaned on.
#
# DIVISIONS. Books I-III are chapter → numbered section, so "De Princ. 1.5.2" resolves to
# chapter 5, section 2 — the same arrangement as Irenaeus in build-anf.py. Book IV has no
# chapters in the ANF: it is one continuous run of numbered sections, and is cited "De Princ.
# 4.11". There, section = chapter.
#
# Output: public/data/anf/origen-principles-{1,2,3,4}.json
# Usage:  python3 scripts/build-origen-principles.py [--no-cache]   (from the repo root)

import html
import json
import os
import re
import ssl
import sys
import time
import urllib.request
from pathlib import Path

CACHE = Path('/tmp/origen-principles')
OUT_DIR = Path('public/data/anf')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1'

_CERTS = next((p for p in ('/etc/ssl/cert.pem', os.environ.get('CURL_CA_BUNDLE', ''))
               if p and Path(p).exists()), None)
SSL_CTX = ssl.create_default_context(cafile=_CERTS) if _CERTS else ssl.create_default_context()

ATTRIBUTION = (
    'Origen, De Principiis, tr. Frederick Crombie in "The Ante-Nicene Fathers" (1885); public '
    'domain. Source: newadvent.org. Almost the whole work survives only in Rufinus’ Latin, and '
    'Rufinus stated that he softened passages he judged heretical — where the Greek survives it '
    'sometimes disagrees, so this is Origen at one remove.'
)

# book number, url, expected chapters (None = Book IV, whose sections stand in for chapters)
BOOKS = [
    (1, 'https://www.newadvent.org/fathers/04121.htm', 8),
    (2, 'https://www.newadvent.org/fathers/04122.htm', 11),
    (3, 'https://www.newadvent.org/fathers/04123.htm', 6),
    (4, 'https://www.newadvent.org/fathers/04124.htm', None),
]

# BOOK IV IS PRINTED TWICE, and that is the most useful thing about it. The ANF gives Rufinus'
# Latin paraphrase and then the same treatise again translated literally from the Greek that
# survives in the Philocalia, with this note between them saying why. Since the whole work is
# otherwise Rufinus at one remove, the one place his paraphrase can be checked against Origen's
# own words should not be flattened into a single run of sections — so the two become two works,
# as the Testament of Abraham's recensions do.
GREEK_NOTE = re.compile(r'The translation from the Greek is designedly literal', re.I)

CHAPTER = re.compile(r'(?m)^\s*Chapter\s+(\d+)\.')
SECTION = re.compile(r'(?m)^\s*(\d{1,3})\.\s+')
# New Advent wraps every page in the same site chrome; these open its navigation blocks.
CHROME = re.compile(r'(?i)^(home|encyclopedia|summa|fathers|bible|library|search|copyright|'
                    r'please help support|new advent|about this page|citation|contact us|'
                    r'file under|transcribed by|translated by)')


def fetch(url: str, no_cache: bool) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (re.sub(r'[^A-Za-z0-9]+', '_', url)[-40:] + '.html')
    if cached.exists() and not no_cache:
        return cached.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    body = urllib.request.urlopen(req, timeout=60, context=SSL_CTX).read().decode('utf-8', 'replace')
    cached.write_text(body, encoding='utf-8')
    time.sleep(0.3)
    return body


def plain_text(page: str) -> str:
    t = re.sub(r'(?is)<(script|style|nav|footer|form|select)[^>]*>.*?</\1>', ' ', page)
    t = re.sub(r'(?i)<(p|br|div|h[1-6]|li)[^>]*>', '\n\n', t)
    t = html.unescape(re.sub(r'<[^>]+>', '', t))
    t = re.sub(r'[ \t]+([.,;:!?])', r'\1', t)
    return t


def blocks(text: str) -> list[str]:
    out = []
    for b in re.split(r'\n\s*\n', text):
        p = re.sub(r'\s+', ' ', b).strip()
        if len(p.split()) > 8 and not CHROME.match(p):
            out.append(p)
    return out


def sections_of(text: str) -> list[dict]:
    """A chapter's numbered sections; anything before section 1 is the chapter title."""
    parts = blocks(text)
    verses, current = [], None
    for p in parts:
        m = SECTION.match(p)
        if m:
            current = {'number': int(m.group(1)), 'text': p[m.end():].strip()}
            verses.append(current)
        elif current is not None:
            current['text'] += ' ' + p
    # A chapter with no numbered sections at all is still one block of text.
    if not verses and parts:
        verses = [{'number': i + 1, 'text': p} for i, p in enumerate(parts)]
    return verses


def as_chapters(text: str) -> list[dict]:
    """Book IV has no chapters, so each numbered section becomes one."""
    return [{'number': v['number'], 'verses': [{'number': 1, 'text': v['text']}]}
            for v in sections_of(text)]


def build_book(url: str, expect: int | None, no_cache: bool) -> tuple[list[dict], list[str]]:
    text = plain_text(fetch(url, no_cache))
    problems: list[str] = []
    if expect is None:
        chapters = as_chapters(text)
    else:
        marks = list(CHAPTER.finditer(text))
        chapters = []
        for i, m in enumerate(marks):
            n = int(m.group(1))
            if any(c['number'] == n for c in chapters):
                continue                                   # New Advent repeats a contents list
            end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
            verses = sections_of(text[m.end():end])
            if verses:
                chapters.append({'number': n,
                                 'verses': [{'number': v['number'], 'text': v['text']} for v in verses]})
        if [c['number'] for c in chapters] != list(range(1, expect + 1)):
            problems.append(f'expected chapters 1-{expect}, got {[c["number"] for c in chapters]}')
    nums = [c['number'] for c in chapters]
    if nums != sorted(set(nums)):
        problems.append('chapters out of order or repeated')
    return chapters, problems


def main() -> int:
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = True
    print(f'{"book":6s} {"ch":>4s} {"verses":>7s} {"words":>8s}  check')
    for book, url, expect in BOOKS:
        if expect is None:
            # Split at the note and emit the two versions separately.
            text = plain_text(fetch(url, no_cache))
            m = GREEK_NOTE.search(text)
            if not m:
                print('  Book IV: the Rufinus/Greek divider is gone — check the source', file=sys.stderr)
                return 1
            for suffix, label, part in (('4', 'Book 4, Rufinus’ Latin', text[:m.start()]),
                                        ('4g', 'Book 4, from the Greek', text[m.end():])):
                chs = as_chapters(part)
                w = sum(len(v['text'].split()) for c in chs for v in c['verses'])
                nums = [c['number'] for c in chs]
                probs = [] if nums == list(range(1, len(nums) + 1)) else [f'non-contiguous {nums[:10]}']
                if probs:
                    ok = False
                (OUT_DIR / f'origen-principles-{suffix}.json').write_text(json.dumps(
                    {'work': f'Origen, On First Principles ({label})', 'attribution': ATTRIBUTION,
                     'chapters': chs}, ensure_ascii=False, indent=1), encoding='utf-8')
                print(f'{suffix:<6s} {len(chs):4d} {len(chs):7d} {w:8,d}  '
                      f'{"; ".join(probs) if probs else "ok"}')
            continue
        chapters, problems = build_book(url, expect, no_cache)
        words = sum(len(v['text'].split()) for c in chapters for v in c['verses'])
        verses = sum(len(c['verses']) for c in chapters)
        if words < 8000:
            problems.append(f'only {words} words for a whole book')
        if problems:
            ok = False
        out = OUT_DIR / f'origen-principles-{book}.json'
        out.write_text(json.dumps({'work': f'Origen, On First Principles (Book {book})',
                                   'attribution': ATTRIBUTION, 'chapters': chapters},
                                  ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'{book:<6d} {len(chapters):4d} {verses:7d} {words:8,d}  '
              f'{"; ".join(problems) if problems else "ok"}')
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
