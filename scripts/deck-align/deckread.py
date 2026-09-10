"""Canonical pptx text reader for the lesson decks.

Rules that earlier passes got wrong (see the project memory):
  · join runs WITHIN a shape with nothing — splitting on runs breaks headings mid-word
  · join shapes with a NEWLINE — concatenating invents matches across the shape seam
  · count graphicFrame (tables) as a shape
  · reading order is (y bucketed to 0.1 inch, then x), NOT document order: every English
    answer is its own text box in creation order, so document order pairs them wrongly
"""
import re, zipfile
from xml.etree import ElementTree as ET

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
EMU_IN = 914400


def _shape_xy(sp):
    off = sp.find('.//a:off', NS)
    if off is None:
        return (10**9, 10**9)
    return (int(off.get('y', 0)), int(off.get('x', 0)))


def slide_shapes(xml):
    """[(y, x, [paragraph, ...]), ...] in reading order."""
    root = ET.fromstring(xml)
    out = []
    tree = root.find('.//p:cSld/p:spTree', NS)
    if tree is None:
        return out
    for sp in list(tree):
        tag = sp.tag.split('}')[-1]
        if tag not in ('sp', 'graphicFrame', 'pic', 'grpSp'):
            continue
        paras = []
        for p in sp.findall('.//a:p', NS):
            txt = ''.join(t.text or '' for t in p.findall('.//a:t', NS))
            if txt.strip():
                paras.append(txt.strip())
        if paras:
            y, x = _shape_xy(sp)
            out.append((y, x, paras))
    # bucket y to 0.1" so a row of boxes reads left-to-right
    out.sort(key=lambda s: (round(s[0] / (EMU_IN / 10)), s[1]))
    return out


def deck_slides(path):
    """[(slide_number, [(y, x, [para,...]), ...]), ...]"""
    z = zipfile.ZipFile(path)
    names = [n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)]
    names.sort(key=lambda n: int(re.search(r'(\d+)', n.split('/')[-1]).group(1)))
    return [(int(re.search(r'(\d+)', n.split('/')[-1]).group(1)), slide_shapes(z.read(n))) for n in names]


MARKER = re.compile(r'\*\s*Application exercise\s*[—-]\s*Grammar\s*›\s*([^›]+?)(?:\s*›\s*[“"](.+?)[”"])?\s*$')


def markers(path):
    """[(slide_no, chapter, pack_title_or_None, raw)]"""
    out = []
    for n, shapes in deck_slides(path):
        for _, _, paras in shapes:
            for para in paras:
                m = MARKER.search(para)
                if m:
                    out.append((n, m.group(1).strip(), (m.group(2) or '').strip() or None, para))
    return out
