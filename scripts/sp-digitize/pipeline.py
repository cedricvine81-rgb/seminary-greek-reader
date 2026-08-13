#!/usr/bin/env python3
"""Samaritan Pentateuch digitization pipeline — von Gall (1918) → verse-keyed flags.

Clean-room by construction: the ONLY text source is the public-domain von Gall page
images on archive.org (item derhebraischepentateuchchecked, von Gall page = 551 − leaf).
No third-party digitization is consulted at any stage.

Per page:
  1. fetch    — the _large.jpg leaf (~2300×3400), cached under .sp-pages/
  2. orient   — Tesseract OSD; the scans are mostly (not all) upside-down
  3. segment  — cut the MAIN TEXT off the apparatus bands by horizontal-projection
                analysis: the first sustained whitespace band below the text block
  4. ocr      — Tesseract heb; von Gall's SP text is unpointed, which suits it
  5. align    — Needleman-Wunsch, page word-stream vs the WLC consonantal stream for
                the page's span. Words that MATCH the MT are accepted silently — the
                alignment IS their proofread. Words that differ become FLAGS: each is
                either a real SP variant or an OCR error, and a human settles which
                from the page image. Nothing else ever needs eyes.

Output per page: JSON { page, leaf, span, flags: [{kind, mt, ocr, ref}] } to be fed to
the review UI. Run book by book; Genesis first.

STATUS (2026-08-13): proven end-to-end on von Gall p. 2 (Gen 1:21-2:7): 91% of MT words
matched exactly, and the flag list independently rediscovered the hand-verified Gen 2:2
reading (MT השביעי / SP הששי) plus genuine SP plene spellings (התנינים, למיניהם, וכבשוה)
and the וחית הארץ normalization. KNOWN OPEN KNOB: segment_main still lets the apparatus
through on this page (~170 spurious sp-only flags/page); tune the gap detection against
saved crops (save main_zone to .sp-pages/_crop.png and look) before a full-book run.
Tesseract's ג↔נ confusion in this typeface is the commonest OCR error to expect in review.

Usage:
  python3 scripts/sp-digitize/pipeline.py <vonGallPage> <osis> <chapter:verse-chapter:verse>
  e.g.  python3 scripts/sp-digitize/pipeline.py 2 Gen 1:21-2:7
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageOps

REPO = Path(__file__).resolve().parent.parent.parent
CACHE = REPO / '.sp-pages'
OUT = REPO / '.sp-flags'
ITEM = 'derhebraischepentateuchchecked'
HEB = re.compile(r'[א-ת]+')


def fetch(page: int) -> Path:
    leaf = 551 - page
    CACHE.mkdir(exist_ok=True)
    f = CACHE / f'vg{page:03d}_n{leaf}.jpg'
    if not f.exists():
        url = f'https://archive.org/download/{ITEM}/page/n{leaf}_large.jpg'
        env = {**os.environ, 'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
        subprocess.run(['curl', '-sL', '-o', str(f), url], env=env, check=True)
    return f


def orient(img: Image.Image) -> Image.Image:
    """Tesseract OSD decides whether the leaf is upside-down (most are)."""
    tmp = CACHE / '_osd.png'
    img.save(tmp)
    r = subprocess.run(['tesseract', str(tmp), '-', '--psm', '0'],
                       capture_output=True, text=True)
    m = re.search(r'Rotate: (\d+)', r.stdout + r.stderr)
    rot = int(m.group(1)) if m else 0
    return img.rotate(-rot, expand=True) if rot else img


def segment_main(img: Image.Image) -> Image.Image:
    """Crop the main SP text: from the top margin down to the first sustained
    whitespace band (the gap before the apparatus registers)."""
    g = ImageOps.grayscale(img)
    w, h = g.size
    px = g.load()
    # Ink per row, coarse (sample every 3rd pixel).
    rows = []
    for y in range(0, h, 2):
        ink = sum(1 for x in range(0, w, 3) if px[x, y] < 128)
        rows.append((y, ink))
    thresh = max(i for _, i in rows) * 0.04
    # Find where text starts, then cut at the LARGEST whitespace band in the upper 65% of
    # the page — that band is the gulf between the main text and the apparatus registers
    # (taking the FIRST band over-triggers on ordinary line spacing, or never fires).
    started = False
    text_top = 0
    gaps = []   # (size, startY)
    blank_run = 0
    for y, ink in rows:
        if not started:
            if ink > thresh:
                started = True
                text_top = y
            continue
        if y > h * 0.65:
            break
        if ink <= thresh:
            blank_run += 2
        else:
            if blank_run:
                gaps.append((blank_run, y - blank_run))
            blank_run = 0
    # The largest gap overall is usually the running-head → body gap (~9% down the page);
    # the main-text → apparatus gulf is the largest gap BELOW the header zone. Restricting
    # to 15%–65% picks it reliably (measured on p. 2: header gap 64px @9%, boundary 54px
    # @47%, inter-register gaps ≤ 52px below that).
    candidates = [(sz, y) for sz, y in gaps if h * 0.15 < y < h * 0.65]
    cut = max(candidates)[1] if candidates else h
    return img.crop((0, max(0, text_top - 20), w, min(h, cut + 6)))


def ocr(img: Image.Image) -> list[str]:
    tmp = CACHE / '_main.png'
    img.save(tmp)
    r = subprocess.run(['tesseract', str(tmp), '-', '-l', 'heb', '--psm', '6'],
                       capture_output=True, text=True)
    words = []
    for tok in r.stdout.split():
        # Keep consonantal runs only; drop verse numbers, punctuation, OCR debris.
        for m in HEB.finditer(tok):
            words.append(m.group(0))
    return words


def mt_words(osis: str, span: str) -> list[dict]:
    """The WLC consonantal stream for the span, with refs — from the app's own corpus."""
    m = re.match(r'(\d+):(\d+)-(\d+):(\d+)$', span)
    c1, v1, c2, v2 = (int(x) for x in m.groups())
    out = []
    for ch in range(c1, c2 + 1):
        data = json.loads((REPO / 'public' / 'data' / 'mt' / f'{osis}_{ch}.json').read_text())
        for verse in data['verses']:
            v = verse['verse']
            if (ch == c1 and v < v1) or (ch == c2 and v > v2):
                continue
            for w in verse['words']:
                cons = ''.join(HEB.findall(w['surface']))
                # A maqqef-joined MT word is one token; the SP prints its parts spaced as
                # often as not, so split for alignment granularity.
                parts = cons and [cons] or []
                for p in parts:
                    out.append({'w': p, 'ref': f'{osis} {ch}:{v}'})
    return out


def align(mt: list[dict], sp: list[str]):
    """Needleman-Wunsch; match = exact consonantal equality, near = small edit distance."""
    def dist(a: str, b: str) -> int:
        if a == b:
            return 0
        la, lb = len(a), len(b)
        d = list(range(lb + 1))
        for i in range(1, la + 1):
            prev, d[0] = d[0], i
            for j in range(1, lb + 1):
                prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
        return d[lb]

    n, m2 = len(mt), len(sp)
    GAP = 2
    score = [[0] * (m2 + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0] = i * GAP
    for j in range(1, m2 + 1):
        score[0][j] = j * GAP
    for i in range(1, n + 1):
        a = mt[i - 1]['w']
        for j in range(1, m2 + 1):
            sub = dist(a, sp[j - 1])
            score[i][j] = min(score[i - 1][j - 1] + min(sub, 3),
                              score[i - 1][j] + GAP, score[i][j - 1] + GAP)
    # traceback
    flags = []
    matched = 0
    i, j = n, m2
    while i > 0 or j > 0:
        a = mt[i - 1]['w'] if i else ''
        b = sp[j - 1] if j else ''
        if i and j and score[i][j] == score[i - 1][j - 1] + min(dist(a, b), 3):
            if a == b:
                matched += 1
            else:
                flags.append({'kind': 'differs', 'mt': a, 'ocr': b, 'ref': mt[i - 1]['ref']})
            i, j = i - 1, j - 1
        elif i and score[i][j] == score[i - 1][j] + GAP:
            flags.append({'kind': 'mt-only', 'mt': a, 'ocr': '', 'ref': mt[i - 1]['ref']})
            i -= 1
        else:
            near = mt[min(i, n - 1)]['ref'] if n else '?'
            flags.append({'kind': 'sp-only', 'mt': '', 'ocr': b, 'ref': near})
            j -= 1
    flags.reverse()
    return matched, flags


def main():
    page, osis, span = int(sys.argv[1]), sys.argv[2], sys.argv[3]
    img = Image.open(fetch(page))
    img = orient(img)
    main_zone = segment_main(img)
    sp = ocr(main_zone)
    mt = mt_words(osis, span)
    matched, flags = align(mt, sp)
    # OSD misjudges some Hebrew leaves. If almost nothing matched, the page was probably
    # upside-down after all — retry rotated and keep whichever run aligns better.
    if matched < len(mt) * 0.35:
        alt = segment_main(img.rotate(180, expand=True))
        sp2 = ocr(alt)
        m2, f2 = align(mt, sp2)
        if m2 > matched:
            sp, matched, flags = sp2, m2, f2
    OUT.mkdir(exist_ok=True)
    dest = OUT / f'{osis}_p{page:03d}.json'
    dest.write_text(json.dumps(
        {'page': page, 'leaf': 551 - page, 'osis': osis, 'span': span,
         'mtWords': len(mt), 'ocrWords': len(sp), 'matched': matched, 'flags': flags},
        ensure_ascii=False, indent=1))
    print(f'p.{page}: MT {len(mt)} words, OCR {len(sp)}, matched {matched} '
          f'({matched / max(1, len(mt)):.0%}), flags {len(flags)} → {dest.name}')
    for f in flags[:14]:
        print(f'  {f["ref"]:12s} {f["kind"]:8s} MT:{f["mt"] or "—":12s} OCR:{f["ocr"] or "—"}')


if __name__ == '__main__':
    main()
