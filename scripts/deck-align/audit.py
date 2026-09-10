"""Per PACK: the union of the sentences on every slide that names it, vs the pack's own.

Grouping by pack rather than by slide handles both documented artefacts for free — an exercise
that runs over several slides, and the answer slide that repeats its question slide — because a
set union absorbs the repeat and collects the continuation.
"""
import json, os, glob, re, collections, unicodedata, subprocess
import deckread
from compare import norm, BASE, DECK_DIRS, GREEK

# Places where the app DELIBERATELY differs from the slides, keyed deck-text -> app-text (both
# normalised). Without these the audit reports the correction as a gap in both directions every
# time it runs, and the obvious "fix" is to undo it.
# Empty, and that is the goal: the app should not differ from the decks. The one entry this ever
# held (ἀγαθος -> ἀγαθας in Adjectives and Pronouns) was removed once the SLIDE was corrected too,
# so the check is live again rather than permanently suppressed.
KNOWN_DIVERGENCES: dict[str, str] = {}

def _packs_path():
    """packs.json is generated FROM the .ts files by dump_packs.mjs — regenerate it if it is
    missing or stale, so `python3 scripts/deck-align/audit.py` works from a clean checkout.
    (The .ts files cannot simply be imported: tsx reports "does not provide an export named
    GRAMMAR_HOMEWORK_SETS", which is why the dump exists at all.)"""
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, 'packs.json')
    src = [os.path.join(here, '..', '..', 'src', 'data', f)
           for f in ('grammar-homework.ts', 'grammar-homework-slides.ts')]
    stale = (not os.path.exists(out)
             or any(os.path.getmtime(f) > os.path.getmtime(out) for f in src if os.path.exists(f)))
    if stale:
        subprocess.run(['node', 'dump_packs.mjs'], cwd=here, check=True,
                       stdout=subprocess.DEVNULL)
    return out


packs = {p['title']: p for p in json.load(open(_packs_path()))}
deck_by_pack = collections.defaultdict(set)
raw_by_pack = collections.defaultdict(dict)
slides_by_pack = collections.defaultdict(set)
decks_by_pack = collections.defaultdict(set)

SKIP = re.compile(r'Application exercise|^Translate|^Parse|^Answers?$', re.I)

for d in DECK_DIRS:
    for path in sorted(glob.glob(os.path.join(d, '**', '*.pptx'), recursive=True)):
        if os.path.basename(path).startswith('~$'): continue
        deck = os.path.basename(path)[:-5]
        slides = dict(deckread.deck_slides(path))
        for slide_no, chapter, title, _ in deckread.markers(path):
            if not title or title not in packs: continue
            for _, _, paras in slides.get(slide_no, []):
                # REJOIN WRAPPED LINES within the shape. PowerPoint stores each visual line of a
                # wrapped item as its own <a:p>, so 'δοξαζωμεν τον των οὐρανων' and 'θεον.' are two
                # paragraphs of one sentence. Without this every wrapped item reports as both a
                # deck-only fragment AND an app-only sentence — inflating both directions at once.
                merged, cur = [], ''
                for para in paras:
                    if SKIP.search(para):
                        if cur: merged.append(cur); cur = ''
                        continue
                    cur = (cur + ' ' + para).strip() if cur else para
                    # NOT · or ∙ — the ano teleia is Greek's mid-sentence colon, and treating it
                    # as terminal chops 'λεγει ἡ μητηρ αὐτου τοις διακονοις∙ Ὁ τι ἀν λεγῃ ὑμιν
                    # ποιησατε.' in half. Terminal is a stop, a Greek question mark, or '!'.
                    if re.search(r'[.;!?]\s*$', cur):
                        merged.append(cur); cur = ''
                if cur: merged.append(cur)
                for para in merged:
                    if not GREEK.search(para): continue
                    n = norm(para)
                    if not n: continue
                    deck_by_pack[title].add(n)
                    raw_by_pack[title].setdefault(n, para)
            slides_by_pack[title].add((deck, slide_no))
            decks_by_pack[title].add(deck)

report = []
for title, pack in packs.items():
    app = {norm(' '.join(w['w'] for w in s['words'])): ' '.join(w['w'] for w in s['words'])
           for s in pack['sentences']}
    deck = deck_by_pack.get(title)
    if deck is None:
        report.append((title, pack['chapter'], 'NO SLIDE NAMES THIS PACK', [], list(app.values())))
        continue
    # Fold each known correction into the deck side, so neither half is reported.
    deck = {KNOWN_DIVERGENCES.get(k, k) for k in deck}
    missing = [raw_by_pack[title][k] for k in deck - set(app) if k in raw_by_pack[title]]
    stale   = [app[k] for k in set(app) - deck]
    report.append((title, pack['chapter'], 'ok', sorted(missing), sorted(stale)))

json.dump([{'pack': r[0], 'chapter': r[1], 'status': r[2], 'on_deck_not_in_app': r[3],
            'in_app_not_on_deck': r[4], 'decks': sorted(decks_by_pack.get(r[0], []))}
           for r in report],
          # BESIDE THIS SCRIPT, not in the cwd: the README says the audit runs from anywhere,
          # and a bare 'audit.json' drops a generated 26KB file into whatever directory you
          # happened to be in — the repo root, where only scripts/deck-align/.gitignore
          # covers it and the next `git add -A` sweeps it in.
          open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audit.json'), 'w'),
          ensure_ascii=False, indent=1)

unnamed = [r for r in report if r[2] != 'ok']
miss = sum(len(r[3]) for r in report); stale = sum(len(r[4]) for r in report)
print(f'packs: {len(packs)}')
print(f'packs no slide names: {len(unnamed)}')
print(f'deck sentences missing from the app: {miss}')
print(f'app sentences no longer on the deck: {stale}')
print(f'packs affected: {sum(1 for r in report if r[3] or r[4])}')
