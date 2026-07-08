#!/usr/bin/env python3
"""Split the 'Second Temple' cross-reference category into 'Apocrypha' and
'Pseudepigrapha', and re-home the works that belong to neither.

Classification (scholarly / Charlesworth-Evans convention, matching the data's source):
  - Apocrypha       = the deuterocanon (Tobit, Judith, Sirach, Wisdom, Baruch,
                      Epistle of Jeremiah, 1-4 Maccabees, 1 Esdras, Prayer of Manasseh,
                      Susanna, Bel, additions). NOTE: 4 Ezra / 2 Esdras and Psalms of
                      Solomon go to Pseudepigrapha, per Charlesworth.
  - Pseudepigrapha  = everything else formerly tagged 'Second Temple' (1 Enoch, Jubilees,
                      the Testaments, Sibylline Oracles, 2/3/4 Baruch, 4 Ezra, Psalms of
                      Solomon, Odes of Solomon, Ps.-Phocylides, Ahiqar, ...).
  - Greco-Roman     = Philostratus.
  - Patristic       = Epistle of Barnabas.
  - Christian Apocrypha = Apocalypse of Peter.
  - Josephus        = Flavius Josephus (Ant., J.W., Ag. Ap., Life).
  - Philo           = Philo of Alexandria.
  - Other           = Samaritan Pentateuch and stray canonical refs mis-tagged as
                      Second Temple.

Idempotent: only citations still tagged 'Second Temple' are touched. Run from the repo root.
"""
import json, re, sys, collections
from pathlib import Path

PATH = Path('public/data/backgrounds-crossrefs.json')

APOC = re.compile(r'^(Sir|Sirach|Wis|Wisdom|Tob|Jdt|Bar\b|Ep Jer|Let Jer|[1234] Macc|1 Esdr|Pr Man|Sus|Bel|Add Esth|Pr Azar|Song of Three)')
OT   = re.compile(r'^(Gen|Exod|Lev|Num|Deut|Josh|Judg|Ruth|1 Sam|2 Sam|1 Kgs|2 Kgs|1 Chr|2 Chr|Ezra|Neh|Esth|Job|Ps |Prov|Eccl|Song of Songs|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal)\b')

def classify(text: str) -> str:
    t = re.sub(r'^cf\.\s*', '', text.strip())
    # Philostratus MUST be checked before the Philo prefix (it startswith "Philo").
    if t.startswith('Philostratus'):
        return 'Greco-Roman'
    if t.startswith('Josephus') or t.startswith('idem,') or re.match(r'^(Ant\.|J\.W\.|Ag\. Ap\.|Life)\b', t):
        return 'Josephus'
    if t.startswith('Philo'):
        return 'Philo'
    if t.startswith('Barn.'):
        return 'Patristic'
    if t.startswith('Apoc. Pet.'):
        return 'Christian Apocrypha'
    if t.startswith('SP '):
        return 'Other'   # Samaritan Pentateuch (text witness)
    if APOC.match(t):
        return 'Apocrypha'
    if OT.match(t):
        return 'Other'   # bare canonical refs mistagged as Second Temple
    return 'Pseudepigrapha'

def main():
    data = json.loads(PATH.read_text())
    counts = collections.Counter()
    for entry in data['entries']:
        for c in entry.get('citations', []):
            if c.get('type') == 'Second Temple':
                c['type'] = classify(c['text'])
                counts[c['type']] += 1
    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    total = sum(counts.values())
    print(f'Re-tagged {total} former "Second Temple" citations:')
    for k, v in counts.most_common():
        print(f'  {v:5d}  {k}')

if __name__ == '__main__':
    main()
