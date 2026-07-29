"""Rebuild Eusebius, Ecclesiastical History section by section, on McGiffert's English.

WHY THIS REPLACES THE PREVIOUS ENGLISH
Eusebius is cited book.chapter.SECTION — "HE 3.39.15" is the Papias testimony on Mark, and
a reference to HE 3.39 alone is nearly useless, the chapter being some 5,600 characters.
Our Greek (Schwartz, GCS) has always carried those sections, but the English we shipped
(Lake/Oulton, via Open Greek and Latin) has no section markers, so the previous build made
the CHAPTER the parallel unit and folded the section numbers inline into the Greek. That
kept the columns aligned at the cost of the citation unit.

It also shipped a visibly corrupt English. From HE 3.39 alone: "the Iord's disciples",
"it is here worth nothing" (for *noting*), "he twiee counts", "a comanion of Polycarp",
"a tradtion about the Mark"; elsewhere "Mattheru", "he knowns", "the most aceurate aeeount".

A. C. McGiffert's translation (NPNF second series vol. 1, 1890) fixes both at once: it is
clean, and it is numbered by the same sections as the Greek — so section becomes the
parallel unit and "HE 3.39.15" resolves to the sentence it names. It is also unambiguously
public domain, which Oulton's 1932 Loeb volume (books 6-10) may well not be.

THE CHECK
The Greek and the English come from unrelated sources, so their section numbers agree only
if both were read correctly. Every chapter is compared; where they disagree the chapter
falls back to one row (the old behaviour) rather than pairing English against Greek that is
not its own, and is listed at the end of the run.

Usage:  python3 scripts/build-eusebius-npnf.py [--no-cache]     (from the repo root)
"""
import importlib.util
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

NPNF = 'https://ccel.org/ccel/s/schaff/npnf201/cache/npnf201.txt'
CACHE = Path('/tmp/euseb/npnf201.raw')
OUT = Path('public/data/eusebius')

ATTRIBUTION = (
    'Greek: Eusebius, Historia Ecclesiastica, ed. E. Schwartz (GCS), via the First Thousand '
    'Years of Greek (Open Greek and Latin), CC BY-SA 4.0. English: A. C. McGiffert, Nicene '
    'and Post-Nicene Fathers, second series, vol. 1 (1890), public domain, via CCEL — '
    'numbered by the standard book.chapter.section divisions, so "HE 3.39.15" resolves '
    'to the section.'
)

ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}


def roman(s):
    total = prev = 0
    for ch in reversed(s.upper()):
        if ch not in ROMAN:
            return None
        v = ROMAN[ch]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total or None


def load_greek(no_cache):
    """{book: {chapter: {section: greek}}} — reuse the existing builder's TEI reader."""
    spec = importlib.util.spec_from_file_location('be', 'scripts/build-eusebius.py')
    be = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(be)
    return be.greek_sections(be.edition(be.fetch(be.GRC, no_cache)))


def fetch_npnf(no_cache):
    if CACHE.exists() and not no_cache:
        return CACHE.read_text(encoding='utf-8', errors='replace')
    try:
        ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
    except Exception:
        ctx = ssl._create_unverified_context()
    req = urllib.request.Request(NPNF, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=180, context=ctx).read().decode('utf-8', 'replace')
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(data, encoding='utf-8')
    return data


BOOK_RE = re.compile(r'\n\s*Book ([IVXLC]+)\.?\s*\n')
# (?:^|\n): a book heading swallows its trailing newline, so chapter I sits at the very
# start of the book's body with nothing before it.
CHAP_RE = re.compile(r'(?:^|\n)\s*Chapter ([IVXLC]+)\.\s*[-—]{1,2}')
RULE = '__________________________________________________________________'
# Numbered section, at the start of a line: "   15. \"This also the presbyter…"
SEC_RE = re.compile(r'(?:^|\n)\s{0,6}(\d{1,3})\.\s+(?=[A-Z"“\(\[])')


def clean(t):
    t = re.sub(r'\[\d{1,4}\]', ' ', t)          # footnote markers
    t = re.sub(r'\s*\n\s*', ' ', t)
    return re.sub(r'\s{2,}', ' ', t).strip()


def parse_npnf(raw):
    """{book: {chapter: {section: english}}} for the Church History only."""
    # The volume also carries the Life of Constantine and the Oration; the Church History is
    # the first run of ten books, so stop as soon as the book numbers restart.
    books, seen, end_of_work = [], [], len(raw)
    for m in BOOK_RE.finditer(raw):
        n = roman(m.group(1))
        if n is None:
            continue
        if seen and n <= seen[-1]:
            end_of_work = m.start()               # numbering restarted → a different work
            break
        seen.append(n)
        books.append((n, m.end()))
    else:
        end_of_work = len(raw)
    out = {}
    for i, (bk, start) in enumerate(books):
        end = books[i + 1][1] if i + 1 < len(books) else end_of_work
        body = raw[start:end]
        chaps = [(roman(m.group(1)), m.end()) for m in CHAP_RE.finditer(body)]
        chaps = [(n, p) for n, p in chaps if n]
        for j, (ch, cstart) in enumerate(chaps):
            cend = chaps[j + 1][1] if j + 1 < len(chaps) else len(body)
            chunk = body[cstart:cend]
            # The chapter's footnotes follow a horizontal rule — drop them and the heading tail.
            chunk = chunk.split(RULE)[0]
            chunk = chunk.split('\n', 1)[1] if '\n' in chunk else chunk
            parts = SEC_RE.split(chunk)
            secs = {}
            for k in range(1, len(parts) - 1, 2):
                txt = clean(parts[k + 1])
                if txt:
                    secs[int(parts[k])] = txt
            if not secs:                          # an unnumbered chapter is a single section
                txt = clean(chunk)
                if txt:
                    secs[1] = txt
            if secs:
                out.setdefault(bk, {})[ch] = secs
    return out


def main():
    no_cache = '--no-cache' in sys.argv
    grc = load_greek(no_cache)
    eng = parse_npnf(fetch_npnf(no_cache))

    summary, mismatches = [], []
    for bk in sorted(grc):
        chapters, paired, rows = [], 0, 0
        for ch in sorted(grc[bk]):
            secs = grc[bk][ch]
            esec = eng.get(bk, {}).get(ch, {})
            order = sorted(secs)
            if esec and set(order) == set(esec):
                # Section is the parallel unit: one row per section, Greek beside English.
                verses = [{'number': s, 'text': esec[s], 'greek': secs[s]} for s in order]
                paired += 1
            else:
                # Fall back to the old single row so nothing is paired on a guess.
                lead_is_one = order and order[0] == 1
                greek = ' '.join((secs[s] if (i == 0 and lead_is_one) else f'{s} {secs[s]}')
                                 for i, s in enumerate(order))
                joined = ' '.join(esec[s] for s in sorted(esec)) if esec else ''
                verses = [{'number': 1, 'text': joined, 'greek': greek}]
                mismatches.append(f'  {bk}.{ch}: Greek sections {order}, English {sorted(esec)}')
            rows += len(verses)
            chapters.append({'number': ch, 'verses': verses})
        (OUT / f'he-{bk}.json').write_text(json.dumps({
            'work': f'Eusebius, Ecclesiastical History (Book {bk})',
            'attribution': ATTRIBUTION,
            'greek': True,
            'chapters': chapters,
        }, ensure_ascii=False), encoding='utf-8')
        summary.append((bk, len(chapters), paired, rows))

    print(f'{"book":>4} {"chapters":>9} {"section-paired":>15} {"rows":>6}')
    for bk, nch, paired, rows in summary:
        print(f'{bk:>4} {nch:>9} {paired:>15} {rows:>6}')
    tot_ch = sum(s[1] for s in summary)
    tot_ok = sum(s[2] for s in summary)
    print(f'\n{tot_ok}/{tot_ch} chapters divided into sections; '
          f'{sum(s[3] for s in summary)} rows total')
    if mismatches:
        print(f'\n{len(mismatches)} chapters left as one row (sections disagree):')
        print('\n'.join(mismatches[:40]))
        if len(mismatches) > 40:
            print(f'  … and {len(mismatches) - 40} more')


if __name__ == '__main__':
    main()
