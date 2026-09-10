"""GNT surface→analysis index + BGVB glosses, for building homework word records."""
import json, glob, re, unicodedata, collections, os

REPO = '/Users/cvine/dev/seminary-greek-reader'

def strip_acc(s):
    """Drop ACCENTS but keep breathings, iota subscript and diaeresis — the decks' own style."""
    out = []
    for ch in unicodedata.normalize('NFD', s):
        if ch in '́̀͂':      # oxia, varia, perispomeni
            continue
        out.append(ch)
    return unicodedata.normalize('NFC', ''.join(out))

def bare(s):
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if not unicodedata.combining(c)).lower()

_PUNCT = '.,;·∙:!?()[]«»"\'’ʼ᾽—–'

def clean(tok):
    return tok.strip(_PUNCT).strip()

def build_index():
    exact = collections.defaultdict(collections.Counter)   # accented surface -> analyses
    loose = collections.defaultdict(collections.Counter)   # accent-stripped -> analyses
    for f in glob.glob(os.path.join(REPO, 'public/data/gnt/*.json')):
        d = json.load(open(f))
        for v in d['verses']:
            for w in v.get('words') or []:
                m = w['morph']
                # .get(): ~2% of records carry no number/gender at all
                key = (w['lemma'], m.get('partOfSpeech'), m.get('casus'), m.get('number'),
                       m.get('gender'), m.get('tense'), m.get('voice'), m.get('mood'), m.get('person'))
                s = clean(w['surface'])
                exact[s][key] += 1
                loose[bare(s)][key] += 1
    return exact, loose

def bgvb():
    d = json.load(open(os.path.join(REPO, 'src/data/bgvb-vocabulary.json')))
    by_lemma = {}
    for e in d:
        by_lemma.setdefault(e['word'], e)
        by_lemma.setdefault(bare(e['word']), e)
    return by_lemma

CASE = {'Nominative':'Nom','Genitive':'Gen','Dative':'Dat','Accusative':'Acc','Vocative':'Voc'}
NUM  = {'Singular':'Sg','Plural':'Pl','Dual':'Du'}
GEN  = {'Masculine':'Masc','Feminine':'Fem','Neuter':'Neut'}
TENSE= {'Present':'Pres','Imperfect':'Impf','Aorist':'Aor','Future':'Fut','Perfect':'Perf',
        'Pluperfect':'Plup','Second Aorist':'2Aor','2nd Aorist':'2Aor','2nd Perfect':'2Perf','2nd Future':'2Fut'}
VOICE= {'Active':'Act','Middle':'Mid','Passive':'Pass','Middle or Passive':'Mid/Pass',
        'Middle Deponent':'Mid','Passive Deponent':'Pass','Deponent':'Dep'}
MOOD = {'Indicative':'Ind','Subjunctive':'Subj','Imperative':'Impv','Optative':'Opt',
        'Infinitive':'Inf','Participle':'Ptc'}
PERSON={'First':'1','Second':'2','Third':'3','1':'1','2':'2','3':'3'}

def parsing(key):
    lemma, pos, case, num, gender, tense, voice, mood, person = key
    if pos == 'Article':
        return f"Article — {CASE.get(case,'')} {NUM.get(num,'')} {GEN.get(gender,'')}".rstrip()
    if pos == 'Verb':
        bits = [TENSE.get(tense, tense or ''), VOICE.get(voice, voice or ''), MOOD.get(mood, mood or '')]
        if mood in ('Participle',):
            bits += [CASE.get(case,''), NUM.get(num,''), GEN.get(gender,'')]
        elif mood == 'Infinitive':
            pass
        else:
            bits += [PERSON.get(str(person), ''), NUM.get(num,'')]
        return ' '.join(b for b in bits if b) + f" — {lemma}"
    if pos and ('Noun' in pos or 'Adjective' in pos or 'Pronoun' in pos or 'Numeral' in pos):
        bits = [CASE.get(case,''), NUM.get(num,''), GEN.get(gender,'')]
        return ' '.join(b for b in bits if b) + f" — {lemma}"
    if pos == 'Preposition':
        return f"Preposition + {'genitive' if case=='Genitive' else 'dative' if case=='Dative' else 'accusative'}"
    if pos == 'Conjunction':
        return 'Conjunction'
    if pos == 'Adverb':
        return 'Adverb'
    if pos in ('Particle','Interjection'):
        return 'Particle'
    return f"{pos} — {lemma}" if lemma else pos
