#!/usr/bin/env python3
"""Build the Hebrew Masoretic OT corpus (the "MT" corpus) from the Open Scriptures Hebrew
Bible (OSHB / MorphHB — WLC text + Strong's + ETCBC morphology, CC BY 4.0).

Fetches one OSIS XML per book from github.com/openscriptures/morphhb, parses the tagged words,
and writes public/data/mt/<osisId>_<chapter>.json in the same top-level shape as the Greek
corpus files (book / chapter / verses[] / words[]) so /api/reader can serve it. Each Hebrew
word keeps the full pointed+cantillated surface plus its morpheme breakdown — OSHB tags a
written word as one or more "/"-separated morphemes (prefix conjunctions/prepositions/article +
stem + pronominal suffix), each with its own Strong's number and morph code — so the parsing
pane can later show every morpheme. Maqqef (־) connectors between words are preserved in the
verse text. Morph codes are stored raw (e.g. "HVqp3ms"); decoding to a traditional parse is a
later phase.

Attribution (CC BY 4.0): Open Scriptures Hebrew Bible, https://hb.openscriptures.org — WLC.

Usage: python3 scripts/build-hebrew-ot.py [OsisId ...]   (no args = all books)
"""
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / 'public' / 'data' / 'mt'
CACHE = REPO / 'scripts' / 'data' / 'oshb-cache'
RAW = 'https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/{}.xml'
OSIS_NS = '{http://www.bibletechnologies.net/2003/OSIS/namespace}'

# The 39 OT books, OSIS ids as OSHB names them (also the ids the cross-reference dataset uses).
BOOKS = [
    'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs',
    '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer',
    'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph',
    'Hag', 'Zech', 'Mal',
]
BOOK_NAMES = {
    'Gen': 'Genesis', 'Exod': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deut': 'Deuteronomy',
    'Josh': 'Joshua', 'Judg': 'Judges', 'Ruth': 'Ruth', '1Sam': '1 Samuel', '2Sam': '2 Samuel',
    '1Kgs': '1 Kings', '2Kgs': '2 Kings', '1Chr': '1 Chronicles', '2Chr': '2 Chronicles',
    'Ezra': 'Ezra', 'Neh': 'Nehemiah', 'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psalms',
    'Prov': 'Proverbs', 'Eccl': 'Ecclesiastes', 'Song': 'Song of Songs', 'Isa': 'Isaiah',
    'Jer': 'Jeremiah', 'Lam': 'Lamentations', 'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea',
    'Joel': 'Joel', 'Amos': 'Amos', 'Obad': 'Obadiah', 'Jonah': 'Jonah', 'Mic': 'Micah',
    'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zeph': 'Zephaniah', 'Hag': 'Haggai', 'Zech': 'Zechariah',
    'Mal': 'Malachi',
}

# Strong's number from an OSHB lemma attr: strip a leading morpheme prefix code ("l/", "b/", …)
# per morpheme and a trailing " a"/" b" homograph disambiguator, keeping just the digits.
def strong_of(lemma_part: str) -> str:
    m = re.search(r'(\d+)', lemma_part)
    return m.group(1) if m else lemma_part.strip()


def fetch(osis: str) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    p = CACHE / f'{osis}.xml'
    if not p.exists():
        subprocess.run(['curl', '-sS', '--fail', '--max-time', '60', RAW.format(osis), '-o', str(p)],
                       check=True, env={'CURL_CA_BUNDLE': '/etc/ssl/cert.pem', 'PATH': '/usr/bin:/bin'})
    return p.read_text(encoding='utf-8')


def parse_word(w: ET.Element):
    """One <w> → { surface, morphemes:[{text,strongs,morph}] }. OSHB joins morphemes with '/'."""
    text = (w.text or '')
    lemma = w.get('lemma', '')
    morph = w.get('morph', '')
    lang = 'A' if morph.startswith('A') else 'H'          # Aramaic (Dan/Ezra) vs Hebrew
    morph = morph[1:] if morph[:1] in ('H', 'A') else morph  # drop the leading language flag
    texts = text.split('/')
    lemmas = lemma.split('/')
    morphs = morph.split('/')
    n = max(len(texts), len(morphs))
    morphemes = []
    for i in range(n):
        t = texts[i] if i < len(texts) else ''
        morphemes.append({
            'text': t,
            'strongs': strong_of(lemmas[i]) if i < len(lemmas) else '',
            'morph': morphs[i] if i < len(morphs) else '',
        })
    return {'surface': text.replace('/', ''), 'lang': lang, 'morphemes': morphemes}


def build(osis: str) -> int:
    root = ET.fromstring(fetch(osis))
    chapters: dict[int, list] = {}
    for verse in root.iter(f'{OSIS_NS}verse'):
        vid = verse.get('osisID')
        if not vid:
            continue
        _, ch, vs = vid.split('.')
        ch, vs = int(ch), int(vs)
        words, pos, parts = [], 0, []
        for el in verse:
            tag = el.tag.replace(OSIS_NS, '')
            if tag == 'w':
                pos += 1
                pw = parse_word(el)
                # Top-level strongs/morph describe the stem (the last morpheme — prefixes come
                # first). `morphemes` is only emitted for compounds (prefix/suffix), and `lang`
                # only for Aramaic, to keep the common single-Hebrew-word case compact.
                stem = pw['morphemes'][-1] if pw['morphemes'] else {'strongs': '', 'morph': ''}
                word = {
                    'id': f'{osis}.{ch}.{vs}.{pos}', 'position': pos, 'surface': pw['surface'],
                    'strongs': stem['strongs'], 'morph': stem['morph'], 'verseId': f'{osis}.{ch}.{vs}',
                }
                if len(pw['morphemes']) > 1:
                    word['morphemes'] = pw['morphemes']
                if pw['lang'] == 'A':
                    word['lang'] = 'A'
                words.append(word)
                parts.append(pw['surface'])
            elif tag == 'seg' and el.get('type') == 'x-maqqef':
                if parts:
                    parts[-1] += '־'           # attach the maqqef to the preceding word's text
                if words:
                    words[-1]['after'] = '־'   # so per-word rendering rejoins the maqqef (no space)
        # Join with spaces, except a maqqef (־) connects directly to the next word (no space).
        text = ''
        for p in parts:
            text += ('' if not text or text.endswith('־') else ' ') + p
        chapters.setdefault(ch, []).append({
            'id': f'{osis}.{ch}.{vs}', 'bookId': osis, 'chapter': ch, 'verse': vs,
            'reference': f'{BOOK_NAMES[osis]} {ch}:{vs}', 'text': text, 'words': words,
        })
    OUT.mkdir(parents=True, exist_ok=True)
    for ch, verses in chapters.items():
        (OUT / f'{osis}_{ch}.json').write_text(
            json.dumps({'book': osis, 'chapter': ch, 'verses': verses}, ensure_ascii=False), encoding='utf-8')
    return len(chapters)


def main():
    todo = sys.argv[1:] or BOOKS
    total = 0
    for osis in todo:
        n = build(osis)
        total += n
        print(f'  {osis:6} {n} chapters')
    print(f'MT corpus: {len(todo)} books, {total} chapter files → public/data/mt/')


if __name__ == '__main__':
    main()
