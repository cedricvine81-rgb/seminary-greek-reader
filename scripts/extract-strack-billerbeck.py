# Extracts candidate background cross-references from Strack–Billerbeck's Kommentar zum Neuen
# Testament aus Talmud und Midrasch (1922–28) into a REVIEW QUEUE — never straight into the
# dataset.
#
# LICENSING. The German original is public domain (Strack d. 1922, Billerbeck d. 1932; volumes
# published 1922–28), and what is taken here is only the citation apparatus: which rabbinic
# passage Billerbeck attached to which New Testament verse. Bare references are facts, and this
# reads them from the PD original, not from the 2021–22 Lexham English translation, which is a
# separate copyrighted work.
#
# WHAT IT CANNOT DO. Two error sources behave differently and are handled differently:
#   * A CITATION can be checked — "Sanh 89a" either resolves to a daf we hold or it does not,
#     and our own corpora are the test. Anything that fails is dropped.
#   * An ANCHOR cannot be fully checked. A heading that reads "3,60" is discarded because Mark 3
#     has no verse 60, and headings that break the ascending sequence are flagged; but a verse
#     number that is wrong AND plausible is invisible to any automatic test.
# Above all, proving a reference is real is not proving Billerbeck attached it to THIS verse. So
# every row carries its German context and the file is a queue for a scholar to accept or reject.
#
# Usage:  python3 scripts/extract-strack-billerbeck.py <ocr.txt> --book Luke --out queue.json
#         The OCR is the Internet Archive djvu.txt of the relevant volume.

import argparse
import json
import glob
import os
import re
import sys
from collections import Counter

# Billerbeck's abbreviations → our tractate slugs. Mishnah/Yerushalmi/Bavli share these names;
# the prefix and the reference shape decide which corpus is meant (see classify).
WORKS = {
    'Berakh': 'berakhot', 'Schab': 'shabbat', 'Erub': 'eruvin', 'Pes': 'pesachim',
    'Joma': 'yoma', 'Sukka': 'sukkah', 'Bez': 'beitzah', 'RH': 'rosh-hashanah',
    'Taan': 'taanit', 'Meg': 'megillah', 'MQ': 'moed-katan', 'Chag': 'chagigah',
    'Jeb': 'yevamot', 'Keth': 'ketubot', 'Ned': 'nedarim', 'Naz': 'nazir', 'Sota': 'sotah',
    'Git': 'gittin', 'Qid': 'kiddushin', 'BQ': 'bava-kamma', 'BM': 'bava-metzia',
    'BB': 'bava-batra', 'Sanh': 'sanhedrin', 'Mak': 'makkot', 'Schebu': 'shevuot',
    'AZ': 'avodah-zarah', 'Hor': 'horayot', 'Zeb': 'zevachim', 'Men': 'menachot',
    'Chul': 'chullin', 'Bek': 'bekhorot', 'Arakh': 'arakhin', 'Tem': 'temurah',
    'Ker': 'keritot', 'Meila': 'meilah', 'Tamid': 'tamid', 'Nid': 'niddah',
}
# SBL abbreviations, to match how the existing dataset writes a citation.
SBL = {
    'berakhot': 'Ber.', 'shabbat': 'Šabb.', 'eruvin': 'ʿErub.', 'pesachim': 'Pesaḥ.',
    'yoma': 'Yoma', 'sukkah': 'Sukkah', 'beitzah': 'Beṣah', 'rosh-hashanah': 'Roš Haš.',
    'taanit': 'Taʿan.', 'megillah': 'Meg.', 'moed-katan': 'Moʾed Qaṭ.', 'chagigah': 'Ḥag.',
    'yevamot': 'Yebam.', 'ketubot': 'Ketub.', 'nedarim': 'Ned.', 'nazir': 'Naz.',
    'sotah': 'Soṭah', 'gittin': 'Giṭ.', 'kiddushin': 'Qidd.', 'bava-kamma': 'B. Qam.',
    'bava-metzia': 'B. Meṣiʿa', 'bava-batra': 'B. Bat.', 'sanhedrin': 'Sanh.',
    'makkot': 'Mak.', 'shevuot': 'Šebu.', 'avodah-zarah': 'ʿAbod. Zar.', 'horayot': 'Hor.',
    'zevachim': 'Zebaḥ.', 'menachot': 'Menaḥ.', 'chullin': 'Ḥul.', 'bekhorot': 'Bek.',
    'arakhin': 'ʿArak.', 'temurah': 'Temurah', 'keritot': 'Ker.', 'meilah': 'Meʿil.',
    'tamid': 'Tamid', 'niddah': 'Nid.',
}

HEADING = re.compile(r'^\s{0,6}(\d{1,2})\s?,\s?(\d{1,3})\s*[:.]')
CITATION = re.compile(
    r'\b(p|T)?(' + '|'.join(sorted(WORKS, key=len, reverse=True)) + r')\s?\.?\s?(\d{1,3})\s*[«°^\'"]?\s*([ab])?\b'
)


def verse_counts(osis: str) -> dict:
    """Real verse counts, so an impossible anchor can be thrown away."""
    out = {}
    for f in glob.glob(f'public/data/gnt/{osis}_*.json'):
        ch = int(os.path.basename(f)[:-5].rsplit('_', 1)[1])
        try:
            out[ch] = len(json.load(open(f)).get('verses') or [])
        except Exception:
            pass
    return out


def held_dapim() -> dict:
    out = {}
    for slug in set(WORKS.values()):
        try:
            d = json.load(open(f'public/data/bavli/{slug}.json'))
            out[slug] = {c['number'] for c in d['chapters']}
        except Exception:
            pass
    return out


def held_yerushalmi() -> dict:
    out = {}
    for slug in set(WORKS.values()):
        try:
            d = json.load(open(f'public/data/yerushalmi/{slug}.json'))
            out[slug] = {c['number']: {v['number'] for v in c['verses']} for c in d['chapters']}
        except Exception:
            pass
    return out


def held_tosefta() -> dict:
    out = {}
    for slug in set(WORKS.values()):
        try:
            d = json.load(open(f'public/data/tosefta/{slug}.json'))
            out[slug] = {c['number'] for c in d['chapters']}
        except Exception:
            pass
    return out


def held_mishnah() -> dict:
    out = {}
    for slug in set(WORKS.values()):
        try:
            d = json.load(open(f'public/data/mishnah/{slug}.json'))
            out[slug] = {c['number']: {v['number'] for v in c['verses']} for c in d['chapters']}
        except Exception:
            pass
    return out


def sections(lines):
    """Heading positions as (line, chapter, verse), in document order."""
    out = []
    for n, l in enumerate(lines):
        m = HEADING.match(l)
        if m:
            out.append((n, int(m.group(1)), int(m.group(2))))
    return out


# The volume runs several books together; its running heads name them, which is far more
# reliable than inferring boundaries from chapter numbers. (Inferring them put LUKE's section
# under --book Acts, because Luke's chapters 1-24 sit happily inside Acts's 1-28 range, and one
# stray heading then swallowed the rest of the volume — 571 references on Acts 27:10.)
# Every page of the volume carries a running head naming its book ("Apostelgeschichte 1, 12
# 591"), which is the only boundary signal in this OCR that is both unambiguous and repeated.
# A book therefore spans its first running head to its last.
#
# Two earlier attempts failed and are worth recording: inferring boundaries from chapter numbers
# put LUKE's whole section under --book Acts (Luke's 1-24 fits inside Acts's 1-28) and one stray
# heading then swallowed the rest of the volume, giving 571 references on Acts 27:10; and matching
# the section TITLE caught the preface instead, because the book is named there too.
# Boundaries come from the printed PAGE NUMBERS in the running heads, checked against the
# volume's own table of contents. Every page carries "<page> Lukas 3, 14" or "Lukas 3, 14
# <page>", so a book is the span of running heads that BOTH name it AND fall in its page range.
# Nothing else in this OCR is reliable: inferring boundaries from chapter numbers put Luke's
# whole section under Acts (571 references landed on Acts 27:10), matching the section title
# caught the preface, and matching the book name alone let Luke run through John into Acts.
# Boundaries come from the running heads, which name the book on every page. Volume 2's are
# bare book names ("Lukas 3, 14  87"); volume 3's spell out the epistle and number it
# ("1. Brief an die Korinther 1, 19  395"), which is also how 1 and 2 Corinthians are told
# apart. A book spans its first such head to its last.
#
# Nothing else in this OCR is reliable, and every alternative failed SILENTLY: inferring
# boundaries from chapter numbers put Luke's whole section under Acts (571 references landed on
# Acts 27:10); matching the section title caught the preface; matching a bare book name let Luke
# run through John into Acts. Volume 3's table of contents is too OCR-damaged to use at all.
RUNNING_HEAD = {
    # Volume 2 — the Gospels and Acts.
    'Matt': r'\bMatth\w*\b', 'Mark': r'\bMarkus\b', 'Luke': r'\bLukas\b',
    'John': r'\bJohannes\b', 'Acts': r'\bApostelgeschichte\b',
    # Volume 3 — the Epistles and Revelation.
    'Rom': r'Brief an die R[öo]mer', '1Cor': r'1\.\s*Brief an die Korinther',
    '2Cor': r'2\.\s*Brief an die Korinther', 'Gal': r'Brief an die Galater',
    'Eph': r'Brief an die Epheser', 'Phil': r'Brief an die Philipper',
    'Col': r'Brief an die Kolosser', '1Thess': r'1\.\s*Brief an die Thessalonicher',
    '2Thess': r'2\.\s*Brief an die Thessalonicher', '1Tim': r'1\.\s*Brief an Timotheus',
    '2Tim': r'2\.\s*Brief an Timotheus', 'Titus': r'Brief an Titus',
    'Phlm': r'Brief an Philemon', 'Heb': r'Brief an die Hebr[äa]er',
    'Jas': r'Brief des Jakobus', '1Pet': r'1\.\s*Brief Petri', '2Pet': r'2\.\s*Brief Petri',
    '1John': r'1\.\s*Brief Johannis', '2John': r'2\.\s*Brief Johannis',
    '3John': r'3\.\s*Brief Johannis', 'Jude': r'Brief Jud[äa]', 'Rev': r'Offenbarung Johannis',
}
# Volume 2's own contents, used to confirm the Gospel spans. Volume 3 has none usable, so its
# books are bounded by their running heads alone.
VOLUME_PAGES = {'Mark': (1, 54), 'Luke': (55, 301), 'John': (302, 587), 'Acts': (588, 773)}


def book_span(lines, book):
    """(start, end) line numbers for one book, from its page-numbered running heads."""
    if book not in RUNNING_HEAD:
        sys.exit(f'no running head known for {book}')
    pat = re.compile(RUNNING_HEAD[book])
    rng = VOLUME_PAGES.get(book)
    hits = []
    for n, l in enumerate(lines):
        if not pat.search(l or '') or not re.search(r'\d', l or ''):
            continue
        if re.search(r'\d+\s*[—–]\s*\d+', l):     # a contents row, not a running head
            continue
        if rng:                                     # where the contents are legible, honour them
            m = re.match(r'^\s*(\d{1,3})\s', l) or re.search(r'\s(\d{1,3})\s*$', l)
            if not m or not (rng[0] <= int(m.group(1)) <= rng[1]):
                continue
        hits.append(n)
    if len(hits) < 3:
        sys.exit(f'only {len(hits)} running heads for {book} — refusing to guess')
    return hits[0], hits[-1] + 1


def classify(pre, work, num, side, bavli, yer, mish, tos):
    """Which corpus a citation points at, and whether we actually hold it."""
    slug = WORKS[work]
    if pre == 'T':
        return ('Tosefta', f't. {SBL[slug]} {num}', num in (tos.get(slug) or ()))
    if pre == 'p':
        ok = num in (yer.get(slug) or {})
        return ('Yerushalmi', f'y. {SBL[slug]} {num}', ok)
    if side:
        chapter = (num - 1) * 2 + (2 if side == 'b' else 1)
        return ('Bavli', f'b. {SBL[slug]} {num}{side}', chapter in bavli.get(slug, ()))
    ok = num in (mish.get(slug) or {})
    return ('Mishnah', f'm. {SBL[slug]} {num}', ok)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ocr')
    ap.add_argument('--book', required=True, help='osisId, e.g. Luke or Acts')
    ap.add_argument('--out', required=True)
    # Billerbeck parks whole excursuses under a single verse — the ʿam ha-aretz essay sits under
    # John 7:49, the Memra one under 1:51 — and those blocks run 2,000 lines against a median of
    # 26, dumping 70+ references onto one verse. That is an essay's bibliography, not a
    # cross-reference list, so the head of each verse's list is kept and the tail dropped.
    ap.add_argument('--max-per-verse', type=int, default=12)
    a = ap.parse_args()

    lines = open(a.ocr, encoding='utf-8', errors='ignore').read().split('\n')
    vc = verse_counts(a.book)
    if not vc:
        sys.exit(f'no GNT chapter files for {a.book}')
    bavli, yer, mish, tos = held_dapim(), held_yerushalmi(), held_mishnah(), held_tosefta()

    begin, stop = book_span(lines, a.book)
    book = [(n, c, v) for n, c, v in sections(lines) if begin <= n < stop]
    if not book:
        sys.exit(f'no verse headings inside the {a.book} section (lines {begin}-{stop})')
    print(f'{a.book} section: lines {begin}–{stop}')

    rows, dropped_anchor, stats = [], 0, Counter()
    prev = (0, 0)
    for i, (n, c, v) in enumerate(book):
        if not (c in vc and 1 <= v <= vc[c]):
            dropped_anchor += 1
            continue
        # Out-of-sequence headings are kept but flagged: a lone backwards jump is usually a
        # misread digit, and a reviewer should see it.
        out_of_order = (c, v) < prev
        prev = (c, v)
        end = book[i + 1][0] if i + 1 < len(book) else stop
        block = ' '.join(lines[n:end])
        context = re.sub(r'\s+', ' ', block)[:400]
        seen = set()
        for pre, work, num, side in CITATION.findall(block):
            corpus, cite, ok = classify(pre, work, int(num), side, bavli, yer, mish, tos)
            stats[corpus] += 1
            if not ok:
                stats[f'{corpus} (not held)'] += 1
                continue
            if cite in seen:
                continue
            seen.add(cite)
            rows.append({
                'book': a.book, 'chapter': c, 'verse': v,
                'citation': cite, 'corpus': corpus,
                'outOfOrder': out_of_order,
                'context': context,
            })

    capped, per_verse, over = [], Counter(), 0
    for r in rows:
        key = (r['chapter'], r['verse'])
        if per_verse[key] >= a.max_per_verse:
            over += 1
            continue
        per_verse[key] += 1
        capped.append(r)
    rows = capped
    verses = {(r['chapter'], r['verse']) for r in rows}
    json.dump({
        'source': ('Strack–Billerbeck, Kommentar zum Neuen Testament aus Talmud und Midrasch '
                   '(München, 1922–28) — public domain. Citation apparatus only; extracted from '
                   'the Internet Archive OCR of the German original for review.'),
        'book': a.book, 'rows': rows,
    }, open(a.out, 'w'), ensure_ascii=False, indent=1)

    print(f'{a.book}: {len(book)} headings ({dropped_anchor} discarded as impossible verses)')
    for k, n in stats.most_common():
        print(f'   {k:24} {n}')
    print(f'   → {len(rows)} verified candidate references across {len(verses)} verses'
          + (f' ({over} dropped over the {a.max_per_verse}-per-verse cap)' if over else ''))
    print(f'   → {a.out}')


if __name__ == '__main__':
    main()
