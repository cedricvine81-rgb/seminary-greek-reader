"""Build the Testament of Job in the 53-chapter division, Greek + our own English.

WHY THIS EXISTS
Our long-standing Testament of Job (public/data/pseudepigrapha/tjob.json) is Kohler's
1897 English, which divides the work into 12 long chapters. Modern scholarship — Brock,
Charlesworth, and the cross-reference apparatus we ship — cites the 53-chapter division
M. R. James established. Students comparing the Testament with the NT need to navigate by
those numbers, so this builds a parallel edition carrying the Greek and that numbering,
with an English translation made for this app.

SOURCES
  Greek  : manuscript P (11th c., the oldest Greek witness) as transcribed by the Online
           Critical Pseudepigrapha. Their manuscript transcriptions are public domain;
           their eclectic texts of Brock and Kraft are licensed from Brill and are NOT
           used here. Verse numbering follows Brock's system (based on P), which is the
           one popularised through the OTP and therefore what citations use.
           Kept verbatim in scripts/tjob-greek-p.txt.
  English: our own translation, scripts/tjob-english.json. Spittler's rendering in
           Charlesworth is under copyright and was not used.

Editorial marks in the transcription:
  *      a lacuna / omission of P against other witnesses — stripped for the reading text
  None   an export artifact — stripped
  overbarred nomina sacra — expanded, so students read ordinary words

Usage:  python3 scripts/build-tjob-greek.py      (from the repo root)
"""
import json
import re
from pathlib import Path

GREEK_SRC = Path('scripts/tjob-greek-p.txt')
ENGLISH = Path('scripts/tjob-english.json')
OUT = Path('public/data/pseudepigrapha/tjob-greek.json')

ATTRIBUTION = (
    'Greek: manuscript P (11th century), the oldest Greek witness to the Testament of Job, '
    'as transcribed by the Online Critical Pseudepigrapha (public domain); chapter and verse '
    'numbering follows the division of M. R. James as used by Brock and Charlesworth, so '
    'scholarly citations resolve directly. English: our own translation, made for Seminary '
    'Greek from this Greek — the standard modern English (Spittler, in Charlesworth, 1983) is '
    'under copyright and was not used.'
)
ATTRIBUTION_PARTIAL = ATTRIBUTION + ' Translation in progress: verses not yet translated show Greek only.'

NOMINA = {
    'θω': 'θεῷ', 'θυ': 'θεοῦ', 'θς': 'θεός', 'θν': 'θεόν', 'θε': 'θεέ',
    'κς': 'κύριος', 'κυ': 'κυρίου', 'κν': 'κύριον', 'κω': 'κυρίῳ', 'κε': 'κύριε',
    'ανοι': 'ἄνθρωποι', 'ανους': 'ἀνθρώπους', 'ανου': 'ἀνθρώπου', 'ανος': 'ἄνθρωπος',
    'σρς': 'σωτῆρος', 'ουνιον': 'οὐράνιον', 'μρα': 'μητέρα', 'πρς': 'πατρός',
    'πνς': 'πνεῦμα', 'ιηλ': 'Ἰσραήλ',
}


def clean(text: str) -> str:
    t = re.sub(r'\bNone\b', ' ', text)
    t = re.sub(r'[>‘’]', ' ', t)
    t = re.sub(r'[Α-Ωα-ωἀ-ῼ]+[̅̄]',
               lambda m: NOMINA.get(m.group(0).replace('̅', '').replace('̄', ''),
                                    m.group(0).replace('̅', '').replace('̄', '')), t)
    t = t.replace('*', ' ')
    t = re.sub(r'\s+([,.;·:])', r'\1', t)
    t = re.sub(r'\s{2,}', ' ', t)
    return t.strip(' .·;,')


def parse_greek(raw: str) -> dict[int, dict[int, str]]:
    raw = re.sub(r'\s+', ' ', raw).strip()
    chapters: dict[int, dict[int, str]] = {}
    cur_ch = cur_v = None
    buf: list[str] = []

    def flush() -> None:
        if cur_ch is not None and cur_v is not None and buf:
            txt = clean(' '.join(buf))
            if txt:
                chapters.setdefault(cur_ch, {})[cur_v] = txt

    tokens = raw.split(' ')
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok.isdigit():
            n = int(tok)
            nxt = tokens[i + 1] if i + 1 < len(tokens) else ''
            # "<ch> 1" opens a chapter; allow forward gaps so a missing chapter cannot
            # stall the walk and swallow the remainder into the previous one.
            if nxt == '1' and (cur_ch is None or n > cur_ch) and 1 <= n <= 53:
                flush(); buf = []
                cur_ch, cur_v = n, 1
                i += 2
                continue
            if cur_ch is not None and cur_v is not None and n == cur_v + 1:
                flush(); buf = []
                cur_v = n
                i += 1
                continue
        buf.append(tok)
        i += 1
    flush()
    return chapters


def main() -> None:
    greek = parse_greek(GREEK_SRC.read_text(encoding='utf-8'))
    english = {}
    if ENGLISH.exists():
        english = {k: v for k, v in json.loads(ENGLISH.read_text(encoding='utf-8')).items()
                   if not k.startswith('_')}

    chapters, done, total = [], 0, 0
    for ch in sorted(greek):
        verses = []
        for v in sorted(greek[ch]):
            total += 1
            t = english.get(f'{ch}.{v}', '')
            if t:
                done += 1
            verses.append({'number': v, 'text': t, 'greek': greek[ch][v]})
        chapters.append({'number': ch, 'verses': verses})

    complete = total > 0 and done == total
    OUT.write_text(json.dumps({
        'work': 'Testament of Job',
        'attribution': ATTRIBUTION if complete else ATTRIBUTION_PARTIAL,
        'greek': True,
        'greekOnly': not complete,
        'chapters': chapters,
    }, ensure_ascii=False), encoding='utf-8')

    words = sum(len(v['greek'].split()) for c in chapters for v in c['verses'])
    print(f'Wrote {OUT}')
    print(f'{len(chapters)} chapters, {total} verses, {words} Greek words')
    print(f'English: {done}/{total} verses'
          + ('  → COMPLETE, parallel columns enabled.' if complete
             else '  → greekOnly (English hidden until all are done).'))
    missing = [c for c in range(1, 54) if c not in greek]
    if missing:
        print(f'chapters absent from the Greek source: {missing}')


if __name__ == '__main__':
    main()
