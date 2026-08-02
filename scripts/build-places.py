"""Build the place data behind the Texts map — where the ancient authors say things happened.

Perseus tags place names in its English translations with a gazetteer key,
`<placeName key="perseus,Athens">` or `<placeName key="tgn,7016833">`, and there are 19,180 of
them across fourteen authors. The build has always thrown these away: chapter_text() strips the
annotation because leaving it in printed "Athens [23.7333,37.9667] (Perseus)" into the reading
text 1,212 times in Herodotus alone. This script reads the same cached TEI and keeps them.

COORDINATES come from two sources, in that order:
  1. Perseus' own annotation. Exactly one file carries it — the English Herodotus, which writes
     `<reg>Athens [lon,lat] (Perseus)</reg>` beside the key. That resolves 324 keys and, because
     they are the commonest places, 70% of all mentions in the whole corpus.
  2. Pleiades (pleiades.stoa.org), the gazetteer of ancient places, CC-BY. Matched on the name
     as the translator spells it, then on the key's own name, against Pleiades titles and its
     attested/transliterated name variants, with the spelling swaps that separate an English
     Latinisation from a Greek one (Catana/Katane, Sicyon/Sikyon, -us/-os, ae/e). That takes it
     to 91.5% of mentions.

The land outline is Natural Earth 1:50m (public domain), cropped to the ancient world and with
its coordinates rounded — the map is drawn as SVG from this, so it needs no tile server, which
matters because the app must work under exam lockdown and without external requests.

Output: public/data/places/gazetteer.json  (places + per-author counts)
        public/data/places/land.json       (coastline polygons)

Usage:  python3 scripts/build-places.py [--no-cache]     (run from the repo root)
"""
import collections
import csv
import glob
import gzip
import json
import re
import ssl
import sys
import unicodedata
import urllib.request
from pathlib import Path

PERSEUS_CACHE = Path('/tmp/perseus')
PLEIADES_CACHE = Path('/tmp/pleiades')
NE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson'
PLEIADES = {
    'places.csv.gz': 'https://atlantides.org/downloads/pleiades/dumps/pleiades-places-latest.csv.gz',
    'names.csv.gz': 'https://atlantides.org/downloads/pleiades/dumps/pleiades-names-latest.csv.gz',
}
OUT = Path('public/data/places')

# The fourteen authors whose Perseus text carries place tags, as the app names them.
AUTHORS = {
    'tlg0003': 'Thucydides', 'tlg0010': 'Isocrates', 'tlg0012': 'Homer',
    'tlg0014': 'Demosthenes', 'tlg0016': 'Herodotus', 'tlg0020': 'Hesiod',
    'tlg0032': 'Xenophon', 'tlg0059': 'Plato', 'tlg0086': 'Aristotle',
    'tlg0099': 'Strabo', 'tlg0525': 'Pausanias', 'tlg0540': 'Lysias',
    'tlg0543': 'Polybius', 'tlg0557': 'Epictetus',
}

# The ancient Mediterranean and Near East, which is as far as these authors' geography reaches.
BBOX = (-13.0, 17.0, 68.0, 60.0)   # west, south, east, north

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(url, path, no_cache):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not no_cache:
        return path.read_bytes()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=180, context=_ctx).read()
    path.write_bytes(data)
    return data


def norm(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', s.lower())


def spelling_variants(s):
    """An English translator's Latinised spelling against Pleiades' Greek one. Catana/Katane,
    Sicyon/Sikyon, Miletus/Miletos, Byzantium/Byzantion — the differences are regular enough to
    enumerate, and a trailing "City"/"Island"/"River" is Perseus' disambiguator, not the name."""
    out = {norm(s)}
    base = re.sub(r'\s*\b(City|Island|River|Mount|Region)\b\s*$', '', s, flags=re.I)
    out.add(norm(base))
    for a, z in (('c', 'k'), ('k', 'c'), ('ae', 'e'), ('e', 'ae'), ('us', 'os'), ('os', 'us'),
                 ('um', 'on'), ('on', 'um'), ('y', 'u'), ('i', 'ei'), ('ph', 'f')):
        out.add(norm(base.replace(a, z)))
    return {v for v in out if len(v) > 2}


# ── the corpus ───────────────────────────────────────────────────────────────────────────
_PLACE = re.compile(r'<placeName[^>]*key="([^"]+)"[^>]*>(.*?)</placeName>', re.S)
# Perseus writes the attributes in either order.
_ANNOTATED = (re.compile(r'<name\b[^>]*?key="([^"]+)"[^>]*?type="place"[^>]*?>(.*?)</name>', re.S),
              re.compile(r'<name\b[^>]*?type="place"[^>]*?key="([^"]+)"[^>]*?>(.*?)</name>', re.S))
_REG = re.compile(r'<reg>([^<\[]{1,60})\[(-?\d+\.?\d*),(-?\d+\.?\d*)\][^<]*</reg>')


def read_corpus():
    """(mentions per key per author, display names per key, coordinates Perseus itself gives)."""
    per_author = collections.defaultdict(collections.Counter)
    names = collections.defaultdict(collections.Counter)
    gazetteer = {}
    for f in sorted(glob.glob(str(PERSEUS_CACHE / '*.xml'))):
        author = Path(f).name.split('_')[0]
        if author not in AUTHORS:
            continue
        xml = Path(f).read_bytes().decode('utf-8', 'replace')
        for m in _PLACE.finditer(xml):
            key = m.group(1)
            shown = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.group(2))).strip()
            per_author[key][author] += 1
            if shown:
                names[key][shown] += 1
        if '<reg>' in xml:
            for pat in _ANNOTATED:
                for m in pat.finditer(xml):
                    r = _REG.search(m.group(2))
                    if r:                        # Perseus writes [longitude, latitude]
                        gazetteer.setdefault(m.group(1),
                                             (r.group(1).strip(), float(r.group(3)), float(r.group(2))))
    return per_author, names, gazetteer


def pleiades_index(no_cache):
    """Normalised ancient place name → (title, lat, lon), from titles and name variants."""
    csv.field_size_limit(10 ** 7)
    idx = {}
    for name, url in PLEIADES.items():
        fetch(url, PLEIADES_CACHE / name, no_cache)
    with gzip.open(PLEIADES_CACHE / 'places.csv.gz', 'rt', encoding='utf-8') as fh:
        for row in csv.DictReader(fh):
            try:
                lat, lon = float(row['reprLat']), float(row['reprLong'])
            except (ValueError, KeyError, TypeError):
                continue
            if row.get('title'):
                idx.setdefault(norm(row['title']), (row['title'], lat, lon))
    with gzip.open(PLEIADES_CACHE / 'names.csv.gz', 'rt', encoding='utf-8') as fh:
        for row in csv.DictReader(fh):
            try:
                lat, lon = float(row['reprLat']), float(row['reprLong'])
            except (ValueError, KeyError, TypeError):
                continue
            for field in ('nameTransliterated', 'nameAttested'):
                for part in re.split(r'[,;]', row.get(field) or ''):
                    part = part.strip()
                    if len(part) > 2:
                        idx.setdefault(norm(part), (part, lat, lon))
    return idx


def land_outline(no_cache):
    """Natural Earth land polygons, cropped to the ancient world and thinned. A ring is kept if
    any of its points falls in the box, then rounded to 2dp — about 1 km, far finer than a map
    of this scale can show."""
    data = json.loads(fetch(NE_URL, PLEIADES_CACHE / 'ne_50m_land.geojson', no_cache))
    w, s, e, n = BBOX
    out = []
    for feat in data['features']:
        geom = feat['geometry']
        polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
        for poly in polys:
            for ring in poly:
                if not any(w <= x <= e and s <= y <= n for x, y in ring):
                    continue
                pts, last = [], None
                for x, y in ring:
                    p = [round(x, 2), round(y, 2)]
                    if p != last:
                        pts.append(p)
                        last = p
                if len(pts) > 3:
                    out.append(pts)
    return out


# Two keys for one place sit on top of each other and draw two dots with two labels — Perseus
# has both `perseus,Athens` and `tgn,7001393`, 34 metres apart. But a shared name is NOT enough
# to merge on: its Thebes entries are 22 degrees apart, because one is Boeotian and the other is
# in Egypt, and Alexandria, Antioch and Heraclea are worse. So merge only what is also in the
# same place, and let genuine namesakes stand as the separate cities they are.
SAME_PLACE_DEGREES = 0.5


def merge_duplicates(places):
    by_name = collections.defaultdict(list)
    for p in places:
        by_name[norm(p['n'])].append(p)
    out = []
    for group in by_name.values():
        group.sort(key=lambda p: -p['c'])
        while group:
            head = group.pop(0)
            near = [p for p in group
                    if abs(p['lat'] - head['lat']) + abs(p['lon'] - head['lon']) <= SAME_PLACE_DEGREES]
            for p in near:
                group.remove(p)
                head['c'] += p['c']
                for a, c in p['a'].items():
                    head['a'][a] = head['a'].get(a, 0) + c
            head['a'] = dict(sorted(head['a'].items(), key=lambda kv: -kv[1]))
            out.append(head)
    return out


def main():
    no_cache = '--no-cache' in sys.argv
    per_author, names, gaz = read_corpus()
    total = sum(sum(c.values()) for c in per_author.values())
    from_perseus = sum(sum(c.values()) for k, c in per_author.items() if k in gaz)

    idx = pleiades_index(no_cache)
    added = 0
    for key, counts in per_author.items():
        if key in gaz:
            continue
        candidates = [d for d, _ in names[key].most_common(3)]
        if ',' in key and not key.startswith('tgn'):
            candidates.append(key.split(',', 1)[1])
        for cand in candidates:
            hit = next((idx[v] for v in spelling_variants(cand) if v in idx), None)
            if hit:
                gaz[key] = (cand, hit[1], hit[2])
                added += sum(counts.values())
                break

    w, s, e, n = BBOX
    places = []
    for key, counts in per_author.items():
        if key not in gaz:
            continue
        name, lat, lon = gaz[key]
        if not (w <= lon <= e and s <= lat <= n):
            continue                              # off the map we draw
        shown = names[key].most_common(1)[0][0] if names[key] else name
        places.append({
            'k': key, 'n': shown, 'lat': round(lat, 4), 'lon': round(lon, 4),
            'c': sum(counts.values()),
            'a': {AUTHORS[a]: c for a, c in counts.most_common()},
        })
    places = merge_duplicates(places)
    places.sort(key=lambda p: -p['c'])

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'gazetteer.json').write_text(json.dumps({
        'attribution': ('Place tags: Perseus Digital Library (CC-BY-SA 4.0). Coordinates: '
                        'Perseus, and the Pleiades gazetteer of ancient places '
                        '(pleiades.stoa.org, CC-BY). Coastline: Natural Earth, public domain.'),
        'places': places,
    }, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (OUT / 'land.json').write_text(json.dumps(land_outline(no_cache), separators=(',', ':')),
                                   encoding='utf-8')

    resolved = sum(sum(c.values()) for k, c in per_author.items() if k in gaz)
    print(f'mentions        {total:,}')
    print(f'  from Perseus  {from_perseus:,} ({from_perseus / total:.1%})')
    print(f'  + Pleiades    {resolved:,} ({resolved / total:.1%})')
    print(f'distinct keys   {len(per_author):,} | with coordinates {sum(1 for k in per_author if k in gaz):,}')
    print(f'places on the map {len(places):,}  (inside {BBOX})')
    print(f'top: {", ".join(p["n"] for p in places[:10])}')
    for f in ('gazetteer.json', 'land.json'):
        print(f'  {f}: {(OUT / f).stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
