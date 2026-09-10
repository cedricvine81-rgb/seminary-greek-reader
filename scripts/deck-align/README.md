# Deck ⇄ app exercise alignment

The lesson PowerPoints are the SOURCE OF TRUTH for classroom exercises; the Grammar page's
homework packs (`src/data/grammar-homework.ts`, `grammar-homework-slides.ts`) are aligned TO
them, never the reverse. Every deck exercise slide carries a marker

    * Application exercise — Grammar › <chapter> › “<pack title>”

and the two sides join on that title.

## Auditing

    python3 audit.py          # per pack: deck sentences missing from the app, and vice versa

`deckread.py` is the ONE canonical slide reader — import it rather than re-rolling a join.
Join runs within a shape with nothing, shapes with a newline, count `graphicFrame` as a shape,
and sort shapes by (y bucketed to 0.1", x): every English answer is its own text box in
CREATION order, so document order pairs answers to the wrong sentences.

## Things that made earlier comparisons wrong

- **Wrapped lines are separate `<a:p>` paragraphs.** Rejoin them before matching or every
  wrapped item reports as both a deck-only fragment and an app-only sentence.
- **`∙`/`·` is the ano teleia — Greek's mid-sentence colon, NOT a full stop.** Treating it as
  terminal chops sentences in half.
- **Q/A slide pairs** repeat the same Greek; group by PACK (a set union) rather than by slide,
  which also collects an exercise that runs over several slides.
- **The banner title sits at y≈0.28"; the ITEMS shape starts at y≈1.30".** A title-band cutoff
  of 1.31" swallows the items whole and they vanish silently.
- **An instruction line ENDS WITH A COLON.** Matching on its opening word drops the answer
  "What do you say about him?", which breaks the answer count and voids the whole slide.
- Two decks (a Beginning deck and its Intermediate twin) may name the SAME pack and have since
  diverged from each other — score each deck separately.

## Generating word records (`gnt.py` / `draft.py` / `final.py`)

Greek comes from the decks; parsing from the GNT index in `public/data/gnt`; glosses from BGVB.
Do NOT run the authoring validators over deck material — they check what *I* invent, and they
reject regularly-formed liquid futures (`μενοῦμεν`) that are absent from the GNT by accident of
the corpus, not by error.

- **Look up the accented form FIRST, then accents-off-breathings-kept, then bare.** `αὑτη`
  ("this", οὗτος) and `αὐτη` ("she", αὐτός) differ only by breathing; collapsing to bare letters
  picks the wrong word.
- **A noun or adjective after an article agrees with it.** Without that pass `τας καρδιας` reads
  as a genitive singular, simply because that is the commoner form of καρδιας in the GNT.
- **μή takes the aorist SUBJUNCTIVE, never the aorist imperative** — the GNT majority for
  `φοβηθητε` is imperative, but every one of those is μή-less.
- This GNT edition lacks some perfectly regular forms (it reads ραββει, and has no nominative
  plural ἀγαθοί or present πορεύονται). Those go in `draft.OVERRIDE`, explicitly.
- Personal pronouns carry no case in the GNT records, so `σοι`/`ὑμιν` come out with an empty
  parsing; BGVB gives closed-class words no gloss. Both need explicit entries.
- **A sentence the app already carries elsewhere is COPIED whole**, words and all — regenerating
  it only invites a fresh disagreement with the reviewed version.

## Writing back

`insert.py` appends, `deweld.py` removes a sentence, `reorder.py` restores the deck's own
presentation order. `dump_packs.mjs` reads the packs — **`npx tsx` cannot import those files**
("does not provide an export named GRAMMAR_HOMEWORK_SETS"), so it slices the array literal out
and evals it; anchor on the DECLARATION, since the identifier also appears in the file header.
