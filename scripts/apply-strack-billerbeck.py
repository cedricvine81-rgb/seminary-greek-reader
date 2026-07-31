# Merges a reviewed Strack–Billerbeck queue (scripts/extract-strack-billerbeck.py) into
# public/data/backgrounds-crossrefs.json.
#
# Every citation is added with `source: "Strack–Billerbeck"`, so anything that came from this
# pipeline can be found, audited, or removed later without touching Evans's original entries.
# Rows flagged `outOfOrder` are skipped by default: the verse heading fell out of sequence, which
# usually means a misread digit put the citation on the wrong verse.
#
# Usage:  python3 scripts/apply-strack-billerbeck.py queue1.json queue2.json [--include-flagged]
#         Writes a .backup next to the dataset before changing anything.

import argparse
import json
import shutil
from pathlib import Path

DATA = Path('public/data/backgrounds-crossrefs.json')
SOURCE = 'Strack–Billerbeck'
CREDIT = (' Rabbinic parallels for Luke and Acts additionally drawn from the citation apparatus of '
          'Hermann L. Strack & Paul Billerbeck, Kommentar zum Neuen Testament aus Talmud und '
          'Midrasch (München: Beck, 1922–28), which is in the public domain; references only, '
          'verified against the embedded Mishnah, Yerushalmi and Bavli.')


def covers(entry, book, ch, v):
    if entry['book'] != book:
        return False
    c0, c1 = entry['chapter'], entry.get('endChapter') or entry['chapter']
    if not (c0 <= ch <= c1):
        return False
    if c0 != c1:
        return True                       # multi-chapter entry: treat the whole span as covered
    return entry['verseStart'] <= v <= (entry.get('verseEnd') or entry['verseStart'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('queues', nargs='+')
    ap.add_argument('--include-flagged', action='store_true',
                    help='also apply rows whose verse heading broke the ascending sequence')
    a = ap.parse_args()

    doc = json.loads(DATA.read_text())
    entries = doc['entries']
    before_cites = sum(len(e.get('citations') or []) for e in entries)
    before_entries = len(entries)

    rows = []
    for q in a.queues:
        rows += json.loads(Path(q).read_text())['rows']
    skipped_flagged = 0
    if not a.include_flagged:
        keep = [r for r in rows if not r.get('outOfOrder')]
        skipped_flagged = len(rows) - len(keep)
        rows = keep

    added, into_existing, new_entries, dupes = 0, 0, 0, 0
    for r in rows:
        book, ch, v, text = r['book'], r['chapter'], r['verse'], r['citation']
        target = next((e for e in entries if covers(e, book, ch, v)), None)
        if target is None:
            target = {
                'book': book, 'chapter': ch, 'endChapter': ch,
                'verseStart': v, 'verseEnd': v, 'label': f'{book} {ch}:{v}',
                'citations': [],
            }
            entries.append(target)
            new_entries += 1
        else:
            into_existing += 1
        if any((c.get('text') or '') == text for c in target['citations']):
            dupes += 1
            continue
        target['citations'].append({'text': text, 'type': 'Rabbinic', 'source': SOURCE})
        added += 1

    # Canonical order, so the file stays readable and diffs stay small.
    order = {b: i for i, b in enumerate([
        'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil',
        'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet',
        '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'])}
    entries.sort(key=lambda e: (order.get(e['book'], 99), e['chapter'], e['verseStart']))

    if SOURCE not in (doc.get('attribution') or ''):
        doc['attribution'] = (doc.get('attribution') or '') + CREDIT

    shutil.copy(DATA, DATA.with_suffix('.json.backup'))
    DATA.write_text(json.dumps(doc, ensure_ascii=False, indent=1))

    print(f'rows applied: {len(rows)}' + (f' ({skipped_flagged} flagged rows skipped)' if skipped_flagged else ''))
    print(f'  citations added:      {added}  ({dupes} already present)')
    print(f'  into existing entries: {into_existing}')
    print(f'  new entries created:   {new_entries}')
    print(f'  entries {before_entries} → {len(entries)} | citations {before_cites} → '
          f'{sum(len(e.get("citations") or []) for e in entries)}')


if __name__ == '__main__':
    main()
