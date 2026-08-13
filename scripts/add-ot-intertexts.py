#!/usr/bin/env python3
"""Add OT–OT intertextual cross-references to the Backgrounds/Reception apparatus.

The Old Testament quotes and reworks itself constantly — the Decalogue twice, Isaiah 2 and
Micah 4, the grace formula of Exodus 34 recited across the Psalms and the Twelve, Jeremiah
cited by name in Daniel and Chronicles. The apparatus already carried NT→OT and OT→NT links
but nothing OT-internal, so a reader in Micah 4 was never told about Isaiah 2.

DIRECTION IS NOT ASSUMED. Who borrowed from whom is a scholarly question this app has no
business settling, so every relationship is emitted in BOTH passages, worded neutrally
("also at", "compare"), except where the text itself names its source (Dan 9:2 says it is
reading Jeremiah) — there the note says so.

Two sources, both already vetted in this repo:
  · public/data/ot-parallels.json — the 68 synoptic units (Samuel–Kings ‖ Chronicles, the
    Psalms doublets, Isaiah 36–39 ‖ 2 Kings 18–20) used by the Synopsis tab.
  · the curated INTERTEXTS table below — the standard, uncontested cases named in any
    reference work: shared oracles, recited formulas, repeated psalms, explicit citations.

Idempotent: every citation it writes carries gen "ot-intertext", and a re-run removes the
previous batch before adding the current one.

    python3 scripts/add-ot-intertexts.py [--dry]
"""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
XREFS = REPO / 'public' / 'data' / 'backgrounds-crossrefs.json'
PARALLELS = REPO / 'public' / 'data' / 'ot-parallels.json'
GEN = 'ot-intertext'

BOOKS = {
    'Genesis': 'Gen', 'Exodus': 'Exod', 'Leviticus': 'Lev', 'Numbers': 'Num',
    'Deuteronomy': 'Deut', 'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth',
    '1 Samuel': '1Sam', '2 Samuel': '2Sam', '1 Kings': '1Kgs', '2 Kings': '2Kgs',
    '1 Chronicles': '1Chr', '2 Chronicles': '2Chr', 'Ezra': 'Ezra', 'Nehemiah': 'Neh',
    'Esther': 'Esth', 'Job': 'Job', 'Psalm': 'Ps', 'Psalms': 'Ps', 'Proverbs': 'Prov',
    'Ecclesiastes': 'Eccl', 'Song of Songs': 'Song', 'Isaiah': 'Isa', 'Jeremiah': 'Jer',
    'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan', 'Hosea': 'Hos', 'Joel': 'Joel',
    'Amos': 'Amos', 'Obadiah': 'Obad', 'Jonah': 'Jonah', 'Micah': 'Mic', 'Nahum': 'Nah',
    'Habakkuk': 'Hab', 'Zephaniah': 'Zeph', 'Haggai': 'Hag', 'Zechariah': 'Zech',
    'Malachi': 'Mal',
}
SHORT = {v: k for k, v in BOOKS.items() if k not in ('Psalms',)}

# ── The curated table ───────────────────────────────────────────────────────────────────
# (label, [refs], note). Every ref in a group is linked to every other, both ways. Refs use
# the short OSIS form "Osis c:v" or "Osis c:v-v".
INTERTEXTS = [
    ('The Ten Commandments, given twice', ['Exod 20:1-17', 'Deut 5:6-21'],
     'The Decalogue in its two forms; the sabbath command differs in its reason (creation / the exodus).'),
    ('The LORD, merciful and gracious', ['Exod 34:6-7', 'Num 14:18', 'Neh 9:17', 'Ps 86:15', 'Ps 103:8',
                                         'Ps 145:8', 'Joel 2:13', 'Jonah 4:2', 'Nah 1:3'],
     'The grace formula of Exod 34:6-7, recited across the Psalms and the Twelve — and in Jonah quoted back at God as a complaint.'),
    ('Swords into ploughshares', ['Isa 2:2-4', 'Mic 4:1-3', 'Joel 3:10'],
     'The same oracle stands in Isaiah and Micah; Joel reverses it — ploughshares into swords.'),
    ('The oracle against Edom', ['Obad 1:1-9', 'Jer 49:7-22'],
     'Obadiah and Jeremiah share this oracle almost phrase for phrase.'),
    ('The fool says in his heart', ['Ps 14:1-7', 'Ps 53:1-6'],
     'The same psalm twice in the Psalter, one using YHWH and the other Elohim.'),
    ('David’s song of deliverance', ['2Sam 22:1-51', 'Ps 18:1-50'],
     'The same psalm, in the narrative of Samuel and in the Psalter.'),
    ('Be pleased, O LORD, to deliver me', ['Ps 40:13-17', 'Ps 70:1-5'], 'A psalm that also stands on its own.'),
    ('My heart is steadfast', ['Ps 57:7-11', 'Ps 60:5-12', 'Ps 108:1-13'],
     'Psalm 108 is composed of the closing halves of Psalms 57 and 60.'),
    ('In you, O LORD, I take refuge', ['Ps 31:1-3', 'Ps 71:1-3'], 'The same opening plea.'),
    ('Idols of silver and gold', ['Ps 115:4-8', 'Ps 135:15-18', 'Isa 44:9-20', 'Jer 10:1-16'],
     'The idol polemic, in the Psalter and the prophets.'),
    ('What is man, that you are mindful of him?', ['Ps 8:4', 'Ps 144:3', 'Job 7:17'],
     'The same question, asked in wonder in Psalm 8 and in exasperation in Job.'),
    ('The knowledge of the LORD fills the earth', ['Isa 11:9', 'Hab 2:14'], 'The same image, differently applied.'),
    ('The feet of the messenger', ['Isa 52:7', 'Nah 1:15'], 'Good news announced on the mountains.'),
    ('The sour grapes proverb', ['Jer 31:29-30', 'Ezek 18:2-4'],
     'Both prophets quote the same current proverb in order to overturn it.'),
    ('Micah quoted by name', ['Mic 3:12', 'Jer 26:18'],
     'Jeremiah’s hearers cite Micah by name in his defence — the OT quoting a named prophet.'),
    ('Jeremiah’s seventy years', ['Jer 25:11-12', 'Jer 29:10', 'Dan 9:2', '2Chr 36:20-21', 'Ezra 1:1'],
     'Daniel says he was reading Jeremiah; Chronicles and Ezra date the return by the same word.'),
    ('The law of Moses on children and fathers', ['Deut 24:16', '2Kgs 14:6'],
     'Kings quotes the law explicitly, naming the book of the law of Moses.'),
    ('An altar of uncut stones', ['Exod 20:25', 'Deut 27:5-6', 'Josh 8:30-31'],
     'Joshua builds the altar the law prescribes, and the narrator says so.'),
    ('Blessings and curses of the covenant', ['Lev 26:3-46', 'Deut 28:1-68'], 'The two covenant blessing-and-curse lists.'),
    ('The nations blessed in Abraham', ['Gen 12:3', 'Gen 18:18', 'Gen 22:18', 'Gen 26:4', 'Gen 28:14'],
     'The promise repeated to each generation of the patriarchs.'),
    ('In the image of God', ['Gen 1:27', 'Gen 5:1-2', 'Gen 9:6'], 'The creation statement, restated and then used as a legal ground.'),
    ('The wolf and the lamb', ['Isa 11:6-9', 'Isa 65:25'], 'Isaiah reusing his own vision.'),
    ('Terror on every side', ['Jer 6:22-24', 'Jer 50:41-43'], 'Jeremiah turning an oracle against Judah into one against Babylon.'),
    ('The haunt of desert creatures', ['Isa 13:20-22', 'Jer 50:39-40'], 'The ruin of Babylon, in the same terms.'),
    ('Worthless shepherds', ['Jer 23:1-6', 'Ezek 34:1-24'], 'The shepherd oracle in both prophets.'),
    ('Remember the law of Moses', ['Mal 4:4', 'Deut 4:10'], 'Malachi closes by pointing back to Horeb.'),
    ('The song at the sea, remembered', ['Exod 15:1-18', 'Ps 78:12-16', 'Ps 106:7-12'],
     'The exodus deliverance retold in the Psalms.'),
    ('The wilderness generation, retold', ['Num 14:20-35', 'Ps 95:8-11', 'Ps 106:24-27'],
     'Israel’s refusal at Kadesh, recited as warning.'),
    ('Give thanks to the LORD, for he is good', ['1Chr 16:34', 'Ps 106:1', 'Ps 107:1', 'Ps 118:1', 'Ps 136:1'],
     'The refrain that opens and closes many psalms of thanksgiving.'),
    ('The priestly blessing', ['Num 6:24-26', 'Ps 67:1'], 'The blessing of Aaron echoed in the Psalter.'),
    ('The LORD is my shepherd / the shepherd of Israel', ['Ps 23:1', 'Ps 80:1', 'Gen 48:15'],
     'God as shepherd, in psalm and patriarchal blessing.'),
    ('Hear, O Israel', ['Deut 6:4-5', 'Deut 10:12', 'Josh 22:5'], 'The Shema and its restatements within the law and Joshua.'),
    ('The righteous shall live by faith', ['Hab 2:4', 'Gen 15:6'], 'Two of the OT’s foundational statements about faith.'),
    ('Do not add or take away', ['Deut 4:2', 'Deut 12:32', 'Prov 30:6'], 'The warning against altering the word.'),
    ('Discipline of the LORD', ['Prov 3:11-12', 'Job 5:17'], 'The same wisdom, in Proverbs and in Eliphaz’s mouth.'),
    ('The earth is the LORD’s', ['Ps 24:1', 'Ps 50:12', 'Deut 10:14'], 'The claim of universal ownership.'),
    ('A prophet like Moses', ['Deut 18:15-19', 'Deut 34:10'], 'The promise and the closing note that none had yet matched it.'),
    ('The fear of the LORD is the beginning', ['Prov 1:7', 'Prov 9:10', 'Ps 111:10', 'Job 28:28'],
     'Wisdom’s starting point, stated across the wisdom books.'),
    ('The valley of dry bones and the breath of life', ['Ezek 37:1-14', 'Gen 2:7'],
     'Ezekiel’s vision reuses the language of the creation of humanity.'),
    ('The new covenant', ['Jer 31:31-34', 'Ezek 36:26-27'], 'The promise of an inward covenant in both prophets.'),
    ('The Servant and the light to the nations', ['Isa 42:6', 'Isa 49:6'], 'The commission repeated within Isaiah.'),
    ('The vineyard of the LORD', ['Isa 5:1-7', 'Ps 80:8-16', 'Jer 2:21'], 'Israel as the vine or vineyard.'),
    ('Rend your hearts', ['Joel 2:12-13', 'Exod 34:6'], 'Joel’s call to return, grounded in the grace formula.'),
    ('The day of the LORD, darkness not light', ['Amos 5:18-20', 'Zeph 1:14-15', 'Joel 2:1-2'],
     'The day of the LORD as darkness, across the Twelve.'),
    ('Seek me and live', ['Amos 5:4-6', 'Deut 4:29', 'Jer 29:13'], 'The call to seek God and find him.'),
    ('He has told you what is good', ['Mic 6:8', 'Deut 10:12-13'], 'The summary of what God requires.'),
    ('The stone the builders rejected', ['Ps 118:22', 'Isa 28:16'], 'The stone imagery in psalm and prophet.'),
    ('Ezra reads the law', ['Neh 8:1-8', 'Deut 31:9-13'], 'The public reading of the law, as the law prescribes.'),
    ('The census formula and the half-shekel', ['Exod 30:11-16', '2Chr 24:6-9'], 'The tax of Moses, revived under Joash.'),
    ('The bronze serpent', ['Num 21:8-9', '2Kgs 18:4'], 'Made in the wilderness, destroyed by Hezekiah.'),
]

REF_RX = re.compile(r'^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$')


def parse_ref(ref):
    m = REF_RX.match(ref.strip())
    if not m:
        raise SystemExit(f'unparsable ref: {ref!r}')
    book = m.group(1).replace(' ', '')
    if book not in SHORT and book not in BOOKS.values():
        raise SystemExit(f'unknown book in {ref!r}')
    return book, int(m.group(2)), int(m.group(3)), int(m.group(4) or m.group(3))


def parse_long(ref):
    """"1 Samuel 31:1-13" → (osis, ch, vs, ve)."""
    m = re.match(r'^((?:\d\s)?[A-Za-z][A-Za-z\s]*?)\s+(\d+):(\d+)(?:-(\d+))?$', ref.strip())
    if not m:
        return None
    osis = BOOKS.get(m.group(1).strip())
    if not osis:
        return None
    return osis, int(m.group(2)), int(m.group(3)), int(m.group(4) or m.group(3))


def label(osis, ch, vs, ve):
    return f'{osis} {ch}:{vs}' + (f'-{ve}' if ve != vs else '')


def main():
    dry = '--dry' in sys.argv
    data = json.loads(XREFS.read_text())
    entries = data['entries']

    # Idempotence: drop the previous batch, and any entry left with no citations.
    before = sum(len(e['citations']) for e in entries)
    for e in entries:
        e['citations'] = [c for c in e['citations'] if c.get('gen') != GEN]
    entries = [e for e in entries if e['citations']]
    removed = before - sum(len(e['citations']) for e in entries)

    index = {(e['book'], e['chapter'], e['verseStart'], e['verseEnd']): e for e in entries}

    groups = []
    for title, refs, note in INTERTEXTS:
        groups.append((title, [parse_ref(r) for r in refs], note, 'Intertext'))
    par = json.loads(PARALLELS.read_text())['parallels']
    for unit in par:
        parsed = [parse_long(r) for r in unit['refs']]
        if any(p is None for p in parsed):
            continue
        groups.append((unit['title'], parsed, 'Synoptic parallel — the same material in two books.', 'Parallel'))

    added = 0
    for title, refs, note, kind in groups:
        for i, (osis, ch, vs, ve) in enumerate(refs):
            key = (osis, ch, vs, ve)
            e = index.get(key)
            if not e:
                e = {'book': osis, 'chapter': ch, 'endChapter': ch, 'verseStart': vs, 'verseEnd': ve,
                     'label': label(osis, ch, vs, ve), 'citations': [], 'gen': GEN}
                index[key] = e
                entries.append(e)
            for j, other in enumerate(refs):
                if i == j:
                    continue
                oo, oc, ovs, ove = other
                text = label(oo, oc, ovs, ove)
                if any(c.get('text') == text and c.get('gen') == GEN for c in e['citations']):
                    continue
                e['citations'].append({
                    'text': text, 'type': 'OT', 'kind': kind, 'gen': GEN,
                    'note': f'{title} — {note}',
                    'ref': {'book': oo, 'chapter': oc, 'verse': ovs},
                })
                added += 1

    entries.sort(key=lambda e: (e['book'], e['chapter'], e['verseStart']))
    data['entries'] = entries
    attr = data.get('attribution', '')
    marker = 'Old Testament intertextual links'
    if marker not in attr:
        data['attribution'] = attr + (
            ' Old Testament intertextual links (shared oracles, recited formulas, repeated psalms, '
            'explicit citations, and the synoptic Samuel–Kings ‖ Chronicles material) compiled for this '
            'app from the standard reference lists; each relationship is shown in BOTH passages, since '
            'the direction of dependence is a scholarly question this tool does not settle.')
    if not dry:
        XREFS.write_text(json.dumps(data, ensure_ascii=False))
    print(f'{len(groups)} groups · removed {removed} previous · added {added} citations · '
          f'{len(entries)} entries total{" (dry run)" if dry else ""}')


if __name__ == '__main__':
    main()
