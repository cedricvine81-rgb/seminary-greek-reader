#!/usr/bin/env python3
"""Build a per-book Rhetoric dataset from E. W. Bullinger, *Figures of Speech Used in
the Bible* (1898, public domain).

Bullinger catalogues every figure and, under each, lists the verses that exhibit it —
usually with a short gloss right beside the reference. This script segments the book
into its figure-sections (each headed "Name; or, English …"), assigns every reference
for the target book to the figure whose section contains it, cleans Bullinger's inline
gloss into a per-verse note, folds Bullinger's fine-grained figure names onto a teachable
set (aligned with src/lib/rhetoric-devices.ts so occurrences merge by id), and writes
    public/data/rhetoric/devices/<Osis>.json   ->  { "book": Osis, "devices": Device[] }

Source text: the user's own EPUB, pre-extracted to page_*.html (one file per EPUB page).
Only public-domain facts (figure → verse) and Bullinger's own public-domain prose are
emitted; the EPUB itself is not redistributed.

Usage:  python3 build-rhetoric-bullinger.py Matthew
"""
import os, re, json, html, glob, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
# Pre-extracted EPUB pages (override with $BULL_DIR).
BULL_DIR = os.environ.get("BULL_DIR", os.path.join(
    "/private/tmp/claude-998505688/-Users-cvine-Library-CloudStorage-Dropbox-Greek-App"
    "/e71a7bdb-7325-4367-ba4d-477eb002a238/scratchpad/bull-epub/EPUB"))
OUT_DIR = os.path.join(HERE, os.pardir, "public", "data", "rhetoric", "devices")

# Each NT book: how Bullinger writes its reference (rx, a stem — "[a-z]*" completes any
# spelled-out form), the osis code, the ref *name* used in emitted refs (kept identical to
# rhetoric-devices.ts so occurrences merge and Bengel keys align), and either a chapter
# count (multi-chapter) or sc=verse-count (single-chapter, chapter fixed at 1).
def B(rx, osis, name, max_ch=None, sc=None):
    return dict(rx=rx, osis=osis, name=name, max_ch=max_ch, sc=sc)
BOOKS = {
    "Matthew":          B(r"Matt", "Matt", "Matt", 28),
    "Mark":             B(r"Mark", "Mark", "Mark", 16),
    "Luke":             B(r"Luke", "Luke", "Luke", 24),
    "John":             B(r"(?<![123]\s)John", "John", "John", 21),
    "Acts":             B(r"Acts", "Acts", "Acts", 28),
    "Romans":           B(r"Rom", "Rom", "Romans", 16),
    "1 Corinthians":    B(r"1\s*Cor", "1Cor", "1 Corinthians", 16),
    "2 Corinthians":    B(r"2\s*Cor", "2Cor", "2 Corinthians", 13),
    "Galatians":        B(r"Gal", "Gal", "Galatians", 6),
    "Ephesians":        B(r"Eph", "Eph", "Ephesians", 6),
    "Philippians":      B(r"Phil(?!e)", "Phil", "Philippians", 4),
    "Colossians":       B(r"Col", "Col", "Colossians", 4),
    "1 Thessalonians":  B(r"1\s*Thess", "1Thess", "1 Thessalonians", 5),
    "2 Thessalonians":  B(r"2\s*Thess", "2Thess", "2 Thessalonians", 3),
    "1 Timothy":        B(r"1\s*Tim", "1Tim", "1 Timothy", 6),
    "2 Timothy":        B(r"2\s*Tim", "2Tim", "2 Timothy", 4),
    "Titus":            B(r"Tit", "Titus", "Titus", 3),
    "Hebrews":          B(r"Heb", "Heb", "Hebrews", 13),
    "James":            B(r"Jas|James", "Jas", "James", 5),
    "1 Peter":          B(r"1\s*Pet", "1Pet", "1 Peter", 5),
    "2 Peter":          B(r"2\s*Pet", "2Pet", "2 Peter", 3),
    "1 John":           B(r"1\s*John", "1John", "1 John", 5),
    "Revelation":       B(r"Rev", "Rev", "Revelation", 22),
    # single-chapter books (Bullinger cites just the verse, e.g. "Jude 12", "Philem. 6")
    "Philemon":         B(r"Philem", "Phlm", "Philemon", sc=25),
    "2 John":           B(r"(?<![\d:])2\s*John", "2John", "2 John", sc=13),
    "3 John":           B(r"(?<![\d:])3\s*John", "3John", "3 John", sc=15),
    "Jude":             B(r"(?<![\d:])Jude", "Jude", "Jude", sc=25),
}
MAX_VERSE = 90   # no NT chapter exceeds ~80 verses; larger = an OCR-merged range (e.g. "15:2226")

# ── Figure map: Bullinger's name (normalised) -> teachable device ──────────────────────
# group ∈ comparison | substitution | omission | repetition | arrangement | emphasis.
# ids that already exist in rhetoric-devices.ts reuse the same id so occurrences merge.
FIG = {
  # comparison
  "simile":        ("simile","Simile","ὁμοίωσις","comparison","An explicit comparison of two unlike things using “like” or “as.”"),
  "metaphor":      ("metaphor","Metaphor","μεταφορά","comparison","An implied comparison that calls one thing another (“A is B”), without “like” or “as.”"),
  "hypocatastasis":("hypocatastasis","Hypocatastasis","ὑποκατάστασις","comparison","Comparison by implication: the thing compared is not named at all, only the image (“Beware the leaven…”)."),
  "allegory":      ("allegory","Allegory","ἀλληγορία","comparison","An extended metaphor — a whole passage whose surface story stands throughout for a deeper meaning."),
  "hermeneia":     ("hermeneia","Hermeneia","ἑρμηνεία","comparison","Interpretation: a plain restatement added at once to explain a figure just used."),
  # substitution
  "metonymy":      ("metonymy","Metonymy","μετωνυμία","substitution","Naming something by a word closely associated with it — cause for effect, container for contents, author for writings."),
  "synecdoche":    ("synecdoche","Synecdoche","συνεκδοχή","substitution","Substituting a part for the whole, or the whole for a part (“all the world”; “flesh and blood”)."),
  "heterosis":     ("heterosis","Heterosis","ἑτέρωσις","substitution","Exchange of one grammatical form for another — of tense, number, person, degree, or mood (e.g. a future used for a command)."),
  "enallage":      ("enallage","Enallage","ἐναλλαγή","substitution","Exchange of one grammatical part or form for another, differing from strict usage for effect."),
  "antonomasia":   ("antonomasia","Antonomasia","ἀντονομασία","substitution","A proper name replaced by a descriptive title, or a title by a proper name (“the Son of man”)."),
  "periphrasis":   ("periphrasis","Periphrasis","περίφρασις","substitution","Circumlocution: a description put in place of the plain name of a thing."),
  "catachresis":   ("catachresis","Catachresis","κατάχρησις","substitution","One word used for another only remotely related — a deliberately incongruous transfer."),
  "metalepsis":    ("metalepsis","Metalepsis","μετάληψις","substitution","A double metonymy: one word stands for a second, which itself stands for a third."),
  "idioma":        ("idioma","Idiom","ἰδίωμα","substitution","A peculiar usage of the Hebrew or Greek that does not carry its literal force — an idiom to be rendered by its sense, not word for word."),
  "ampliatio":     ("ampliatio","Ampliatio","ἀμπλιατίο","substitution","An old name kept for a person or thing after the reason for it has passed (“the blind man” once healed)."),
  "parabola":      ("parabola","Parable","παραβολή","comparison","A continued simile — a narrative laid alongside a truth to teach it by comparison."),
  "antiptosis":    ("antiptosis","Antiptosis","ἀντίπτωσις","substitution","One grammatical case put for another (commonly a genitive doing the work of an adjective)."),
  "hypallage":     ("hypallage","Hypallage","ὑπαλλαγή","substitution","Interchange: a word logically belonging to one term is grammatically attached to another."),
  # omission
  "ellipsis":      ("ellipsis","Ellipsis","ἔλλειψις","omission","A word or words deliberately left out, to be supplied by the reader — compression and force."),
  "asyndeton":     ("asyndeton","Asyndeton","ἀσύνδετον","omission","Conjunctions omitted between items in a series, producing a rapid, piled-up effect."),
  "aposiopesis":   ("aposiopesis","Aposiopesis","ἀποσιώπησις","omission","A sentence broken off unfinished, as if the speaker cannot or will not go on."),
  "zeugma":        ("zeugma","Zeugma","ζεῦγμα","omission","One verb made to govern two objects though it strictly fits only one; the second borrows it."),
  "syllogismus":   ("syllogismus","Syllogismus","συλλογισμός","omission","The conclusion is left unstated, so the hearer is made to draw it — an unspoken inference."),
  "enthymema":     ("enthymema","Enthymeme","ἐνθύμημα","omission","An argument in which one premise is left unexpressed and silently understood."),
  # repetition
  "anaphora":      ("anaphora","Anaphora","ἀναφορά","repetition","The same word or phrase begins a run of successive clauses, hammering a theme."),
  "polysyndeton":  ("polysyndeton","Polysyndeton","πολυσύνδετον","repetition","Conjunctions (“and … and …”) piled up to slow the pace and weight every item."),
  "pleonasm":      ("pleonasm","Pleonasm","πλεονασμός","repetition","A deliberate redundancy — more words than strictly needed — to underline or solemnise."),
  "polyptoton":    ("polyptoton","Polyptoton","πολύπτωτον","repetition","Repetition of the same root word in different inflections (“dying you shall die”)."),
  "anadiplosis":   ("anadiplosis","Anadiplosis","ἀναδίπλωσις","repetition","The word ending one clause is repeated to begin the next, linking them."),
  "epimone":       ("epimone","Epimone","ἐπιμονή","repetition","Dwelling on a point by repeating it in the same words for emphasis."),
  "homoteleuton":  ("homoteleuton","Homœoteleuton","ὁμοιοτέλευτον","repetition","Successive clauses closing with like-sounding endings — rhyme of terminations."),
  "paregmenon":    ("paregmenon","Paregmenon","παρηγμένον","repetition","Words from the same root set near one another (a figure of derivation)."),
  "polyonymia":    ("polyonymia","Polyonymia","πολυωνυμία","repetition","Heaping up several different names or titles for the same person or thing."),
  "synonymia":     ("synonymia","Synonymia","συνωνυμία","repetition","Amassing synonyms — words of like meaning — to enforce and enlarge a point."),
  "battologia":    ("battologia","Battologia","βαττολογία","repetition","Vain, mechanical repetition of the same words without added meaning (rebuked, Matt 6:7)."),
  "mesarchia":     ("mesarchia","Mesarchia","μεσαρχία","repetition","The same word repeated at both the beginning and the middle of successive clauses."),
  # arrangement
  "parallelism":   ("parallelism","Parallelism",None,"arrangement","Successive lines echo one another in structure — saying the same thing twice, or balancing matched clauses."),
  "chiasmus":      ("chiasmus","Chiasmus","χιασμός","arrangement","An inverted, mirror-image arrangement (A–B–B′–A′) that emphasises the centre or ties the outer terms."),
  "antithesis":    ("antithesis","Antithesis","ἀντίθεσις","arrangement","Two opposite ideas set side by side so each sharpens the other."),
  "hyperbaton":    ("hyperbaton","Hyperbaton","ὑπερβατόν","arrangement","Words wrenched out of their natural order, throwing weight onto the displaced word."),
  "hysteron-proteron":("hysteronproteron","Hysteron-proteron","ὕστερον πρότερον","arrangement","The natural order of two things reversed, the later put first (“let us live and move”)."),
  "epitrechon":    ("epitrechon","Epitrechon","ἐπιτρέχον","arrangement","A clause “running through” — dropped in parenthetically between others."),
  "catabasis":     ("catabasis","Catabasis","κατάβασις","arrangement","A gradual descent — a series that steps down, clause by clause, to a low point (opposite of climax)."),
  # emphasis & tone
  "hyperbole":     ("hyperbole","Hyperbole","ὑπερβολή","emphasis","Deliberate exaggeration, not meant literally, that drives a point home vividly."),
  "eironeia":      ("irony","Irony","εἰρωνεία","emphasis","Saying the opposite of what is meant, so the real sense is felt through the contrast."),
  "erotesis":      ("erotesis","Rhetorical question","ἐρώτησις","emphasis","A question asked for effect, not for an answer — to affirm, deny, or provoke thought."),
  "prosopopia":    ("personification","Personification","προσωποποιΐα","emphasis","Giving human traits, action, or speech to something impersonal or abstract."),
  "oxymoron":      ("oxymoron","Oxymoron / paradox","ὀξύμωρον","emphasis","A pointed pairing of apparently contradictory terms that expresses a deeper truth."),
  "paronomasia":   ("paronomasia","Paronomasia (wordplay)","παρονομασία","emphasis","A play on words that sound alike but differ in sense — pun, rhyme, near-repetition."),
  "euphemismos":   ("euphemismos","Euphemism","εὐφημισμός","emphasis","A softened or decent expression put for one that is harsh or delicate (“fallen asleep”)."),
  "anthropopatheia":("anthropopatheia","Anthropopatheia","ἀνθρωποπάθεια","emphasis","Ascribing to God human feelings, parts, or actions, by way of condescension to us."),
  "ecphonesis":    ("ecphonesis","Ecphonesis","ἐκφώνησις","emphasis","An outcry of feeling — a sudden exclamation breaking from strong emotion (“O the depth!”)."),
  "epiphonema":    ("epiphonema","Epiphonema","ἐπιφώνημα","emphasis","A closing exclamation that sums up and drives home what has just been said."),
  "thaumasmos":    ("thaumasmos","Thaumasmos","θαυμασμός","emphasis","An exclamation of wonder or admiration."),
  "enigma":        ("enigma","Enigma","αἴνιγμα","emphasis","A dark saying — a truth wrapped in obscure or riddling terms."),
  "epanorthosis":  ("epanorthosis","Epanorthosis","ἐπανόρθωσις","emphasis","Recalling a word just used to correct or strengthen it (“not I, but the Lord”)."),
  "apodioxis":     ("apodioxis","Apodioxis","ἀποδίωξις","emphasis","Indignant rejection of an argument or suggestion as abhorrent (“Get behind me, Satan”)."),
  "accismus":      ("accismus","Accismus","ἀκκισμός","emphasis","A feigned or apparent refusal of what is really desired or intended."),
  "diasyrmos":     ("diasyrmos","Diasyrmos","διασυρμός","emphasis","Mockery that belittles an opponent's argument by raillery."),
  "proecthesis":   ("proecthesis","Proecthesis","προέκθεσις","emphasis","A justification: reasons given beforehand to defend what is about to be said or done."),
  "protherapeia":  ("protherapeia","Protherapeia","προθεραπεία","emphasis","Conciliation — softening words used first to win a hearing for what follows."),
  "epitrope":      ("epitrope","Epitrope","ἐπιτροπή","emphasis","Admission or permission — ironically conceding a point (“Fill up the measure of your fathers”)."),
  "epitherapeia":  ("epitherapeia","Epitherapeia","ἐπιθεραπεία","emphasis","A qualifying clause added to soften or secure a statement just made."),
  "aporia":        ("aporia","Aporia","ἀπορία","emphasis","An expression of doubt or perplexity, real or feigned, as to what to say or do."),
  "dialogismos":   ("dialogismos","Dialogismus","διαλογισμός","emphasis","The speaker dramatises a dialogue, putting words into another's mouth."),
  "anteisagoge":   ("anteisagoge","Anteisagoge","ἀντεισαγωγή","emphasis","Meeting a question or objection with a counter-question."),
  "maledictio":    ("maledictio","Maledictio","κατάρα","emphasis","An imprecation or pronouncement of woe (“Woe to you…”)."),
  "hypotyposis":   ("hypotyposis","Hypotyposis","ὑποτύπωσις","emphasis","Vivid word-painting that sets a scene before the eyes as though present."),
  "chronographia": ("chronographia","Chronographia","χρονογραφία","emphasis","Description of a time or season by its marks rather than by naming it."),
  "hysteresis":    ("hysteresis","Hysteresis","ὑστέρησις","emphasis","A later passage supplying a detail not recorded in the earlier narrative it refers to."),
  "palinodia":     ("palinodia","Palinodia","παλινῳδία","emphasis","A concession — granting a point for argument's sake before answering it."),
  "amphibologia":  ("amphibologia","Amphibologia","ἀμφιβολία","emphasis","A saying deliberately capable of two meanings, both intended."),
  "repeated negation":("repeatednegation","Repeated negation","οὐ μή","emphasis","Two or more negatives heaped together in Greek to deny all the more emphatically."),
  "hendiadys":     ("hendiadys","Hendiadys","ἓν διὰ δυοῖν","emphasis","One idea expressed by two words joined with “and,” the second really qualifying the first."),
  "hendiatris":    ("hendiatris","Hendiatris","ἓν διὰ τριῶν","emphasis","One idea expressed by three words joined with “and” (“the way, the truth, and the life”)."),
  "tapeinosis":    ("tapeinosis","Tapeinosis","ταπείνωσις","emphasis","Deliberate understatement — belittling a thing to magnify it, or lessening to increase the effect."),
  "synceiosis":    ("syncrisis","Syncrisis","σύγκρισις","emphasis","Reconciling or comparing opposites, setting contraries together to make a point."),
  "gnome":         ("gnome","Gnome (quotation)","γνώμη","emphasis","A quotation or proverbial maxim woven in — a pithy saying cited for authority or point."),
  "parmia":        ("paroemia","Paroemia (proverb)","παροιμία","emphasis","A proverb — a wayside-saying in common use, cited or coined."),
  "parechesls":    ("parechesis","Parechesis","παρήχησις","emphasis","Repetition of like-sounding words, especially from a foreign tongue — sound-play across languages."),
  # figures scarce in Matthew but frequent elsewhere in the NT
  "ellipsis":      ("ellipsis","Ellipsis","ἔλλειψις","omission","A word or words deliberately left out, to be supplied by the reader — compression and force."),
  "asyndeton":     ("asyndeton","Asyndeton","ἀσύνδετον","omission","Conjunctions omitted between items in a series, producing a rapid, piled-up effect."),
  "aposiopesis":   ("aposiopesis","Aposiopesis","ἀποσιώπησις","omission","A sentence broken off unfinished, as if the speaker cannot or will not go on."),
  "brachylogia":   ("brachylogia","Brachyology","βραχυλογία","omission","A compressed construction that omits words the sense readily supplies."),
  "epizeuxis":     ("epizeuxis","Epizeuxis","ἐπίζευξις","repetition","Immediate repetition of a word for intense emphasis, with nothing between (“Lord, Lord”)."),
  "epistrophe":    ("epistrophe","Epistrophe","ἐπιστροφή","repetition","The same word or phrase ends a run of successive clauses (the mirror of anaphora)."),
  "epanadiplosis": ("epanadiplosis","Epanadiplosis","ἐπαναδίπλωσις","repetition","A clause encircled — beginning and ending with the same word."),
  "epanalepsis":   ("epanalepsis","Epanalepsis","ἐπανάληψις","repetition","Resumption of a word or thought after an intervening parenthesis."),
  "symploce":      ("symploce","Symploce","συμπλοκή","repetition","Anaphora and epistrophe together — clauses that share both their opening and closing words."),
  "climax":        ("climax","Climax","κλῖμαξ","arrangement","A chain in which the end of each step becomes the start of the next, building to a peak."),
  "anabasis":      ("anabasis","Anabasis","ἀνάβασις","arrangement","A gradual ascent — a series that mounts, clause by clause, to a high point."),
  "epanodos":      ("epanodos","Epanodos","ἐπάνοδος","arrangement","Repetition of the chief words of a sentence in inverse order, to expound them."),
  "antimetabole":  ("antimetabole","Antimetabole","ἀντιμεταβολή","arrangement","Words repeated in reverse order and grammatical relation (“sabbath for man … man for sabbath”)."),
  "anacoluthon":   ("anacoluthon","Anacoluthon","ἀνακόλουθον","arrangement","A break in grammatical sequence — a sentence begun one way and finished another."),
  "apostrophe":    ("apostrophe","Apostrophe","ἀποστροφή","emphasis","A sudden turn from the audience to address someone or something absent or abstract."),
  "epitheton":     ("epitheton","Epitheton","ἐπίθετον","substitution","Naming a thing by an attribute or adjunct added to it (“John the Baptist”)."),
  "prosapodosis":  ("prosapodosis","Prosapodosis","προσαπόδοσις","arrangement","A detailing return that takes up several things named together and expounds each in turn."),
}

CATEGORY = re.compile(r"^(?:WORDS|SENSE|SUBJECTS|PERSONS|THINGS|SYLLABLES|LETTERS)\s+", re.I)
def norm_fig(name):
    n = CATEGORY.sub("", name).strip().lower()
    n = unicodedata.normalize("NFD", n).encode("ascii", "ignore").decode()  # drop accents
    return re.sub(r"\s+", " ", n)

# ── Note cleanup ──────────────────────────────────────────────────────────────────────
def clean_note(s):
    s = re.sub(r"\s*Page\s+\d+\s*", " ", s)                 # drop page-break intrusions
    s = re.sub(r"[¢©]", "", s)                               # OCR specks (incl. the ¢ in 1.¢e.)
    s = re.sub(r"\b[1iï]\.\s*e\.", "i.e.", s)                # 1.e. / ï.e. -> i.e.
    s = re.sub(r"\bie\.", "i.e.", s)
    s = re.sub(r"\bJud[zr]?[e][ea]\b", "Judæa", s)          # Judzea / Judrea -> Judæa
    s = re.sub(r"\b1am\b", "I am", s)
    s = re.sub(r"\bA\.V\.\b", "AV", s); s = re.sub(r"\bR\.V\.\b", "RV", s)
    s = re.sub(r"\s+([,.;:])", r"\1", s)
    s = re.sub(r"\s+", " ", s).strip(" .,;:—-()")
    return s

# a chapter:verse reference of ANY Bible book — used to cut a gloss off its cross-ref chain
BOOK_ABBR = (r"Gen|Exod|Ex|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kings?|Chron|Ezra|Neh|Esth|Job|"
             r"Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jon|Mic|Nah|Hab|"
             r"Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|Cor|Gal|Eph|Phil|Col|Thess|"
             r"Tim|Tit|Philem|Heb|Jas|Pet|Jude|Rev|Sept")
NEXTREF = re.compile(r"(?:\d\s?)?(?:" + BOOK_ABBR + r")\.?\s*\d+\s*[:.]\s*\d+")
STOP = re.compile(r"\bPage\b|\betc\.|\bSee\s+[A-Z]|\bCompare\b|\bcompare\b")
# leaked non-gloss: a section sub-heading (all-caps run, numbered/roman heading, "vii.")
# or a bare cross-reference the gloss opened with ("9:5.", "12,13")
JUNK_HEAD = re.compile(r"^(?:[ivxlIVXL]+\.|\d+\s*[:.,]|[A-Z]{2,}\b)")

def make_note(after):
    """Bullinger's inline gloss = the prose right after the ref, up to its cross-refs."""
    after = after.lstrip(" .,:;")
    cuts = [m.start() for m in (NEXTREF.search(after), STOP.search(after)) if m]
    seg = after[:min(cuts)] if cuts else after[:200]
    seg = clean_note(seg)
    if JUNK_HEAD.match(seg):     # a section heading, not a gloss
        return ""
    if sum(c.isalpha() for c in seg) < 14:    # just a cross-reference chain
        return ""
    if len(seg) > 200:
        cut = seg.rfind(" ", 0, 200)
        seg = seg[:cut if cut > 120 else 200].rstrip() + "…"
    return seg

def load_text():
    pages = sorted(glob.glob(os.path.join(BULL_DIR, "page_*.html")),
                   key=lambda p: int(re.search(r"\d+", os.path.basename(p)).group()))
    if not pages:
        sys.exit(f"no EPUB pages under {BULL_DIR} (set $BULL_DIR)")
    return " ".join(re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ",
                    open(f, encoding="utf-8", errors="replace").read()))) for f in pages)

HEAD = re.compile(r"([A-Z][A-Za-zé'\-]+(?:[ \-][A-Z][a-zé'\-]+){0,3})\s*;\s*or,\s+[A-Z]")

def expand_merged(v, vmax):
    """A single verse, or an OCR-merged 4-digit range ("1924" -> 19..24) the hyphen was lost
    from. Returns the verse list (empty = unrecoverable, so it's dropped)."""
    if 1 <= v <= vmax:
        return [v]
    s = str(v)
    if len(s) == 4:
        a, b = int(s[:2]), int(s[2:])
        if 1 <= a < b <= vmax and b - a <= 25:
            return list(range(a, b + 1))
    return []

# Bullinger's citation tail after a "Book C:V": ", 5, 16" (more verses, same chapter) and
# "; 6:13" (a new chapter, same book). A comma-verse must NOT be followed by ":" (that would
# be its own chapter:verse), and "; …" must be digits (a book name after ";" ends the run).
CONT = re.compile(r"\s*(?:,\s*(\d+)(?!\s*[:.]\s*\d)|;\s*(\d+)\s*[:.]\s*(\d+))")
def continuation(text, pos, ch):
    out = []
    for _ in range(40):
        m = CONT.match(text, pos)
        if not m:
            break
        if m.group(1):
            out.append((ch, int(m.group(1))))          # ", v" — same chapter
        else:
            ch = int(m.group(2)); out.append((ch, int(m.group(3))))   # "; c:v" — same book
        pos = m.end()
    return out

def build_book(book, text, head_events):
    """head_events: sorted (pos, figure-id-or-None) from the shared figure headings."""
    b = BOOKS[book]
    vmax, chmax = (b["sc"], 1) if b["sc"] else (MAX_VERSE, b["max_ch"])
    # rx captures the FIRST verse (single-chapter) or chapter:verse; each match also pulls in
    # Bullinger's continuation tail (", v"/"; c:v") and expands OCR-merged 4-digit ranges.
    # refs entries: (start, ch, v, end, primary?) — only the primary verse carries the gloss.
    rx = re.compile("(?:" + b["rx"] + r")[a-z]*\.?\s*(\d+)" + ("" if b["sc"] else r"\s*[:.]\s*(\d+)"))
    refs = []
    for m in rx.finditer(text):
        ch0 = 1 if b["sc"] else int(m.group(1))
        vraw = int(m.group(1) if b["sc"] else m.group(2))
        prim = expand_merged(vraw, vmax)
        for i, vv in enumerate(prim):
            refs.append((m.start(), ch0, vv, m.end(), i == 0))     # gloss on the first only
        if prim:                                                   # continuations tag-only
            for cc, vv in continuation(text, m.end(), ch0):
                refs.append((m.start(), cc, vv, m.end(), False))

    events = head_events + [(s, ("r", ch, v, e, p)) for s, ch, v, e, p in refs]
    events.sort(key=lambda x: x[0])

    devices, cur = {}, None
    for pos, val in events:
        if val[0] == "h":
            cur = val[1]
            continue
        if not cur:
            continue
        _, ch, v, end, primary = val
        if not (1 <= ch <= chmax and 1 <= v <= vmax):     # OCR-mangled / out-of-range
            continue
        did, name, greek, group, definition = cur
        note = make_note(text[end:end + 240]) if primary else ""   # list members: tag only
        d = devices.setdefault(did, dict(id=did, name=name, greek=greek, group=group,
                                         definition=definition, occ={}))
        r = f"{b['name']} {ch}:{v}"
        if r not in d["occ"] or (not d["occ"][r] and note):
            d["occ"][r] = note

    def vkey(r):
        m = re.search(r"(\d+):(\d+)$", r); return (int(m.group(1)), int(m.group(2)))
    out = []
    for d in sorted(devices.values(), key=lambda d: -len(d["occ"])):
        occ = [{"ref": r, **({"note": n} if n else {})}
               for r, n in sorted(d["occ"].items(), key=lambda kv: vkey(kv[0]))]
        dd = {"id": d["id"], "name": d["name"]}
        if d["greek"]: dd["greek"] = d["greek"]
        dd["group"] = d["group"]; dd["definition"] = d["definition"]; dd["occurrences"] = occ
        out.append(dd)

    os.makedirs(OUT_DIR, exist_ok=True)
    json.dump({"book": b["osis"], "devices": out},
              open(os.path.join(OUT_DIR, f"{b['osis']}.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    verses = {o["ref"] for d in out for o in d["occurrences"]}
    occs = sum(len(d["occurrences"]) for d in out)
    notes = sum(1 for d in out for o in d["occurrences"] if o.get("note"))
    return len(out), occs, len(verses), notes

def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else "all"
    books = list(BOOKS) if arg.lower() == "all" else [arg]
    text = load_text()
    head_events = [(m.start(), ("h", FIG.get(norm_fig(m.group(1).strip())))) for m in HEAD.finditer(text)]
    tf = to = tv = tn = 0
    for book in books:
        nf, no, nv, nn = build_book(book, text, head_events)
        tf += nf; to += no; tv += nv; tn += nn
        print(f"  {BOOKS[book]['osis']:7} {nf:3} figs  {no:4} occ  {nv:4} verses  {nn:4} glosses")
    print(f"TOTAL across {len(books)} books: {to} occurrences, {tv} verses, {tn} glosses")

if __name__ == "__main__":
    main()
