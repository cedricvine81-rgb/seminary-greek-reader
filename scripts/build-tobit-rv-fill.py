"""Fill the gaps in Brenton's Tobit with the Revised Version (1894).

Brenton's 1851 English translates Codex Vaticanus, which has manuscript lacunae in Tobit
(4:7–19, and a few shorter gaps). The app's Greek is Rahlfs (the longer Sinaiticus recension),
which supplies those verses — so the Greek is complete but Brenton has no English for them, and
the reader / background search show a blank translation there (e.g. Tobit 4:12).

This supplies the missing verses from the Revised Version Apocrypha (1895, public domain, via
ebible.org's eng-rv), whose versification matches the Rahlfs Greek one-for-one (verified: RV 4:12
= the Greek 4:12). Only verses present in the Greek but absent from Brenton are filled, and each
is tagged " (RV)" so the source stays honest.

Edits public/data/brenton/Tob.json in place. Rebuild backgrounds-search afterwards.
Usage:  python3 scripts/build-tobit-rv-fill.py [--no-cache]   (run from the repo root)
"""
import glob
import html
import json
import os
import re
import ssl
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRENTON = os.path.join(ROOT, 'public/data/brenton/Tob.json')
LXX_GLOB = os.path.join(ROOT, 'public/data/lxx/Tob_*.json')
CACHE = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'rv-tobit-cache')
RV_URL = 'https://ebible.org/eng-rv/TOB{:02d}.htm'
TAG = ' (RV)'

# A few chapter-end verses where the RV's (shorter-recension) numbering is offset by one from
# the Rahlfs Greek: map Greek (chapter, verse) → the RV (chapter, verse) that carries the same
# text. (Verified by content: Greek 5:23 "and she ceased weeping" = RV 5:22.) Gaps with no clean
# RV counterpart — 6:18, 6:19, 10:14, where the RV merges or omits the verse — are left Greek-only.
RV_VERSE_OVERRIDE = {(5, 23): (5, 22)}

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch_rv(ch: int, no_cache: bool) -> str:
    os.makedirs(CACHE, exist_ok=True)
    cached = os.path.join(CACHE, f'{ch:02d}.html')
    if os.path.exists(cached) and not no_cache:
        return open(cached, encoding='utf-8', errors='replace').read()
    req = urllib.request.Request(RV_URL.format(ch), headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, context=_ctx, timeout=30).read().decode('utf-8', 'replace')
    open(cached, 'w', encoding='utf-8').write(data)
    return data


def parse_rv(h: str) -> dict[int, str]:
    # Verses are marked <span class="verse" id="V<n>"><n>&#160;</span> then the verse text.
    parts = re.split(r'<span[^>]*class="verse"[^>]*id="V(\d+)"[^>]*>\d+(?:&#160;|&nbsp;|\s)*</span>', h)
    out: dict[int, str] = {}
    for i in range(1, len(parts) - 1, 2):
        num = int(parts[i])
        seg = re.split(r'<div|<hr|class="nav|footnote|<p[^>]*class="p-x', parts[i + 1])[0]
        txt = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', seg))).strip()
        # The last verse of a chapter captures the footer nav ("Tobit < 5 >"): strip a trailing
        # book-name + chapter-arrow tail.
        txt = re.sub(r'\s*(Tobit\s*)?<\s*\d+\s*>\s*$', '', txt).strip()
        # RV cross-reference letters/footnote markers occasionally survive as a trailing " a" —
        # trim a lone trailing single-letter token.
        txt = re.sub(r'\s+[a-z]$', '', txt).strip()
        if txt:
            out[num] = txt
    return out


def greek_verses() -> dict[int, list[int]]:
    out: dict[int, list[int]] = {}
    for f in glob.glob(LXX_GLOB):
        ch = int(re.search(r'Tob_(\d+)', f).group(1))
        d = json.load(open(f, encoding='utf-8'))
        vs = d.get('verses') or []
        out[ch] = sorted(v['verse'] for v in vs)
    return out


def main():
    no_cache = '--no-cache' in sys.argv
    bren = json.load(open(BRENTON, encoding='utf-8'))
    bset = {tuple(int(x) for x in k.split('.')[1:]) for k in bren}
    greek = greek_verses()

    filled = []
    for ch in sorted(greek):
        missing = [v for v in greek[ch] if (ch, v) not in bset]
        if not missing:
            continue
        rv_by_ch: dict[int, dict[int, str]] = {ch: parse_rv(fetch_rv(ch, no_cache))}
        for v in missing:
            rch, rv_v = RV_VERSE_OVERRIDE.get((ch, v), (ch, v))
            if rch not in rv_by_ch:
                rv_by_ch[rch] = parse_rv(fetch_rv(rch, no_cache))
            text = rv_by_ch[rch].get(rv_v)
            if text:
                bren[f'Tob.{ch}.{v}'] = text + TAG
                filled.append((ch, v))
            else:
                print(f'  ! Tob {ch}:{v} — no clean RV counterpart (left Greek-only)')

    # Re-sort keys into canonical chapter.verse order so the inserted verses sit in place.
    ordered = dict(sorted(bren.items(), key=lambda kv: tuple(int(x) for x in kv[0].split('.')[1:])))
    json.dump(ordered, open(BRENTON, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

    print(f'Filled {len(filled)} Brenton gaps in Tobit from the RV:')
    for ch, v in filled:
        print(f'  Tob {ch}:{v}')
    print(f'\nWrote {BRENTON}. Rebuild backgrounds-search next.')


if __name__ == '__main__':
    main()
