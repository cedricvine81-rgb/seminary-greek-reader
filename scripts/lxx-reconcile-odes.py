#!/usr/bin/env python3
"""
Put the Odes back under the numbers the rest of the app uses. Run with the Swete source directory.

WHY. The Odes are a liturgical appendix, and editions number them differently — our normaliser said
so and left them alone. What that missed is that leaving them alone is not neutral: the English
(Brenton) and the Spanish are both keyed to the numbering the Rahlfs data used, so a straight swap
files Jonah's prayer as Ode 5 where the translation beneath it is Habakkuk's, and so on through the
book. Nothing looks broken. Every chapter is simply the wrong canticle.

The mapping below was not guessed. Each Swete ode was matched to the old data by word overlap over
its opening verses — every pairing came out above 0.58 with the runner-up below 0.11 — and the four
that overlap could not settle were read directly: Swete's iva is ᾨδὴ Ἠσαίου and ivb Προσευχὴ Ἠσαίου,
which are Odes 10 and 5; Swete 14 is the Ὕμνος ἑωθινός, which is Ode 14.

  Swete   1  2  3  6 ivb  5  9 10 11 iva  7  8 12 14
  ours    1  2  3  4   5  6  7  8  9  10 11 12 13 14

TWO ODES WERE MISSING ALTOGETHER. iva and ivb are labelled with Roman numerals, so int() could not
read them and the normaliser dropped both — 442 words, including the whole Song of Isaiah. They are
ingested and tagged here, which is why this script needs the source.

THE BENEDICTUS. Swete gives the Magnificat and the Benedictus as separate odes (11 and 13); Rahlfs
holds both inside Ode 9 under Luke's own verse numbers, which is what the English expects. So Swete
13 is folded into Ode 9. Its heading has nowhere to go — Rahlfs keeps one title, at verse 0 — so it
is parked at verse 67, immediately before the canticle it introduces, rather than being thrown away.

TITLES. Swete carries each ode's heading as an ordinary verse with whatever number came to hand
(the Magnificat's title is verse 88), or runs it into the first verse behind the edition's own label
for the ode ("Δ΄ (β) Προσευχὴ Ἠσαίοι. Ἐκ νυκτὸς ὀρθρίζει…"). Rahlfs puts headings at verse 0 and
begins the text at verse 9, and so do we: the label is dropped, the heading moves to verse 0, and
what follows stays where it was.

REBUILDS THE WHOLE BOOK FROM SOURCE, not from what is already on disk, so it can be rerun and lands
in the same place every time. Run it BEFORE the repair scripts (resolve-strongs, fix-homographs,
fix-capitals, repair-tokens, fix-homoglyphs); those are corpus-wide and idempotent, and will pick
these files up on their next pass.
"""
import json, os, re, sys, collections, unicodedata, importlib.util, warnings
warnings.filterwarnings('ignore')

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{REPO}/public/data/lxx'
# ΙΙροσευχή with two iotas is the scanner's Π; this runs before lxx-fix-homoglyphs.py mends it,
# so the heading has to be recognisable in both spellings or the Magnificat's title never moves.
TITLE = re.compile(r'^(Προσευχ|ΙΙροσευχ|Πρoσευχ|ᾨδ|Ὠδ|ᾠδ|Ὕμνος|Ψαλμ)')

MAP = {'1': 1, '2': 2, '3': 3, 'iva': 10, 'ivb': 5, '5': 6, '6': 4, '7': 11,
       '8': 12, '9': 7, '10': 8, '11': 9, '12': 13, '13': 9, '14': 14}
BENEDICTUS_TITLE = 67


def is_title(text):
    return bool(TITLE.match(text.strip())) and len(text.split()) <= 5


LABEL = re.compile(r'^[Α-Ω]΄\s*(\([αβγδ]\))?\s*')


def read_source(src):
    """Every ode, straight from the word-per-line file, keyed by Swete's own label."""
    out = collections.defaultdict(lambda: collections.defaultdict(list))
    with open(f'{src}/28.Odae.txt') as fh:
        for line in fh:
            parts = line.split(None, 1)
            if len(parts) != 2:
                continue
            ref = parts[0].split('.')
            if len(ref) == 3:
                out[ref[1]][int(ref[2])].append(parts[1].strip())
    return out


def split_title(words):
    """A heading run into the front of a verse: returns (heading words, the rest)."""
    text = ' '.join(words)
    stripped = LABEL.sub('', text)
    dropped = len(text.split()) - len(stripped.split())
    rest = words[dropped:]
    if not rest or not TITLE.match(' '.join(rest)):
        return [], words[dropped:] if dropped else words
    for i, w in enumerate(rest):
        if w.endswith('.') or w.endswith('·'):
            if i + 1 < len(rest) and i < 4:
                return rest[:i + 1], rest[i + 1:]
            break
    return [], rest


def main():
    if len(sys.argv) < 2:
        print('usage: lxx-reconcile-odes.py <swete-source-dir>', file=sys.stderr)
        return 1
    src = sys.argv[1]

    held = {}
    raw = read_source(src)
    if not raw:
        print(f'no odes found in {src}/28.Odae.txt', file=sys.stderr)
        return 1

    import stanza
    spec = importlib.util.spec_from_file_location('tag', f'{REPO}/scripts/lxx-tag-swete.py')
    print('loading the tagger…', flush=True)
    tag = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tag)
    nlp = stanza.Pipeline('grc', processors='tokenize,pos,lemma',
                          tokenize_pretokenized=True, verbose=False)

    for label, verses in raw.items():
        built = []
        for vnum in sorted(verses):
            head, body = split_title(verses[vnum])
            if head:
                built.append({'verse': 0, 'text': ' '.join(head),
                              'words': [{'surface': w} for w in head]})
            built.append({'verse': vnum, 'text': ' '.join(body),
                          'words': [{'surface': w} for w in body]})
        doc = nlp([[tag.clean(w['surface']) for w in v['words']] for v in built])
        for verse, sent in zip(built, doc.sentences):
            for w, sw in zip(verse['words'], sent.words):
                lemma = sw.lemma or w['surface']
                w.update({'lemma': lemma, 'strongs': tag.strongs_for(lemma),
                          'morph': tag.to_morph(sw.upos, sw.feats),
                          'data_origin': 'machine_generated'})
        held[label] = built
        print(f'  tagged {label}: {len(built)} verses, {sum(len(v["words"]) for v in built)} words')

    # Regroup under our numbering.
    chapters = collections.defaultdict(list)
    for label, verses in held.items():
        target = MAP.get(label)
        if target is None:
            print(f'  ! no mapping for Swete ode {label} — left out', file=sys.stderr)
            continue
        for v in verses:
            num = v['verse']
            if is_title(v['text']):
                num = BENEDICTUS_TITLE if label == '13' else 0
            chapters[target].append((num, v))

    written = 0
    for ch, entries in sorted(chapters.items()):
        entries.sort(key=lambda e: e[0])
        verses = []
        for num, v in entries:
            vid = f'Odes.{ch}.{num}'
            words = []
            for i, w in enumerate(v['words'], 1):
                w = dict(w)
                w.update({'position': i, 'id': f'{vid}.{i}', 'verseId': vid})
                words.append(w)
            verses.append({'id': vid, 'bookId': 'Odes', 'chapter': ch, 'verse': num,
                           'reference': f'Odes {ch}:{num}',
                           'text': ' '.join(w['surface'] for w in words), 'words': words})
        with open(f'{OUT}/Odes_{ch}.json', 'w') as fh:
            json.dump({'book': 'Odes', 'chapter': ch, 'verses': verses}, fh,
                      ensure_ascii=False, separators=(',', ':'))
        written += 1
        print(f'  Odes {ch:>2}: {len(verses):>3} verses  {verses[0]["text"][:46]}')
    print(f'{written} chapters written')
    return 0


if __name__ == '__main__':
    sys.exit(main())
