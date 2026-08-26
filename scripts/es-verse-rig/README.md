# Spanish translation rig for per-verse Greco-Roman works

Used for the Plato dialogues (chapter = Stephanus page, verse = section a–e) and any other
`public/data/greco/<slug>.json` corpus whose chapters hold several verses.

The three steps, for a work with slug `plato-gorgias`:

    mkdir -p ~/gorgias && cd ~/gorgias

    # 1. Dump the corpus to a flat, readable file: === ch:verse (ref) === / [GRC] / [EN]
    python3 <repo>/scripts/es-verse-rig/dump.py plato-gorgias

    # 2. Translate in batches of 3-4 chapters into gor-b1.json, gor-b2.json, ...
    #    shaped {"<chapter>": {"<verse>": "<Spanish>", ...}, ...}
    #    After each batch, set-compare its verse ids against the corpus:
    python3 <repo>/scripts/es-verse-rig/check.py plato-gorgias gor-b1.json

    # 3. Merge every batch, verify completeness, write per-chapter files, print ratios:
    python3 <repo>/scripts/es-verse-rig/write.py plato-gorgias gor \
      "Traducción propia del griego de Perseus (Platón, Gorgias)." \
      "Traducción al español hecha para esta aplicación."

Then: add one line to `ES_ENGLISH_PROSE_WORKS` in `src/lib/spanish-texts.ts`, run
`npx tsc --noEmit`, rebuild the search index with
`npx tsx scripts/build-backgrounds-search.ts`, and confirm the es greco-roman facet grew by
**exactly the verse count** (per-verse works add verses, never chapters).

Notes:
- `check.py` REWRITES the batch file, stripping any empty verses, before comparing.
- `write.py` reads batches from `$ES_BATCH_DIR`, defaulting to the current directory.
- Ratios below 0.7 mean a truncated batch; above 2.2, padding. Blank verse runs longer, so
  ratios >1 are normal for poetry.
