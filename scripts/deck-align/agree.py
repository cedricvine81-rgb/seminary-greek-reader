"""Make article and noun agree, per the instructor's rule (2026-09-10).

THE ARTICLE IS THE DISAMBIGUATOR FOR CASE AND NUMBER. Ἰησοῦ is genitive, dative and vocative
all at once; ἀγάπῃ looks nominative to a frequency count; καρδίας is far commoner as a genitive
singular than an accusative plural. In every such pair it is the article that settles it, so
the NOUN's case and number are corrected to the article's.

GENDER GOES THE OTHER WAY, because the article often does not encode it: τοῖς, τῶν and τοῦ
serve masculine and neuter alike. There the noun's lexical gender is fixed and it is the
ARTICLE's tag that is wrong — ῥῆμα, ἔθνος, ὕδωρ, τέκνον and στόμα are neuter whatever the
tagger guessed from τοῖς. Forcing the article's gender onto the noun would make them masculine.
"""
import re, pathlib, json

FILES = [pathlib.Path('/Users/cvine/dev/seminary-greek-reader/src/data/grammar-homework-slides.ts'),
         pathlib.Path('/Users/cvine/dev/seminary-greek-reader/src/data/grammar-homework.ts')]
WORD = re.compile(r'\{ w: "((?:[^"\\]|\\.)*)"(?:, parsing: "((?:[^"\\]|\\.)*)")?(?:, syntax: "((?:[^"\\]|\\.)*)")?(?:, gloss: "((?:[^"\\]|\\.)*)")? \},')
ART = re.compile(r'^Article — (\w+) (\w+) (\w+)$')
NOM = re.compile(r'^(Nom|Gen|Dat|Acc|Voc) (Sg|Pl) (Masc|Fem|Neut) — (.+)$')
# The deck's own slip, kept as the deck has it: καλειτε τας ἀγαθος ἀδελφας (ἀγαθος for ἀγαθας).
SKIP_AFTER = {'ἀγαθος'}

changed = []
for f in FILES:
    lines = f.read_text().split('\n')
    for i in range(1, len(lines)):
        a_m = WORD.search(lines[i-1]); n_m = WORD.search(lines[i])
        if not (a_m and n_m):
            continue
        a = ART.match(a_m.group(2) or ''); n = NOM.match(n_m.group(2) or '')
        if not (a and n):
            continue
        acase, anum, agen = a.groups()
        ncase, nnum, ngen, lemma = n.groups()
        if (acase, anum, agen) == (ncase, nnum, ngen):
            continue
        if n_m.group(1).strip('.,;·∙:') in SKIP_AFTER:
            continue
        if (acase, anum) != (ncase, nnum):
            new = f'{acase} {anum} {ngen} — {lemma}'          # noun follows the article
            lines[i] = lines[i].replace(f'parsing: "{n_m.group(2)}"', f'parsing: "{new}"')
            changed.append((f.name, a_m.group(1), n_m.group(1), n_m.group(2), new, 'noun'))
        elif agen != ngen:
            new = f'Article — {acase} {anum} {ngen}'           # article follows the noun
            lines[i-1] = lines[i-1].replace(f'parsing: "{a_m.group(2)}"', f'parsing: "{new}"')
            changed.append((f.name, a_m.group(1), n_m.group(1), a_m.group(2), new, 'article'))
    f.write_text('\n'.join(lines))

print(f'corrections: {len(changed)}')
for fn, art, w, old, new, which in changed:
    print(f'  {art:<8}{w:<16}{which:<9}{old:<26} -> {new}')
