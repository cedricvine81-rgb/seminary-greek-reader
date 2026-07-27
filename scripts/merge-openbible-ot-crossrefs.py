"""Enrich the Backgrounds page's OT cross-references from the OpenBible.info dataset (the
Treasury of Scripture Knowledge lineage, CC-BY). Our Evans-based apparatus carried OT references
for ~1,260 NT verses; OpenBible links ~5,480. This adds the well-supported NT→OT links (votes ≥
THRESHOLD) that we don't already have, as 'OT'-type citations that link straight to the reader
(the Masoretic Hebrew, whose versification matches these Protestant-canon references).

Each added citation is tagged "added": true and "source": "openbible". Idempotent (dedupes against
what's already there, normalising the LXX book codes Evans uses — JoshB/JudgB/DanLXX). Capped per
verse so no verse is buried. Rebuild backgrounds-search is NOT needed (this feeds BackgroundsView
directly); just redeploy.

Usage:  python3 scripts/merge-openbible-ot-crossrefs.py [--threshold N] [--cap N]
"""
import argparse, json, os, re, ssl, urllib.request, zipfile, io

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CROSSREFS = os.path.join(REPO, 'public/data/backgrounds-crossrefs.json')
CACHE = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'openbible-cross_references.txt')
URL = 'https://a.openbible.info/data/cross-references.zip'

NT = {'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col',
      '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet', '1John',
      '2John', '3John', 'Jude', 'Rev'}
OT = {'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs',
      '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer',
      'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph',
      'Hag', 'Zech', 'Mal'}
# Evans stores three OT books under their Septuagint codes; fold them together for de-duplication.
NORM = {'JoshB': 'Josh', 'JudgB': 'Judg', 'DanLXX': 'Dan', 'EsthGr': 'Esth'}
norm = lambda b: NORM.get(b, b)

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def load_dataset():
    if not os.path.exists(CACHE):
        data = urllib.request.urlopen(URL, context=_ctx, timeout=60).read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            open(CACHE, 'wb').write(z.read('cross_references.txt'))
    return open(CACHE, encoding='utf-8')


def label(book, ch, v, endch, endv):
    if endch is None or (endch == ch and endv == v):
        return f'{book} {ch}:{v}'
    if endch == ch:
        return f'{book} {ch}:{v}–{endv}'
    return f'{book} {ch}:{v}–{endch}:{endv}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--threshold', type=int, default=10)
    ap.add_argument('--cap', type=int, default=12)
    args = ap.parse_args()

    # NT verse -> [(otbook, ch, v, endch, endv, votes)]
    by_verse = {}
    for line in load_dataset():
        p = line.rstrip('\n').split('\t')
        if len(p) < 2 or p[0] == 'From Verse':
            continue
        frm, to = p[0], p[1]
        votes = int(p[2]) if len(p) > 2 and p[2].strip().lstrip('-').isdigit() else 0
        fb, tb = frm.split('.')[0], to.split('-')[0].split('.')[0]
        if fb not in NT or tb not in OT or votes < args.threshold:
            continue
        fm = re.match(r'\w+\.(\d+)\.(\d+)$', frm)
        if not fm:
            continue
        a, b = (to.split('-') + [None])[:2]
        sm = re.match(r'(\w+)\.(\d+)\.(\d+)', a)
        em = re.match(r'(\w+)\.(\d+)\.(\d+)', b) if b else None
        if not sm:
            continue
        endch = int(em.group(2)) if em else None
        endv = int(em.group(3)) if em else None
        by_verse.setdefault((fb, int(fm.group(1)), int(fm.group(2))), []).append(
            (sm.group(1), int(sm.group(2)), int(sm.group(3)), endch, endv, votes))

    doc = json.load(open(CROSSREFS, encoding='utf-8'))
    entries = doc['entries']
    # existing OT refs per NT verse (normalised), from every entry covering the verse
    existing = {}
    single = {}   # (book,ch,v) -> the single-verse entry, for appending
    for x in entries:
        if x['verseStart'] == x['verseEnd']:
            single[(x['book'], x['chapter'], x['verseStart'])] = x
        for c in x['citations']:
            if c['type'] in ('OT', 'LXX') and 'ref' in c:
                r = c['ref']
                for v in range(x['verseStart'], x['verseEnd'] + 1):
                    existing.setdefault((x['book'], x['chapter'], v), set()).add((norm(r['book']), r['chapter'], r['verse']))

    added = verses_touched = 0
    for (nb, nc, nv), targets in by_verse.items():
        have = existing.get((nb, nc, nv), set())
        targets.sort(key=lambda t: -t[5])
        new = []
        for ob, oc, ov, endch, endv, votes in targets:
            if (norm(ob), oc, ov) in have or (norm(ob), oc, ov) in {(norm(t[0]), t[1], t[2]) for t in new}:
                continue
            new.append((ob, oc, ov, endch, endv, votes))
            if len(new) >= args.cap:
                break
        if not new:
            continue
        entry = single.get((nb, nc, nv))
        if entry is None:
            entry = {'book': nb, 'chapter': nc, 'endChapter': nc, 'verseStart': nv, 'verseEnd': nv,
                     'label': f'{nb} {nc}:{nv}', 'citations': []}
            entries.append(entry); single[(nb, nc, nv)] = entry
        for ob, oc, ov, endch, endv, votes in new:
            entry['citations'].append({
                'text': label(ob, oc, ov, endch, endv), 'type': 'OT',
                'ref': {'book': ob, 'chapter': oc, 'verse': ov},
                'added': True, 'source': 'openbible'})
            added += 1
        verses_touched += 1

    if 'openbible' not in doc.get('attribution', '').lower() and 'OpenBible' not in doc.get('attribution', ''):
        doc['attribution'] = doc.get('attribution', '') + (
            ' Additional Old Testament cross-references (marked) from the OpenBible.info '
            'cross-reference dataset (Treasury of Scripture Knowledge lineage), CC BY.')
    json.dump(doc, open(CROSSREFS, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'Added {added} OT cross-references across {verses_touched} NT verses '
          f'(votes ≥ {args.threshold}, cap {args.cap}/verse).')
    print(f'Total entries now: {len(entries)}')


if __name__ == '__main__':
    main()
