#!/usr/bin/env python3
"""Remove leaked Perseus <bibl> citation labels from the GREEK text of the Xenophon Memorabilia,
keeping the positional morphology sidecar aligned.

THE DEFECT. Perseus marks the source of a quotation with a <bibl> element ("Hes. WD 309"). For
these four books that element's text leaked into the Greek stream, so the reader shows Latin
citation labels mid-sentence, Stanza tagged them as if they were Greek words (giving nonsense
lemmas like 'Wί' and 'Tίγνομαι'), and they answer to corpus search.

The line reference is worse than the label: it is glued to the FOLLOWING Greek word, so the
scan that only looks for Latin letters misses it —

    ... ἀεργίη δέ τʼ ὄνειδος·  Hes.  WD  309τοῦτο  δὴ  λέγειν ...
                               ^^^^  ^^  ^^^

'Hes.' and 'WD' are droppable tokens; '309τοῦτο' is a real Greek word wearing a number, and
dropping it would delete τοῦτο from the text.

WHY THE SIDECAR MAKES THIS DELICATE. <work>.morph.json is keyed by "<chapter>.<verse>" and its
value is a POSITIONAL array: element j is the analysis of the j-th whitespace token of that
verse (see build-texts-morph.py, and GreekWords.tsx's `analyses?.[wi]`). Drop a token from the
Greek without dropping its entry and every parse after it in that verse shifts by one — a silent
corruption that looks like a tagger error. The blast radius is one verse, not the book, because
the array is per verse; that is the only thing that makes this safe to do by hand.

PARSES FOR THE REPAIRED WORDS. A word freed from its number needs a real analysis, and the
Stanza 'grc' model that produced the rest of the sidecar is not installed here. Rather than
invent parses, each one below is the analysis THIS SAME TAGGER already gave that identical
surface form elsewhere in the corpus, chosen with the sentence in view where the form is
ambiguous. The reasoning is recorded per entry; `--why` prints it.

Idempotent: run it twice and the second run reports nothing to do.

Usage:
    python3 scripts/fix-perseus-citation-leaks.py --check     # report, change nothing
    python3 scripts/fix-perseus-citation-leaks.py --apply
    python3 scripts/fix-perseus-citation-leaks.py --why       # the parse justifications
"""
import argparse, json, re, sys
from pathlib import Path

BASE = Path("public/data/greco")
WORKS = [f"xenophon-memorabilia-{n}" for n in (1, 2, 3, 4)]

GREEK = re.compile(r'[Ͱ-Ͽἀ-῿]')
LATIN_OR_DIGIT = re.compile(r'[A-Za-z0-9]')
# A citation fragment welded to the front of a Greek word: Latin letters and/or a numeric
# reference ("309", "2.188"), immediately followed by Greek.
FUSED = re.compile(r'^(?P<leak>[A-Za-z0-9][A-Za-z0-9.]*?)(?=[Ͱ-Ͽἀ-῿])')

# Analyses for the words uncovered by stripping a fused prefix, keyed by
# (work, chapter, verse, surface). Explicit rather than derived: a wrong parse here is worse
# than no parse, and there are seven of them.
REPAIRED_PARSE = {
    ("xenophon-memorabilia-1", 2, 20, "καὶ"): (
        ["καί", "Conjunction"],
        "«…ἀπολεῖς καὶ τὸν ἐόντα νόον, [Theognis] καὶ ὁ λέγων·» — joins the two quoted poets. "
        "Conjunction is also the tagger's majority for καὶ (162,669 of 202,155)."),
    ("xenophon-memorabilia-1", 2, 56, "τοῦτο"): (
        ["οὗτος", "Pronoun, Accusative, Neuter, Singular"],
        "«τοῦτο δὴ λέγειν αὐτόν» — object of λέγειν, so accusative. Matches the tagger's "
        "majority for τοῦτο (5,501 accusative vs 1,010 nominative)."),
    ("xenophon-memorabilia-1", 2, 58, "ταῦτα"): (
        ["οὗτος", "Pronoun, Accusative, Neuter, Plural"],
        "«ταῦτα δὴ αὐτὸν ἐξηγεῖσθαι» — object of ἐξηγεῖσθαι, so accusative. Majority for "
        "ταῦτα is likewise accusative (6,369 vs 847)."),
    ("xenophon-memorabilia-1", 3, 3, "καὶ"): (
        ["καί", "Conjunction"],
        "«καὶ πρὸς φίλους δὲ καὶ ξένους» — plain connective."),
    ("xenophon-memorabilia-2", 1, 20, "μαρτυρεῖ"): (
        ["μαρτυρέω", "Verb, Present, Active, Indicative, 3rd, Singular"],
        "«μαρτυρεῖ δὲ καὶ Ἐπίχαρμος» — Epicharmus testifies. Unambiguous: all 102 occurrences "
        "of μαρτυρεῖ in the corpus carry this analysis."),
    ("xenophon-memorabilia-2", 6, 11, "ταύτην"): (
        ["οὗτος", "Adjective, Accusative, Feminine, Singular"],
        "THE ONE JUDGEMENT CALL. «ταύτην οὖν, ἔφη, τὴν ἐπῳδήν» is attributive — it modifies "
        "τὴν ἐπῳδήν. Standalone, this tagger calls ταύτην a Pronoun (988 vs 258); in "
        "attributive position (ταύτην … τὴν) it flips to Adjective (450 vs 311). A 59/41 "
        "split, so this is the one entry a reader might reasonably want the other way."),
    ("xenophon-memorabilia-3", 2, 2, "ἆρά"): (
        ["ἆρα", "Adverb"],
        "«ἆρά γε ὅτι…» — the interrogative particle opening the question. Adverb is the "
        "tagger's label in 53 of 60 occurrences."),
}


def scan_verse(greek):
    """Tokens needing work: (index, token, 'drop'|'strip', leak_text)."""
    out = []
    for i, tok in enumerate(greek.split()):
        if not LATIN_OR_DIGIT.search(tok):
            continue
        if GREEK.search(tok):
            m = FUSED.match(tok)
            if not m:
                out.append((i, tok, "unhandled", ""))   # Latin welded somewhere other than the front
            else:
                out.append((i, tok, "strip", m.group("leak")))
        else:
            out.append((i, tok, "drop", tok))
    return out


def process(work, apply):
    src = BASE / f"{work}.json"
    msrc = BASE / f"{work}.morph.json"
    data = json.loads(src.read_text())
    morph = json.loads(msrc.read_text())
    edits, problems = [], []

    for ch in data["chapters"]:
        for v in ch["verses"]:
            greek = v.get("greek") or ""
            hits = scan_verse(greek)
            if not hits:
                continue
            key = f"{ch['number']}.{v['number']}"
            toks = greek.split()
            entries = morph.get(key)

            # Refuse to touch a verse whose sidecar is not already aligned: the whole repair
            # rests on index j meaning token j, and if that is not true here it is not true
            # after the edit either.
            if entries is None:
                problems.append(f"{key}: no morph entry"); continue
            if len(entries) != len(toks):
                problems.append(f"{key}: sidecar {len(entries)} vs {len(toks)} tokens — NOT aligned")
                continue
            # The rejoin below is only lossless if the text is single-spaced. Proven, not assumed.
            if " ".join(toks) != greek.strip():
                problems.append(f"{key}: whitespace is not a simple single-space join"); continue
            if any(kind == "unhandled" for _, _, kind, _ in hits):
                problems.append(f"{key}: leak not at the front of a token: "
                                f"{[t for _, t, k, _ in hits if k == 'unhandled']}")
                continue

            new_toks, new_entries, notes = [], [], []
            for i, tok in enumerate(toks):
                hit = next((h for h in hits if h[0] == i), None)
                if hit is None:
                    new_toks.append(tok); new_entries.append(entries[i]); continue
                _, _, kind, leak = hit
                if kind == "drop":
                    notes.append(f"drop {tok!r}")
                    continue                       # token AND its analysis go together
                word = tok[len(leak):]
                pk = (work, ch["number"], v["number"], word)
                if pk not in REPAIRED_PARSE:
                    problems.append(f"{key}: no parse recorded for {word!r} (freed from {tok!r})")
                    new_toks.append(tok); new_entries.append(entries[i]); continue
                analysis = REPAIRED_PARSE[pk][0]
                notes.append(f"{tok!r} -> {word!r}, parse {entries[i]} -> {analysis}")
                new_toks.append(word); new_entries.append(analysis)

            if apply:
                v["greek"] = " ".join(new_toks)
                morph[key] = new_entries
            edits.append((key, len(toks) - len(new_toks), notes))

    if apply and edits and not problems:
        src.write_text(json.dumps(data, ensure_ascii=False))
        msrc.write_text(json.dumps(morph, ensure_ascii=False))
    return edits, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--why", action="store_true")
    a = ap.parse_args()

    if a.why:
        for (w, c, vv, surf), (an, why) in REPAIRED_PARSE.items():
            print(f"{w} {c}:{vv}  {surf}\n    {an}\n    {why}\n")
        return

    total, bad = 0, 0
    for work in WORKS:
        edits, problems = process(work, apply=a.apply)
        if problems:
            bad += len(problems)
            print(f"{work}: PROBLEMS")
            for p in problems: print(f"    {p}")
        for key, removed, notes in edits:
            total += removed
            print(f"{work} {key}: -{removed} token(s)")
            for n in notes: print(f"    {n}")
        if not edits and not problems:
            print(f"{work}: clean")
    print(f"\n{'APPLIED' if a.apply else 'DRY RUN'} — {total} token(s) removed"
          + (f", {bad} problem(s)" if bad else ""))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
