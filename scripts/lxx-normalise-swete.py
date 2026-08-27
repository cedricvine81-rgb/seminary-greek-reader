#!/usr/bin/env python3
"""Swete word-per-line -> the app's chapter-file shape, with versification reconciliation.

Chapter/verse conventions differ between Swete and the Rahlfs-based data currently shipped.
Each rule below was derived by comparing verse COUNTS per chapter, not guessed:

  EpJer  Swete numbers the Epistle ch 0; ours is ch 1 (73 verses both).
  Mal    Swete splits our ch 3 (24 v) into ch 3 (18) + ch 4 (6).
  Joel   Swete merges our ch 2 (27) + ch 3 (5) into one ch 2 (32); our ch 4 is Swete's ch 3.
  Lam    Swete carries the prologue as ch 1 VERSE 0; ours is ch 0 v 1. The body is not shifted:
         Swete 1:1 is our 1:1. (Read as "verse 1" once, which put the prologue at verse -1 and
         moved all 22 verses of chapter 1 down by one.)
  Wis    Swete runs 1-14, 16-20 where we run 1-19: Swete ch >= 16 is ours minus one.

Single verse numbers the source mistypes, corrected by content (not by guesswork):
  1Chr 16  Verse 39 is numbered 93 — the digits transposed. Its text is the Sadok passage that
           belongs at 39, and 39 is otherwise missing from the chapter, so the reading is certain.

NOT reconciled (left as-is, reported by lxx-diff.py):
  Prov   The LXX reordering. Swete carries our ch 30 material inside an extended ch 24
         (76 verses vs our 34) and then runs 25-29. Needs verse-level mapping, not a table.
  Odes   Liturgical collection; the two editions number the odes differently throughout.
"""
import json, os, re, sys, collections
sp = sys.argv[1]; out = f'{sp}/swete-norm2'; os.makedirs(out, exist_ok=True)
MAP = {
 'Genesis':'Gen','Exodus':'Exod','Leviticus':'Lev','Numeri':'Num','Deuteronomium':'Deut',
 'Josue':'JoshB','Judices':'JudgB','Ruth':'Ruth','Regnorum_I':'1Sam','Regnorum_II':'2Sam',
 'Regnorum_III':'1Kgs','Regnorum_IV':'2Kgs','Paralipomenon_I':'1Chr','Paralipomenon_II':'2Chr',
 'Esdras_A':'1Esd','Esther':'EsthGr','Judith':'Jdt','Tobias':'Tob','Machabaeorum_i':'1Macc',
 'Machabaeorum_ii':'2Macc','Machabaeorum_iii':'3Macc','Machabaeorum_iv':'4Macc','Psalmi':'Ps',
 'Odae':'Odes','Proverbia':'Prov','Canticum':'Song','Job':'Job','Sapientia_Salomonis':'Wis',
 'Ecclesiasticus':'Sir','Psalmi_Salomonis':'PsSol','Osee':'Hos','Amos':'Amos','Michaeas':'Mic',
 'Joel':'Joel','Abdias':'Obad','Jonas':'Jonah','Nahum':'Nah','Habacuc':'Hab','Sophonias':'Zeph',
 'Aggaeus':'Hag','Zacharias':'Zech','Malachias':'Mal','Isaias':'Isa','Jeremias':'Jer',
 'Baruch':'Bar','Threni_seu_Lamentationes':'Lam','Epistula_Jeremiae':'EpJer','Ezechiel':'Ezek',
 'Susanna_translatio_Graeca':'Sus','Susanna_Theodotionis_versio':'SusTh',
 'Daniel_translatio_Graeca':'DanLXX','Daniel_Theodotionis_versio':'DanTh',
 'Bel_et_Draco_translatio_Graeca':'Bel','Bel_et_Draco_Theodotionis_versio':'BelTh',
}
VERSE_FIXES = {('1Chr', 16, 93): 39}


def reconcile(osis, ch, v):
    if (osis, ch, v) in VERSE_FIXES:
        v = VERSE_FIXES[(osis, ch, v)]
    if osis == 'EpJer' and ch == 0: return 1, v
    if osis == 'Mal'   and ch == 4: return 3, v + 18
    if osis == 'Joel':
        if ch == 3: return 4, v
        if ch == 2 and v > 27: return 3, v - 27
    if osis == 'Lam'   and ch == 1: return (0, 1) if v == 1 else (1, v - 1)
    if osis == 'Wis'   and ch >= 16: return ch - 1, v
    return ch, v

NUM = re.compile(r'^(\d+)')
books = collections.defaultdict(lambda: collections.defaultdict(list))
for fn in sorted(os.listdir(f'{sp}/swete')):
    if not fn.endswith('.txt'): continue
    stem = fn[3:-4]
    for line in open(f'{sp}/swete/{fn}', encoding='utf-8'):
        line = line.strip()
        if not line or ' ' not in line: continue
        ref, word = line.split(' ', 1)
        p = ref.split('.')
        if len(p) != 3: continue
        mc, mv = NUM.match(p[1]), NUM.match(p[2])
        if not (mc and mv): continue
        ch, v = int(mc.group(1)), int(mv.group(1))
        if stem == 'Esdras_B': osis, ch = ('Ezra', ch) if ch <= 10 else ('Neh', ch - 10)
        elif stem in MAP:      osis = MAP[stem]
        else: continue
        ch, v = reconcile(osis, ch, v)
        books[osis][ch].append((v, word))

for osis, chs in books.items():
    for ch, pairs in chs.items():
        pairs.sort(key=lambda t: t[0])
        verses, cur = [], None
        for v, w in pairs:
            if cur is None or cur['verse'] != v:
                cur = {'id': f'{osis}.{ch}.{v}', 'verse': v, 'words': []}
                verses.append(cur)
            cur['words'].append({'surface': w})
        json.dump({'book': osis, 'chapter': ch, 'verses': verses},
                  open(f'{out}/{osis}_{ch}.json', 'w'), ensure_ascii=False)
print(f'normalised {len(books)} books -> {len(os.listdir(out))} chapter files')
