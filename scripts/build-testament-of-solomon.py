# Builds the Testament of Solomon for the Texts library.
#
# WHY: it is the fullest demonology in this literature and the Themes "Satan and the origin of
# evil" page named its absence — a catalogue of individual demons, each interrogated by Solomon,
# each giving its name, the ailment it causes and the angel who thwarts it. Nothing else in the
# library supplies that.
#
# Text: F. C. Conybeare's translation, Jewish Quarterly Review 11 (1898), pp. 1-45 — public
# domain. Taken from Wikisource, which marks both the Greek original and the translation
# {{PD-old}}.
#
# THE RENDERED PAGE, NOT THE WIKITEXT. Wikisource holds this work as a scan transclusion —
# `<pages index="Testament of Solomon.djvu" include="1-45" />` — so ?action=raw returns six
# lines of template and none of the text. The HTML is the only place the transcription exists
# in one piece.
#
# DIVISIONS. Conybeare numbers his sections 1-130 straight through, with no chapters, and that
# single number is how the translation is cited ("T. Sol. 26"). So section = chapter here, and
# each paragraph inside it is a verse — the same arrangement as the Testament of Abraham.
# (Modern editions use McCown's chapter:verse instead; the two do not map onto each other, and
# inventing a correspondence would produce citations agreeing with no edition anywhere.)
#
# TWO TRAPS IN THE SOURCE, both of which silently lose sections:
#   · Wikisource inserts a ZERO-WIDTH SPACE (U+200B) at every scan-page boundary, and it is not
#     matched by \s — nine sections opened with one and were swallowed into their predecessor.
#   · Section 12 is printed "12," with a comma for a full stop.
# The build refuses to write unless all 130 are present, contiguous and unrepeated.
#
# Output: public/data/pseudepigrapha-b/testament-of-solomon.json
# Usage:  python3 scripts/build-testament-of-solomon.py   (from the repo root)

import html
import json
import os
import re
import ssl
import sys
import urllib.request
from pathlib import Path

URL = 'https://en.wikisource.org/wiki/The_Testament_of_Solomon'
CACHE = Path('/tmp/testament-of-solomon.html')
OUT = Path('public/data/pseudepigrapha-b/testament-of-solomon.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1'
EXPECTED = 130

_CERTS = next((p for p in ('/etc/ssl/cert.pem', os.environ.get('CURL_CA_BUNDLE', ''))
               if p and Path(p).exists()), None)
SSL_CTX = ssl.create_default_context(cafile=_CERTS) if _CERTS else ssl.create_default_context()

ATTRIBUTION = (
    'Testament of Solomon, tr. F. C. Conybeare, in "The Jewish Quarterly Review" 11 (1898); '
    'public domain. Sections are Conybeare’s own numbering, 1–130, which is how his translation '
    'is cited; modern editions use McCown’s chapter and verse instead, and the two do not '
    'correspond. Source: Wikisource.'
)

# A section opens a paragraph with its number and a full stop — or, at section 12, a comma.
SECTION = re.compile(r'(?m)^\s*(\d{1,3})[.,]\s+')


def fetch() -> str:
    if CACHE.exists():
        return CACHE.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(URL, headers={'User-Agent': UA})
    body = urllib.request.urlopen(req, timeout=60, context=SSL_CTX).read().decode('utf-8', 'replace')
    CACHE.write_text(body, encoding='utf-8')
    return body


def plain_text(page: str) -> str:
    body = re.search(r'(?is)<div class="mw-parser-output">(.*)', page)
    t = body.group(1) if body else page
    t = re.sub(r'(?is)<(script|style|table)[^>]*>.*?</\1>', ' ', t)
    t = re.sub(r'(?is)<sup[^>]*>.*?</sup>', ' ', t)        # footnote markers, not text
    t = re.sub(r'(?i)<p[^>]*>', '\n\n', t)
    t = re.sub(r'(?i)<(br|div|li|h[1-6])[^>]*>', '\n', t)
    t = html.unescape(re.sub(r'<[^>]+>', '', t))
    t = t.replace('​', '').replace('﻿', '')      # scan-page boundary marks
    t = re.sub(r'\[\s*\d+\s*\]', '', t)                    # printed page numbers
    # Removing a footnote marker leaves a gap before the punctuation it sat on ("the earth .").
    t = re.sub(r'[ \t]+([.,;:!?])', r'\1', t)
    return t


def parse(text: str) -> list[dict]:
    marks = list(SECTION.finditer(text))
    # Conybeare's footnotes follow the text and are full of "12." style references, so stop at
    # the first mark whose number goes backwards — everything after that is apparatus.
    kept: list[re.Match] = []
    for m in marks:
        n = int(m.group(1))
        if kept and n != int(kept[-1].group(1)) + 1:
            if n <= int(kept[-1].group(1)):
                break
            continue
        kept.append(m)
    chapters = []
    for i, m in enumerate(kept):
        end = kept[i + 1].start() if i + 1 < len(kept) else len(text)
        verses = [re.sub(r'\s+', ' ', p).strip()
                  for p in re.split(r'\n\s*\n', text[m.end():end]) if p.strip()]
        verses = [v for v in verses if len(v) > 1 and not v.startswith('↑')]
        if verses:
            chapters.append({'number': int(m.group(1)),
                             'verses': [{'number': j + 1, 'text': v} for j, v in enumerate(verses)]})
    return chapters


def main() -> int:
    text = plain_text(fetch())
    chapters = parse(text)
    nums = [c['number'] for c in chapters]
    problems = []
    if nums != list(range(1, EXPECTED + 1)):
        missing = [i for i in range(1, EXPECTED + 1) if i not in set(nums)]
        problems.append(f'expected sections 1-{EXPECTED}, got {len(nums)}; missing {missing[:12]}')
    words = sum(len(v['text'].split()) for c in chapters for v in c['verses'])
    # Measure the capture against the source rather than against a number someone remembered:
    # the span from the first section mark to the last is what there is to take, so anything
    # well short of it means paragraphs are being dropped. (An absolute floor was tried first
    # and was simply wrong — it was guessed at 19,000 for a text of about 12,700.)
    marks = list(SECTION.finditer(text))
    if marks:
        available = len(text[marks[0].start():marks[-1].end() + 4000].split())
        if words < 0.85 * available:
            problems.append(f'captured {words} words of about {available} available — paragraphs '
                            f'are being dropped')
    if problems:
        for p in problems:
            print(f'  {p}', file=sys.stderr)
        return 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'work': 'Testament of Solomon', 'attribution': ATTRIBUTION,
                               'chapters': chapters}, ensure_ascii=False, indent=1), encoding='utf-8')
    verses = sum(len(c['verses']) for c in chapters)
    print(f'{OUT}: {len(chapters)} sections, {verses} paragraphs, {words:,} words')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
