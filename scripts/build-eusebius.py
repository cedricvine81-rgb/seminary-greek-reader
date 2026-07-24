"""Build Eusebius, Ecclesiastical History (parallel Greek + English) for the Texts library.

Both texts come from the First Thousand Years of Greek project (github.com/OpenGreekAndLatin/
First1KGreek, CC BY-SA 4.0), one TEI file each:
  · Greek   tlg2018.tlg002.1st1K-grc2.xml — Schwartz's GCS text, divided book → chapter →
            SECTION (the standard citation unit, "HE 3.39.15").
  · English tlg2018.tlg002.1st1K-eng1.xml — Kirsopp Lake / J. E. L. Oulton's Loeb translation
            (public domain), divided book → chapter only.

MODEL. As with Josephus, the Greek is finer-grained than the English: the verse rows are the
Greek SECTIONS (so the parsing pane and citations are section-precise), and the whole chapter's
English is attached to the first section — the reader shows it once per chapter beside the
opening Greek, the remaining sections being Greek-only. One work per book (10 works, the ANF
Irenaeus pattern), since the prose model is chapter → verse; "Eusebius, HE <book>.<ch>.<sec>"
resolves to the book's work at chapter (+section) precision.

Output: public/data/eusebius/he-<book>.json, one per book.

Usage:  python3 scripts/build-eusebius.py [--no-cache]     (run from the repo root)
"""
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = ('https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/'
       'tlg2018/tlg002/')
GRC = 'tlg2018.tlg002.1st1K-grc2.xml'
ENG = 'tlg2018.tlg002.1st1K-eng1.xml'
CACHE = Path('/tmp/first1k-eusebius')
OUT = Path('public/data/eusebius')
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

ATTRIBUTION = ('Greek: Eusebius, Historia Ecclesiastica, ed. E. Schwartz (GCS). English: the '
               'Loeb translation by Kirsopp Lake & J. E. L. Oulton (public domain). Both via the '
               'First Thousand Years of Greek (Open Greek and Latin), CC BY-SA 4.0.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(name, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / name
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(RAW + name, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=90, context=_ctx).read()
    cached.write_bytes(data)
    return data


# Nicephorus cross-reference apparatus ("[Nic. H. E. I, 5]") the edition prints at paragraph
# starts — editorial, not part of Eusebius' text. The OCR mangles the "Nic." stem (Nic·, INic.,
# Greek Νic.) but every one carries the "H. E." (Historia Ecclesiastica) signature, which the
# genuine Greek editorial brackets ([Προοίμιον], [ἔλεγεν]) never do — so key on that. Latin/Greek
# E/H are both allowed for the OCR's letter swaps.
_NIC = re.compile(r'\[[^\]]*(?:[IΙ]?Nic|Νic|[HΗ]\.\s*[EΕΗ]\.)[^\]]*\]')


def strip_text(el):
    t = re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
    t = _NIC.sub('', t)
    return re.sub(r'\s{2,}', ' ', t).strip()


def edition(xml_bytes):
    xml = re.sub(r'(?is)<note\b.*?</note>', '', xml_bytes.decode('utf-8', 'replace'))
    return ET.fromstring(xml).find('.//t:body/t:div', NS)


# The preface is chapter 0 (Greek "praef" ↔ English "prologue"). The book-8 "appendix" (the
# Martyrs of Palestine, separately transmitted) is skipped; `skipped` collects it for the report.
skipped = []


def chapter_num(n, bk):
    if n in ('praef', 'prologue'):
        return 0
    if (n or '').isdigit():
        return int(n)
    skipped.append((bk, n))
    return None


def greek_sections(ed):
    """{book: {chapter: {section: text}}} from the section-divided Greek."""
    out = {}
    for b in ed.findall('t:div', NS):
        bk = int(b.get('n'))
        chapters = {}
        for c in b.findall('t:div', NS):
            if c.get('n') == 'toc':
                continue
            cn = chapter_num(c.get('n'), bk)
            if cn is None:
                continue
            secs = {}
            for s in c.findall('t:div', NS):
                t = strip_text(s)
                if t:
                    secs[int(s.get('n'))] = t
            # A preface with no <div> sections is a single block → section 1.
            if not secs:
                t = strip_text(c)
                if t:
                    secs[1] = t
            if secs:
                chapters[cn] = secs
        out[bk] = chapters
    return out


# The English OCR sporadically sets Latin letters in their Greek homoglyphs ("οf", "Μy",
# "Ρeter"). The English field is pure Latin script, so any Greek letter in it is an OCR swap —
# map the visually identical ones back. (Non-homoglyph OCR misreads like "seattered" remain.)
_HOMOGLYPH = str.maketrans({
    'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Ι': 'I', 'Κ': 'K', 'Μ': 'M',
    'Ν': 'N', 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X', 'Ϲ': 'C',
    'α': 'a', 'ο': 'o', 'ρ': 'p', 'ι': 'i', 'ν': 'v', 'κ': 'k', 'ϲ': 'c', 'υ': 'u',
})


def de_homoglyph(text):
    # Only touch words that are otherwise Latin (a stray Greek letter among Latin letters is
    # OCR); leave genuine Greek quotations (all-Greek words) alone.
    def fix(m):
        w = m.group(0)
        return w.translate(_HOMOGLYPH) if re.search(r'[A-Za-z]', w) else w
    return re.sub(r'\S+', fix, text)


def english_chapters(ed):
    """{book: {chapter: text}} — the English divides only to chapter. The chapter's leading
    Roman-numeral heading ("XXXIX.") is dropped."""
    out = {}
    for b in ed.findall('t:div', NS):
        bk = int(b.get('n'))
        chapters = {}
        for c in b.findall('t:div', NS):
            if c.get('n') == 'toc':
                continue
            cn = chapter_num(c.get('n'), bk)
            if cn is None:
                continue
            t = strip_text(c)
            t = re.sub(r'^[IVXLC]+\.\s*', '', t)   # drop the "XXXIX." chapter heading
            t = de_homoglyph(t)
            if t:
                chapters[cn] = t
        out[bk] = chapters
    return out


def main():
    no_cache = '--no-cache' in sys.argv
    grc = greek_sections(edition(fetch(GRC, no_cache)))
    eng = english_chapters(edition(fetch(ENG, no_cache)))
    OUT.mkdir(parents=True, exist_ok=True)

    summary = []
    for bk in sorted(grc):
        chapters = []
        n_sec = n_grk = 0
        eng_hits = 0
        for ch in sorted(grc[bk]):
            secs = grc[bk][ch]
            e = eng.get(bk, {}).get(ch)
            if e:
                eng_hits += 1
            verses = []
            for i, sec in enumerate(sorted(secs)):
                row = {'number': sec, 'greek': secs[sec]}
                # English (whole chapter) rides on the FIRST section; others are Greek-only.
                row['text'] = e if (i == 0 and e) else ''
                verses.append(row)
                n_sec += 1
                n_grk += 1
            chapters.append({'number': ch, 'verses': verses})
        doc = {
            'work': f'Eusebius, Ecclesiastical History (Book {bk})',
            'attribution': ATTRIBUTION,
            'greek': True,
            'chapters': chapters,
        }
        (OUT / f'he-{bk}.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1),
                                           encoding='utf-8')
        nums = [c['number'] for c in chapters]
        summary.append((bk, nums, n_sec, eng_hits))

    print(f'{"book":>4}  {"chapters":>8}  {"sections":>8}  {"eng-chapters":>12}')
    for bk, nums, nsec, ne in summary:
        nch = len(nums)
        flag = '' if ne == nch else f'   ← {nch - ne} chapter(s) missing English'
        print(f'{bk:>4}  {nch:>8}  {nsec:>8}  {ne:>12}{flag}')
    print(f'\ntotal: {sum(len(s[1]) for s in summary)} chapters, {sum(s[2] for s in summary)} sections')
    if skipped:
        print('skipped (non-numeric, not shipped):', skipped)
    # For prose-texts.ts: the chapter-number list per book (prefaces make chapter 0 possible).
    print('\nchapterNumbers per book (for the registry):')
    for bk, nums, _, _ in summary:
        contiguous = nums == list(range(nums[0], nums[-1] + 1))
        print(f'  book {bk}: {nums[0]}–{nums[-1]} ({len(nums)} chapters)'
              + ('' if contiguous else f'  GAPS → {nums}')
              + ('  [has preface]' if nums[0] == 0 else ''))


if __name__ == '__main__':
    main()
