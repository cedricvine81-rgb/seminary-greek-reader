#!/usr/bin/env python3
"""
Mend Greek words that upstream OCR spelled with Latin letters.

Roman and Greek capitals share shapes, and the scan of Swete resolved some of them the wrong way.
The result is words that look perfectly correct on screen and match nothing at all:

    ΙΙροσευχή  two iotas for a Π   — and the ode heading it names stops being a heading
    Aἴγυπτον   with a Latin A      — invisible to any search for Αἴγυπτον
    Kύριος     with a Latin K
    κόκκιvov   with Latin v for ν, twice
    ’Iωναθὰν   an apostrophe and a Latin I stand in for Ἰ, the breathing mark having become a quote

This is the silent kind of corruption: nothing renders oddly, the word simply drops out of search
results, out of lexeme counts, out of the Allusions tab's rarity weighting. It cannot be found by
reading the text — only by asking which tokens mix two alphabets.

WHAT IT WILL AND WILL NOT DO. Each candidate is repaired only if the mended spelling is a form this
corpus or Nestle 1904 already attests at least three times. That is what keeps a plausible-looking
substitution from inventing a word: Αἴγυπτον is attested hundreds of times, so the mend is a
recognition, not a guess.

That test fails for the rare proper names — Νετωφαθεί, Βουκείας — which is where most of the damage
actually is, since a name that occurs once can never be attested. For those we lean on structure
instead of frequency: a word cannot begin with a Roman capital and continue in Greek, so where the
ONLY Latin character is the initial capital and it has a Greek twin, the twin is the reading. That
argument holds regardless of how rare the name is, and it touches nothing inside the word.

A third pattern is the apparatus again, this time fused to the word beside it rather than standing
alone: XXἸωανθὰν, VIἔτει, (10b)καὶ, and a lone siglum run into the next word (Kκαὶ). Where a token
begins with a Roman numeral, a bracketed number, or a single capital, and what follows is a Greek
word we already attest, the prefix is margin furniture and comes off.

Anything still mixing alphabets after every pass is left exactly as found and reported at the end,
so what remains broken stays visible instead of being quietly half-fixed.

Surfaces only — lemma, Strong's and morphology are left to the tagging scripts. Idempotent.
"""
import json, glob, os, sys, collections

LXX, GNT = 'public/data/lxx', 'public/data/na1904'
EDGE = '.,;:·’\'"()[]—-‘'
MIN_ATTEST = 3

TWIN = str.maketrans({'A': 'Α', 'B': 'Β', 'E': 'Ε', 'H': 'Η', 'I': 'Ι', 'K': 'Κ', 'M': 'Μ',
                      'N': 'Ν', 'O': 'Ο', 'P': 'Ρ', 'T': 'Τ', 'X': 'Χ', 'Y': 'Υ', 'Z': 'Ζ',
                      'a': 'α', 'o': 'ο', 'e': 'ε', 'v': 'ν', 'p': 'ρ', 'y': 'υ', 'x': 'χ',
                      'k': 'κ', 't': 'τ', 'i': 'ι', 'u': 'υ', 'c': 'ς', 'l': 'ι', 'h': 'η'})
# A breathing mark that came back from the scanner as a quotation mark.
BREATHING = {'’': {'A': 'Ἀ', 'E': 'Ἐ', 'H': 'Ἠ', 'I': 'Ἰ', 'l': 'Ἰ', 'O': 'Ὀ', 'Y': 'Υ̓', 'Ω': 'Ὠ'},
             '‘': {'A': 'Ἁ', 'E': 'Ἑ', 'H': 'Ἡ', 'I': 'Ἱ', 'l': 'Ἱ', 'O': 'Ὁ', 'Y': 'Ὑ',
                   'P': 'Ῥ', 'Ω': 'Ὡ'}}


TWIN_CAPS = {chr(k): v for k, v in TWIN.items() if chr(k).isupper()}


def fused(s):
    """A Greek word with a capital or numeral welded to its front."""
    b = s.strip(EDGE)
    return len(b) > 1 and b[0].isupper() and any(
        c.isalpha() and 0x370 <= ord(c) < 0x400 for c in b[1:])


def mixed(s):
    return (any(c.isalpha() and ord(c) < 0x250 for c in s)
            and any(c.isalpha() and 0x370 <= ord(c) < 0x400 for c in s))


def candidates(s):
    """Spellings to try, most conservative first."""
    out = []
    # The scanner sometimes read Π as two iotas — ΙΙροσευχή, IΙαντοκράτορι.
    if 'ΙΙ' in s or 'IΙ' in s or 'ΙI' in s:
        for pair in ('ΙΙ', 'IΙ', 'ΙI'):
            if pair in s:
                out.append(s.replace(pair, 'Π'))
    for quote, table in BREATHING.items():
        if s.startswith(quote) and len(s) > 1 and s[1] in table:
            rest = s[2:]
            out.append(table[s[1]] + rest)
            out.append(table[s[1]] + rest.translate(TWIN))
    out.append(s.translate(TWIN))
    return out


ROMAN = set('IVXLCDM')


def first_letter(s):
    import unicodedata as u
    for c in u.normalize('NFD', s):
        if c.isalpha():
            return c.lower()
    return ''



def strip_prefix(s, att):
    """Chapter numerals and sigla that ran into the word beside them."""
    if att.get(s.strip(EDGE), 0) >= MIN_ATTEST:
        return None
    for i in range(1, len(s)):
        head, rest = s[:i], s[i:]
        if not rest or not rest[0].isalpha():
            continue
        numeral = all(c in ROMAN for c in head)
        bracket = head.startswith('(') and head.endswith(')')
        # A lone capital only counts as furniture when it is Roman, or when it simply repeats
        # the letter the word already starts with (Kκαὶ). Never strip a capital that opens a
        # perfectly good word: Ῥὼς is a name, not a siglum plus ὼς.
        siglum = (len(head) == 1 and head.isalpha() and head.isupper()
                  and (ord(head) < 0x250 or head.lower() == first_letter(rest)))
        if not (numeral or bracket or siglum):
            continue
        if att.get(rest.strip(EDGE), 0) >= MIN_ATTEST:
            return rest
    return None


def initial_capital(s):
    """A Roman capital opening an otherwise wholly Greek word can only be its Greek twin."""
    body = s.lstrip('‘’\'"(')
    lead = len(s) - len(body)
    if not body or body[0] not in TWIN_CAPS:
        return None
    rest = body[1:]
    if any(c.isalpha() and ord(c) < 0x250 for c in rest):
        return None
    if not any(c.isalpha() and 0x370 <= ord(c) < 0x400 for c in rest):
        return None
    return s[:lead] + TWIN_CAPS[body[0]] + rest


def attested():
    seen = collections.Counter()
    for path in glob.glob(f'{LXX}/*.json'):
        for v in json.load(open(path))['verses']:
            for w in v['words']:
                seen[w['surface'].strip(EDGE)] += 1
    for path in glob.glob(f'{GNT}/*.json'):
        for verse in json.load(open(path))['v'].values():
            for w in verse:
                seen[w[0].strip(EDGE)] += 1
    return seen


def main():
    if not os.path.isdir(LXX):
        print('run me from the repo root', file=sys.stderr); return 1
    att = attested()

    fixed = files = 0
    made = collections.Counter()
    left = collections.Counter()
    for path in sorted(glob.glob(f'{LXX}/*.json')):
        doc = json.load(open(path))
        touched = False
        for v in doc['verses']:
            for w in v['words']:
                # Π read as two iotas leaves a token that is entirely Greek, so it has to be
                # looked for on its own rather than among the mixed-alphabet ones.
                if any(p in w['surface'] for p in ('ΙΙ', 'IΙ', 'ΙI')):
                    for cand in candidates(w['surface']):
                        if att.get(cand.strip(EDGE), 0) >= MIN_ATTEST:
                            made[(w['surface'], cand)] += 1
                            w['surface'] = cand
                            fixed += 1; touched = True
                            break
                if not mixed(w['surface']):
                    cand = strip_prefix(w['surface'], att) if fused(w['surface']) else None
                    if cand:
                        made[(w['surface'], cand)] += 1
                        w['surface'] = cand
                        fixed += 1; touched = True
                    continue
                cand = strip_prefix(w['surface'], att)
                if cand:
                    made[(w['surface'], cand)] += 1
                    w['surface'] = cand
                    fixed += 1; touched = True
                    if not mixed(w['surface']):
                        continue
                for cand in candidates(w['surface']):
                    if att.get(cand.strip(EDGE), 0) >= MIN_ATTEST:
                        made[(w['surface'], cand)] += 1
                        w['surface'] = cand
                        fixed += 1; touched = True
                        break
                else:
                    cand = initial_capital(w['surface'])
                    if cand:
                        made[(w['surface'], cand)] += 1
                        w['surface'] = cand
                        fixed += 1; touched = True
                    else:
                        left[w['surface']] += 1
            if touched:
                v['text'] = ' '.join(w['surface'] for w in v['words'])
        if touched:
            with open(path, 'w') as fh:
                json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
            files += 1

    print(f'words mended: {fixed} across {files} files')
    for (was, now), n in made.most_common(12):
        print(f'  {was:>16} -> {now:<16} {n}')
    print(f'\nstill mixing two alphabets, no attested spelling: {sum(left.values())} '
          f'({len(left)} distinct)')
    for s, n in left.most_common(15):
        print(f'  {s} ×{n}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
