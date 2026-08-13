#!/usr/bin/env python3
"""Run the SP digitization over a whole book, page by page, with AUTO-SPANNING.

No page→passage table is needed: a cursor walks the book's MT word stream, and each
page's OCR is aligned semi-globally against a window ahead of the cursor — the best
alignment endpoint IS the page boundary, and the cursor advances there. Drift cannot
accumulate: every page re-anchors against the MT.

Output per page (.sp-flags/<osis>_p<page>.json):
  { page, leaf, osis, refFrom, refTo, matched, mtWords, ops, flags }
  ops    — the full aligned stream: ['=', word, ref] | ['sub', mt, ocr, ref]
           | ['mt', word, ref] | ['sp', ocr, ref]  (order = reading order)
  flags  — the non-'=' ops, for the review UI

Usage:  python3 scripts/sp-digitize/run_book.py Gen 1        # book, first von Gall page
        (stops when the book's MT stream is exhausted)
"""
import json
import re
import sys
import time
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import CACHE, HEB, OUT, REPO, fetch, ocr, orient, segment_main  # noqa: E402


def book_stream(osis: str):
    out = []
    ch = 1
    while True:
        f = REPO / 'public' / 'data' / 'mt' / f'{osis}_{ch}.json'
        if not f.exists():
            break
        data = json.loads(f.read_text())
        for verse in data['verses']:
            for w in verse['words']:
                cons = ''.join(HEB.findall(w['surface']))
                if cons:
                    out.append({'w': cons, 'ref': f"{ch}:{verse['verse']}"})
        ch += 1
    return out


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


def align_page(window: list[dict], sp: list[str], free_start: bool = False):
    """Semi-global NW: all of `sp` must be consumed, the window need not be — the best
    endpoint tells us how far into the MT this page reaches.

    free_start=True also leaves the window's START free (score[i][0] = 0), so the page
    finds its own position anywhere in the window. This is the rescue mode for the
    scan's displaced leaves: around von Gall pp. 103–107 the archive item's leaves are
    bound out of order (Gen 48 appears before Gen 47:9–31, Gen 49 after), so a page's
    content can sit hundreds of words ahead of — or behind — the cursor."""
    n, m = len(window), len(sp)
    GAP = 2
    score = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0] = 0 if free_start else i * GAP
    for j in range(1, m + 1):
        score[0][j] = j * GAP
    for i in range(1, n + 1):
        a = window[i - 1]['w']
        for j in range(1, m + 1):
            sub = dist(a, sp[j - 1])
            score[i][j] = min(score[i - 1][j - 1] + min(sub, 3),
                              score[i - 1][j] + GAP, score[i][j - 1] + GAP)
    end = min(range(n + 1), key=lambda i: score[i][m])
    ops = []
    i, j = end, m
    while j > 0 or (not free_start and i > 0):
        a = window[i - 1]['w'] if i else ''
        b = sp[j - 1] if j else ''
        if i and j and score[i][j] == score[i - 1][j - 1] + min(dist(a, b), 3):
            ops.append(['=' if a == b else 'sub', a, b, window[i - 1]['ref']] if a != b
                       else ['=', a, window[i - 1]['ref']])
            i, j = i - 1, j - 1
        elif i and (not free_start or j) and score[i][j] == score[i - 1][j] + GAP:
            ops.append(['mt', a, window[i - 1]['ref']])
            i -= 1
        elif j:
            near = window[min(i, n) - 1]['ref'] if n and i else window[0]['ref']
            ops.append(['sp', b, near])
            j -= 1
        else:
            break
    ops.reverse()
    matched = sum(1 for o in ops if o[0] == '=')
    return i, end, matched, ops


def main():
    osis, start_page = sys.argv[1], int(sys.argv[2])
    mt = book_stream(osis)
    print(f'{osis}: {len(mt)} MT words in stream', flush=True)
    OUT.mkdir(exist_ok=True)
    # RESUME: pick up after the last completed page. Newer files carry 'cursorAfter'
    # (absolute — survives the displaced-leaf jumps); older ones only 'mtWords'.
    done = sorted(OUT.glob(f'{osis}_p*.json'))
    cursor = 0
    page = start_page
    if done:
        last = json.loads(done[-1].read_text())
        if 'cursorAfter' in last:
            cursor = last['cursorAfter']
        else:
            for f in done:
                cursor += json.loads(f.read_text())['mtWords']
        page = int(done[-1].stem.split('_p')[1]) + 1
        print(f'resuming at p.{page}, cursor {cursor}', flush=True)
    while cursor < len(mt) and page < start_page + 160:
        t0 = time.time()
        try:
            img = Image.open(fetch(page))
        except Exception as e:
            print(f'p.{page}: fetch failed ({e}) — stopping', flush=True)
            break
        img = orient(img)
        sp = ocr(segment_main(img))
        if len(sp) < 40:
            print(f'p.{page}: only {len(sp)} OCR words — skipping (plate/blank?)', flush=True)
            page += 1
            continue
        window = mt[cursor: cursor + int(len(sp) * 1.4) + 40]
        _, consumed, matched, ops = align_page(window, sp)
        off = cursor
        note = ''
        # Orientation self-check: a flipped page aligns terribly.
        if matched < len(sp) * 0.3:
            sp2 = ocr(segment_main(img.rotate(180, expand=True)))
            if len(sp2) >= 40:
                w2 = mt[cursor: cursor + int(len(sp2) * 1.4) + 40]
                _, c2, m2, o2 = align_page(w2, sp2)
                if m2 > matched:
                    sp, consumed, matched, ops = sp2, c2, m2, o2
        # Displaced-leaf rescue: if the anchored window still fails, let the page find
        # its own position in a wide free-start window around the cursor (the scan
        # binds some leaves out of order — Gen 48 before 47:9–31, Gen 49 after).
        if matched < len(sp) * 0.3:
            lo = max(0, cursor - 900)
            wide = mt[lo: cursor + 1300]
            s2, e2, m2, o2 = align_page(wide, sp, free_start=True)
            if m2 > matched and m2 >= len(sp) * 0.3:
                consumed, matched, ops = e2, m2, o2
                off = lo
                window = wide[s2:]
                note = f'  RELOCATED (starts {lo + s2 - cursor:+d} words from cursor)'
                consumed = e2  # absolute end within `wide`
        if matched < len(sp) * 0.3:
            # Not locatable even in the wide window — record nothing, hold the cursor.
            print(f'p.{page}: UNLOCATED (ocr {len(sp)}, best match {matched}) — skipped, '
                  f'cursor held  [{time.time() - t0:.0f}s]', flush=True)
            page += 1
            time.sleep(1)
            continue
        # A backward-relocated page (displaced leaf) must not drag the cursor back:
        # the high-water mark is what the NEXT page anchors against and what resume reads.
        cursor_after = max(cursor, off + consumed)
        flags = [o for o in ops if o[0] != '=']
        eq = [o for o in ops if o[0] == '=']
        ref_from = (eq[0][-1] if eq else ops[0][-1]) if ops else '?'
        ref_to = (eq[-1][-1] if eq else ops[-1][-1]) if ops else '?'
        dest = OUT / f'{osis}_p{page:03d}.json'
        dest.write_text(json.dumps(
            {'page': page, 'leaf': 551 - page, 'osis': osis,
             'refFrom': ref_from, 'refTo': ref_to,
             'mtWords': max(0, cursor_after - cursor), 'ocrWords': len(sp),
             'matched': matched, 'cursorAfter': cursor_after,
             'ops': ops, 'flags': flags}, ensure_ascii=False))
        print(f'p.{page}: {osis} {ref_from}–{ref_to}  ocr {len(sp)}  matched {matched} '
              f'({matched / max(1, len(sp)):.0%})  flags {len(flags)}{note}  '
              f'[{time.time() - t0:.0f}s]', flush=True)
        cursor = max(cursor, cursor_after)
        page += 1
        time.sleep(1)   # politeness to archive.org
    print(f'done: cursor {cursor}/{len(mt)} at p.{page - 1}', flush=True)


if __name__ == '__main__':
    main()
