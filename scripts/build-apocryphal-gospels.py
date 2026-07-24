"""Build three apocryphal gospels for the Texts library, English-only.

No clean, freely-licensed, accented Greek exists for these (the Gospel of Peter survives only
as Swete's unaccented Beta Code, the Protevangelium as no-derivatives OCR, Thecla as papyrus
fragments), so they are embedded as M. R. James's public-domain translation ("The Apocryphal
New Testament", Oxford: Clarendon, 1924), from earlychristianwritings.com — the same source
and prose model as the Odes of Solomon and Ascension of Isaiah.

James interleaves chapter (Roman) and verse (arabic) numbers, often mid-sentence
("crucified the 11 Lord"). Verses are split on the SEQUENTIAL expected number, so an arabic
numeral is treated as a verse marker only when it is the next one due — ordinary numbers in
the prose ("twelve tribes") never trigger a split.

  · Protevangelium of James — chapters I–XXV, arabic verses restarting each chapter.
  · Gospel of Peter (Akhmim) — Robinson's Roman chapters; Harnack's verse numbers run
    continuously 1–60 (they do not restart), which is how the work is usually cited.
  · Acts of Paul and Thecla — the self-contained Thecla episode, verses 1–43 (one chapter).

Usage:  python3 scripts/build-apocryphal-gospels.py [--no-cache]   (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

ECW = 'https://www.earlychristianwritings.com/text/'
CACHE = Path('/tmp/apocrypha-cache')
OUT = Path('public/data/apocrypha-gospels')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

ATTRIBUTION = ('Text: M. R. James, “The Apocryphal New Testament” (Oxford: Clarendon Press, '
               '1924), public domain. Source: earlychristianwritings.com.')

def roman(n):
    vals = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'),
            (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    out = ''
    for v, s in vals:
        while n >= v:
            out += s
            n -= v
    return out


# The OCR sometimes reads "XI" as "XL" (I→L) and drops periods; a chapter's opening marker is
# therefore matched only when it is the NEXT expected numeral (so English "I will …" or a stray
# number in the prose can never be mistaken for a chapter). Per-numeral OCR variants:
def chapter_marker(n):
    forms = {roman(n)}
    forms.add(roman(n).replace('XI', 'XL'))     # OCR I→L in "XI…"
    alt = '|'.join(sorted(forms, key=len, reverse=True))
    return re.compile(rf'^(?:{alt})\.?\s+(.*)$')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(slug, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / f'{slug}.html'
    if cached.exists() and not no_cache:
        return cached.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(ECW + slug + '.html', headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
    cached.write_bytes(data)
    return data.decode('utf-8', 'replace')


# The ECW page footer (site navigation + a list of other writings) follows the text and would
# otherwise bleed into the last verse — cut the paragraph stream at its first marker.
_FOOTER = re.compile(r'^(Go to the Chronological List|Please buy the CD|Early Christian Writings '
                     r'is copyright|Kirby, Peter)', re.I)


def paragraphs(html):
    out = []
    for m in re.finditer(r'<P[^>]*>(.*?)(?=<P|<HR|</BODY|</BLOCKQUOTE)', html, re.S | re.I):
        p = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.group(1))).strip()
        if not p:
            continue
        if _FOOTER.match(p):
            break
        out.append(p)
    return out




def strip_leading_marker(text):
    """Drop a leading verse-1 marker written as '1' or 'I'."""
    return re.sub(r'^(?:1|I)\s+', '', text).strip()


def split_verses_printed(text, start_n):
    """Split on the PRINTED verse numbers, which may be inline and may skip values (the
    Protevangelium runs 1, 2, 4, …). The numbers carry OCR errors that jump forward then resume
    lower (verse 3 misread "8", 33 misread "38"), so a forward-only scan derails. Instead pick
    the markers as the LONGEST STRICTLY-INCREASING subsequence of the candidate numbers ≥ start_n:
    that keeps the true monotonic verse run and drops the OCR outliers and stray prose numbers."""
    toks = re.split(r'(\s+)', text)
    cands = []      # (token_index, value)
    for i, tok in enumerate(toks):
        m = re.fullmatch(r'[(\[]?0*(\d+)[.,)\]]?', tok.strip()) if tok.strip() else None
        if m:
            v = int(m.group(1))
            if v >= start_n:
                cands.append((i, v))
    # Longest strictly-increasing subsequence by value (O(n^2); these texts are short).
    keep = _lis([v for _, v in cands])
    boundaries = {cands[k][0]: cands[k][1] for k in keep}
    verses = {}
    n = start_n
    buf = []
    for i, tok in enumerate(toks):
        if i in boundaries and buf:
            verses[n] = ' '.join(''.join(buf).split())
            buf = []
            n = boundaries[i]
        elif i in boundaries:
            n = boundaries[i]        # leading marker: just set the number
        else:
            buf.append(tok)
    if buf:
        verses[n] = ' '.join(''.join(buf).split())
    return {k: clean_text(v) for k, v in verses.items() if v.strip()}


def clean_text(v):
    # The OCR reads the vocative "O" as "0" ("0 proconsul"); a bare 0 is never anything else here.
    return re.sub(r'(^|\s)0(?=\s|[.,;:!?]|$)', r'\1O', v)


def _lis(vals):
    """Indices of a longest strictly-increasing subsequence of vals (earliest on ties)."""
    if not vals:
        return []
    n = len(vals)
    length = [1] * n
    prev = [-1] * n
    for i in range(n):
        for j in range(i):
            if vals[j] < vals[i] and length[j] + 1 > length[i]:
                length[i] = length[j] + 1
                prev[i] = j
    # Longest; on ties prefer the run ending in the SMALLER number (an OCR-inflated value like a
    # "3" misread "8" is dropped in favour of the real lower verse), then the earlier position.
    end = max(range(n), key=lambda i: (length[i], -vals[i], -i))
    out = []
    while end != -1:
        out.append(end)
        end = prev[end]
    return out[::-1]


def sequential_chapters(ps, count):
    """Assign paragraphs to chapters, scanning forward for the next chapter marker. Looks for the
    smallest upcoming chapter number whose (OCR-tolerant) Roman marker opens the paragraph, so a
    genuinely skipped numeral (the Gospel of Peter has no ch. XIV) is stepped over rather than
    swallowing the following chapters. Returns {chapter: [paragraphs]} in encounter order."""
    chapters = {}
    order = []
    cur = 0
    for p in ps:
        hit = next((c for c in range(cur + 1, count + 1) if chapter_marker(c).match(p)), None)
        if hit:
            cur = hit
            chapters[cur] = [chapter_marker(cur).match(p).group(1)]
            order.append(cur)
        elif cur >= 1:
            chapters[cur].append(p)
    return [(c, chapters[c]) for c in order]



# ── Protevangelium of James — 25 chapters, arabic verses restart each chapter ────────────
def build_protevangelium(html):
    ps = paragraphs(html)
    start = next(i for i, p in enumerate(ps) if chapter_marker(1).match(p))
    docs = []
    for ch, chap_paras in sequential_chapters(ps[start:], 25):
        chap_paras[0] = strip_leading_marker(chap_paras[0])   # drop the verse-1 marker
        verses = split_verses_printed(' '.join(chap_paras), 1)
        docs.append({'number': ch, 'verses': [{'number': v, 'text': verses[v]} for v in sorted(verses)]})
    return docs


# ── Gospel of Peter (Akhmim) — Roman chapters (XIV is skipped), Harnack verses run 1–60 ──
def build_gospel_peter(html):
    ps = paragraphs(html)
    start = next(i for i, p in enumerate(ps) if chapter_marker(1).match(p))
    docs = []
    prev_last = 0
    for ordinal, (_ch, chap_paras) in enumerate(sequential_chapters(ps[start:], 15), 1):
        body = ' '.join(chap_paras)
        m = re.match(r'^(\d+)\s+(.*)$', body)       # each chapter opens with its first verse no.
        first = int(m.group(1)) if m else prev_last + 1
        verses = split_verses_printed(m.group(2) if m else body, first)
        prev_last = max(verses) if verses else prev_last
        # Chapters renumbered contiguously (the printed XIV is absent); the Harnack verse numbers
        # carry the real citation.
        docs.append({'number': ordinal, 'verses': [{'number': v, 'text': verses[v]} for v in sorted(verses)]})
    return docs


# ── Acts of Paul and Thecla — the Thecla episode, verses 1–43, one chapter ───────────────
def build_thecla(html):
    ps = paragraphs(html)
    start = next(i for i, p in enumerate(ps) if re.match(r'^1 When Paul went up unto Iconium', p))
    body = []
    for p in ps[start:]:
        body.append(p)
        if re.match(r'^43\b', p):          # last verse of the episode
            break
    # The Thecla episode is verses 1–43, one per paragraph and contiguous, so assign numbers by
    # running sequence (robust to the one OCR'd marker, 33 printed "38"); unnumbered paragraphs
    # (beatitudes, the interjected blessings) append to the current verse.
    verses = {}
    n = 0
    for i, p in enumerate(body):
        m = re.match(r'^\d+\s+(.*)$', p)
        if m or i == 0:
            n += 1
            verses[n] = clean_text(m.group(1) if m else re.sub(r'^1\s+', '', p))
        else:
            verses[n] += ' ' + clean_text(p)
    return [{'number': 1, 'verses': [{'number': v, 'text': ' '.join(verses[v].split())} for v in sorted(verses)]}]


WORKS = [
    ('protevangelium', 'infancyjames-mrjames', 'The Protevangelium of James', build_protevangelium),
    ('gospel-of-peter', 'gospelpeter-mrjames', 'The Gospel of Peter', build_gospel_peter),
    ('paul-and-thecla', 'actspaul', 'The Acts of Paul and Thecla', build_thecla),
]


def main():
    no_cache = '--no-cache' in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, page, name, builder in WORKS:
        chapters = builder(fetch(page, no_cache))
        doc = {'work': name, 'attribution': ATTRIBUTION, 'chapters': chapters}
        (OUT / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding='utf-8')
        nv = sum(len(c['verses']) for c in chapters)
        span = f"{chapters[0]['number']}–{chapters[-1]['number']}" if len(chapters) > 1 else '1'
        print(f'{slug:16} {len(chapters):2d} chapters ({span}), {nv} verses')


if __name__ == '__main__':
    main()
