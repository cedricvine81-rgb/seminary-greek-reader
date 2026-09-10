"""Final word records for the missing deck sentences."""
import json, pickle, re, collections, unicodedata
import gnt, draft
from compare import norm

exact, loose = pickle.load(open('gntindex.pkl','rb'))
BG = gnt.bgvb()

# Accents off, BREATHINGS KEPT — the level at which αὑτη ('this', οὗτος) is still distinct from
# αὐτη ('she', αὐτός). Collapsing to bare letters merges them and picked the wrong word.
mid = collections.defaultdict(collections.Counter)
for surf, ctr in exact.items():
    mid[gnt.strip_acc(surf)].update(ctr)

OVERRIDE = dict(draft.OVERRIDE)
OVERRIDE.update({
    # μή takes the aorist SUBJUNCTIVE, never the aorist imperative — and this is the
    # subjunctive pack. The GNT majority (6 Impv : 1 Subj) is all μή-less.
    'φοβηθητε': ('Aor Pass Subj 2 Pl — φοβέομαι', 'fear, be afraid'),
    'αὑτη':     ('Nom Sg Fem — οὗτος', 'this'),
    # The GNT records personal pronouns with no case, so these come out blank.
    'σοι':  ('Dat Sg — σύ', 'you (sg.)'),
    'ὑμιν': ('Dat Pl — ὑμεῖς', 'you (pl.)'),
    'σου':  ('Gen Sg — σύ', 'you (sg.)'),
})

ART = re.compile(r'^Article — (\w+) (\w+) (\w+)$')

def analyse(tok, prev_parsing):
    w = gnt.clean(tok)
    if w in OVERRIDE:
        p, g = OVERRIDE[w]; return p, g
    if gnt.bare(w) in draft.NEGATIVES:
        return 'Negative particle', 'not'
    cand = exact.get(w) or mid.get(gnt.strip_acc(w)) or loose.get(gnt.bare(w))
    if not cand:
        return None, None
    keys = [k for k, _ in cand.most_common()]
    # AGREEMENT: a noun or adjective right after an article takes the article's case, number and
    # gender. Without this 'τας καρδιας' reads as a genitive singular, because that is simply the
    # commoner form of καρδιας in the GNT — the article is the whole disambiguator.
    m = ART.match(prev_parsing or '')
    if m:
        want = tuple(m.groups())
        for k in keys:
            got = (gnt.CASE.get(k[2],''), gnt.NUM.get(k[3],''), gnt.GEN.get(k[4],''))
            if got == want:
                keys = [k]; break
    key = keys[0]
    parsing = gnt.parsing(key)
    lemma = key[0]
    e = BG.get(draft.LEMMA_ALIAS.get(lemma, lemma)) or BG.get(lemma) or BG.get(gnt.bare(lemma))
    return parsing, (e['gloss'] if e else draft.CLOSED_CLASS_GLOSS.get(lemma))

MY_TRANSLATIONS = {
    'ἀπεστειλαν':      'They sent.',
    'μενοῦμεν':        'We will remain.',
    'ἠγειρεν':         'He raised.',
    'ἐκριναν':         'They judged.',
    'οὐδεις ἐστιν ἀγαθος': 'Is no one good?',
    'ὁπου ἐλθω':       'Where shall I go?',
    'μη ἐξελθητε':     'Do not go out.',
    'ὁπου πορευονται': 'Where are they going?',
    'ἐχω ἀδελφον':     'I have a brother.',
    'μη φοβηθητε':     'Do not be afraid.',
    'αὐτων ἐστιν ἡ βασιλεια των οὐρανων': 'Theirs is the kingdom of the heavens.',
    'αὑτη ἐστιν ἡ ἡμερα': 'This is the day.',
    'διδοασιν τον ἀρτον τοις τεκνοις': 'They give the bread to the children.',
}

# keyed by the same normalisation the lookup uses (accents off, punctuation out)
MY_NORM = {norm(k): v for k, v in MY_TRANSLATIONS.items()}

if __name__ == '__main__':
    packs = json.load(open('packs.json'))
    by_norm = {}
    for p in packs:
        for s in p['sentences']:
            by_norm.setdefault(norm(' '.join(w['w'] for w in s['words'])), s)

    located = json.load(open('located.json'))
    out, problems = {}, []
    for n, (deck, slide, greek, english, pack) in located.items():
        # A sentence the app already carries elsewhere is COPIED whole — its words were reviewed
        # when that pack was built, and regenerating them only invites a fresh disagreement.
        if n in by_norm:
            s = dict(by_norm[n])
            s['note'] = f'From the slides: {deck}, slide {slide}.'
            out[n] = {'pack': pack, 'sentence': s, 'source': 'copied from an existing pack'}
            continue
        words, prev = [], None
        for tok in draft.words_of(greek):
            p, g = analyse(tok, prev)
            if not p or not g:
                problems.append(f'{pack} | {greek[:40]} | {tok} | parsing={p} gloss={g}')
            rec = {'w': tok}
            if p: rec['parsing'] = p
            if g: rec['gloss'] = g
            words.append(rec); prev = p
        tr = english or MY_NORM.get(norm(greek))
        if not tr:
            problems.append(f'{pack} | {greek[:40]} | NO TRANSLATION')
        out[n] = {'pack': pack,
                  'sentence': {'words': words, 'translation': tr,
                               'note': f'From the slides: {deck}, slide {slide}.'},
                  'source': 'deck answer slide' if english else 'translated here'}
    json.dump(out, open('final.json','w'), ensure_ascii=False, indent=1)
    print('sentences:', len(out))
    print('copied whole from an existing pack:', sum(1 for v in out.values() if v['source'].startswith('copied')))
    print('English from the deck:', sum(1 for v in out.values() if v['source']=='deck answer slide'))
    print('translated here:', sum(1 for v in out.values() if v['source']=='translated here'))
    print('problems:', len(problems))
    for p in problems: print('   ', p)
