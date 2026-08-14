#!/usr/bin/env python3
"""Build the HEBREW morphology-quiz parsing pool from the tagged MT corpus.

The Hebrew counterpart to scripts/build-parsing-pool.py. Forms come from
public/data/mt/*.json (OSHB morphology, built by scripts/build-hebrew-ot.py); lemmas and
glosses from public/data/hebrew-lexicon.json, keyed by Strong's number.

WHAT IS KEPT — and why the pool is smaller than the corpus:

  • Words whose whole surface is described by ONE parse code. Hebrew writes clitics onto
    the word: בְּרֵאשִׁית is בְּ (preposition) + רֵאשִׁית (noun), and OSHB tags each morpheme
    separately, so "parse בְּרֵאשִׁית" has no single right answer. Such words are skipped.
    The waw-consecutive is the deliberate exception — see single_parse() — because a
    wayyiqtol is one verbal form and dropping it would cost the pool the commonest
    narrative verb in the Hebrew Bible.
  • Hebrew only. OSHB tags the Aramaic portions (Daniel, Ezra) with a different stem set
    — Peal/Pael/Aphel rather than Qal/Piel/Hiphil — so mixing them would put values in the
    answer key that a Hebrew course never taught. Aramaic is dropped.
  • Words with a Strong's number that resolves in the lexicon, so every question can show a
    lexical form and gloss the way the Greek pool does.
  • POINTED words only. A handful of forms are ketiv — the written consonantal reading,
    whose vowels live on the qere instead — and reach us unpointed (יהי, תתן). The binyan
    and conjugation of an unpointed form cannot be read off it, so asking a student to
    parse one is asking them to guess. ~1% of otherwise-eligible forms.

NORMALISATION: OSHB letter codes are decoded to the same traditional English vocabulary the
Reader's parsing pane shows (src/lib/hebrew-morph.ts), so a student sees one set of terms
everywhere. Person is written "1st"/"2nd"/"3rd" to match the Greek pool.

Usage:  python3 scripts/build-hebrew-parsing-pool.py [max_per_signature]
"""
import json, glob, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)
MT   = os.path.join(ROOT, 'public', 'data', 'mt')
LEX  = os.path.join(ROOT, 'public', 'data', 'hebrew-lexicon.json')
OUT  = os.path.join(ROOT, 'src', 'data', 'hebrew-parsing-pool.json')
# Tiny companion file: which values each parse field actually takes. Imported by the
# CLIENT-side instructor UI, which must not pull in the pool itself.
VALUES_OUT = os.path.join(ROOT, 'src', 'data', 'hebrew-pool-values.json')

# Distinct surface forms kept per parse signature. Nouns have few signatures (gender ×
# number × state), so the cap is what gives those quizzes lexical variety.
#
# For VERBS the cap is applied per (signature × root class), not per signature alone.
# Strong verbs are only ~16% of the verbs in the corpus, so a flat cap fills up on weak
# roots and leaves almost none: the old pool held 100 Qal perfects, of which 10 were
# strong. A first-year course drills the strong verb for its whole first semester, so a
# quiz built from that pool handed a week-4 student יָלַד, מוּת and נוּס — I-yod, hollow
# and I-nun forms Kelley does not reach until Hebrew II. Bucketing by root class keeps
# each class on its own quota, so "strong verbs only" has enough forms to be a real quiz.
MAX_PER_SIG = int(sys.argv[1]) if len(sys.argv) > 1 else 12

# ── Root classes ─────────────────────────────────────────────────────────────────
# Which verbs are "regular". A first-year syllabus is built on this distinction —
# Kelley L.12-L.20 are all "the Strong Verb" — and the BibleOL exercises the course sets
# are named `regular-verb` for the same reason. Without it a filter can say "Qal perfect"
# but not "Qal perfect of the kind you have been taught", which is the only useful ask.
#
# ORDER MATTERS. A root can be weak in more than one way (נָתַן is I-nun AND III-nun;
# יָצָא is I-yod AND III-alef). Each form gets the ONE label a grammar would file it
# under, tested first-radical outward, because that is the feature that governs how the
# form behaves and the order in which a course meets them.
GUTTURALS = set('אהחע')
FINAL_FORM = {'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ'}
VOWEL_POINTS = re.compile(r'[֑-ׇ]')


def radicals(lemma):
    """The lemma's bare consonants, finals normalised to their medial form."""
    letters = VOWEL_POINTS.sub('', lemma or '')
    return [FINAL_FORM.get(c, c) for c in letters if 'א' <= c <= 'ת']


def root_class(lemma):
    """'Strong', or the weakness a grammar would file this root under."""
    r = radicals(lemma)
    if len(r) != 3:
        # Biliteral lemmas here are overwhelmingly hollow roots whose middle waw/yod the
        # lexicon has already dropped; quadriliterals are a genuine handful. Neither is
        # a strong verb, and calling them so is the one error that matters.
        return 'Irregular'
    first, middle, last = r
    if first == 'נ':          return 'I-nun'
    if first in 'יו':         return 'I-yod/waw'
    if first in GUTTURALS:    return 'I-guttural'
    if middle in 'וי':        return 'Hollow'
    if middle == last:        return 'Geminate'
    if middle in GUTTURALS or middle == 'ר': return 'II-guttural'
    if last == 'א':           return 'III-alef'
    if last == 'ה':           return 'III-he'
    if last in 'חע':          return 'III-guttural'
    return 'Strong'


# ── OSHB code tables (mirror of src/lib/hebrew-morph.ts) ─────────────────────────
GENDER = {'m': 'Masculine', 'f': 'Feminine', 'b': 'Both', 'c': 'Common'}
NUMBER = {'s': 'Singular', 'p': 'Plural', 'd': 'Dual'}
STATE  = {'a': 'Absolute', 'c': 'Construct', 'd': 'Determined'}
PERSON = {'1': '1st', '2': '2nd', '3': '3rd'}

STEM = {
    'q': 'Qal', 'N': 'Niphal', 'p': 'Piel', 'P': 'Pual', 'h': 'Hiphil', 'H': 'Hophal',
    't': 'Hithpael', 'Q': 'Qal passive', 'o': 'Polel', 'O': 'Polal', 'r': 'Poel',
    'R': 'Poal', 'm': 'Polel', 'M': 'Polal', 'k': 'Palel', 'K': 'Palal', 'l': 'Pilpel',
    'L': 'Polpal', 'f': 'Hithpalpel', 'D': 'Nithpael', 'j': 'Pealal', 'i': 'Pilel',
    'u': 'Hothpaal', 'c': 'Tiphil', 'v': 'Hishtaphel', 'w': 'Nithpalel', 'y': 'Nithpael',
    'z': 'Hithpoel', 'Z': 'Nithpoel',
}
CONJUGATION = {
    'p': 'Perfect', 'q': 'Sequential perfect', 'i': 'Imperfect', 'w': 'Sequential imperfect',
    'h': 'Cohortative', 'j': 'Jussive', 'v': 'Imperative',
    'a': 'Infinitive absolute', 'c': 'Infinitive construct',
    'r': 'Active participle', 's': 'Passive participle',
}
PRONOUN_TYPE = {
    'Pd': 'Demonstrative', 'Pf': 'Indefinite', 'Pi': 'Interrogative',
    'Pp': 'Personal', 'Pr': 'Relative',
}
# Participles and infinitives inflect like nouns/adjectives, not like finite verbs: they
# have gender/number/state and NO person. The decoder below enforces that per conjugation.
PARTICIPLES = {'Active participle', 'Passive participle'}
INFINITIVES = {'Infinitive absolute', 'Infinitive construct'}


def decode_verb(code):
    """Vq p 3 m s  →  stem, conjugation, person, gender, number, state."""
    if len(code) < 3:
        return None
    stem, conj = STEM.get(code[1]), CONJUGATION.get(code[2])
    if not stem or not conj:
        return None
    out = {'partOfSpeech': 'Verb', 'stem': stem, 'conjugation': conj}
    rest = code[3:]
    if conj in PARTICIPLES:
        # Vqr ms a  — gender, number, then optional state
        if len(rest) >= 2:
            out['gender'], out['number'] = GENDER.get(rest[0]), NUMBER.get(rest[1])
        if len(rest) >= 3:
            out['state'] = STATE.get(rest[2])
    elif conj in INFINITIVES:
        pass  # no agreement to test
    else:
        # Finite forms, imperatives included: OSHB writes person, gender, number (Vqv2ms).
        if len(rest) >= 3:
            out['person'] = PERSON.get(rest[0])
            out['gender'], out['number'] = GENDER.get(rest[1]), NUMBER.get(rest[2])
    return out if all(v is not None for v in out.values()) else None


def decode_noun(code):
    """Nc f s a  →  gender, number, state. Proper nouns (Np) carry no inflection."""
    sub = code[:2]
    if sub == 'Np':
        return None
    if sub not in ('Nc', 'Ng', 'Nx'):
        return None
    rest = code[2:]
    if len(rest) < 2:
        return None
    out = {'partOfSpeech': 'Noun', 'gender': GENDER.get(rest[0]), 'number': NUMBER.get(rest[1])}
    if len(rest) >= 3:
        out['state'] = STATE.get(rest[2])
    return out if all(v is not None for v in out.values()) else None


def decode_adjective(code):
    sub = code[:2]
    if sub not in ('Aa', 'Ac', 'Ag', 'Ao'):
        return None
    rest = code[2:]
    if len(rest) < 2:
        return None
    out = {'partOfSpeech': 'Adjective', 'gender': GENDER.get(rest[0]), 'number': NUMBER.get(rest[1])}
    if len(rest) >= 3:
        out['state'] = STATE.get(rest[2])
    return out if all(v is not None for v in out.values()) else None


def decode_pronoun(code):
    """Pp 3 m s / Pd x m s  →  type, person (if any), gender, number.

    OSHB writes a person-gender-number triple for EVERY pronoun and fills the person slot
    with 'x' where there is none — a demonstrative is Pdxms, not Pdms. Reading that 'x' as
    a gender made every demonstrative undecodable, so זֶה / זֹאת / אֵלֶּה — core Beginning
    Hebrew vocabulary — were absent from the pool entirely. src/lib/hebrew-morph.ts, which
    the Reader's parsing pane uses, has always read positions 2/3/4 this way.
    """
    sub = code[:2]
    kind = PRONOUN_TYPE.get(sub)
    if not kind:
        return None
    out = {'partOfSpeech': 'Pronoun', 'type': kind}
    rest = code[2:]
    if len(rest) >= 3:
        if rest[0] in PERSON:            # 'x' = no person, and is simply not reported
            out['person'] = PERSON[rest[0]]
        out['gender'], out['number'] = GENDER.get(rest[1]), NUMBER.get(rest[2])
    elif len(rest) >= 2:
        out['gender'], out['number'] = GENDER.get(rest[0]), NUMBER.get(rest[1])
    return out if all(v is not None for v in out.values()) else None


DECODERS = (('V', decode_verb), ('N', decode_noun), ('A', decode_adjective), ('P', decode_pronoun))

# Hebrew points and accents. A form carrying none of them is an unpointed ketiv, and its
# binyan/conjugation cannot be determined from the consonants alone.
POINTING = re.compile('[\u0591-\u05C7]')


def is_pointed(surface):
    return bool(POINTING.search(surface))


def single_parse(word, code):
    """True when the word's whole surface is described by the one code `code`.

    Hebrew writes clitics onto the word, and OSHB tags each morpheme separately, so
    בְּרֵאשִׁית is [R preposition, Nc noun]. "Parse בְּרֵאשִׁית" then has no single right
    answer, and such words are excluded.

    THE ONE EXCEPTION IS THE WAW-CONSECUTIVE. A wayyiqtol like וַיָּ֖מָת is tagged
    [C, Vqw3ms] but is a single verbal form: the waw is part of it, and the word-level code
    is the verb's own. A student parses it "Qal sequential imperfect 3ms". Excluding these
    would drop the commonest narrative verb form in the Hebrew Bible from the quiz — 5,000+
    forms — so [conjunction + sequential verb] is admitted.
    """
    morphemes = word.get('morphemes') or []
    if len(morphemes) <= 1:
        return True
    if len(morphemes) != 2:
        return False
    first, second = morphemes
    return (first.get('morph') == 'C'
            and second.get('morph') == code
            and code.startswith('V') and len(code) > 2 and code[2] in 'wq')


def decode(code):
    for letter, fn in DECODERS:
        if code.startswith(letter):
            return fn(code)
    return None


# A handful of Strong's entries have a gloss that is only the opening adverb of the
# definition — "properly" — which tells a student nothing about which lexeme they are
# looking at. Where that happens, take the substantive clause of `def` instead.
USELESS_GLOSS = {'properly', 'a primitive root', 'of uncertain derivation', 'the same as'}


def gloss_for(entry):
    gloss = (entry.get('gloss') or '').strip()
    if gloss.lower().rstrip('.,') not in USELESS_GLOSS:
        return gloss
    definition = (entry.get('def') or '').strip()
    if not definition:
        return gloss
    # "properly, a mumble, i.e. a water skin (…)" → "a mumble"
    body = definition
    for lead in ('properly,', 'properly'):
        if body.lower().startswith(lead):
            body = body[len(lead):].lstrip(' ,')
            break
    for stop in (', i.e.', '; hence', ' (', ';', ','):
        idx = body.find(stop)
        if idx > 0:
            body = body[:idx]
            break
    body = body.strip().rstrip('.,;')
    return body or gloss


def main():
    lexicon = json.load(open(LEX))
    pools = collections.defaultdict(list)
    seen_sig = collections.Counter()
    seen_surface = collections.defaultdict(set)
    skipped = collections.Counter()

    for path in sorted(glob.glob(os.path.join(MT, '*.json'))):
        data = json.load(open(path))
        for verse in data['verses']:
            for w in verse['words']:
                code = w.get('morph') or ''
                if not code:
                    skipped['no morph code'] += 1
                    continue
                # Aramaic (Daniel, Ezra) reuses the stem letters for a different set of
                # binyanim — 'q' is Peal, not Qal — so decoding it with the Hebrew table
                # would put values in the answer key that no Hebrew course teaches.
                if w.get('lang') == 'A':
                    skipped['Aramaic'] += 1
                    continue
                if not single_parse(w, code):
                    skipped['multi-morpheme (clitics)'] += 1
                    continue
                if not is_pointed(w['surface']):
                    skipped['unpointed (ketiv)'] += 1
                    continue
                strongs = str(w.get('strongs') or '').strip()
                entry = lexicon.get(strongs.lstrip('0'))
                if not entry or not entry.get('gloss'):
                    skipped['no lexicon entry'] += 1
                    continue
                parsed = decode(code)
                if not parsed:
                    skipped['undecodable / not a tested POS'] += 1
                    continue

                pos = parsed['partOfSpeech'].lower()
                # Verbs bucket by (parse signature × root class) so the strong verb keeps
                # its own quota instead of being crowded out by the weak roots, which
                # outnumber it five to one. Everything else buckets by signature alone.
                cls = root_class(entry['lemma']) if pos == 'verb' else None
                sig = (code, cls)
                surface = w['surface']
                if surface in seen_surface[sig]:
                    continue                      # same form, same parse — no new value
                if seen_sig[sig] >= MAX_PER_SIG:
                    continue
                seen_sig[sig] += 1
                seen_surface[sig].add(surface)

                pools[pos].append({
                    'surface': surface,
                    'lexeme': entry['lemma'],
                    'gloss': gloss_for(entry),
                    'reference': verse['reference'],
                    **parsed,
                    **({'rootClass': cls} if cls else {}),
                })

    out = {k: v for k, v in pools.items()}
    # The distinct value of every parse field actually present. The instructor's filter
    # chips are built from this, so a chip can never promise a value the pool cannot
    # supply (Hebrew has no Pr/Pi codes in OSHB, so there are no relative or interrogative
    # pronouns to filter for).
    values = collections.defaultdict(set)
    for entries in pools.values():
        for e in entries:
            for f in ('stem', 'conjugation', 'person', 'gender', 'number', 'state', 'type',
                      'rootClass'):
                if e.get(f):
                    values[f].add(e[f])
    with open(VALUES_OUT, 'w') as f:
        json.dump({k: sorted(v) for k, v in values.items()}, f, ensure_ascii=False, indent=1)
    print(f'wrote {VALUES_OUT}')

    out['_generated'] = 'scripts/build-hebrew-parsing-pool.py'
    out['_note'] = ('Single-morpheme Hebrew forms from the OSHB-tagged MT. Aramaic, clitic-'
                    'bearing words and forms without a lexicon entry are excluded — see the '
                    'script docstring.')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(out, f, ensure_ascii=False, indent=0)

    print(f'wrote {OUT}')
    for k in ('verb', 'noun', 'adjective', 'pronoun'):
        print(f'  {k:10s} {len(pools.get(k, [])):6,}')
    print('  skipped:')
    for reason, n in skipped.most_common():
        print(f'    {reason:32s} {n:8,}')


if __name__ == '__main__':
    main()
