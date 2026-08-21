#!/usr/bin/env python3
"""Strip Wikisource page furniture that was scraped into the Testament of Solomon as verses.

The build that produced public/data/pseudepigrapha-b/testament-of-solomon.json captured the
whole Wikisource page, so the last section (130) ends with eighteen "verses" that are not text
at all: the licence boilerplate, the category list, "Privacy policy", "Cookie statement",
"Mobile view", "Add topic", and so on. They render in the reader as verses 130:3-130:20 of the
Testament, which is simply wrong, and they would have to be given Spanish counterparts to keep
the two columns in parity.

Verse 130:1 is the real ending of the work. Verse 130:2 is Conybeare's own footnote on shabtai /
Saturn -- editorial matter from the 1898 publication rather than text of the Testament, and its
anchor word did not survive the scrape -- but it IS from the edition, so it is kept rather than
discarded, and the Spanish flags it for what it is.

Idempotent: guards on _pageChromeRemoved, so re-running is a no-op.
"""
import json, sys

PATH = 'public/data/pseudepigrapha-b/testament-of-solomon.json'
SECTION = 130
FIRST_JUNK_VERSE = 3

# Every dropped verse must match one of these; anything else aborts the run rather than
# silently deleting text.
MARKERS = (
    'separate copyright status', 'Retrieved from "https://', 'Categories:',
    'This page was last edited on', 'Creative Commons Attribution', 'Privacy policy',
    'About Wikisource', 'Disclaimers', 'Code of Conduct', 'Developers', 'Statistics',
    'Cookie statement', 'Mobile view', 'Search', 'The Testament of Solomon',
    '1 language', 'Add topic',
)

def main():
    with open(PATH, encoding='utf-8') as f:
        data = json.load(f)

    if data.get('_pageChromeRemoved'):
        print('already repaired; nothing to do')
        return 0

    section = next((c for c in data['chapters'] if c['number'] == SECTION), None)
    if section is None:
        print(f'section {SECTION} not found', file=sys.stderr)
        return 1

    keep, drop = [], []
    for v in section['verses']:
        (drop if v['number'] >= FIRST_JUNK_VERSE else keep).append(v)

    for v in drop:
        text = v['text'].strip()
        if not any(m in text for m in MARKERS):
            print(f'ABORT: {SECTION}:{v["number"]} does not look like page furniture: {text[:80]!r}',
                  file=sys.stderr)
            return 1

    section['verses'] = keep
    data['_pageChromeRemoved'] = {
        'section': SECTION,
        'versesDropped': [v['number'] for v in drop],
        'why': 'Wikisource page navigation and licence boilerplate scraped in as verses',
    }

    with open(PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    print(f'dropped {len(drop)} page-furniture verses from section {SECTION} '
          f'({drop[0]["number"]}-{drop[-1]["number"]}); {len(keep)} real verses kept')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
