"""Append the missing deck sentences into each pack's `sentences` array, in the file's own style."""
import json, re, collections, pathlib

REPO = pathlib.Path('/Users/cvine/dev/seminary-greek-reader/src/data')
SLIDES = REPO / 'grammar-homework-slides.ts'

def esc(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')

def render(sentence):
    lines = ['      { words: [']
    for w in sentence['words']:
        bits = [f'w: "{esc(w["w"])}"']
        if w.get('parsing'): bits.append(f'parsing: "{esc(w["parsing"])}"')
        if w.get('gloss'):   bits.append(f'gloss: "{esc(w["gloss"])}"')
        lines.append('        { ' + ', '.join(bits) + ' },')
    lines.append('      ],')
    lines.append(f'        translation: "{esc(sentence["translation"])}",')
    lines.append(f'        note: "{esc(sentence["note"])}",')
    lines.append('      },')
    return '\n'.join(lines)

def pack_span(src, title):
    """(insert_at, ) index just before the pack's `sentences` array closes."""
    i = src.find(f'title: "{title}"')
    if i < 0:
        raise SystemExit(f'pack not found: {title}')
    j = src.index('sentences: [', i)
    k = src.index('[', j)
    depth = 0
    for n in range(k, len(src)):
        if src[n] == '[': depth += 1
        elif src[n] == ']':
            depth -= 1
            if depth == 0:
                return n            # the closing bracket of `sentences`
    raise SystemExit('unbalanced')

if __name__ == '__main__':
    final = json.load(open('final.json'))
    by_pack = collections.defaultdict(list)
    for n, r in final.items():
        if r['pack'].startswith('Slides'):          # hand-written Homework packs held back
            by_pack[r['pack']].append(r['sentence'])

    src = SLIDES.read_text()
    added = 0
    # Insert from the END of the file backwards so earlier offsets stay valid.
    targets = sorted(((pack_span(src, t), t) for t in by_pack), reverse=True)
    for pos, title in targets:
        block = '\n'.join(render(s) for s in by_pack[title]) + '\n'
        src = src[:pos] + block + src[pos:]
        added += len(by_pack[title])
    SLIDES.write_text(src)
    print(f'packs touched: {len(by_pack)}   sentences added: {added}')
    held = [(r['pack'], ' '.join(w['w'] for w in r['sentence']['words'])[:60])
            for r in final.values() if not r['pack'].startswith('Slides')]
    print(f'\nheld back (hand-written Homework packs): {len(held)}')
    for p, g in held: print(f'   {p[:40]:<42}{g}')
