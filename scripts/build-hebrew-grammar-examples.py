#!/usr/bin/env python3
"""Find real biblical examples for each Hebrew grammar chapter, inside beginning vocabulary.

Standard first-year grammars drill on the actual text from the third chapter onward; ours
leaned on the artificial paradigm root קטל. This script closes that gap from data we already
ship: the pointed MT with OSHB morphology (public/data/mt) and the Hebrew vocabulary deck
(src/data/hebrew-vocabulary.json).

For each chapter it scans the MT for verses that (a) contain the form the chapter teaches and
(b) use ONLY words a beginner has met — the deck's early frequency sections, plus proper nouns
(a name is readable on sight) and the target word itself. Verses are ranked by vocabulary
coverage, then brevity, then how early they sit in the reading order a first-year course
follows (Genesis, Exodus, Deuteronomy, Ruth, Jonah, Samuel/Kings, Psalms…).

The English is the World English Bible (public domain), fetched per chapter and cached.

    python3 scripts/build-hebrew-grammar-examples.py            # all chapters
    python3 scripts/build-hebrew-grammar-examples.py qal-perfect

Writes public/data/grammar-examples-hebrew.json:
    { "<chapter-id>": [ { ref, he, en, target: {surface, morph, position} } ] }
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MT = REPO / 'public' / 'data' / 'mt'
DECK = REPO / 'src' / 'data' / 'hebrew-vocabulary.json'
OUT = REPO / 'public' / 'data' / 'grammar-examples-hebrew.json'
CACHE = REPO / '.web-cache'

# Vocabulary a beginner is assumed to have. Sections 1–2 of the deck are the ~310 commonest
# words in the Hebrew Bible, which is the band a first-year course covers (Glanz 1A–1L sits
# inside it). Section 3 is admitted as a fallback tier when a chapter is starved of examples.
CORE_SECTIONS = {1, 2}
WIDE_SECTIONS = {1, 2, 3}

# Reading order of a typical first year — earlier is preferred, all else equal.
BOOK_ORDER = ['Gen', 'Exod', 'Deut', 'Ruth', 'Jonah', '1Sam', '2Sam', '1Kgs', '2Kgs',
              'Josh', 'Judg', 'Ps', 'Prov', 'Isa', 'Jer', 'Lev', 'Num', 'Amos', 'Hos',
              'Mic', 'Zech', 'Mal', 'Neh', 'Ezra', 'Job', 'Eccl', 'Song', 'Lam', 'Ezek',
              'Dan', 'Joel', 'Obad', 'Nah', 'Hab', 'Zeph', 'Hag', 'Esth', '1Chr', '2Chr']
BOOK_NR = {b: i for i, b in enumerate(BOOK_ORDER)}
OSIS_TO_NR = {
    'Gen': 1, 'Exod': 2, 'Lev': 3, 'Num': 4, 'Deut': 5, 'Josh': 6, 'Judg': 7, 'Ruth': 8,
    '1Sam': 9, '2Sam': 10, '1Kgs': 11, '2Kgs': 12, '1Chr': 13, '2Chr': 14, 'Ezra': 15,
    'Neh': 16, 'Esth': 17, 'Job': 18, 'Ps': 19, 'Prov': 20, 'Eccl': 21, 'Song': 22,
    'Isa': 23, 'Jer': 24, 'Lam': 25, 'Ezek': 26, 'Dan': 27, 'Hos': 28, 'Joel': 29,
    'Amos': 30, 'Obad': 31, 'Jonah': 32, 'Mic': 33, 'Nah': 34, 'Hab': 35, 'Zeph': 36,
    'Hag': 37, 'Zech': 38, 'Mal': 39,
}
BOOK_NAME = {
    'Gen': 'Genesis', 'Exod': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers',
    'Deut': 'Deuteronomy', 'Josh': 'Joshua', 'Judg': 'Judges', 'Ruth': 'Ruth',
    '1Sam': '1 Samuel', '2Sam': '2 Samuel', '1Kgs': '1 Kings', '2Kgs': '2 Kings',
    '1Chr': '1 Chronicles', '2Chr': '2 Chronicles', 'Ezra': 'Ezra', 'Neh': 'Nehemiah',
    'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psalm', 'Prov': 'Proverbs', 'Eccl': 'Ecclesiastes',
    'Song': 'Song of Songs', 'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations',
    'Ezek': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea', 'Joel': 'Joel', 'Amos': 'Amos',
    'Obad': 'Obadiah', 'Jonah': 'Jonah', 'Mic': 'Micah', 'Nah': 'Nahum', 'Hab': 'Habakkuk',
    'Zeph': 'Zephaniah', 'Hag': 'Haggai', 'Zech': 'Zechariah', 'Mal': 'Malachi',
}

# What each chapter is looking for. `morph` is matched against the OSHB code of a word;
# `need` (optional) is an extra predicate over the whole verse.
def m(pattern):
    rx = re.compile(pattern)
    return lambda code: bool(rx.match(code))

TARGETS = {
    # ── nominal system ──
    'article':      m(r'Td'),
    'prepositions': m(r'R'),
    'nouns':        m(r'Nc[fm]p'),          # a plural noun shows the endings the chapter teaches
    'construct':    m(r'Nc[fm][sp]c'),      # construct state
    'adjectives':   m(r'Aa'),
    'pronouns':     m(r'Pp'),
    'suffixes':     m(r'Sp'),
    'numbers':      m(r'Ac'),
    # ── verb ──
    'qal-perfect':      m(r'Vqp'),
    'qal-imperfect':    m(r'Vqi'),
    'waw-consecutive':  m(r'Vqw'),
    'volitives':        m(r'Vqv'),
    'infinitives':      m(r'Vq[ac]'),
    'participles':      m(r'Vqr'),
    'niphal':           m(r'VN'),
    'piel-pual':        m(r'Vp'),
    'hiphil-hophal':    m(r'Vh'),
    'hithpael':         m(r'Vt'),
    'weak-verbs':       None,               # filled below (needs the lemma shape)
    'syntax':           m(r'Vqw'),          # narrative clause order
    'verb-system':      m(r'V'),
}


def deck_strongs():
    data = json.loads(DECK.read_text())
    words = data if isinstance(data, list) else data.get('words', [])
    core, wide = set(), set()
    for w in words:
        # deck id is "lemma|strongs"
        parts = str(w.get('id', '')).split('|')
        if len(parts) != 2 or not parts[1].isdigit():
            continue
        s = parts[1]
        if w.get('section') in CORE_SECTIONS:
            core.add(s)
        if w.get('section') in WIDE_SECTIONS:
            wide.add(s)
    return core, wide


def load_verses(osis):
    ch = 1
    while True:
        f = MT / f'{osis}_{ch}.json'
        if not f.exists():
            break
        data = json.loads(f.read_text())
        for v in data['verses']:
            yield ch, v
        ch += 1


def strongs_of(w):
    s = str(w.get('strongs') or '')
    # OSHB writes compound/suffixed Strong's like "853" or "430 a"; keep the digits
    m2 = re.match(r'(\d+)', s)
    if m2:
        return m2.group(1)
    # Compound words (preposition + noun + suffix) put the numbers on the morphemes.
    for mm in w.get('morphemes', []):
        m3 = re.match(r'(\d+)', str(mm.get('strongs') or ''))
        if m3:
            return m3.group(1)
    return ''


def variety_key(w):
    """Key for 'don't show the same word twice' — never empty, or the dedupe eats the list."""
    return strongs_of(w) or w.get('surface', '')


def score_verse(words, ti, known):
    """Coverage over content words, plus length penalty. Returns None if unusable."""
    n = len(words)
    if n < 4 or n > 12:
        return None
    unknown = 0
    for i, w in enumerate(words):
        if i == ti:
            continue                       # the word being taught doesn't count against us
        code = w.get('morph') or ''
        if code.startswith('Np'):
            continue                       # a proper noun is readable on sight
        if code.startswith(('Td', 'R', 'C', 'To', 'Tn')):
            continue                       # article, prepositions, waw, את, לא — chapter 1 material
        if strongs_of(w) in known:
            continue
        unknown += 1
    coverage = 1 - unknown / max(1, n - 1)
    if coverage < 0.8:
        return None
    return coverage, -n


def web_english(osis, chapter):
    """World English Bible verse map for a chapter, cached on disk."""
    CACHE.mkdir(exist_ok=True)
    f = CACHE / f'web_{osis}_{chapter}.json'
    if not f.exists():
        nr = OSIS_TO_NR.get(osis)
        if not nr:
            return {}
        url = f'https://api.getbible.net/v2/web/{nr}/{chapter}.json'
        env = {**os.environ, 'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
        r = subprocess.run(['curl', '-sL', '-o', str(f), url], env=env)
        if r.returncode != 0 or not f.exists():
            return {}
    try:
        d = json.loads(f.read_text())
    except Exception:
        return {}
    return {str(v['verse']): v['text'].strip() for v in d.get('verses', [])}


def find_examples(chapter_id, match, core, wide, want=6):
    hits = []
    for osis in BOOK_ORDER:
        if not (MT / f'{osis}_1.json').exists():
            continue
        for ch, v in load_verses(osis):
            words = [w for w in v['words'] if w.get('surface')]
            # Aramaic (Daniel 2–7, parts of Ezra) reuses the stem letters for different
            # binyanim, so an Aramaic verse would illustrate the chapter with the wrong parse.
            if any(w.get('lang') == 'A' for w in words):
                continue
            for ti, w in enumerate(words):
                # A word's own code names its head morpheme; the article, the inseparable
                # prepositions and the pronominal suffixes live in `morphemes`. Match either,
                # or the chapters that teach affixes would find nothing at all.
                codes = [w.get('morph') or ''] + [mm.get('morph', '') for mm in w.get('morphemes', [])]
                if not any(c and match(c) for c in codes):
                    continue
                sc = score_verse(words, ti, core)
                tier = 0
                if sc is None:
                    sc = score_verse(words, ti, wide)
                    tier = 1
                if sc is None:
                    break
                hits.append((tier, -sc[0], -sc[1], BOOK_NR.get(osis, 99), osis, ch, v['verse'], ti))
                break      # one example per verse
    hits.sort()
    out, seen_roots, seen_books = [], set(), {}
    for tier, negcov, length, _bo, osis, ch, verse, ti in hits:
        if len(out) >= want:
            break
        # spread the examples: at most two from any one book, and don't repeat a root
        if seen_books.get(osis, 0) >= 2:
            continue
        data = json.loads((MT / f'{osis}_{ch}.json').read_text())
        vv = next((x for x in data['verses'] if x['verse'] == verse), None)
        if not vv:
            continue
        words = [w for w in vv['words'] if w.get('surface')]
        root = variety_key(words[ti])
        if root in seen_roots:
            continue
        eng = web_english(osis, ch)
        # The English versification must line up with the Hebrew, or the two columns describe
        # different verses: MT 1 Sam 21:1 is WEB 21:2, and every Psalm with a superscription
        # is off by one. Requiring equal verse counts is conservative and cheap; a chapter
        # that fails simply supplies no examples.
        if len(eng) != len(data['verses']):
            continue
        en = eng.get(str(verse), '')
        if not en:
            continue
        seen_roots.add(root)
        seen_books[osis] = seen_books.get(osis, 0) + 1
        out.append({
            'ref': f'{BOOK_NAME.get(osis, osis)} {ch}:{verse}',
            'osis': osis, 'chapter': ch, 'verse': verse,
            'he': ' '.join(w['surface'] for w in words),
            'en': re.sub(r'\s+', ' ', en),
            'target': {'surface': words[ti]['surface'], 'morph': words[ti].get('morph', ''),
                       'position': ti},
            'tier': tier,
        })
    return out


def deck_entries():
    """Strong's → deck entry, for the per-chapter vocabulary lists."""
    data = json.loads(DECK.read_text())
    words = data if isinstance(data, list) else data.get('words', [])
    out = {}
    for w in words:
        parts = str(w.get('id', '')).split('|')
        if len(parts) == 2 and parts[1].isdigit():
            out.setdefault(parts[1], w)
    return out


def chapter_vocabulary(examples, entries):
    """Every deck word used in this chapter's examples, commonest first — the list a
    student should know to read the examples without a lexicon."""
    seen = {}
    for ex in examples:
        data = json.loads((MT / f"{ex['osis']}_{ex['chapter']}.json").read_text())
        vv = next((x for x in data['verses'] if x['verse'] == ex['verse']), None)
        if not vv:
            continue
        for w in vv['words']:
            for st in {strongs_of(w)} | {re.match(r'(\d+)', str(mm.get('strongs') or '')).group(1)
                                         for mm in w.get('morphemes', [])
                                         if re.match(r'(\d+)', str(mm.get('strongs') or ''))}:
                e = entries.get(st)
                if e and st not in seen:
                    seen[st] = {'lemma': e['word'], 'gloss': e['gloss'], 'freq': e['freq'],
                                'pos': e.get('pos') or '', 'strongs': st}
    return sorted(seen.values(), key=lambda x: -x['freq'])


def build_drills(match, core, want=12):
    """A pool of real forms for the chapter's practice set: surface + OSHB code + reference,
    with the parse left to the app (formatHebrewParse decodes the code at render time, so the
    drill answer and the Reader's parsing pane can never drift apart)."""
    out, seen = [], set()
    for osis in BOOK_ORDER:
        if len(out) >= want:
            break
        if not (MT / f'{osis}_1.json').exists():
            continue
        for ch, v in load_verses(osis):
            if len(out) >= want:
                break
            words = [w for w in v['words'] if w.get('surface')]
            if any(w.get('lang') == 'A' for w in words):
                continue
            for w in words:
                code = w.get('morph') or ''
                segs = [{'text': mm.get('text', ''), 'morph': mm.get('morph', '')}
                        for mm in w.get('morphemes', [])]
                # Two kinds of drill. If the WORD's own code is the target, the exercise is a
                # full parse. If only a MORPHEME matches (the article, an inseparable
                # preposition, a pronominal suffix — none of which ever surface as a word's own
                # code), the exercise is to break the word into its pieces instead: those
                # chapters would otherwise have no drills at all.
                whole = bool(code) and match(code)
                affix = not whole and any(sg['morph'] and match(sg['morph']) for sg in segs)
                if not whole and not affix:
                    continue
                st = strongs_of(w)
                if st not in core:
                    continue
                key = w['surface']
                if key in seen:
                    continue
                # keep the set varied — but a target with only two possible codes (the
                # infinitives' absolute/construct) would starve at a cap of two.
                if whole and sum(1 for d in out if d['morph'] == code) >= 4:
                    continue
                seen.add(key)
                out.append({'surface': w['surface'], 'morph': code, 'strongs': st,
                            'kind': 'parse' if whole else 'segment',
                            **({'segments': segs} if affix else {}),
                            'ref': f'{BOOK_NAME.get(osis, osis)} {ch}:{v["verse"]}',
                            'osis': osis, 'chapter': ch, 'verse': v['verse']})
                break
    return out


# Reading practice for the Alphabet chapter: short, familiar verses to SOUND OUT. Chosen for
# brevity and familiarity rather than grammar — at this stage the exercise is decoding letters
# and vowels, so the Shema and Genesis 1:1 are worth more than anything statistically optimal.
ALPHABET_PRACTICE = [
    ('Gen', 1, 1), ('Gen', 1, 3), ('Gen', 1, 5), ('Gen', 12, 1),
    ('Exod', 20, 3), ('Exod', 20, 13), ('Exod', 20, 15),
    ('Deut', 6, 4), ('Deut', 6, 5),
    ('Num', 6, 24), ('Num', 6, 25), ('Num', 6, 26),
    ('Josh', 1, 9), ('1Sam', 3, 10), ('Ruth', 1, 16),
    ('Ps', 1, 1), ('Ps', 19, 2), ('Ps', 23, 1), ('Ps', 100, 3), ('Ps', 117, 1),
    ('Ps', 118, 24), ('Ps', 121, 1), ('Ps', 133, 1),
    ('Prov', 1, 7), ('Prov', 3, 5), ('Eccl', 1, 2),
    ('Isa', 6, 3), ('Isa', 9, 5), ('Isa', 40, 8),
    ('Amos', 5, 24), ('Mic', 6, 8), ('Hab', 2, 4), ('Zech', 4, 6), ('Mal', 3, 6),
    ('Jonah', 1, 1),
]


def build_alphabet_practice():
    out = []
    for osis, ch, v in ALPHABET_PRACTICE:
        f = MT / f'{osis}_{ch}.json'
        if not f.exists():
            continue
        data = json.loads(f.read_text())
        vv = next((x for x in data['verses'] if x['verse'] == v), None)
        if not vv:
            continue
        eng = web_english(osis, ch)
        if len(eng) != len(data['verses']):     # versification guard, as everywhere else
            continue
        en = eng.get(str(v), '')
        if not en:
            continue
        out.append({
            'ref': f'{BOOK_NAME.get(osis, osis)} {ch}:{v}',
            'osis': osis, 'chapter': ch, 'verse': v,
            'he': ' '.join(w['surface'] for w in vv['words'] if w.get('surface')),
            'en': re.sub(r'\s+', ' ', en),
        })
    return out


def main():
    core, wide = deck_strongs()
    entries = deck_entries()
    print(f'beginning vocabulary: {len(core)} words (core), {len(wide)} (with section 3)')
    only = sys.argv[1] if len(sys.argv) > 1 else None
    result = {}
    if OUT.exists():
        result = json.loads(OUT.read_text())
    for cid, match in TARGETS.items():
        if match is None or (only and cid != only):
            continue
        ex = find_examples(cid, match, core, wide)
        vocab = chapter_vocabulary(ex, entries)
        drills = build_drills(match, core)
        result[cid] = {'examples': ex, 'vocab': vocab, 'drills': drills}
        core_n = sum(1 for e in ex if e['tier'] == 0)
        print(f'  {cid:18s} {len(ex)} examples ({core_n} core) · {len(vocab)} vocab · {len(drills)} drills')
    if not only or only == 'alphabet':
        ap = build_alphabet_practice()
        result['alphabet'] = {'examples': [], 'vocab': [], 'drills': [], 'reading': ap}
        print(f'  {"alphabet":18s} {len(ap)} reading-practice verses')
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(f'→ {OUT.relative_to(REPO)}')


if __name__ == '__main__':
    main()
