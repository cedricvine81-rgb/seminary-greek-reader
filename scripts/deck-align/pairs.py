"""For a marked slide, pair each Greek exercise item with its English answer.

The answer lives on a SEPARATE slide (the question slide repeated, with the English added),
and each answer is its own text box in creation order — so shapes must be read in geometric
reading order, not document order, or answers pair to the wrong sentences.
"""
import re
import deckread

GREEK = re.compile(r'[Ͱ-Ͽἀ-῿]')
# An instruction ENDS WITH A COLON ("Translate the following:"). Matching on the opening word
# instead dropped the answer "What do you say about him?", which broke the Greek/English count
# match and silently voided every answer on that slide.
INSTRUCTION = re.compile(r'^(translate|parse|identify|give|write|put|answer)\b.*:\s*$|^answers?\s*$', re.I)
# EMU. Banner titles sit at ~0.28"; the ITEMS shape starts at ~1.30", and a threshold of
# 1200000 (1.31") swallowed it whole — every item on those slides silently vanished.
TITLE_BAND = 700000


def _items(shapes):
    """(greek_items, english_items) in reading order, headings and instructions removed."""
    greek, english = [], []
    for y, x, paras in shapes:
        for p in paras:
            t = p.strip()
            if not t or 'Application exercise' in t:
                continue
            if y < TITLE_BAND:                      # banner title
                continue
            if INSTRUCTION.match(t):
                continue
            if GREEK.search(t):
                # a heading like '4.5 τις AND τίς' or 'πας (ALL)' is not an exercise item
                if re.search(r'\b(AND|ONE|ALL|USING|IMPERFECT|FUTURE|MOODS|TENSE|CASES?)\b', t):
                    continue
                greek.append(t)
            else:
                if t.isupper():                      # section heading in caps
                    continue
                english.append(t)
    return greek, english


def slide_pairs(path, slide_no):
    """[(greek, english_or_None)] using slide_no's Greek and the answer slide's English."""
    slides = dict(deckread.deck_slides(path))
    g, e = _items(slides.get(slide_no, []))
    if not e:                                        # question slide: answers are on a neighbour
        for cand in (slide_no + 1, slide_no - 1):
            if cand in slides:
                g2, e2 = _items(slides[cand])
                if e2 and len(g2) == len(g):
                    e = e2
                    break
    if len(e) != len(g):
        e = []
    return list(zip(g, e if e else [None] * len(g)))
