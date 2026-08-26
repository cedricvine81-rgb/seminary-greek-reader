#!/usr/bin/env python3
"""
Second pass over the tagged Swete text: give a Strong's number to words the lemmatiser fumbled.

WHY THIS EXISTS. Our Swete morphology is machine-generated (Stanza `grc`, see lxx-tag-swete.py),
and Stanza's lemmatiser is a seq2seq model — when a form is unfamiliar it does not decline to
answer, it invents a dictionary form. ἠγάπησαν and friends came back under ἀγαπάσκω, ἀγαπάνω,
ἀγαπάσσω, ἀγαπάκω: plausible-looking Greek that does not exist. A word lemmatised to a word that
does not exist gets no Strong's number, and the LXX is matched by Strong's throughout this app
(it has no trustworthy lemmas of its own), so those tokens fall out of lexeme search entirely.
That is wrong data rather than missing data, and it fails silently — the search just returns less.

THE REPAIR. Nestle 1904 ships with this app already, hand-tagged, one Strong's number per word.
Greek is Greek: where an unresolved Septuagint word is spelled exactly like a New Testament word
whose lemma and number are unambiguous there, we adopt both. This recovers ~30k of the ~97k
unresolved tokens (83.5% -> 88.6% corpus coverage).

WHY EXACT SPELLING, ACCENTS AND ALL. Matching on stripped accents would add only ~5k more tokens
while letting homographs through (εἰς/εἷς and their kin) — a bad trade for a silent corruption.
An unmatched word keeps its machine lemma and stays without a number; that is the honest outcome.

These words stay `machine_generated`: a lexicon match is still an automatic judgement, not a human
one. Idempotent — rerunning changes nothing.
"""
import json, glob, os, sys, collections

LXX = 'public/data/lxx'
GNT = 'public/data/na1904'
EDGE = '.,;:·’\'"()[]—-'


def bare(s: str) -> str:
    return s.strip(EDGE)


def gnt_authority() -> dict:
    """Surface form -> (lemma, strongs), keeping only forms that are unambiguous in the GNT."""
    seen = collections.defaultdict(set)
    for path in glob.glob(f'{GNT}/*.json'):
        for verse in json.load(open(path))['v'].values():
            for w in verse:
                if len(w) > 2 and w[2]:
                    seen[bare(w[0])].add((w[1], str(w[2])))
    return {form: next(iter(v)) for form, v in seen.items() if len(v) == 1}


def main() -> int:
    if not os.path.isdir(LXX) or not os.path.isdir(GNT):
        print('run me from the repo root', file=sys.stderr)
        return 1
    auth = gnt_authority()
    print(f'Nestle 1904 forms that are unambiguous: {len(auth):,}')

    total = gap = fixed = files = 0
    relemmatised = collections.Counter()
    for path in sorted(glob.glob(f'{LXX}/*.json')):
        doc = json.load(open(path))
        touched = False
        for v in doc['verses']:
            for w in v['words']:
                total += 1
                if w.get('strongs'):
                    continue
                gap += 1
                hit = auth.get(bare(w['surface']))
                if not hit:
                    continue
                lemma, strongs = hit
                if w.get('lemma') and w['lemma'] != lemma:
                    relemmatised[(w['lemma'], lemma)] += 1
                w['lemma'] = lemma
                w['strongs'] = strongs
                fixed += 1
                touched = True
        if touched:
            with open(path, 'w') as fh:
                json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
            files += 1

    print(f'files rewritten: {files:,}')
    print(f'tokens: {total:,} · unresolved before: {gap:,} · resolved now: {fixed:,}')
    if total:
        print(f'Strong\'s coverage: {(total-gap)/total:.1%} -> {(total-gap+fixed)/total:.1%}')
    print('\nmost-corrected invented lemmas:')
    for (was, now), n in relemmatised.most_common(12):
        print(f'  {was:>18} -> {now:<18} {n:>5}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
