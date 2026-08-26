#!/usr/bin/env python3
"""
Undo the accent-blind Strong's collisions in the tagged Swete text.

THE BUG. lxx-tag-swete.py built its lemma -> Strong's map on accent-folded keys, so every pair of
lexemes that differ only in their diacritics collapsed into one entry and one number won for both:

    εἰς   "into"  (G1519)  vs  εἷς   "one"        (G1520)   — 6,749 words mis-numbered
    εἰ    "if"    (G1487)  vs  εἶ    "thou art"   (G1488)
    ἤ     "or"    (G2228)  vs  ἦ     "truly"      (G2229)
    τίς   "who?"  (G5101)  vs  τὶς   "someone"    (G5100)
    καρπός "fruit"(G2590)  vs  Κάρπος "Carpus"    (G2591)   — a fruit tagged as a person
    στέφανος "crown"       vs  Στέφανος "Stephen"

Nothing about this is visible in the reader: the word parses, the number is simply the wrong word's.
It corrupts lexeme search, the Allusions tab's rarity weighting and every Strong's-keyed lookup —
the LXX is matched by Strong's throughout this app, so a wrong number is a wrong word.

THE REPAIR. Where the word's own lemma matches exactly one lexicon headword — accents and all,
allowing only for a capital at the start of a sentence — that entry's number is the right one.
Anything ambiguous, or with no exact headword, is left exactly as it was: τις (indefinite, no
accent in our tagging) has no exact entry and keeps G5100, which is already correct.

Fixed at source in lxx-tag-swete.py too, so a re-tag will not reintroduce it. Idempotent.
"""
import json, glob, os, sys, collections

LXX = 'public/data/lxx'
LEX = 'public/data/strongs-greek.json'


def main() -> int:
    if not os.path.isdir(LXX):
        print('run me from the repo root', file=sys.stderr)
        return 1

    by_head = collections.defaultdict(set)
    head_of = {}
    for num, e in json.load(open(LEX)).items():
        lem = e.get('lemma')
        if not num.startswith('G') or not lem:
            continue
        head_of[num[1:]] = lem
        by_head[lem].add(num[1:])
    # Only headwords that name exactly one number can settle anything.
    unique = {h: next(iter(v)) for h, v in by_head.items() if len(v) == 1}

    def resolve(lemma):
        if lemma in unique:
            return unique[lemma]
        lowered = lemma[:1].lower() + lemma[1:]   # sentence-initial capital only
        return unique.get(lowered)

    total = fixed = files = 0
    moves = collections.Counter()
    for path in sorted(glob.glob(f'{LXX}/*.json')):
        doc = json.load(open(path))
        touched = False
        for v in doc['verses']:
            for w in v['words']:
                lemma, cur = w.get('lemma'), w.get('strongs')
                if not lemma or not cur:
                    continue
                total += 1
                if head_of.get(str(cur)) == lemma:
                    continue                      # already agrees
                right = resolve(lemma)
                if not right or str(right) == str(cur):
                    continue
                moves[(lemma, str(cur), head_of.get(str(cur)), str(right))] += 1
                w['strongs'] = str(right)
                fixed += 1
                touched = True
        if touched:
            with open(path, 'w') as fh:
                json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
            files += 1

    print(f'words carrying a number: {total:,}')
    print(f'renumbered: {fixed:,} across {files:,} files')
    for (lem, was, waslem, now), n in moves.most_common(20):
        print(f'  {lem:>12}  G{was} ({waslem}) -> G{now}   {n:>6}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
