"""Repair the mojibake in 2 Enoch.

WHAT WAS WRONG
Seventy-six characters in the reading text had been destroyed by a decoding error somewhere
upstream of us — UTF-8 bytes read as latin-1, leaving the three-character sequence that
renders as a black diamond. Students saw "the Lord ?s face" and "the sun?s heat" throughout.
2 Enoch was the only file in the library affected; everything else scanned clean.

WHY THE LOST CHARACTERS CAN BE RESTORED
The original byte is genuinely gone, so this cannot be undone by re-decoding — the character
has to be inferred. That is safe here only because the distribution is so lopsided: 75 of the
76 sit immediately before an "s" in a possessive ("the Lord ?s servants", "the crocodile?s
head"), which can only be an apostrophe. The single exception is 33:10, checked against an
independent copy of Morfill's text, which prints an en dash:

    "the books of your handwriting-children to children, generation to generation"

Also fixed, being the same fault half-corrected: two possessives that had already lost the
character and kept the space, so they read "the Lord 's face".

Usage:  python3 scripts/fix-2enoch-encoding.py       (from the repo root)
"""
import json
import re
from pathlib import Path

OUT = Path('public/data/pseudepigrapha/2enoch.json')
BAD = 'ï¿½'

# 33:10 — an en dash, not a possessive. Keyed on its context so it cannot fire anywhere else.
DASH_CONTEXT = 'handwriting'


def repair(t):
    n_dash = n_poss = n_space = 0
    if DASH_CONTEXT + BAD in t:
        t = t.replace(DASH_CONTEXT + BAD, DASH_CONTEXT + '–')
        n_dash = 1
    # Consume a space before the apostrophe where the print had one, so "the Lord ?s"
    # becomes "the Lord's" and not "the Lord 's".
    t, k = re.subn(r' ?' + re.escape(BAD) + r'(?=s)', "'", t)
    n_poss = k
    # The same fault, already half-corrected upstream: "the Lord 's face".
    t, k = re.subn(r"(?<=[a-zA-Z]) '(?=s\b)", "'", t)
    n_space = k
    return t, n_dash, n_poss, n_space


def main():
    doc = json.loads(OUT.read_text(encoding='utf-8'))
    tot = [0, 0, 0]
    for c in doc['chapters']:
        for v in c['verses']:
            v['text'], a, b, d = repair(v['text'])
            tot[0] += a; tot[1] += b; tot[2] += d

    blob = json.dumps(doc, ensure_ascii=False)
    if BAD in blob:
        raise SystemExit(f'refusing to write: {blob.count(BAD)} damaged characters remain')
    OUT.write_text(blob, encoding='utf-8')

    print(f'repaired {sum(tot)} characters: {tot[1]} possessive apostrophes, '
          f'{tot[0]} en dash, {tot[2]} stray-space possessives')
    for ch, vn in ((22, 1), (33, 10), (37, 1), (44, 2)):
        c = next(x for x in doc['chapters'] if x['number'] == ch)
        v = next((x for x in c['verses'] if x['number'] == vn), None)
        if v:
            print(f'  {ch}:{vn}  {v["text"][:96]}')


if __name__ == '__main__':
    main()
