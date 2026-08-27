#!/usr/bin/env python3
"""
Does Brenton's English actually sit beside the right Greek verse?

Brenton translated the Septuagint, but numbered his English the way the KJV Apocrypha does, while
Swete numbered the Greek his own way. The reader pairs the two columns by verse id, so wherever
they disagree the English column quietly reports a different sentence from the Greek beside it.
Nothing errors. Tobit 5:14 printed Raguel's speech about Ananias and Jathan against "what wages
shall I give thee? wilt thou a drachm a day" — plausible English, one verse out.

HOW IT LOOKS FOR IT. Verse length, per chapter, at a range of offsets: a long Greek verse
translates to a long English one, so the true alignment is the offset whose lengths correlate
best. It is language-blind, needs no lexicon, and does not care that the two texts are different
recensions.

WHAT IT CANNOT DO, AND WHY EVERY HIT MUST BE READ BEFORE IT IS BELIEVED. It reports correlation,
not correspondence. It cannot see a chapter that drifts partway through (1 Esdras 1 pairs at verse
3 and is two out by verse 30), and it fits a spurious offset to a chapter whose divergence is
structural rather than positional (the Greek and English traditions transpose whole blocks of
Sirach 30-36). Of ten chapters it flagged, four were real, two were different problems entirely,
and the rest were noise. The verified ones are in src/lib/brenton-alignment.ts.

Usage:  python3 scripts/lxx-english-alignment.py
"""
import json, glob, os, collections, sys

APOCRYPHA = ['Tob', 'Jdt', 'Wis', 'Sir', 'Bar', 'EpJer', '1Esd', '1Macc', '2Macc', '3Macc',
             '4Macc', 'PsSol', 'Sus', 'Bel', 'EsthGr', 'DanLXX', 'Odes']
MIN_VERSES = 8
OFFSETS = range(-4, 5)


def pearson(xs, ys):
    n = len(xs)
    if n < 4:
        return 0.0
    mx, my = sum(xs) / n, sum(ys) / n
    vx = sum((x - mx) ** 2 for x in xs)
    vy = sum((y - my) ** 2 for y in ys)
    if vx <= 0 or vy <= 0:
        return 0.0
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (vx ** 0.5 * vy ** 0.5)


def main():
    flagged, examined, no_english = [], 0, []
    for book in APOCRYPHA:
        english_path = f'public/data/brenton/{book}.json'
        chapters = collections.defaultdict(dict)
        for path in glob.glob(f'public/data/lxx/{book}_*.json'):
            for v in json.load(open(path))['verses']:
                chapters[v['chapter']][v['verse']] = v['text']
        if not os.path.exists(english_path):
            no_english.append(f'{book} ({len(chapters)} chapters)')
            continue
        english = json.load(open(english_path))
        for chapter, verses in sorted(chapters.items()):
            scores = {}
            for off in OFFSETS:
                xs, ys = [], []
                for verse in sorted(verses):
                    e = english.get(f'{book}.{chapter}.{verse + off}')
                    if not e:
                        continue
                    xs.append(len(verses[verse]))
                    ys.append(len(e))
                if len(xs) >= MIN_VERSES:
                    scores[off] = (pearson(xs, ys), len(xs))
            if 0 not in scores:
                continue
            examined += 1
            best = max(scores, key=lambda o: scores[o][0])
            r0, rb = scores[0][0], scores[best][0]
            if best != 0 and rb >= 0.60 and rb - r0 >= 0.25:
                flagged.append((book, chapter, best, r0, rb, scores[best][1]))

    print(f'chapters compared: {examined}')
    if no_english:
        print(f'no English at all: {", ".join(no_english)}')
    print(f'\n{"book":<8}{"ch":>4}{"shift":>7}{"r@0":>8}{"r@shift":>9}{"verses":>8}')
    for book, chapter, off, r0, rb, n in flagged:
        print(f'{book:<8}{chapter:>4}{off:>+7}{r0:>8.2f}{rb:>9.2f}{n:>8}')
    print(f'\nflagged: {len(flagged)} — READ EACH ONE before believing it.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
