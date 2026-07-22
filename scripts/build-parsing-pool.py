#!/usr/bin/env python3
"""Build the morphology-quiz parsing pool from the tagged GNT corpus.

Replaces the small hand-curated pool (src/data/greek-parsing-data.ts, 312 forms) with
real NT forms drawn from public/data/gnt/*.json, normalised into the vocabulary the quiz
UI uses. Glosses come from the MACULA/Nestle-1904 phrase tree (public/data/phrase-tree).

Normalisation applied:
  • "2nd Aorist"/"2nd Perfect"/… → Aorist/Perfect/… (2nd-formation is spelling, not tense)
  • person "1"/"2"/"3"           → "1st"/"2nd"/"3rd"
  • drops the tagger's stray junk values (casus "P"/"O"/"L", number "R"/"I"/"U", …)
  • drops Optative (excluded by request)
  • participles keep tense+voice+case+number+gender and carry NO person
  • infinitives keep tense+voice only
  • pronoun "type" comes from the tagger's part-of-speech class; pronoun "person" is
    derived from the lemma (only personal / possessive / reflexive pronouns have one)

Usage:  python3 scripts/build-parsing-pool.py [max_per_signature]
"""
import json, glob, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)
GNT = os.path.join(ROOT, 'public', 'data', 'gnt')
TREE = os.path.join(ROOT, 'public', 'data', 'phrase-tree')
OUT = os.path.join(ROOT, 'src', 'data', 'greek-parsing-pool.json')

# Distinct word-forms kept per parse signature. Nouns/adjectives only have ~30 possible
# signatures, so a higher cap is what gives those quizzes lexical variety.
MAX_PER_SIG = int(sys.argv[1]) if len(sys.argv) > 1 else 12

CASES   = {'Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative'}
NUMBERS = {'Singular', 'Plural'}
GENDERS = {'Masculine', 'Feminine', 'Neuter'}
TENSES  = {'Present', 'Imperfect', 'Future', 'Aorist', 'Perfect', 'Pluperfect'}
VOICES  = {'Active', 'Middle', 'Passive', 'Middle/Passive', 'Deponent'}
MOODS   = {'Indicative', 'Subjunctive', 'Imperative', 'Infinitive', 'Participle'}   # no Optative
PERSON  = {'1': '1st', '2': '2nd', '3': '3rd'}

PRONOUN_TYPE = {
    'Personal Pronoun': 'Personal', 'Demonstrative': 'Demonstrative',
    'Relative Pronoun': 'Relative', 'Interrogative Pronoun': 'Interrogative',
    'Indefinite Pronoun': 'Indefinite', 'Reflexive Pronoun': 'Reflexive',
    'Correlative Pronoun': 'Correlative', 'Possessive Pronoun': 'Possessive',
    'Reciprocal Pronoun': 'Reciprocal',
}
# Pronoun person is lexical, not tagged — derive it from the lemma.
PRONOUN_PERSON = {
    'ἐγώ': '1st', 'ἡμεῖς': '1st', 'κἀγώ': '1st', 'ἐμαυτοῦ': '1st', 'ἐμός': '1st', 'ἡμέτερος': '1st',
    'σύ': '2nd', 'ὑμεῖς': '2nd', 'σεαυτοῦ': '2nd', 'σός': '2nd', 'ὑμέτερος': '2nd',
    'αὐτός': '3rd', 'ἑαυτοῦ': '3rd', 'αὑτοῦ': '3rd',
}
PERSONED_TYPES = {'Personal', 'Possessive', 'Reflexive'}

# Person-marked pronouns (ἐγώ, σύ, ἡμεῖς, ὑμεῖς, the reflexives) are tagged in a SHIFTED
# layout — the tag "P-1GS" is split so that person lands in `casus`, case in `number` and
# number in `gender` (e.g. ἐγώ → casus '1', number 'G', gender 'S'). Those forms genuinely
# have no gender. Detect the layout by a numeric `casus` and re-read the fields.
CASE_LETTER = {'N': 'Nominative', 'G': 'Genitive', 'D': 'Dative', 'A': 'Accusative', 'V': 'Vocative'}
NUM_LETTER  = {'S': 'Singular', 'P': 'Plural'}

def norm_tense(t):  return re.sub(r'^2nd\s+', '', t or '') or None
def clean(v, allowed): return v if v in allowed else None

def load_glosses():
    """lemma -> most common English gloss, from the Nestle-1904 phrase tree."""
    counts = collections.defaultdict(collections.Counter)
    for f in glob.glob(os.path.join(TREE, '*.json')):
        try: d = json.load(open(f, encoding='utf-8'))
        except Exception: continue
        def walk(n):
            if n.get('t') == 'w':
                lem, g = n.get('lemma'), (n.get('gloss') or '').strip()
                if lem and g: counts[lem][g] += 1
            for c in n.get('c', []) or []: walk(c)
        for s in d.get('sentences', []) or []: walk(s.get('tree', {}))
    return {lem: c.most_common(1)[0][0] for lem, c in counts.items()}

def main():
    glosses = load_glosses()
    # signature -> list of entries (deduped by surface)
    buckets = collections.defaultdict(dict)
    stats = collections.Counter()

    for f in sorted(glob.glob(os.path.join(GNT, '*_*.json'))):
        for v in json.load(open(f, encoding='utf-8')).get('verses', []):
            ref = v.get('reference') or ''
            for w in v.get('words', []) or []:
                m = w.get('morph') or {}
                pos = m.get('partOfSpeech')
                surface, lemma = w.get('surface'), w.get('lemma')
                if not surface or not lemma:
                    continue
                casus  = clean(m.get('casus'), CASES)
                number = clean(m.get('number'), NUMBERS)
                gender = clean(m.get('gender'), GENDERS)
                base = dict(surface=surface, lexeme=lemma, gloss=glosses.get(lemma, ''), reference=ref)

                if pos == 'Verb':
                    tense = clean(norm_tense(m.get('tense')), TENSES)
                    voice = clean(m.get('voice'), VOICES)
                    mood  = clean(m.get('mood'), MOODS)
                    if not (tense and voice and mood):
                        continue
                    e = dict(base, partOfSpeech='Verb', tense=tense, voice=voice, mood=mood)
                    if mood == 'Participle':
                        if not (casus and number and gender): continue
                        e.update(casus=casus, number=number, gender=gender)   # no person
                        sig = ('V', tense, voice, mood, casus, number, gender)
                    elif mood == 'Infinitive':
                        sig = ('V', tense, voice, mood)
                    else:
                        person = PERSON.get(m.get('person') or '')
                        if not (person and number): continue
                        e.update(person=person, number=number)
                        sig = ('V', tense, voice, mood, person, number)

                elif pos == 'Noun':
                    if not (casus and number and gender): continue
                    e = dict(base, partOfSpeech='Noun', casus=casus, number=number, gender=gender)
                    sig = ('N', casus, number, gender)

                elif pos == 'Adjective':
                    if not (casus and number and gender): continue
                    e = dict(base, partOfSpeech='Adjective', casus=casus, number=number, gender=gender)
                    sig = ('A', casus, number, gender)

                elif pos in PRONOUN_TYPE:
                    ptype = PRONOUN_TYPE[pos]
                    raw_c, raw_n, raw_g = m.get('casus'), m.get('number'), m.get('gender')
                    if raw_c in PERSON:                       # shifted layout: person/case/number
                        person = PERSON[raw_c]
                        pc, pn = CASE_LETTER.get(raw_n), NUM_LETTER.get(raw_g)
                        if not (pc and pn): continue          # garbled (some possessives)
                        e = dict(base, partOfSpeech='Pronoun', person=person, casus=pc, number=pn,
                                 pronounType=ptype)           # no gender: these forms have none
                        sig = ('P', ptype, pc, pn, '', person)
                    else:                                     # normal case/number/gender layout
                        if not (casus and number and gender): continue
                        e = dict(base, partOfSpeech='Pronoun', casus=casus, number=number,
                                 gender=gender, pronounType=ptype)
                        person = PRONOUN_PERSON.get(lemma) if ptype in PERSONED_TYPES else None
                        if person: e['person'] = person
                        sig = ('P', ptype, casus, number, gender, person or '')
                else:
                    continue

                stats[sig[0]] += 1
                b = buckets[sig]
                if surface not in b and len(b) < MAX_PER_SIG:
                    b[surface] = e

    groups = {'Verb': [], 'Noun': [], 'Adjective': [], 'Pronoun': []}
    for sig, b in buckets.items():
        for e in b.values():
            groups[e['partOfSpeech']].append(e)
    for g in groups.values():
        g.sort(key=lambda e: (e.get('lexeme') or '', e['surface']))

    ORDER = ['surface', 'lexeme', 'gloss', 'partOfSpeech', 'tense', 'voice', 'mood',
             'person', 'number', 'casus', 'gender', 'pronounType', 'reference']
    def trim(e): return {k: e[k] for k in ORDER if e.get(k)}
    payload = {
        '_generated': 'scripts/build-parsing-pool.py — do not edit by hand',
        '_note': 'NT forms from the tagged GNT corpus, normalised. Optative excluded; '
                 'participles carry case/number/gender and no person.',
        'verb': [trim(e) for e in groups['Verb']],
        'noun': [trim(e) for e in groups['Noun']],
        'adjective': [trim(e) for e in groups['Adjective']],
        'pronoun': [trim(e) for e in groups['Pronoun']],
    }
    with open(OUT, 'w', encoding='utf-8') as o:
        json.dump(payload, o, ensure_ascii=False, separators=(',', ':'))

    total = sum(len(g) for g in groups.values())
    print(f'{OUT}')
    print(f'  signatures: {len(buckets)}   entries: {total}   (max {MAX_PER_SIG} per signature)')
    for k, g in groups.items():
        print(f'  {k:10} {len(g):5}  (from {stats[k[0]]} tagged tokens)')
    print(f'  glosses available for {len(glosses)} lemmas')

if __name__ == '__main__':
    main()
