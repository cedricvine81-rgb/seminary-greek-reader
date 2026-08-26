# Copyright and Licensing Posture

**Status: this document supersedes the pre-launch version, which reasoned about
`prisma/seed-data/` sample files. The app now ships full corpora. Rows marked
_to verify_ have not been re-checked against the upstream licence file in this
pass and must be before the next release.**

This is an internal working document, not legal advice.

---

## The standing rule

**seminarygreek.app is a commercial use.** The $10/yr subscription means a
non-commercial-only licence blocks a dataset for us, however freely it is
distributed. This is settled practice here, not a new position — see
[sp-permission-request.md](sp-permission-request.md), where the Samaritan
Pentateuch digitizations were blocked on exactly these grounds while the
underlying editions (Kennicott 1780, von Gall 1918) are public domain.

The precedent set by the Bavli and repeated for the SP: **respect the label, ask
the rights holder, and ship without the dataset until they answer.**

Three distinctions that do the work:

| | |
|---|---|
| **Freely available ≠ freely licensed** | Academic distribution often carries a use agreement. Downloadability is not permission. |
| **The edition ≠ the digitization** | A public-domain 1900 edition can have a restrictively licensed modern transcription. Both need clearing, separately. |
| **The text ≠ the annotation** | A public-domain text can carry copyrighted morphology, syntax, or apparatus. Ours frequently does. |

---

## Ancient texts

The underlying ancient works — Hebrew Bible, Greek OT and NT, Josephus, Philo,
the Fathers, the Greco-Roman corpus — are all long out of copyright. What
requires clearing in every case is the **modern critical edition** and the
**digital transcription**, and for tagged corpora the **morphological and
syntactic annotation**, which is a separate work from the text it describes.

Per-dataset chains are recorded in [provenance.md](provenance.md).

## Translations

Our Spanish translations of the Greek and English source texts are original
work produced for this application and are ours. They are marked as such in the
`_source` and `_note` fields of every chapter file.

English translations in the app are public domain (Brenton 1851, Whiston,
Yonge, Etheridge, Charles, ANF, M. R. James, Lightfoot) or, where not, are
recorded in provenance.md with their terms.

## Lexical data

Glosses and frequency data are original editorial work, or are drawn from
public-domain lexica (Strong's, Thayer 1889, Liddell–Scott Intermediate 1889,
Jastrow 1903), each attributed in the data file's `attribution` field.

No content from BDAG, HALOT, DCH, the full LSJ (Oxford), or any other in-copyright
lexicon has been reproduced.

## Grammar and category labels

Syntax categories, morphology labels, and rhetorical-device names are short
conventional descriptors, not protectable expression. Teaching notes and
explanations attached to them are written for this application.

No prose from Wallace, Waltke–O'Connor, Joüon–Muraoka, or any other in-copyright
grammar has been reproduced.

## Fonts

- **Gentium Plus** — SIL Open Font License
- **GFS Didot** — SIL Open Font License

---

## Open questions

These are unresolved and block nothing else until they are settled.

**1. ~~The Septuagint text and morphology.~~ Settled — replaced.**
`public/data/lxx/` shipped 1,136 chapters recorded as *(Rahlfs, CATSS)* via
CCAT. Verified rather than assumed, and it was worse than feared: the actual
download was `eliranwong/LXX-Rahlfs-1935`, which is **CC BY-NC-SA 4.0**, and
whose text and tagging both descend from CATSS/CCAT, whose user agreement
forbids commercial use without written consent. Two independent blockers.

Re-tagging alone would not have helped — the *text* came from the same
non-commercial file as the tagging, which inverted the plan we had written down.

Replaced with Swete 1909 (public domain) via `nathans/lxx-swete` from
First1KGreek, **CC BY-SA 4.0**, plus our own Stanza morphology. Brenton stays as
the English. Share-alike now attaches to the indexes derived from it — construct,
search shards, lemma-forms. See provenance.md, "The Septuagint chain — resolved".

The lesson is the one already at the top of this file: freely available is not
freely licensed, and the licence on the *digitisation* is a separate question
from the age of the *edition*. Nothing about the download said "non-commercial";
the repository's LICENSE file did.

**2. `public/data/abs-syntax.json`.**
`data-sources.md` recorded the ABS NT Syntax Database as *© Asian Bible Society*.
It is shipped. Terms unknown to us. Verify or remove.

**3. `public/data/bsb-alignment.json` and `gbi.json`.**
Berean Standard Bible and Global Bible Initiative data. Both are believed to be
permissively licensed, both need the actual terms recorded and the attribution
string rendered in the interface if CC BY.

**4. CC BY attribution rendering.**
Several datasets require attribution *in the form the licence specifies*.
Recording the source in a docs file is not sufficient; it has to be visible to
the user. Audit which datasets require this and where it currently appears.

---

## What this document is for

When adding a dataset, add its row to provenance.md **before** writing the
import script, not after. The question "may we ship this, given that we charge
for the app?" is cheap to answer at that point and expensive to answer once the
data is in production and a reader depends on it.
