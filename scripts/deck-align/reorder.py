"""Put each touched pack's sentences back into the deck's own presentation order.

The order a class works through is the slide's order; a pack that lists the same sentences in a
different sequence is harder to teach from, and the previous alignment made presentation order
an explicit rule.
"""
import json, os, glob, re, collections, pathlib
import deckread, pairs
from compare import norm, DECK_DIRS

SRC = pathlib.Path('/Users/cvine/dev/seminary-greek-reader/src/data/grammar-homework-slides.ts')
BLOCK = re.compile(r'      \{ words: \[.*?\n      \},\n', re.S)
W = re.compile(r'w: "((?:[^"\\]|\\.)*)"')

touched = {r['pack'] for r in json.load(open('final.json')).values() if r['pack'].startswith('Slides')}
touched |= {'Slides: 2. Lesson 3 (1st Declension) — A','Slides: 2. Lesson 3 (1st Declension) — B',
            'Slides: Lesson 4 (3rd Declension) — E','Slides (Int.): Nouns System 1',
            'Slides (Int.): Nouns System 2 — B','Slides (Int.): Nouns System 2 — C'}

order = collections.defaultdict(list)
for d in DECK_DIRS:
    for path in sorted(glob.glob(os.path.join(d,'**','*.pptx'), recursive=True)):
        if os.path.basename(path).startswith('~$'): continue
        for slide_no, ch, title, _ in sorted(deckread.markers(path), key=lambda m: m[0]):
            if title in touched:
                for g, _ in pairs.slide_pairs(path, slide_no):
                    n = norm(g)
                    if n and n not in order[title]:
                        order[title].append(n)

src = SRC.read_text()
changed = 0
for title in sorted(touched):
    i = src.find(f'title: "{title}"')
    assert i > 0, title
    nxt = src.find('\n  {\n    id: "', i)
    end = nxt if nxt > 0 else len(src)
    span = src[i:end]
    blocks = list(BLOCK.finditer(span))
    if not blocks:
        continue
    idx = {n: k for k, n in enumerate(order[title])}
    keyed = []
    for pos, m in enumerate(blocks):
        n = norm(' '.join(W.findall(m.group(0))))
        keyed.append((idx.get(n, 10_000 + pos), pos, m.group(0)))
    new = [b for _, _, b in sorted(keyed)]
    if new == [m.group(0) for m in blocks]:
        continue
    lo, hi = blocks[0].start(), blocks[-1].end()
    span = span[:lo] + ''.join(new) + span[hi:]
    src = src[:i] + span + src[end:]
    changed += 1
SRC.write_text(src)
print('packs reordered:', changed)
