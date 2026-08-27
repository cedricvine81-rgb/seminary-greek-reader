#!/usr/bin/env python3
"""
Put the Psalm titles back at the head of their own psalm.

Swete prints a psalm's title on its own line, and the word-per-line source numbers that line as if
it continued the PREVIOUS psalm — so the title of Psalm 22 arrived as "verse 32", Psalm 21 having
31 verses. The title then sorted to the end of its psalm, and a reader of the six-verse shepherd
psalm saw a stray verse 32 after the last line reading "Ψαλμὸς τῷ Δαυείδ".

It also threw the psalm out of step with Brenton, who numbers the title as verse 1 and the body
from 2 — the same class of mismatch as the Odes titles that arrived as verse 88.

The body numbering is NOT touched. It already matches what this app shipped before (Rahlfs folded
the title into verse 1 and numbered the body from 1), so every note and highlight anchored to a
psalm verse keeps its place. Only the stray title moves, to verse 0, which is where this app puts
a heading that precedes verse 1 — as it does for Lamentations, Sirach and the Odes.

WHAT IT WILL NOT TOUCH. A title is only moved when it sits on a number beyond the end of its own
psalm, which is what makes it certainly a continuation number rather than a reading. A lone
"Ἁλληλουιά" as a psalm's last verse is left alone: it is genuinely ambiguous whether it closes
this psalm or opens the next, and editions disagree. Odes 9's heading at verse 67 is deliberate
(see lxx-reconcile-odes.py) and excluded by name.

Idempotent.
"""
import json, glob, os, re, sys

TITLE = re.compile(r'^(Ψαλμὸς|Ψαλμός|ᾨδὴ|ᾨδή|Ὠδὴ|Εἰς τὸ τέλος|Προσευχὴ|Προσευχή|Αἴνεσις|Αἶνος'
                   r'|Ἀλληλουιά|Ἁλληλουιά|Συνέσεως|Τῷ Δαυ|Τοῦ Δαυ|Τοῖς υἱοῖς|Στηλογραφία|Αἶγος)')
LXX = 'public/data/lxx'


def main():
    if not os.path.isdir(LXX):
        print('run me from the repo root', file=sys.stderr)
        return 1
    moved = 0
    for path in sorted(glob.glob(f'{LXX}/Ps_*.json')):
        doc = json.load(open(path))
        verses = doc['verses']
        n = len(verses)
        strays = [v for v in verses
                  if v['verse'] > n + 3 and TITLE.match(v['text'].strip()) and len(v['text']) < 90]
        if not strays:
            continue
        if any(v['verse'] == 0 for v in verses):
            continue                        # already has a heading; leave well alone
        for v in strays:
            vid = f"{v['bookId']}.{v['chapter']}.0"
            print(f"  {os.path.basename(path):<12} v{v['verse']:<5} -> v0   {v['text'][:44]}")
            v['verse'] = 0
            v['id'] = vid
            v['reference'] = f"{v['reference'].rsplit(':', 1)[0]}:0"
            for i, w in enumerate(v['words'], 1):
                w['position'] = i
                w['id'] = f'{vid}.{i}'
                w['verseId'] = vid
            moved += 1
        verses.sort(key=lambda x: x['verse'])
        with open(path, 'w') as fh:
            json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
    print(f'titles moved to verse 0: {moved}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
