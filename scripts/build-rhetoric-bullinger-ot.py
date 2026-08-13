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
    "merismos": ("merismos", "Merism", "μερισμός", "substitution",
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
        note = usable_note(_nt.make_note(text[end:end + 240])) if primary else ""
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
