"""Build Seneca's Dialogues and On Benefits for the Texts library.

WHY THIS WORK
With the Epistles imported, Seneca's other works were the largest remaining block of dead
cross-references: 15 to De Ira, 14 to De Beneficiis, and a dozen more spread across the
shorter dialogues. Together with the Epistles this makes Seneca — the closest pagan analogue
to Paul in period and register — properly readable in the app.

SOURCE AND PROVENANCE
Aubrey Stewart's translations for Bohn's Classical Library, both public domain:
  · Minor Dialogues Together with the Dialogue on Clemency (George Bell and Sons, 1889)
  · On Benefits (George Bell and Sons)
Read from Project Gutenberg's transcriptions. Only the underlying 1889 text is used; the
Gutenberg header, licence boilerplate and footnote apparatus are stripped.

WHY NOT PERSEUS OR WIKISOURCE
Perseus has the Latin of these works and no English (see build-seneca-epistles.py for the
measurement). Wikisource has only the three Consolations, not De Ira or De Beneficiis.

ADDRESSING — AND ITS LIMIT
Chapter = the chapter numbers Stewart prints (Roman numerals). Verse = paragraph within the
chapter, which is a reading convenience, NOT the Loeb section: Bohn did not print section
numbers, and pretending a paragraph is section n would point a citation like "Ira 2.32.2" at
the wrong sentence. So the citation patterns resolve to CHAPTER only and let the reader open
there. Coarser than the Epistles, honest about it.

The books are registered as separate works, as Epictetus' Discourses and Herodotus' books
are, because the citations address them as "Ira 2.32" and "Ben. 7.31" — book then chapter.

Usage:  python3 scripts/build-seneca-dialogues.py [--no-cache]     (from the repo root)
"""
import html
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

MINOR = 'https://www.gutenberg.org/files/64576/64576-h/64576-h.htm'
BENEFITS = 'https://www.gutenberg.org/files/3794/3794-h/3794-h.htm'
CACHE = Path('/tmp/seneca')
OUT = Path('public/data/greco')

ATTRIB_MINOR = (
    'Seneca, {name}, translated by Aubrey Stewart, Minor Dialogues Together with the Dialogue '
    'on Clemency (Bohn’s Classical Library, George Bell and Sons, 1889), public domain. '
    'Source: Project Gutenberg. Stewart’s edition prints chapter numbers but not the Loeb '
    'section numbers, so citations resolve at chapter level; the verse numbers here are '
    'paragraphs, not sections.'
)
ATTRIB_BENEFITS = (
    'Seneca, On Benefits (De Beneficiis) Book {book}, translated by Aubrey Stewart (Bohn’s '
    'Classical Library, George Bell and Sons), public domain. Source: Project Gutenberg. '
    'Chapter numbers are Stewart’s; citations resolve at chapter level, and the verse numbers '
    'here are paragraphs, not Loeb sections.'
)

# Per-work notes appended to the attribution where the source itself is irregular.
NOTES = {
    'clemency-1': ' Stewart’s text prints no numeral for chapter 25, so that chapter’s '
                  'material sits at the end of chapter 24 and the numbering runs 24, 26.',
}

# (index of the <h2> that opens it, slug suffix, display name)
MINOR_WORKS = [
    (2, 'providence', 'On Providence'),
    (3, 'constancy', 'On the Constancy of the Wise Man'),
    (4, 'anger-1', 'On Anger, Book 1'),
    (5, 'anger-2', 'On Anger, Book 2'),
    (6, 'anger-3', 'On Anger, Book 3'),
    (7, 'marcia', 'Of Consolation: To Marcia'),
    (8, 'happy-life', 'On the Happy Life'),
    (9, 'leisure', 'On Leisure'),
    (10, 'tranquillity', 'On Peace of Mind'),
    (11, 'brevity', 'On the Shortness of Life'),
    (12, 'helvia', 'Of Consolation: To Helvia'),
    (13, 'polybius', 'Of Consolation: To Polybius'),
    (14, 'clemency-1', 'On Clemency, Book 1'),
    (15, 'clemency-2', 'On Clemency, Book 2'),
]

ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}
STRIP = [
    re.compile(r'(?is)<span[^>]*class="pagenum"[^>]*>.*?</span>'),   # marginal page numbers
    re.compile(r'(?is)<a[^>]*>\s*<sup>.*?</sup>\s*</a>'),            # footnote anchors [1]
    re.compile(r'(?is)<div[^>]*class="[^"]*footnote[^"]*"[^>]*>.*?</div>'),
    re.compile(r'(?is)<sup>.*?</sup>'),
]


def roman(s):
    total = prev = 0
    for ch in reversed(s.upper()):
        if ch not in ROMAN:
            return None
        v = ROMAN[ch]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total or None


def fetch(url, name, no_cache):
    f = CACHE / name
    if f.exists() and not no_cache:
        return f.read_text(encoding='utf-8', errors='replace')
    try:
        ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
    except Exception:
        ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers={'User-Agent': 'seminary-greek-reader/1.0 (https://seminarygreek.app)'})
    data = urllib.request.urlopen(req, timeout=180, context=ctx).read().decode('utf-8', 'replace')
    CACHE.mkdir(parents=True, exist_ok=True)
    f.write_text(data, encoding='utf-8')
    return data


def text_of(fragment):
    for pat in STRIP:
        fragment = pat.sub(' ', fragment)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', fragment)).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', t).strip()


def blocks(seg):
    """The segment's paragraph-like blocks in document order.

    Both volumes mark a chapter by a Roman numeral opening a <p> (On Benefits additionally
    puts its FIRST chapter in an <h3>, which is why h3 alone finds only one chapter a book).
    <pre> carries the verse quotations Seneca quotes — dropping it would silently lose the
    poetry, so it is collected alongside <p>.
    """
    return [m.group(2) for m in re.finditer(r'(?is)<(p|pre)[^>]*>(.*?)</\1>', seg)]


def split_markers(body, cur):
    """Cut a block wherever a chapter numeral appears, returning [(chapter|None, text), …].

    The numeral is NOT reliably at the start of a paragraph: Bohn runs a verse quotation and
    the next chapter's opening into one block ("…rightly placed." II. In the former verse…"),
    so a start-of-block test finds chapter III of On Benefits I and never chapter II. A marker
    is therefore accepted anywhere it both follows the end of a sentence and precedes a
    capital — which is what distinguishes it from "I" the pronoun and from numerals inside the
    prose.

    A small forward gap is allowed: where the print omits a numeral, the following chapters
    still carry their own numbers, and stalling on the gap would silently discard the whole
    rest of the book (which is what a strict run did to On Benefits I and IV).
    """
    out, last, n_cur = [], 0, cur
    # The bracket forms matter: the dialogues mark a change of speaker after the chapter
    # numeral ("II. [ Seneca. ] I have long been silently asking myself…"), so a lookahead
    # for a capital alone loses those chapters.
    for m in re.finditer(r'([IVXLC]{1,7})\.\s+(?=[A-Z"“‘\[(])', body):
        n = roman(m.group(1))
        if n is None or not (n_cur < n <= n_cur + 3):
            continue
        before = body[:m.start()] if not out else body[last:m.start()]
        prev = body[:m.start()].rstrip()
        # Must begin the block or follow a sentence end, else it is prose, not a marker.
        if m.start() != 0 and (not prev or prev[-1] not in '.!?"\'”’):;—'):
            continue
        out.append((None, before.strip()))
        out.append((n, ''))
        last, n_cur = m.end(), n
    out.append((None, body[last:].strip() if out else body.strip()))
    return out


def chapters_from_paragraphs(paras):
    """Group blocks into chapters, cutting blocks that carry a chapter numeral mid-way."""
    chapters, cur = [], None
    for raw in paras:
        body = text_of(raw)
        if not body:
            continue
        for num, text in split_markers(body, chapters[-1]['number'] if chapters else 0):
            if num is not None:
                cur = {'number': num, 'verses': []}
                chapters.append(cur)
                continue
            if not text:
                continue
            if cur is None:
                # Text before any numeral is chapter 1 (Stewart leaves the first unmarked).
                cur = {'number': 1, 'verses': []}
                chapters.append(cur)
            cur['verses'].append({'number': len(cur['verses']) + 1, 'text': text})
    return chapters


def write(slug, work_name, attribution, chapters):
    if not chapters:
        raise SystemExit(f'refusing to write: {slug} parsed no chapters')
    nums = [c['number'] for c in chapters]
    # Must start at 1 and strictly rise. Gaps are tolerated (see split_markers: the print
    # omits the odd numeral) but reported, since a large gap means something was misread.
    if nums[0] != 1 or any(b <= a for a, b in zip(nums, nums[1:])):
        raise SystemExit(f'refusing to write: {slug} chapters do not rise from 1 — got {nums[:24]}')
    gaps = [n for n in range(1, nums[-1] + 1) if n not in nums]
    if any(not c['verses'] for c in chapters):
        raise SystemExit(f'refusing to write: {slug} has an empty chapter')
    words = sum(len(v['text'].split()) for c in chapters for v in c['verses'])
    if words < 400:
        raise SystemExit(f'refusing to write: {slug} came out at only {words} words')
    (OUT / f'{slug}.json').write_text(json.dumps({
        'work': f'Seneca, {work_name}',
        'attribution': attribution,
        'chapters': chapters,
    }, ensure_ascii=False), encoding='utf-8')
    return len(chapters), words, gaps


def main():
    no_cache = '--no-cache' in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    total_ch = total_w = 0

    # ── Minor Dialogues: chapters are a Roman numeral inside the paragraph ──
    t = fetch(MINOR, 'minor.html', no_cache)
    h2 = list(re.finditer(r'<h2[^>]*>', t))
    for idx, slug, name in MINOR_WORKS:
        seg = t[h2[idx].end():(h2[idx + 1].start() if idx + 1 < len(h2) else len(t))]
        ch = chapters_from_paragraphs(blocks(seg))
        n, w, g = write(f'seneca-{slug}', name, ATTRIB_MINOR.format(name=name) + NOTES.get(slug, ''), ch)
        total_ch += n; total_w += w
        print(f'  seneca-{slug:<14} {n:>3} chapters, {w:>7,} words   {name}'
              + (f'   GAPS {g}' if g else ''))

    # ── On Benefits: chapters are <h3> headings ──
    b = fetch(BENEFITS, 'benefits.html', no_cache)
    bh2 = [m for m in re.finditer(r'(?is)<h2[^>]*>\s*BOOK\s+([IVX]+)\.?\s*</h2>', b)]
    if len(bh2) != 7:
        raise SystemExit(f'refusing to write: found {len(bh2)} books of On Benefits, expected 7')
    for i, m in enumerate(bh2, start=1):
        seg = b[m.end():(bh2[i].start() if i < len(bh2) else len(b))]
        ch = chapters_from_paragraphs(blocks(seg))
        n, w, g = write(f'seneca-benefits-{i}', f'On Benefits, Book {i}',
                        ATTRIB_BENEFITS.format(book=i), ch)
        total_ch += n; total_w += w
        print(f'  seneca-benefits-{i:<3} {n:>3} chapters, {w:>7,} words   On Benefits, Book {i}'
              + (f'   GAPS {g}' if g else ''))

    print(f'\n{len(MINOR_WORKS) + 7} works, {total_ch} chapters, {total_w:,} words')


if __name__ == '__main__':
    main()
