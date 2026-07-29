"""Close up the space before commas and other punctuation across the Texts library.

WHAT WAS WRONG
3,123 places in 74 works read "an expedition against Egypt , taking with him" or "the letter
Iota , which begins His name". The space is a scar left by markup removal: where a source
wrapped a word in an element that ended before the punctuation — Perseus's <name> gazetteer
tags, italics, a footnote anchor — the tag-stripper replaced the tag with a space and left it
sitting in front of the comma. Hence the giveaway that most of them follow a proper noun.

WHY THIS IS SAFE
It changes spacing, not text: no word, punctuation mark or order is altered, only the gap
between them is closed. English typography has no case for a space before , ; : ! ? — and
the pattern here requires a letter, quote or bracket immediately before the gap, so ellipses
("and so . . . , then") cannot match.

SCOPE
English reading text only. The `greek` fields are left alone: Greek punctuation has its own
conventions (the ano teleia, ";" as a question mark) and any fix there should be judged
separately rather than swept up in this one.

Usage:  python3 scripts/fix-space-before-punctuation.py [--dry-run]    (from the repo root)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path('public/data')
SKIP = ('morph', 'variants', 'crossref', 'search')
GAP = re.compile(r'([A-Za-z0-9\)\]"\'’])[ \t]+([,;:!?])')


def main():
    dry = '--dry-run' in sys.argv
    total, touched = 0, []

    for f in sorted(ROOT.rglob('*.json')):
        if any(s in str(f) for s in SKIP):
            continue
        try:
            doc = json.loads(f.read_text(encoding='utf-8'))
        except Exception:
            continue
        if not isinstance(doc, dict) or 'chapters' not in doc:
            continue

        n = 0
        for c in doc['chapters']:
            for v in c.get('verses', []):
                t = v.get('text')
                if not t:
                    continue
                fixed, k = GAP.subn(r'\1\2', t)
                if k:
                    v['text'] = fixed
                    n += k
        if n:
            total += n
            touched.append((n, str(f.relative_to(ROOT))))
            if not dry:
                f.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    touched.sort(reverse=True)
    print(f'{"would fix" if dry else "fixed"} {total} occurrences in {len(touched)} works')
    for n, name in touched[:12]:
        print(f'  {n:>5}  {name}')
    if len(touched) > 12:
        print(f'  … and {len(touched) - 12} more')


if __name__ == '__main__':
    main()
