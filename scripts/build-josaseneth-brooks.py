#!/usr/bin/env python3
"""Extract E. W. Brooks's PUBLIC-DOMAIN Joseph and Asenath (SPCK 1918) as clean chapter prose.

STATUS: this produces a CANDIDATE. It is NOT wired into the app and public/data is not touched.
It exists because our shipped `public/data/pseudepigrapha/josaseneth.json` cannot be translated
as it stands (see below), and Brooks is the way out of that — but adopting Brooks needs a
decision about verse addressing that this script deliberately does not make.

WHY THE SHIPPED TEXT CANNOT BE USED
  1. RIGHTS. Its own `attribution` says the translator "is not recorded ... its provenance has
     not been established", and that it is NOT Brooks. Every other work in this project comes
     from an established-PD text; translating an unattributed rendering would be a derivative of
     possibly-protected material.
  2. DOUBLE TEXT. An archaic and a modern rendering are concatenated inside single verse records,
     the modern one's verse numbers left inline: 63 of 303 verses across 16 chapters.

WHY THIS SCAN, AND NOT THE OBVIOUS ONE
  archive.org has several scans of Brooks. `josephasenathco00broo` is the one that turns up first
  and its `_djvu.txt` serves, but its OCR is badly corrupted at the left margin — "second nonth",
  "[oseph", "in:he fourth", "a Driest of Heliopolis", "Decause". Unusable.
  **`josephasenath0000ewbr` is a far cleaner scan of the same book** and is what this uses.
  (`josephasenathcon00broo`, `cu31924079583955`, `in.ernet.dli.2015.88530` all 500 on _djvu.txt.)

HOW THE PARSE WORKS
  * Chapters are found by a GUIDED FORWARD SCAN: a global regex fails because the OCR mangles the
    numerals, but chapters must occur in order, so chapter N+1 is only sought after chapter N.
    Real mangles handled here: "X XIX." (29, internal space), "XXiV." (24, lowercase i).
  * Running headers delimit PAGES. Footnotes are ALWAYS the tail of a page, so within each page
    everything from the first siglum-bearing footnote marker to the page end is apparatus.
    Header OCR variants that had to be tolerated: "34 JOSEPH. AND ASENATH [x" (period after
    JOSEPH) and "78 JOSEPH AND ASENATH pees" (bracketed numeral lost entirely). Both caused whole
    chapters to be swallowed by the footnote cut before they were handled.
  * Three footnotes in the whole book cannot be reached by the page-tail rule: ch 4's opens with
    OCR garbage, ch 24's lost its leading digit into the previous word, and ch 11's is set
    mid-sentence rather than at a page foot. They are excised explicitly and the script FAILS
    LOUDLY if any of the three spans stops matching.

WHAT IT YIELDS
  29 chapters, ~71,500 characters, zero residual apparatus.

THE DECISION IT DOES NOT MAKE
  **Brooks has no verse numbers at all** — chapters are Roman numerals over continuous prose.
  Our shipped work is addressed by chapter+verse (303 verses). Matching Brooks into that existing
  structure is possible for most chapters, but NOT for these, where the shipped text is itself a
  stub or truncation and so has nowhere to put Brooks's text:
      ch 11 — 1 verse for a full chapter        ch 18 — 8 verses, truncated
      ch 17 — 3 verses, numbered 1, 2, 25       ch 19 — 2 verses, numbered 9 and 10
  Adopting Brooks therefore means either inventing verse divisions in those chapters or going
  chapter-level (the Assumption of Moses precedent). That is a product call, not a script's.

Usage:  python3 scripts/build-josaseneth-brooks.py [--no-cache]     (from the repo root)
        writes /tmp/josaseneth-brooks.json
"""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SRC = 'https://archive.org/download/josephasenath0000ewbr/josephasenath0000ewbr_djvu.txt'
CACHE = Path('/tmp/jaa/brooks_source.txt')
OUT = Path('/tmp/josaseneth-brooks.json')

HDR = re.compile(
    r'^\s*(?:\d+\s+JOSEPH[.,]?\s+AND\s+ASENATH[.,]?\s*\S{0,14}'
    r'|[a-zA-Z0-9]{1,8}[\]\}\)|]\s+[A-Z][^\n]{3,55}\S{1,4})\s*$', re.M)
FN_START = re.compile(r'^\s*(?:\d{1,2}\s*[A-Za-z‘“"]|[®*^]\s*\S|[A-Z]{1,2}\s+(?:Lat|Syr|Arm|Slav)\.)')
SIGLA = re.compile(r'\bLat\.|\bSyr\.|\bArm\.|\bSlav\.|\bSlay\.|\bins[.,]|\bom\.|versions|\bBD\b|\bMSS\b')

EXCISE = {
    4:  re.compile(r'\s*a if otra;.*?except p\. 35,\s*'),
    # ch 11's footnote is set MID-LINE, not as a page tail, so the page-tail cut cannot see it;
    # it lands inside a sentence ("and her head she <fn> laid upon her bosom"). It also names no
    # siglum, so the SIGLA leak-check cannot see it either. Only an explicit excision removes it.
    11: re.compile(r'\s*1?\s*T omit rds, which is clearly wrong\.\s*'),
    24: re.compile(r'\?\s*Syr\. " The sons of B\. and Z\.";.*?Slav\. "D\. and G\."\s*'),
}


def fetch(no_cache=False):
    if CACHE.exists() and not no_cache:
        return CACHE.read_text(encoding='utf-8', errors='replace')
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(SRC, context=ctx, timeout=120) as r:
        text = r.read().decode('utf-8', 'replace')
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(text, encoding='utf-8')
    return text


def numeral(n):
    vals = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'),
            (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    out = ''
    for v, s in vals:
        while n >= v:
            out += s
            n -= v
    return out


def strip_page(page):
    """Cut a page's apparatus tail: the block must bear a siglum AT ITS HEAD, not merely below."""
    lines = page.split('\n')
    for i, l in enumerate(lines):
        if not FN_START.match(l):
            continue
        head = ' '.join(lines[i:i + 2])
        tail = ' '.join(lines[i:])
        if SIGLA.search(head) and len(SIGLA.findall(tail)) >= max(1, len(lines[i:]) // 8):
            return '\n'.join(lines[:i])
    return page


def clean(s):
    s = re.sub(r'^\s*[IVXL][IVXL\s]{0,9}[.,]\s*', '', s)          # chapter numeral, spaces allowed
    s = re.sub(r'\n\s*[IVXL]{1,8}\s*\n', '\n', s)
    s = re.sub(r'\n[ \t]*[A-Z][^\n]{0,70}\.[ \t]*\n(?=[ \t]*\n)', '\n', s)   # section titles
    for a, b in [('“', '"'), ('”', '"'), ('‘', "'"), ('’', "'")]:
        s = s.replace(a, b)
    s = re.sub(r'[\^\*®©°¢]+', ' ', s)                            # footnote anchor glyphs
    s = re.sub(r'(?<=[a-z,;."])\s?\d(?=\s)', ' ', s)              # anchor digits
    s = re.sub(r'-\s*\n\s*', '', s)                               # de-hyphenate
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+([,.;:!?])', r'\1', s)
    # a chapter's last page carries the NEXT chapter's section title
    s = re.sub(r'(?<=[.\"])\s+(?:[A-Z][a-z\']+\s+){0,3}[A-Z][a-z\']+'
               r'(?:\s+(?:[a-z\']+|[A-Z][a-z\']+)){0,8}\.\s*$', '', s)
    return s.strip()


def main():
    T = fetch('--no-cache' in sys.argv)
    m = re.search(r'\n\s*I\.\s+I?[Nn]?\s*the first year of plenty', T)
    if not m:
        raise SystemExit('could not find the start of the translation body')
    app = T.find('APPENDIX', m.start())          # variant passages follow the text
    body = T[m.start():app if app > 0 else len(T)]

    starts, pos = [], 0
    for n in range(1, 30):
        tol = r'\s*'.join(re.escape(c) for c in numeral(n))
        mm = re.compile(r'\n\s*' + tol + r'\s*[.,]?\s+(?=[A-Z"\'‘“])').search(body, pos)
        starts.append(mm.start() if mm else None)
        if mm:
            pos = mm.end()
    if any(s is None for s in starts):
        raise SystemExit('missing chapters: %s' % [i + 1 for i, s in enumerate(starts) if s is None])

    # INTEGRITY CHECK. A header that is not recognised silently lets the footnote cut swallow a
    # page of body text — the single most damaging failure here, and it happened five times while
    # this was being written (bracket variants "[x", "pees", "Iv}", "11]", "xxI1|"). Headers carry
    # the printed page number, so the page span tells us how many there should be. Some numbers are
    # themselves illegible ("zs" for 73), so the test is on the COUNT, not on a perfect sequence.
    hdrs = HDR.findall(body)
    nums = sorted({int(m.group(1)) for m in
                   re.finditer(r'^\s*(\d+)\s+JOSEPH[.,]?\s+AND\s+ASENATH', body, re.M)})
    span = max(nums) - min(nums) + 1
    print(f'page headers matched: {len(hdrs)}; verso page numbers span pp. {min(nums)}-{max(nums)} '
          f'({span} pages)')
    if len(hdrs) < span - 2:
        raise SystemExit(f'only {len(hdrs)} headers for a {span}-page span — a header OCR variant '
                         f'is unrecognised and body text WILL be lost; fix HDR before trusting output')

    def trim_title(span):
        """Drop the NEXT chapter's section title, which the book prints just above its opener.

        It is its own short paragraph, so this is structural rather than a guess about prose:
        take the final blank-line-delimited block and drop it if it is short, ends in a full
        stop and carries no speech marks (chapter text almost always ends mid-dialogue here).

        A LONG title (ch 26's runs to 154 chars) needs a second discriminator, because merely
        raising the length cap swallows the real closing prose of chs 4, 5 and 14. The
        discriminator is title case: the book sets these titles with the substantive words
        capitalised, so a high proportion of capitals separates them cleanly from narrative
        (ch 26's title scores 0.33; the three prose tails score 0.00-0.13).
        """
        def title_case(t):
            words = re.findall(r"[A-Za-z][A-Za-z']*", t)
            if len(words) < 3:
                return False
            return sum(w[0].isupper() for w in words) / len(words) >= 0.25
        parts = re.split(r'\n\s*\n', span.rstrip())
        # up to two trailing blocks, because the title can sit above a footnote block
        for _ in range(2):
            if len(parts) < 2:
                break
            last = re.sub(r'\s+', ' ', parts[-1]).strip()
            cap = 260 if title_case(last) else 130
            if (0 < len(last) < cap and last.endswith('.')
                    and '"' not in last and '\u201d' not in last and '\u201c' not in last):
                parts = parts[:-1]
            else:
                break
        return '\n\n'.join(parts)

    chapters = {}
    for i, st in enumerate(starts):
        en = starts[i + 1] if i + 1 < len(starts) else len(body)
        chapters[i + 1] = clean(' '.join(strip_page(p) for p in HDR.split(trim_title(body[st:en]))))

    for n, rx in EXCISE.items():
        before = chapters[n]
        chapters[n] = re.sub(r'\s+', ' ', rx.sub(' ', before)).strip()
        if chapters[n] == before:
            raise SystemExit(f'excision for chapter {n} no longer matches — re-check the scan')

    leak = {n: SIGLA.findall(v)[:3] for n, v in chapters.items() if len(SIGLA.findall(v)) > 1}
    if leak:
        raise SystemExit(f'apparatus survived in {leak}')

    OUT.write_text(json.dumps(chapters, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(chapters)} chapters, {sum(len(v) for v in chapters.values())} chars -> {OUT}')
    print('apparatus residue: none')
    return 0


sys.exit(main())
