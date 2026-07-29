"""Attach the Greek to 3 Baruch, and recover the two chapters our English lacks.

WHY THIS EXISTS
3 Baruch is the *Greek* Apocalypse of Baruch, but we shipped only Hughes's 1913 English —
and that English is missing chapters 4 and 12 outright, so "3 Bar. 4:8" (the vine that
deceived Adam, quoted constantly in discussions of the fall) resolved to nothing at all.

The Greek supplies both: the original text throughout, and those two chapters, which now
exist as Greek-only until an English for them is added.

VERSE ALIGNMENT
The Greek carries its own verse numbers, and Hughes's English follows the same division —
but "follows" is checked, not assumed. A chapter is merged only where the two agree on the
verse numbers; where they disagree the English is left as it stands and the Greek is
reported, rather than pairing an English verse with Greek that may not be its own.

Usage:  python3 scripts/build-3baruch-greek.py      (from the repo root)
"""
import json
import re
from pathlib import Path

SRC = Path('scripts/3baruch-greek.txt')
OUT = Path('public/data/pseudepigrapha/3baruch.json')

ATTRIBUTION = (
    'Greek: the Greek Apocalypse of Baruch (3 Baruch), public-domain text. '
    'English: tr. H. M. Hughes (1913), public domain, via Wesley Center Online — '
    'Hughes does not render chapters 4 and 12, which appear here in Greek only.'
)

# "<ch> 1" opens a chapter; a bare number opens a verse within it. Same walk as the
# Testament of Job builder, and for the same reason: the numbers are inline in the prose.
TOKEN = re.compile(r'(?<![\wͰ-Ͽἀ-῿])(\d{1,3})(?=\s)')


def parse(raw: str) -> dict[int, dict[int, str]]:
    # Drop the prologue: it precedes chapter 1 and is not part of the numbered text.
    body = raw
    m = re.search(r'(?:^|\n)1 1 ', body)
    if m:
        body = body[m.start():]
    body = re.sub(r'\s+', ' ', body).strip()

    chapters: dict[int, dict[int, str]] = {}
    cur_ch = cur_v = None
    buf: list[str] = []

    def flush():
        if cur_ch is not None and cur_v is not None:
            t = ' '.join(buf).strip(' ·;,')
            if t:
                chapters.setdefault(cur_ch, {})[cur_v] = re.sub(r'\s{2,}', ' ', t)

    tokens = body.split(' ')
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok.isdigit():
            n = int(tok)
            nxt = tokens[i + 1] if i + 1 < len(tokens) else ''
            if nxt == '1' and (cur_ch is None or n == cur_ch + 1) and 1 <= n <= 17:
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


def main():
    greek = parse(SRC.read_text(encoding='utf-8'))
    d = json.loads(OUT.read_text(encoding='utf-8'))
    english = {c['number']: {v['number']: v.get('text', '') for v in c['verses']}
               for c in d['chapters']}

    chapters, merged, greek_only, disagreed = [], 0, [], []
    for ch in sorted(greek):
        gv = greek[ch]
        ev = english.get(ch)
        if ev is None:
            # A chapter the English never had — 4 and 12.
            greek_only.append(ch)
            verses = [{'number': v, 'text': '', 'greek': gv[v]} for v in sorted(gv)]
        elif set(ev) <= set(gv):
            # The English is missing a verse or two the Greek has (2:2, 6:10, 8:7). The two
            # still share one numbering, so pairing by number is sound, and the gap simply
            # shows as Greek without an English facing it.
            verses = [{'number': v, 'text': ev.get(v, ''), 'greek': gv[v]} for v in sorted(gv)]
            merged += 1
        else:
            # A structurally different division, not a dropped verse — our English runs
            # chapters 3 and 4 together, which is why 4 looked missing. Pairing by number
            # here would put English against Greek that is not its own, so the English is
            # left exactly as it was and no Greek is attached.
            disagreed.append(f'  ch {ch}: English {sorted(ev)} vs Greek {sorted(gv)}')
            verses = [{'number': v, 'text': ev[v], 'greek': ''} for v in sorted(ev)]
        chapters.append({'number': ch, 'verses': verses})

    d['chapters'] = chapters
    d['attribution'] = ATTRIBUTION
    d['greek'] = True
    OUT.write_text(json.dumps(d, ensure_ascii=False), encoding='utf-8')

    words = sum(len(v['greek'].split()) for c in chapters for v in c['verses'])
    print(f'{len(chapters)} chapters, {sum(len(c["verses"]) for c in chapters)} verses, '
          f'{words} Greek words')
    print(f'English and Greek agree on the verses in {merged}/{len(chapters)} chapters')
    print(f'recovered as Greek-only (English has no such chapter): {greek_only}')
    if disagreed:
        print(f'\n{len(disagreed)} chapters where the two divisions differ:')
        print('\n'.join(disagreed))


if __name__ == '__main__':
    main()
