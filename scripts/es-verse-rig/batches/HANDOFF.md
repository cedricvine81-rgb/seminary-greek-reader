# Spanish translation — Greco-Roman prose (Diogenes Laertius, then Xenophon)

Our own Spanish, made **directly from the Perseus Greek**, not from the English. The English
(Hicks for DL, Marchant for Xenophon) is a crib for proper names and book references only.

## The rig — use the IN-REPO one, not the Homer rig

`~/dev/seminary-greek-reader/scripts/es-verse-rig/` (dump.py / check.py / write.py). It is
built for exactly this: `public/data/greco/<slug>.json` corpora whose chapters hold several
verses. The Homer rig (`~/dev/es-homer/lines.py`) is for VERSE and enforces one Spanish line
per Greek line — wrong tool here; these works are prose, one paragraph per section.

    cd ~/dev/es-greco/dl
    python3 <repo>/scripts/es-verse-rig/dump.py diogenes-laertius      # already done
    # translate into dl-bNNN.json, shaped {"<book>": {"<section>": "<Spanish>"}}
    python3 <repo>/scripts/es-verse-rig/check.py diogenes-laertius dl-b001.json
    python3 <repo>/scripts/es-verse-rig/write.py diogenes-laertius dl "<source>" "<note>"

⚠ **`check.py` compares a batch against the WHOLE book**, so it only reads clean when that
book is finished. It is a completeness guard for the book, not a per-batch check — do not
chase its "MISMATCH" line mid-book. It also REWRITES the batch file, stripping empty verses.

## State

**Diogenes Laertius — ✅ COMPLETE: 1,204 of 1,204 sections, all ten books, SHIPPED.**
- Book 1 (§§1-122, `dl/dl-b001.json`): `check.py` clean, ratio 1.144, per-section 0.985-1.315.
- Book 2 (§§1-144, `dl/dl-b002.json`): `check.py` clean, ratio 1.127, per-section 0.966-1.345.
- Book 3 (§§1-109, `dl/dl-b003.json`): `check.py` clean, ratio 1.138, per-section 0.944-1.394.
- Book 4 (§§1-67, `dl/dl-b004.json`): `check.py` clean, ratio 1.158, per-section 1.011-1.395.
- Book 5 (§§1-94, `dl/dl-b005.json`): `check.py` clean, ratio 1.174, per-section 0.960-1.547.
- Book 6 (§§1-105, `dl/dl-b006.json`): `check.py` clean, ratio 1.152, per-section 1.005-1.347.
Book 7 (Stoics) done: 202 secciones, ratio 1.160 (low = 7:69 at 0.914, verified complete — pure taxonomy of axiom-types, same innocent cause as 3:49).
Book 8 (Pythagoras/Empedocles) done: 91 secciones, ratio 1.135, lowest 8:74 = 0.986 — nothing under the floor.
Book 9 (Heraclitus→Pyrrho/Timon) done: 116 secciones, ratio 1.173, lowest 9:102 = 1.038 — clean.
Book 10 (Epicurus) done: 154 secciones, ratio 1.147, lowest 10:19 = 0.935 (verified complete — the
testament's repeated proper-name pairs + compressed legal formulae, an innocent low like 3:49 and 7:69).

SHIPPED 2026-09-08. What was run, in order:
  1. write.py diogenes-laertius dl "<source>" "<note>"  -> 10 chapters / 1204 verses, ratio min 1.13 max 1.17
  2. registered `'greco-diogenes-laertius': 'greco/diogenes-laertius'` in ES_ENGLISH_PROSE_WORKS
     (src/lib/spanish-texts.ts) — the greco- PREFIX is the catalogue id, unlike the Plato slugs
  3. src/lib/i18n/text-names.ts already had the title ("Vidas de los filósofos") — nothing to add
  4. npm run i18n:texts   -> Greco-Roman 429/429, everything 100%
  5. npx tsc --noEmit      -> clean
  6. npx tsx scripts/build-backgrounds-search.ts -> es greco-roman facet 16,579 -> 17,783 = +1,204 exactly,
     all six es shards present

Per-book ratios: 1→1.144, 2, 3, 4, 5, 6, 7→1.160, 8→1.135, 9→1.173, 10→1.147.

NEXT WORK: Xenophon, Memorabilia (608 sections) — not started. Same rig, same shape.
⚠ ratio-audit gotcha: when deriving the per-book ratio script by sed, the "other books" guard regex must be `^=== (8|10):` — an alternation like `[8]|^=== 10:` silently swallows the WHOLE next book into the last section (9:116 read 0.007).

⚠ The 0.95 ratio floor is tuned for narrative. Sections that are pure TAXONOMY (strings of
Greek compound adjectives in -ικος, each becoming one shorter Spanish word) sit legitimately
below it: 3:49 reads 0.944 and is complete. Verify such a section against the Greek rather
than padding it. The Divisions (3:80-109) as a whole are fine at 1.115.
Per-book sizes: 1→122, 2→144, 3→109, 4→67, 5→94, 6→105, 7→202,
8→91, 9→116, 10→154.

**Xenophon, Memorabilia — not started.** 4 works, 608 sections
(`xenophon-memorabilia-1..4`), same shape, same rig.

## Scale — read this before promising a date

DL is **~694,000 Greek characters**, which is the whole Odyssey again in bulk, but as dense
expository prose with a constant stream of proper names, book titles and quoted epigrams.
Sustained pace is roughly **10-12 sections per working pass**. Xenophon adds 608 sections.

## Conventions settled so far

- Register: plain, close, unpadded — the same voice as the Josephus and Plutarch Spanish.
- DL is a compiler quoting sources: keep his reported-speech chain in the Spanish
  ("dice que… y que…"), do not smooth it into direct assertion.
- Work titles are translated (`Περὶ φύσεως` → "Sobre la naturaleza", `Διαδοχή` → "Sucesión");
  personal and place names take their established Spanish forms (Ferecides, Anacarsis,
  Clitómaco, Citio, Estagira).
- Verse quotations inside the prose stay inside the same section, in « », not broken out.
- Editorial angle brackets in the Greek (`〈…〉`) are kept as ⟨…⟩.
- Ratio band for this prose: **1.13 over the first 32 sections**, per-section 0.99–1.23.
  Sections thick with numerals run lowest (1:2 = 0.99) and are not a defect. Anything under
  ~0.95 is worth re-reading against the Greek for a dropped clause.

## When a work is finished

`write.py` → one line in `ES_ENGLISH_PROSE_WORKS` (`src/lib/spanish-texts.ts`), keyed by the
CATALOGUE ID — for DL that is **`greco-diogenes-laertius`**, not `diogenes-laertius`; the
GRECO_CATALOG uses the `greco-`-prefixed slug as its id (Epictetus is the same). Then
`npx tsc --noEmit`, add the Spanish title to `src/lib/i18n/text-names.ts` and re-run
`npm run i18n:texts` (it must stay at 100%), rebuild the search index, and confirm the es
greco-roman facet grew by **exactly the section count**.

⚠ **Corrupt numerals in the book-lists.** Xenocrates' catalogue (4:13-14) carries numerals the
manuscripts have mangled (Θέσεων βιβλία κμγ′, βιβλία ιδμαβψμ′, Στίχοι μκβδσλθ′). I adopted the
standard editorial readings — 20 books of Theses, 14 on dialectic, 224,239 lines — rather than
transliterating gibberish or inventing a figure. Same policy anywhere else a numeral is broken:
take the received editorial reading, do not guess a new one.

⚠ **Book-list enumerations run the ratio high, correctly.** Where the Greek writes a compact
run of numerals (α′ β′ γ′ … ιη′) DL is enumerating, so the Spanish enumerates too — "uno, dos,
tres…" — rather than summarising it as "uno a dieciocho". That is why Theophrastus' catalogue
(5:43-46) reads 1.46-1.55. Do not "fix" these down; a summary there would be under-translation.
