"""Remove the six sentences that carry a slide's SECTION HEADING welded onto their front.

Each is a corrupted rendering of a deck item now present correctly, so this both fixes the
malformed Greek (which contradicted its own English) and removes the duplicate.
"""
import re, pathlib, json
from compare import norm

SRC = pathlib.Path('/Users/cvine/dev/seminary-greek-reader/src/data/grammar-homework-slides.ts')
WELDED = {
 'Slides: 2. Lesson 3 (1st Declension) — A': 'αὐτος αὐτος γινωσκω αὐτον.',
 'Slides: 2. Lesson 3 (1st Declension) — B': 'αὐτος αὐτος ὁ κυριος γινωσκει τας καρδιας.',
 'Slides: Lesson 4 (3rd Declension) — E':    'εἰς οὐδεις ἐστιν ἁγιος;',
 'Slides (Int.): Nouns System 1':            'αὐτος φιλω αὐτον.',
 'Slides (Int.): Nouns System 2 — B':        'πας παντες οἱ πατερες ἀπεθανον.',
 'Slides (Int.): Nouns System 2 — C':        'εἰς οὐδεις ἐστιν ἀγαθος;',
}
BLOCK = re.compile(r'      \{ words: \[.*?\n      \},\n', re.S)
W = re.compile(r'w: "((?:[^"\\]|\\.)*)"')

src = SRC.read_text()
removed = 0
for title, welded in WELDED.items():
    i = src.find(f'title: "{title}"')
    assert i > 0, title
    # the pack's own span: from its title to the next pack's `id:`
    nxt = src.find('\n  {\n    id: "', i)
    span = src[i:nxt if nxt > 0 else len(src)]
    target = norm(welded)
    for m in BLOCK.finditer(span):
        if norm(' '.join(W.findall(m.group(0)))) == target:
            src = src[:i + m.start()] + src[i + m.end():]
            removed += 1
            break
    else:
        raise SystemExit(f'block not found in {title}')
SRC.write_text(src)
print('welded sentences removed:', removed)
