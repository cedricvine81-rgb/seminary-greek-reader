# Builds per-word morphological sidecar files for the Greek-prose Texts works so the reader's
# parsing pane can light up on Josephus and the Greco-Roman prose (Epictetus, Diogenes) — any
# untagged Greek prose in the Texts library.
#
# For each book <n>.json we emit a sidecar <n>.morph.json:
#   { "<section>": [ ["<lemma>", "<parse>"] | null, ... ], ... }
# The array is aligned 1:1 with the reader's whitespace tokenization of that section's Greek
# (`text.split(/(\s+)/)` filtered to non-space) — element j is the analysis of the j-th word,
# or null for a token that is pure punctuation / not analyzable. Kept in a SIDECAR (not inline)
# so the content JSON the reader already fetches stays lean; the sidecar loads lazily only when
# a Greek-prose work is open.
#
# Analyzer: Stanza's Ancient Greek model (Perseus/PROIEL treebanks) — lemma + UD morph features,
# converted here to the traditional parse labels seminary readers expect. Auto-tagging of prose
# is strong but not perfect (occasional lemma/parse slips); this is the accepted tradeoff for
# tagging an untagged corpus.
#
# Requires a venv with stanza + the 'grc' model (`pip install stanza`; stanza.download('grc')).
# Usage:
#   python scripts/build-texts-morph.py --work antiquities [--book N]
#   python scripts/build-texts-morph.py --all      # all four Josephus works
#   python scripts/build-texts-morph.py --greco     # Epictetus + Diogenes Laertius

import argparse, json, re, sys, warnings
from pathlib import Path

warnings.filterwarnings("ignore")

BASE = Path("public/data/josephus")

# ── UD feature → traditional Greek label maps ───────────────────────────────
POS = {
    'VERB': 'Verb', 'AUX': 'Verb', 'NOUN': 'Noun', 'PROPN': 'Proper noun',
    'ADJ': 'Adjective', 'DET': 'Article', 'PRON': 'Pronoun', 'ADV': 'Adverb',
    'ADP': 'Preposition', 'CCONJ': 'Conjunction', 'SCONJ': 'Conjunction',
    'PART': 'Particle', 'NUM': 'Numeral', 'INTJ': 'Interjection', 'X': '',
}
VOICE = {'Act': 'Active', 'Mid': 'Middle', 'Pass': 'Passive'}
MOOD = {'Ind': 'Indicative', 'Sub': 'Subjunctive', 'Opt': 'Optative', 'Imp': 'Imperative'}
CASE = {'Nom': 'Nominative', 'Gen': 'Genitive', 'Dat': 'Dative', 'Acc': 'Accusative', 'Voc': 'Vocative'}
GENDER = {'Masc': 'Masculine', 'Fem': 'Feminine', 'Neut': 'Neuter'}
NUMBER = {'Sing': 'Singular', 'Dual': 'Dual', 'Plur': 'Plural'}
PERSON = {'1': '1st', '2': '2nd', '3': '3rd'}
DEGREE = {'Cmp': 'Comparative', 'Sup': 'Superlative'}


def tense_label(f):
    # Traditional Greek tense from UD Tense + Aspect (see script header for the probe results).
    t, a = f.get('Tense'), f.get('Aspect')
    if t == 'Pres':
        return 'Present'
    if t == 'Fut':
        return 'Future'
    if t == 'Pqp':
        return 'Pluperfect'
    if t == 'Past':
        if a == 'Imp':
            return 'Imperfect'
        if a == 'Perf':
            return 'Perfect'
        return 'Aorist'
    return None


def parse_feats(feats_str):
    return dict(kv.split('=') for kv in (feats_str or '').split('|') if '=' in kv)


def format_parse(upos, feats_str):
    f = parse_feats(feats_str)
    pos = POS.get(upos, '')
    parts = [pos] if pos else []
    if upos in ('VERB', 'AUX'):
        vf = f.get('VerbForm')
        parts += [x for x in [tense_label(f), VOICE.get(f.get('Voice'))] if x]
        if vf == 'Part':  # participle: case, gender, number (like a nominal)
            parts.append('Participle')
            for k, m in (('Case', CASE), ('Gender', GENDER), ('Number', NUMBER)):
                if f.get(k):
                    parts.append(m.get(f[k], ''))
        elif vf == 'Inf':
            parts.append('Infinitive')
        else:  # finite: mood, person, number
            for k, m in (('Mood', MOOD), ('Person', PERSON), ('Number', NUMBER)):
                if f.get(k):
                    parts.append(m.get(f[k], ''))
    else:
        # nominals & the rest: case, gender, number, degree as available
        for k, m in (('Case', CASE), ('Gender', GENDER), ('Number', NUMBER), ('Degree', DEGREE)):
            if f.get(k):
                parts.append(m.get(f[k], ''))
    return ', '.join(p for p in parts if p)


# ── whitespace tokenization matching the reader (GreekWords: text.split(/(\s+)/)) ───────────
def word_spans(text):
    spans, idx = [], 0
    for part in re.split(r'(\s+)', text):
        if part and not part.isspace():
            spans.append((idx, idx + len(part)))
        idx += len(part)
    return spans  # list of (start_char, end_char) for each rendered word, in order


def analyze_units(nlp, units):
    # units: list of (key, greek_text) → { key: MorphEntry[] } aligned to the reader's words.
    keys = [k for k, _ in units]
    texts = [t for _, t in units]
    if not texts:
        return {}
    docs = nlp.bulk_process(texts)
    out = {}
    for key, text, doc in zip(keys, texts, docs):
        toks = []  # content tokens (skip punctuation) with char spans + analysis
        for s in doc.sentences:
            for t in s.tokens:
                w = t.words[0]
                if w.upos == 'PUNCT' or not w.lemma:
                    continue
                toks.append((t.start_char, t.end_char, w.lemma, format_parse(w.upos, w.feats)))
        arr = []
        for (ws, we) in word_spans(text):
            hit = next((tk for tk in toks if tk[0] < we and tk[1] > ws), None)
            arr.append([hit[2], hit[3]] if hit else None)
        out[key] = arr
    return out


def build_book(nlp, path):
    # Josephus book file (chapters → sections); §§ are unique per book, so key by section.
    d = json.loads(path.read_text())
    units = [(str(sec['number']), sec['greek'])
             for ch in d.get('chapters', []) for sec in ch.get('sections', [])
             if sec.get('greek')]
    return analyze_units(nlp, units) if units else None


def build_prose(nlp, path):
    # Greco-Roman prose file (chapters → verses); verses restart per chapter, so key "ch.verse".
    d = json.loads(path.read_text())
    units = [(f"{ch['number']}.{v['number']}", v['greek'])
             for ch in d.get('chapters', []) for v in ch.get('verses', [])
             if v.get('greek')]
    return analyze_units(nlp, units) if units else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--work', default='antiquities')
    ap.add_argument('--book', type=int, default=None)
    ap.add_argument('--all', action='store_true', help='all Josephus works')
    ap.add_argument('--greco', action='store_true', help='Greco-Roman prose (Epictetus, Diogenes)')
    ap.add_argument('--af', action='store_true', help='Apostolic Fathers (works with parallel Greek)')
    ap.add_argument('--philo', action='store_true', help='Philo (works with parallel Greek)')
    ap.add_argument('--justin', action='store_true', help='Justin Martyr (works with parallel Greek)')
    ap.add_argument('--pseudepigrapha', action='store_true', help='Pseudepigrapha with Greek (Sibylline, Aristeas)')
    ap.add_argument('--testaments', action='store_true', help='Testaments of the Twelve Patriarchs')
    ap.add_argument('--eusebius', action='store_true', help='Eusebius (Ecclesiastical History + Preparation for the Gospel)')
    ap.add_argument('--clement', action='store_true', help='Clement of Alexandria')
    ap.add_argument('--only', default=None, help='restrict a dir run to one slug (debugging)')
    ap.add_argument('--prefix', default=None,
                    help='restrict a dir run to slugs starting with this (e.g. plutarch-), so '
                         'adding a corpus does not re-tag the whole directory')
    ap.add_argument('--skip-existing', action='store_true',
                    help='leave works that already have a .morph.json sidecar alone')
    args = ap.parse_args()

    import stanza
    nlp = stanza.Pipeline('grc', processors='tokenize,pos,lemma', verbose=False)

    prose_dir = ('public/data/greco' if args.greco else
                 'public/data/apostolic-fathers' if args.af else
                 'public/data/philo' if args.philo else
                 'public/data/justin' if args.justin else
                 'public/data/pseudepigrapha' if args.pseudepigrapha else
                 'public/data/pseudepigrapha/testaments' if args.testaments else
                 'public/data/eusebius' if args.eusebius else
                 'public/data/clement' if args.clement else None)
    if prose_dir:
        gdir = Path(prose_dir)
        for f in sorted(gdir.glob('*.json')):
            if f.stem.endswith('.morph'):
                continue
            if args.only and f.stem != args.only:
                continue
            if args.prefix and not f.stem.startswith(args.prefix):
                continue
            if args.skip_existing and f.with_name(f'{f.stem}.morph.json').exists():
                continue
            out = build_prose(nlp, f)  # None when the work has no parallel Greek
            if out is None:
                continue
            dest = f.with_name(f"{f.stem}.morph.json")
            dest.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
            nwords = sum(len(v) for v in out.values())
            nparsed = sum(1 for v in out.values() for e in v if e)
            print(f"{gdir.name}/{f.name} -> {dest.name}  ({len(out)} verses, {nparsed}/{nwords} words parsed)", flush=True)
        return

    works = ['antiquities', 'jewish-war', 'against-apion', 'life'] if args.all else [args.work]
    for work in works:
        wdir = BASE / work
        files = sorted(wdir.glob('*.json'),
                       key=lambda p: int(p.stem) if p.stem.isdigit() else 999)
        for f in files:
            if f.name == 'index.json' or f.stem.endswith('.morph'):
                continue
            if not f.stem.isdigit():
                continue
            if args.book is not None and int(f.stem) != args.book:
                continue
            out = build_book(nlp, f)
            if out is None:
                continue
            dest = f.with_name(f"{f.stem}.morph.json")
            dest.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
            nwords = sum(len(v) for v in out.values())
            nparsed = sum(1 for v in out.values() for e in v if e)
            print(f"{work}/{f.name} -> {dest.name}  ({len(out)} sections, {nparsed}/{nwords} words parsed)", flush=True)


if __name__ == '__main__':
    main()
