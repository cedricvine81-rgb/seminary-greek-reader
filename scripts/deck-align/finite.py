"""-ουσιν is BOTH the 3rd plural indicative and the dative plural participle, and the tagger
took the participle every time. The article is again the discriminator: 'τοις αἰτουσιν' is a
real participle ('to those who ask'), while 'οἱ μαθηται πιστευουσιν' is a finite verb.
Only a form with no article in front of it is corrected."""
import re, pathlib

FILES = [pathlib.Path('/Users/cvine/dev/seminary-greek-reader/src/data/grammar-homework-slides.ts'),
         pathlib.Path('/Users/cvine/dev/seminary-greek-reader/src/data/grammar-homework.ts')]
WORD = re.compile(r'\{ w: "((?:[^"\\]|\\.)*)"(?:, parsing: "((?:[^"\\]|\\.)*)")?')
PTC = re.compile(r'^Pres Act Ptcp? (?:Dat Pl Masc )?— (.+)$')

fixed = []
for f in FILES:
    lines = f.read_text().split('\n')
    for i, line in enumerate(lines):
        m = WORD.search(line)
        if not m or not m.group(2):
            continue
        w = m.group(1).strip('.,;·∙:')
        import unicodedata
        b = ''.join(c for c in unicodedata.normalize('NFD', w) if not unicodedata.combining(c)).lower()
        if not b.endswith(('ουσιν', 'ουσι')):
            continue
        p = PTC.match(m.group(2))
        if not p:
            continue
        prev = WORD.search(lines[i-1]) if i else None
        if prev and (prev.group(2) or '').startswith('Article'):
            continue                                   # τοις αἰτουσιν — a real participle
        new = f'Pres Act Ind 3 Pl — {p.group(1)}'
        lines[i] = line.replace(f'parsing: "{m.group(2)}"', f'parsing: "{new}"')
        fixed.append((m.group(1), m.group(2), new))
    f.write_text('\n'.join(lines))
print(f'finite verbs recovered from participle parses: {len(fixed)}')
for w, old, new in fixed:
    print(f'   {w:<18}{old:<34} -> {new}')
