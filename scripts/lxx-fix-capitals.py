#!/usr/bin/env python3
"""
Two last corrections to the tagged Swete text, both about words the tagger could not read.

1. SWETE'S DISPLAY CAPITALS. Swete opens a book with its first words set in unaccented capitals —
   Genesis begins ΕΝ ΑΡΧΗ ἐποίησεν ὁ θεός. Stanza has never seen a Greek word written that way, so
   it guessed: ΕΝ came back as the numeral εἷς "one" (G1520) rather than the preposition ἐν, which
   left the best-known verse in the corpus opening with "One beginning God made". 487 words across
   309 files are set this way. We lowercase the word for identification only — the surface keeps
   Swete's capitals, because that is what the page prints — and take the reading Nestle 1904 gives
   that spelling, most common first. Most common, not unambiguous, because these are precisely the
   accent-blind cases (εν is both ἐν and ἕν) and the alternative here is a number known to be wrong.
   Latin numerals and stray single letters are left alone.

2. THE TWO JERUSALEMS. Greek keeps the Semitic Ἱερουσαλήμ (G2419) and the Hellenised Ἱεροσόλυμα
   (G2414) apart; Nestle 1904's word data files both under one lemma. lxx-resolve-strongs.py took
   that lemma at face value, and lxx-fix-homographs.py then moved the number to agree with it, so
   350 plainly Semitic Ἰερουσαλήμ readings ended up filed as the Greek city name. Where the surface
   itself says Ἰερουσαλ-, the Semitic entry is the right one.

Idempotent; safe to rerun.
"""
import json, glob, os, sys, collections, unicodedata

LXX, GNT = 'public/data/lxx', 'public/data/na1904'
EDGE = '.,;:·’\'"()[]—-'
GREEK = range(0x370, 0x400)


def fold(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()


def is_greek_caps(s: str) -> bool:
    letters = [c for c in s if c.isalpha()]
    return bool(letters) and all(c.isupper() and ord(c.lower()) in GREEK for c in letters)


def main() -> int:
    if not os.path.isdir(LXX):
        print('run me from the repo root', file=sys.stderr)
        return 1

    tally = collections.defaultdict(collections.Counter)
    for path in glob.glob(f'{GNT}/*.json'):
        for verse in json.load(open(path))['v'].values():
            for w in verse:
                if len(w) > 2 and w[2]:
                    tally[fold(w[0].strip(EDGE))][(w[1], str(w[2]))] += 1
    best = {k: v.most_common(1)[0][0] for k, v in tally.items()}
    print(f'Nestle 1904 folded forms: {len(best):,}')

    caps = jeru = files = 0
    changes = collections.Counter()
    for path in sorted(glob.glob(f'{LXX}/*.json')):
        doc = json.load(open(path))
        touched = False
        for v in doc['verses']:
            for w in v['words']:
                bare = w['surface'].strip(EDGE)

                if w.get('lemma') in ('Ἱεροσόλυμα', 'Ἰεροσόλυμα') and fold(bare).startswith('ιερουσαλ'):
                    if (w.get('lemma'), str(w.get('strongs'))) != ('Ἱερουσαλήμ', '2419'):
                        w['lemma'], w['strongs'] = 'Ἱερουσαλήμ', '2419'
                        jeru += 1; touched = True
                    continue

                if not is_greek_caps(bare):
                    continue
                hit = best.get(fold(bare))
                if not hit or (w.get('lemma'), str(w.get('strongs'))) == hit:
                    continue
                changes[(bare, w.get('lemma'), hit[0])] += 1
                w['lemma'], w['strongs'] = hit[0], hit[1]
                caps += 1; touched = True
        if touched:
            with open(path, 'w') as fh:
                json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
            files += 1

    print(f'display-capital words re-read: {caps} · Jerusalem readings restored: {jeru} · files: {files}')
    for (surf, was, now), n in changes.most_common(15):
        print(f'  {surf:>10}  {was} -> {now}   {n}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
