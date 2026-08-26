#!/usr/bin/env python3
"""Pilot: tag normalised Swete chapter files with lemma + morph + Strong's.

Swete gives surface forms only. The app's LXX word record needs lemma, strongs and a
structured morph object — the parsing pane, construct search, the Allusions tab and
lemma-forms all depend on them. This produces those, marking every generated field
with data_origin so nothing machine-made is mistaken for attested.

Reuses the UD->traditional conversion from scripts/build-texts-morph.py so the labels
match the rest of the app (Josephus, the Greco-Roman prose).
"""
import json, os, re, sys, unicodedata, importlib.util, warnings
warnings.filterwarnings('ignore')
REPO = '/Users/cvine/dev/seminary-greek-reader'
spec = importlib.util.spec_from_file_location('btm', f'{REPO}/scripts/build-texts-morph.py')
btm = importlib.util.module_from_spec(spec); spec.loader.exec_module(btm)

def fold(s):
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if not unicodedata.combining(c)).lower().replace('ς','σ')

# lemma -> Strong's, from the lexicon already shipped.
#
# EXACT SPELLING FIRST. Folding the accents away makes εἰς "into" and εἷς "one" the same key, and
# whichever of them the lexicon happened to list first then claimed every occurrence of both — 6,749
# prepositions were filed as the numeral before this was caught. The folded map is still useful for
# the spelling differences between our lemmas and Strong's 19th-century headwords, but only where no
# two lexemes collide in it. See scripts/lxx-fix-homographs.py, which repaired the damage.
import collections as _c
exact, _folded = {}, _c.defaultdict(set)
for num, e in json.load(open(f'{REPO}/public/data/strongs-greek.json')).items():
    lem = e.get('lemma')
    if not lem: continue
    exact.setdefault(lem, num.lstrip('G'))
    _folded[fold(lem)].add((lem, num.lstrip('G')))
strongs = {k: next(iter(v))[1] for k, v in _folded.items() if len({l for l, _ in v}) == 1}


def strongs_for(lemma):
    """The number for this lexeme, spelled the way it is spelled."""
    key = fold(lemma)
    return (exact.get(lemma)
            or exact.get(lemma[:1].lower() + lemma[1:])
            or strongs.get(key)
            or strongs.get(key.replace('γιγν', 'γιν').replace('ιγν', 'ιν')))

UPOS = {'VERB':'Verb','AUX':'Verb','NOUN':'Noun','PROPN':'Noun','ADJ':'Adjective',
        'PRON':'Pronoun','DET':'Article','ADP':'Preposition','CCONJ':'Conjunction',
        'SCONJ':'Conjunction','ADV':'Adverb','PART':'Particle','NUM':'Numeral',
        'INTJ':'Interjection'}
CASE  = {'Nom':'Nominative','Gen':'Genitive','Dat':'Dative','Acc':'Accusative','Voc':'Vocative'}
NUMB  = {'Sing':'Singular','Plur':'Plural','Dual':'Dual'}
GEND  = {'Masc':'Masculine','Fem':'Feminine','Neut':'Neuter'}
VOICE = {'Act':'Active','Mid':'Middle','Pass':'Passive','MidPass':'Middle'}
MOOD  = {'Ind':'Indicative','Imp':'Imperative','Sub':'Subjunctive','Opt':'Optative'}

def to_morph(upos, feats):
    """UD upos+feats -> the structured shape public/data/lxx word records use."""
    f = btm.parse_feats(feats)
    vf = f.get('VerbForm')
    mood = 'Infinitive' if vf == 'Inf' else 'Participle' if vf == 'Part' else MOOD.get(f.get('Mood'))
    return {
        'partOfSpeech': UPOS.get(upos),
        'casus':  CASE.get(f.get('Case')),
        'number': NUMB.get(f.get('Number')),
        'gender': GEND.get(f.get('Gender')),
        'tense':  btm.tense_label(f) if upos in ('VERB','AUX') else None,
        'voice':  VOICE.get(f.get('Voice')) if upos in ('VERB','AUX') else None,
        'mood':   mood if upos in ('VERB','AUX') else None,
        'person': f.get('Person'),
    }

PUNCT = re.compile(r'^[^\w]+|[^\w]+$', re.UNICODE)
def clean(tok):
    """Swete keeps punctuation on the token and opens books in all-caps; the tagger needs neither."""
    t = PUNCT.sub('', tok) or tok
    if t.isupper() and len(t) > 1: t = t.lower()
    return t

import stanza


def main():
    nlp = stanza.Pipeline('grc', processors='tokenize,pos,lemma',
                          tokenize_pretokenized=True, verbose=False)
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    hit = miss = total = 0
    files = [f for f in sorted(os.listdir(src)) if f.endswith('.json')]
    for n, fn in enumerate(files, 1):
        if os.path.exists(f'{dst}/{fn}'):          # resumable: skip what is already done
            continue
        print(f'[{n}/{len(files)}] {fn}', flush=True)
        d = json.load(open(f'{src}/{fn}'))
        sents = [[clean(w['surface']) for w in v['words']] for v in d['verses']]
        doc = nlp(sents)
        for verse, sent in zip(d['verses'], doc.sentences):
            for i, (w, sw) in enumerate(zip(verse['words'], sent.words), start=1):
                lemma = sw.lemma or w['surface']
                num = strongs_for(lemma)
                total += 1; hit += bool(num); miss += (not num)
                w.update({
                    'position': i, 'lemma': lemma, 'strongs': num,
                    'morph': to_morph(sw.upos, sw.feats),
                    'id': f"{verse['id']}.{i}", 'verseId': verse['id'],
                    'data_origin': 'machine_generated',
                })
        json.dump(d, open(f'{dst}/{fn}', 'w'), ensure_ascii=False)
    print(f'tagged {total} words | Strong\'s matched {hit} ({100*hit/total:.1f}%), unmatched {miss}')


if __name__ == '__main__':
    main()
