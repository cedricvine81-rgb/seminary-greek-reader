#!/usr/bin/env python3
"""Fetch Bengel's Gnomon note for each device-verse in the Rhetoric catalogue.

Reads the occurrence refs out of src/lib/rhetoric-devices.ts, fetches each verse's
"Bengel's Gnomon" section from Biblehub, and writes public/data/rhetoric/bengel.json
keyed by reference. Bengel's Gnomon (1742; Eng. tr. 1857) is public domain. Re-runs skip
refs already cached, so it's cheap to add devices later.
"""
import os, re, json, time, html, subprocess, glob

HERE = os.path.dirname(os.path.abspath(__file__))
DEVICES_TS = os.path.join(HERE, os.pardir, "src", "lib", "rhetoric-devices.ts")
DEVICES_DIR = os.path.join(HERE, os.pardir, "public", "data", "rhetoric", "devices")
OUT = os.path.join(HERE, os.pardir, "public", "data", "rhetoric", "bengel.json")

SLUG = {
    "Matt": "matthew", "Mark": "mark", "Luke": "luke", "John": "john", "Acts": "acts",
    "Romans": "romans", "1 Corinthians": "1_corinthians", "2 Corinthians": "2_corinthians",
    "Galatians": "galatians", "Ephesians": "ephesians", "Philippians": "philippians",
    "Colossians": "colossians", "1 Thessalonians": "1_thessalonians", "2 Thessalonians": "2_thessalonians",
    "1 Timothy": "1_timothy", "2 Timothy": "2_timothy", "Titus": "titus", "Philemon": "philemon",
    "Hebrews": "hebrews", "James": "james", "1 Peter": "1_peter", "2 Peter": "2_peter",
    "1 John": "1_john", "2 John": "2_john", "3 John": "3_john", "Jude": "jude", "Revelation": "revelation",
}

def refs_from_devices():
    refs = re.findall(r"ref:\s*'([^']+)'", open(DEVICES_TS, encoding="utf-8").read())
    for f in sorted(glob.glob(os.path.join(DEVICES_DIR, "*.json"))):   # per-book Bullinger data
        for d in json.load(open(f, encoding="utf-8")).get("devices", []):
            refs += [o["ref"] for o in d.get("occurrences", [])]
    return list(dict.fromkeys(refs))   # ordered-unique

def parse_ref(ref):
    m = re.match(r"^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)$", ref.strip())
    if not m: return None
    book, ch, v = m.group(1).strip(), m.group(2), m.group(3)
    return SLUG.get(book), ch, v

def fetch(url):
    env = dict(os.environ, CURL_CA_BUNDLE="/etc/ssl/cert.pem")
    # bytes + tolerant decode: an occasional biblehub response has a stray non-UTF-8 byte
    r = subprocess.run(["curl", "-sS", "--compressed", "-A", "Mozilla/5.0", url],
                       capture_output=True, env=env, timeout=40)
    return r.stdout.decode("utf-8", errors="replace")

def bengel_note(h):
    # the section is the "Bengel's Gnom(e/o)n" heading block, up to the next vheading2
    m = re.search(r'<div class="vheading2"><a href="/commentaries/bengel/[^"]*">Bengel[^<]*</a></div>', h)
    if not m: return ""
    seg = h[m.end():]
    end = seg.find('<div class="vheading2">')
    if end != -1: seg = seg[:end]
    seg = re.sub(r'^\s*<a [^>]*>[^<]*</a>\.?\s*', '', seg, count=1)   # drop leading verse-ref link
    txt = re.sub(r'<[^>]+>', ' ', seg)
    txt = html.unescape(re.sub(r'\s+', ' ', txt)).strip()
    return re.sub(r'^[A-Za-z0-9 ]+\d+:\d+[\-–\d]*\s*\.?\s*', '', txt)   # trim any stray leading ref

def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    data = {}
    if os.path.exists(OUT):
        data = json.load(open(OUT, encoding="utf-8"))
    refs = refs_from_devices()
    print(f"{len(refs)} device-verses; {len(data)} already cached", flush=True)
    save = lambda: json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    done = 0
    for i, ref in enumerate(refs):
        if ref in data and data[ref]:
            continue
        p = parse_ref(ref)
        if not p or not p[0]:
            print(f"  ? skip unparseable: {ref}", flush=True); data[ref] = ""; continue
        slug, ch, v = p
        try:
            note = bengel_note(fetch(f"https://biblehub.com/commentaries/{slug}/{ch}-{v}.htm"))
        except Exception as e:                       # one bad response must not abort the run
            print(f"  ! {ref}: {type(e).__name__} — retry next run", flush=True); continue
        data[ref] = note
        done += 1
        print(f"  [{i+1}/{len(refs)}] {ref:24} {'· ' + note[:60] if note else '(none)'}", flush=True)
        if done % 40 == 0: save()                    # persist progress periodically
        time.sleep(0.4)
    save()
    got = sum(1 for v in data.values() if v)
    print(f"wrote {OUT} — {got}/{len(data)} with a Bengel note")

if __name__ == "__main__":
    main()
