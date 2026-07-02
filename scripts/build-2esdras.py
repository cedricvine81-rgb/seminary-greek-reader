# Parses the KJV 1611 text of 2 Esdras (public domain) from Wikisource's wikitext
# into public/data/apocrypha/2esdras.json, chapter/verse indexed like a normal Bible
# book (unlike Josephus's Book.Chapter.Section scheme — 2 Esdras only needs chapter:verse).
# Not part of the LXX/Rahlfs Septuagint (it survives only in Latin, Syriac, Ethiopic,
# etc., not Greek), so it can't live in public/data/lxx/ alongside the Greek corpus.
#
# Usage: curl -sL 'https://en.wikisource.org/wiki/Bible_(King_James)/II_Esdras?action=raw' \
#          -o /tmp/2esdras_raw.txt
#        python3 scripts/build-2esdras.py /tmp/2esdras_raw.txt public/data/apocrypha/2esdras.json

import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT_PATH = Path(sys.argv[2])
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

text = SRC.read_text(encoding='utf-8')

VERSE_RE = re.compile(r"\{\{verse\|chapter=(\d+)\|verse=(\d+)\}\}\s*(.*)")


def clean(s: str) -> str:
    # Strip Wikisource's italics markers (KJV's traditional italics for translator-
    # supplied words — dropped here, same as embedding it as plain reading text).
    s = s.replace("''", '')
    return re.sub(r'\s+', ' ', s).strip()


chapters = {}
for line in text.split('\n'):
    m = VERSE_RE.match(line.strip())
    if not m:
        continue
    ch, vs, rest = int(m.group(1)), int(m.group(2)), m.group(3)
    chapters.setdefault(ch, []).append({'number': vs, 'text': clean(rest)})

chapters_out = [{'number': ch, 'verses': chapters[ch]} for ch in sorted(chapters)]

out = {
    'work': '2 Esdras',
    'attribution': '2 Esdras, King James Version (1611), public domain. Source: Wikisource '
                    '(en.wikisource.org/wiki/Bible_(King_James)/II_Esdras). Chapters 3–14 are '
                    'also cited as "4 Ezra" in scholarly literature; chapters 1–2 and 15–16 '
                    '("5 Ezra"/"6 Ezra") are later Christian additions.',
    'chapters': chapters_out,
}
OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')

total_verses = sum(len(c['verses']) for c in chapters_out)
print(f'chapters={len(chapters_out)} verses={total_verses}')
