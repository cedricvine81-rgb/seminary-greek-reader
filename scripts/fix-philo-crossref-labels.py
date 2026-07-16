#!/usr/bin/env python3
"""Fix malformed Philo cross-reference labels in public/data/backgrounds-crossrefs.json.

A citation-splitting bug left a stray leading work name concatenated onto some Philo
citations, e.g. "Philo, Confusion Flight 97, 101" (should be "Philo, Flight 97, 101") or
"Philo, Decalogue Spec. Laws 2.63" (should be "Philo, Spec. Laws 2.63"). The stray prefix
both mislabels the citation and stops matchProseCitation (src/lib/prose-texts.ts) from
resolving it to the embedded Philo text, so it fell through to an external link.

This rewrites "Philo, <strayWork> <realWork> <ref>" -> "Philo, <realWork> <ref>" only when
the leading word is a known single-word Philo abbrev AND the remainder is itself a valid
Philo citation. Idempotent — already-valid citations are left untouched. Keep the abbrev list
in sync with the PHILO table in src/lib/prose-texts.ts.
"""
import json
import re
from pathlib import Path

CROSSREFS = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'backgrounds-crossrefs.json'

# Citation abbreviations, mirroring src/lib/prose-texts.ts (the `abbrevs` of each PHILO entry).
ABBREVS = [
    'Creation', 'Alleg. Interp.', 'Cherubim', 'Sacrifices', 'Worse', 'Posterity', 'Giants',
    'Unchangeableness', 'Deus', 'Husbandry', 'Planter', 'Drunkenness', 'Sobriety', 'Confusion',
    'Migration', 'Heir', 'Congress', 'Preliminary Studies', 'Flight', 'Change of Names', 'Names',
    'Dreams', 'On the Life of Abraham', 'Abraham', 'Joseph', 'Moses', 'Decalogue', 'Spec. Laws',
    'Special Laws', 'Virtues', 'Rewards', 'Good Person', 'Contemplative', 'Eternity', 'Flaccus',
    'Hypothetica', 'Providence', 'Embassy', 'QG', 'On the World',
]
_BY_LEN = sorted(ABBREVS, key=len, reverse=True)
_SINGLE = {a for a in ABBREVS if ' ' not in a}


def valid(tail: str) -> bool:
    """True when `tail` starts with a work abbrev immediately followed by a section number —
    the same shape philoCite() accepts."""
    for ab in _BY_LEN:
        # Allow a stray comma between the work name and its section number ("Sobriety, 55–56").
        if tail.startswith(ab) and re.match(r'[,\s]+[\d§]', tail[len(ab):]):
            return True
    return False


def fixed(text: str) -> str | None:
    m = re.match(r'^Philo,?\s+(.+)$', text)
    if not m:
        return None
    tail = m.group(1).strip()
    if valid(tail):
        return None  # already resolves — leave it
    first, _, rest = tail.partition(' ')
    if first in _SINGLE and rest and valid(rest):
        return f'Philo, {rest}'
    return None


def main() -> None:
    data = json.loads(CROSSREFS.read_text(encoding='utf-8'))
    changes = []
    for e in data.get('entries', []):
        for c in e.get('citations', []):
            t = c.get('text', '')
            nt = fixed(t)
            if nt and nt != t:
                changes.append((t, nt))
                c['text'] = nt
    if changes:
        CROSSREFS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'fixed {len(changes)} Philo citation label(s):')
    for a, b in changes:
        print(f'  {a!r} -> {b!r}')


if __name__ == '__main__':
    main()
