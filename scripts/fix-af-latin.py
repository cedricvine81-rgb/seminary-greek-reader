"""Turn the Latin that hides in the Apostolic Fathers' `greek` field back into Latin.

Polycarp's Greek breaks off after ch. 9 (and 13) and the Shepherd of Hermas' after 107:4:
chapters 10-12 + 14 of Polycarp and 107:5 + 109-114 of Hermas survive ONLY in a Latin version.
The First1KGreek TEI we ingest stores that Latin TRANSLITERATED INTO GREEK LETTERS, so
build-apostolic-fathers-greek.py copies it into `greek` verbatim and the reader shows

    ιν ηις εργο στατε ετ δομινι εχεμπλαρ σεquιμινι      (Polycarp 10:1)

which is "in his ergo state et domini exemplar sequimini" — nonsense as Greek, and nothing
tells the reader it is Latin. This script reverses the transliteration and marks each affected
verse `"lang": "la"` so the reader can label and render it as Latin instead of parsing it as
Greek. Idempotent: once a verse holds real Latin letters the detector no longer matches it.

Usage:  python3 scripts/fix-af-latin.py [--write]   (run from the repo root; dry-run by default)
"""
import json
import re
import sys
from pathlib import Path

DATA = Path('public/data/apostolic-fathers')

# The upstream mapping is one Greek letter per Latin letter; ϝ (digamma) stands in for v,
# ξ for c, χ for x, ψ for y, and Ω for a capital V. "qu" arrives as a literal "#3υ" or "θυ".
MAP = {'α': 'a', 'β': 'b', 'ξ': 'c', 'δ': 'd', 'ε': 'e', 'φ': 'f', 'γ': 'g', 'η': 'h', 'ι': 'i',
       'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's',
       'τ': 't', 'υ': 'u', 'ϝ': 'v', 'χ': 'x', 'ψ': 'y', 'ζ': 'z', 'ë': 'e', 'Ω': 'V',
       'Α': 'A', 'Β': 'B', 'Ξ': 'C', 'Δ': 'D', 'Ε': 'E', 'Η': 'H', 'Ι': 'I', 'Μ': 'M',
       'Ν': 'N', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'U'}

# NB: list the accented characters one by one. Written as a RANGE, 'ά-ώ' silently spans
# U+03AC-U+03CE, i.e. every plain Greek letter, and the detector then matches nothing.
ACCENTED = re.compile('[\u1F00-\u1FFF\u0386\u0388\u0389\u038A\u038C\u038E\u038F'
                      '\u0390\u03AC\u03AD\u03AE\u03AF\u03B0\u03CA\u03CB\u03CC\u03CD\u03CE]')
LATIN_WORD = re.compile(r'(?<![α-ωΑ-Ω])(ετ|ιν|εστ|νον|υτ|ϝος|ϝοβις|qυι|qυαε|ενιμ|αυτεμ|εργο|σιξυτ|ομνιβυς|δομινι|δομινυμ)(?![α-ωΑ-Ω])')


def looks_transliterated(s: str) -> bool:
    """Greek-lettered Latin: no polytonic accents anywhere, and Latin function words."""
    if ACCENTED.search(s):
        return False
    probe = s.replace('#3υ', 'qυ').replace('θυ', 'qυ')
    return '#3υ' in s or len(LATIN_WORD.findall(probe)) >= 2


def decode(s: str) -> str:
    s = s.replace('#3υ', 'qu').replace('θυ', 'qu').replace('#3', 'qu')
    return ''.join(MAP.get(ch, ch) for ch in s)


def split_tail(s: str):
    """Some verses are Greek with a Latin sentence bolted on (Polycarp 13:2). Return
    (greek_head, latin_tail) if a trailing run of sentences is transliterated Latin."""
    parts = re.split(r'(?<=[.;·])\s+', s)
    for i in range(len(parts)):
        tail = ' '.join(parts[i:])
        if looks_transliterated(tail) and i > 0:
            return ' '.join(parts[:i]), tail
    return s, ''


# Where the Greek runs out mid-verse the two languages interleave in any order: Latin first
# then Greek (Hermas 107:3, 113:3), Greek first then Latin (107:4), and — in 107:3 and 113:5 —
# the switch falls INSIDE a sentence, after a comma or a colon. split_tail() sees only the
# trailing case, so mixed verses need a pass that classifies each chunk on its own.
CHUNK = re.compile(r'(?<=[.;:·])\s+')


def _decode_leading_run(chunk: str) -> str:
    """`chunk` carries real Greek, but may OPEN with a transliterated Latin run."""
    toks = chunk.split(' ')
    k = next((i for i, t in enumerate(toks) if ACCENTED.search(t)), None)
    if k is None or k < 3:
        return chunk
    head = ' '.join(toks[:k])
    if not looks_transliterated(head):
        return chunk
    return decode(head) + ' ' + ' '.join(toks[k:])


def fix_mixed(s: str) -> str:
    """Decode every transliterated stretch of a verse that is part Latin, part Greek.
    Returns `s` unchanged unless at least one chunk is unmistakably Latin, so a verse of
    plain Greek — accents or not — is never touched."""
    parts = CHUNK.split(s)
    if not any(looks_transliterated(p) for p in parts):
        return s
    return ' '.join(decode(p) if not ACCENTED.search(p) else _decode_leading_run(p)
                    for p in parts)


def main() -> None:
    write = '--write' in sys.argv
    whole = partial = 0
    for path in sorted(DATA.glob('*.json')):
        if path.name.endswith('.morph.json'):
            continue
        doc = json.load(path.open())
        touched = False
        for ch in doc['chapters']:
            for v in ch['verses']:
                g = (v.get('greek') or '').strip()
                if not g:
                    continue
                if looks_transliterated(g):
                    v['greek'] = decode(g)
                    v['lang'] = 'la'
                    whole += 1
                    touched = True
                    print(f'  {path.stem:10s} {ch["number"]}:{v["number"]}  LATIN  {v["greek"][:64]}…')
                else:
                    mixed = fix_mixed(g)
                    if mixed != g:
                        v['greek'] = mixed
                        partial += 1
                        touched = True
                        print(f'  {path.stem:10s} {ch["number"]}:{v["number"]}  mixed  {mixed[:64]}…')
        if touched and write:
            with path.open('w', encoding='utf-8') as f:
                json.dump(doc, f, ensure_ascii=False)
    print(f'\n{whole} verses are wholly Latin (marked lang=la); {partial} mix Latin with Greek.')
    print('WROTE the corpus.' if write else 'Dry run — pass --write to apply.')


if __name__ == '__main__':
    main()
