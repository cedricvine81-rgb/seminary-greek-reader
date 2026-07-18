#!/usr/bin/env python3
"""Import Macula Hebrew (WLC) syntax trees → per-book public/data/macula-hebrew/<osisId>.json.

Source: Clear-Bible/macula-hebrew, WLC/lowfat/*.xml (syntax trees over OSHB morphology; CC BY 4.0).
The Hebrew view already renders OSHB word ids "Gen.1.1.1"; Macula's `ref="GEN 1:1!1"` maps 1:1 to
those (both OSHB-based), so this drops in like the Greek Macula syntax (public/data/macula-syntax.json).

Per word we keep the same shape as the Greek Macula:
  { role?, phraseClass?, clauseRule? }
- role:        the word's role in its phrase (s, o, v, adv, pp, …) — from the nearest <wg role=…>
- phraseClass: its phrase type (np, vp, pp, cjp, …) — from the nearest <wg class=…> (not "cl")
- clauseRule:  the enclosing clause's constituent order (e.g. "PP-V-S-O") — from the <wg class="cl" rule=…>

Output: public/data/macula-hebrew/<osisId>.json, keyed by "chapter.verse.word" (book is the filename).

Usage: python3 scripts/import-macula-hebrew-syntax.py
"""
import io
import json
import os
import re
import subprocess
import tarfile
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / 'public' / 'data' / 'macula-hebrew'
TARBALL = 'https://codeload.github.com/Clear-Bible/macula-hebrew/tar.gz/refs/heads/main'

# Macula/Paratext book code → the app's osisId (39 books of the Hebrew Bible).
BOOK = {
    'GEN': 'Gen', 'EXO': 'Exod', 'LEV': 'Lev', 'NUM': 'Num', 'DEU': 'Deut', 'JOS': 'Josh',
    'JDG': 'Judg', 'RUT': 'Ruth', '1SA': '1Sam', '2SA': '2Sam', '1KI': '1Kgs', '2KI': '2Kgs',
    '1CH': '1Chr', '2CH': '2Chr', 'EZR': 'Ezra', 'NEH': 'Neh', 'EST': 'Esth', 'JOB': 'Job',
    'PSA': 'Ps', 'PRO': 'Prov', 'ECC': 'Eccl', 'SNG': 'Song', 'ISA': 'Isa', 'JER': 'Jer',
    'LAM': 'Lam', 'EZK': 'Ezek', 'DAN': 'Dan', 'HOS': 'Hos', 'JOL': 'Joel', 'AMO': 'Amos',
    'OBA': 'Obad', 'JON': 'Jonah', 'MIC': 'Mic', 'NAM': 'Nah', 'HAB': 'Hab', 'ZEP': 'Zeph',
    'HAG': 'Hag', 'ZEC': 'Zech', 'MAL': 'Mal',
}
REF_RE = re.compile(r'([A-Z0-9]+)\s+(\d+):(\d+)!(\d+)')


def fetch_bytes(url: str) -> bytes:
    env = {**os.environ, 'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
    return subprocess.run(['curl', '-sL', url], capture_output=True, env=env).stdout


def parse_chapter(xml_text: str, books: dict) -> int:
    root = ET.fromstring(xml_text)
    parent = {c: p for p in root.iter() for c in p}
    n = 0
    unmapped = set()
    for w in root.iter('w'):
        ref = w.get('ref')
        m = REF_RE.match(ref) if ref else None
        if not m:
            continue
        code, ch, vs, wd = m.groups()
        osis = BOOK.get(code)
        if not osis:
            unmapped.add(code)
            continue
        role = phrase_class = clause_rule = None
        node = w
        while node in parent:
            node = parent[node]
            if node.tag != 'wg':
                continue
            cls = node.get('class')
            if cls == 'cl':
                if clause_rule is None:
                    clause_rule = node.get('rule')
            elif cls:
                if phrase_class is None:
                    phrase_class = cls
                if role is None:
                    role = node.get('role')
        entry = {}
        if role:
            entry['role'] = role
        if phrase_class:
            entry['phraseClass'] = phrase_class
        if clause_rule:
            entry['clauseRule'] = clause_rule
        if entry:
            # Later morphemes of the same word overwrite — the content morpheme's context wins.
            books.setdefault(osis, {})[f'{ch}.{vs}.{wd}'] = entry
            n += 1
    if unmapped:
        print('  ! unmapped book codes:', unmapped)
    return n


def main() -> None:
    print('downloading macula-hebrew tarball…')
    raw = fetch_bytes(TARBALL)
    print(f'  {len(raw) / 1_048_576:.0f} MB; extracting + parsing lowfat trees…')
    books: dict = {}
    total = 0
    with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as tar:
        for member in tar:
            if not member.isfile():
                continue
            if '/WLC/lowfat/' not in member.name or not member.name.endswith('.xml'):
                continue
            f = tar.extractfile(member)
            if not f:
                continue
            total += parse_chapter(f.read().decode('utf-8'), books)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for f in OUT_DIR.glob('*.json'):
        f.unlink()
    size = 0
    for osis, entries in books.items():
        p = OUT_DIR / f'{osis}.json'
        p.write_text(json.dumps(entries, ensure_ascii=False, separators=(',', ':')))
        size += p.stat().st_size
    print(f'Macula Hebrew syntax: {total} words across {len(books)} books '
          f'-> public/data/macula-hebrew/ ({size / 1_048_576:.1f} MB)')


if __name__ == '__main__':
    main()
