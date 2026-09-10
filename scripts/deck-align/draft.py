"""Draft word records for the missing sentences; flag anything needing a human decision."""
import json, pickle, re, collections
import gnt

exact, loose = pickle.load(open('gntindex.pkl', 'rb'))
BG = gnt.bgvb()

# Words the GNT cannot analyse, or where its lemma is not BGVB's headword. Kept explicit and
# small; every entry is a decision, not a guess.
OVERRIDE = {
    # Regularly-formed liquid futures — absent from the GNT by accident of the corpus, not
    # because they are wrong. The decks drill exactly this formation.
    'μενοῦμεν': ('Fut Act Ind 1 Pl — μένω (liquid future)', 'remain'),
    'ἐκριναν':  ('Aor Act Ind 3 Pl — κρίνω', 'judge'),
    # Regular forms this GNT edition happens not to contain. Each is unambiguous; the edition
    # reads ραββει for ῥαββί, and has no nominative plural ἀγαθοί or present πορεύονται.
    'ἀγαθοι':        ('Nom Pl Masc — ἀγαθός', 'good'),
    'πορευονται':    ('Pres Mid Ind 3 Pl — πορεύομαι', 'go, proceed'),
    'Ῥαββι':         ('Vocative — ῥαββί (indeclinable)', 'rabbi, master'),
    'γεγραφας':      ('Perf Act Ind 2 Sg — γράφω', 'write'),
    'μετανοησαντες': ('Aor Act Ptc Nom Pl Masc — μετανοέω', 'repent'),
    'ἐκβαλλε':       ('Pres Act Impv 2 Sg — ἐκβάλλω', 'cast out, send out'),
    'πεφευγασιν':    ('Perf Act Ind 3 Pl — φεύγω', 'flee'),
}
# Closed-class words BGVB gives no rank and so no gloss (see homework-vocab.ts's CLOSED_CLASS).
CLOSED_CLASS_GLOSS = {
    'ὑμεῖς': 'you (pl.)', 'ἡμεῖς': 'we', 'σύ': 'you (sg.)', 'ἐγώ': 'I',
}
# GNT lemma -> BGVB headword, where the two differ.
LEMMA_ALIAS = {'φοβέω': 'φοβέομαι', 'ἐσθίω': 'ἐσθίω', 'ἄρχω': 'ἄρχομαι'}
NEGATIVES = {'μη', 'ου', 'ουκ', 'ουχ', 'ουχι'}

def analyse(tok):
    """(parsing, gloss, flag)"""
    w = gnt.clean(tok)
    if not w:
        return None, None, 'empty'
    if w in OVERRIDE:
        p, g = OVERRIDE[w]; return p, g, None
    if gnt.bare(w) in NEGATIVES:
        return 'Negative particle', 'not', None
    cand = exact.get(w) or loose.get(gnt.bare(w))
    if not cand:
        return None, None, 'NOT IN GNT'
    key = cand.most_common(1)[0][0]
    parsing = gnt.parsing(key)
    lemma = key[0]
    entry = BG.get(LEMMA_ALIAS.get(lemma, lemma)) or BG.get(lemma) or BG.get(gnt.bare(lemma))
    gloss = entry['gloss'] if entry else CLOSED_CLASS_GLOSS.get(lemma)
    amb = len({k[1:] for k in cand}) > 1
    return parsing, gloss, ('NO GLOSS' if not gloss else ('ambiguous' if amb else None))

def words_of(greek):
    """Deck sentence -> tokens, with the deck's own parenthetical/bracket glosses removed."""
    g = re.sub(r'\([^)]*\)', ' ', greek)
    g = re.sub(r'\[[^\]]*\]', ' ', g)
    toks = [t for t in g.split() if t.strip()]
    # Removing '(repent)' from 'μετανοησον (repent).' strands the full stop as its own token.
    # Sentence punctuation belongs to the word it followed, as everywhere else in the packs.
    out = []
    for t in toks:
        if out and not re.search(r'[Ͱ-Ͽἀ-῿]', t):
            out[-1] += t
        else:
            out.append(t)
    return out

if __name__ == '__main__':
    located = json.load(open('located.json'))
    out, flags = {}, collections.Counter()
    for n, (deck, slide, greek, english, pack) in located.items():
        rec = {'pack': pack, 'deck': deck, 'slide': slide, 'greek': greek,
               'translation': english, 'words': []}
        for tok in words_of(greek):
            p, gl, f = analyse(tok)
            rec['words'].append({'w': tok, 'parsing': p, 'gloss': gl, 'flag': f})
            if f: flags[f] += 1
        out[n] = rec
    json.dump(out, open('draft.json', 'w'), ensure_ascii=False, indent=1)
    print('sentences drafted:', len(out))
    print('flags:', dict(flags))
    print('\nwords needing attention:')
    for n, r in out.items():
        bad = [w for w in r['words'] if w['flag'] and w['flag'] != 'ambiguous']
        if bad:
            print(f"  {r['pack'][:38]:<40}{r['greek'][:34]:<36}{[ (w['w'], w['flag']) for w in bad ]}")
