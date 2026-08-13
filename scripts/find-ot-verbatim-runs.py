#!/usr/bin/env python3
"""Find long verbatim runs shared between different Old Testament books.

The curated intertext table (add-ot-intertexts.py) covers the cases every reference work
names. This finds the rest mechanically: strings of consecutive words that occur, letter for
letter, in two different books. A run of six or seven identical words across books is not
coincidence — it is a quotation, a shared oracle, or a formula.

Method: consonantal text only (vowel points are the Masoretes' reading tradition, not the
shared wording), a rolling hash over every window of N words, then grouping by hash.

WHAT IT DELIBERATELY DOES NOT DO — decide. Length alone cannot tell a quotation from a stock
liturgical phrase ("give thanks to the LORD for he is good") or a legal formula repeated
across Leviticus and Deuteronomy. So this writes a REVIEW LIST, ranked by how unlikely the
run is, for a human to accept or reject. Nothing reaches the app from here directly.

    python3 scripts/find-ot-verbatim-runs.py            # default: runs of 7+ words
    python3 scripts/find-ot-verbatim-runs.py --min 6 --top 200

Writes .ot-runs/review.json and prints the top candidates.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MT = REPO / 'public' / 'data' / 'mt'
XREFS = REPO / 'public' / 'data' / 'backgrounds-crossrefs.json'
OUT = REPO / '.ot-runs'

HEB = re.compile(r'[א-ת]+')
BOOK_ORDER = ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam',
              '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov',
              'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos',
              'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal']
NAME = {'Gen': 'Genesis', 'Exod': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers',
        'Deut': 'Deuteronomy', 'Josh': 'Joshua', 'Judg': 'Judges', 'Ruth': 'Ruth',
        '1Sam': '1 Samuel', '2Sam': '2 Samuel', '1Kgs': '1 Kings', '2Kgs': '2 Kings',
        '1Chr': '1 Chronicles', '2Chr': '2 Chronicles', 'Ezra': 'Ezra', 'Neh': 'Nehemiah',
        'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psalm', 'Prov': 'Proverbs',
        'Eccl': 'Ecclesiastes', 'Song': 'Song of Songs', 'Isa': 'Isaiah', 'Jer': 'Jeremiah',
        'Lam': 'Lamentations', 'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea',
        'Joel': 'Joel', 'Amos': 'Amos', 'Obad': 'Obadiah', 'Jonah': 'Jonah', 'Mic': 'Micah',
        'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zeph': 'Zephaniah', 'Hag': 'Haggai',
        'Zech': 'Zechariah', 'Mal': 'Malachi'}

# The books whose overlap is already known and catalogued — a Samuel ‖ Chronicles run is a
# true positive that tells the reviewer nothing, and there are thousands of them.
KNOWN_PAIRS = {
    frozenset(('2Sam', '1Chr')), frozenset(('1Sam', '1Chr')),
    frozenset(('1Kgs', '2Chr')), frozenset(('2Kgs', '2Chr')),
    frozenset(('2Kgs', 'Isa')), frozenset(('2Kgs', 'Jer')),
    frozenset(('Ezra', 'Neh')),
}


def load():
    """Every word of the MT as (osis, chapter, verse, consonants), Aramaic excluded."""
    words = []
    for osis in BOOK_ORDER:
        ch = 1
        while True:
            f = MT / f'{osis}_{ch}.json'
            if not f.exists():
                break
            for v in json.loads(f.read_text())['verses']:
                for w in v['words']:
                    if w.get('lang') == 'A':
                        continue
                    cons = ''.join(HEB.findall(w.get('surface', '')))
                    if cons:
                        words.append((osis, ch, v['verse'], cons))
            ch += 1
    return words


def main():
    args = sys.argv[1:]
    n = int(args[args.index('--min') + 1]) if '--min' in args else 7
    top = int(args[args.index('--top') + 1]) if '--top' in args else 120

    words = load()
    print(f'{len(words):,} Hebrew words')

    # Word frequencies, so a run of common words can be scored lower than a rare one.
    freq = Counter(w[3] for w in words)
    total = len(words)

    windows = defaultdict(list)
    for i in range(len(words) - n + 1):
        span = words[i:i + n]
        if span[0][0] != span[-1][0]:          # never straddle a book boundary
            continue
        key = ' '.join(w[3] for w in span)
        windows[key].append(i)

    seen_pairs = set()
    cands = []
    for key, positions in windows.items():
        if len(positions) < 2:
            continue
        by_book = defaultdict(list)
        for i in positions:
            by_book[words[i][0]].append(i)
        if len(by_book) < 2:
            continue                            # repetition inside one book is not intertext
        books = sorted(by_book)
        for a in range(len(books)):
            for b in range(a + 1, len(books)):
                pair = frozenset((books[a], books[b]))
                if pair in KNOWN_PAIRS:
                    continue
                ia, ib = by_book[books[a]][0], by_book[books[b]][0]
                ra = (words[ia][0], words[ia][1], words[ia][2])
                rb = (words[ib][0], words[ib][1], words[ib][2])
                sig = (ra, rb)
                if sig in seen_pairs:
                    continue
                seen_pairs.add(sig)
                # Score: how surprising is this run? Sum of -log(frequency) over its words,
                # so seven rare words beat seven of the commonest words in the language.
                import math
                score = sum(math.log(total / max(1, freq[w])) for w in key.split())
                cands.append({
                    'score': round(score, 1),
                    'words': n,
                    'a': f'{NAME[ra[0]]} {ra[1]}:{ra[2]}', 'aOsis': ra[0], 'aCh': ra[1], 'aV': ra[2],
                    'b': f'{NAME[rb[0]]} {rb[1]}:{rb[2]}', 'bOsis': rb[0], 'bCh': rb[1], 'bV': rb[2],
                    'text': key,
                })

    cands.sort(key=lambda c: -c['score'])
    OUT.mkdir(exist_ok=True)
    (OUT / 'review.json').write_text(json.dumps(cands, ensure_ascii=False, indent=1))

    # Which of these does the apparatus already know about?
    xr = json.loads(XREFS.read_text())
    known = set()
    for e in xr['entries']:
        for c in e['citations']:
            r = c.get('ref')
            if r:
                known.add((e['book'], r['book']))
    fresh = [c for c in cands if (c['aOsis'], c['bOsis']) not in known and (c['bOsis'], c['aOsis']) not in known]

    print(f'{len(cands)} cross-book runs of {n}+ words · {len(fresh)} between book-pairs the '
          f'apparatus does not already link')
    print(f'→ {(OUT / "review.json").relative_to(REPO)}\n')
    for c in cands[:top]:
        flag = '' if (c['aOsis'], c['bOsis']) in known or (c['bOsis'], c['aOsis']) in known else '  ★ new pair'
        print(f'  {c["score"]:6.1f}  {c["a"]:22s} ‖ {c["b"]:22s} {c["text"][:46]}{flag}')


if __name__ == '__main__':
    main()
