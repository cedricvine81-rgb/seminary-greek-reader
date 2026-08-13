#!/usr/bin/env python3
"""Builds NESTED phrase/clause syntax trees for the HEBREW BIBLE from the Macula Hebrew
lowfat XML (Clear-Bible/macula-hebrew, WLC/lowfat/*.xml, CC BY 4.0) — the Hebrew sibling of
scripts/import-macula-phrase-tree.js, emitting the identical JSON shape into the same
directory, so the Phrase Explorer loads OT and NT books through one code path.

Notes on the source (which is richer than the Greek):
  • One file per chapter (932 files), named NN-<osisId>-CCC-lowfat.xml — the osisIds match
    the app's exactly, so no book mapping is needed beyond the filename.
  • Hebrew lowfat splits words into MORPHEMES: בְּרֵאשִׁית is two <w> elements (בְּ + רֵאשִׁית)
    sharing ref="GEN 1:1!1". They are kept as separate leaves on purpose — the preposition
    genuinely belongs to the PP node and the noun to the NP inside it; that morpheme-level
    syntax is the point of a phrasing view. Their shared id just means two leaves point at
    the same Reader word.
  • Each <w> carries an English gloss, the OSHB morph code, lemma and Strong's — so the
    word-detail panel needs no side lookups (the Greek view joins BSB alignment for this).
  • The parsing label is decoded from the OSHB code with the same tables as
    src/lib/hebrew-morph.ts, so the label matches the Reader's parsing pane word for word.

Download is the whole-repo tarball, like import-macula-hebrew-syntax.py — 932 raw fetches
would be slower and rate-limited.

Attribution required by CC BY 4.0 (carried in every output file):
  "MACULA Hebrew Linguistic Datasets, available at
   https://github.com/Clear-Bible/macula-hebrew/"

Usage:  python3 scripts/import-macula-hebrew-phrase-tree.py
"""
import io
import json
import os
import re
import subprocess
import tarfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / 'public' / 'data' / 'phrase-tree'
TARBALL = 'https://codeload.github.com/Clear-Bible/macula-hebrew/tar.gz/refs/heads/main'
ATTRIBUTION = 'MACULA Hebrew Linguistic Datasets (CC BY 4.0), https://github.com/Clear-Bible/macula-hebrew/'

# Macula/Paratext code inside ref="GEN 1:1!1" → osisId (same table as the syntax importer).
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
FNAME_RE = re.compile(r'/WLC/lowfat/(\d+)-([1-9A-Za-z]+)-(\d+)-lowfat\.xml$')

# ── OSHB code → traditional label (mirror of src/lib/hebrew-morph.ts) ─────────────
GENDER = {'m': 'Masculine', 'f': 'Feminine', 'b': 'Both', 'c': 'Common'}
NUMBER = {'s': 'Singular', 'p': 'Plural', 'd': 'Dual'}
STATE = {'a': 'Absolute', 'c': 'Construct', 'd': 'Determined'}
PERSON = {'1': '1st person', '2': '2nd person', '3': '3rd person'}
STEM = {
    'q': 'Qal', 'N': 'Niphal', 'p': 'Piel', 'P': 'Pual', 'h': 'Hiphil', 'H': 'Hophal',
    't': 'Hithpael', 'Q': 'Qal passive', 'o': 'Polel', 'O': 'Polal', 'r': 'Poel',
    'R': 'Poal', 'm': 'Polel', 'M': 'Polal', 'k': 'Palel', 'K': 'Palal', 'l': 'Pilpel',
    'L': 'Polpal', 'f': 'Hithpalpel', 'D': 'Nithpael', 'j': 'Pealal', 'i': 'Pilel',
    'u': 'Hothpaal', 'c': 'Tiphil', 'v': 'Hishtaphel', 'w': 'Nithpalel', 'y': 'Nithpael',
    'z': 'Hithpoel', 'Z': 'Nithpoel',
}
CONJ = {
    'p': 'Perfect', 'q': 'Sequential perfect', 'i': 'Imperfect', 'w': 'Sequential imperfect',
    'h': 'Cohortative', 'j': 'Jussive', 'v': 'Imperative',
    'a': 'Infinitive absolute', 'c': 'Infinitive construct',
    'r': 'Active participle', 's': 'Passive participle',
}
POS1 = {
    'V': 'Verb', 'N': 'Noun', 'A': 'Adjective', 'P': 'Pronoun', 'R': 'Preposition',
    'C': 'Conjunction', 'D': 'Adverb', 'T': 'Particle', 'S': 'Suffix',
}


def parsing_label(code: str) -> str:
    """Vqp3ms → "Verb, Qal, Perfect, 3rd person, Masculine, Singular" — the app's vocabulary."""
    if not code:
        return ''
    c0 = code[0]
    parts = [POS1.get(c0, '')]
    if c0 == 'V' and len(code) >= 3:
        parts += [STEM.get(code[1], ''), CONJ.get(code[2], '')]
        rest = code[3:]
        conj = CONJ.get(code[2], '')
        if conj in ('Active participle', 'Passive participle'):
            if len(rest) >= 2:
                parts += [GENDER.get(rest[0], ''), NUMBER.get(rest[1], '')]
            if len(rest) >= 3:
                parts.append(STATE.get(rest[2], ''))
        elif not conj.startswith('Infinitive') and len(rest) >= 3:
            parts += [PERSON.get(rest[0], ''), GENDER.get(rest[1], ''), NUMBER.get(rest[2], '')]
    elif c0 in ('N', 'A'):
        rest = code[2:]
        if len(rest) >= 2:
            parts += [GENDER.get(rest[0], ''), NUMBER.get(rest[1], '')]
        if len(rest) >= 3:
            parts.append(STATE.get(rest[2], ''))
    elif c0 == 'P':
        rest = code[2:]
        if len(rest) >= 3 and rest[0] in PERSON:
            parts += [PERSON.get(rest[0], ''), GENDER.get(rest[1], ''), NUMBER.get(rest[2], '')]
        elif len(rest) >= 2:
            parts += [GENDER.get(rest[0], ''), NUMBER.get(rest[1], '')]
    return ', '.join(p for p in parts if p)


def word_leaf(w: ET.Element, stats: dict):
    ref = w.get('ref') or ''
    m = REF_RE.match(ref)
    if not m:
        return None
    code, ch, vs, wd = m.groups()
    osis = BOOK.get(code)
    if not osis:
        return None
    stats['chapter'] = int(ch)
    stats['minV'] = min(stats['minV'], int(vs))
    stats['maxV'] = max(stats['maxV'], int(vs))
    morph = w.get('morph') or ''
    leaf = {'t': 'w', 'id': f'{osis}.{ch}.{vs}.{wd}', 'w': (w.text or '').strip()}
    # `english` is the running-text gloss ("created"); `gloss` is the interlinear one with
    # joiner dots ("he.created") — prefer the former, fall back to the latter cleaned up.
    gloss = w.get('english') or (w.get('gloss') or '').replace('.', ' ')
    for k, v in (
        ('gloss', gloss), ('lemma', w.get('lemma')), ('morph', morph),
        ('role', w.get('role')), ('cls', w.get('class')),
        ('strongs', (w.get('strongnumberx') or '').lstrip('0')),
        ('parsing', parsing_label(morph)),
    ):
        if v:
            leaf[k] = v
    return leaf


def build_node(el: ET.Element, stats: dict):
    if el.tag == 'w':
        return word_leaf(el, stats)
    if el.tag != 'wg':
        return None  # <p>, <milestone> — the plain-text rendering of the sentence
    node = {'t': 'g', 'c': []}
    for k, attr in (('cls', 'class'), ('role', 'role'), ('rule', 'rule')):
        v = el.get(attr)
        if v:
            node[k] = v
    for child in el:
        built = build_node(child, stats)
        if built:
            node['c'].append(built)
    return node if node['c'] else None


def parse_chapter(xml_text: str):
    root = ET.fromstring(xml_text)
    out = []
    for sent in root.iter('sentence'):
        stats = {'chapter': None, 'minV': 10 ** 9, 'maxV': -1}
        tree = {'t': 'g', 'c': []}
        for child in sent:
            built = build_node(child, stats)
            if built:
                tree['c'].append(built)
        if tree['c'] and stats['chapter'] is not None:
            out.append((stats['chapter'], stats['minV'], stats['maxV'], tree))
    return out


def main():
    print('downloading macula-hebrew tarball…')
    env = {**os.environ, 'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
    raw = subprocess.run(['curl', '-sL', TARBALL], capture_output=True, env=env).stdout
    print(f'  {len(raw) / 1_048_576:.0f} MB; parsing lowfat trees…')

    # (book order NN, chapter) → sentences, so output order is canonical.
    chapters = []
    with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as tar:
        for member in tar:
            m = FNAME_RE.search(member.name)
            if not m or not member.isfile():
                continue
            f = tar.extractfile(member)
            if not f:
                continue
            chapters.append((int(m.group(1)), m.group(2), int(m.group(3)), f.read().decode('utf-8')))
    chapters.sort(key=lambda x: (x[0], x[2]))

    # Key each book by the osisId derived from its own word refs, NOT the filename segment:
    # the filenames use Paratext-ish codes (Exo, Jol, HOS…) that differ from the app's ids
    # for 26 of the 39 books — and on macOS's case-insensitive filesystem HOS.json vs
    # Hos.json is the SAME file, which once silently destroyed Hosea in a rename.
    def leaf_osis(tree):
        if tree['t'] == 'w':
            return tree['id'].split('.')[0]
        for c in tree['c']:
            r = leaf_osis(c)
            if r:
                return r
        return None

    books = defaultdict(list)
    for _, _, _, xml_text in chapters:
        sents = parse_chapter(xml_text)
        if not sents:
            continue
        osis = leaf_osis(sents[0][3])
        books[osis].extend(sents)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for osis, sents in books.items():
        out = {
            'book': osis,
            'attribution': ATTRIBUTION,
            'sentences': [
                {
                    'chapter': ch,
                    'startVerse': mn,
                    'endVerse': mx,
                    'ref': f'{osis} {ch}:{mn}' if mn == mx else f'{osis} {ch}:{mn}–{mx}',
                    'tree': tree,
                }
                for ch, mn, mx, tree in sents
            ],
        }
        dest = OUT_DIR / f'{osis}.json'
        dest.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
        size = dest.stat().st_size
        total += size
        print(f'  {osis}: {len(sents)} sentences, {size / 1024:.0f} KB')
    print(f'Total: {total / 1_048_576:.1f} MB across {len(books)} books')


if __name__ == '__main__':
    main()
