"""Add a small, curated set of well-attested background cross-references to the three NT chapters
that Evans's Appendix Two leaves without any — Acts 25, 1 Corinthians 16, 2 Timothy 1.

These are standard commentary parallels, not novel claims; each is tagged `"added": true` so
editorial additions stay distinguishable from the Evans base, and carries a short note (the same
`note` field Evans's own annotated citations use). Idempotent: re-running won't duplicate a
citation. Rebuild backgrounds-search afterwards.

Usage:  python3 scripts/add-background-crossrefs.py   (from the repo root)
"""
import json
import os

PATH = os.path.join(os.path.dirname(__file__), os.pardir, 'public', 'data', 'backgrounds-crossrefs.json')

# (book, chapter, verseStart, verseEnd, label, [citations]) — citations get added:true added below.
ADDITIONS = [
    ('Acts', 25, 1, 1, 'Acts 25:1', [
        {'text': 'Josephus, Ant. 20.8.9 §§182–188', 'type': 'Josephus',
         'note': 'Festus succeeds Felix as procurator of Judea — Josephus narrates the same administration behind Acts 24–26'}]),
    ('Acts', 25, 11, 11, 'Acts 25:11', [
        {'text': 'Pliny the Younger, Ep. 10.96', 'type': 'Greco-Roman',
         'note': 'a provincial governor refers accused Roman citizens to Rome — the legal setting of Paul’s appeal to Caesar (provocatio)'}]),
    ('Acts', 25, 13, 13, 'Acts 25:13', [
        {'text': 'Josephus, Ant. 20.7.3 §§145–147', 'type': 'Josephus',
         'note': 'Agrippa II and his sister Bernice, exactly as Acts introduces them'}]),
    ('1Cor', 16, 1, 4, '1 Cor 16:1–4', [
        {'text': 'Philo, Spec. Laws 1.14 §§77–78', 'type': 'Philo',
         'note': 'the diaspora’s temple contributions gathered and sent to Jerusalem — background to an organized collection'},
        {'text': 'Josephus, Ant. 16.6.2 §§163–164', 'type': 'Josephus',
         'note': 'Rome protects the Jews’ right to collect and send money to Jerusalem'}]),
    ('1Cor', 16, 22, 22, '1 Cor 16:22', [
        {'text': 'Did. 10.6', 'type': 'Patristic', 'kind': 'Parallel',
         'note': 'μαρὰν ἀθά in the Didache’s eucharistic prayer — the closest early parallel to Paul’s Aramaic acclamation'}]),
    ('2Tim', 1, 14, 14, '2 Tim 1:14', [
        {'text': 'Herodotus 6.86', 'type': 'Greco-Roman',
         'note': 'the Glaucus story: a deposit (παρακαταθήκη) entrusted, and the ruin that follows betraying it — the classic Greek parallel to guarding the παραθήκη'}]),
]

def main():
    doc = json.load(open(PATH, encoding='utf-8'))
    entries = doc['entries']
    by_key = {(x['book'], x['chapter'], x['verseStart'], x['verseEnd']): x for x in entries}

    # New entries are appended (the convention the corpus build scripts use — the viewer filters by
    # reference, so array order doesn't affect what's shown), keeping the diff minimal.
    added = 0
    for book, ch, vs, ve, label, cites in ADDITIONS:
        cites = [{**c, 'added': True} for c in cites]
        entry = by_key.get((book, ch, vs, ve))
        if entry is None:
            entry = {'book': book, 'chapter': ch, 'endChapter': ch, 'verseStart': vs,
                     'verseEnd': ve, 'label': label, 'citations': []}
            entries.append(entry); by_key[(book, ch, vs, ve)] = entry
        have = {c['text'] for c in entry['citations']}
        for c in cites:
            if c['text'] not in have:
                entry['citations'].append(c); added += 1

    json.dump(doc, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'Added {added} editorial cross-reference citations across {len(ADDITIONS)} passages.')
    print(f'Total entries now: {len(entries)}')


if __name__ == '__main__':
    main()
