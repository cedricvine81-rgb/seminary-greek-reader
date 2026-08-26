import json, sys
slug = sys.argv[1]
c = json.load(open(f'/Users/cvine/dev/seminary-greek-reader/public/data/greco/{slug}.json'))
out = open(f'{slug.replace("plato-","")}-src.txt','w')
for ch in c['chapters']:
    for v in ch['verses']:
        ref = v.get('ref') or v.get('label') or ''
        out.write(f"=== {ch['number']}:{v['number']} ({ref}) ===\n")
        out.write(f"[GRC] {v.get('greek','').strip()}\n")
        out.write(f"[EN] {v.get('text','').strip()}\n")
out.close()
