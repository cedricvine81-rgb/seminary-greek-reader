#!/usr/bin/env python3
"""Build a compact Hebrew/Aramaic Strong's lexicon for the Reader's parsing pane.

Source: Open Scriptures "A Concise Dictionary of the Words in the Hebrew Bible" (James Strong,
1894), the JSON edition at github.com/openscriptures/strongs — CC BY-SA. It covers Strong's
H1–H8674 (both Hebrew and Aramaic words).

Writes public/data/hebrew-lexicon.json keyed by the *numeric* Strong's number (no "H" prefix,
matching the `strongs` field on each word in public/data/mt/*.json), each entry:
  { lemma, xlit, gloss, def }
- lemma: pointed dictionary form (e.g. אֱלֹהִים)
- xlit:  transliteration (e.g. ʼĕlôhîym)
- gloss: a short sense, the first clause of Strong's concise definition
- def:   Strong's full concise definition

Attribution (CC BY-SA): Open Scriptures, strongs-hebrew-dictionary, derived from James Strong's
public-domain dictionary; https://github.com/openscriptures/strongs .

Usage: python3 scripts/build-hebrew-lexicon.py
"""
import json
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / 'public' / 'data' / 'hebrew-lexicon.json'
URL = 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js'


def fetch(url: str) -> str:
    # The system curl needs the real CA bundle (the anaconda one is stale); see the
    # network-SSL note in project memory.
    env = {'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
    return subprocess.run(
        ['curl', '-s', url], capture_output=True, text=True, env={**__import__('os').environ, **env}
    ).stdout


def short_gloss(strongs_def: str) -> str:
    """First sense of the concise definition — up to the first ';' (or a comma if that first
    clause is still long), with Strong's inline markup removed."""
    s = strongs_def
    s = re.sub(r'\[idiom\]\s*', '', s)          # "[idiom]" markers
    s = re.sub(r'\(literally[^)]*\)', '', s)     # parenthetical "literally …" asides
    s = s.replace('×', '').strip()
    first = s.split(';')[0].strip()
    if len(first) > 60:
        first = first.split(',')[0].strip()
    return first or s.strip()


def clean(s: str) -> str:
    s = re.sub(r'\[idiom\]\s*', '', s)
    s = s.replace('×', '').strip()
    return re.sub(r'\s+', ' ', s)


def main() -> None:
    raw = fetch(URL)
    m = re.search(r'\{.*\}', raw, re.S)          # the object literal in the .js module
    if not m:
        raise SystemExit('could not locate the dictionary object in the source')
    data = json.loads(m.group(0))

    out: dict[str, dict[str, str]] = {}
    for key, entry in data.items():
        num = key[1:] if key.startswith('H') else key   # "H430" -> "430"
        sdef = clean(entry.get('strongs_def', '') or '')
        out[num] = {
            'lemma': entry.get('lemma', ''),
            'xlit': entry.get('xlit', ''),
            'gloss': short_gloss(sdef) if sdef else '',
            'def': sdef,
        }

    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    size_mb = OUT.stat().st_size / 1_048_576
    print(f'Hebrew lexicon: {len(out)} entries -> public/data/hebrew-lexicon.json ({size_mb:.1f} MB)')


if __name__ == '__main__':
    main()
