"""Correct citations in the Backgrounds apparatus that name the wrong work.

WHAT WAS WRONG
Fourteen cross-references pointed at chapters that do not exist in any edition — "T. Gad
91:15" when the Testament of Gad has eight chapters, "T. Benj. 51:1" when Benjamin has
twelve. These are not numbering-convention mismatches; the chapter is simply out of range,
so the reference could never resolve and the link was dead.

HOW THEY WERE DIAGNOSED
Each entry lists several citations together, and in every case corrected here the wrong work
name is one already appearing beside it in the same entry — the name was carried over from a
neighbour while the chapter and verse stayed right. That gives an independent check: the
proposed target has to exist AND has to say what the surrounding citations are about. Every
correction below was verified on both counts before being made. The ones that failed either
test were left alone, and are listed at the bottom.

Only the citation text is touched. No note, entry or verse association is changed.

Usage:  python3 scripts/fix-crossref-citations.py [--dry-run]     (from the repo root)
"""
import json
import sys
from pathlib import Path

OUT = Path('public/data/backgrounds-crossrefs.json')

# (as printed) -> (corrected, why)
FIXES = {
    'Plato, Phaedo 233E': ('Plato, Phaedr. 233E',
        'Phaedo runs to Stephanus 118, so 233E cannot be in it; of the dialogues we hold '
        'only Phaedrus spans 233. Phaedrus 233e closes Lysias\'s speech by urging that a '
        'feast be given not to the well-off but to those in need — which is what its two '
        'companion citations here are about (Tob 2:2, Dio Chrysostom Disc. 7.88).'),
    'Plato, Gorg. 313C': ('Plato, Prot. 313C',
        'Gorgias begins at Stephanus 447; 313C falls only within Protagoras (309-362).'),
    'T. Gad 91:15': ('1 En. 91:15',
        'T. Gad has 8 chapters. 1 En. 91:15 is the great judgement executed among the '
        'angels, and it sits beside 1 En. 10:4-5, 11-14 (the binding of Azazel), '
        'L.A.E. 12:2 and Hesiod Theog. 717 (Tartarus).'),
    'T. Gad 12:4': ('1 En. 12:4',
        'T. Gad has 8 chapters. 1 En. 12:4 sends Enoch to "declare to the Watchers", and '
        'the entry already cites 1 En. 10:6, 12 and 2 En. 7:1 on the Watchers.'),
    'T. Gad 22:11': ('1 En. 22:11',
        'T. Gad has 8 chapters. 1 En. 22:11 is the place where spirits are held "till the '
        'great day of judgement", matching the same Watchers-and-punishment entry.'),
    'T. Benj. 51:1': ('2 Bar. 51:1',
        'T. Benjamin has 12 chapters. The entry already cites 2 Bar. 49:3, which asks '
        'whether the dead "resume this form of the present"; 2 Bar. 51:1 is its answer, '
        'that the aspect of the condemned "shall be changed". They are the standard pair '
        'on the resurrection body.'),
}

# Where the correct citation is ALREADY present in the same entry, the broken one is a
# duplicate under a wrong name and is dropped rather than rewritten.
DROP_IF_SIBLING = {'Jub. 69:27': '1 En. 69:27'}

# Left alone deliberately — the target could not be established with enough confidence:
#   T. Levi 65:8, 11   the entry is about the righteous shining (Dan 12:3, 4 Ezra 7:97),
#                      but no candidate work has a 65:8/65:11 that fits.
#   Jub. 51:3          Jubilees has 50 chapters; the inheritance theme fits several works.
#   Sib. Or. 636-637   a line number with no book number; book 3 is likeliest but a guess.
#   2 En. 70:16, 70:23 not an error: Andersen's long recension runs to 73 chapters, ours is
#                      Morfill's 68. A numbering mismatch between editions, not a bad cite.
#   Aristotle, Rhet. 1371B   a real Bekker page, but our Rhetoric is addressed by its three
#                      books, so no page-level target exists to point at.


def main():
    dry = '--dry-run' in sys.argv
    doc = json.loads(OUT.read_text(encoding='utf-8'))

    changed, dropped, missing = [], [], set(FIXES)
    for e in doc['entries']:
        cites = e.get('citations') or []
        present = {c.get('text', '') for c in cites}
        keep = []
        for c in cites:
            t = c.get('text', '')
            if t in DROP_IF_SIBLING and DROP_IF_SIBLING[t] in present:
                dropped.append(t)
                continue
            if t in FIXES:
                c['text'] = FIXES[t][0]
                changed.append((t, FIXES[t][0]))
                missing.discard(t)
            keep.append(c)
        if len(keep) != len(cites):
            e['citations'] = keep

    if missing:
        raise SystemExit(f'refusing to write: these citations were not found, so the '
                         f'dataset is not what this script was written against: {sorted(missing)}')

    if not dry:
        OUT.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print(f'{"would correct" if dry else "corrected"} {len(changed)} citations, '
          f'dropped {len(dropped)} duplicate')
    for a, b in sorted(set(changed)):
        print(f'  {a:<22} -> {b}')
    for t in sorted(set(dropped)):
        print(f'  {t:<22} -> dropped (duplicate of {DROP_IF_SIBLING[t]})')


if __name__ == '__main__':
    main()
