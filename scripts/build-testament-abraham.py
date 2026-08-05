# Builds the Testament of Abraham for the Texts library.
#
# WHY: it carries the fullest judgment scene in Second Temple Jewish literature — a soul weighed
# in the balance, two recording angels, the fiery test — and the Themes "Judgment" page names its
# absence as the reason that page shows verdicts rather than machinery. Nothing else in the
# library supplies the scene.
#
# Text: tr. W. A. Craigie, in the Ante-Nicene Fathers vol. IX (1896) — public domain. Taken from
# Wikisource, which hosts the ANF text as raw wikitext (CCEL serves the same volume but through a
# JavaScript shell that returns navigation rather than text).
#
# TWO RECENSIONS, AND THEY ARE DIFFERENT BOOKS. Version I (the long recension, A) runs to twenty
# chapters; Version II (the short recension, B) to fourteen, with its own plot. Scholars cite them
# apart — "T. Abr. A 12", "T. Abr. B 10" — so they are built as two works rather than merged.
#
# NO VERSE NUMBERS. Craigie's translation is continuous prose divided only into chapters; the
# verse divisions used in modern editions come from the Greek and are not in the public-domain
# English. So each chapter is stored as a single verse and cited by chapter alone. Inventing
# verse numbers here would produce citations that agree with no edition anywhere.
#
# Output: public/data/pseudepigrapha-b/testament-of-abraham-{a,b}.json
# Usage:  python3 scripts/build-testament-abraham.py   (from the repo root)

import html
import json
import re
import sys
import urllib.request
from pathlib import Path

BASE = ('https://en.wikisource.org/wiki/Ante-Nicene_Fathers/Volume_IX/The_Testament_of_Abraham/'
        'The_Testament_of_Abraham/Version_{v}?action=raw')
CACHE = Path('/tmp/tabr_v{v}.wiki')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1'

ATTRIBUTION = (
    'Testament of Abraham, tr. W. A. Craigie, in "The Ante-Nicene Fathers" vol. IX (1896); '
    'public domain. Chapter divisions are Craigie’s; his translation carries no verse '
    'numbers, so passages are cited by chapter. Source: Wikisource.'
)

RECENSIONS = [
    ('I',  'a', 'Testament of Abraham (Recension A)', 20),
    ('II', 'b', 'Testament of Abraham (Recension B)', 14),
]

ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50}


def roman(s: str) -> int:
    total = 0
    for i, ch in enumerate(s):
        v = ROMAN[ch]
        total += -v if i + 1 < len(s) and v < ROMAN[s[i + 1]] else v
    return total


def fetch(version: str) -> str:
    cache = Path(str(CACHE).format(v=version))
    if cache.exists():
        return cache.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(BASE.format(v=version), headers={'User-Agent': UA})
    body = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
    cache.write_text(body, encoding='utf-8')
    return body


def clean(wiki: str) -> str:
    """Wikitext to plain prose."""
    wiki = re.sub(r'(?is)<ref[^>]*>.*?</ref>', '', wiki)      # footnotes: Craigie's notes, not his text
    wiki = re.sub(r'(?is)<ref[^>]*/>', '', wiki)
    wiki = re.sub(r'(?s)^\{\{header.*?\}\}', '', wiki)
    wiki = re.sub(r'(?s)\{\{[^{}]*\}\}', '', wiki)
    wiki = re.sub(r'(?s)^=+\s*Footnotes\s*=+.*$', '', wiki, flags=re.M)
    wiki = re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]', r'\1', wiki)   # [[link|text]] -> text
    wiki = re.sub(r'\[\[([^\]]*)\]\]', r'\1', wiki)
    wiki = re.sub(r"''+", '', wiki)                            # italic/bold markup
    wiki = html.unescape(wiki)
    wiki = wiki.replace('—' * 3, ' ')
    return wiki


def parse(wiki: str, expected: int) -> list[dict]:
    text = clean(wiki)
    # Chapters open with a roman numeral and a full stop, at the start of a line or after a break.
    parts = re.split(r'(?m)(?:^|\n)\s*([IVXL]{1,6})\.\s+', text)
    # THE SOURCE IS OUT OF ORDER. Version II prints its chapters I-VIII, then XII, then IX, X, XI,
    # then XIII, XIV — the numerals are all present and each is used once, but XII sits in the
    # wrong place. A parser that insists the numbers climb by one (the obvious guard against a
    # stray numeral mid-sentence) silently swallows XII, XIII and XIV into their predecessors and
    # loses three chapters while reporting success on the word count. So accept any numeral that
    # is in range and not already used, and SORT at the end; only a repeat is treated as prose.
    seen: dict[int, dict] = {}
    last: dict | None = None
    for i in range(1, len(parts), 2):
        n = roman(parts[i])
        body = re.sub(r'\s+', ' ', parts[i + 1]).strip()
        if not body:
            continue
        if n in seen or not (1 <= n <= expected):
            if last is not None:
                last['verses'][0]['text'] += f' {parts[i]}. {body}'
            continue
        last = {'number': n, 'verses': [{'number': 1, 'text': body}]}
        seen[n] = last
    return [seen[n] for n in sorted(seen)]


def main() -> int:
    ok = True
    for version, slug, name, expected in RECENSIONS:
        chapters = parse(fetch(version), expected)
        out = Path(f'public/data/pseudepigrapha-b/testament-of-abraham-{slug}.json')
        if len(chapters) != expected:
            print(f'{name}: expected {expected} chapters, parsed {len(chapters)} '
                  f'({[c["number"] for c in chapters]})', file=sys.stderr)
            ok = False
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps({
            'work': name, 'attribution': ATTRIBUTION, 'chapters': chapters,
        }, ensure_ascii=False, indent=1), encoding='utf-8')
        words = sum(len(c['verses'][0]['text'].split()) for c in chapters)
        print(f'{out}: {len(chapters)} chapters, {words:,} words')
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
