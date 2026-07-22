#!/usr/bin/env python3
"""Build Swanson-style manuscript-collation data for the Exegesis "Variants" tab.

Source: CNTR electronic transcriptions (github.com/Center-for-New-Testament-Restoration
/transcriptions, CC BY-SA 4.0) — class 1 = early great uncials + papyri — collated
against the Robinson-Pierpont Byzantine majority text (critical texts/RP.txt) as the
reference row.

Reads a local cache of the transcription .txt files (see CACHE below; downloaded once),
parses the MES encoding, aligns every witness word-by-word to the RP reference per verse,
and writes one JSON per chapter to  <reader>/public/data/variants/<Osis>_<ch>.json .

Usage:  python3 build-variants.py [all | John | Matt:12 | John:1 ...]
"""
import re, os, sys, json, ssl, unicodedata, difflib, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cntr")                 # cntr/class1/*.txt + cntr/RP.txt (auto-downloaded)
OUT   = os.path.join(HERE, os.pardir, "public", "data", "variants")   # → reader public/data/variants

# ── CNTR source (CC BY-SA 4.0) ────────────────────────────────────────────────────────────
GH_API = "https://api.github.com/repos/Center-for-New-Testament-Restoration/transcriptions/contents"
GH_RAW = "https://raw.githubusercontent.com/Center-for-New-Testament-Restoration/transcriptions/main"

def _ssl_ctx():
    """A working SSL context — falls back around the stale anaconda root cert issue."""
    for candidate in (None, "/etc/ssl/cert.pem"):
        try:
            ctx = ssl.create_default_context(cafile=candidate) if candidate else ssl.create_default_context()
            urllib.request.urlopen(urllib.request.Request(GH_RAW + "/README.md"), context=ctx, timeout=30).read(1)
            return ctx
        except Exception:
            continue
    print("  ! TLS verification failed; falling back to unverified fetch of public GitHub data")
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    return ctx

def _get(url, ctx):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "build-variants"}), context=ctx, timeout=60).read()

def ensure_cache():
    """Download CNTR class-1 transcriptions + the RP reference into CACHE if not already present."""
    c1 = os.path.join(CACHE, "class1")
    rp = os.path.join(CACHE, "RP.txt")
    have = os.path.isdir(c1) and len([f for f in os.listdir(c1) if f.endswith(".txt")]) > 100 and os.path.isfile(rp)
    if have:
        return
    print("Downloading CNTR transcriptions (CC BY-SA 4.0) — one-time, ~10 MB…")
    os.makedirs(c1, exist_ok=True)
    ctx = _ssl_ctx()
    listing = json.loads(_get(GH_API + "/class%201?per_page=200", ctx))
    for i, item in enumerate(listing):
        name = item["name"]
        if not name.endswith(".txt"):
            continue
        dst = os.path.join(c1, name)
        if not os.path.isfile(dst):
            with open(dst, "wb") as f:
                f.write(_get(f"{GH_RAW}/class%201/{urllib.parse.quote(name)}", ctx))
        if (i + 1) % 20 == 0:
            print(f"  …{i + 1}/{len(listing)} witnesses")
    for ed in ("RP", "SR", "WH", "KJTR"):   # RP reference + printed editions
        with open(os.path.join(CACHE, ed + ".txt"), "wb") as f:
            f.write(_get(f"{GH_RAW}/critical%20texts/{ed}.txt", ctx))
    print(f"  cached {len(os.listdir(c1))} witnesses + RP/SR/WH/KJTR")

import urllib.parse  # noqa: E402  (used by ensure_cache)

# Printed critical editions shown as extra reference-eligible lines (file id -> sigil).
EDITIONS = {"SR": "SR", "WH": "WH", "KJTR": "TR"}

# ---- book numbering (CNTR 40..66) -> Osis abbrev used by /data/gnt/<Osis>_<ch>.json ----
BOOKS = {40:"Matt",41:"Mark",42:"Luke",43:"John",44:"Acts",45:"Rom",46:"1Cor",47:"2Cor",
         48:"Gal",49:"Eph",50:"Phil",51:"Col",52:"1Thess",53:"2Thess",54:"1Tim",55:"2Tim",
         56:"Titus",57:"Phlm",58:"Heb",59:"Jas",60:"1Pet",61:"2Pet",62:"1John",63:"2John",
         64:"3John",65:"Jude",66:"Rev"}
NAME = {"Matt":"Matthew","Mark":"Mark","Luke":"Luke","John":"John","Acts":"Acts","Rom":"Romans",
        "1Cor":"1 Corinthians","2Cor":"2 Corinthians","Gal":"Galatians","Eph":"Ephesians",
        "Phil":"Philippians","Col":"Colossians","1Thess":"1 Thessalonians","2Thess":"2 Thessalonians",
        "1Tim":"1 Timothy","2Tim":"2 Timothy","Titus":"Titus","Phlm":"Philemon","Heb":"Hebrews",
        "Jas":"James","1Pet":"1 Peter","2Pet":"2 Peter","1John":"1 John","2John":"2 John",
        "3John":"3 John","Jude":"Jude","Rev":"Revelation"}
OSIS_TO_NUM = {v:k for k,v in BOOKS.items()}

# ---- witness display + text-family (approx primary family) -------------------------------
# file-id (GitHub) -> (display sigil, family). Papyri default 𝔓NN / alexandrian; majuscules
# 0NNN default GA-number / other. Curated overrides for the majors.
FAMILY_DEFAULT_PAP = "alexandrian"
FAMILY_DEFAULT_MAJ = "other"
OVERRIDES = {
    "01": ("ℵ", "alexandrian"), "02": ("A", "byzantine"), "03": ("B", "alexandrian"),
    "04": ("C", "alexandrian"), "05": ("D", "western"),   "032": ("W", "mixed"),
    "P45": ("𝔓45", "mixed"), "P66": ("𝔓66", "alexandrian"), "P75": ("𝔓75", "alexandrian"),
    "P46": ("𝔓46", "alexandrian"), "P47": ("𝔓47", "alexandrian"), "P72": ("𝔓72", "alexandrian"),
    "P52": ("𝔓52", "alexandrian"),
}
def witness_meta(fid, book=None):
    if fid in EDITIONS: return (EDITIONS[fid], "critical")
    if fid in OVERRIDES:
        sig, fam = OVERRIDES[fid]
        # Codex Alexandrinus (A) is Byzantine only in the Gospels; Alexandrian elsewhere.
        if fid == "02" and book is not None and book >= 44: fam = "alexandrian"
        return (sig, fam)
    if fid.startswith("P"): return ("𝔓" + fid[1:], FAMILY_DEFAULT_PAP)
    if fid.startswith("O"): return (fid, "other")
    return (fid, FAMILY_DEFAULT_MAJ)

# ---- MES cleaning ------------------------------------------------------------------------
NOMINA_SACRA = {"ιυ":"ιησου","ιν":"ιησουν","ις":"ιησους","ιησ":"ιησους","χυ":"χριστου","χν":"χριστον",
    "χσ":"χριστος","χρ":"χριστος","θυ":"θεου","θν":"θεον","θσ":"θεος","θω":"θεω","κυ":"κυριου",
    "κν":"κυριον","κσ":"κυριος","κω":"κυριω","πνσ":"πνευμα","πνι":"πνευματι","υυ":"υιου","υν":"υιον",
    "υσ":"υιος","ανοσ":"ανθρωπος","ανου":"ανθρωπου","ανον":"ανθρωπον","ανων":"ανθρωπων",
    "πηρ":"πατηρ","πρσ":"πατρος","μηρ":"μητηρ","ουνοσ":"ουρανος","ουνου":"ουρανου","δαδ":"δαυιδ"}
_NS = {k.replace("ς","σ"): v for k,v in NOMINA_SACRA.items()}

# MES corrections: an edited spot is `x{first-hand} [ab]?{corrector}`, where the `x` brace is
# the original scribe's text and the following brace (plain, or a/b for later hands) is the
# correction. A lone `x{…}` is text the corrector deleted; a lone `a{…}`/`b{…}` is a corrector
# addition. `hand` selects which reading to reconstruct: '*' = first hand, 'c' = corrector.
_PAIR = re.compile(r"x\{([^}]*)\}\s*[ab]?\{([^}]*)\}")
def apply_corrections(text, hand):
    star = hand == "*"
    text = _PAIR.sub((lambda m: m.group(1) if star else m.group(2)), text)      # paired x{}/{}
    text = re.sub(r"x\{([^}]*)\}", (lambda m: m.group(1) if star else ""), text) # lone original (deleted)
    text = re.sub(r"[ab]\{([^}]*)\}", (lambda m: "" if star else m.group(1)), text) # lone addition
    text = re.sub(r"\{([^}]*)\}", lambda m: m.group(1), text)                    # plain edited text
    return text

def clean_tokens(t):
    t = re.sub(r"\\\d+", " ", t)
    t = t.replace("\\", " ").replace("|", " ").replace("/", "")
    t = re.sub(r"[&*%^¯˚]", "", t)          # lacuna/damage marks + ˚ nomina-sacra ring (editions)
    for ch in "~+[]_⋄": t = t.replace(ch, "")
    toks = []
    for w in t.split():
        w = re.sub(r"^[xab]+(?=[α-ωΑ-Ω=])", "", w).strip(".,·;:—")
        w = re.sub(r"^\d+", "", w)   # stray leading folio/column digit
        if not w or w in ("x", "a", "b"): continue
        if w.startswith("="):
            w = _NS.get(w[1:].strip("$").replace("ς", "σ"), w[1:].strip("$"))
        toks.append(w.replace("$", ""))
    return toks

def strip_mes(text):   # single reading, corrections resolved to the corrector (final) text
    return clean_tokens(apply_corrections(text, "c"))

def readings_for(raw):
    """One reading normally; two (first-hand '*', corrector 'ᶜ') where the scribe was corrected."""
    if "{" not in raw:
        return [("", clean_tokens(raw))]
    star = clean_tokens(apply_corrections(raw, "*"))
    corr = clean_tokens(apply_corrections(raw, "c"))
    if star == corr:
        return [("", star)]
    return [("*", star), ("ᶜ", corr)]

def norm(tok):
    d = unicodedata.normalize("NFD", tok.lower())
    d = "".join(c for c in d if unicodedata.category(c) != "Mn").replace("ς","σ")
    return re.sub(r"[^α-ω]", "", d)

# ---- load every witness once, indexed by verse-id ----------------------------------------
def load_all():
    wits = {}   # fid -> {vid(int): raw}
    files = ["RP"] + list(EDITIONS) + sorted(f[:-4] for f in os.listdir(os.path.join(CACHE,"class1")) if f.endswith(".txt"))
    for fid in files:
        path = (os.path.join(CACHE, fid + ".txt") if fid == "RP" or fid in EDITIONS
                else os.path.join(CACHE, "class1", fid + ".txt"))
        d = {}
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.rstrip("\n")
                if not line[:1].isdigit(): continue
                sp = line.find(" ")
                if sp < 0: continue
                try: vid = int(line[:sp])
                except ValueError: continue
                d[vid] = line[sp+1:]
        wits[fid] = d
    return wits

# Align one witness reading to the reference. Returns (ref_map, ins):
#   ref_map[i] = (token, differs, omits) mapped onto reference column i
#   ins[gap]   = [tokens the witness adds after reference column `gap` (-1 = before the line)]
# Insertions become their own shared columns at merge time (see build_chapter), so reordered
# or added words get a dedicated slot instead of being concatenated into a neighbour cell.
def align_one(ref_tokens, ref_norm, w_tokens):
    w_norm = [norm(t) for t in w_tokens]
    ref_map = [None] * len(ref_tokens)
    ins = {}
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ref_norm, w_norm, autojunk=False).get_opcodes():
        if op == "equal":
            for k in range(i2 - i1): ref_map[i1 + k] = (w_tokens[j1 + k], False, False)
        elif op == "replace":
            span = i2 - i1; wl = w_tokens[j1:j2]
            for k in range(span):
                ref_map[i1 + k] = (wl[k], True, False) if k < len(wl) else ("", True, True)
            if len(wl) > span:
                ins.setdefault(i2 - 1, []).extend(wl[span:])
        elif op == "delete":
            for k in range(i1, i2): ref_map[k] = ("", True, True)
        elif op == "insert":
            ins.setdefault(i1 - 1, []).extend(w_tokens[j1:j2])
    for i in range(len(ref_tokens)):
        if ref_map[i] is None: ref_map[i] = ("", True, True)
    return ref_map, ins

FAMILY_ORDER = {"byzantine":0,"alexandrian":1,"western":2,"mixed":3,"other":4}

def build_chapter(wits, osis, ch):
    num = OSIS_TO_NUM[osis]
    vbase = num*1_000_000 + ch*1000
    # verses present in RP for this chapter
    rp = wits["RP"]
    vids = sorted(v for v in rp if vbase < v < vbase+1000)
    if not vids: return None
    # which witnesses have ≥1 verse in this chapter
    present = []
    for fid, d in wits.items():
        if fid=="RP": continue
        if any(vbase < v < vbase+1000 for v in d): present.append(fid)
    # order: printed editions first, then papyri (by number), then majuscules.
    ED_ORDER = {"SR": 0, "WH": 1, "KJTR": 2}
    def sortkey(fid):
        if fid in EDITIONS: return (0, ED_ORDER.get(fid, 9))
        n = int(re.sub(r"\D", "", fid) or 0)
        return (1 if fid.startswith("P") else 2, n)
    present.sort(key=sortkey)

    verses=[]
    for vid in vids:
        ref_tokens = strip_mes(rp[vid])
        ref_norm = [norm(t) for t in ref_tokens]
        # Align every witness reading (splitting corrector hands) to the reference.
        aligned = []   # {wid, sigil, family, rmap, ins}
        lac = []       # chapter witnesses physically absent at this verse (the "lac." line)
        for fid in present:
            sig, fam = witness_meta(fid, num)
            raw = wits[fid].get(vid)
            if raw is None:
                lac.append(sig); continue
            for suffix, toks in readings_for(raw):
                rmap, ins = align_one(ref_tokens, ref_norm, toks)
                aligned.append({"wid": fid, "sigil": sig + suffix, "family": fam, "rmap": rmap, "ins": ins})
        # Merge insertion widths across all rows → a shared column layout.
        gap_w = {}
        for a in aligned:
            for g, lst in a["ins"].items():
                gap_w[g] = max(gap_w.get(g, 0), len(lst))
        cols = []   # ('ref', i) | ('ins', gap, slot)
        def add_gap(g):
            for k in range(gap_w.get(g, 0)): cols.append(("ins", g, k))
        add_gap(-1)
        for i in range(len(ref_tokens)):
            cols.append(("ref", i)); add_gap(i)
        # Each cell is just the witness's word for that column ("" = omission / unused insertion
        # slot). The renderer recomputes "differs"/"omits" against the chosen reference, so no
        # per-cell flags are stored.
        def cells_for(rmap, ins):
            out = []
            for col in cols:
                if col[0] == "ref":
                    out.append(rmap[col[1]][0])
                else:
                    lst = ins.get(col[1], [])
                    out.append(lst[col[2]] if col[2] < len(lst) else "")
            return out
        ref_rmap = [(t, False, False) for t in ref_tokens]
        rows = [{"wid": "RP", "sigil": "𝔐", "family": "byzantine", "cells": cells_for(ref_rmap, {})}]
        for a in aligned:
            rows.append({"wid": a["wid"], "sigil": a["sigil"], "family": a["family"], "cells": cells_for(a["rmap"], a["ins"])})
        verses.append({"verse": vid - vbase, "vid": str(vid), "refTokens": ref_tokens, "rows": rows, "lac": lac})

    witnesses=[{"wid":"RP","sigil":"𝔐","family":"byzantine"}]+[
        {"wid":f,"sigil":witness_meta(f, num)[0],"family":witness_meta(f, num)[1]} for f in present]
    return {"book":osis,"chapter":ch,"reference":f"{NAME[osis]} {ch}",
            "witnesses":witnesses,"verses":verses,
            "source":"CNTR electronic transcriptions (Alan Bunning / Center for New Testament "
                     "Restoration, CC BY-SA 4.0); reference row = Robinson-Pierpont Byzantine majority."}

def chapter_count(wits, osis):
    num=OSIS_TO_NUM[osis]
    return max((v//1000)%1000 for v in wits["RP"] if v//1_000_000==num)

def main():
    ensure_cache()
    os.makedirs(OUT, exist_ok=True)
    wits = load_all()
    args = sys.argv[1:] or ["Matt:12","John","Luke:11","Luke:23","Rom:3","1Cor:13","Gal:1","Rev:1","1Pet:1","Jude:1"]
    targets=[]
    for a in args:
        if a=="all":
            for osis in BOOKS.values():
                targets += [(osis,c) for c in range(1,chapter_count(wits,osis)+1)]
        elif ":" in a:
            b,c=a.split(":"); targets.append((b,int(c)))
        else:
            targets += [(a,c) for c in range(1,chapter_count(wits,a)+1)]
    written=0
    for osis,ch in targets:
        data=build_chapter(wits,osis,ch)
        if not data: continue
        with open(os.path.join(OUT,f"{osis}_{ch}.json"),"w",encoding="utf-8") as f:
            json.dump(data,f,ensure_ascii=False,separators=(",",":"))
        nwit=len(data["witnesses"]); written+=1
        print(f"  {osis}_{ch}.json  verses={len(data['verses'])}  witnesses={nwit}")
    print(f"wrote {written} chapter files to {OUT}")

if __name__=="__main__":
    main()
