import json, sys
slug, paths = sys.argv[1], sys.argv[2:]
c = json.load(open(f'/Users/cvine/dev/seminary-greek-reader/public/data/greco/{slug}.json'))
want = {str(ch['number']): [str(v['number']) for v in ch['verses']] for ch in c['chapters']}
for path in paths:
    d = json.load(open(path))
    for ch in list(d):
        for vk in list(d[ch]):
            if not d[ch][vk].strip(): del d[ch][vk]
    json.dump(d, open(path, 'w'), ensure_ascii=False)
    for ch in sorted(d, key=int):
        ok = set(want[ch]) == set(d[ch])
        print(path, ch, 'OK' if ok else f"MISMATCH want {want[ch]} have {sorted(d[ch], key=int)}")
