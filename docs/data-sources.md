# Data Sources

## Biblical Texts

The seed files contain small representative samples for development. For production deployment, integrate one of the following open-access datasets:

| Source | License | URL |
|--------|---------|-----|
| MorphGNT | CC-BY-SA 3.0 | https://github.com/morphgnt/sblgnt |
| Tischendorf 8th GNT | Public domain | https://github.com/morphgnt/tischendorf |
| LXX (Rahlfs, CATSS) | Public domain (text) | https://ccat.sas.upenn.edu/gopher/text/religion/biblical/ |
| OpenGNT | CC0 | https://github.com/eliranwong/OpenGNT |
| Berean Greek Bible | CC BY-SA 4.0 | https://berean.bible/downloads.htm |

## Morphological Parsing

For production, attach morphological data from:
- **MorphGNT** — includes full morphological codes per word token
- **PROIEL Treebank** — https://github.com/proiel/proiel-treebank

## Lexical Data

- **Strong's Concordance numbers** — public domain
- **Thayer's Greek Lexicon** — public domain (1889 edition)
- **Liddell-Scott Intermediate** — public domain (1889 edition)

For modern usage, consider:
- **BDAG** (licensed) — not included
- **STEP Bible Lexicon** — open data available via STEPBible project (CC BY)
  https://github.com/STEPBible/STEPBible-Data

## Vocabulary Frequency

The word frequency data in `vocabulary-nt-50-plus.json` and `vocabulary-nt-30-plus.json` is based on widely published NT word frequency lists that are considered scholarly common knowledge.
