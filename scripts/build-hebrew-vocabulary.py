#!/usr/bin/env python3
"""Build a frequency-ordered Hebrew vocabulary for the Vocab flashcards — the parallel of the
Greek Biblical Greek Vocabulary Builder (src/data/bgvb-vocabulary.json).

Sources (all already in the app / public domain):
- public/data/mt/*.json (OSHB/MorphHB) — count each lemma's occurrences (Hebrew only, lang≠A)
  and take a representative morphology for its part of speech.
- public/data/hebrew-lexicon.json — the pointed dictionary lemma per Strong's number.
- Open Scriptures HebrewLexicon LexicalIndex.xml — a clean one-word gloss per Strong's
  (e.g. "father", "beginning"); falls back to the lexicon's Strong's gloss.

The top 1036 lemmas by frequency are split into 7 sections whose sizes match the Greek exactly
(158/152/158/143/134/138/153), so the two decks line up section-for-section. Output shape mirrors
BgvbWord: { word, inflection, gloss, pos, section, freq, order }.

Usage: python3 scripts/build-hebrew-vocabulary.py
"""
import collections
import json
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MT = REPO / 'public' / 'data' / 'mt'
LEX = REPO / 'public' / 'data' / 'hebrew-lexicon.json'
OUT = REPO / 'src' / 'data' / 'hebrew-vocabulary.json'
LEXICAL_INDEX = 'https://raw.githubusercontent.com/openscriptures/HebrewLexicon/master/LexicalIndex.xml'
NS = '{http://openscriptures.github.com/morphhb/namespace}'

SECTION_SIZES = [158, 152, 158, 143, 134, 138, 153]   # = the Greek section sizes
TOTAL = sum(SECTION_SIZES)                              # 1036

POS_MAP = {'N': 'Noun', 'V': 'Verb', 'A': 'Adj', 'R': 'Prep', 'C': 'Conj',
           'D': 'Adv', 'P': 'Pron', 'T': 'Particle', 'S': 'Particle'}

# A couple of lemmas the source lexicon points oddly; give the conventional citation form.
LEMMA_OVERRIDES = {
    '413': 'אֶל',   # preposition — lexicon points it אֵל (tsere) like the noun "God"
}

# Hand-polished learner glosses, keyed by Strong's number, for the high-frequency core.
# The OpenScriptures LexicalIndex <def> field is frequently the *etymological* sense
# ("excitement" for עִיר city, "mouth" for מִדְבָּר wilderness) or plain noise ("Leb Qamay"),
# and its wording is archaic ("thou", "Jehoshua"). These replace it with standard concise
# lexicon glosses (BDB / Pratico–Van Pelt style). Anything not listed keeps the LexicalIndex
# gloss (falling back to the Strong's gloss). Edit HERE and re-run — never the JSON.
GLOSS_OVERRIDES = {
    '853': '(direct object marker)', '3068': 'the LORD (Yahweh)', '834': 'who, which, that',
    '559': 'to say', '3605': 'all, every, whole', '3808': 'no, not',
    '3588': 'that, because, for; when', '5921': 'on, upon, over, above', '1121': 'son',
    '413': 'to, toward, unto', '1961': 'to be, become, happen', '6213': 'to do, make',
    '935': 'to come, go in, enter', '776': 'earth, land', '3117': 'day', '376': 'man, husband',
    '1931': 'he, it; that', '5414': 'to give, put, set', '1004': 'house', '430': 'God; gods',
    '5971': 'people, nation', '6440': 'face, presence', '1697': 'word, thing, matter',
    '5704': 'until, as far as', '2088': 'this', '7200': 'to see', '1696': 'to speak',
    '859': 'you (m.s.)', '518': 'if; whether', '8085': 'to hear, listen, obey',
    '3427': 'to sit, dwell, remain', '259': 'one', '5892': 'city', '3212': 'to go, walk',
    '3318': 'to go out, come out', '7725': 'to return, turn back', '3947': 'to take, receive',
    '589': 'I', '8141': 'year', '3045': 'to know', '5927': 'to go up, ascend',
    '4480': 'from, out of', '2009': 'behold, look', '3651': 'so, thus; right',
    '1571': 'also, even, too', '428': 'these', '4100': 'what? how?', '4191': 'to die',
    '3548': 'priest', '408': 'not, do not (with jussive)', '3027': 'hand', '398': 'to eat',
    '8147': 'two', '8033': 'there', '7121': 'to call, proclaim, read',
    '369': 'there is not, nothing', '7971': 'to send, stretch out', '802': 'woman, wife',
    '2063': 'this (f.)', '7451': 'evil, bad', '5375': 'to lift, carry, bear', '3967': 'hundred',
    '3541': 'thus, so', '6965': 'to arise, stand up', '1992': 'they (m.)', '4325': 'water',
    '2896': 'good', '1471': 'nation, people', '120': 'man, mankind, Adam', '2022': 'mountain, hill',
    '1419': 'great, large', '5973': 'with', '5674': 'to pass over, cross', '505': 'thousand',
    '1980': 'to go, walk', '7760': 'to put, place, set', '5975': 'to stand', '7227': 'many, much, great',
    '1870': 'way, road, journey', '3205': 'to bear, beget', '5750': 'still, yet, again',
    '310': 'after, behind', '5769': 'eternity, forever, everlasting', '6258': 'now',
    '854': 'with', '7969': 'three', '6635': 'army, host', '8104': 'to keep, guard, watch',
    '4310': 'who?', '8034': 'name', '5307': 'to fall', '2416': 'living, alive', '8064': 'heavens, sky',
    '4994': 'please (particle of entreaty)', '7218': 'head, top, chief', '7651': 'seven',
    '4672': 'to find, attain', '2091': 'gold', '5002': 'utterance, declaration (of)', '784': 'fire',
    '6944': 'holiness, holy thing', '3701': 'silver, money', '6680': 'to command, charge',
    '1323': 'daughter', '8269': 'prince, chief, official', '595': 'I', '1129': 'to build',
    '5221': 'to strike, smite', '5869': 'eye; spring', '5046': 'to tell, declare',
    '2719': 'sword', '6963': 'voice, sound', '3381': 'to go down, descend',
    '8478': 'under, instead of; beneath', '2568': 'five', '6240': 'ten (in the teens)',
    '4196': 'altar', '3220': 'sea; west', '176': 'or', '4725': 'place', '6086': 'tree, wood',
    '8179': 'gate', '996': 'between', '6242': 'twenty', '3372': 'to fear, be afraid', '702': 'four',
    '4421': 'war, battle', '3069': 'the LORD (GOD)', '7704': 'field', '7307': 'spirit, wind, breath',
    '4941': 'judgment, justice, ordinance', '3966': 'very, exceedingly', '4427': 'to reign, be king',
    '3881': 'Levite', '5030': 'prophet', '8432': 'midst, middle', '5493': 'to turn aside, depart',
    '5439': 'around, surrounding', '3772': 'to cut, cut off; make (a covenant)', '1818': 'blood',
    '6256': 'time', '2320': 'month; new moon', '2388': 'to be strong, firm; grasp',
    '5315': 'soul, life, self, person', '7563': 'wicked, guilty', '68': 'stone',
    '4616': 'for the sake of, in order that', '168': 'tent', '5930': 'burnt offering',
    '5650': 'servant, slave', '3820': 'heart, mind', '7126': 'to come near, approach',
    '4057': 'wilderness, desert', '6030': 'to answer, respond', '3899': 'bread, food',
    '520': 'cubit', '3627': 'vessel, article, implement', '6310': 'mouth', '1288': 'to bless, kneel',
    '4390': 'to be full, fill', '3915': 'night', '894': 'Babylon', '410': 'God, god',
    '4294': 'staff, rod; tribe', '2398': 'to sin, miss', '6485': 'to attend to, appoint, muster',
    '2421': 'to live, revive', '7965': 'peace, welfare, wholeness', '3091': 'Joshua',
    '7235': 'to be(come) many, multiply', '8337': 'six', '1242': 'morning', '3130': 'Joseph',
    '3789': 'to write', '1': 'father', '8354': 'to drink', '5647': 'to serve, work',
    '6662': 'righteous, just', '6629': 'flock, sheep', '3254': 'to add, do again',
    '4150': 'appointed time, meeting; festival', '727': 'ark, chest',
    '5186': 'to stretch out, extend, turn', '2142': 'to remember',
    '3559': 'to be firm, established; prepare', '1285': 'covenant', '5288': 'boy, youth, servant',
    '4264': 'camp, encampment', '1245': 'to seek, search for', '4397': 'messenger, angel',
    '4940': 'family, clan', '3201': 'to be able, prevail', '7901': 'to lie down',
    '2428': 'strength, army, wealth', '8081': 'oil, fat', '622': 'to gather, collect',
    '7223': 'first, former', '1366': 'border, boundary, territory', '5612': 'book, document, scroll',
    '2403': 'sin, sin offering', '1540': 'to uncover, reveal; go into exile', '6235': 'ten',
    '7970': 'thirty', '352': 'ram', '1320': 'flesh, meat', '3898': 'to fight, do battle',
    '7812': 'to bow down, worship', '7650': 'to swear, take an oath', '7626': 'tribe; rod, scepter',
    '312': 'another, other', '127': 'ground, land, soil', '2205': 'old; elder',
    '929': 'beast, cattle, animal', '977': 'to choose', '1241': 'cattle, herd, ox',
    '7311': 'to be high, exalted; rise', '4503': 'gift, offering, tribute', '389': 'surely, only, however',
    '8199': 'to judge, govern', '4639': 'deed, work, act', '3615': 'to be complete, finished; end',
    '8451': 'law, instruction, teaching', '8145': 'second', '2572': 'fifty',
    '995': 'to discern, understand', '6607': 'opening, entrance, doorway', '6': 'to perish, be lost; destroy',
    '5127': 'to flee', '5608': 'to count, recount, tell', '5800': 'to leave, forsake, abandon',
    '3423': 'to possess, inherit, dispossess', '2930': 'to be(come) unclean',
    '7592': 'to ask, inquire, request', '4399': 'work, occupation, service',
    '1368': 'mighty, strong; warrior', '7462': 'to pasture, tend, shepherd', '7230': 'multitude, abundance',
    '8055': 'to rejoice, be glad', '804': 'Assyria, Asshur', '1008': 'Bethel',
    '5060': 'to touch, strike, reach', '5265': 'to set out, journey, pull up', '3162': 'together',
    '227': 'then, at that time', '1875': 'to seek, inquire, require', '2691': 'courtyard, court; settlement',
    '2583': 'to encamp, camp', '5712': 'congregation, assembly', '5158': 'wadi, stream, torrent',
    '6942': 'to be holy, consecrate, sanctify', '3519': 'glory, honor, abundance', '157': 'to love',
    '6605': 'to open', '2077': 'sacrifice', '7665': 'to break, shatter', '705': 'forty',
    '5178': 'bronze, copper', '637': 'also, even, indeed', '6153': 'evening', '758': 'Aram, Syria',
    '6435': 'lest', '7604': 'to remain, be left over', '1984': 'to praise; shine', '6437': 'to turn',
    '5337': 'to deliver, rescue, snatch away', '5437': 'to turn, surround, go around',
    '6499': 'bull, young bull', '3196': 'wine', '8121': 'sun', '5387': 'leader, chief, prince',
    '2351': 'outside, street', '3426': 'there is/are, existence', '2076': 'to slaughter, sacrifice',
    '2450': 'wise', '7931': 'to dwell, settle, abide',
}


def pos_label(morph: str) -> str:
    if morph.startswith('Td'):
        return 'Art'
    return POS_MAP.get(morph[:1], 'Particle')


def fetch(url: str) -> str:
    env = {**os.environ, 'CURL_CA_BUNDLE': '/etc/ssl/cert.pem'}
    return subprocess.run(['curl', '-s', url], capture_output=True, text=True, env=env).stdout


def clean_index_glosses() -> dict[str, str]:
    """strong number -> clean one-word gloss from LexicalIndex (prefer the primary aug='a')."""
    idx = ET.fromstring(fetch(LEXICAL_INDEX))
    out: dict[str, str] = {}
    best_aug: dict[str, str] = {}
    for entry in idx.iter(f'{NS}entry'):
        xref = entry.find(f'{NS}xref')
        d = entry.find(f'{NS}def')
        if xref is None or d is None or not (d.text or '').strip():
            continue
        strong, aug = xref.get('strong'), xref.get('aug')
        if not strong:
            continue
        if strong not in out or aug == 'a' and best_aug.get(strong) != 'a':
            out[strong] = d.text.strip()
            best_aug[strong] = aug or ''
    return out


def main() -> None:
    lex = json.loads(LEX.read_text())
    index_gloss = clean_index_glosses()

    freq: collections.Counter = collections.Counter()
    pos_votes: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    for f in sorted(MT.glob('*.json')):
        chap = json.loads(f.read_text())
        for v in chap['verses']:
            for w in v['words']:
                if w.get('lang') == 'A':          # skip Aramaic — keep the deck purely Hebrew
                    continue
                s = re.sub(r'[^0-9]', '', str(w.get('strongs', '')))
                if not s:
                    continue
                freq[s] += 1
                pos_votes[s][pos_label(w.get('morph', '') or '')] += 1

    ranked = [s for s, _ in freq.most_common() if lex.get(s, {}).get('lemma')][:TOTAL]

    out = []
    cuts = []
    acc = 0
    for n in SECTION_SIZES:
        acc += n
        cuts.append(acc)
    for rank, s in enumerate(ranked, start=1):
        section = next(i + 1 for i, c in enumerate(cuts) if rank <= c)
        entry = lex.get(s, {})
        gloss = GLOSS_OVERRIDES.get(s) or index_gloss.get(s) or entry.get('gloss') or ''
        pos = pos_votes[s].most_common(1)[0][0] if pos_votes[s] else 'Particle'
        out.append({
            'word': LEMMA_OVERRIDES.get(s) or entry.get('lemma', ''),
            'inflection': None,
            'gloss': gloss,
            'pos': pos,
            'section': section,
            'freq': freq[s],
            'order': rank,
        })

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0))
    # Coverage per section, for the UI's "up to N% of the Hebrew Bible" labels.
    total_tokens = sum(freq.values())
    cum = 0
    cov = {}
    for sec, size in enumerate(SECTION_SIZES, start=1):
        seg = [w for w in out if w['section'] == sec]
        cum += sum(w['freq'] for w in seg)
        cov[sec] = round(cum / total_tokens * 100, 1)
    print(f'Hebrew vocabulary: {len(out)} words -> {OUT.relative_to(REPO)}')
    print('section sizes:', SECTION_SIZES)
    print('cumulative coverage %:', cov)


if __name__ == '__main__':
    main()
