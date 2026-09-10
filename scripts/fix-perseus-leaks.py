#!/usr/bin/env python3
"""Remove leaked Perseus apparatus from the GREEK text of the Texts-library prose, keeping each
work's positional morphology sidecar aligned.

THE DEFECT. Perseus's TEI marks a quotation's source with <bibl> ("Hom. Il. 2.188"), and marks
notes, stage directions and formatting with elements of their own. Where the conversion took an
element's text content without excluding those, the apparatus landed in the Greek stream: the
reader shows Latin mid-sentence, Stanza tagged it as Greek (giving lemmas like 'Wί'), and it
answers to Greek search. 1,971 tokens across 81 works.

IT IS NOT ONE DEFECT, and the difference matters more than the count:

  drop      a standalone Latin label or bare line number — 'Hom.', 'Il.', 'Bergk,', '309'
  strip     apparatus welded to the FRONT or BACK of a real Greek word — '11.263ὅτι',
            'πύλαςEur.'. Dropping the token would delete the Greek word with it.
  REFUSE    everything below, which this script reports and does not touch:
              · Beta Code   'lo/gou', 'xrh/sews', '*kuri/as' — this is the actual GREEK TEXT in
                an unconverted encoding (λόγου, χρήσεως, Κυρίας). Deleting it deletes the work.
              · mid-word    'Ἕλληνας2καὶ', 'ὥς2περ' — a footnote number swallowed the space
                between two words, or landed inside one. The first must become two tokens and
                the second one token, and only reading the passage tells you which.
              · homoglyph   'Σεπτίμιoς' (Latin o), 'ΜΑΡΤΥΡIΑΙ.' (Latin I) — a letter to repair,
                not a token to remove.
              · plutarch-natural-phenomena, whose 690 "Greek" tokens are Latin: the Aetia
                Physica partly survives only in a Latin translation, so that is likely the text
                rather than a defect, and it is a content question, not a cleanup.

WHY THE SIDECAR MAKES THIS DELICATE. <work>.morph.json is keyed "<chapter>.<verse>" and its
value is a POSITIONAL array: element j analyses the j-th whitespace token of that verse. Drop a
token without dropping its entry and every parse after it in the verse shifts by one — silent
corruption that reads as a tagger error. The array is per verse, so the blast radius is one
verse; that is the only thing making this safe in bulk. Any verse whose sidecar is already
misaligned is refused rather than edited.

PARSES FOR STRIPPED WORDS. A word freed from its apparatus needs an analysis, and the Stanza
'grc' model that produced the sidecars is not installed here. Each parse is taken from what THIS
SAME TAGGER gave that identical surface form elsewhere in the corpus, and only when that
analysis is at least PARSE_CONFIDENCE of its occurrences; below that the entry is set to null
(the sidecar's own "not analysable"). A missing parse is a small gap in the parsing pane. A
confidently wrong one corrects a student at the moment he is least able to judge.

Idempotent. Usage:
    python3 scripts/fix-perseus-leaks.py --check
    python3 scripts/fix-perseus-leaks.py --apply
"""
import argparse, json, re, sys, collections
from pathlib import Path

BASE = Path("public/data/greco")
SKIP_WORKS = {"plutarch-natural-phenomena"}     # Latin text, not a leak — see the docstring
PARSE_CONFIDENCE = 0.80

GREEK_CH = r'Ͱ-Ͽἀ-῿'
GREEK = re.compile(f'[{GREEK_CH}]')
NONGRK = re.compile(r'[A-Za-z0-9]')
# Beta Code: an accent marker (/ \ =) directly after a letter, or the capital sigil '*' at the
# front. Deliberately NOT '(' or ')' on their own — those are the breathing marks in Beta Code
# but they are also ordinary parentheses, and '(Bergk)' is an editor's name, not Greek. Testing
# for them cost nothing but a wave of false refusals on exactly the citation labels this is for.
BETA = re.compile(r'(^\*)|([a-zA-Z][\\/=])')
# Leaked XML: attribute fragments and tag debris. Checked BEFORE Beta Code, because 'rend="…"'
# contains a letter followed by '=' and would otherwise read as an accent.
MARKUP = re.compile(r'(rend=|/?div>|<|>|&[a-z]+;|^lt|gt$)')
LEAD = re.compile(f'^([^{GREEK_CH}]+)')
TRAIL = re.compile(f'([^{GREEK_CH}]+)$')
# Punctuation that legitimately hugs a Greek word and must NOT be stripped as apparatus.
GREEK_PUNCT = set('.,·;:!?()[]«»—–-’ʼ᾽·"\'’ʼ')


def build_parse_table():
    """surface form -> (analysis, share) from every aligned sidecar in the library."""
    tally = collections.defaultdict(collections.Counter)
    for src in sorted(BASE.glob("*.json")):
        if src.name.endswith(".morph.json"):
            continue
        msrc = src.with_suffix(".morph.json")
        if not msrc.exists():
            continue
        try:
            data, morph = json.loads(src.read_text()), json.loads(msrc.read_text())
        except Exception:
            continue
        for ch in data.get("chapters") or []:
            for v in ch.get("verses") or []:
                e = morph.get(f"{ch['number']}.{v['number']}")
                toks = (v.get("greek") or "").split()
                if not e or len(e) != len(toks):
                    continue
                for t, a in zip(toks, e):
                    if a:
                        tally[t][tuple(a)] += 1
    out = {}
    for surface, counter in tally.items():
        (best, n), total = counter.most_common(1)[0], sum(counter.values())
        out[surface] = (list(best), n / total)
    return out


def plan_token(tok):
    """(action, payload). action in drop | strip | refuse."""
    if not NONGRK.search(tok):
        return None, None
    if MARKUP.search(tok):
        return "refuse", "leaked XML markup"
    if BETA.search(tok):
        return "refuse", "beta code (unconverted Greek)"
    if not GREEK.search(tok):
        return "drop", tok
    # Strip the APPARATUS only, never the punctuation the Greek legitimately carries. The run
    # removed starts at the first alphanumeric character, so a quotation mark in front of the
    # marker survives: '"3Εἰ' is the opening of a quotation and must come out as '"Εἰ', not 'Εἰ'.
    # Likewise 'νέκυσσιν.Hom.' keeps its full stop and loses only the citation.
    lead = LEAD.match(tok)
    lead_txt = lead.group(1) if lead else ""
    m = NONGRK.search(lead_txt)
    keep_head, lead_txt = (lead_txt[:m.start()], lead_txt[m.start():]) if m else (lead_txt, "")
    trail = TRAIL.search(tok)
    trail_txt = trail.group(1) if trail else ""
    m = NONGRK.search(trail_txt)
    trail_txt = trail_txt[m.start():] if m else ""
    keep_tail = ""
    body = tok[len(keep_head) + len(lead_txt): len(tok) - len(trail_txt) if trail_txt else len(tok)]
    core = keep_head + body + keep_tail
    if NONGRK.search(core):
        return "refuse", "non-Greek inside the word (footnote marker or homoglyph)"
    if not core.strip(''.join(GREEK_PUNCT)):
        return "refuse", "nothing but punctuation would remain"
    # A single Greek letter freed from a NUMBER is not a word — it is the letter half of a
    # fragment number ('Simonides fr. 26β', 'fr. 30β'), so the whole token is citation and
    # stripping would leave a stray β in the text. Reported rather than guessed at.
    if len(body.strip(''.join(GREEK_PUNCT))) == 1 and lead_txt and not re.search(r'[A-Za-z]', lead_txt):
        return "refuse", "single Greek letter after a number — looks like a fragment number (26β)"
    return "strip", core


def process(work, parses, apply):
    src, msrc = BASE / f"{work}.json", BASE / f"{work}.morph.json"
    data = json.loads(src.read_text())
    morph = json.loads(msrc.read_text()) if msrc.exists() else None
    dropped = stripped = nulled = 0
    refused, notes = [], []
    for ch in data.get("chapters") or []:
        for v in ch.get("verses") or []:
            greek = v.get("greek") or ""
            toks = greek.split()
            if not any(NONGRK.search(t) for t in toks):
                continue
            key = f"{ch['number']}.{v['number']}"
            entries = morph.get(key) if morph is not None else None
            if morph is not None:
                if entries is None:
                    refused.append(f"{key}: no sidecar entry"); continue
                if len(entries) != len(toks):
                    refused.append(f"{key}: sidecar {len(entries)} vs {len(toks)} tokens — already misaligned"); continue
            if " ".join(toks) != greek.strip():
                refused.append(f"{key}: whitespace is not a plain single-space join"); continue

            # A page-break marker ('"' plus a note number) that Perseus set at a line end, which
            # in Polybius repeatedly falls INSIDE a word: 'ὑπὸ χει" 1μῶνος' is χειμῶνος, and
            # 'Ῥω" 1μαίοις' is Ῥωμαίοις. Stripping the digit alone yields 'χει" μῶνος' — still
            # broken, and now harder to spot. Repairing it means MERGING two tokens (and their
            # two analyses) into one, sometimes, and only reading the line says which. Refuse.
            for i, t in enumerate(toks):
                if re.match(r'^\d', t) and i and toks[i - 1].endswith('"'):
                    refused.append(f"{key}: {toks[i-1]!r} + {t!r} — page-break marker splitting a word")
                if '#' in t:
                    refused.append(f"{key}: {t!r} — unrecognised marker")
            if any(r.startswith(f"{key}:") for r in refused[-len(toks):] if True) and \
               any(f"{key}:" in r for r in refused[-4:]):
                pass
            if [r for r in refused if r.startswith(f"{key}:")]:
                continue

            plans = [plan_token(t) for t in toks]
            bad = [(toks[i], p[1]) for i, p in enumerate(plans) if p[0] == "refuse"]
            if bad:
                for t, why in bad:
                    refused.append(f"{key}: {t!r} — {why}")
                continue                                  # leave the whole verse alone

            new_toks, new_entries = [], []
            for i, (tok, (action, payload)) in enumerate(zip(toks, plans)):
                if action is None:
                    new_toks.append(tok)
                    if entries is not None: new_entries.append(entries[i])
                    continue
                if action == "drop":
                    dropped += 1
                    notes.append(f"{key} drop {tok!r}")
                    continue
                core = payload
                stripped += 1
                analysis, share = parses.get(core, (None, 0.0))
                if analysis is None or share < PARSE_CONFIDENCE:
                    analysis = None
                    nulled += 1
                notes.append(f"{key} {tok!r} -> {core!r}"
                             + ("" if analysis else "  [parse set to null: no confident match]"))
                new_toks.append(core)
                if entries is not None: new_entries.append(analysis)

            if apply:
                v["greek"] = " ".join(new_toks)
                if morph is not None: morph[key] = new_entries

    if apply and (dropped or stripped):
        src.write_text(json.dumps(data, ensure_ascii=False))
        if morph is not None: msrc.write_text(json.dumps(morph, ensure_ascii=False))
    return dropped, stripped, nulled, refused, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--verbose", action="store_true")
    a = ap.parse_args()

    print("building the parse table from every aligned sidecar…", file=sys.stderr)
    parses = build_parse_table()
    print(f"  {len(parses)} distinct surface forms\n", file=sys.stderr)

    td = ts = tn = 0
    all_refused = []
    for src in sorted(BASE.glob("*.json")):
        if src.name.endswith(".morph.json"):
            continue
        work = src.stem
        if work in SKIP_WORKS:
            continue
        d, s, n, refused, notes = process(work, parses, a.apply)
        td += d; ts += s; tn += n
        if d or s or refused:
            print(f"{work}: -{d} dropped, {s} stripped ({n} without a confident parse), {len(refused)} refused")
            if a.verbose:
                for x in notes: print(f"    {x}")
        for r in refused:
            all_refused.append(f"{work} {r}")

    print(f"\n{'APPLIED' if a.apply else 'DRY RUN'}: {td} dropped, {ts} stripped, {tn} of those left without a parse")
    print(f"REFUSED (untouched, need a human): {len(all_refused)}")
    for r in all_refused[:40]:
        print(f"    {r}")
    if len(all_refused) > 40:
        print(f"    … and {len(all_refused) - 40} more")


if __name__ == "__main__":
    main()
