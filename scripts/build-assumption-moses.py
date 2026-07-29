"""Build the Assumption of Moses (the Testament of Moses) for the Texts library.

WHY THIS WORK
It was absent from the library altogether, and it is the text behind Jude 9 — the dispute
between Michael and the devil over the body of Moses is traced to its lost ending. Students
working on Jude had nothing to open.

SOURCE
R. H. Charles's translation in The Apocrypha and Pseudepigrapha of the Old Testament (1913),
via Wesley Center Online — the same edition and site as our Life of Adam and Eve, 3 Baruch
and Letter of Aristeas, so the library stays internally consistent. Read from the Wayback
Machine; the page is no longer served. The work survives in a single sixth-century Latin
palimpsest and breaks off unfinished in chapter 12, which is why the last chapter ends
"…and by the oath which . . .".

CHAPTER LEVEL ONLY
That page prints each chapter as continuous prose with no verse numbers, so this ships 12
chapters and no verse divisions, and the attribution says so. Ferrar's 1918 SPCK translation
(bound with the Apocalypse of Baruch in archive.org/details/apocalypseofbaru00char) IS verse
divided and was tried first, but its scan renders the chapter numerals unusably — headings
run "XI. I -19." with a Roman I for the range, and chapter VIII cannot be located at all —
so the divisions could not be read out reliably. Clean text at chapter level was the better
trade.

Usage:  python3 scripts/build-assumption-moses.py [--no-cache]     (from the repo root)
"""
import html
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

SNAP = ('http://web.archive.org/web/20070522213423id_/'
        'http://wesley.nnu.edu/biblical_studies/noncanon/ot/pseudo/assumptionofmoses.htm')
CACHE = Path('/tmp/asmos/w.html')
OUT = Path('public/data/pseudepigrapha/assumption-moses.json')

ATTRIBUTION = (
    'The Assumption of Moses (also called the Testament of Moses), translated by R. H. Charles, '
    'The Apocrypha and Pseudepigrapha of the Old Testament (1913), public domain. Source: '
    'Wesley Center Online. That text prints each chapter as continuous prose, so citations '
    'resolve at chapter level. The work survives only in one sixth-century Latin palimpsest '
    'and breaks off unfinished in chapter 12; its lost ending is generally held to lie behind '
    'Jude 9.'
)

FIRST_WORDS = 'The Testament of Moses even the things'
CREDIT = 'Translation adapted from'


def fetch(no_cache):
    if CACHE.exists() and not no_cache:
        return CACHE.read_text(encoding='utf-8', errors='replace')
    try:
        ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
    except Exception:
        ctx = ssl._create_unverified_context()
    req = urllib.request.Request(SNAP, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=90, context=ctx).read().decode('utf-8', 'replace')
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(data, encoding='utf-8')
    return data


def clean(t):
    t = t.replace('�', '')      # the page's mojibake for a soft hyphen (Deutero-nomy)
    t = re.sub(r'\s+', ' ', t)
    return t.strip(' ;,')


def main():
    raw = fetch('--no-cache' in sys.argv)
    x = html.unescape(re.sub(r'<[^>]+>', ' ', raw)).replace('\xa0', ' ')
    x = re.sub(r'[ \t]+', ' ', x)

    start, end = x.find(FIRST_WORDS), x.find(CREDIT)
    if start < 0 or end <= start:
        raise SystemExit('refusing to write: could not locate the translation on the page')
    body = x[start:end]

    # Chapters 2-12 are marked by their number alone on a line; chapter 1 is what precedes
    # the first of them.
    marks, cur = [], 1
    for m in re.finditer(r'\n ?(\d{1,2}) ?\n', body):
        n = int(m.group(1))
        if n == cur + 1 and n <= 12:
            marks.append((n, m.start(), m.end())); cur = n

    chapters = [{'number': 1, 'text': clean(body[:marks[0][1]])}] if marks else []
    for i, (n, _s, e) in enumerate(marks):
        stop = marks[i + 1][1] if i + 1 < len(marks) else len(body)
        chapters.append({'number': n, 'text': clean(body[e:stop])})

    if len(chapters) != 12:
        raise SystemExit(f'refusing to write: parsed {len(chapters)} chapters, expected 12')
    thin = [c['number'] for c in chapters if len(c['text'].split()) < 40]
    if thin:
        raise SystemExit(f'refusing to write: chapters {thin} came out suspiciously short')

    OUT.write_text(json.dumps({
        'work': 'The Assumption of Moses',
        'attribution': ATTRIBUTION,
        'chapters': [{'number': c['number'], 'verses': [{'number': 1, 'text': c['text']}]}
                     for c in chapters],
    }, ensure_ascii=False), encoding='utf-8')

    total = sum(len(c['text'].split()) for c in chapters)
    print(f'{len(chapters)} chapters, {total} words')
    for c in chapters:
        print(f"  ch {c['number']:>2}: {len(c['text'].split()):>4} words — {c['text'][:56]}…")


if __name__ == '__main__':
    main()
