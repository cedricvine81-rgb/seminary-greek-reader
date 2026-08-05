# Builds Tertullian and Theophilus of Antioch for the Texts library, from the Ante-Nicene
# Fathers (Roberts-Donaldson series, 1885) as hosted on Wikisource in raw wikitext.
#
# WHY THESE TWO. Both were named as absences on the Themes pages and neither could be answered
# from what the library held. Theophilus is the first writer known to use τριάς of God (To
# Autolycus II.15), which the Trinity page said outright was missing; Tertullian's Against
# Praxeas is the first sustained argument for three persons in one substance, and his On Baptism
# is the earliest treatise on the subject in any language. The rest of the batch was chosen the
# same way — one work per Themes page that had thin Christian coverage.
#
# TWO PAGE SHAPES, and the script must handle both. Tertullian is one Wikisource page PER
# CHAPTER, listed on a contents page as roman-numeral subpages. Theophilus is one page per BOOK
# with the chapters inside it as bold headings. So each work declares its shape, and the
# chapter number comes from the subpage title in the first case and from the heading in the
# second.
#
# WHAT COUNTS AS A VERSE. Chapter → paragraph, as with Irenaeus in build-anf.py. Tertullian is
# cited by chapter alone ("Adv. Prax. 2"), so the paragraph number is a locator this app adds,
# not part of the standard citation — the same compromise the rest of the prose corpus makes.
#
# Output: public/data/anf/<slug>.json   (the shared chapter → verse prose shape)
# Usage:  python3 scripts/build-tertullian.py [--no-cache]   (from the repo root)

import html
import json
import os
import re
import ssl
import sys
import time
import urllib.request
from pathlib import Path

# This machine's Python trusts a stale Anaconda CA bundle and cannot verify wikisource.org.
# Point at the system roots explicitly rather than disabling verification.
_CERTS = next((p for p in ('/etc/ssl/cert.pem', os.environ.get('CURL_CA_BUNDLE', ''))
               if p and Path(p).exists()), None)
SSL_CTX = ssl.create_default_context(cafile=_CERTS) if _CERTS else ssl.create_default_context()

BASE = 'https://en.wikisource.org/wiki/'
CACHE = Path('/tmp/anf-ws')
OUT_DIR = Path('public/data/anf')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1'

TERT_ATTRIB = ('Text: Tertullian in the Ante-Nicene Fathers (ed. Roberts & Donaldson, 1885), '
               'public domain. Source: Wikisource. Chapter → paragraph; Tertullian is normally '
               'cited by chapter alone, so the second number is this app’s locator.')
TERT_NA_ATTRIB = ('Text: Tertullian, Apology, tr. S. Thelwall in the Ante-Nicene Fathers (1885), '
                  'public domain. Source: Wikisource, except chapter 1, which Wikisource omits '
                  'and which is taken from newadvent.org. Chapter → paragraph.')
THEO_ATTRIB = ('Text: Theophilus of Antioch, To Autolycus, tr. Marcus Dods, in the Ante-Nicene '
               'Fathers (1885), public domain. Source: Wikisource. Chapter → paragraph.')

# slug, display name, wikisource path, shape ('chapters' = one page per chapter,
#          'book' = one page holding all chapters, 'titled' = named subpages), attribution, expected chapters
WORKS = [
    # slug, name, source path (Wikisource unless noted), shape, attribution, expected chapters,
    # optional (url, chapter) to fill a gap the main source has.
    ('tert-apology', 'Tertullian, Apology',
     'Ante-Nicene_Fathers/Volume_III/Apologetic/Apology', 'chapters', TERT_NA_ATTRIB, 50,
     ('https://www.newadvent.org/fathers/0301.htm', 1)),
    ('tert-praxeas', 'Tertullian, Against Praxeas',
     'Ante-Nicene_Fathers/Volume_III/Anti-Marcion/Against_Praxeas', 'chapters', TERT_ATTRIB, 31, None),
    ('tert-baptism', 'Tertullian, On Baptism',
     'Ante-Nicene_Fathers/Volume_III/Ethical/On_Baptism', 'chapters', TERT_ATTRIB, 20, None),
    ('tert-prayer', 'Tertullian, On Prayer',
     'Ante-Nicene_Fathers/Volume_III/Ethical/On_Prayer', 'titled', TERT_ATTRIB, 29, None),
    ('tert-repentance', 'Tertullian, On Repentance',
     'Ante-Nicene_Fathers/Volume_III/Ethical/On_Repentance', 'chapters', TERT_ATTRIB, 12, None),
    ('tert-patience', 'Tertullian, On Patience',
     'Ante-Nicene_Fathers/Volume_III/Ethical/On_Patience', 'chapters', TERT_ATTRIB, 16, None),
    ('tert-resurrection', 'Tertullian, On the Resurrection of the Flesh',
     'Ante-Nicene_Fathers/Volume_III/Anti-Marcion/On_the_Resurrection_of_the_Flesh', 'chapters', TERT_ATTRIB, 63, None),
    ('tert-prescription', 'Tertullian, The Prescription Against Heretics',
     'Ante-Nicene_Fathers/Volume_III/Anti-Marcion/The_Prescription_Against_Heretics', 'chapters', TERT_ATTRIB, 44, None),
    ('tert-jews', 'Tertullian, An Answer to the Jews',
     'Ante-Nicene_Fathers/Volume_III/Apologetic/An_Answer_to_the_Jews', 'titled', TERT_ATTRIB, 14, None),
    ('tert-soul', 'Tertullian, A Treatise on the Soul',
     'Ante-Nicene_Fathers/Volume_III/Apologetic/A_Treatise_on_the_Soul', 'chapters', TERT_ATTRIB, 58, None),
    ('theophilus-1', 'Theophilus, To Autolycus (Book 1)',
     'Ante-Nicene_Fathers/Volume_II/Theophilus_to_Autolycus/Book_I', 'book', THEO_ATTRIB, 14, None),
    ('theophilus-2', 'Theophilus, To Autolycus (Book 2)',
     'Ante-Nicene_Fathers/Volume_II/Theophilus_to_Autolycus/Book_II', 'book', THEO_ATTRIB, 38, None),
    ('theophilus-3', 'Theophilus, To Autolycus (Book 3)',
     'Ante-Nicene_Fathers/Volume_II/Theophilus_to_Autolycus/Book_III', 'book', THEO_ATTRIB, 30, None),
]

ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
# Contents entries come in two spellings even within one volume: "* [[/XIV|XIV]]" (Against
# Praxeas) and "* [[/Chapter XIV|Chapter XIV]]" (the Apology). Both are chapters; Elucidations,
# Postscript and the like are not, and are skipped because they carry no numeral.
SUBPAGE = re.compile(r'\[\[/(?:Chapter\s+)?([IVXLCDM]+)(?:\s*\||\]\])')
# Any titled subpage — used by the 'titled' shape below, where chapters have names not numbers.
TITLED = re.compile(r'\*\s*\[\[/([^\]|]+?)(?:\||\]\])')
# Headings inside a book page, in either markup Wikisource uses for them:
#   Books I-II:  "Chapter I.—Occasion of Writing This Book."
#   Book III:    "== Chapter I.==" with the title bolded on the next line.
HEADING = re.compile(r'(?:^=+\s*)?Chapter\s+([IVXLCDM]+)\s*[.．]?\s*(?:=+\s*$|[——-]+\s*([^\n]*))',
                     re.M)


def roman(s: str) -> int:
    total = prev = 0
    for ch in reversed(s.upper()):
        v = ROMAN[ch]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total


def fetch(path: str, no_cache: bool) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    key = re.sub(r'[^A-Za-z0-9]+', '_', path)[:150]
    cached = CACHE / f'{key}.wiki'
    if cached.exists() and not no_cache:
        return cached.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(BASE + path + '?action=raw', headers={'User-Agent': UA})
    body = urllib.request.urlopen(req, timeout=45, context=SSL_CTX).read().decode('utf-8', 'replace')
    cached.write_text(body, encoding='utf-8')
    time.sleep(0.3)
    return body


def clean(wiki: str) -> str:
    """Wikitext to plain prose, keeping the Greek that lives inside <span lang="EL">."""
    wiki = re.sub(r'(?ims)^\{\{header.*?^\}\}', '', wiki)
    wiki = re.sub(r'(?is)<ref[^>]*>.*?</ref>', '', wiki)      # editors' footnotes, not the text
    wiki = re.sub(r'(?is)<ref[^>]*/>', '', wiki)
    wiki = re.sub(r'\{\{small-caps\|([^{}]*)\}\}', r'\1', wiki)
    for _ in range(3):                                         # templates nest a couple deep
        wiki = re.sub(r'(?s)\{\{[^{}]*\}\}', '', wiki)
    # Some templates CARRY the text rather than decorate it — {{ppoem|…}} wraps quoted verse,
    # and its inner {fine} markers defeat the nested-strip above. Keep the poem, drop the frame.
    wiki = re.sub(r'(?i)\{\{\s*p?poem\s*\|', '', wiki)
    wiki = re.sub(r'\{[a-z/][a-z0-9 /-]*\}', '', wiki)         # {fine}, {smaller} …
    wiki = wiki.replace('{{', '').replace('}}', '')
    # Strip EVERY remaining tag but keep what is inside it. <span lang="EL"> holds the Greek and
    # <b> holds the chapter titles, so dropping tag-and-contents would lose real text; an earlier
    # pass named the tags one by one and silently left <b> in 232 places.
    wiki = re.sub(r'(?s)<[^<>]+>', '', wiki)
    wiki = re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]', r'\1', wiki)
    wiki = re.sub(r'\[\[([^\]]*)\]\]', r'\1', wiki)
    wiki = re.sub(r"''+", '', wiki)
    wiki = html.unescape(wiki)
    wiki = html.unescape(wiki)                                 # some entities are double-encoded
    return wiki


# Blocks that are apparatus rather than text, and are dropped wherever they occur: the rule of
# em dashes between front matter and text, a wiki section heading, a bare roman numeral (the
# volume's part number), and the ANF editors' translator credit.
APPARATUS = re.compile(r'^(?:[—–\-\s]+|=+[^=]*=+|[IVXLCDM]+\.?|\[Translated by[^\]]*\]?)$')


def paragraphs(text: str) -> list[str]:
    out = []
    for block in re.split(r'\n\s*\n', text):
        p = re.sub(r'\s+', ' ', block).strip()
        if len(p) > 1 and not APPARATUS.match(p):
            out.append(p)
    return out


def strip_front_matter(verses: list[str], label: str) -> list[str]:
    """
    Wikisource puts each work's own title page on the SAME page as its first chapter, so
    chapter 1 opens with the work's name, a subtitle and the translator's credit before any
    Tertullian. Front-matter blocks are all short; a chapter of these treatises never opens
    with a sentence of under twenty words. Drop leading short blocks and say which, so the
    heuristic is auditable rather than silent.
    """
    i = 0
    while i < len(verses) and len(verses[i].split()) < 20:
        i += 1
    if i and i < len(verses):
        print(f'  ({label}: dropped {i} front-matter block(s): '
              f'{"; ".join(v[:40] for v in verses[:i])})')
        return verses[i:]
    return verses


def build_chaptered(path: str, no_cache: bool) -> list[dict]:
    """One Wikisource page per chapter, listed on the work's contents page."""
    contents = fetch(path, no_cache)
    seen: dict[int, str] = {}
    for m in re.finditer(r'\[\[/((?:Chapter\s+)?[IVXLCDM]+)(?:\s*\||\]\])', contents):
        label = m.group(1)
        n = roman(label.split()[-1])
        seen.setdefault(n, label)          # keep the exact subpage spelling for the fetch
    chapters = []
    for n in sorted(seen):
        raw = fetch(f'{path}/{seen[n].replace(" ", "_")}', no_cache)
        body = clean(raw)
        body = HEADING.sub('', body, count=1)   # the heading is a title, not the text
        verses = paragraphs(body)
        if n == min(seen):
            verses = strip_front_matter(verses, f'ch {n}')
        if verses:
            chapters.append({'number': n, 'verses': [{'number': i + 1, 'text': t}
                                                     for i, t in enumerate(verses)]})
    return chapters


def build_newadvent(url: str, no_cache: bool) -> list[dict]:
    """
    One HTML page holding the whole work, chapters marked "Chapter 1", "Chapter 2" …
    Used for the Apology, because WIKISOURCE IS MISSING ITS FIRST CHAPTER: there is no
    /Chapter I subpage, and Chapter II's "previous" link points back at the contents page.
    Shipping a famous work without chapter 1 was the alternative, so the whole work comes
    from New Advent instead — the same Roberts-Donaldson translation, complete.
    """
    raw = fetch_url(url, no_cache)
    text = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', raw)
    text = re.sub(r'(?i)<(p|br|div|h[1-6])[^>]*>', '\n\n', text)
    text = html.unescape(re.sub(r'<[^>]+>', '', text))
    marks = list(re.finditer(r'\bChapter\s+(\d+)\b', text))
    chapters = []
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        verses = paragraphs(text[m.end():end])
        if verses:
            chapters.append({'number': int(m.group(1)),
                             'verses': [{'number': j + 1, 'text': v} for j, v in enumerate(verses)]})
    return chapters


def fetch_url(url: str, no_cache: bool) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (re.sub(r'[^A-Za-z0-9]+', '_', url)[:120] + '.html')
    if cached.exists() and not no_cache:
        return cached.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    body = urllib.request.urlopen(req, timeout=45, context=SSL_CTX).read().decode('utf-8', 'replace')
    cached.write_text(body, encoding='utf-8')
    time.sleep(0.3)
    return body


def build_titled(path: str, no_cache: bool) -> list[dict]:
    """
    Subpages named by content rather than numbered — On Prayer is divided into "The First
    Clause", "Recapitulation" and so on. The chapters are numbered here by their order in the
    contents list, which reproduces the standard chapter numbering ONLY if the list is complete
    and in order; main() checks the resulting count against the expected one for that reason.
    """
    contents = fetch(path, no_cache)
    titles, seen = [], set()
    for m in TITLED.finditer(contents):
        t = m.group(1).strip()
        if t not in seen and not re.match(r'(?i)elucidation|appendix|index', t):
            seen.add(t)
            titles.append(t)
    chapters = []
    for i, t in enumerate(titles, start=1):
        body = clean(fetch(f'{path}/{t.replace(" ", "_")}', no_cache))
        verses = paragraphs(body)
        if i == 1:
            verses = strip_front_matter(verses, f'ch 1 ({t[:28]})')
        if verses:
            chapters.append({'number': i, 'title': t,
                             'verses': [{'number': j + 1, 'text': v} for j, v in enumerate(verses)]})
    return chapters


def build_book(path: str, no_cache: bool) -> list[dict]:
    """One page holding every chapter, split on the 'Chapter N.—Title' headings."""
    text = clean(fetch(path, no_cache))
    marks = list(HEADING.finditer(text))
    chapters = []
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        verses = paragraphs(text[m.end():end])
        # Book III marks chapters as "== Chapter I.==" with the title bolded on the next line,
        # so that line arrives here as a short first block. It is a heading, not Theophilus.
        title = m.group(2) or ''
        if verses and len(verses[0].split()) < 12 and not title:
            title, verses = verses[0], verses[1:]
        ch = {'number': roman(m.group(1)),
              'verses': [{'number': j + 1, 'text': t} for j, t in enumerate(verses)]}
        if title.strip():
            ch['title'] = title.strip()
        if verses:
            chapters.append(ch)
    return chapters


def to_roman(n: int) -> str:
    vals = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'),
            (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    out = ''
    for v, s in vals:
        while n >= v:
            out += s
            n -= v
    return out


def main() -> int:
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = True
    print(f'{"slug":20s} {"ch":>4s} {"verses":>7s} {"words":>8s}  check')
    for slug, name, path, shape, attrib, expect, fill in WORKS:
        builder = {'chapters': build_chaptered, 'book': build_book,
                   'titled': build_titled, 'newadvent': build_newadvent}[shape]
        chapters = builder(path, no_cache)
        # Wikisource is missing the Apology's chapter 1 entirely (no subpage; chapter II links
        # back to the contents page). Rather than lose it, or take the whole work from a source
        # that runs each chapter as one 1,000-word block, fill just the gap.
        if fill:
            url, want = fill
            if want not in {c['number'] for c in chapters}:
                got = [c for c in build_newadvent(url, no_cache) if c['number'] == want]
                chapters = sorted(chapters + got, key=lambda c: c['number'])
                print(f'  (filled chapter {want} of {slug} from {url.split("/")[2]})')
        nums = [c['number'] for c in chapters]
        verses = sum(len(c['verses']) for c in chapters)
        words = sum(len(v['text'].split()) for c in chapters for v in c['verses'])
        # A gap or a repeat means a chapter silently vanished into its neighbour, which is the
        # failure mode that looks healthy in a word count. Refuse quietly to no one; say so.
        problems = []
        if not chapters:
            problems.append('NO CHAPTERS')
        elif nums != list(range(1, len(nums) + 1)):
            problems.append(f'non-contiguous {nums[:12]}')
        if verses and words / max(verses, 1) < 12:
            problems.append('suspiciously short paragraphs')
        if len(chapters) != expect:
            problems.append(f'expected {expect} chapters, got {len(chapters)}')
        if problems:
            ok = False
        out = OUT_DIR / f'{slug}.json'
        out.write_text(json.dumps({'work': name, 'attribution': attrib, 'chapters': chapters},
                                  ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'{slug:20s} {len(chapters):4d} {verses:7d} {words:8,d}  '
              f'{"; ".join(problems) if problems else "ok"}')
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
