#!/usr/bin/env python3
"""Mark prefixes and suffixes red in the Hebrew grammar tables.

MorphTable renders '»' as a red prefix and '|' as a red ending (see shared.tsx). This script
inserts those markers into the chapter files' paradigm tables so the affixes a chapter teaches
are visible at a glance, the way the Greek pages colour their endings.

The rules are driven by each ROW'S OWN LABEL, never by a blind pattern over the Hebrew: "מ" is
a participle prefix in a participle row and the first root letter of מָלַךְ elsewhere, and only
the row knows which. A form whose label carries no rule is left alone.

Splits fall between BASE LETTERS, carrying each letter's vowel points with it — splitting
before a combining mark breaks the shaping in Safari.

    python3 scripts/mark-hebrew-affixes.py --dry     # show what would change
    python3 scripts/mark-hebrew-affixes.py           # apply
"""
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / 'src' / 'components' / 'morphology' / 'hebrew'

LETTER = re.compile(r'[א-ת]')
MARK = re.compile(r'[֑-ׇ]')


def units(word):
    """Split into (base letter + its combining marks) units."""
    out = []
    for ch in word:
        if LETTER.match(ch) or not out:
            out.append(ch)
        else:
            out[-1] += ch
    return out


def bare(u):
    """The unit's letter and vowel, accents stripped — for matching."""
    return ''.join(c for c in u if not re.match(r'[֑-ֽ֯]', c))


# ── affix inventories ───────────────────────────────────────────────────────────────────
# Written CONSONANTALLY. A Hebrew vowel belongs to the consonant BEFORE it, so the ־ִים
# plural is marked from the yod (סוּסִ|ים): the hireq stays with the root letter it sits
# under. Splitting before a vowel point would also break the shaping in Safari.
IMPF_PREFIX = ['י', 'ת', 'א', 'נ']
STEM_PREFIX = ['הת', 'מת', 'ה', 'נ', 'מ']
WAW = ['ו']

PERF_SUFFIX = ['תי', 'ת', 'תם', 'תן', 'נו', 'נה', 'ו', 'ה']
IMPF_SUFFIX = ['נה', 'ו', 'י']
NOUN_SUFFIX = ['ים', 'ות', 'ים', 'יִם', 'ה', 'ת']
PRON_SUFFIX = ['הם', 'הן', 'כם', 'כן', 'נו', 'הו', 'יו', 'הּ', 'י', 'ך', 'ו', 'ה', 'ם', 'ן']

LETTERS_ONLY = re.compile(r'[^א-ת]')


def consonants(word):
    """The word's base letters, in order, with their index in the original string."""
    return [(i, c) for i, c in enumerate(word) if LETTER.match(c)]


def prefix_len(word, cands):
    """Characters at the start that form one of the candidate prefixes — the split lands on
    the next BASE LETTER, so the prefix keeps its own vowel and the root keeps its."""
    cons = consonants(word)
    best = 0
    for c in cands:
        n = len(c)
        if len(cons) <= n + 1:            # never leave fewer than two root letters
            continue
        if ''.join(x[1] for x in cons[:n]) == c:
            best = max(best, cons[n][0])  # split index = start of the next letter
    return best


def suffix_start(word, cands):
    """Index where a candidate ending begins (on a base letter), or 0 for none."""
    cons = consonants(word)
    best = 0
    for c in cands:
        n = len(c)
        if len(cons) <= n + 1:
            continue
        if ''.join(x[1] for x in cons[-n:]) == c:
            idx = cons[-n][0]
            # Longest ending wins: ־נוּ is the suffix in סוּסֵנוּ, not the ־וּ inside it,
            # so prefer the EARLIEST split among the candidates that match.
            if best == 0 or idx < best:
                best = idx
    return best


def mark(form, pre_cands=None, suf_cands=None):
    """Insert » after the prefix and | before the ending."""
    if '»' in form or '|' in form:
        return form                       # already marked by hand — leave it
    if len(consonants(form)) < 3:
        return form
    p = prefix_len(form, pre_cands) if pre_cands else 0
    s_at = suffix_start(form, suf_cands) if suf_cands else 0
    if s_at and p and s_at <= p:
        return form
    out = form
    if s_at:
        out = out[:s_at] + '|' + out[s_at:]
    if p:
        out = out[:p] + '»' + out[p:]
    return out


# ── what each row label licenses ────────────────────────────────────────────────────────
def rules_for(label):
    """(prefix candidates, suffix candidates) for a row with this label, or (None, None)."""
    l = label.lower()
    if 'imperfect' in l or 'jussive' in l or 'cohortative' in l:
        pre = WAW + IMPF_PREFIX if 'sequential' in l or 'wayyiqtol' in l else IMPF_PREFIX
        return pre, IMPF_SUFFIX
    if 'perfect' in l or 'qatal' in l:
        pre = WAW + STEM_PREFIX if 'sequential' in l or 'weqatal' in l else STEM_PREFIX
        return pre, PERF_SUFFIX
    if 'participle' in l:
        return ['מת', 'מ', 'נ'], NOUN_SUFFIX
    if 'imperative' in l:
        return ['הת', 'ה'], IMPF_SUFFIX
    if 'infinitive' in l:
        return ['ל', 'הת', 'ה', 'ב', 'כ'], PRON_SUFFIX
    if 'plural' in l or 'dual' in l:
        return None, NOUN_SUFFIX
    if re.search(r'\b[123][cmf][sp]\b', l) or 'suffix' in l:
        return None, PRON_SUFFIX
    return None, None


ROW_RX = re.compile(r"^(\s*)\[(.+)\],\s*$")


def process(path, dry):
    src = path.read_text()
    out_lines, changed = [], []
    # hCols tells us which columns hold Hebrew; without it we do not touch the table.
    hcols = None
    for line in src.split('\n'):
        mh = re.search(r'hCols=\{\[([\d,\s]*)\]\}', line)
        if mh:
            hcols = [int(x) for x in mh.group(1).replace(' ', '').split(',') if x != '']
        m = ROW_RX.match(line)
        if not m or hcols is None:
            out_lines.append(line)
            continue
        cells = re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(2))
        if not cells:
            out_lines.append(line)
            continue
        label = ' '.join(c for i, c in enumerate(cells) if i not in hcols)
        if len(label) > 40:              # a sentence, not a paradigm label
            out_lines.append(line)
            continue
        pre, suf = rules_for(label)
        if pre is None and suf is None:
            out_lines.append(line)
            continue
        new_line = line
        for i in hcols:
            if i >= len(cells):
                continue
            cell = cells[i]
            if not LETTER.search(cell):
                continue
            # a cell may hold several forms plus prose; mark only bare Hebrew words
            def repl(mm):
                return mark(mm.group(0), pre, suf)
            # Single Hebrew words only: a prose cell ("זָכוֹר אֶת־יוֹם הַשַּׁבָּת") is an
            # illustration, not a paradigm slot, and marking inside it teaches nothing.
            if re.search(r'[\s־·]', cell.strip()):
                continue
            marked = re.sub(r'[א-ת][֑-ׇא-ת]*', repl, cell)
            if marked != cell:
                new_line = new_line.replace(f"'{cell}'", f"'{marked}'", 1)
                changed.append((label.strip(), cell, marked))
        out_lines.append(new_line)
    if changed and not dry:
        path.write_text('\n'.join(out_lines))
    return changed


def main():
    dry = '--dry' in sys.argv
    total = 0
    for f in sorted(BASE.glob('*.tsx')):
        if f.name == 'HebrewGrammarView.tsx':
            continue
        ch = process(f, dry)
        if ch:
            print(f'\n── {f.name} ({len(ch)})')
            for label, before, after in ch[:40]:
                print(f'   {label[:26]:28s} {before}   →   {after}')
            total += len(ch)
    print(f'\n{total} cells {"would be" if dry else ""} marked')


if __name__ == '__main__':
    main()
