#!/usr/bin/env python3
"""
Repair the reading text itself: split words, apparatus sigla, and letters that are not words.

Everything here is a defect in the upstream word-per-line Swete (nathans/lxx-swete), not in our
conversion — each was confirmed against the source .txt before being touched. Three kinds:

1. WORDS BROKEN IN TWO. A line or page break in the printed edition survived digitisation as two
   tokens: `π ρὸς`, `π ρόσωπον`, `τ οῦ`. We rejoin a lone letter with its neighbour only when the
   joined form is one this corpus and Nestle 1904 already attest at least three times over — πρὸς
   occurs 4,715 times, so the join is not a guess. Tried forwards first, then backwards (`λόγο ς`).

2. THE APPARATUS IN THE TEXT. Latin-script tokens are never Greek scripture: `om` (omittit),
   manuscript sigla (B, D, F, V) and Roman chapter numerals (XIV, XX) leaked out of the margin.
   185 of them. Five verses turn out to hold NOTHING ELSE — their real text never made it into the
   upstream file at all, and the chapter numeral sits in the verse-1 slot:

       Exod 20:1 · Num 17:1 · Num 19:1 · 1Kgs 14:1 · 1Kgs 16:1

   Exodus 20:1 is the sentence that introduces the Ten Commandments, and Rahlfs had it. We drop
   those verses rather than print a Roman numeral as scripture. Absence is how this app already
   says "not in this edition" (Vaticanus omits 1 Sam 17:12-31 the same way), it leaves the English
   visibly orphaned in lxx-diff.py rather than silently blank, and it is the honest record of what
   the source contains. They are listed in docs/provenance.md to be reported upstream.

3. LETTERS THAT ARE NOT WORDS. What remains is a bare capital Α mid-verse and κ abbreviating καί.
   A lone unaccented CAPITAL is Swete's marginal siglum and never scripture — `Γέλωτά Α μοι
   ἐποίησεν κύριος` should read `Γέλωτά μοι ἐποίησεν κύριος` — so it goes the way of the Latin
   sigla. A lone lowercase letter may be a real word abbreviated, so it stays in the text, but its
   parse is cleared: better an unparsed word than a confident wrong one.

4. PUNCTUATION STANDING ON ITS OWN. The word-per-line source sometimes puts a mark on a line of
   its own, so `;` — the Greek question mark — arrives as a word in its own right: Genesis 37:8
   ended `κυριεύσεις ἡμῶν ; καὶ`, with a space before it. 679 of them. They are not words: they
   inflate the word count, they cannot be parsed (nothing to parse), and they print wrongly.
   Each is joined to the word before it, which leaves the text reading exactly as the edition
   punctuates it and removes a token that was never a word.

5. WORDS SET IN DISPLAY CAPITALS. Swete opens a book in unaccented capitals (ΕΝ ΑΡΧΗ) and Stanza
   has never seen Greek written that way, so lxx-fix-capitals.py takes the lexeme from Nestle 1904
   instead. The morphology it guessed for those forms is no better than the lemma was, so it is
   cleared too rather than left contradicting the word it now claims to be.

Word positions, ids and the verse's `text` are rebuilt after any change, since the parsing pane and
the highlight offsets both index into them. Idempotent.
"""
import json, glob, os, sys, collections, unicodedata

LXX, GNT = 'public/data/lxx', 'public/data/na1904'
EDGE = '.,;:·’\'"()[]—-'
MIN_ATTEST = 3


def bare(s): return s.strip(EDGE)


def is_greek_letter(s):
    b = bare(s)
    return len(b) == 1 and b.isalpha() and 0x370 <= ord(b) < 0x400


def is_latin(s):
    b = bare(s)
    letters = [c for c in b if c.isalpha()]
    return bool(letters) and all(ord(c) < 0x250 for c in letters)


def has_diacritic(s):
    return any(unicodedata.category(c) == 'Mn' for c in unicodedata.normalize('NFD', bare(s)))


def attested():
    seen = collections.Counter()
    for path in glob.glob(f'{LXX}/*.json'):
        for v in json.load(open(path))['verses']:
            for w in v['words']:
                if len(bare(w['surface'])) > 1:
                    seen[bare(w['surface'])] += 1
    for path in glob.glob(f'{GNT}/*.json'):
        for verse in json.load(open(path))['v'].values():
            for w in verse:
                seen[bare(w[0])] += 1
    return seen


def main():
    if not os.path.isdir(LXX):
        print('run me from the repo root', file=sys.stderr); return 1
    att = attested()

    joined = dropped = cleared = files = 0
    punct_merged = [0]
    emptied = []
    for path in sorted(glob.glob(f'{LXX}/*.json')):
        doc = json.load(open(path))
        touched = False
        keep_verses = []
        for v in doc['verses']:
            words = v['words']

            # 1. rejoin split words
            out, i = [], 0
            while i < len(words):
                w = words[i]
                if is_greek_letter(w['surface']) and out or is_greek_letter(w['surface']):
                    nxt = words[i + 1] if i + 1 < len(words) else None
                    if nxt and att.get(bare(w['surface']) + bare(nxt['surface']), 0) >= MIN_ATTEST:
                        merged = dict(nxt)
                        merged['surface'] = w['surface'] + nxt['surface']
                        out.append(merged); i += 2; joined += 1; touched = True
                        continue
                    if out and att.get(bare(out[-1]['surface']) + bare(w['surface']), 0) >= MIN_ATTEST:
                        out[-1] = dict(out[-1])
                        out[-1]['surface'] = out[-1]['surface'] + w['surface']
                        i += 1; joined += 1; touched = True
                        continue
                out.append(w); i += 1

            # 2. the apparatus is not scripture — Latin sigla, and a lone unaccented capital
            def siglum(w):
                b = bare(w['surface'])
                return is_latin(w['surface']) or (
                    is_greek_letter(w['surface']) and b.isupper() and not has_diacritic(b))
            kept = [w for w in out if not siglum(w)]
            if len(kept) != len(out):
                dropped += len(out) - len(kept); touched = True
            if not kept:
                emptied.append(v['reference']); touched = True
                continue

            # 4. punctuation is not a word — give it back to the word it belongs to
            merged = []
            for w in kept:
                if not [c for c in w['surface'] if c.isalpha()]:
                    if merged:
                        merged[-1] = dict(merged[-1])
                        merged[-1]['surface'] = merged[-1]['surface'] + w['surface']
                        punct_merged[0] += 1; touched = True
                        continue
                    if len(kept) > 1:          # verse-initial: attach to what follows instead
                        nxt = kept[kept.index(w) + 1]
                        nxt['surface'] = w['surface'] + nxt['surface']
                        punct_merged[0] += 1; touched = True
                        continue
                merged.append(w)
            kept = merged

            # 3./5. do not pretend to have parsed a lone letter, or a word set in capitals
            for w in kept:
                b = bare(w['surface'])
                caps = len(b) > 1 and b.isalpha() and b.isupper() and not has_diacritic(b)
                if caps or (is_greek_letter(w['surface']) and not has_diacritic(b)):
                    if any(w['morph'].get(k) for k in w['morph']):
                        w['morph'] = {k: None for k in w['morph']}
                        cleared += 1; touched = True
                    if is_greek_letter(w['surface']):
                        w['lemma'] = w['strongs'] = None

            if touched:
                for n, w in enumerate(kept, 1):
                    w['position'] = n
                    w['id'] = f"{v['id']}.{n}"
                v['words'] = kept
                v['text'] = ' '.join(w['surface'] for w in kept)
            keep_verses.append(v)

        if touched:
            doc['verses'] = keep_verses
            with open(path, 'w') as fh:
                json.dump(doc, fh, ensure_ascii=False, separators=(',', ':'))
            files += 1

    print(f'files rewritten: {files}')
    print(f'split words rejoined: {joined} · apparatus tokens dropped: {dropped} · sigla unparsed: {cleared}')
    print(f'stray punctuation joined to its word: {punct_merged[0]}')
    print(f'verses dropped as holding nothing but a chapter numeral: {len(emptied)}')
    for r in emptied:
        print(f'   {r}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
