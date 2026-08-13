# Samaritan Pentateuch — permission requests (drafted 2026-08-13)

Both available digitizations of the Samaritan Pentateuch are licensed for
**non-commercial use only**, which blocks them for seminarygreek.app (the $10/yr student
subscription makes the app commercial use). The underlying editions — Kennicott (1780) and
von Gall (1918) — are public domain; it is the digitizations that carry the restriction.
Our precedent is the Bavli: respect the label, ask the rights holder.

Two candidate sources, either of which would do:

## 1. The CrossWire "SP" module (preferred — plain text, MT versification)

- Digitized by **Aleksandr Sigalov** from Kennicott 1780, checked against von Gall 1918.
- Conf: `DistributionLicense=Copyrighted; Free non-commercial distribution`.
- Contact: via the module page, https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=SP
  (maintainer contact listed there), or the sword-devel list.

### Draft

Subject: Permission request — Samaritan Pentateuch text on seminarygreek.app

Dear Mr. Sigalov,

I teach biblical Hebrew at Andrews University and run seminarygreek.app /
seminaryhebrew.app, a study platform for seminary students. Students pay a small
subscription ($10/year) that covers hosting; instructor accounts are free.

I would like to include the consonantal text of your Samaritan Pentateuch digitization
(the CrossWire SP module, v1.2) in the app's textual-comparison view, where students see
the Masoretic text beside the ancient versions verse by verse. We would display the text
with full attribution to your digitization and its sources (Kennicott 1780, von Gall 1918),
and a link wherever you prefer. We would not redistribute the module itself, only render
the text inside the app, and would not use the morphology/Strong's/translation layers —
only the Hebrew text.

Because the app charges students, this falls outside "free non-commercial distribution,"
so I am writing to ask whether you would grant permission for this use. I am happy to
discuss terms, add any attribution you specify, or show you the feature first.

With thanks for the work itself — it is a remarkable resource,
Dr. Cedric Vine
Andrews University
cedricvine81@gmail.com

## 2. DT-UCPH/sp (Copenhagen text-fabric dataset)

- CC BY-NC 4.0; based on a modern edition (check which — if Tal's, the edition itself may
  carry rights the dataset cannot waive, so ask specifically about the TEXT layer).
- Concrete route: open an issue at https://github.com/DT-UCPH/sp asking whether the text
  layer can be used commercially with attribution, or contact the authors listed on the
  Zenodo record (DOI 10.5281/zenodo.7734632).

### Draft (issue or email)

Subject: License question — using the SP text layer in a paid study app

I run a seminary study platform (seminarygreek.app) where students pay a small annual
subscription. I would like to display the Samaritan Pentateuch text beside the Masoretic
text in a versional-comparison tool for Hebrew students, with attribution and DOI link.
The dataset is CC BY-NC 4.0: would you be willing to grant an exception for the text layer
in this context, or advise whether the text layer's underlying edition permits it? Happy
to add any attribution you specify.

## If permission arrives

The import is ready to go: the SP module parses with pysword (Versification=MT, so verse
keys align with our corpus), output to `public/data/sp/<osis>.json` keyed "ch:v", and
OTVariantsView takes the extra column for the Pentateuch. Roughly an hour of work.
