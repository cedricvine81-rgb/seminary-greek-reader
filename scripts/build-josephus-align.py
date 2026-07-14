# Per-§ Whiston→Niese alignment for the whole Josephus corpus, via the Claude API.
#
# The embedded data (public/data/josephus/<work>/<book>.json) stores Whiston's English once
# per Whiston section — on the FIRST Niese § it spans — leaving the later §§ of that section
# Greek-only. This script asks Claude to split each such English paragraph into per-§ pieces
# aligned to the Greek, so every § becomes bilingual (the hand-aligned JW1 ch2 shows the goal).
#
# It is idempotent/resumable: a "block" (a Whiston section = a run of §§ sharing one English
# paragraph) is skipped once every § in it already has text, so re-running only fills the gaps.
# Each split is validated — the concatenation of the pieces must reproduce the original English
# verbatim (whitespace-normalized) — and blocks that fail twice are left untouched and logged.
#
# Requires ANTHROPIC_API_KEY in the environment. Model defaults to claude-opus-4-8 (override
# with MODEL=claude-haiku-4-5 etc. for a cheaper bulk run — ~2,000 short calls for JW+Ant).
#
# Usage:
#   ANTHROPIC_API_KEY=sk-ant-... python3 scripts/build-josephus-align.py --work jewish-war
#   ANTHROPIC_API_KEY=sk-ant-... MODEL=claude-haiku-4-5 python3 scripts/build-josephus-align.py --all
#   (add --dry-run to see how many blocks would be aligned without calling the API)

import json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path

API_URL = 'https://api.anthropic.com/v1/messages'
MODEL = os.environ.get('MODEL', 'claude-opus-4-8')
KEY = os.environ.get('ANTHROPIC_API_KEY', '')
WORKS = ['jewish-war', 'antiquities', 'against-apion', 'life']

SYSTEM = (
    "You align Flavius Josephus's Greek with William Whiston's 1737 English translation. "
    "You are given a passage as numbered Greek sections (Niese §§) and Whiston's English "
    "rendering of that whole passage as one paragraph. Split the English into exactly N "
    "contiguous parts — one per Greek section, in order — so each part is Whiston's rendering "
    "of that section's Greek. Rules: (1) preserve the English EXACTLY — identical words, order, "
    "spelling, and punctuation; you only choose where to cut. (2) Concatenating the parts in "
    "order, with a single space between them, must reproduce the original English. (3) Every "
    "part must be non-empty. If a section's content has no distinct English (e.g. Whiston "
    "compressed it), attach the smallest sensible clause. Return ONLY a JSON array of N strings."
)


def norm(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def call_api(sections, english, n):
    body = {
        'model': MODEL,
        'max_tokens': 4096,
        'system': SYSTEM,
        'output_config': {'effort': 'low', 'format': {
            'type': 'json_schema',
            'schema': {'type': 'array', 'items': {'type': 'string'}},
        }},
        'messages': [{'role': 'user', 'content':
            'Greek sections:\n' + '\n'.join(f'§{num}: {grc}' for num, grc in sections) +
            f'\n\nWhiston English (split into exactly {n} parts, one per section above):\n{english}'
        }],
    }
    data = json.dumps(body).encode()
    req = urllib.request.Request(API_URL, data=data, method='POST', headers={
        'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
    })
    for attempt in range(4):
        try:
            resp = urllib.request.urlopen(req, timeout=120)
            payload = json.loads(resp.read())
            for block in payload.get('content', []):
                if block.get('type') == 'text':
                    return json.loads(block['text'])
            return None
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                time.sleep(2 ** attempt * 2)
                continue
            raise
    return None


def blocks_of(chapter):
    """Yield (indices, sections, english) for each Whiston-section block that needs splitting:
    a run of sections starting at one with text, up to (not including) the next with text."""
    secs = chapter['sections']
    i = 0
    while i < len(secs):
        if not secs[i].get('text'):
            i += 1; continue
        j = i + 1
        while j < len(secs) and not secs[j].get('text'):
            j += 1
        if j - i > 1:  # spans >1 § → needs a split
            idxs = list(range(i, j))
            yield idxs, [(secs[k]['number'], secs[k].get('greek', '')) for k in idxs], secs[i]['text']
        i = j


def main():
    work_arg = None
    if '--work' in sys.argv:
        work_arg = sys.argv[sys.argv.index('--work') + 1]
    works = WORKS if ('--all' in sys.argv or not work_arg) else [work_arg]
    dry = '--dry-run' in sys.argv
    if not KEY and not dry:
        sys.exit('Set ANTHROPIC_API_KEY (or pass --dry-run to count blocks).')

    for work in works:
        wd = Path(f'public/data/josephus/{work}')
        files = sorted((f for f in wd.glob('*.json') if f.name != 'index.json'),
                       key=lambda p: int(p.stem))
        todo = done = failed = 0
        for f in files:
            doc = json.loads(f.read_text())
            changed = False
            for ch in doc['chapters']:
                for idxs, sections, english in blocks_of(ch):
                    todo += 1
                    if dry:
                        continue
                    parts = call_api(sections, english, len(idxs))
                    ok = (isinstance(parts, list) and len(parts) == len(idxs)
                          and all(isinstance(p, str) and p.strip() for p in parts)
                          and norm(' '.join(parts)) == norm(english))
                    if not ok:
                        failed += 1
                        print(f'  ! {work} bk{doc["number"]} ch{ch["number"]} '
                              f'§§{sections[0][0]}-{sections[-1][0]}: split rejected, left as-is')
                        continue
                    for k, part in zip(idxs, parts):
                        ch['sections'][k]['text'] = part.strip()
                    done += 1; changed = True
            if changed:
                f.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        verb = 'blocks to align' if dry else f'aligned={done} failed={failed}'
        print(f'{work:14s} {verb} (total multi-§ blocks: {todo})')


if __name__ == '__main__':
    main()
