#!/usr/bin/env python3
"""
Fill in the English translation for Dio Chrysostom, Orations.

The Greek (von Arnim, from Perseus) was ingested Greek-only because no
public-domain English aligned to its section numbering was to hand. It is:
the Loeb Classical Library translation by J. W. Cohoon (†1946) and H. Lamar
Crosby (†1954), 1932–1951, whose US copyrights lapsed without renewal — hence
its open hosting by LacusCurtius (Bill Thayer) and ToposText. Thayer's
digitisation is complete (all 80 Discourses) and section-numbered with the same
von Arnim §§ our Greek uses, so it pairs section-by-section.

Source: https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Dio_Chrysostom/Discourses/<n>*.html
Each discourse page marks section boundaries as <A CLASS="sec" NAME="k">k</A>
(section 1 is implicit, the text between the <H2> title and the first anchor),
and footnotes begin at the first <HR> after the last section.

This reads public/data/greco/dio-chrysostom-orations.json in place, fills each
verse's empty `text` with the matching English, drops the `greekOnly` flag, and
reports coverage. Re-runnable; caches fetched pages under the scratch dir.
"""
import json, os, re, sys, time, html, ssl, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'public/data/greco/dio-chrysostom-orations.json')
CACHE = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'dio-lacuscurtius-cache')
BASE = 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Dio_Chrysostom/Discourses/'

# The stale-anaconda-cert workaround (see memory reference-network-ssl-cert):
# point at the system bundle so HTTPS verifies.
_ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')


def fetch(n: int) -> str | None:
    os.makedirs(CACHE, exist_ok=True)
    cached = os.path.join(CACHE, f'{n}.html')
    if os.path.exists(cached) and os.path.getsize(cached) > 500:
        return open(cached, encoding='utf-8', errors='replace').read()
    url = f'{BASE}{n}*.html'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (seminary-greek-reader build script)'})
    try:
        raw = urllib.request.urlopen(req, context=_ctx, timeout=30).read().decode('utf-8', 'replace')
    except Exception as e:
        print(f'  ! discourse {n}: fetch failed ({e})')
        return None
    open(cached, 'w', encoding='utf-8').write(raw)
    time.sleep(0.3)  # be polite to Thayer's server
    return raw


def clean(fragment: str) -> str:
    """One section's inner HTML -> plain text."""
    s = fragment
    # Footnote superscript refs: <A CLASS="ref" ...>...</A> — drop entirely.
    s = re.sub(r'<A\s[^>]*CLASS="ref"[^>]*>.*?</A>', '', s, flags=re.I | re.S)
    # Page-number tags: <A ID="pNN"><SPAN CLASS="pagenum"> p47 </SPAN></A> — drop.
    s = re.sub(r'<A\s[^>]*ID="p\d+"[^>]*>\s*<SPAN\s[^>]*CLASS="pagenum"[^>]*>.*?</SPAN>\s*</A>', '', s, flags=re.I | re.S)
    s = re.sub(r'<SPAN\s[^>]*CLASS="pagenum"[^>]*>.*?</SPAN>', '', s, flags=re.I | re.S)
    # Everything else: strip tags (SPAN CLASS="whole", the sec anchor, links, <P>, <BR>).
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    s = s.replace('⁠', '').replace('\xa0', ' ')  # word-joiner, nbsp
    s = re.sub(r'\s+', ' ', s).strip()
    return s


# A section anchor. The section number is the anchor's *inner text* (always the
# bare number) — the NAME attribute varies across discourses ("2", ".2", "51.2"),
# so the visible number is the only reliable key.
SEC = re.compile(r'<A\s[^>]*CLASS="sec"[^>]*>\s*(\d+)\s*</A>', re.I)


def parse_discourse(raw: str) -> dict[int, str]:
    # Body starts after the discourse-title <H2 ...>...</H2>.
    m = re.search(r'<H2\s[^>]*CLASS="start2"[^>]*>.*?</H2>', raw, re.I | re.S)
    body = raw[m.end():] if m else raw
    # Cut off footnotes: first <HR> after the last section anchor.
    secs = list(SEC.finditer(body))
    if secs:
        hr = re.search(r'<HR\b', body[secs[-1].start():], re.I)
        if hr:
            body = body[:secs[-1].start() + hr.start()]
    else:
        hr = re.search(r'<HR\b', body, re.I)
        if hr:
            body = body[:hr.start()]
    # Re-find anchors within the trimmed body and split.
    anchors = list(SEC.finditer(body))
    out: dict[int, str] = {}
    # Section 1 = text before the first anchor.
    first_start = anchors[0].start() if anchors else len(body)
    t1 = clean(body[:first_start])
    if t1:
        out[1] = t1
    for i, a in enumerate(anchors):
        num = int(a.group(1))
        end = anchors[i + 1].start() if i + 1 < len(anchors) else len(body)
        out[num] = clean(body[a.end():end])
    return out


# Perseus's grc numbers five discourses 84–88; these are in fact von Arnim's
# 14–18 (On Slavery and Freedom I–II, On Pain, On Covetousness, On Public
# Speaking), mis-shelved +70. Section counts match one-for-one. Correct the
# numbering so citations read "Dio 14" not "Dio 84" and the English pairs up.
ORATION_REMAP = {84: 14, 85: 15, 86: 16, 87: 17, 88: 18}


def main():
    doc = json.load(open(DATA, encoding='utf-8'))

    english: dict[int, dict[int, str]] = {}
    for n in range(1, 81):
        raw = fetch(n)
        if not raw:
            continue
        english[n] = parse_discourse(raw)

    # Correct the mis-numbered orations before pairing, then keep the run in order.
    for ch in doc['chapters']:
        ch['number'] = ORATION_REMAP.get(ch['number'], ch['number'])
    doc['chapters'].sort(key=lambda c: c['number'])

    filled = missing = 0
    per_oration_missing: list[tuple[int, int, int]] = []
    no_english_orations: list[int] = []
    for ch in doc['chapters']:
        o = ch['number']
        eng = english.get(o)
        if not eng:
            no_english_orations.append(o)
            missing += len(ch['verses'])
            continue
        omiss = 0
        for v in ch['verses']:
            txt = eng.get(v['number'])
            if txt:
                v['text'] = txt
                filled += 1
            else:
                missing += 1
                omiss += 1
        if omiss:
            per_oration_missing.append((o, omiss, len(ch['verses'])))

    # No longer Greek-only.
    doc.pop('greekOnly', None)
    doc['englishAttribution'] = ('Translation: J. W. Cohoon & H. Lamar Crosby, Loeb Classical '
                                 'Library (1932–1951); public domain, digitised by Bill Thayer '
                                 '(LacusCurtius).')

    json.dump(doc, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False)

    # The morphology sidecar is keyed "oration.section" — renumber its 84–88 keys
    # to match. (No English involved; just keeping the two files consistent.)
    morph_path = DATA.replace('.json', '.morph.json')
    if os.path.exists(morph_path):
        morph = json.load(open(morph_path, encoding='utf-8'))
        remapped = {}
        for k, v in morph.items():
            o, _, s = k.partition('.')
            o = str(ORATION_REMAP.get(int(o), int(o)))
            remapped[f'{o}.{s}'] = v
        # keep keys in oration/section order
        remapped = dict(sorted(remapped.items(), key=lambda kv: (int(kv[0].split('.')[0]), int(kv[0].split('.')[1]))))
        json.dump(remapped, open(morph_path, 'w', encoding='utf-8'), ensure_ascii=False)
        print(f'Renumbered morph sidecar keys ({morph_path}).')

    total = filled + missing
    print(f'\nFilled {filled}/{total} sections with English ({100*filled//total}%).')
    if no_english_orations:
        print(f'Orations with NO English (not in Loeb 1–80 / not fetched): {sorted(no_english_orations)}')
    if per_oration_missing:
        print('Orations with partial gaps (oration, missing, total):')
        for o, mi, tot in per_oration_missing:
            print(f'  {o}: {mi}/{tot}')
    print(f'\nWrote {DATA}')


if __name__ == '__main__':
    main()
