"""Compare each deck's marked exercise slides against the app pack the marker names."""
import json, re, sys, os, unicodedata, glob
import deckread

BASE = '/Users/cvine/Library/CloudStorage/Dropbox/Classes'
DECK_DIRS = [f'{BASE}/2. Beginning Greek/Lessons (seminarygreek)',
             f'{BASE}/3. Int. Greek/Lessons (seminarygreek)']
GREEK = re.compile(r'[Ͱ-Ͽἀ-῿]')

def norm(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))     # accents off both sides
    s = s.lower()
    s = re.sub(r'^\s*[\(\[]?\d+[\.\)\]]?\s*', '', s)              # leading item number
    s = re.sub(r'\([^)]*\)', ' ', s)                              # bracket glosses
    s = re.sub(r'\[[^\]]*\]', ' ', s)                             # editorial brackets
    s = s.replace('∙', ' ').replace('·', ' ')           # ∙ vs ·
    s = re.sub(r'[^Ͱ-Ͽἀ-῿ ]', ' ', s)         # keep Greek letters only
    return ' '.join(s.split())

def pack_sentences(pack):
    return [' '.join(w['w'] for w in s['words']) for s in pack['sentences']]

def deck_greek_paras(shapes):
    """Greek paragraphs on a slide, wrapped lines rejoined within a shape."""
    out = []
    for _, _, paras in shapes:
        buf = []
        for p in paras:
            if 'Application exercise' in p:
                continue
            buf.append(p)
        # rejoin: a paragraph not ending in sentence punctuation continues the next
        merged, cur = [], ''
        for p in buf:
            cur = (cur + ' ' + p).strip() if cur else p
            if re.search(r'[.;;:!?]\s*$', cur) or len(cur) > 400:
                merged.append(cur); cur = ''
        if cur: merged.append(cur)
        for m in merged:
            if GREEK.search(m):
                out.append(m)
    return out

if __name__ == '__main__':
    packs = {p['title']: p for p in json.load(open('packs.json'))}
    rows = []
    for d in DECK_DIRS:
        for path in sorted(glob.glob(os.path.join(d, '**', '*.pptx'), recursive=True)):
            if os.path.basename(path).startswith('~$'):
                continue
            deck = os.path.basename(path)[:-5]
            slides = dict(deckread.deck_slides(path))
            for slide_no, chapter, title, _ in deckread.markers(path):
                if not title:
                    continue
                pack = packs.get(title)
                if pack is None:
                    rows.append((deck, slide_no, title, 'NO SUCH PACK', [], []))
                    continue
                deck_sents = {norm(x) for x in deck_greek_paras(slides.get(slide_no, [])) if len(norm(x).split()) >= 2}
                app_sents = {norm(x) for x in pack_sentences(pack)}
                missing = [s for s in deck_sents if s and s not in app_sents]
                rows.append((deck, slide_no, title, 'ok', sorted(missing), []))
    json.dump([{'deck': r[0], 'slide': r[1], 'pack': r[2], 'status': r[3], 'deck_only': r[4]} for r in rows],
              open('compare.json', 'w'), ensure_ascii=False, indent=1)
    bad = [r for r in rows if r[3] != 'ok']
    print('marked slides naming a pack:', len(rows))
    print('markers naming a pack that does not exist:', len(bad))
    for r in bad[:10]: print('   ', r[0], 's'+str(r[1]), '->', r[2])
