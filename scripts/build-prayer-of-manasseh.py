# Adds an English translation of the Prayer of Manasseh to the Septuagint Odes.
#
# THE GREEK WAS ALREADY HERE. The Prayer of Manasseh is Ode 12 of the Septuagint Odes, and that
# work has been in the library all along — but Odes has no English side-file, so the prayer could
# not be read by anyone who does not read Greek, and a search of the English index made it look
# absent. (It looked absent to me twice. See the Themes "Repentance" page.)
#
# So this fills the gap rather than adding a work: the English goes into brenton/Odes.json, the
# side-file the LXX reader already consults, exactly as was done for the Psalms of Solomon.
#
# Text: the Authorised (King James) Version of 1611, Apocrypha — public domain — via Wikisource,
# which serves it as raw wikitext with explicit verse markers. The directory is named for the
# mechanism, not the translator: this is the KJV, not Brenton, who did not translate the Odes.
#
# VERSIFICATION CHECKED, NOT ASSUMED. The KJV runs 1-15; the Greek runs 0-15, its verse 0 being
# the superscription "προσευχὴ Μανασση", which the KJV does not translate. Verses 1, 8 and 15
# were compared against the Greek before writing and correspond exactly.
#
# ONLY ODE 12 IS WRITTEN. The other thirteen Odes are canticles quoted from books that already
# have English elsewhere in the library (Exodus 15, Deuteronomy 32, Jonah 2, Habakkuk 3 and so
# on); the Prayer of Manasseh is the one Ode that is not a quotation of canonical text, and so
# the only one with no English anywhere in the collection.
#
# Output: public/data/brenton/Odes.json  (keyed "Odes.12.<verse>")
# Usage:  python3 scripts/build-prayer-of-manasseh.py   (from the repo root)

import html
import json
import re
import sys
import urllib.request
from pathlib import Path

URL = 'https://en.wikisource.org/wiki/Bible_(King_James)/Prayer_of_Manasseh?action=raw'
CACHE = Path('/tmp/manasseh.wiki')
OUT = Path('public/data/brenton/Odes.json')
GREEK = Path('public/data/lxx/Odes_12.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/605.1'

VERSE = re.compile(
    r'\{\{verse\|chapter=1\|verse=(\d+)\}\}<onlyinclude>\{\{\{sec\d+\|(.*?)\}\}\}</onlyinclude>',
    re.S)


def fetch() -> str:
    if CACHE.exists():
        return CACHE.read_text(encoding='utf-8', errors='replace')
    req = urllib.request.Request(URL, headers={'User-Agent': UA})
    body = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
    CACHE.write_text(body, encoding='utf-8')
    return body


def parse(wiki: str) -> dict[int, str]:
    out: dict[int, str] = {}
    for m in VERSE.finditer(wiki):
        text = html.unescape(re.sub(r'\s+', ' ', m.group(2))).strip()
        text = re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]', r'\1', text)   # [[link|text]] -> text
        text = re.sub(r'\[\[([^\]]*)\]\]', r'\1', text)
        # Italic markup. The KJV italicises words with no counterpart in the source — v.13's
        # "''even'' the God of them that repent" — and left in, the quote marks read as scare
        # quotes on a word the translators meant to mark as supplied.
        text = re.sub(r"''+", '', text)
        if text:
            out[int(m.group(1))] = text
    return out


def main() -> int:
    verses = parse(fetch())
    if len(verses) != 15 or sorted(verses) != list(range(1, 16)):
        print(f'expected verses 1-15, got {sorted(verses)}', file=sys.stderr)
        return 1

    # The Greek is already in the library; refuse to write English that does not line up with it.
    greek = {v['verse']: v['text'] for v in json.loads(GREEK.read_text(encoding='utf-8'))['verses']}
    missing = [n for n in verses if n not in greek]
    if missing:
        print(f'English verses with no Greek counterpart: {missing}', file=sys.stderr)
        return 1

    # Merge rather than overwrite: another Ode may gain English later.
    side = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    for n, text in verses.items():
        side[f'Odes.12.{n}'] = text
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(side, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{OUT}: {len(verses)} verses of the Prayer of Manasseh (Ode 12); '
          f'{len(side)} entries in the file')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
