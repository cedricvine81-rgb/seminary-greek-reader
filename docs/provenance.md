# Data Provenance

One row per shipped dataset: what it is, where it came from, under what terms,
and whether those terms have been read rather than assumed.

**`Checked` means someone opened the upstream LICENSE file and read it.**
Everything else is recorded belief and must be treated as unverified. Most rows
below are unverified — this table is the checklist, not a clearance.

Add the row before writing the import script. See
[copyright-notes.md](copyright-notes.md) for the standing rule (we are a
commercial use; non-commercial licences block us).

---

## Biblical text and annotation

| Dataset | Path | Source | Terms as recorded | Checked |
|---|---|---|---|---|
| Hebrew Bible (WLC/OSHB) | `public/data/mt/` | Open Scriptures Hebrew Bible | open (CC BY 4.0?) | ☐ |
| Hebrew syntax (MACULA) | `public/data/macula-hebrew/` | Clear-Bible/macula-hebrew, WLC/lowfat | CC BY 4.0 | ☐ |
| Hebrew lexicon | `public/data/hebrew-lexicon.json` | Strong's | public domain | ☐ |
| **Septuagint text** | `public/data/lxx/` | Swete 1909 via `nathans/lxx-swete` (First1KGreek) | **CC BY-SA 4.0** — attribution + share-alike | ☑ |
| Septuagint morphology | `public/data/lxx/` | ours: Stanza `grc`, `machine_generated` | ours | ☑ |
| Greek NT (Nestle 1904) | `public/data/na1904/` | biblicalhumanities/Nestle1904 | public domain | ☐ |
| Greek NT syntax (MACULA) | `public/data/syntax.json` | Clear-Bible/macula-greek | CC BY 4.0 | ☐ |
| Greek NT glosses (GBI) | `public/data/gbi.json` | Global Bible Initiative | believed CC BY | ☐ |
| NT syntax (ABS) | `public/data/abs-syntax.json` | Asian Bible Society | **© ABS — verify or remove** | ☐ |
| BSB alignment | `public/data/bsb-alignment.json` | Berean Standard Bible | believed free for all uses | ☐ |
| Textual variants | `public/data/variants/` | CNTR | CC BY-SA | ☐ |
| Brenton English LXX | `public/data/brenton/` | Brenton 1851 | public domain | ☐ |
| Samaritan Pentateuch | `public/data/sp-notable.json` | transcribed here from von Gall (1918) | our transcription of a PD edition | ☑ |

## Lexica

| Dataset | Path | Source | Terms | Checked |
|---|---|---|---|---|
| Strong's Greek | `public/data/strongs-greek.json` | Strong's | public domain | ☐ |
| Thayer / Mounce glosses | `public/data/greek-lexicon.json` | Thayer 1889 | public domain | ☐ |
| LSJ Intermediate | `public/data/lsj.json` | Liddell–Scott 1889 | public domain | ☐ |
| Jastrow | `public/data/jastrow.json` | Jastrow 1903 | public domain | ☑ (attribution in file) |

## Background corpora

All embedded prose corpora carry an `attribution` or `_source` field in the data
files themselves. Editions used are public domain: Whiston (Josephus), Yonge
(Philo), Lightfoot (Apostolic Fathers), ANF (Fathers), Etheridge and Pauli
(Targums), Charles and M. R. James (Pseudepigrapha), Brooks (Joseph and Aseneth),
Guggenheimer (Yerushalmi, CC BY), Kulp (Mishnah, CC BY via Sefaria), Perseus
(Greco-Roman, CC BY-SA).

| Note | |
|---|---|
| Sefaria-sourced (CC BY) | Yerushalmi, Mishnah, Targums — attribution required |
| Perseus (CC BY-SA) | Greco-Roman corpus — share-alike obligation on derivatives |
| Bavli English | **blocked** — CC BY-NC-SA; email to Sefaria outstanding |
| Samaritan Pentateuch digitizations | **blocked** — non-commercial only; permission requests drafted |

## Our own work

Produced for this application; ours to licence.

- Spanish translations of Greek and English source texts (marked in `_source` / `_note`)
- Stanza-generated Greek morphology sidecars for untagged prose (`*.morph.json`)
- Teaching notes, grammar explanations, rhetorical-device curation
- Search indexes, lemma-form tables, construct-search indexes

---

## The Septuagint chain — resolved

`public/data/lxx/` was *(Rahlfs, CATSS)*, taken from
`eliranwong/LXX-Rahlfs-1935`. That repository is **CC BY-NC-SA 4.0**, and its
text and tagging both descend from CATSS/CCAT, whose user agreement forbids
commercial use without written consent. Two independent blockers, and the
student subscription makes us a commercial use — the same call already made for
the Bavli and the Samaritan Pentateuch. Re-tagging alone would not have cleared
it, because the *text* came from the same file as the tagging.

It is now Swete, *The Old Testament in Greek* (1909), public domain, via
`nathans/lxx-swete` from First1KGreek, **CC BY-SA 4.0** — attribution required,
and share-alike attaches to every index built from it (construct, search shards,
lemma-forms).

| Layer | Now | Terms |
|---|---|---|
| Greek text | Swete 1909 via `nathans/lxx-swete` | CC BY-SA 4.0 |
| Morphology | our own Stanza `grc` run | ours |
| Lemma key | Strong's, from our own tagging | public domain |
| English pivot | Brenton 1851 — **unchanged** | public domain |

The English was never touched: that was the constraint the swap had to meet.

### Rebuilding it

The scripts run in this order. Everything after `reconcile-odes` is corpus-wide
and idempotent, so a rerun is always safe.

```bash
python3 scripts/lxx-normalise-swete.py  <swete-src>      # word-per-line -> chapter files
python3 scripts/lxx-tag-swete.py        <norm> <tagged>  # Stanza grc: lemma, morph, Strong's
python3 scripts/lxx-reconcile-odes.py   <swete-src>      # rebuilds Odes under our numbering
python3 scripts/lxx-resolve-strongs.py                   # invented lemmas -> Nestle 1904 readings
python3 scripts/lxx-fix-homographs.py                    # accent-blind Strong's collisions
python3 scripts/lxx-fix-capitals.py                      # Swete's display capitals; the two Jerusalems
python3 scripts/lxx-repair-tokens.py                     # split words, apparatus sigla
python3 scripts/lxx-fix-homoglyphs.py                    # Latin letters inside Greek words
```

Then rebuild what derives from it: `npm run build:construct`,
`scripts/build-word-index.mjs`, `scripts/build-lemma-index.mjs`, and
`scripts/build-backgrounds-search.ts`.

### What the machine tagging is worth

587,998 words. Strong's numbers on **88.6%** — Stanza's lemmatiser is seq2seq, so
on an unfamiliar form it invents a plausible dictionary word rather than
declining to answer (ἠγάπησαν came back under *ἀγαπάσκω*, which is not Greek).
Those words are matched by spelling against the hand-tagged Nestle 1904 already
shipped, which recovered ~30k of them. Every token is marked
`data_origin: machine_generated`; none of it has been read by a human.

Two classes of silent error were found and fixed after the first tagging run.
Both are worth knowing about because neither is visible on the page:

- **Accent-blind Strong's lookup.** The lemma→number map folded diacritics away,
  so εἰς "into" and εἷς "one" shared a key and one number claimed both — 6,749
  prepositions filed as the numeral, plus καρπός as *Carpus*, στέφανος as
  *Stephen*. Fixed at source in `lxx-tag-swete.py`; 10,573 words renumbered.
- **Latin letters inside Greek words.** OCR resolved shared letterforms the wrong
  way: `Aἴγυπτον` with a Roman A matches nothing at all. 120 words mended, each
  only where the mended spelling is already attested three times over.

### Defects in the source, left as found

Reported here rather than papered over. All confirmed against the upstream
word-per-line files before being recorded.

- **Ecclesiastes is absent from the whole Swete chain.** Upstream `tlg030` is
  catalogued but holds only `__cts__.xml`. 222 English verses now have no Greek.
- **Five verses hold nothing but their chapter numeral** — the real text never
  reached the upstream file, and `XX` sits in the verse-1 slot: Exod 20:1,
  Num 17:1, Num 19:1, 1Kgs 14:1, 1Kgs 16:1. Exodus 20:1 is the sentence that
  introduces the Ten Commandments, and Rahlfs had it. We drop the verse rather
  than print a Roman numeral as scripture.
- **Wisdom 3** carries 6 verses where it should carry 19.
- **127 words still mix two alphabets** with no attested spelling to mend them to
  (`Τhῦτα`, `dΜοολεὶ`); `lxx-fix-homoglyphs.py` lists them on every run.
- **Proverbs is not verse-mapped.** Swete carries our ch. 30 inside an extended
  ch. 24 (76 verses against our 34), then runs 25–29. A chapter table cannot
  express it; 38 English verses orphan meanwhile.
- **Esther's prologue** (Addition A, Mordecai's dream, 299 words) is in Swete and
  was never in our Rahlfs data. Not carried — it would need a chapter slot and
  has no English. Worth adding deliberately.

### The Odes had to be renumbered

Editions number the Odes differently, and simply leaving that alone was not
neutral: the English and the Spanish are both keyed to the numbering the Rahlfs
data used, so a straight swap put Jonah's prayer where the translation beneath it
was Habakkuk's, and so on through all fourteen. Nothing looked broken; every
chapter was the wrong canticle. Verified after the fix: our Ode 12 is now the
Prayer of Manasseh, which is the one ode Brenton supplies, and five sampled odes
match the Spanish exactly.

`lxx-reconcile-odes.py` holds the mapping and how it was derived. It also
ingests iva and ivb — the Song and the Prayer of Isaiah, 442 words — which the
normaliser dropped silently because `int()` cannot read a Roman numeral.

### What the swap moved

Measured with `lxx-manifest.py` and `lxx-diff.py` (below): 607 English verses
newly orphaned, 222 of them Ecclesiastes; 1,115 verse ids gained; 27,937 verses
whose Greek text changed. Against a standing baseline of 664 already unpaired.

### Costing a candidate text

`scripts/lxx-manifest.py` + `scripts/lxx-diff.py` report what a replacement text
would move: English verses orphaned, `VerseNote` anchors lost, `Highlight`
offsets invalidated, books and chapters gained or lost.

```bash
python3 scripts/lxx-manifest.py --dir public/data/lxx    --out /tmp/ref.json  --label current
python3 scripts/lxx-manifest.py --dir /path/to/candidate --out /tmp/cand.json --label brenton
python3 scripts/lxx-diff.py --ref /tmp/ref.json --candidate /tmp/cand.json --json /tmp/impact.json
```

**Baseline:** the shipped Greek and English already disagreed on ~1,600 verses
(664 English with no Greek, 962 Greek with no English) before any of this. Some
is real — Vaticanus omits 1 Sam 17:12–31, and Brenton translated Theodotion's
Daniel, not the Old Greek. Some is a data bug: Brenton's `Ezra` runs to ch. 23
(Esdras B = Ezra + Nehemiah) while our Greek `Ezra` stops at 10 with `Neh`
separate. **The acceptance criterion is therefore "does not make this worse",
not "zero orphans".**

### Highlight migration — measure before engineering

`Highlight` stores character offsets into the verse's canonical Greek string, so
a changed verse invalidates them. Count the affected rows before designing a
migration; if the number is small, notify and drop.

```sql
-- LXX Greek highlights, by book
SELECT "book", count(*) FROM "Highlight"
WHERE "layer" = 'grc' AND "book" IN (SELECT DISTINCT "book" FROM "Highlight")
GROUP BY "book" ORDER BY count(*) DESC;

-- verse notes on LXX books (survive unless the verse id itself moves)
SELECT "book", count(*) FROM "VerseNote"
WHERE "book" IS NOT NULL GROUP BY "book" ORDER BY count(*) DESC;
```

---

## Clean-room protocol for MT–LXX alignment work

The alignment corpus is being built **independently**. CATSS is not a source for
it, at any stage, in any form.

The facts an alignment records — that a given Greek word stands where a given
Hebrew word stands — are facts about two ancient texts and are not anyone's
property. Independent creation is a complete answer to a copyright claim. But
the defence only exists if it can be demonstrated, so:

**Rules.**

1. **CATSS is never ingested.** Not as a seed lexicon, not as a check file, not
   in a scratch directory. If it is not in the repo it cannot have leaked into
   the data.
2. **Every alignment record carries `data_origin`** — `machine_generated`,
   `machine_verified_by_human`, `human_authored`, or `flagged_unresolved` —
   plus `verified_by` and `verified_at`. This is the evidence trail.
3. **Inputs are enumerated in advance** and are limited to: OSHB Hebrew, MACULA
   Hebrew syntax, a public-domain Greek text, our own Greek tagging,
   public-domain English pivots (Brenton, KJV, JPS 1917), and — if extracted —
   Hatch & Redpath (1897–1906), public domain.
4. **Git history is part of the record.** Timestamped commits showing the
   alignment being built are exactly what an independent-creation account needs.
   Do not squash the verification history.

**Comparing against CATSS.**

Collating our independent result against a published database is normal
scholarship and worth doing. The sequence is what makes it defensible:

- ✅ Finish the alignment. Commit it, timestamped. *Then* open CATSS, compare,
  report agreement rates, characterise disagreements in our own prose, cite them.
- ❌ Consult CATSS while aligning, or import their units to check against as we go.

Ideally the person doing the comparison is not the person who did the alignment.

---

## Adding a dataset

1. Add the row here, with the terms, **before** the import script exists.
2. If non-commercial: stop. Draft a permission request
   ([sp-permission-request.md](sp-permission-request.md) is the template).
3. If CC BY / CC BY-SA: record the required attribution string and where in the
   interface it will be rendered. A docs file is not attribution.
4. Tick `Checked` only after reading the upstream LICENSE file.
