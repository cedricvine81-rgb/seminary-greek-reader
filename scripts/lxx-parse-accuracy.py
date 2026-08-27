#!/usr/bin/env python3
"""
How good is our Septuagint morphology? Measures it, rather than reporting coverage and hoping.

COVERAGE IS NOT ACCURACY. 99.6% of our Septuagint words carry a parse and 88.6% a Strong's
number, but those numbers say only that a field is filled in. This compares the parses against an
independent scholarly analysis and reports how often they agree.

THE REFERENCE is the Rahlfs/CATSS tagging this app shipped until the Swete migration, read out of
git history. It is used here as a measuring stick only: nothing derived from it is shipped, which
matters because it is the CC BY-NC-SA data the migration existed to remove.

WHAT THE NUMBERS ARE NOT. This is agreement, not truth. Three things keep it from being a grade:

  1. Only about a third of verses can be compared at all. Rahlfs and Swete are different editions,
     so a verse only enters the sample when both print the same words in the same order.
  2. The reference is not infallible, and is itself a machine-readable analysis of a different
     edition.
  3. Greek forms are frequently ambiguous. Where we say neuter and the reference says masculine of
     a form that is both, we are not wrong — we chose a different reading of the same word. The
     last section measures how much of the disagreement is that.

Usage:  python3 scripts/lxx-parse-accuracy.py <dir-of-reference-chapter-files>

  git archive d34cda26 public/data/lxx | tar -x -C /tmp/ref --strip-components=3
  python3 scripts/lxx-parse-accuracy.py /tmp/ref
"""
import json, glob, sys, unicodedata, collections

FIELDS = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender']
VERB_FIELDS = ['tense', 'voice', 'mood', 'person', 'number']
NOM_FIELDS = ['casus', 'number', 'gender']
NOMINAL = ('Noun', 'Adjective', 'Article', 'Pronoun')
FUNC = {'Conjunction', 'Particle', 'Adverb', 'Preposition', 'Interjection'}
NOMINAL_CLASS = {'Noun', 'Adjective', 'Pronoun', 'Numeral', 'Article'}

# CATSS spells the perfect system X/Y and splits the pronouns into subtypes; ours does neither.
TENSE = {'X': 'Perfect', 'Y': 'Pluperfect'}
POS = {'Demonstrative': 'Pronoun', 'RP': 'Pronoun', 'Relative Pronoun': 'Pronoun',
       'Indefinite Pronoun': 'Pronoun', 'Interrogative Pronoun': 'Pronoun', 'M': 'Numeral'}


def fold(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.lower().strip('.,;:·’\'"()[]—-·')


def norm(m):
    o = dict(m)
    o['tense'] = TENSE.get(o.get('tense'), o.get('tense'))
    o['partOfSpeech'] = POS.get(o.get('partOfSpeech'), o.get('partOfSpeech'))
    return o


def load(path):
    out = {}
    for f in glob.glob(f'{path}/*.json'):
        for v in json.load(open(f))['verses']:
            out[v['id']] = v['words']
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip().split('Usage:')[1], file=sys.stderr)
        return 1
    ref, ours = load(sys.argv[1]), load('public/data/lxx')
    shared = set(ref) & set(ours)

    pairs = []
    for vid in shared:
        a, b = ref[vid], ours[vid]
        if len(a) != len(b):
            continue
        if [fold(w['surface']) for w in a] != [fold(w['surface']) for w in b]:
            continue
        pairs.append((a, b))

    words = sum(len(a) for a, _ in pairs)
    print(f'verse ids in both editions  : {len(shared):,}')
    print(f'verses word-for-word alike  : {len(pairs):,}  ({len(pairs)/len(shared):.0%} — the rest differ)')
    print(f'words compared              : {words:,}\n')

    agree, judged = collections.Counter(), collections.Counter()
    every = 0
    pos_same = pos_conv = pos_diff = 0
    verbs = verbs_ok = noms = noms_ok = 0
    vf, vj, nf, nj = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter()
    classerr = collections.Counter()

    for a, b in pairs:
        for x, y in zip(a, b):
            am, bm = norm(x['morph']), norm(y['morph'])
            ok = True
            for f in FIELDS:
                if am.get(f) is None:
                    continue
                judged[f] += 1
                if am.get(f) == bm.get(f):
                    agree[f] += 1
                else:
                    ok = False
            every += ok
            ap, bp = am.get('partOfSpeech'), bm.get('partOfSpeech')
            if ap is None:
                continue
            if ap == bp:
                pos_same += 1
            elif (ap in FUNC and bp in FUNC) or (ap in NOMINAL_CLASS and bp in NOMINAL_CLASS):
                pos_conv += 1
            else:
                pos_diff += 1
                classerr[(ap, bp)] += 1
            if ap != bp:
                continue
            if ap == 'Verb':
                verbs += 1
                good = True
                for f in VERB_FIELDS:
                    if am.get(f) is None:
                        continue
                    vj[f] += 1
                    if am.get(f) == bm.get(f):
                        vf[f] += 1
                    else:
                        good = False
                verbs_ok += good
            elif ap in NOMINAL:
                noms += 1
                good = True
                for f in NOM_FIELDS:
                    if am.get(f) is None:
                        continue
                    nj[f] += 1
                    if am.get(f) == bm.get(f):
                        nf[f] += 1
                    else:
                        good = False
                noms_ok += good

    print(f'{"field":<14}{"judged":>10}{"agree":>10}{"%":>8}')
    for f in FIELDS:
        if judged[f]:
            print(f'{f:<14}{judged[f]:>10,}{agree[f]:>10,}{100*agree[f]/judged[f]:>7.1f}%')
    print(f'\nevery field the reference states: {every:,}/{words:,} = {100*every/words:.1f}%\n')

    tot = pos_same + pos_conv + pos_diff
    print('PART OF SPEECH')
    print(f'  same label                         {pos_same:>8,}  {100*pos_same/tot:5.1f}%')
    print(f'  different label, same broad class  {pos_conv:>8,}  {100*pos_conv/tot:5.1f}%  (convention, not error)')
    print(f'  genuinely different class          {pos_diff:>8,}  {100*pos_diff/tot:5.1f}%')

    print(f'\nVERBS both call verbs ({verbs:,})')
    for f in VERB_FIELDS:
        if vj[f]:
            print(f'  {f:<8}{100*vf[f]/vj[f]:>7.1f}%')
    print(f'  every field: {100*verbs_ok/verbs:.1f}%')
    print(f'\nNOMINALS both agree the class of ({noms:,})')
    for f in NOM_FIELDS:
        if nj[f]:
            print(f'  {f:<8}{100*nf[f]/nj[f]:>7.1f}%')
    print(f'  every field: {100*noms_ok/noms:.1f}%')

    # How much of the nominal disagreement is a form the reference itself reads both ways?
    readings = collections.defaultdict(set)
    for wl in ref.values():
        for w in wl:
            m = norm(w['morph'])
            if m.get('partOfSpeech') in NOMINAL:
                readings[fold(w['surface'])].add((m.get('casus'), m.get('number'), m.get('gender')))
    dis = amb = 0
    for a, b in pairs:
        for x, y in zip(a, b):
            am, bm = norm(x['morph']), norm(y['morph'])
            if am.get('partOfSpeech') != bm.get('partOfSpeech') or am.get('partOfSpeech') not in NOMINAL:
                continue
            if all(am.get(f) == bm.get(f) for f in NOM_FIELDS if am.get(f) is not None):
                continue
            dis += 1
            if (bm.get('casus'), bm.get('number'), bm.get('gender')) in readings.get(fold(x['surface']), set()):
                amb += 1
    if dis:
        print(f'\nOf {dis:,} nominal disagreements, {amb:,} ({100*amb/dis:.0f}%) are readings the reference')
        print(f'itself gives that same form elsewhere — a different reading, not a wrong one.')
        print(f'The other {dis-amb:,} ({100*(dis-amb)/dis:.0f}%) have no support in the reference at all.')
    print(f'\nClass errors (reference -> ours):')
    for (a_, b_), n in classerr.most_common(8):
        print(f'   {a_:>12} -> {str(b_):<12} {n:>6}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
