#!/usr/bin/env python3
"""Map the Glanz frequency ranks onto our Hebrew vocabulary deck.

WHY THIS EXISTS. OTST 551 (Biblical Hebrew I) sets its weekly vocabulary as "Glanz 1A",
"Glanz 1F" and so on: twelve bands of twenty words, cumulative, taken in the frequency
order of Oliver Glanz's *Biblical Hebrew Vocabulary Builder*. A student revising for the
Sept 30 exam needs exactly words 1-100 and nothing else, so the app has to know which of
its words those are.

WHAT IS TAKEN, AND WHAT IS NOT. Only the RANKS — position in a frequency list, which is a
fact about the Hebrew Bible and free to state. The glosses stay ours. Glanz's own glosses
(and the BHVB gloss column the spreadsheet carries) are his and Bible Online Learner's
work, and the course syllabus restricts its materials to registered students; copying them
into a public app would be wrong on both counts and buys nothing, since a gloss for melek
is a gloss for melek.

THE SPREADSHEET IS NOT IN THE REPO for the same reason. Point this script at it, run it
once, and commit the small map it emits.

    python3 scripts/build-glanz-bands.py "~/Dropbox/Classes/15. Hebrew/Hebrew Vocab Glanz list 8.14.26.xlsx"

MATCHING. Glanz writes his headwords the way a lexicon prints them; ours come from the Open
Scriptures lexicon, which often differs in spelling without differing in word:

    Glanz  אַהֲרֹן   ours  אַהֲרוֹן    plene waw
    Glanz  שָׁלֹשׁ   ours  שָׁלוֹשׁ    plene waw
    Glanz  חַטָּאת   ours  חַטָּאָה    feminine ending written -t / -ah
    Glanz  לְמַעַן   ours  מַעַן       he lists it with its fused preposition

So a match is tried exact first, then on the consonantal skeleton with matres and unstable
final letters ignored, and anything still unresolved must be named in OVERRIDES below. The
script refuses to write a map with unresolved words rather than emitting a quiet gap: a
missing band member is a word a student is never shown and never revises.
"""
import collections
import json
import os
import re
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DECK = REPO / 'src' / 'data' / 'hebrew-vocabulary.json'
OUT = REPO / 'src' / 'data' / 'hebrew-glanz-bands.json'

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
BANDS = list('ABCDEFGHIJKL')          # 12 bands x 20 words = the 240 words of Hebrew I
BAND_SIZE = 20

# Words Glanz ranks that our deck cannot match by spelling, resolved by hand against the
# lexicon. Keyed by Glanz rank so the intent is auditable: rank -> Strong's number in our
# deck, or None for "our deck genuinely has no such entry, and here is why".
OVERRIDES: dict[int, tuple[str | None, str]] = {
    # Pairs our consonantal matching cannot tell apart, because Hebrew spells them alike
    # once the points come off. Each is a different word with a different Strong's, and
    # getting one wrong would put the noun on the card and ask for the verb.
    # Found by the 2026-08-18 gloss comparison against Glanz's own gloss column: the
    # spelling match had paired these three ranks with the WRONG homograph, so band 1B
    # taught "to turn" where Glanz teaches "face".
    26:  ('6440', 'paneh "face" — consonantal matching gave it panah the verb "turn" (his rank 335)'),
    182: ('639',  'aph "nose, anger" — matching gave it aph "also", which Glanz ranks 343'),
    160: ('MERGED:7451', 'ra\'ah the noun "evil" — same Strong\'s as ra at rank 147; matching gave it the shepherd verb (his rank 276)'),
    39:  ('1696', 'dabar the VERB "speak" — rank 32 is the noun "word"'),
    46:  ('5973', '\'im "with" — rank 29 is \'am "people"'),
    56:  ('854',  '\'et "with" — rank 5 is the object marker, the same pointing'),
    55:  ('8034', 'shem "name" — vowel-blind matching gives it sham "there"'),
    59:  ('8033', 'sham "there" — rank 55 is shem "name"'),
    74:  ('408',  '\'al "do not" — rank 9 is \'el "to"'),
    87:  ('7760', 'sim "put" — collides with shem/sham on consonants alone'),
    146: ('4427', 'malak the VERB "reign" — rank 21 is the noun "king"'),
    172: ('5647', '\'abad the VERB "serve" — rank 62 is the noun "servant"'),
    175: ('5930', '\'olah "burnt offering" — rank 51 is \'alah "go up"'),
    205: ('410',  '\'el "God" — rank 9 is \'el "to"'),
    212: ('7130', 'qereb "midst" — rank 181 is qarab "draw near"'),
    220: ('517',  '\'em "mother" — rank 43 is \'im "if"'),
    168: ('2403', 'chattat — our lexicon prints the lemma chatta\'ah'),
    187: ('4616', 'lema\'an — our lexicon prints the lemma without the fused preposition'),
    # Glanz counts he/she and you-sg/you-pl as separate vocabulary; the Hebrew lexicon
    # files each pair under ONE Strong's. There is no second card to give, and inventing
    # one would mean a student revising band 1F meets a word they already know from 1B.
    # Recorded as merged so the band shows 19 for a stated reason, not a silent gap.
    110: ('MERGED:1931', 'hi — same Strong\'s as hu at rank 33'),
    179: ('MERGED:859',  'attem — same Strong\'s as attah at rank 70'),
    # The inseparable prefixes. OSHB tags them as morphemes fused to their host word, so a
    # word-level frequency pass never sees them and they are not in the deck. They are the
    # five commonest items in the Hebrew Bible and the course teaches them in week 2
    # (Kelley L.6), so they are supplied by SUPPLEMENT below rather than dropped.
    1:  (None, 'waw conjunction — proclitic, supplied'),
    2:  (None, 'ha article — proclitic, supplied'),
    3:  (None, 'le preposition — proclitic, supplied'),
    4:  (None, 'be preposition — proclitic, supplied'),
    17: (None, 'ke preposition — proclitic, supplied'),
    72: (None, 'ha interrogative — proclitic, supplied'),
    # Adonai is tagged H136 only where the Masoretes pointed it as an independent title;
    # most occurrences of the word a reader would call adonai are tagged as the
    # Tetragrammaton or as adon. Our frequency pass therefore sees it 3 times, not ~430,
    # and it falls outside the deck's top 1036. Supplied.
    117: (None, 'adonai — tagging splits it across H136/H3068/H113, supplied'),
}

# The words above marked "supplied": our own gloss, and the part of speech our deck uses.
# Frequencies are counted from the MT morphology in count_proclitics(), not copied.
SUPPLEMENT = [
    {'rank': 1,  'strongs': '_w',  'word': 'וְ',  'gloss': 'and, but, then',              'pos': 'Conj'},
    {'rank': 2,  'strongs': '_h',  'word': 'הַ',  'gloss': 'the',                          'pos': 'Particle'},
    {'rank': 3,  'strongs': '_l',  'word': 'לְ',  'gloss': 'to, for',                      'pos': 'Prep'},
    {'rank': 4,  'strongs': '_b',  'word': 'בְּ', 'gloss': 'in, at, with, by',             'pos': 'Prep'},
    {'rank': 17, 'strongs': '_k',  'word': 'כְּ', 'gloss': 'like, as, according to',       'pos': 'Prep'},
    {'rank': 72, 'strongs': '_hi', 'word': 'הֲ',  'gloss': '(introduces a question)',      'pos': 'Particle'},
    # Adonai is not a lexeme in our corpus: OSHB tags it as adon + a 1st-person-singular
    # suffix (morph Sp1cs), which is literally what the form is. So no Strong's lookup can
    # count it, and the H136 entry it does carry fires 3 times. Counted here the only way
    # that reflects the word a reader meets — surface forms bearing that suffix, 401 of
    # them, which is why Glanz can rank it 117.
    {'rank': 117,'strongs': '136', 'word': 'אֲדֹנָי', 'gloss': 'Lord (as a title of God)',
     'pos': 'Noun', 'countSurface': 'אֲדֹנָי', 'countMorph': 'Sp1cs'},
]

POINTS = re.compile(r'[֑-ׇ]')
# Cantillation only (U+0591–U+05AF). The vowel points that follow in the block are kept:
# they are the whole difference between some pairs of words. See count_surface().
ACCENTS = re.compile(r'[֑-֯]')
FINALS = str.maketrans('ךםןףץ', 'כמנפצ')


def unaccented(s: str) -> str:
    """The pointed word with its cantillation removed — vowels intact."""
    return ACCENTS.sub('', unicodedata.normalize('NFC', s or '')).strip()


def bare(s: str) -> str:
    """Consonants only — vowel points and cantillation dropped, finals normalised."""
    stripped = POINTS.sub('', unicodedata.normalize('NFD', s or ''))
    return ''.join(c for c in stripped if 'א' <= c <= 'ת').translate(FINALS)


def skeleton(s: str) -> str:
    """As `bare`, but blind to the spelling differences that are not word differences:
    internal/final matres lectionis, and an unstable feminine ending written -h or -t."""
    b = bare(s)
    if len(b) > 2:
        b = b[0] + b[1:].replace('ו', '').replace('י', '')
    return re.sub(r'[הת]$', '', b) if len(b) > 2 else b


def read_sheet(path: Path) -> list[dict]:
    z = zipfile.ZipFile(path)
    shared = [''.join(t.text or '' for t in si.iter(NS + 't'))
              for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter(NS + 'si')]
    rows = []
    for r in ET.fromstring(z.read('xl/worksheets/sheet2.xml')).iter(NS + 'row'):
        cells = {}
        for c in r.iter(NS + 'c'):
            col = ''.join(ch for ch in c.get('r') if ch.isalpha())
            v = c.find(NS + 'v')
            if v is not None:
                cells[col] = shared[int(v.text)] if c.get('t') == 's' else v.text
        rows.append(cells)
    return rows[1:]


def headword(raw: str) -> str:
    """Glanz prints gender markers and homograph numerals alongside the word."""
    s = re.sub(r'\((?:m|f|c)\)', '', raw or '')
    return re.sub(r'\s+(?:I{1,3}|IV|V)\b', '', s).strip()


def count_proclitics() -> dict[str, int]:
    """How often each inseparable prefix occurs, counted from the OSHB morphology.

    A fused word carries a `morphemes` array, each with its own Strong's code: the
    proclitics are lettered rather than numbered ('c' waw, 'd' article, 'b'/'l'/'k' the
    prepositions), which is precisely why the word-level frequency pass that builds the
    deck cannot see them. Counting the morphemes is the only honest way to give the five
    commonest words in the Hebrew Bible a frequency.

    The interrogative he shares the letter 'd' with the article in some taggings, so it is
    told apart by its morph code 'Ti' instead.
    """
    letters = {'c': '_w', 'd': '_h', 'b': '_b', 'l': '_l', 'k': '_k'}
    counts: collections.Counter = collections.Counter()
    for f in sorted((REPO / 'public' / 'data' / 'mt').glob('*.json')):
        for verse in json.loads(f.read_text())['verses']:
            for w in verse['words']:
                if w.get('lang') == 'A':
                    continue
                for m in w.get('morphemes') or []:
                    code = str(m.get('strongs') or '')
                    morph = (m.get('morph') or '').lstrip('H')
                    if morph == 'Ti':
                        counts['_hi'] += 1
                    elif code in letters:
                        counts[letters[code]] += 1
    return counts


def count_words() -> dict[str, int]:
    """Word-level Strong's frequencies — the same pass build-hebrew-vocabulary.py uses,
    so a supplied card's count is comparable with every other card's."""
    counts: collections.Counter = collections.Counter()
    for f in sorted((REPO / 'public' / 'data' / 'mt').glob('*.json')):
        for verse in json.loads(f.read_text())['verses']:
            for w in verse['words']:
                if w.get('lang') == 'A':
                    continue
                s = re.sub(r'[^0-9]', '', str(w.get('strongs', '')))
                if s:
                    counts[s] += 1
    return counts


def count_surface(stem: str, morph: str) -> int:
    """Occurrences of a form the Strong's tagging cannot reach — matched on its written
    shape plus the morph code of the segment that carries it. See SUPPLEMENT (adonai).

    Compared with the ACCENTS stripped but the VOWELS kept. Both halves of that matter:
    a cantillation mark sits inside the word (adonai carries its accent between the nun
    and the yod), so a plain substring test finds 18; but consonants alone cannot tell
    adonai — the divine title — from adoni, "my lord" addressed to a man, which is spelt
    identically and differs only in the vowel under the nun. Matching on consonants gives
    583, conflating the two.
    """
    target = unaccented(stem)
    n = 0
    for f in sorted((REPO / 'public' / 'data' / 'mt').glob('*.json')):
        for verse in json.loads(f.read_text())['verses']:
            for w in verse['words']:
                if w.get('lang') == 'A' or unaccented(w.get('surface', '')) != target:
                    continue
                segs = [w.get('morph', '')] + [m.get('morph', '') for m in w.get('morphemes') or []]
                if any(s and s.lstrip('H').endswith(morph) for s in segs):
                    n += 1
    return n


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    xl = Path(os.path.expanduser(sys.argv[1]))
    if not xl.exists():
        sys.exit(f'not found: {xl}')

    rows = read_sheet(xl)
    deck = json.loads(DECK.read_text())

    exact: dict[str, list[dict]] = collections.defaultdict(list)
    loose: dict[str, list[dict]] = collections.defaultdict(list)
    for w in deck:
        exact[bare(w['word'])].append(w)
        loose[skeleton(w['word'])].append(w)

    def best(cands: list[dict]) -> dict:
        """Glanz orders by frequency, so where a spelling is shared the frequent word is
        the one he means (his 'ad' is the preposition, not the rare noun)."""
        return max(cands, key=lambda w: w['freq'])

    assigned: dict[str, dict] = {}      # deck word id -> {rank, band}
    supplement_by_rank = {s['rank']: s for s in SUPPLEMENT}
    supplied: list[dict] = []
    unresolved: list[tuple[int, str]] = []
    collisions: list[tuple[int, str, str, int]] = []
    merged: list[dict] = []
    proclitic_freq = count_proclitics()
    word_freq = count_words()

    for row in rows[:len(BANDS) * BAND_SIZE]:
        rank = int(row['A'])
        band = '1' + BANDS[(rank - 1) // BAND_SIZE]
        word = headword(row.get('B', ''))

        if rank in OVERRIDES:
            strongs, _why = OVERRIDES[rank]
            if strongs and strongs.startswith('MERGED:'):
                merged.append({'rank': rank, 'band': band, 'word': word,
                               'coveredBy': strongs.split(':', 1)[1]})
                continue
            if strongs is None:
                sup = supplement_by_rank[rank]
                # A proclitic is counted from the morphemes; a supplement with a real
                # Strong's number (adonai) is counted the ordinary word-level way, so its
                # frequency means the same thing as every other card's.
                if sup.get('countSurface'):
                    freq = count_surface(sup['countSurface'], sup['countMorph'])
                elif sup['strongs'].startswith('_'):
                    freq = proclitic_freq.get(sup['strongs'], 0)
                else:
                    freq = word_freq.get(sup['strongs'], 0)
                supplied.append({**{k: v for k, v in sup.items()
                                    if k not in ('rank', 'countSurface', 'countMorph')},
                                 'id': f"{sup['word']}|{sup['strongs']}",
                                 'freq': freq,
                                 'glanzRank': rank, 'glanzBand': band})
                continue
            hit = next((w for w in deck if w['id'].split('|')[1] == strongs), None)
            if hit is None:
                unresolved.append((rank, f'{word} (override points at H{strongs}, not in deck)'))
                continue
        else:
            cands = exact.get(bare(word)) or loose.get(skeleton(word))
            if not cands:
                b = bare(word)
                if len(b) > 2 and b[0] in 'לבכמו':
                    cands = exact.get(b[1:]) or loose.get(skeleton(b[1:]))
            if not cands:
                unresolved.append((rank, word))
                continue
            hit = best(cands)

        if hit['id'] in assigned:
            # Two Glanz ranks landing on one deck word means the match is wrong, not that
            # the word is listed twice: it is the loose skeleton match over-reaching (his
            # 'ad and 'ed collapse to the same consonants). Report it — silently keeping
            # the first leaves the later band a word short, which is the failure this
            # script exists to prevent.
            collisions.append((rank, word, hit['word'], assigned[hit['id']]['rank']))
            continue
        assigned[hit['id']] = {'rank': rank, 'band': band}

    if unresolved or collisions:
        if unresolved:
            print(f'{len(unresolved)} words could not be matched — add them to OVERRIDES:')
            for rank, word in unresolved:
                print(f'  rank {rank:>4}  {word}')
        if collisions:
            print(f'\n{len(collisions)} words collided with an earlier rank '
                  f'— name the right Strong\'s in OVERRIDES:')
            for rank, word, took, first in collisions:
                print(f'  rank {rank:>4}  {word:<12} matched {took} (already rank {first})')
        sys.exit('refusing to write an incomplete band map')

    out = {
        '_generated': 'scripts/build-glanz-bands.py',
        '_note': ('Glanz frequency RANKS only, mapped onto our deck by Strong\'s number. '
                  'Glosses throughout the app are our own — see the script docstring.'),
        '_bands': [f'1{b}' for b in BANDS],
        'ranks': {wid: v['rank'] for wid, v in sorted(assigned.items(), key=lambda kv: kv[1]['rank'])},
        'supplement': supplied,
        # Ranks Glanz lists that our deck covers with a card it already has. Kept so the
        # short band is explained on screen rather than looking like missing data.
        'merged': merged,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))

    print(f'wrote {OUT.relative_to(REPO)}')
    total = len(assigned) + len(supplied) + len(merged)
    print(f'  {len(assigned)} deck words ranked + {len(supplied)} supplied '
          f'+ {len(merged)} merged = {total} of {len(BANDS) * BAND_SIZE}')
    per = collections.Counter(v['band'] for v in assigned.values())
    for s in supplied:
        per[s['glanzBand']] += 1
    for m in merged:
        per[m['band']] += 1
    print('  per band: ' + '  '.join(f'{b}={per[b]}' for b in (f'1{x}' for x in BANDS)))
    if supplied:
        print('  supplied (own glosses, MT-counted frequencies):')
        for s in supplied:
            print(f'    {s["glanzBand"]}  {s["word"]:<6} {s["freq"]:>6,}x  {s["gloss"]}')


if __name__ == '__main__':
    main()
