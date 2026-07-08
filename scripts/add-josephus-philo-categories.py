#!/usr/bin/env python3
"""Promote Josephus and Philo citations out of the 'Other' cross-reference bucket into
their own 'Josephus' and 'Philo' categories.

Josephus and Philo are major Hellenistic-Jewish authors that are neither Apocrypha nor
Pseudepigrapha; the Backgrounds Summaries menu already gives them dedicated categories, so
the cross-reference chips now match. Genuine 'Other' items (Samaritan Pentateuch, stray
canonical refs, and miscellaneous sources) are left untouched.

Idempotent: only citations currently typed 'Other' whose text is a Josephus or Philo work
are re-tagged. Run from the repo root.
"""
import json, re, collections
from pathlib import Path

PATH = Path('public/data/backgrounds-crossrefs.json')

def bucket(text: str):
    t = re.sub(r'^cf\.\s*', '', text.strip())
    if t.startswith('Philostratus'):
        return None  # Greco-Roman, guarded so "Philo" doesn't swallow it
    if t.startswith('Josephus') or t.startswith('idem,') or re.match(r'^(Ant\.|J\.W\.|Ag\. Ap\.|Life)\b', t):
        return 'Josephus'
    if t.startswith('Philo'):
        return 'Philo'
    return None

def main():
    data = json.loads(PATH.read_text())
    counts = collections.Counter()
    for entry in data['entries']:
        for c in entry.get('citations', []):
            if c.get('type') == 'Other':
                b = bucket(c['text'])
                if b:
                    c['type'] = b
                    counts[b] += 1
    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print('Re-tagged from "Other":')
    for k, v in counts.most_common():
        print(f'  {v:5d}  {k}')

if __name__ == '__main__':
    main()
