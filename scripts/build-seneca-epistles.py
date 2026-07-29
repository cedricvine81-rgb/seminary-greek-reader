"""Build Seneca's Moral Letters to Lucilius (Epistulae morales) for the Texts library.

WHY THIS WORK
It is the single largest gap in the Backgrounds apparatus: 42 cross-references point at
Seneca's Epistles and none of them opened anything. Seneca is the closest thing we have to a
contemporary moral-philosophical foil for Paul, and the Epistles are what the commentaries
actually cite.

WHY NOT PERSEUS
The Perseus canonical-latinLit corpus was checked first, since our other Greco-Roman texts
come from there and its importer already exists. It carries the Latin of the Epistles but no
English translation — of Seneca's fourteen works in that repo, only the Apocolocyntosis has
one, and nobody cites it. De Ira and De Beneficiis are the same story. So Perseus could give
students a Latin text they cannot read, and nothing else.

SOURCE AND PROVENANCE
Richard Mott Gummere's translation, Loeb Classical Library — volume 1 (1917), volume 2
(1920), volume 3 (1925) — via Wikisource, which states: "This work is in the public domain in
the United States because it was published before January 1, 1931." Gummere died in 1969.
All 124 letters are present with no gaps. Provenance was established BEFORE building, which
is the rule this library follows after the Picard incident: a translation is not usable
merely because it is online.

WHY WIKISOURCE RATHER THAN A SCAN
Sections are explicitly marked up there — <span class="wst-verse" id="5."> — so the citation
unit is read from the markup instead of being guessed at from numerals in prose. That removes
the whole class of error that made the Testaments and the Life of Adam and Eve laborious:
no numeral in the text can be mistaken for a section marker, and none can be missed.

ADDRESSING
Chapter = letter (1-124), verse = Loeb section, matching how the citations are written
("Seneca, Ep. 76.23"). Gummere's footnotes are editorial apparatus and are dropped; the
reading text is the translation itself.

Usage:  python3 scripts/build-seneca-epistles.py [--no-cache]     (from the repo root)
"""
import html
import json
import re
import ssl
import sys
import time
import urllib.request
from pathlib import Path

API = ('https://en.wikisource.org/w/api.php?action=parse&prop=text&format=json&formatversion=2'
       '&page=Moral_letters_to_Lucilius/Letter_')
# Titles come from the contents page, not from each letter's own heading: on the letter pages
# the heading sits amid a block of inlined CSS that defeats tag-stripping, and guessing at it
# produced "On Saving Time G". The contents page lists them cleanly, once, for all 124.
INDEX = ('https://en.wikisource.org/w/api.php?action=parse&prop=text&format=json&formatversion=2'
         '&page=Moral_letters_to_Lucilius')
CACHE = Path('/tmp/seneca/pages')
OUT = Path('public/data/greco/seneca-epistles.json')
LETTERS = 124

ATTRIBUTION = (
    'Seneca, Moral Letters to Lucilius (Epistulae morales ad Lucilium), translated by Richard '
    'Mott Gummere, Loeb Classical Library, volumes 1-3 (1917, 1920, 1925), public domain. '
    'Source: Wikisource. Cited by letter and Loeb section (e.g. Ep. 76.23); Gummere’s '
    'footnotes are omitted.'
)

# The section marker Wikisource wraps every Loeb section number in.
VERSE = re.compile(r'<span[^>]*class="[^"]*wst-verse[^"]*"[^>]*id="(\d+)\.?"[^>]*>.*?</span>', re.S)
# Footnote apparatus: the [1] markers, their texts, and the reference list at the foot.
NOTES = [
    re.compile(r'(?is)<sup[^>]*class="reference"[^>]*>.*?</sup>'),
    re.compile(r'(?is)<span[^>]*class="reference-text"[^>]*>.*?</span>'),
    re.compile(r'(?is)<ol[^>]*class="references"[^>]*>.*?</ol>'),
    re.compile(r'(?is)<div[^>]*class="[^"]*reflist[^"]*"[^>]*>.*?</div>'),
    re.compile(r'(?is)<style[^>]*>.*?</style>'),
    re.compile(r'(?is)<table[^>]*class="[^"]*(?:header|ws-noexport)[^"]*"[^>]*>.*?</table>'),
]


# Wikimedia asks API clients to identify themselves and to back off rather than hammer.
UA = 'seminary-greek-reader/1.0 (https://seminarygreek.app) python-urllib'


def fetch_url(url, f, no_cache):
    if f.exists() and not no_cache:
        return f.read_text(encoding='utf-8')
    try:
        ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
    except Exception:
        ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    delay = 2.0
    for attempt in range(6):
        try:
            data = urllib.request.urlopen(req, timeout=90, context=ctx).read().decode('utf-8', 'replace')
            break
        except urllib.error.HTTPError as e:
            # 429 is a throttle, not a failure: wait longer each time rather than give up
            # halfway through 124 pages and leave a partial cache.
            if e.code not in (429, 503) or attempt == 5:
                raise
            time.sleep(delay)
            delay *= 2
    CACHE.mkdir(parents=True, exist_ok=True)
    f.write_text(data, encoding='utf-8')
    time.sleep(1.0)      # be polite to Wikisource
    return data


def fetch(n, no_cache):
    return fetch_url(API + str(n), CACHE / f'{n}.json', no_cache)


def clean(fragment):
    for pat in NOTES:
        fragment = pat.sub(' ', fragment)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', fragment)).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', t).strip()


# Keep "of"/"the"/"on" lowercase inside a title, and — unlike str.title() — leave the letter
# after an apostrophe alone, so "THE PHILOSOPHER’S MEAN" does not become "Philosopher’S".
SMALL = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'}


def titlecase(s):
    out = []
    for i, w in enumerate(s.lower().split()):
        out.append(w if i and w in SMALL else (w[:1].upper() + w[1:]))
    return ' '.join(out)


ROMAN_ONLY = re.compile(r'[IVXLC]+\.?')


def letter_titles(no_cache):
    """Letter number -> title, read from the contents page.

    Each row is two links: the Roman numeral, then the title in capitals. The pairing is by
    POSITION rather than by href, because one row on that page is mis-linked — row 103's
    title cell points at Letter 104. Keying on the href would leave 103 untitled and hand
    103's title ("On the Dangers of Association with our Fellow-Men") to 104, whose own row
    is fine. Position is what the page actually means, and it is right for all 124.
    """
    raw = fetch_url(INDEX, CACHE / 'index.json', no_cache)
    body = json.loads(raw)['parse']['text']
    links = [(int(n), html.unescape(t).strip()) for n, t in
             re.findall(r'/wiki/Moral_letters_to_Lucilius/Letter_(\d{1,3})"[^>]*>([^<]{0,90})<', body)]

    titles, i = {}, 0
    while i < len(links) - 1:
        (num, first), (_, second) = links[i], links[i + 1]
        if ROMAN_ONLY.fullmatch(first) and not ROMAN_ONLY.fullmatch(second) and len(second) > 3:
            titles.setdefault(num, titlecase(second))
            i += 2
        else:
            i += 1
    return titles


def parse(n, raw):
    body = json.loads(raw)['parse']['text']
    # The reading text starts at the first section marker; everything before is navigation.
    if not VERSE.search(body):
        raise SystemExit(f'refusing to write: letter {n} has no section markers')

    sections, marks = {}, list(VERSE.finditer(body))
    for i, m in enumerate(marks):
        num = int(m.group(1))
        stop = marks[i + 1].start() if i + 1 < len(marks) else len(body)
        txt = clean(body[m.end():stop])
        if txt:
            sections.setdefault(num, txt)
    return sections


def main():
    no_cache = '--no-cache' in sys.argv
    titles = letter_titles(no_cache)
    missing = [n for n in range(1, LETTERS + 1) if n not in titles]
    if missing:
        raise SystemExit(f'refusing to write: no title found for letters {missing}')

    chapters, thin = [], []
    for n in range(1, LETTERS + 1):
        sections = parse(n, fetch(n, no_cache))
        title = titles[n]
        nums = sorted(sections)
        if not nums:
            raise SystemExit(f'refusing to write: letter {n} parsed no sections')
        # Sections are printed as a rising run from 1; a break means the markup changed shape
        # and the letter should be looked at rather than silently shipped.
        if nums != list(range(1, len(nums) + 1)):
            raise SystemExit(f'refusing to write: letter {n} sections are not 1..n — got {nums}')
        words = sum(len(s.split()) for s in sections.values())
        if words < 40:
            thin.append(n)
        chapters.append({
            'number': n,
            'title': title,
            'verses': [{'number': v, 'text': sections[v]} for v in nums],
        })

    if len(chapters) != LETTERS:
        raise SystemExit(f'refusing to write: {len(chapters)} letters, expected {LETTERS}')
    if thin:
        raise SystemExit(f'refusing to write: letters {thin} came out suspiciously short')

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'work': 'Seneca, Moral Letters to Lucilius',
        'attribution': ATTRIBUTION,
        'chapters': chapters,
    }, ensure_ascii=False), encoding='utf-8')

    total = sum(len(c['verses']) for c in chapters)
    words = sum(len(v['text'].split()) for c in chapters for v in c['verses'])
    print(f'{len(chapters)} letters, {total} sections, {words:,} words')
    for n in (1, 41, 76, 124):
        c = chapters[n - 1]
        print(f"  Ep. {n}: {len(c['verses'])} sections — {c['title']!r}")
        print(f"      {c['verses'][0]['text'][:88]}")


if __name__ == '__main__':
    main()
