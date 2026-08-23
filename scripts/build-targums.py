# Fetches the public-domain Aramaic-Targum translations that the Backgrounds cross-reference
# dataset cites most — Targum Isaiah (C. W. H. Pauli, 1871) and Targum Pseudo-Jonathan on the
# Pentateuch (J. W. Etheridge, 1862) — from the Sefaria API and writes each into the shared
# prose chapter -> verse JSON shape (public/data/targums/<slug>.json), the same shape the
# rest of the embedded prose corpus uses (see src/lib/prose-texts.ts).
#
# Sefaria serves these as its DEFAULT English versions (both public domain), with the text as
# a [chapter][verse] array aligned to the Masoretic chapter:verse numbering the dataset cites
# ("Tg. Isa. 6:9", "Tg. Ps.-J. Gen 3:15"). Targum Onkelos is deferred: Sefaria only carries a
# modern (CC-BY-NC) Onkelos English, not a public-domain one.
#
# Usage:  python3 scripts/build-targums.py   (fetches over HTTPS, caching under /tmp; pass
#         --no-cache to force re-fetch). Run from the repo root. Prints a validation report.

import html
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = 'https://www.sefaria.org/api/texts/'
CACHE = Path('/tmp/targums')
OUT_DIR = Path('public/data/targums')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
PAULI = 'Text: C. W. H. Pauli’s translation of the Targum on Isaiah (“The Chaldee Paraphrase”, 1871), public domain. Source: Sefaria (sefaria.org).'
ETHERIDGE = 'Text: J. W. Etheridge’s translation of Targum Pseudo-Jonathan (1862), public domain. Source: Sefaria (sefaria.org).'
# ⚠ ONE VERSE IS NOT ETHERIDGE. The un-pinned /api/texts/ endpoint returns Sefaria's DEFAULT
# text, and where the default version has a hole Sefaria fills it from another version and
# returns versionTitle=None for the whole book. That happens once: Numbers 1:45, which comes
# from "Sefaria Community Translation" (CC0), not from Etheridge — whose own segment there is
# empty. It is written in Etheridge's idiom ("Beni Israel"), which is why it reads seamlessly.
# No licence problem (CC0), but the attribution above is inaccurate for that one verse.
# Pinning the version (&ven=...) would make the corpus purely Etheridge at the cost of turning
# Num 1:45 into a 27th numbered hole. Left as-is pending a decision; do not "fix" silently.

# slug, display name, noteBook, Sefaria index, citation abbreviation, attribution.
TARGUMS = [
    ('tg-isaiah',       'Targum Isaiah',                     'TgIsa',  'Targum Jonathan on Isaiah',      'Tg. Isa.',        PAULI),
    ('tg-psj-genesis',  'Targum Pseudo-Jonathan (Genesis)',  'TgPsJGen','Targum Jonathan on Genesis',     'Tg. Ps.-J. Gen',  ETHERIDGE),
    ('tg-psj-exodus',   'Targum Pseudo-Jonathan (Exodus)',   'TgPsJExod','Targum Jonathan on Exodus',      'Tg. Ps.-J. Exod', ETHERIDGE),
    ('tg-psj-leviticus','Targum Pseudo-Jonathan (Leviticus)','TgPsJLev','Targum Jonathan on Leviticus',   'Tg. Ps.-J. Lev',  ETHERIDGE),
    ('tg-psj-numbers',  'Targum Pseudo-Jonathan (Numbers)',  'TgPsJNum','Targum Jonathan on Numbers',     'Tg. Ps.-J. Num',  ETHERIDGE),
    ('tg-psj-deuteronomy','Targum Pseudo-Jonathan (Deuteronomy)','TgPsJDeut','Targum Jonathan on Deuteronomy','Tg. Ps.-J. Deut',ETHERIDGE),
]

_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def fetch(index: str, no_cache: bool) -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (index.replace(' ', '_') + '.json')
    if cached.exists() and not no_cache:
        return json.loads(cached.read_text())
    url = API + urllib.parse.quote(index) + '?context=0&pad=0'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    data = urllib.request.urlopen(req, timeout=45, context=_ctx).read()
    cached.write_bytes(data)
    time.sleep(0.4)
    return json.loads(data)


def clean(s: str) -> str:
    s = html.unescape(s)                     # &lt;mymr'&gt; → <mymr'>, &amp; → & …
    # Strip real HTML tags (italics, footnote sup, line breaks, …).
    s = re.sub(r'</?(?:i|b|u|em|strong|sup|sub|br|span|a|small|big|p|div)(?:\s[^>]*)?>', ' ', s, flags=re.I)
    # What's left in angle brackets is Etheridge's Aramaic transliteration glosses
    # (e.g. "the Word <mymr'>") — keep them, in parentheses, rather than as stray tags.
    s = re.sub(r'<\s*([^<>]+?)\s*>', r'(\1)', s)
    s = re.sub(r'\s+', ' ', s).strip()
    # Sefaria's text drifts: at some point after this corpus was first built it acquired
    # French-style spaces before punctuation ("What is that in thy hand ?"), which re-running
    # the build would otherwise have introduced into 22 verses across four of the six works.
    # Etheridge does not set punctuation that way and the committed corpus has none of it, so
    # normalising here is what keeps a rebuild byte-identical instead of silently churning.
    # The full stop is deliberately NOT in this class: Lev 24:4 is Etheridge's lacuna ". . ."
    # and collapsing it to "..." would destroy the one thing that verse carries.
    return re.sub(r'\s+([?!,;:])', r'\1', s)


def build_work(slug, name, note_book, index, abbrev, attribution, no_cache):
    doc_json = fetch(index, no_cache)
    text = doc_json.get('text') or []
    chapters = []
    for ci, verses in enumerate(text, start=1):
        out = []
        for vi, v in enumerate(verses, start=1):
            t = clean(v) if isinstance(v, str) else ''
            # The verse NUMBER is the array index, so dropping an empty segment leaves a
            # numbered hole rather than shifting everything up — which is right, because the
            # numbering is how the targum is cited. But the hole is otherwise INVISIBLE, so
            # report_gaps() below prints them: 26 such holes exist in Pseudo-Jonathan, and it
            # took a page-by-page collation of the printed edition to establish they are not
            # our bug. See the note above report_gaps().
            if t:
                out.append({'number': vi, 'text': t})
        if out:
            chapters.append({'number': ci, 'verses': out})
    doc = {'work': name, 'attribution': attribution, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    nums = [c['number'] for c in chapters]
    return {'slug': slug, 'abbrev': abbrev, 'chapters': len(chapters), 'maxch': nums[-1] if nums else 0,
            'verses': sum(len(c['verses']) for c in chapters), 'doc': doc}


def resolve(text, works):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    # Longest abbrev first so "Tg. Ps.-J. Gen" wins before any shorter prefix.
    for w in sorted(works, key=lambda w: -len(w['abbrev'])):
        m = re.match(re.escape(w['abbrev']) + r'\s+(\d+)[:.](\d+)', s)
        if m:
            return (w['slug'], int(m.group(1)), int(m.group(2)))
    return None


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    abbrs = tuple(r['abbrev'] for r in results)
    cits = []
    for e in data['entries']:
        for c in e.get('citations', []):
            if re.sub(r'^cf\.\s*', '', c['text'].strip()).startswith(abbrs):
                cits.append(c['text'])
    hit = miss = unmapped = 0
    misses = []
    for text in cits:
        r = resolve(text, results)
        if not r:
            unmapped += 1; misses.append(('UNMAPPED', text)); continue
        slug, ch, v = r
        doc = by_slug[slug]['doc']
        chap = next((c for c in doc['chapters'] if c['number'] == ch), None)
        found = chap and any(vv['number'] == v for vv in chap['verses'])
        if found: hit += 1
        else: miss += 1; misses.append((f'{slug} {ch}:{v} not in text', text))
    print(f'\nValidation: {len(cits)} Targum citations (embedded works) | resolved+found={hit} '
          f'resolved-but-missing={miss} unmapped={unmapped}')
    for why, text in misses:
        print(f'   MISS  {text:34s} -> {why}')


# ── Gap report ────────────────────────────────────────────────────────────────────────────
# Two kinds of hole exist in this corpus, and BOTH were invisible until they were looked for.
# Neither is a bug in this script; both are in the source, and they are reported rather than
# mended so that nobody re-diagnoses them from scratch.
#
# 1. NUMBERED HOLES — a verse Sefaria carries as an empty string. There are 26, all in
#    Pseudo-Jonathan (Gen 5:5-7, 6:15, 10:23, 24:28, 26:30, 39:18, 41:49, 44:30-31; Exod 4:8,
#    7:5, 12:43-44, 25:28, 27:15, 37:23, 39:27-29; Lev 13:52; Num 2:12, 3:2, 36:8-9). These
#    were collated against Etheridge's PRINTED 1862 edition on archive.org
#    (targumsonkelosa00ethegoog = Genesis+Exodus, cu31924074296975 = Lev/Num/Deut), reading
#    only the "Targum of Palestine" half of each volume — the volumes print Onkelos first and
#    Palestine second, and Onkelos IS complete, so searching a whole volume finds Onkelos and
#    would corrupt this corpus with a different targum. Result: all 26 are absent from the
#    printed Pseudo-Jonathan too. At Num 36:8-9 Etheridge says so himself, in the text:
#    "(Verses 9 and 10 are wanting.)" At Gen 5:5 and Gen 39:18 he prints a bracketed reading
#    from the JERUSALEM (Fragment) targum instead — a different targum, deliberately NOT
#    folded in here. So there is nothing to backfill and the corpus is left alone.
#
# 2. CONTENT-FREE VERSES — segments that survive the `if t:` filter because their text is a
#    placeholder rather than empty: 54 verses in Num 7 whose whole text is "_", and Lev 24:4
#    (". . ."). Num 7 is Etheridge's own abridgement of the twelve identical princely
#    offerings; his footnote reads "The oblation of each of the twelve princes was precisely
#    the same. I have therefore omitted the details after the first... The Targumist abridges
#    here, also." A further 19 verses carry an inline "_" marking the same kind of elision.
#    These ARE served to readers as verses; treat the count as a regression signal.
def report_gaps(results):
    print('\nGaps (reported, never mended — see the note above report_gaps):')
    for r in results:
        holes, blank, marked = [], [], []
        for c in r['doc']['chapters']:
            nums = [int(v['number']) for v in c['verses']]
            for n in sorted(set(range(min(nums), max(nums) + 1)) - set(nums)):
                holes.append(f"{c['number']}:{n}")
            for v in c['verses']:
                if not re.search(r'[A-Za-z]{2,}', v['text']):
                    blank.append(f"{c['number']}:{v['number']}")
                elif '_' in v['text']:
                    marked.append(f"{c['number']}:{v['number']}")
        print(f"   {r['slug']:22s} numbered-holes={len(holes):3d}  content-free={len(blank):3d}  "
              f"elision-marked={len(marked):3d}")
        if holes:
            print(f"      holes: {', '.join(holes)}")
        if blank:
            print(f"      content-free: {', '.join(blank[:8])}"
                  + (f" … (+{len(blank) - 8} more)" if len(blank) > 8 else ''))


def main():
    no_cache = '--no-cache' in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for slug, name, note_book, index, abbrev, attribution in TARGUMS:
        r = build_work(slug, name, note_book, index, abbrev, attribution, no_cache)
        results.append(r)
        print(f'{slug:22s} chapters={r["chapters"]:3d} (max {r["maxch"]:3d}) verses={r["verses"]:5d}')
    validate(results)
    report_gaps(results)


if __name__ == '__main__':
    main()
