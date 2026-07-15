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


total = exact = relocated = reflowed = xreflowed = altered = 0
altered_list = []
for f in sorted(glob.glob('public/data/josephus/*/*.json')):
    if f.endswith('index.json'):
        continue
    cur = json.loads(open(f).read())
    try:
        base = json.loads(subprocess.check_output(['git', 'show', f'{BASELINE}:{f}'], text=True))
    except subprocess.CalledProcessError:
        continue
    file_altered = []   # blocks the per-chapter reconciliation couldn't clear, pending a whole-file check
    for bc, cc in zip(base['chapters'], cur['chapters']):
        curtext = {s['number']: s.get('text', '') for s in cc['sections']}
        blocks = [b for b in baseline_blocks(bc) if len(b[0]) >= 2]  # multi-§ blocks only
        ch_altered = []   # per-block mismatches in THIS chapter, pending chapter-level reconciliation
        i = 0
        while i < len(blocks):
            nums, block_english = blocks[i]
            total += 1
            if norm(' '.join(curtext.get(n, '') for n in nums)) == norm(block_english):
                exact += 1; i += 1; continue
            # Mismatch: a clause may have been relocated across the Whiston boundary. Merge with
            # following blocks; if the MERGED current == MERGED baseline, no word changed — the
            # text was only moved between adjacent §§ to sit with the Greek it translates.
            merged_nums = list(nums); merged_eng = block_english; j = i + 1; matched = False
            while j < len(blocks):
                merged_nums += blocks[j][0]; merged_eng += ' ' + blocks[j][1]; total += 1
                if norm(' '.join(curtext.get(n, '') for n in merged_nums)) == norm(merged_eng):
                    matched = True; break
                j += 1
            if matched:
                relocated += (j - i + 1)   # all blocks in the merged span are text-preserving
                i = j + 1
            else:
                ch_altered.append((f, cc['number'], nums[0], nums[-1])); i += 1
        # Chapter-level reconciliation. A full-chapter REFLOW (English redistributed across block
        # boundaries to align each § with its Greek — e.g. Ant 1.19) defeats the block-by-block
        # merge above because a single-§ block can sit mid-reflow. The invariant that still must
        # hold if no Whiston word was altered: the whole chapter's English, whitespace-stripped, is
        # byte-identical before and after (alignment only re-splits, never edits). Check that; if it
        # holds, the per-block flags were reflow artifacts, not real edits.
        if ch_altered:
            base_all = norm(''.join(s.get('text', '') for s in bc['sections']))
            cur_all = norm(''.join(s.get('text', '') for s in cc['sections']))
            if base_all == cur_all:
                reflowed += len(ch_altered)
            else:
                file_altered += ch_altered   # defer: may be a CROSS-chapter reflow (see below)
    # Whole-file reconciliation. A CROSS-chapter reflow (English shifted between chapters to align
    # each § with its Greek — e.g. Ant 8.5-8.10, where the Menander/Dius English moved from 8.5 to
    # 8.6 and each chapter's tail spilled forward) defeats the per-chapter check, because a chapter
    # loses/gains text at its boundary. The invariant that still holds if no word was altered: the
    # WHOLE FILE's English, whitespace-stripped, is byte-identical before and after. If it holds, the
    # leftover per-block flags were cross-chapter reflow artifacts, not real edits.
    if file_altered:
        base_file = norm(''.join(s.get('text', '') for ch in base['chapters'] for s in ch['sections']))
        cur_file = norm(''.join(s.get('text', '') for ch in cur['chapters'] for s in ch['sections']))
        if base_file == cur_file:
            xreflowed += len(file_altered)
        else:
            altered += len(file_altered); altered_list += file_altered

print(f'Multi-§ Whiston blocks checked across the corpus: {total}')
print(f'  byte-identical to the original Whiston block:            {exact}')
print(f'  text preserved but a clause relocated across a boundary: {relocated}')
print(f'  text preserved but redistributed by a chapter reflow:    {reflowed}')
print(f'  text preserved but redistributed by a cross-chapter reflow: {xreflowed}')
print(f'  blocks where a WORD was actually changed/added/dropped:  {altered}')
for m in altered_list[:20]:
    print('   ALTERED:', m)
sys.exit(1 if altered else 0)
