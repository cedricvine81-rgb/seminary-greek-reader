# Proves the per-§ alignment never alters Whiston's English — it only re-splits it.
#
# For every multi-§ Whiston block in the current data, it concatenates the per-§ English and
# compares it (non-whitespace characters) to the SAME block's English in the pre-alignment
# commit (before any per-§ work was done). If they match everywhere, then the alignment moved
# text between §§ but changed not a single word — i.e. the English is verbatim Whiston, not
# anything generated. Prints per-work counts and any mismatch. Usage: python3 this_script.py
#
# Baseline = the commit that first built the Josephus Greek+English data (block model), so its
# block-start §§ hold Whiston's English exactly as sourced (Gutenberg eBook / Perseus).

import glob, json, re, subprocess, sys

BASELINE = '24deafa'   # "Add the Greek to all four Josephus works" — block-model Whiston English


def norm(s):
    return re.sub(r'\s+', '', s or '')


def baseline_blocks(ch):
    """Whiston-section blocks from the baseline chapter: a run of §§ whose first has English."""
    secs = ch['sections']; out = []; i = 0
    while i < len(secs):
        if not secs[i].get('text'):
            i += 1; continue
        j = i + 1
        while j < len(secs) and not secs[j].get('text'):
            j += 1
        out.append(([secs[k]['number'] for k in range(i, j)], secs[i]['text']))
        i = j
    return out


total = ok = 0
mismatches = []
for f in sorted(glob.glob('public/data/josephus/*/*.json')):
    if f.endswith('index.json'):
        continue
    cur = json.loads(open(f).read())
    try:
        base = json.loads(subprocess.check_output(['git', 'show', f'{BASELINE}:{f}'], text=True))
    except subprocess.CalledProcessError:
        continue
    for bc, cc in zip(base['chapters'], cur['chapters']):
        curtext = {s['number']: s.get('text', '') for s in cc['sections']}
        for nums, block_english in baseline_blocks(bc):
            if len(nums) < 2:
                continue                       # single-§ blocks are unchanged by definition
            total += 1
            concat = ' '.join(curtext.get(n, '') for n in nums)
            if norm(concat) == norm(block_english):
                ok += 1
            else:
                mismatches.append((f, cc['number'], nums[0], nums[-1]))

print(f'Multi-§ Whiston blocks checked across the corpus: {total}')
print(f'  per-§ English concatenates EXACTLY to the original Whiston block: {ok}')
print(f'  blocks where a word differs from Whiston: {len(mismatches)}')
for m in mismatches[:20]:
    print('   MISMATCH:', m)
sys.exit(1 if mismatches else 0)
