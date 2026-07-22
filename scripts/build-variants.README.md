# build-variants.py — New Testament manuscript collation data

Generates the data for the Exegesis **Variants** tab: a Swanson-style collation that shows,
for each verse, one word-aligned line per manuscript witness against the Byzantine majority
reference, so students can see where the textual traditions diverge.

## Source & license

Witness transcriptions come from the **Center for New Testament Restoration** (Alan Bunning),
[`github.com/Center-for-New-Testament-Restoration/transcriptions`](https://github.com/Center-for-New-Testament-Restoration/transcriptions),
released under **CC BY-SA 4.0**. The build uses:

- `class 1/` — the early great uncials (`01`=ℵ, `02`=A, `03`=B, `04`=C, `05`=D, `032`=W, …)
  and ~90 papyri (`P66`, `P75`, `P45`, `P46`, `P47`, `P72`, …). CNTR's scope is manuscripts
  up to c. 400, so later minuscules (L, Θ, f¹, f¹³, 33 …) are intentionally **not** included.
- `critical texts/RP.txt` — the Robinson–Pierpont Byzantine Majority Text, used as the
  reference line each witness is compared against.

The `.txt` files use CNTR's **Manuscript Encoding Specification (MES)**: `<verse-id> text`,
one verse per line, with codes for line/page breaks, nomina sacra (`=ιυ`), corrections
(`{x…a…}`), lacunae, etc. `strip_mes()` normalises these to plain word tokens.

Attribution (CC BY-SA) is surfaced in the tab's "Sources & copyright" menu.

## Running

```bash
cd seminary-greek-reader/scripts
python3 build-variants.py all          # whole NT → public/data/variants/<Osis>_<ch>.json
python3 build-variants.py John Matt:12 # a book, or a single Book:chapter
```

On first run it **auto-downloads** the CNTR transcriptions (~10 MB) into `scripts/cntr/`
(git-ignored) and reuses that cache afterwards. `ensure_cache()` handles the local stale
root-cert issue by falling back to `/etc/ssl/cert.pem`.

Output: one minified JSON per chapter (~38 MB total for the whole NT) in
`public/data/variants/`, fetched on demand by `VariantsView`.

## Output schema (per chapter)

```jsonc
{
  "book": "John", "chapter": 1, "reference": "John 1",
  "witnesses": [{ "wid": "RP", "sigil": "𝔐", "family": "byzantine" }, …],
  "verses": [{
    "verse": 1, "vid": "43001001",
    "refTokens": ["Ἐν", "ἀρχῇ", …],          // the RP reference line
    "rows": [{ "wid": "P66", "sigil": "𝔓66", "family": "alexandrian",
               "cells": ["εν", "αρχη", …] }, …],
    "lac": ["𝔓5", "C"]                        // witnesses physically absent at this verse
  }, …],
  "source": "…CC BY-SA 4.0…"
}
```

Every row's `cells` share one column layout (RP reference columns + shared insertion columns
from a per-witness `difflib` pass). Each cell is just the witness's word for that column
(`""` = omission or an unused insertion slot). The renderer recomputes "differs" and "omits"
against whichever reference the reader selects, so no per-cell flags are stored — which also
keeps the data small. Printed editions (SR, WH, TR) are included as extra `critical` rows.

Per-witness display metadata (date, provenance, contents, significance) for the info popup
lives separately in `src/lib/witness-info.ts`.

## Known limitations / TODO

- **Transpositions/insertions** can collapse into a single cell (e.g. 𝔓75 John 1:18 shows a
  doubled `εορακεν`); a proper multiple-sequence alignment would fix column-splitting.
- **Corrector hands** (ℵ*, ℵᶜ) are currently folded into the base reading rather than shown
  as separate rows.
- Uncials display **unaccented lowercase** (the CNTR majuscule convention); an accent overlay
  or toggle could be added.
- Identical readings are shown on separate lines rather than grouped onto one line with
  multiple sigla (as printed Swanson does).
