#!/usr/bin/env python3
"""Build the OLD TESTAMENT Rhetoric datasets from Bullinger's *Figures of Speech Used in
the Bible* (1898) — the public-domain scan on archive.org.

The NT sibling (build-rhetoric-bullinger.py) reads a modernised EPUB with Arabic
chapter:verse references. This one reads the 1898 first edition as scanned, where the
citation style is Roman-numeral chapters ("Ps. cxix. 105", "Gen. i. 2", "I Kings xx. 34")
— so it carries its own reference grammar, but shares the NT script's figure map (FIG)
so a device id means the same thing on both testaments and the app's merge logic works
unchanged.

Emits public/data/rhetoric/devices/<Osis>.json  ->  { "book": Osis, "devices": Device[] }

Only public-domain material is used and emitted: Bullinger's own figure→verse assignments
and his own prose glosses. A heading whose figure we cannot name with confidence is
DROPPED rather than guessed at — a mislabelled figure teaches an error, a missing one
merely teaches less. (Fuzzy string matching was tried and rejected: it confidently mapped
CATAPHASIS→catabasis and ANTIMETATHESIS→antithesis, which are different figures.)

Usage:  python3 scripts/build-rhetoric-bullinger-ot.py Genesis
        python3 scripts/build-rhetoric-bullinger-ot.py --all
"""
import importlib.util
import json
import os
import re
import subprocess
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, os.pardir)
OUT_DIR = os.path.join(REPO, "public", "data", "rhetoric", "devices")
CACHE = os.path.join(REPO, ".bullinger-cache")
ITEM = "figuresofspeechu00bull"          # archive.org, 1898 first edition

# Share the NT script's figure map, note cleaner and gloss extractor — one taxonomy.
_spec = importlib.util.spec_from_file_location("bnt", os.path.join(HERE, "build-rhetoric-bullinger.py"))
_nt = importlib.util.module_from_spec(_spec)
_argv, sys.argv = sys.argv, ["build-rhetoric-bullinger.py", "Matthew"]
try:
    _spec.loader.exec_module(_nt)
except SystemExit:                        # it exits when the EPUB isn't present; we only want its tables
    pass
sys.argv = _argv
FIG, clean_note = _nt.FIG, _nt.clean_note


def B(rx, osis, name, chapters, single=False):
    return dict(rx=rx, osis=osis, name=name, ch=chapters, single=single)


# The scan mixes Roman and Arabic book numerals ("I Sam." and "1 Sam." both occur, and the
# OCR is inconsistent between them). ONE(x)/TWO(x) accept either; ONE's lookbehind stops it
# matching the second I of "II Sam.".
def ONE(stem):
    return r"(?<![IVX\d])(?:1|I)\s*" + stem


def TWO(stem):
    return r"(?<![IVX\d])(?:2|II)\s*" + stem


# Bullinger's abbreviation → our osis + display name. `name` must match what the app's
# parser and the Keil & Delitzsch key expect. Chapter counts gate OCR-mangled references.
BOOKS = {
    "Genesis":       B(r"Gen", "Gen", "Genesis", 50),
    "Exodus":        B(r"Ex(?:od)?", "Exod", "Exodus", 40),
    "Leviticus":     B(r"Lev", "Lev", "Leviticus", 27),
    "Numbers":       B(r"Num", "Num", "Numbers", 36),
    "Deuteronomy":   B(r"Deut", "Deut", "Deuteronomy", 34),
    "Joshua":        B(r"Josh", "Josh", "Joshua", 24),
    "Judges":        B(r"Judg", "Judg", "Judges", 21),
    "Ruth":          B(r"Ruth", "Ruth", "Ruth", 4),
    "1 Samuel":      B(ONE(r"Sam"), "1Sam", "1 Samuel", 31),
    "2 Samuel":      B(TWO(r"Sam"), "2Sam", "2 Samuel", 24),
    "1 Kings":       B(ONE(r"Kings"), "1Kgs", "1 Kings", 22),
    "2 Kings":       B(TWO(r"Kings"), "2Kgs", "2 Kings", 25),
    "1 Chronicles":  B(ONE(r"Chron"), "1Chr", "1 Chronicles", 29),
    "2 Chronicles":  B(TWO(r"Chron"), "2Chr", "2 Chronicles", 36),
    "Ezra":          B(r"Ezra", "Ezra", "Ezra", 10),
    "Nehemiah":      B(r"Neh", "Neh", "Nehemiah", 13),
    "Esther":        B(r"Est", "Esth", "Esther", 10),
    "Job":           B(r"Job", "Job", "Job", 42),
    "Psalms":        B(r"Ps(?:a|alm)?", "Ps", "Psalms", 150),
    "Proverbs":      B(r"Prov", "Prov", "Proverbs", 31),
    "Ecclesiastes":  B(r"Ecc(?!lus)", "Eccl", "Ecclesiastes", 12),
    "Song of Songs": B(r"Cant|Song", "Song", "Song of Songs", 8),
    "Isaiah":        B(r"Isa", "Isa", "Isaiah", 66),
    "Jeremiah":      B(r"Jer", "Jer", "Jeremiah", 52),
    "Lamentations":  B(r"Lam", "Lam", "Lamentations", 5),
    "Ezekiel":       B(r"Ezek", "Ezek", "Ezekiel", 48),
    "Daniel":        B(r"Dan", "Dan", "Daniel", 12),
    "Hosea":         B(r"Hos", "Hos", "Hosea", 14),
    "Joel":          B(r"Joel", "Joel", "Joel", 3),
    "Amos":          B(r"Amos", "Amos", "Amos", 9),
    "Obadiah":       B(r"Obad", "Obad", "Obadiah", 1, single=True),
    "Jonah":         B(r"Jonah|Jon(?!\w)", "Jonah", "Jonah", 4),
    "Micah":         B(r"Mic", "Mic", "Micah", 7),
    "Nahum":         B(r"Nah", "Nah", "Nahum", 3),
    "Habakkuk":      B(r"Hab", "Hab", "Habakkuk", 3),
    "Zephaniah":     B(r"Zeph", "Zeph", "Zephaniah", 3),
    "Haggai":        B(r"Hag", "Hag", "Haggai", 2),
    "Zechariah":     B(r"Zech", "Zech", "Zechariah", 14),
    "Malachi":       B(r"Mal", "Mal", "Malachi", 4),
}
MAX_VERSE = 176        # Ps 119

# ── Headings ──────────────────────────────────────────────────────────────────────────
# Every figure section opens "NAME; or, English Name". The scan's OCR mangles the œ/æ
# ligatures (HOMŒOTELEUTON → HOMCEOTELEUTON), and Bullinger names finer subtypes than we
# teach. ALIAS maps a heading onto a FIG key; anything unlisted and not in FIG is dropped.
ALIAS = {
    # OCR ligature damage
    "homceoteleuton": "homoteleuton", "homoeoteleuton": "homoteleuton",
    "synceceiosis": "synceiosis", "syncoeceiosis": "synceiosis",
    "prosopopceia": "prosopopia", "prosopopoeia": "prosopopia",
    "parcemia": "parmia", "paroemia": "parmia",
    "eironeia": "eironeia", "parechesis": "parechesls",
    # subtypes folded onto the figure we teach
    "mesozeugma": "zeugma", "hypozeugma": "zeugma", "protozeugma": "zeugma",
    "synezeugmenon": "zeugma", "diazeugma": "zeugma",
    "epadiplosis": "epizeuxis", "mesodiplosis": "mesarchia",
    "repetitio": "anaphora", "epibole": "anaphora",
    "epanastrophe": "anadiplosis", "epiphoza": "epistrophe", "epiphora": "epistrophe",
    "antimetathesis": "antimetabole",
    "prosopographia": "hypotyposis", "pragmatographia": "hypotyposis",
    "topographia": "hypotyposis", "characterismos": "hypotyposis",
    "effictio": "hypotyposis", "chronographia": "chronographia",
    "ethopceia": "hypotyposis", "pathopceia": "hypotyposis",
    "diexodos": "hypotyposis", "peristasis": "hypotyposis",
    "epexegesis": "hermeneia", "exergasia": "hermeneia", "epidiegesis": "hermeneia",
    "hermeneia": "hermeneia", "epicrisis": "epiphonema", "symperasma": "epiphonema",
    "exemplum": "gnome", "apomnemoneusis": "gnome",
    "interjectio": "ecphonesis", "ejaculatio": "ecphonesis", "deesis": "ecphonesis",
    "parembole": "epitrechon", "cataploce": "ecphonesis",
    "syllepsis": "zeugma", "synantesis": "chiasmus", "cycloides": "epanadiplosis",
    "synathroesmos": "synonymia", "synathrgesmos": "synonymia",
    "epitrochasmos": "asyndeton", "asterismos": "ecphonesis",
    "protimesis": "climax", "epitasis": "anabasis", "anesis": "catabasis",
    "horismos": "hermeneia", "syntheton": "hendiadys",
    "mimesis": "dialogismos", "sermocinatio": "dialogismos",
    "paradiastole": "antithesis", "apocope": "aposiopesis",
    "merismos": "merismos", "coenotes": "symploce", "cgenotes": "symploce",
    "homceopropheron": "alliteration", "homoeopropheron": "alliteration",
    # keys the FIG table spells with a space or hyphen (norm_head strips both)
    "hysteronproteron": "hysteron-proteron", "repeatednegation": "repeated negation",
    "syncrisis": "synceiosis", "ishendiatris": "hendiatris",
    "yantistrophe": "epistrophe", "antistrophe": "epistrophe",
    "vejaculatio": "ecphonesis", "pathopoeia": "hypotyposis",
    "anastrophe": "hyperbaton", "tmesis": "hyperbaton",
    "enantiosis": "antithesis", "antiphrasis": "eironeia",
    "paraleipsis": "apophasis", "apophasis": "apophasis",
    "acrostichion": "acrostichion", "parallelism": "parallelism",
    "correspondence": "correspondence", "chiasmos": "chiasmus", "chiaston": "chiasmus",
}
# Figures Bullinger names that the NT catalogue has no entry for, but that earn their keep
# in the Hebrew Bible. (id, name, greek, group, definition) — same shape as FIG's values.
EXTRA_FIG = {
    # id 'merism' matches the curated poetics entry in rhetoric-devices.ts so they MERGE —
    # a distinct id would put two "Merism" devices side by side in the browser.
    "merismos": ("merism", "Merism", "μερισμός", "poetics",
                 "Naming the parts, or the two extremes, to mean the whole — “heaven and earth,” "
                 "“your going out and your coming in.”"),
    "alliteration": ("alliteration", "Alliteration", "ὁμοιοπρόφορον", "repetition",
                     "Successive words beginning with the same letter or sound — dense in Hebrew "
                     "poetry, and usually invisible in translation."),
    "acrostichion": ("acrostic", "Acrostic", "ἀκροστιχίς", "poetics",
                     "Successive lines or stanzas begin with the letters of the alphabet in order — "
                     "a Hebrew form that cannot survive translation (Pss 25, 34, 119; Lam 1–4; Prov 31:10–31)."),
    "parallelism": ("parallelism", "Parallelism", None, "poetics",
                    "The governing form of Hebrew verse: a line is answered by a second that repeats "
                    "it in other words, opposes it, or carries it further (Lowth's synonymous, "
                    "antithetic and synthetic parallelism)."),
    "correspondence": ("correspondence", "Correspondence (structure)", None, "poetics",
                       "Whole paragraphs or sections answering one another in order (A B C … A′ B′ C′) "
                       "or inverted around a centre — parallelism written large, over a passage."),
    "apophasis": ("apophasis", "Apophasis / paraleipsis", "ἀπόφασις", "emphasis",
                  "Mentioning a thing by declaring you will not mention it (“I need not say…”)."),
}
CATEGORY = re.compile(
    r"^(?:[A-Z]\s+)?(?:[IVX]+\.\s*)?"          # a stray running-head letter, a section numeral
    r"(?:(?:THE MEANING OF WORDS|AFFECTING THE (?:SENSE|WORDS|APPLICATION|ARRANGEMENT|MEANING))[.,]?\s*)?", re.I)
# The 1898 setting punctuates a figure heading with either ";" or ":" before "or," and the
# scan's OCR moves between them freely. Matching only ";" silently lost PARALLELISM,
# ACROSTICHION, MERISMOS and ANTIMETABOLE — the four that matter most in the Hebrew Bible.
HEAD = re.compile(r"\b([A-Z][A-ZŒÆ'\-. ]{3,44}?)\s*[;:]\s*or,")


def norm_head(name):
    n = unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode()
    n = CATEGORY.sub("", n.strip()).strip().lower()
    return re.sub(r"[^a-z]", "", n)


def figure_for(name):
    k = norm_head(name)
    if k in ALIAS:
        k = ALIAS[k]
    return FIG.get(k) or EXTRA_FIG.get(k)


# ── References ────────────────────────────────────────────────────────────────────────
ROMAN = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100, "d": 500, "m": 1000}


def roman(s):
    s = s.lower()
    if not s or any(c not in ROMAN for c in s):
        return 0
    total = prev = 0
    for c in reversed(s):
        v = ROMAN[c]
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total


# "Gen. iii. 15; iv. 25 ; xxx. 40" — after the first ref, "; <roman>. <verse>" continues in
# the same book, and ", 16" continues in the same chapter.
CONT = re.compile(r"\s*(?:,\s*(\d{1,3})(?!\s*[:.]?\s*\d)|[;,]\s*([ivxlcdmIVXLCDM]{1,7})\.?\s*(\d{1,3}))")


def continuation(text, pos, ch):
    out = []
    for _ in range(40):
        m = CONT.match(text, pos)
        if not m:
            break
        if m.group(1):
            out.append((ch, int(m.group(1))))
        else:
            c2 = roman(m.group(2))
            if not c2:
                break
            ch = c2
            out.append((ch, int(m.group(3))))
        pos = m.end()
    return out


# ── Validation against the app's own text ─────────────────────────────────────────────
# Every emitted reference is checked against the real MT versification we already ship, so
# an OCR-mangled chapter or verse ("Ps. cxix. 105" misread as verse 1057) is dropped rather
# than shipped as a citation that resolves to nothing.
_VERSES = {}


def real_verses(osis, ch):
    key = (osis, ch)
    if key not in _VERSES:
        f = os.path.join(REPO, "public", "data", "mt", f"{osis}_{ch}.json")
        try:
            with open(f, encoding="utf-8") as fh:
                _VERSES[key] = max(v["verse"] for v in json.load(fh)["verses"])
        except Exception:
            _VERSES[key] = 0
    return _VERSES[key]


# Bullinger's gloss sometimes opens with a cross-reference instruction rather than comment,
# and the 1898 scan's OCR is dirty enough that some glosses arrive unreadable. Both are
# dropped: the figure→verse assignment stands on its own, a mangled quotation does not.
SEE_ONLY = re.compile(r"^\s*See\s+(?:below|above|under|also)?\b", re.I)
GARBAGE = re.compile(r"[»«¢£§¡~^|\\{}]")


# ── OCR repair, OT only ───────────────────────────────────────────────────────────────
# The NT sibling reads a modernised EPUB; this reads a 1898 scan, and the two need different
# medicine. Everything below is confined to this file so the NT notes — already translated —
# keep byte-for-byte the English they were translated from.
#
# The governing rule is the one this script already follows for figure headings: REPAIR only
# what is unambiguous, DROP the rest. A guessed word in a gloss on a figure of speech is worse
# than no gloss, because the gloss exists to say precisely what the words are doing.

# 1. Where the gloss ENDS. Bullinger's comment runs until he starts citing parallels, and the
#    scan cites them in Roman numerals ("Mai. i. 2, 3. Rom. ix. 13."), which the NT cutter —
#    written for Arabic "1:2" — walked straight past, swallowing whole chains of other verses.
BOOK_TOK = (r"Gen|Ex(?:od)?|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kings?|Kgs|Chron|Ezra|Neh|Esth|Job|"
            r"Ps(?:a|alm)?s?|Prov|Eccl|Cant|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jon(?:ah)?|"
            r"Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Mai|Matt|Mark|Luke|John|Acts|Rom|Cor|Gal|Eph|Phil|Col|"
            r"Thess|Tim|Tit|Philem|Heb|Jas|Pet|Jude|Rev|Sept")
# The book name may be spelled out ("Judges", "Psalms"), and the verse number after the Roman
# chapter is often itself mangled ("Ps. vii. I(i") — so the cut keys on book + Roman chapter and
# does not wait for a readable verse.
ROMAN_REF = re.compile(r"(?:[12]\s|I{1,3}\s)?(?:" + BOOK_TOK + r")[a-z]*[.,]?\s+[ivxlcIVXLC]{1,7}\.")
# 2. Page furniture: the running head, a figure name set as a heading, a bare page number.
FURNITURE = re.compile(r"FIGURES\s+OF\s+SPEECH|\b[A-Z]{4,}(?:\s+[A-Z(][A-Z )]{2,})*\s*[.(]|(?<![\d:])\b\d{3}\b")

# 3. Character-level damage that recurs and can only be read one way. Nothing here changes a
#    word into a different word: "1 know" is not English, "A.\'." is not a word at all.
FIXES = [
    (re.compile(r"[■•]+"), '"'),                        # broken quotation marks
    (re.compile(r"A\.\\?['\u2019]\."), "AV"),             # A.\'. / A.'. -> AV
    (re.compile(r"\{(?=[ci]\.?e?[.,)])"), "("),          # {i.e., -> (i.e.,   {c) -> (c)
    (re.compile(r"\bi\.\s*c\.(?=[\s,])"), "i.e."),       # i.c. -> i.e.
    (re.compile(r"(?<![\w.])1(?=\s+(?:am|will|shall|have|had|know|knew|say|said|do|did|was|were|"
                r"is|are|would|could|should|may|might|must|can|cannot|thought|saw|see|"
                r"believe|speak|spake|write|wrote)\b)"), "I"),
    (re.compile(r"(?<![\w.])1(?=\s+(?:the|my|thy|this|that|will|am)\b)"), "I"),
    (re.compile(r"\bIxx"), "lxx"), (re.compile(r"\bIx\."), "lx."),   # capital I read for l
    (re.compile(r",{2,}"), ","),
    (re.compile(r"\bq-v\b"), "q.v."),
    (re.compile(r"\s*\u2014\s*$"), ""),
]

# 4. What cannot be repaired. A run of letters with an apostrophe or a stray capital inside it
#    ("li'ithdraw", "WJicrcof", "knoic", "huntinj") is a word the scan lost; two of them in one
#    gloss means the sentence can no longer be trusted to say what Bullinger said.
# A word the scan lost: a capital inside a lowercase word (tJie, chabOd), a digit inside a word
# (N3P), or an apostrophe splicing two word-halves (li'ithdraw) — the last excluding the English
# contractions and possessives that legitimately carry one.
BROKEN_WORD = re.compile(
    r"\b(?:[a-z]+[A-Z][A-Za-z]*"
    r"|[A-Za-z]*\d[A-Za-z]+|[A-Za-z]{2,}\d[A-Za-z]*"
    r"|[a-z]{2,}['\u2019](?!s\b|t\b|d\b|ll\b|re\b|ve\b|m\b)[a-z]{2,})\b")
# A slash is never Bullinger's: it is what the scan makes of "i.e." and of the italic "if".
STRAY = re.compile(r"[»«¢£§¡~^|\\{}*/]|\w[(;]+\w")

# Punctuation where a letter belongs. The scan drops a bracket into the middle of a word
# ("Ski:d", "h(;w"), reads a comma as a full stop ("3.nd"), and truncates a word to a stub
# after a hyphen ("l-or", "q-v"). None of these can be repaired without inventing letters.
PUNCT_IN_WORD = re.compile(r"[A-Za-z][(),;:\[\]][A-Za-z]|[A-Za-z0-9]\.[a-z]{2,}"
                           r"|\b[A-Za-z]{1,2}-[a-z]{1,2}\b")
# "See under Erotesis" is a pointer to another section, not a gloss; it can appear anywhere in
# the run, not only at the start where SEE_ONLY looks for it.
SEE_REF = re.compile(r"\bSee\s+(?:under|below|above|also)\b", re.I)


# Within one book Bullinger drops the book name and cites the chapter alone ("So xliii. 8",
# "(xviii. 12)"). Two letters minimum, so "i.e." is not mistaken for a chapter.
BARE_ROMAN = re.compile(r"\(?\b[ivxl]{2,}\.\s*\d|\bvol\.\s*[IVXL]")


# ── Is this a word, or is it what the scan made of one? ───────────────────────────────
# The damage that survives every rule above is all-lowercase and structurally innocent —
# "tlie", "witii", "touchcth", "jfncob", "comntandiiieiit". No pattern separates those from
# English; only a vocabulary does. Three sources, none of them a guess about this text:
#   · the English Bible we already ship — Bullinger is quoting it most of the time;
#   · his own NT notes, which came from a clean EPUB and are the control corpus;
#   · the system word list, when the platform has one (macOS/BSD do; it is optional).
# A note with an unrecognised word is dropped, not repaired. That costs a handful of real
# rarities ("forgat", "skilfully") and buys a corpus a reader can trust.
_VOCAB = set()


def vocabulary():
    if _VOCAB:
        return _VOCAB
    idx = os.path.join(REPO, "public", "data", "search-index-en.json.gz")
    if os.path.exists(idx):
        import gzip
        with gzip.open(idx) as fh:
            for e in json.load(fh):
                _VOCAB.update(re.findall(r"[a-z]{2,}", e.get("t", "").lower()))
    # NOT the NT notes: their EPUB has its own scars ("trangression" is in them), and a
    # vocabulary built from damaged text licenses the damage it was meant to catch.
    for wl in ("/usr/share/dict/words", "/usr/dict/words"):
        if os.path.exists(wl):
            with open(wl, encoding="utf-8", errors="ignore") as fh:
                _VOCAB.update(w.strip().lower() for w in fh)
            break
    _VOCAB.update(ALLOWED)
    _VOCAB.update(w.lower() for f in FIG.values() if f for w in re.findall(r"[a-z]{3,}", f[1].lower()))
    return _VOCAB


# Words the sources above do not have but Bullinger legitimately uses: his abbreviations, the
# AV's archaic verbs, and British spellings that no rule reaches. Everything here is a word;
# nothing here is a repair.
ALLOWED = ("viz", "marg", "esp", "lxx", "sept", "heb", "gr", "cf", "ver", "chap", "ecc", "etc",
           "hast", "hath", "doth", "dost", "didst", "shalt", "wilt", "art", "thyself", "himself",
           "spake", "sware", "brethren", "whosoever", "whatsoever", "wherewith", "wherefore",
           "fulness", "carcase", "carcases", "worshipper", "worshippers", "fulfilment",
           "shew", "shewed", "shewing", "shewn", "sheweth", "unto", "thence", "hither")


BRITISH = (("our", "or"), ("ise", "ize"), ("yse", "yze"))
SUFFIXES = ("edst", "eth", "est", "ing", "ed", "es", "th", "s")


def known_word(w):
    v = vocabulary()
    forms = {w}
    for suf in SUFFIXES:
        if w.endswith(suf) and len(w) > len(suf) + 2:
            stem = w[: -len(suf)]
            forms |= {stem, stem + "e", stem[:-1] if len(stem) > 3 and stem[-1] == stem[-2] else stem}
            if stem.endswith("i"):                    # implied -> imply, replies -> reply
                forms.add(stem[:-1] + "y")
    for f in list(forms):
        for a, b in BRITISH:
            if f.endswith(a):
                forms.add(f[: -len(a)] + b)
    return any(f in v for f in forms)


def ot_note(after):
    """Bullinger's gloss on this verse, cut at his cross-references and repaired where the
    damage is unambiguous. Returns "" when the scan is past saving."""
    after = after.lstrip(" .,:;")
    cuts = [m.start() for m in (ROMAN_REF.search(after), FURNITURE.search(after),
                                BARE_ROMAN.search(after), SEE_REF.search(after)) if m]
    if cuts:
        after = after[:min(cuts)]
    seg = _nt.make_note(after)
    if not seg:
        return ""
    for rx, rep in FIXES:
        seg = rx.sub(rep, seg)
    seg = re.sub(r"(\w)-\s+(\w)", r"\1\2", seg)      # "accord- ing" split across a line
    seg = re.sub(r"\s+", " ", seg).strip(" .,;:\u2014-")
    if BROKEN_WORD.search(seg) or STRAY.search(seg) or PUNCT_IN_WORD.search(seg):
        return ""
    # A gloss that is now only a fragment teaches nothing; one that never closes its quotation
    # was cut mid-sentence by the page break.
    seg = re.sub(r"^(?:[a-z0-9]{1,3}[).]?\s+)+", "", seg).lstrip(" .,;:\u2014-")  # "g). —", "10 distinctly"
    seg = re.sub(r"\s+\b[A-Za-z]{1,2}$", "", seg)      # the window closed mid-word ("… by H")
    if seg.count("(") != seg.count(")") or seg.count("[") != seg.count("]"):
        return ""
    if sum(c.isalpha() for c in seg) < 20 or seg.count('"') % 2:
        return ""
    # Last gate. Everything above is a rule about a KNOWN defect; this is the catch-all for the
    # ones that are not worth a rule of their own — a surviving Roman-numeral reference, a
    # running head, a word the scan broke. Eight notes out of fifteen hundred fail here, and a
    # reader is better served by a figure with no gloss than by a gloss that reads as gibberish.
    if re.search(r"\b[ivxl]{2,}\.|FIGURES OF SPEECH|\b[a-z]+[A-Z]|[»«¢£§¡~^|\\{}]|[A-Za-z]/", seg):
        return ""
    # A dangling connective is where the cut landed, not something Bullinger wrote.
    seg = re.sub(r"[\s,;:]*\b(?:So|See|And|But|Compare|Also|Thus|Hence|For)\.?$", "", seg).rstrip(" .,;:")
    # Capitalised words are tested too — "Raniah" for Ramah passes every structural rule, and
    # every proper name Bullinger uses is in the English Bible or in his own NT notes.
    if any(not known_word(w.lower()) for w in re.findall(r"\b[A-Za-z]{3,}\b", seg)):
        return ""
    return seg


def usable_note(s):
    if not s or SEE_ONLY.match(s):
        return ""
    if len(GARBAGE.findall(s)) >= 2:
        return ""
    letters = sum(c.isalpha() or c.isspace() for c in s)
    return s if letters / max(1, len(s)) > 0.82 else ""


def load_text():
    """The archive.org OCR, cached locally. Public-domain scan; fetched, never redistributed."""
    os.makedirs(CACHE, exist_ok=True)
    f = os.path.join(CACHE, f"{ITEM}.txt")
    if not os.path.exists(f):
        url = f"https://archive.org/download/{ITEM}/{ITEM}_djvu.txt"
        env = {**os.environ, "CURL_CA_BUNDLE": "/etc/ssl/cert.pem"}
        subprocess.run(["curl", "-sL", "-o", f, url], env=env, check=True)
    text = re.sub(r"\s+", " ", open(f, encoding="utf-8", errors="replace").read())
    # Keep the BODY only. Both ends of the book are traps for a heading-driven scan:
    #  · the table of contents lists every figure in heading form ("PALINODIA : or, Retracting
    #    … 978"), so a TOC entry opens a "section" that then swallows the next 300k characters
    #    of real text — that is exactly how Palinodia acquired 569 occurrences;
    #  · the "Index of Texts and Passages Illustrated" is thousands of bare references in a row.
    # The TOC's last dot-leader entry ends the front matter; "INDEX OF FIGURES" opens the back.
    # The body opens with Bullinger's longest treatment, Ellipsis, and that one section is
    # headed "ELLIPSIS. El-lip'-sis. …" rather than "ELLIPSIS ; or, Omission" — so the body
    # is cut to start exactly there and head_events() opens the run with a synthetic heading.
    # Without this, its ~240k characters (through to ZEUGMA) carry no figure at all.
    first = re.search(r"ELLIPSIS\.\s*El-lip", text)
    leaders = [m.end() for m in re.finditer(r"\.\s*\.\s*\.\s*\.\s*\d{2,4}\b", text)]
    start = first.start() if first else max([p for p in leaders if p < len(text) * 0.15], default=0)
    # The appendices come before the indexes and are themselves thick with references; the
    # last figure section (Palinodia) otherwise runs straight on into them.
    ends = [text.find(k) for k in ("APPENDICES.", "APPENDIX A", "INDEX OF FIGURES")]
    ends = [e for e in ends if e > len(text) // 2]
    return text[start:min(ends) if ends else len(text)]


def head_events(text):
    # load_text() cuts the body to open on the Ellipsis section, whose heading is set in a
    # different style from every other ("ELLIPSIS. El-lip'-sis." rather than "X ; or, Y"), so
    # it gets its heading here rather than from the scan.
    out = [(0, ("h", FIG["ellipsis"]))]
    for m in HEAD.finditer(text):
        fig = figure_for(m.group(1))
        out.append((m.start(), ("h", fig)))       # unrecognised → None, which closes the section
    return out


# ── Does the gloss quote the verse it is filed under? ─────────────────────────────────
# The extractor takes the prose that FOLLOWS a reference, which is right until Bullinger runs
# two references together — and then a comment on Luke iv. 19 ends up filed under Isaiah 10:2.
# Structure cannot catch that; content can. Every gloss that quotes scripture is checked
# against the English text we ship: if its quotation matches some OTHER verse far better than
# its own, the note is wrong about itself and is dropped.
#
# The comparison is deliberately one-sided. Bullinger quotes the AV and we ship the WEB, so a
# gloss that matches its own verse only loosely proves nothing and is left alone; only a gloss
# with NO overlap with its own verse and a strong match elsewhere is condemned.
_EN_STOP = set("the a an and or of to in is was that this his her their my thy thee thou ye you "
               "for with not be shall will have hath are it he she they them who which as but by "
               "from on at so also".split())
_EN = {}
_EN_INV = {}


def english_index():
    if _EN:
        return _EN, _EN_INV
    f = os.path.join(REPO, "public", "data", "search-index-en.json.gz")
    if not os.path.exists(f):
        return _EN, _EN_INV
    import gzip
    with gzip.open(f) as fh:
        for e in json.load(fh):
            _EN[e["id"]] = e.get("t", "")
    for k, t in _EN.items():
        for w in content_words(t):
            _EN_INV.setdefault(w, set()).add(k)
    return _EN, _EN_INV


def content_words(s):
    return {w for w in re.findall(r"[a-z]{4,}", s.lower()) if w not in _EN_STOP}


def misattached(osis, ch, v, note):
    en, inv = english_index()
    key = f"{osis}.{ch}.{v}"
    if key not in en:
        return False
    quoted = re.findall(r'"([^"]{12,})"', note)
    if not quoted:
        return False
    qw = content_words(quoted[0])
    if len(qw) < 3 or qw & content_words(en[key]):
        return False                       # says something its own verse says: keep
    best, score = None, 0
    tally = {}
    for w in qw:
        for k in inv.get(w, ()):
            tally[k] = tally.get(k, 0) + 1
    for k, n in tally.items():
        if n > score:
            best, score = k, n
    return best is not None and best != key and score / len(qw) >= 0.7


BOOKS_BY_OSIS = {b["osis"] for b in BOOKS.values()}


def build_book(book, text, heads):
    b = BOOKS[book]
    # Single-chapter books are cited by verse alone ("Obad. 4"); the rest carry a Roman chapter.
    rx = re.compile(r"\b(?:" + b["rx"] + r")[a-z]*\.?\s*"
                    + (r"(\d{1,3})" if b["single"] else r"([ivxlcdmIVXLCDM]{1,7})\.\s*(\d{1,3})"))
    refs = []
    for m in rx.finditer(text):
        ch = 1 if b["single"] else roman(m.group(1))
        v = int(m.group(1) if b["single"] else m.group(2))
        if not ch:
            continue
        refs.append((m.start(), ch, v, m.end(), True))
        for cc, vv in continuation(text, m.end(), ch):
            refs.append((m.start(), cc, vv, m.end(), False))

    events = heads + [(s, ("r", ch, v, e, p)) for s, ch, v, e, p in refs]
    events.sort(key=lambda x: x[0])

    devices, cur = {}, None
    for _pos, val in events:
        if val[0] == "h":
            cur = val[1]
            continue
        if not cur:
            continue
        _, ch, v, end, primary = val
        if not (1 <= ch <= b["ch"] and 1 <= v <= MAX_VERSE):
            continue
        if not 1 <= v <= real_verses(b["osis"], ch):     # checked against our own MT text
            continue
        did, name, greek, group, definition = cur
        note = usable_note(ot_note(text[end:end + 260])) if primary else ""
        if note and misattached(b["osis"], ch, v, note):
            note = ""
        d = devices.setdefault(did, dict(id=did, name=name, greek=greek, group=group,
                                         definition=definition, occ={}))
        r = f"{b['name']} {ch}:{v}"
        if r not in d["occ"] or (not d["occ"][r] and note):
            d["occ"][r] = note

    def vkey(r):
        m = re.search(r"(\d+):(\d+)$", r)
        return (int(m.group(1)), int(m.group(2)))

    out = []
    for d in devices.values():
        occ = [{"ref": r, **({"note": n} if n else {})} for r, n in sorted(d["occ"].items(), key=lambda kv: vkey(kv[0]))]
        out.append({k: d[k] for k in ("id", "name", "greek", "group", "definition")} | {"occurrences": occ})
    out.sort(key=lambda d: (-len(d["occurrences"]), d["name"]))
    return out


def main():
    text = load_text()
    heads = head_events(text)
    named = sum(1 for _, v in heads if v[1])
    print(f"{len(heads)} figure headings, {named} named ({len(heads) - named} dropped as unidentifiable)")
    os.makedirs(OUT_DIR, exist_ok=True)
    books = list(BOOKS) if sys.argv[1] == "--all" else [sys.argv[1]]
    total = 0
    for bk in books:
        devices = build_book(bk, text, heads)
        n = sum(len(d["occurrences"]) for d in devices)
        total += n
        dest = os.path.join(OUT_DIR, f"{BOOKS[bk]['osis']}.json")
        with open(dest, "w", encoding="utf-8") as fh:
            json.dump({"book": BOOKS[bk]["osis"], "devices": devices}, fh, ensure_ascii=False)
        print(f"  {bk:15s} {len(devices):3d} figures, {n:5d} occurrences -> {os.path.basename(dest)}")
    print(f"total {total} occurrences")


if __name__ == "__main__":
    main()
