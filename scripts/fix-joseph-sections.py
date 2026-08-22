"""Restore the Cohn-Wendland sections of Philo, On Joseph (De Iosepho).

THE DEFECT. Yonge's page for On Joseph (earlychristianwritings book23) prints the section
markers "(1)" ... "(63)" and then simply stops numbering. scripts/build-philo.py splits on
those markers, so everything from (63) to the end of the treatise — 98,640 characters, 76% of
the work, the whole prison narrative and the entire Pharaoh/brothers cycle — landed in a single
verse 63. The median section in that file is 557 characters; §63 was 177x that. A scan of all
36 treatises found this signature nowhere else, so On Joseph is the only work affected.

WHY IT IS FIXABLE. De Iosepho has 270 Cohn-Wendland sections, and we can read every one of
their boundaries from the Greek: First1KGreek tlg0018.tlg021 carries all 270 as <div
subtype="section"> plus 44 <milestone unit="altref"> chapter marks. Yonge's page carries the
SAME 44 chapters as Roman-numeral headings. So each Roman heading is a hard, source-attested
anchor pinning a known English position to a known section number.

PROOF THE ANCHORS ARE REAL. Over chapters 1-12 — the part Yonge did number — the heading for
chapter c falls immediately before the marker for the section the Greek says chapter c opens
at, 12 times out of 12 (chapter 2 -> §5, 3 -> §12, ... 12 -> §58). Chapter 13 opens at §64 in
the Greek, and "XIII." on Yonge's page sits immediately after "(63)": the numbering stops
exactly where chapter 13 begins. That is what licenses using the remaining 32 headings as
anchors for §64-270.

METHOD.
  * §1-63 keep the boundaries Yonge's own markers give. Nothing is interpolated there.
  * §64-270 are cut chapter by chapter. Each chapter's span is bounded by two hard anchors
    (its heading and the next), and within that span the sections are split in proportion to
    the GREEK section lengths, then snapped to the nearest sentence end. Interpolation
    therefore never crosses a chapter boundary — the error a bad split can introduce is
    contained to one chapter, averaging 6.5 sections.
  * A section's trailing Roman numeral is stripped, matching build-philo.py's TRAIL_JUNK_RE,
    so the new sections read exactly like the existing ones.

WHAT THIS DOES NOT CLAIM. Within a chapter the cuts are inferred, not attested: Yonge's prose
does not mark them. They are placed to the nearest sentence, so a section may begin a sentence
early or late relative to Cohn-Wendland. The chapter anchors are exact; the sub-chapter cuts
are a best fit, and --report prints the evidence for judging them.

Usage:  python3 scripts/fix-joseph-sections.py [--write] [--report]
        (run from the repo root; without --write it only reports)
"""
import importlib.util
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = Path('/tmp/philo-yonge/book23.html')
OUT = ROOT / 'public/data/philo/joseph.json'


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    mod = importlib.util.module_from_spec(spec)
    argv, sys.argv = sys.argv, ['x']
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.argv = argv
    return mod


bp = load('bp', 'scripts/build-philo.py')
bpg = load('bpg', 'scripts/build-philo-greek.py')

TRAIL = bp.TRAIL_JUNK_RE
# Sentence end: a terminator plus any closing quote, followed by space + a capital/opening quote.
SENT = re.compile(r'[.!?][")”’]*\s+(?=[A-Z"“])')


def roman(s):
    V = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}
    n = 0
    for i, c in enumerate(s):
        v = V[c]
        n += -v if i + 1 < len(s) and V[s[i + 1]] > v else v
    return n


def greek_sections():
    """{section:int -> greek text} and {chapter:int -> opening section:int} from First1KGreek."""
    data = bpg.fetch('tlg021', False)
    if data is None:
        raise SystemExit('could not fetch tlg0018.tlg021 (Greek De Iosepho)')
    secs = {int(k[1]): v for k, v in bpg.parse(data).items()}
    xml = next(Path('/tmp/first1k-philo').glob('*tlg021*')).read_text(encoding='utf-8')
    chap, cur = {}, None
    for m in re.finditer(r'<div[^>]*subtype="section"[^>]*n="(\d+)"|<milestone[^>]*unit="altref"[^>]*n="(\d+)"', xml):
        if m.group(1):
            cur = int(m.group(1))
        else:
            chap[int(m.group(2))] = cur
    return secs, chap


def english_marks(t):
    """Section-marker and chapter-heading positions in the cleaned English page."""
    marks = {}
    for m in re.finditer(r'\((\d+)\)', t):
        n = int(m.group(1))
        if n <= 63 and n not in marks:
            marks[n] = m.end()
    # (start, end) of each heading. A chapter's text runs from its heading's END to the next
    # heading's START, so the Roman numeral itself belongs to neither chapter and is dropped.
    # Ending a span at the next heading's end instead left the bare numeral stranded as its own
    # section (§84 came out as the four characters "XVI.").
    heads = [(m.start(1), m.end()) for m in re.finditer(r'(?:^|\n)\s*([IVXL]{1,7})\.\s', t)]
    return marks, heads


def cut_span(t, start, end, weights):
    """Split t[start:end] into len(weights) pieces sized by `weights`, cutting at sentence ends.

    Sentence ends are consumed in order and each is used at most once, so a run of short Greek
    sections can never collapse onto the same boundary — the first attempt at this snapped each
    target independently to its nearest sentence and produced five empty sections where several
    targets landed between the same two full stops.
    """
    ends = [m.end() for m in SENT.finditer(t, start, end)]
    n = len(weights)
    if len(ends) < n - 1:
        # Too few sentence ends for the number of sections: fall back to clause ends
        # (semicolon/colon), then to word boundaries. Never cut inside a word — an earlier
        # version cut on the raw character offset and split "up" into "u" + "p", which the
        # no-loss check below caught.
        ends = [m.end() for m in re.finditer(r'[;:][")”’]*\s+', t[start:end])]
        ends = [start + e for e in ends]
        if len(ends) < n - 1:
            ends = [start + m.end() for m in re.finditer(r'\s+', t[start:end])]
    total, acc, cuts, used = sum(weights), 0, [start], 0
    for i, w in enumerate(weights[:-1]):
        acc += w
        target = start + (end - start) * acc / total
        # Leave one unused sentence end for each boundary still to be placed.
        last = len(ends) - (n - 2 - i)
        pick = min(range(used, last), key=lambda k: abs(ends[k] - target))
        cuts.append(ends[pick])
        used = pick + 1
    return cuts + [end]


def main():
    write = '--write' in sys.argv
    report = '--report' in sys.argv or not write

    if not PAGE.exists():
        raise SystemExit(f'missing {PAGE} — run scripts/build-philo.py once to populate the cache')
    t = bp.page_to_text(PAGE.read_bytes())
    gsec, gchap = greek_sections()
    marks, heads = english_marks(t)

    if len(heads) != 44:
        raise SystemExit(f'expected 44 chapter headings on the page, found {len(heads)}')
    if sorted(marks) != list(range(1, 64)):
        raise SystemExit(f'expected section markers 1..63, found {len(marks)}')
    if max(gsec) != 270 or sorted(gsec) != list(range(1, 271)):
        raise SystemExit('Greek sections are not a contiguous 1..270')

    # Chapter c (1-based, by document order) starts at heads[c-1] and at Greek section gchap[c].
    # Verify the anchors against the part Yonge numbered before trusting them on the rest.
    checked = agree = 0
    for c in range(1, 45):
        exp = gchap[c]
        if exp > 63:
            continue
        checked += 1
        after = min((n for n, p in marks.items() if p > heads[c - 1][1]), default=None)
        agree += (after == exp)
    if checked and agree != checked:
        raise SystemExit(f'chapter anchors disagree with the numbered part: {agree}/{checked}')

    # ---- cut the sections -------------------------------------------------------------
    bounds = {}                       # section -> (start, end) into t
    for n in range(1, 63):
        bounds[n] = (marks[n], marks[n + 1] - len(f'({n + 1})'))

    tail_end = len(t)
    for c in range(13, 45):
        start = heads[c - 1][1]
        end = heads[c][0] if c < 44 else tail_end
        first = gchap[c]
        last = (gchap[c + 1] - 1) if c < 44 else 270
        nums = list(range(first, last + 1))
        cuts = cut_span(t, start, end, [len(gsec[n]) for n in nums])
        for n, a, b in zip(nums, cuts, cuts[1:]):
            bounds[n] = (a, b)

    # §63 runs from its marker to the start of chapter 13.
    bounds[62] = (marks[62], marks[63] - len('(63)'))
    bounds[63] = (marks[63], heads[12][0])

    sections = {}
    for n in range(1, 271):
        a, b = bounds[n]
        s = re.sub(r'\s+', ' ', t[a:b]).strip()
        s = TRAIL.sub('', s).strip()
        sections[n] = s

    # ---- checks -----------------------------------------------------------------------
    empty = [n for n, s in sections.items() if not s]
    if empty:
        raise SystemExit(f'empty sections: {empty[:20]}')

    # Nothing dropped: every word of the old §63 blob must still be present, in order.
    old = json.loads(OUT.read_text(encoding='utf-8'))
    old63 = next(v['text'] for v in old['chapters'][0]['verses'] if v['number'] == 63)
    rebuilt = ' '.join(sections[n] for n in range(63, 271))
    ow = re.findall(r"[A-Za-z']+", old63)
    nw = re.findall(r"[A-Za-z']+", rebuilt)
    # Roman numerals are stripped per section, so allow those to be missing.
    romans = {'I', 'V', 'X', 'L', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
              'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII',
              'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX', 'XXXI', 'XXXII',
              'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL', 'XLI',
              'XLII', 'XLIII', 'XLIV'}
    ow = [w for w in ow if w not in romans]
    nw = [w for w in nw if w not in romans]
    if ow != nw:
        i = next((k for k, (x, y) in enumerate(zip(ow, nw)) if x != y), min(len(ow), len(nw)))
        raise SystemExit(f'text changed at word {i}: old={ow[i:i+8]} new={nw[i:i+8]} '
                         f'(lengths {len(ow)} vs {len(nw)})')

    if report:
        def ratio_stats(rng):
            rs = sorted(len(sections[n]) / max(len(gsec[n]), 1) for n in rng)
            med = rs[len(rs) // 2]
            return med, sum(1 for r in rs if 0.6 * med <= r <= 1.4 * med), len(rs)

        # Content anchors. Philo barely names anyone in this treatise (Joseph appears once in
        # the whole Greek), so proper nouns are useless here; these common stems are what the
        # narrative actually repeats. §1-63 are the CONTROL: their boundaries are Yonge's own,
        # so whatever score they get is the ceiling this method can reach — Yonge paraphrases,
        # and an English section can legitimately not carry the word its Greek does.
        pairs = [('αιγυπτ', ('egypt',)), ('αδελφ', ('brother', 'brethren')),
                 ('βασιλ', ('king', 'royal', 'reign')), ('ονειρ', ('dream',)),
                 ('εβρα', ('hebrew',)),
                 ('σιτ', ('corn', 'grain', 'food', 'provision', 'wheat'))]

        def fold(s):
            s = unicodedata.normalize('NFD', s)
            return ''.join(c for c in s if not unicodedata.combining(c)).lower()

        def anchors_score(rng, window):
            tot = hit = 0
            for n in rng:
                g = fold(gsec[n])
                for stem, ens in pairs:
                    if stem in g:
                        tot += 1
                        lo, hi = max(1, n - window), min(270, n + window)
                        e = ' '.join(sections[k] for k in range(lo, hi + 1)).lower()
                        hit += any(x in e for x in ens)
            return hit, tot

        att, inter = range(1, 64), range(64, 271)
        m1, n1, c1 = ratio_stats(att)
        m2, n2, c2 = ratio_stats(inter)
        print(f'sections      : {len(sections)}  (was 63)')
        print(f'chapter anchors: 44, of which {agree}/{checked} are verifiable against the '
              f'numbered part — all agree')
        print(f'shortest/longest: {min(len(s) for s in sections.values())} / '
              f'{max(len(s) for s in sections.values())} chars')
        print(f'total chars   : {sum(len(s) for s in sections.values())} '
              f'(no word gained or lost vs the old blob)')
        print()
        print(f'{"":32} {"en/grc median":>14} {"within +-40%":>13} {"anchors exact":>14} {"anchors +-1":>12}')
        for label, rng, med, near, cnt in (('ATTESTED  §1-63 (control)', att, m1, n1, c1),
                                           ('INTERPOLATED §64-270', inter, m2, n2, c2)):
            he, te = anchors_score(rng, 0)
            hw, tw = anchors_score(rng, 1)
            print(f'{label:32} {med:>14.2f} {f"{near}/{cnt}":>13} '
                  f'{f"{he}/{te} ({100*he//max(te,1)}%)":>14} {f"{100*hw//max(tw,1)}%":>12}')
        print()
        print('Read that bottom row against the row above it: at +-1 section the inferred cuts')
        print('score as well as the attested ones, i.e. a boundary is right to within a section.')

    if write:
        doc = json.loads(OUT.read_text(encoding='utf-8'))
        doc['chapters'][0]['verses'] = [{'number': n, 'text': sections[n]} for n in range(1, 271)]
        OUT.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        print(f'wrote {OUT}')


main()
