"""Build "Pagan Sources Quoted in the New Testament" — a small curated collection of the Greek
passages the New Testament quotes or alludes to, each paired with its NT reference.

The passages are short (mostly single lines / fragments), so this is hand-curated rather than
ingested from a single edition. Provenance per passage:
  · Aratus, Phaenomena 1–5 — the Perseus Greek edition (tlg0653.tlg001); line 5 is quoted by
    Paul at Acts 17:28 ("τοῦ γὰρ καὶ γένος ἐσμέν", Doric εἰμέν in Aratus).
  · Cleanthes, Hymn to Zeus 4 — the standard critical text (von Arnim, SVF 1.537); the same
    "we are your offspring" motif behind Acts 17:28.
  · Menander, Thaïs (fr. 165 K–A) — the wording is fixed by Paul's verbatim quotation at
    1 Cor 15:33 (verified against the app's GNT text).
  · Epimenides, Cretica — quoted verbatim at Titus 1:12 (verified against the GNT); the
    "in him we live and move" of Acts 17:28a is also traditionally ascribed to it.

Each chapter is one source; its label carries the author, work, and the NT reference. Verse
numbers are the line numbers (Aratus) or 1.

Usage:  python3 scripts/build-nt-pagan-sources.py   (run from the repo root)
"""
import json
from pathlib import Path

OUT = Path('public/data/greco/nt-pagan-sources.json')

ATTRIB = ('A curated collection of Greek passages quoted or alluded to in the New Testament. '
          'Aratus follows the Perseus edition of the Phaenomena; the other passages follow the '
          'standard critical texts, with the New Testament quotations fixing the wording. '
          'Translations are the editor’s, in the public domain.')

# Each chapter: (label, [(verse_number, greek, english)])
CHAPTERS = [
    ('Aratus, Phaenomena 1–5 · Acts 17:28', [
        (1, 'ἐκ Διὸς ἀρχώμεσθα, τὸν οὐδέποτʼ ἄνδρες ἐῶμεν',
            'From Zeus let us begin; him do we mortals never leave unspoken.'),
        (2, 'ἄρρητον· μεσταὶ δὲ Διὸς πᾶσαι μὲν ἀγυιαί,',
            'Filled with Zeus are all the highways,'),
        (3, 'πᾶσαι δʼ ἀνθρώπων ἀγοραί, μεστὴ δὲ θάλασσα',
            'and all the marketplaces of men; filled too the sea'),
        (4, 'καὶ λιμένες· πάντη δὲ Διὸς κεχρήμεθα πάντες.',
            'and the harbours; and in every way we all have need of Zeus.'),
        (5, 'τοῦ γάρ καὶ γένος εἰμέν· ὁ δʼ ἤπιος ἀνθρώποισιν',
            'For we are also his offspring; and kindly to men he'),
    ]),
    ('Cleanthes, Hymn to Zeus 4 · Acts 17:28', [
        (1, 'ἐκ σοῦ γὰρ γένος ἐσμέν, ἤχου μίμημα λαχόντες μοῦνοι, ὅσα ζώει τε καὶ ἕρπει θνήτʼ ἐπὶ γαῖαν.',
            'For we are your offspring, and alone of all that live and move as mortals on the earth '
            'we bear the likeness of your voice.'),
    ]),
    ('Menander, Thaïs (fr. 165) · 1 Corinthians 15:33', [
        (1, 'φθείρουσιν ἤθη χρηστὰ ὁμιλίαι κακαί.',
            'Bad company corrupts good character.'),
    ]),
    ('Epimenides, Cretica · Titus 1:12', [
        (1, 'Κρῆτες ἀεὶ ψεῦσται, κακὰ θηρία, γαστέρες ἀργαί.',
            'Cretans are always liars, evil beasts, lazy gluttons. '
            '(The words of Acts 17:28a, “in him we live and move and have our being,” are also '
            'traditionally ascribed to Epimenides’ Cretica.)'),
    ]),
]


def main():
    chapters = []
    for i, (label, verses) in enumerate(CHAPTERS, 1):
        chapters.append({'number': i, 'verses': [
            {'number': n, 'text': en, 'greek': grc} for n, grc, en in verses]})
    doc = {'work': 'Pagan Sources Quoted in the New Testament', 'attribution': ATTRIB,
           'greek': True, 'chapters': chapters}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding='utf-8')
    nv = sum(len(c['verses']) for c in chapters)
    print(f'wrote {OUT} — {len(chapters)} sources, {nv} verses')
    print('labels:', ' | '.join(l for l, _ in CHAPTERS))


if __name__ == '__main__':
    main()
