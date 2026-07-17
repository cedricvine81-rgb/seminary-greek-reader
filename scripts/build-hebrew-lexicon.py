#!/usr/bin/env python3
"""Build a compact Hebrew/Aramaic lexicon for the Reader's parsing pane and word menu.

Two public-domain sources, merged and keyed by the *numeric* Strong's number (no "H" prefix,
matching the `strongs` field on each word in public/data/mt/*.json):

1. Strong's "A Concise Dictionary of the Words in the Hebrew Bible" (James Strong, 1894), the
   JSON edition at github.com/openscriptures/strongs — CC BY-SA. Covers H1–H8674. Gives the
   short `gloss` (quick parsing pane) and concise `def`.

2. Brown-Driver-Briggs (BDB, 1906) — the scholarly standard — via the Open Scriptures
   HebrewLexicon project (github.com/openscriptures/HebrewLexicon, BDB text public domain,
   project files CC BY 4.0). LexicalIndex.xml bridges Strong's number ↔ BDB entry id; the
   BDB entry text (sense hierarchy) becomes `bdb`, shown as the fuller entry in the word menu.

Each output entry: { lemma, xlit, gloss, def, bdb? }.

Usage: python3 scripts/build-hebrew-lexicon.py
"""
import json
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / 'public' / 'data' / 'hebrew-lexicon.json'
URL = 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js'
BDB_BASE = 'https://raw.githubusercontent.com/openscriptures/HebrewLexicon/master'
NS = '{http://openscriptures.github.com/morphhb/namespace}'
BDB_CAP = 1500   # cap the (few) huge verb entries so the word-menu popup stays usable


def fetch(url: str) -> str:
    # The system curl needs the real CA bundle (the anaconda one is stale); see the
    # network-SSL note in project memory.
    env = {'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
    return subprocess.run(
        ['curl', '-s', url], capture_output=True, text=True, env={**os.environ, **env}
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


def _local(tag: str) -> str:
    return tag.split('}')[-1]


def _bdb_entry_text(el: ET.Element) -> str:
    """Readable text of a BDB <entry>: flatten the mixed markup, number the <sense>s, and drop
    the editorial <status> tags. Keeps the Hebrew headword, POS, glosses and verse refs."""
    parts: list[str] = []

    def walk(node: ET.Element) -> None:
        if _local(node.tag) == 'status':
            if node.tail:
                parts.append(node.tail)
            return
        if node.text:
            parts.append(node.text)
        for child in node:
            if _local(child.tag) == 'sense':
                n = child.get('n')
                parts.append(f' {n}. ' if n else ' ')
            walk(child)
        if node.tail:
            parts.append(node.tail)

    if el.text:
        parts.append(el.text)
    for child in el:
        if _local(child.tag) == 'sense':
            n = child.get('n')
            parts.append(f' {n}. ' if n else ' ')
        walk(child)

    s = re.sub(r'\s+', ' ', ''.join(parts)).strip()
    # Drop the bare occurrence-count number BDB prints right after the headword ("אָב 1101 n.m.").
    s = re.sub(r'^(\S+)\s+\d+\b', r'\1', s)
    if len(s) > BDB_CAP:
        cut = s.rfind(' ', 0, BDB_CAP)
        s = s[:cut if cut > 0 else BDB_CAP].rstrip() + '…'
    return s


def load_bdb() -> dict[str, str]:
    """Return { strong_number -> BDB entry text }, via LexicalIndex's strong↔bdb mapping."""
    idx = ET.fromstring(fetch(f'{BDB_BASE}/LexicalIndex.xml'))
    strong_to_bdb: dict[str, str] = {}
    for entry in idx.iter(f'{NS}entry'):
        xref = entry.find(f'{NS}xref')
        if xref is None:
            continue
        strong, bdb_id, aug = xref.get('strong'), xref.get('bdb'), xref.get('aug')
        if not (strong and bdb_id):
            continue
        # A Strong's number can cover several BDB homographs, disambiguated by `aug` (a, b, …).
        # Prefer the primary 'a' entry (e.g. H2617 → חֶסֶד "goodness", not the rare "shame").
        if strong not in strong_to_bdb or aug == 'a':
            strong_to_bdb[strong] = bdb_id

    lex = ET.fromstring(fetch(f'{BDB_BASE}/BrownDriverBriggs.xml'))
    bdb_text: dict[str, str] = {}
    for entry in lex.iter(f'{NS}entry'):
        eid = entry.get('id')
        if eid:
            bdb_text[eid] = _bdb_entry_text(entry)

    out = {num: bdb_text[bid] for num, bid in strong_to_bdb.items() if bdb_text.get(bid)}
    return out


def main() -> None:
    raw = fetch(URL)
    m = re.search(r'\{.*\}', raw, re.S)          # the object literal in the .js module
    if not m:
        raise SystemExit('could not locate the dictionary object in the source')
    data = json.loads(m.group(0))

    bdb = load_bdb()

    out: dict[str, dict[str, str]] = {}
    for key, entry in data.items():
        num = key[1:] if key.startswith('H') else key   # "H430" -> "430"
        sdef = clean(entry.get('strongs_def', '') or '')
        rec = {
            'lemma': entry.get('lemma', ''),
            'xlit': entry.get('xlit', ''),
            'gloss': short_gloss(sdef) if sdef else '',
            'def': sdef,
        }
        if num in bdb:
            rec['bdb'] = bdb[num]
        out[num] = rec

    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    size_mb = OUT.stat().st_size / 1_048_576
    with_bdb = sum(1 for r in out.values() if r.get('bdb'))
    print(f'Hebrew lexicon: {len(out)} entries ({with_bdb} with BDB) '
          f'-> public/data/hebrew-lexicon.json ({size_mb:.1f} MB)')


if __name__ == '__main__':
    main()
