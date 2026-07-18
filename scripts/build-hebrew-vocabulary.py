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

# Sections 4–7 (ranks ~301–1036). Same treatment: standard concise glosses, fixing root-sense
# and homonym errors (e.g. סוּס "swallow"→horse, כֹּחַ "chameleon"→strength, דָּן "Daniel"→Dan),
# trimming lexicon cruft ("Compare", "See also", "from the margin"), and modernizing name
# spellings (Abishalom→Absalom, Zachariah→Zechariah, Beer-shebah→Beersheba).
GLOSS_OVERRIDES.update({
    '4194': 'death', '2490': 'to profane, defile; begin (hiph.)', '4908': 'tabernacle, dwelling place',
    '2451': 'wisdom', '1755': 'generation', '639': 'nose, nostril; anger', '5159': 'inheritance, possession',
    '2026': 'to kill, slay', '3680': 'to cover, conceal', '587': 'we', '3467': 'to save, deliver',
    '3477': 'upright, straight', '7843': 'to destroy, corrupt, ruin', '982': 'to trust',
    '899': 'garment, clothing', '5483': 'horse', '2346': 'wall', '4557': 'number',
    '6951': 'assembly, congregation', '2617': 'steadfast love, loyalty, kindness',
    '3709': 'palm, hand, sole', '1058': 'to weep', '5104': 'river', '8267': 'falsehood, lie, deception',
    '53': 'Absalom', '6918': 'holy', '954': 'to be ashamed', '5012': 'to prophesy',
    '1115': 'not, except, without', '2803': 'to think, reckon, devise', '8083': 'eight',
    '7535': 'only, surely', '3327': 'Isaac', '2677': 'half', '5066': 'to draw near, approach',
    '6999': 'to burn incense, make offerings smoke', '5656': 'service, labor, work',
    '571': 'truth, faithfulness', '8210': 'to pour out, shed', '7992': 'third',
    '539': 'to believe, trust; be firm (niph.)', '5983': 'Ammon', '3532': 'lamb',
    '3190': 'to be good, go well; do good', '8111': 'Samaria', '2233': 'seed, offspring',
    '1431': 'to be great, grow; make great', '3498': 'to remain, be left over',
    '7999': 'to be complete; repay, recompense', '6912': 'to bury', '6471': 'time, occurrence; step',
    '8548': 'continually, regularly', '4467': 'kingdom, dominion', '3379': 'Jeroboam', '216': 'light',
    '5771': 'iniquity, guilt, punishment', '4592': 'little, few', '7489': 'to be evil; do harm, break',
    '7291': 'to pursue, chase', '123': 'Edom', '7458': 'famine, hunger', '6083': 'dust', '6828': 'north',
    '2005': 'behold; if', '3282': 'because', '1060': 'firstborn', '6908': 'to gather, collect',
    '7637': 'seventh', '6996': 'small, young', '7993': 'to throw, cast, fling', '6215': 'Esau',
    '8313': 'to burn', '1481': 'to sojourn, dwell as a stranger', '7393': 'chariot(s), chariotry',
    '3722': 'to atone, make atonement', '6666': 'righteousness', '905': 'part; alone (with לְ); linen',
    '5048': 'before, in front of, opposite', '3847': 'to put on, wear, clothe',
    '3499': 'remainder, rest, excess', '7323': 'to run', '3667': 'Canaan', '2889': 'clean, pure',
    '256': 'Ahab', '8193': 'lip, edge, shore; language', '3513': 'to be heavy, honored; honor (piel)',
    '1197': 'to burn, consume; graze', '3742': 'cherub', '7657': 'seventy', '4687': 'commandment',
    '7097': 'end, extremity', '8549': 'blameless, complete, perfect', '3920': 'to capture, seize',
    '251': 'brother', '2734': 'to be(come) angry, burn', '2015': 'to turn, overturn, overthrow',
    '8057': 'joy, gladness', '2181': 'to be a prostitute, be unfaithful', '7130': 'midst, inner part',
    '6664': 'righteousness, justice', '8255': 'shekel', '7911': 'to forget', '2931': 'unclean, impure',
    '567': 'Amorite', '7891': 'to sing', '7646': 'to be satisfied, full', '7676': 'Sabbath',
    '5676': 'other side, region across; beyond', '1116': 'high place', '5982': 'pillar, column',
    '1616': 'sojourner, resident alien', '6285': 'corner, side, edge', '7350': 'far, distant',
    '4422': 'to escape, deliver, rescue', '1847': 'knowledge', '8130': 'to hate', '7892': 'song',
    '3092': 'Jehoshaphat', '8441': 'abomination', '6051': 'cloud',
    '3885': 'to lodge, spend the night; murmur', '2491': 'slain, pierced', '1035': 'Bethlehem',
    '5162': 'to comfort; be sorry, relent', '6311': 'here', '2145': 'male', '349': 'how?',
    '5045': 'Negev, south', '6419': 'to pray, intercede', '3083': 'Jonathan', '1168': 'Baal',
    '5785': 'skin, hide, leather', '738': 'lion', '2891': 'to be clean, pure; purify', '6529': 'fruit',
    '3034': 'to praise, give thanks; confess', '241': 'ear', '4758': 'appearance, sight, vision',
    '2822': 'darkness', '3678': 'throne, seat', '4910': 'to rule, govern', '5462': 'to shut, close',
    '2459': 'fat', '8074': 'to be desolate, appalled', '3778': 'Chaldean', '4713': 'Egyptian',
    '1270': 'iron', '7069': 'to acquire, buy, get; create', '2114': 'to be a stranger; be strange',
    '205': 'trouble, wickedness, iniquity', '2543': 'donkey, ass', '3064': 'Jew, Judean',
    '5061': 'plague, mark, affliction', '5542': 'selah', '3669': 'Canaanite; merchant',
    '2654': 'to delight in, desire', '3206': 'child, boy', '5641': 'to hide, conceal', '5795': 'goat',
    '499': 'Eleazar', '1410': 'Gad', '7138': 'near', '8002': 'peace offering, fellowship offering',
    '2706': 'statute, decree, portion', '5324': "to stand, take one's stand; station", '7205': 'Reuben',
    '1817': 'door, gate; column (of writing)', '4069': 'why?', '3001': 'to be dry, wither',
    '2470': 'to be sick, weak; entreat', '7341': 'breadth, width', '341': 'enemy',
    '7819': 'to slaughter, kill', '6041': 'poor, afflicted, humble', '7782': "trumpet, ram's horn, shofar",
    '1077': 'not', '452': 'Elijah', '5775': 'bird(s), flying creatures', '7364': 'to wash, bathe',
    '1835': 'Dan', '3581': 'strength, power', '2199': 'to cry out, call', '3844': 'Lebanon',
    '7043': 'to be light, swift; curse', '2790': 'to engrave, plow; be silent, deaf', '3684': 'fool',
    '730': 'cedar', '7023': 'wall', '3671': 'wing, edge, corner', '7673': 'to cease, rest, stop',
    '8641': 'contribution, offering, tribute', '6186': 'to arrange, set in order',
    '3603': 'talent; round loaf; district', '2580': 'favor, grace', '1964': 'temple, palace',
    '226': 'sign', '5782': 'to rouse, awake, stir up', '6098': 'counsel, advice, plan',
    '1157': 'behind, through; on behalf of', '40': 'Abimelech', '884': 'Beersheba',
    '6106': 'bone; self, substance', '1389': 'hill', '2534': 'wrath, heat, fury', '6010': 'valley',
    '1486': 'lot', '7794': 'ox, bull', '1892': 'vapor, breath, vanity',
    '1350': 'to redeem, act as kinsman', '441': 'chief, leader; friend', '3289': 'to advise, counsel',
    '5329': 'to oversee, direct (piel); endure', '1397': 'man, strong man', '7925': 'to rise early',
    '8628': 'to thrust, drive, blow (a horn), clap', '3878': 'Levi', '8334': 'to minister, serve',
    '3754': 'vineyard', '6697': 'rock', '953': 'pit, cistern', '5027': 'to look, gaze, regard',
    '74': 'Abner', '6566': 'to spread out, stretch out', '6667': 'Zedekiah', '5707': 'witness',
    '7896': 'to put, set, place', '801': 'fire offering, offering by fire', '2275': 'Hebron',
    '4116': 'to hasten, hurry', '7611': 'remnant, remainder', '6862': 'narrow, distress; adversary',
    '6743': 'to prosper, succeed; rush', '753': 'length', '3225': 'right hand; south',
    '3988': 'to reject, despise, refuse', '87': 'Abram', '7392': 'to ride, mount',
    '5117': 'to rest, settle', '1109': 'Balaam', '4376': 'to sell', '6924': 'east; ancient time',
    '7919': 'to be prudent, act wisely; understand', '1995': 'multitude, tumult, noise', '1316': 'Bashan',
    '3802': 'shoulder, side, slope', '1293': 'blessing', '4782': 'Mordecai', '4080': 'Midian',
    '8346': 'sixty', '1516': 'valley, ravine', '7998': 'spoil, plunder, booty', '214': 'treasure, storehouse',
    '5019': 'Nebuchadnezzar', '8163': 'he-goat; hairy', '4392': 'full', '3058': 'Jehu',
    '1272': 'to flee, run away', '8672': 'nine', '7004': 'incense', '609': 'Asa',
    '6869': 'distress, trouble, adversity', '7093': 'end', '477': 'Elisha', '34': 'needy, poor',
    '6160': 'desert plain, Arabah', '433': 'God, god', '1097': 'without, not; lacking', '3644': 'like, as',
    '347': 'Job', '2555': 'violence, wrong', '4931': 'charge, duty, watch, guard',
    '4853': 'burden, load; oracle', '2256': 'cord, rope; territory; pang', '3405': 'Jericho',
    '7167': 'to tear, rend', '7070': 'reed, stalk; measuring rod', '2308': 'to cease, stop, refrain',
    '779': 'to curse', '3782': 'to stumble, stagger, totter', '1167': 'owner, lord, husband, master',
    '8077': 'desolation, waste', '4210': 'psalm', '2342': 'to writhe, tremble; be in labor',
    '3824': 'heart, mind', '7979': 'table', '7927': 'Shechem', '2389': 'strong, mighty', '7585': 'Sheol',
    '2962': 'not yet, before', '7243': 'fourth', '270': 'to grasp, seize, take hold', '7272': 'foot',
    '8045': 'to be destroyed; destroy, exterminate', '6817': 'to cry out, call out',
    '2781': 'reproach, disgrace', '2975': 'Nile, river, canal', '3956': 'tongue, language', '3837': 'Laban',
    '635': 'Esther', '7381': 'scent, smell, odor', '7198': 'bow', '14': 'to be willing, consent',
    '2505': 'to divide, share, apportion', '3925': 'to learn; teach (piel)',
    '2282': 'festival, feast, pilgrimage', '7368': 'to be far, distant; keep far', '2001': 'Haman',
    '7703': 'to devastate, despoil, destroy', '4886': 'to anoint', '4060': 'measure, measurement',
    '6659': 'Zadok', '2319': 'new', '7442': 'to sing, cry out for joy', '3293': 'forest, thicket, wood',
    '4682': 'unleavened bread', '7161': 'horn', '2977': 'Josiah', '5945': 'Most High; upper, highest',
    '1706': 'honey', '5553': 'rock, cliff, crag', '4082': 'province, district', '4791': 'height, high place',
    '6466': 'to do, make, work', '7723': 'emptiness, vanity, falsehood', '5560': 'fine flour',
    '7495': 'to heal', '4279': 'tomorrow', '8552': 'to be complete, finished; be blameless',
    '2232': 'to sow, scatter seed', '3077': 'Jehoiada', '5321': 'Naphtali',
    '3240': 'to set down, leave, deposit; give rest', '3407': 'curtain, tent-curtain',
    '314': 'last, latter, western', '5703': 'perpetuity, forever', '1869': 'to tread, march; bend (a bow)',
    '3119': 'by day, daytime', '5291': 'girl, young woman, maid',
    '6031': 'to afflict, oppress, humble; be afflicted', '1945': 'woe! ah! alas!',
    '631': 'to bind, tie, imprison', '3384': 'to throw, shoot; teach, instruct', '2008': 'here, hither',
    '3198': 'to decide, reprove, rebuke, argue', '5157': 'to inherit, take possession', '7346': 'Rehoboam',
    '1130': 'Ben-hadad', '6327': 'to be scattered, dispersed',
    '7378': 'to strive, contend, conduct a lawsuit', '3050': 'Yah (the LORD)', '646': 'ephod',
    '8504': 'blue, violet', '6453': 'Passover', '3526': 'to wash, launder, full',
    '2372': 'to see, behold, perceive', '3458': 'Ishmael', '1692': 'to cling, cleave, stick to',
    '2850': 'Hittite', '5838': 'Azariah', '2007': 'they, these (f.)', '1698': 'pestilence, plague',
    '4043': 'shield', '490': 'widow', '8610': 'to seize, grasp, capture, wield', '4058': 'to measure',
    '3332': 'to pour, cast (metal)', '898': 'to act treacherously, deal faithlessly',
    '4148': 'discipline, correction, instruction', '6921': 'east; east wind', '7706': 'Shaddai, the Almighty',
    '3320': "to take one's stand, station oneself", '3101': 'Joash', '4438': 'kingdom, royalty, reign',
    '6555': 'to break through, burst out; spread', '2865': 'to be shattered, dismayed, terrified',
    '2708': 'statute, ordinance', '2472': 'dream', '7354': 'Rachel', '1800': 'poor, weak, low, thin',
    '5193': 'to plant', '7175': 'board, plank', '5146': 'Noah', '623': 'Asaph',
    '5766': 'injustice, wrong, iniquity', '3957': 'chamber, room, hall', '1330': 'virgin, maiden',
    '6913': 'grave, tomb, burial place', '7523': 'to murder, slay, kill', '5545': 'to forgive, pardon',
    '7225': 'beginning, first, chief', '2220': 'arm; strength', '1234': 'to split, cleave, break open',
    '5826': 'to help, aid', '2074': 'Zebulun', '5797': 'strength, might, power',
    '4609': 'step, stair; ascent; degree', '1834': 'Damascus', '4026': 'tower',
    '7521': 'to be pleased with, accept, favor', '5237': 'foreign, alien, strange',
    '2506': 'portion, share, tract', '194': 'perhaps, maybe', '7716': 'sheep, lamb, one of a flock',
    '6565': 'to break, annul, frustrate', '1612': 'vine', '3129': 'Jonathan', '5057': 'leader, ruler, prince',
    '8095': 'Simeon', '5062': 'to strike, smite, plague; be defeated', '8096': 'Shimei',
    '7321': 'to shout, raise a war cry, sound an alarm', '7114': 'to be short; reap, harvest',
    '6381': 'to be extraordinary, wonderful; do wondrously', '5715': 'testimony, decree', '3485': 'Issachar',
    '836': 'Asher', '5668': 'for the sake of, because of', '1523': 'to rejoice, be glad',
    '6571': 'horseman; horse', '3335': 'to form, fashion, shape', '1473': 'exile, captivity, exiles',
    '4784': 'to be rebellious, disobedient', '5355': 'innocent, free from guilt', '4970': 'when?',
    '2296': 'to gird, gird on', '3871': 'tablet, board, plank', '6588': 'transgression, rebellion',
    '5341': 'to guard, keep, watch, preserve', '346': 'where?', '1101': 'to mix, mingle, confuse',
    '734': 'path, way', '1111': 'Balak', '3448': 'Jesse', '1141': 'Benaiah', '5416': 'Nathan',
    '6113': 'to restrain, hold back, detain; shut up', '4217': 'east, sunrise', '6865': 'Tyre',
    '8242': 'sackcloth; sack', '4501': 'lampstand', '5331': 'forever, perpetuity; victory',
    '1053': 'Beth-shemesh', '681': 'beside, near, next to', '575': 'where? whither?', '983': 'security, safety',
    '2461': 'milk', '582': 'man, mankind', '7628': 'captivity, captives', '8144': 'scarlet, crimson',
    '8438': 'worm; crimson', '2885': 'ring, signet ring', '6960': 'to wait for, hope', '2983': 'Jebusite',
    '8098': 'Shemaiah', '2148': 'Zechariah', '2167': 'to make music, sing praises', '6299': 'to redeem, ransom',
    '271': 'Ahaz', '8252': 'to be quiet, at rest, undisturbed', '3303': 'beautiful, fair',
    '6586': 'to rebel, transgress', '3985': 'to refuse', '2550': 'to spare, have compassion, pity',
    '657': 'end, nothing; only', '5564': 'to lean, lay (hands), support, sustain',
    '8582': 'to wander, go astray, err', '2717': 'to be dry, waste; be in ruins', '2100': 'to flow, discharge',
    '8336': 'fine linen; alabaster', '1581': 'camel', '5654': 'Obed-edom', '7125': 'to meet, encounter',
    '558': 'Amaziah', '2029': 'to conceive, be pregnant', '6293': 'to meet, encounter, reach; entreat',
    '4960': 'feast, banquet', '8605': 'prayer', '374': 'ephah', '6343': 'dread, fear, terror',
    '7105': 'harvest', '215': 'to be light, shine; give light', '2763': 'to devote to destruction, ban',
    '693': 'to lie in wait, ambush', '7379': 'strife, dispute, lawsuit', '8047': 'waste, horror, desolation',
    '8248': 'to give drink, water, irrigate', '6833': 'bird', '5207': 'soothing, pleasing (aroma)',
    '6002': 'Amalek', '6584': 'to strip off, take off; raid', '4631': 'cave', '223': 'Uriah',
    '7157': 'Kiriath-jearim', '3658': 'lyre, harp', '4847': 'Merari', '3470': 'Isaiah',
    '4735': 'livestock, cattle, possession', '2729': 'to tremble, be terrified',
    '3515': 'heavy, weighty, severe', '6823': 'to overlay, plate (with metal)',
    '2603': 'to be gracious, show favor', '6887': 'to bind, be narrow, distress; be an adversary',
    '4751': 'bitter', '4820': 'deceit, treachery', '3490': 'orphan, fatherless', '5857': 'Ai',
    '1439': 'Gideon', '2549': 'fifth', '6950': 'to assemble, gather', '8084': 'eighty',
    '959': 'to despise, hold in contempt', '4131': 'to totter, slip, shake, be moved',
    '4720': 'sanctuary, holy place', '2809': 'Heshbon', '56': 'to mourn', '835': 'happy, blessed (is)',
    '7194': 'to bind, conspire, league together', '4306': 'rain',
    '5749': 'to testify, warn, admonish', '1588': 'garden', '3176': 'to wait, hope',
    '962': 'to plunder, spoil, take as booty', '5352': 'to be free, innocent; acquit',
    '817': 'guilt, guilt offering', '713': 'purple', '1254': 'to create', '1347': 'pride, majesty, exaltation',
    '8283': 'Sarah', '8123': 'Samson', '7141': 'Korah', '1390': 'Gibeah',
    '914': 'to separate, divide, set apart', '7778': 'gatekeeper, porter', '268': 'back, rear, behind',
    '7503': 'to sink, relax, grow slack; let go', '274': 'Ahaziah', '3079': 'Jehoiakim', '3602': 'thus, so',
    '1364': 'high, tall, lofty', '3373': 'fearing, afraid; God-fearing', '5511': 'Sihon',
    '2740': 'burning anger, wrath', '1219': 'to cut off; fortify, make inaccessible',
    '2723': 'ruin, waste, desolation', '8165': 'Seir', '7832': 'to laugh, play, mock',
    '2796': 'craftsman, engraver, artisan', '8643': 'shout, alarm, blast, war cry', '8398': 'world',
    '3556': 'star', '5631': 'official, eunuch', '6738': 'shadow, shade', '7186': 'hard, harsh, stubborn',
    '5234': 'to recognize, acknowledge, regard', '4347': 'blow, wound, plague, defeat',
    '990': 'belly, womb', '6663': 'to be righteous, just; be justified',
    '7181': 'to pay attention, listen, heed', '5236': 'foreignness, foreign land/gods', '1589': 'to steal',
    '5422': 'to tear down, break down, demolish', '875': 'well, pit', '2620': 'to take refuge, seek shelter',
    '5467': 'Sodom', '8415': 'deep, abyss, primeval ocean', '339': 'coastland, island, shore',
    '6524': 'to bud, sprout, blossom, break out', '6189': 'uncircumcised',
    '4603': 'to act unfaithfully, treacherously', '5035': 'jar, skin-bottle; harp',
    '4136': 'in front of, opposite, facing', '1391': 'Gibeon', '2377': 'vision', '3612': 'Caleb',
    '553': 'to be strong; strengthen, make firm', '4436': 'queen', '1767': 'enough, sufficiency',
    '1537': 'Gilgal', '3444': 'salvation, deliverance', '3950': 'to gather, glean, pick up',
    '8198': 'maidservant, female slave', '7667': 'breaking, fracture, ruin', '5514': 'Sinai',
    '3816': 'people, nation', '8184': 'barley', '2574': 'Hamath', '7264': 'to tremble, quake, rage',
    '6696': 'to besiege, confine, bind up', '3368': 'precious, rare, costly', '2518': 'Hilkiah',
    '4284': 'thought, plan, scheme, design', '197': 'porch, vestibule, hall', '8127': 'tooth; ivory',
    '5695': 'calf', '842': 'Asherah, sacred pole', '2040': 'to tear down, overthrow, demolish',
    '212': 'wheel', '5128': 'to shake, totter, wander, stagger', '5680': 'Hebrew',
    '5358': 'to avenge, take vengeance', '5643': 'hiding place, shelter, secret',
    '7107': 'to be angry, wrathful', '816': 'to be guilty, offend, bear guilt',
    '8227': 'rock badger, hyrax', '4229': 'to wipe, wipe out, blot out', '272': 'possession, property',
    '5999': 'trouble, toil, labor, misery', '3812': 'Leah', '998': 'understanding, insight',
    '3637': 'to be humiliated, ashamed, disgraced', '4318': 'Micah', '7617': 'to take captive',
    '1653': 'rain, shower', '5941': 'Eli', '8394': 'understanding, insight',
    '6763': 'rib, side; side-chamber; plank', '1361': 'to be high, exalted; be haughty',
    '6822': 'to watch, keep watch, look out', '3374': 'fear, reverence',
    '7339': 'open square, plaza, broad place', '5130': 'to wave, brandish; sprinkle', '3876': 'Lot',
    '6241': 'tenth (of an ephah)', '6643': 'beauty, splendor; gazelle',
    '2502': 'to draw off; equip, arm; rescue', '6955': 'Kohath', '1644': 'to drive out, cast out, expel',
    '1661': 'Gath', '6779': 'to sprout, spring up, grow', '2764': 'devoted thing, ban; net',
    '4948': 'weight', '5381': 'to reach, overtake, attain', '2600': 'freely, for nothing, in vain',
    '1436': 'Gedaliah', '2132': 'olive, olive tree', '6442': 'inner, interior',
    '3972': 'anything; (with neg.) nothing', '5594': 'to wail, mourn, lament', '7887': 'Shiloh',
    '4709': 'Mizpah', '3766': 'to bow down, kneel, crouch', '5518': 'pot, cauldron; thorn',
    '5739': 'flock, herd', '6172': 'nakedness, shame, indecency', '2876': 'guard; cook, slaughterer',
    '6883': 'skin disease, leprosy', '2236': 'to sprinkle, toss, scatter',
    '8426': 'thanksgiving, thank offering, praise', '7262': 'Rabshakeh', '6212': 'grass, herbage',
    '7133': 'offering, oblation', '4283': 'the next day, the morrow', '2595': 'spear',
    '1416': 'raiding band, troop', '1637': 'threshing floor', '4932': 'double, second, copy',
    '517': 'mother', '2778': 'to reproach, taunt, defy', '2244': 'to hide, withdraw, conceal oneself',
    '4219': 'bowl, basin', '4818': 'chariot', '8040': 'left hand, left side',
    '1993': 'to murmur, roar, moan; be turbulent', '335': 'where? which?', '3611': 'dog',
    '113': 'lord, master', '7045': 'curse', '4900': 'to draw, drag, pull; prolong',
    '3233': 'right; southern', '7416': 'pomegranate', '5087': 'to vow, make a vow',
    '5203': 'to leave, forsake, abandon; spread out', '1715': 'grain, corn', '5175': 'serpent, snake',
    '1104': 'to swallow, engulf; destroy', '325': 'Ahasuerus (Xerxes)', '4135': 'to circumcise',
    '400': 'food', '561': 'word, speech, saying', '5003': 'to commit adultery',
    '2563': 'clay, mortar; heap; homer (measure)', '3568': 'Cush', '54': 'Abiathar',
    '543': 'amen, truly, so be it', '3665': 'to be humbled, subdued; humble, subdue', '2406': 'wheat',
    '8597': 'beauty, glory, splendor', '5126': 'Nun', '5592': 'threshold; basin, bowl', '160': 'love',
    '4159': 'wonder, sign, portent', '2280': 'to bind, bind up, saddle, wrap', '5645': 'cloud, thicket',
    '2315': 'chamber, room, inner room', '591': 'ship', '4912': 'proverb, parable, byword',
    '423': 'oath, curse', '3316': 'Jephthah', '5080': 'to drive away, scatter, banish',
    '8384': 'fig tree, fig', '3123': 'dove', '3715': 'young lion', '6099': 'mighty, numerous, strong',
    '3213': 'to howl, wail', '319': 'end, latter part, outcome, future',
    '8573': 'wave offering, brandishing', '7355': 'to have compassion, show mercy, love', '7259': 'Rebekah',
    '1497': 'to tear away, seize, rob, plunder', '5401': 'to kiss', '6224': 'tenth', '2689': 'trumpet',
    '3442': 'Jeshua', '860': 'female donkey, she-ass', '6239': 'riches, wealth', '1840': 'Daniel',
    '3157': 'Jezreel', '7151': 'town, city', '3582': 'to hide, conceal, efface', '2919': 'dew',
    '5521': 'booth, hut, shelter, tabernacle', '3088': 'Jehoram', '748': 'to be long, prolong; be patient',
    '4605': 'above, upward, on top', '6231': 'to oppress, wrong, extort', '1826': 'to be silent, still',
    '970': 'young man', '8416': 'praise, song of praise', '8492': 'new wine, must',
    '7493': 'to quake, shake, tremble', '6260': 'male goat, he-goat; leader', '3836': 'white',
    '1259': 'hail', '5867': 'Elam', '8345': 'sixth', '8066': 'eighth',
})


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
            # Stable unique key: Hebrew has homographs (same pointing, different Strong's), so the
            # displayed lemma is NOT unique — the app keys React lists and SM-2 progress off this.
            'id': f"{LEMMA_OVERRIDES.get(s) or entry.get('lemma', '')}|{s}",
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
