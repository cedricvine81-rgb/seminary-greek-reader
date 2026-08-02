# Builds Greco-Roman texts from the Perseus Digital Library's canonical TEI editions
# (github.com/PerseusDL/canonical-greekLit), which carry the standard book/chapter/section
# numbering the Backgrounds dataset cites (unlike the public-domain Gutenberg translations,
# whose section divisions don't line up). Both the Greek original and the English
# translation are stored, aligned section-by-section, into an extended prose JSON shape:
#   chapters:[{ number, verses:[{ number, text (English), greek }] }]
# so the Texts reader can show them in parallel.
#
# Starts with Epictetus — the Discourses (one work per book) and the Enchiridion.
#
# Licence: the underlying translations (George Long, 1877) and Greek are public domain, but
# Perseus licenses its digital editions CC-BY-SA 4.0; that is carried in the attribution.
#
# Usage:  python3 scripts/build-perseus.py   (fetches raw TEI from GitHub, caching under
#         /tmp; --no-cache to refetch). Run from the repo root. Prints a validation report.

import json
import re
import ssl
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAW = 'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/'
CACHE = Path('/tmp/perseus')
OUT_DIR = Path('public/data/greco')
CROSSREFS = Path('public/data/backgrounds-crossrefs.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/605.1'
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
ATTRIB = ('Text: Epictetus, tr. George Long (1877); Greek ed. H. Schenkl. Digital edition: '
          'Perseus Digital Library, CC-BY-SA 4.0 (perseus.tufts.edu).')
ATTRIB_DL = ('Text: Diogenes Laertius, Lives of Eminent Philosophers, tr. R. D. Hicks (1925); '
             'Greek ed. Long. Digital edition: Perseus Digital Library, CC-BY-SA 4.0.')

try:
    _ctx = ssl.create_default_context(cafile='/etc/ssl/cert.pem')
except Exception:
    _ctx = ssl._create_unverified_context()


def fetch(rel, no_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / rel.replace('/', '_')
    if cached.exists() and not no_cache:
        return cached.read_bytes()
    req = urllib.request.Request(RAW + rel, headers={'User-Agent': UA})
    try:
        data = urllib.request.urlopen(req, timeout=60, context=_ctx).read()
    except urllib.error.URLError:
        data = urllib.request.urlopen(req, timeout=60, context=ssl._create_unverified_context()).read()
    cached.write_bytes(data)
    time.sleep(0.3)
    return data


def strip_notes(xml_bytes):
    """Decode and remove the editorial apparatus, in an order that survives Perseus' own
    malformed files. Three things bite, all found in Plutarch:

    1. A *self-closing* <note/> appears (Lycurgus, De garrulitate), and always inside an XML
       comment: `<!--<note/>-->`. A plain `<note\\b.*?</note>` starts matching at that empty tag
       and runs on to the next real `</note>`, swallowing the comment's `-->` along with
       whatever text lies between — 208 characters of Lycurgus 14.2, and an unclosed comment
       that makes the file unparseable. So comments go first, then self-closing notes.
    2. Perseus leaves a stray `</note>` with no opening tag (Regum et imperatorum
       apophthegmata), which no pair-matching pattern can reach; the last sweep drops it.
    3. <q> quotation tags are left unbalanced (Phocion). Nothing here reads <q>, and the text
       inside it is kept either way, so the tags themselves are dropped.
    """
    xml = xml_bytes.decode('utf-8', 'replace')
    xml = re.sub(r'(?s)<!--.*?-->', '', xml)
    xml = re.sub(r'(?is)<note\b[^>]*/>', '', xml)
    xml = re.sub(r'(?is)<note\b[^>]*>.*?</note>', '', xml)
    xml = re.sub(r'(?is)</?note\b[^>]*>', '', xml)
    return re.sub(r'(?is)</?q\b[^>]*>', '', xml)


def chapter_text(div):
    # A place carries a gazetteer annotation in <reg> — not the regularised reading that tag
    # normally signals — in either of two shapes:
    #   <name type="place"><reg>Athens [23.7333,37.9667] (Perseus)</reg><placeName>Athens</placeName></name>
    #   <name type="place"><reg>Athens [23.7333,37.9667] (Perseus)</reg>Athens</name>
    # Keeping it, as we rightly do against <sic>, printed "Athens [23.7333,37.9667]
    # (Perseus)Athens" into the text students read — 1212 times in Herodotus alone.
    # Drop the <reg> only when the name still reads without it, so a <reg> that is the sole
    # content of its element is never discarded.
    reg_tag, name_tag = f'{{{NS["t"]}}}reg', f'{{{NS["t"]}}}name'
    for nm in div.iter(name_tag):
        regs = [c for c in nm if c.tag == reg_tag]
        if not regs:
            continue
        rest = nm.text or ''
        for child in nm:
            if child.tag != reg_tag:
                rest += ''.join(child.itertext())
            rest += child.tail or ''
        if rest.strip():
            for reg in regs:
                tail = reg.tail
                reg.clear(); reg.text = ''; reg.tail = tail

    # Drop the chapter heading, editorial notes, and the non-preferred half of an editorial
    # choice (<sic>/<orig>/<abbr> — keeping the accompanying <corr>/<reg>/<expan>), then flatten.
    # Some Perseus texts (Lucian) nest <sic><corr> malformedly, which would otherwise duplicate
    # the reading; dropping the <sic> subtree leaves a single corrected reading.
    for tag in ('head', 'note', 'sic', 'orig', 'abbr'):
        for el in div.findall(f't:{tag}', NS) + div.findall(f'.//t:{tag}', NS):
            tail = el.tail
            el.clear(); el.text = ''; el.tail = tail
    return re.sub(r'\s+', ' ', ''.join(div.itertext())).strip()


def parse_chapters(xml_bytes):
    """Return {(book|None, chapter): text} at chapter granularity (both the English and Greek
    Perseus editions divide to chapter; only the Greek goes to section, so we align on chapter)."""
    xml = strip_notes(xml_bytes)
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx); continue
            c = dict(ctx); c[div.get('subtype')] = div.get('n')
            if div.get('subtype') == 'chapter':
                out[(c.get('book'), div.get('n'))] = chapter_text(div)
            else:
                walk(div, c)
    walk(root.find('.//t:body', NS), {})
    return out


def parse_sections(xml_bytes):
    """Return {(book|None, section): text} at section granularity, keyed by the book and the
    (book-continuous) section number — used when both editions divide to section."""
    xml = strip_notes(xml_bytes)
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx); continue
            c = dict(ctx); c[div.get('subtype')] = div.get('n')
            if div.get('subtype') == 'section':
                out[(c.get('book'), div.get('n'))] = chapter_text(div)
            else:
                walk(div, c)
    walk(root.find('.//t:body', NS), {})
    return out


def build_sections(slug, name, urn_dir, urn_base, no_cache):
    """One work whose chapters are the books and whose verses are the (continuous) sections,
    with parallel Greek. Both Perseus editions divide to section, so alignment is exact."""
    grc = parse_sections(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache))
    eng = parse_sections(fetch(f'{urn_dir}/{urn_base}.perseus-eng2.xml', no_cache))
    books = {}
    for (b, sec), en in eng.items():
        if not (b and b.isdigit() and sec and sec.isdigit()):
            continue
        books.setdefault(int(b), {})[int(sec)] = (en, grc.get((b, sec), ''))
    chapters = [{'number': bk, 'verses': [
        {'number': sec, 'text': books[bk][sec][0], **({'greek': books[bk][sec][1]} if books[bk][sec][1] else {})}
        for sec in sorted(books[bk])]} for bk in sorted(books)]
    doc = {'work': name, 'attribution': ATTRIB_DL, 'greek': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters),
             'verses': sum(len(c['verses']) for c in chapters)}]


PLATO_ATTRIB = ('Text: the Loeb Classical Library translation (Plato in Twelve Volumes), public '
                'domain; Greek: J. Burnet’s edition. Digital edition: Perseus Digital Library, '
                'CC-BY-SA 4.0 (perseus.tufts.edu).')


# ── Milestone-aware splitting: recover the standard page+letter reference ────────────────
# Plato and the Plutarch Moralia are cited by a page reference marked only by inline milestones
# (Plato "<milestone unit='section' n='172a'>", Moralia "<milestone unit='stephpage' n='351c'>").
# These walk the text in document order and split it at those milestones so each lettered
# subsection becomes its own verse, carrying its reference ("172a").
def _ms_events(el, unit):
    if el.text:
        yield ('t', el.text)
    for c in el:
        tag = c.tag.split('}')[-1]
        if tag in ('note', 'head', 'sic', 'orig', 'abbr'):
            if c.tail:
                yield ('t', c.tail)
            continue
        elif tag == 'milestone' and c.get('unit') == unit:
            yield ('m', c.get('n'))
        else:
            yield from _ms_events(c, unit)
        if c.tail:
            yield ('t', c.tail)


def _segments(el, unit):
    """[(ref, text)] — the text following each `unit` milestone (text before the first merges
    into it)."""
    segs, lead, cur = [], [], None
    for kind, val in _ms_events(el, unit):
        if kind == 'm':
            segs.append([val, []]); cur = segs[-1][1]
        else:
            (cur if cur is not None else lead).append(val)
    if segs and lead:
        segs[0][1] = lead + segs[0][1]
    return [(n, re.sub(r'\s+', ' ', ''.join(p)).strip()) for n, p in segs]


def _pages_by_ref(xml_bytes, unit):
    """{page:int -> {ref:str -> text}} from the milestone references (e.g. 172 -> {'172a': …})."""
    xml = strip_notes(xml_bytes)
    body = ET.fromstring(xml).find('.//t:body', NS)
    out = {}
    for ref, text in _segments(body, unit):
        m = re.match(r'(\d+)[a-z]*$', ref or '')
        if m and text:
            out.setdefault(int(m.group(1)), {})[ref] = text
    return out


def build_stephanus(slug, name, urn_dir, urn_base, eng_suffix, unit, attrib, no_cache):
    """A dialogue / Moralia essay indexed by its page reference: chapter = page number, one verse
    per lettered subsection carrying its standard ref ("172a"). English + parallel Greek."""
    grc = _pages_by_ref(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache), unit)
    eng = _pages_by_ref(fetch(f'{urn_dir}/{urn_base}.perseus-{eng_suffix}.xml', no_cache), unit)
    chapters = []
    for page in sorted(eng):
        verses = []
        for i, ref in enumerate(sorted(eng[page]), 1):
            v = {'number': i, 'ref': ref, 'text': eng[page][ref]}
            g = grc.get(page, {}).get(ref)
            if g:
                v['greek'] = g
            verses.append(v)
        chapters.append({'number': page, 'verses': verses})
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': drop_empty(chapters)}
    chapters = doc['chapters']
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    n_grk = sum(1 for c in chapters for v in c['verses'] if 'greek' in v)
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': n_grk}]


def build_plato(slug, name, urn_dir, urn_base, no_cache):
    return build_stephanus(slug, name, urn_dir, urn_base, 'eng2', 'section', PLATO_ATTRIB, no_cache)


ARISTOTLE_ATTRIB = ('Text: the Loeb Classical Library translation (public domain); Greek: the '
                    'Bekker/Perseus edition. Digital edition: Perseus Digital Library, '
                    'CC-BY-SA 4.0 (perseus.tufts.edu).')
PLUTARCH_ATTRIB = ('Text: Plutarch’s Lives, tr. Bernadotte Perrin (Loeb, 1914–1926), public '
                   'domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, '
                   'CC-BY-SA 4.0 (perseus.tufts.edu).')
PLUTARCH_MORALIA_ATTRIB = ('Text: Plutarch’s Morals, tr. William W. Goodwin et al. (1874), '
                           'public domain; Greek ed. Perseus. Digital edition: Perseus Digital '
                           'Library, CC-BY-SA 4.0 (perseus.tufts.edu).')
BABBITT_ATTRIB = ('Text: Plutarch’s Moralia, tr. Frank Cole Babbitt (Loeb, 1927–1928), public '
                  'domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, '
                  'CC-BY-SA 4.0 (perseus.tufts.edu).')

# Perseus offers several English translations per work and only some are out of copyright.
# A US work published before this year is public domain; Babbitt's Moralia volumes of 1927–28
# have fallen in, his 1931 volume has not, and neither have Fowler (1936), Helmbold (1939) or
# Cherniss (1957). The tables below name the edition chosen for each work, and check_licence()
# re-derives the choice from the TEI headers so a wrong suffix fails the build rather than
# quietly shipping a translation we have no right to.
PD_CUTOFF = 1930


# Plutarch — the whole surviving corpus, built from Perseus' canonical TEI. Each row is
#   (Perseus work id, slug suffix, English title, English edition suffix)
# and for the Moralia the Latin title too, which is how the essays are cited. The English
# edition is chosen per work as the newest one out of copyright: Perrin's Loeb (1914–26)
# for the Lives, Babbitt (1927–28) where his Loeb volumes have fallen in, otherwise the
# 1874 Goodwin collection. Perseus also carries Babbitt 1931+, Fowler, Helmbold and
# Cherniss — all still in copyright, and deliberately not used. See PD_CUTOFF.
PLUTARCH_LIVES = [
    ('tlg001', 'theseus', 'Life of Theseus', 'eng3'),
    ('tlg002', 'romulus', 'Life of Romulus', 'eng2'),
    ('tlg003', 'comp-theseus-romulus', 'Comparison of Theseus and Romulus', 'eng2'),
    ('tlg004', 'lycurgus', 'Life of Lycurgus', 'eng2'),
    ('tlg005', 'numa', 'Life of Numa', 'eng2'),
    ('tlg006', 'comp-lycurgus-numa', 'Comparison of Lycurgus and Numa', 'eng2'),
    ('tlg007', 'solon', 'Life of Solon', 'eng2'),
    ('tlg008', 'publicola', 'Life of Publicola', 'eng2'),
    ('tlg009', 'comp-solon-publicola', 'Comparison of Solon and Publicola', 'eng2'),
    ('tlg010', 'themistocles', 'Life of Themistocles', 'eng2'),
    ('tlg011', 'camillus', 'Life of Camillus', 'eng2'),
    ('tlg012', 'pericles', 'Life of Pericles', 'eng2'),
    ('tlg013', 'fabius-maximus', 'Life of Fabius Maximus', 'eng2'),
    ('tlg014', 'comp-pericles-fabius', 'Comparison of Pericles and Fabius Maximus', 'eng2'),
    ('tlg015', 'alcibiades', 'Life of Alcibiades', 'eng2'),
    ('tlg016', 'coriolanus', 'Life of Coriolanus', 'eng2'),
    ('tlg017', 'comp-alcibiades-coriolanus', 'Comparison of Alcibiades and Coriolanus', 'eng2'),
    ('tlg018', 'timoleon', 'Life of Timoleon', 'eng2'),
    ('tlg019', 'aemilius-paulus', 'Life of Aemilius Paulus', 'eng2'),
    ('tlg020', 'comp-timoleon-aemilius', 'Comparison of Timoleon and Aemilius Paulus', 'eng2'),
    ('tlg021', 'pelopidas', 'Life of Pelopidas', 'eng2'),
    ('tlg022', 'marcellus', 'Life of Marcellus', 'eng2'),
    ('tlg023', 'comp-pelopidas-marcellus', 'Comparison of Pelopidas and Marcellus', 'eng2'),
    ('tlg024', 'aristides', 'Life of Aristides', 'eng2'),
    ('tlg025', 'cato-the-elder', 'Life of Cato the Elder', 'eng2'),
    ('tlg026', 'comp-aristides-cato', 'Comparison of Aristides and Cato the Elder', 'eng2'),
    ('tlg027', 'philopoemen', 'Life of Philopoemen', 'eng2'),
    ('tlg028', 'flamininus', 'Life of Titus Flamininus', 'eng2'),
    ('tlg029', 'comp-philopoemen-flamininus', 'Comparison of Philopoemen and Titus Flamininus', 'eng2'),
    ('tlg030', 'pyrrhus', 'Life of Pyrrhus', 'eng2'),
    ('tlg031', 'marius', 'Life of Caius Marius', 'eng2'),
    ('tlg032', 'lysander', 'Life of Lysander', 'eng2'),
    ('tlg033', 'sulla', 'Life of Sulla', 'eng2'),
    ('tlg034', 'comp-lysander-sulla', 'Comparison of Lysander and Sulla', 'eng2'),
    ('tlg035', 'cimon', 'Life of Cimon', 'eng2'),
    ('tlg036', 'lucullus', 'Life of Lucullus', 'eng2'),
    ('tlg037', 'comp-cimon-lucullus', 'Comparison of Cimon and Lucullus', 'eng2'),
    ('tlg038', 'nicias', 'Life of Nicias', 'eng2'),
    ('tlg039', 'crassus', 'Life of Crassus', 'eng2'),
    ('tlg040', 'comp-nicias-crassus', 'Comparison of Nicias and Crassus', 'eng2'),
    ('tlg041', 'eumenes', 'Life of Eumenes', 'eng2'),
    ('tlg042', 'sertorius', 'Life of Sertorius', 'eng2'),
    ('tlg043', 'comp-sertorius-eumenes', 'Comparison of Sertorius and Eumenes', 'eng2'),
    ('tlg044', 'agesilaus', 'Life of Agesilaus', 'eng2'),
    ('tlg045', 'pompey', 'Life of Pompey', 'eng2'),
    ('tlg046', 'comp-agesilaus-pompey', 'Comparison of Agesilaus and Pompey', 'eng2'),
    ('tlg047', 'alexander', 'Life of Alexander', 'eng2'),
    ('tlg048', 'caesar', 'Life of Caesar', 'eng2'),
    ('tlg049', 'phocion', 'Life of Phocion', 'eng2'),
    ('tlg050', 'cato-the-younger', 'Life of Cato the Younger', 'eng2'),
    ('tlg053', 'comp-agis-cleomenes-gracchi', 'Comparison of Agis and Cleomenes and the Gracchi', 'eng2'),
    ('tlg054', 'demosthenes', 'Life of Demosthenes', 'eng2'),
    ('tlg055', 'cicero', 'Life of Cicero', 'eng2'),
    ('tlg056', 'comp-demosthenes-cicero', 'Comparison of Demosthenes and Cicero', 'eng2'),
    ('tlg057', 'demetrius', 'Life of Demetrius', 'eng2'),
    ('tlg058', 'antony', 'Life of Antony', 'eng2'),
    ('tlg059', 'comp-demetrius-antony', 'Comparison of Demetrius and Antony', 'eng2'),
    ('tlg060', 'dion', 'Life of Dion', 'eng2'),
    ('tlg061', 'brutus', 'Life of Brutus', 'eng2'),
    ('tlg062', 'comp-dion-brutus', 'Comparison of Dion and Brutus', 'eng2'),
    ('tlg063', 'aratus', 'Life of Aratus', 'eng2'),
    ('tlg064', 'artaxerxes', 'Life of Artaxerxes', 'eng2'),
    ('tlg065', 'galba', 'Life of Galba', 'eng2'),
    ('tlg066', 'otho', 'Life of Otho', 'eng2'),
]

# Flat-section essays: chapter = section, each carrying its Stephanus page as `ref`.
PLUTARCH_MORALIA = [
    ('tlg067', 'education-of-children', 'On the Education of Children', 'De liberis educandis', 'eng3', BABBITT_ATTRIB),
    ('tlg068', 'study-of-poetry', 'How the Young Man Should Study Poetry', 'Quomodo adolescens poetas audire debeat', 'eng3', BABBITT_ATTRIB),
    ('tlg069', 'listening-to-lectures', 'On Listening to Lectures', 'De recta ratione audiendi', 'eng3', BABBITT_ATTRIB),
    ('tlg070', 'flatterer-and-friend', 'How to Tell a Flatterer from a Friend', 'Quomodo adulator ab amico internoscatur', 'eng3', BABBITT_ATTRIB),
    ('tlg071', 'progress-in-virtue', 'How a Man May Become Aware of His Progress in Virtue', 'Quomodo quis suos in virtute sentiat profectus', 'eng3', BABBITT_ATTRIB),
    ('tlg072', 'profit-by-enemies', 'How to Profit by One\'s Enemies', 'De capienda ex inimicis utilitate', 'eng3', BABBITT_ATTRIB),
    ('tlg073', 'having-many-friends', 'On Having Many Friends', 'De amicorum multitudine', 'eng3', BABBITT_ATTRIB),
    ('tlg074', 'on-chance', 'On Chance', 'De fortuna', 'eng3', BABBITT_ATTRIB),
    ('tlg075', 'virtue-and-vice', 'On Virtue and Vice', 'De virtute et vitio', 'eng3', BABBITT_ATTRIB),
    ('tlg076', 'consolation-to-apollonius', 'A Letter of Condolence to Apollonius', 'Consolatio ad Apollonium', 'eng3', BABBITT_ATTRIB),
    ('tlg077', 'keeping-well', 'Advice about Keeping Well', 'De tuenda sanitate praecepta', 'eng3', BABBITT_ATTRIB),
    ('tlg078', 'advice-to-bride-and-groom', 'Advice to Bride and Groom', 'Conjugalia praecepta', 'eng3', BABBITT_ATTRIB),
    ('tlg079', 'dinner-of-the-seven-wise-men', 'The Dinner of the Seven Wise Men', 'Septem sapientium convivium', 'eng3', BABBITT_ATTRIB),
    ('tlg080', 'on-superstition', 'On Superstition', 'De superstitione', 'eng3', BABBITT_ATTRIB),
    ('tlg083', 'bravery-of-women', 'Bravery of Women', 'Mulierum virtutes', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg085', 'parallel-stories', 'Greek and Roman Parallel Stories', 'Parallela minora', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg086', 'fortune-of-the-romans', 'On the Fortune of the Romans', 'De fortuna Romanorum', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg088', 'glory-of-athens', 'Were the Athenians More Famous in War or in Wisdom?', 'De gloria Atheniensium', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg089', 'isis-osiris', 'On Isis and Osiris', 'De Iside et Osiride', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg090', 'the-e-at-delphi', 'The E at Delphi', 'De E apud Delphos', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg091', 'oracles-at-delphi', 'The Oracles at Delphi No Longer Given in Verse', 'De Pythiae oraculis', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg092', 'obsolescence-of-oracles', 'The Obsolescence of Oracles', 'De defectu oraculorum', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg093', 'can-virtue-be-taught', 'Can Virtue Be Taught?', 'An virtus doceri possit', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg094', 'on-moral-virtue', 'On Moral Virtue', 'De virtute morali', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg095', 'control-of-anger', 'On the Control of Anger', 'De cohibenda ira', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg096', 'tranquillity-of-mind', 'On Tranquillity of Mind', 'De tranquillitate animi', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg097', 'brotherly-love', 'On Brotherly Love', 'De fraterno amore', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg098', 'affection-for-offspring', 'On Affection for Offspring', 'De amore prolis', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg099', 'vice-and-unhappiness', 'Whether Vice Be Sufficient to Cause Unhappiness', 'An vitiositas ad infelicitatem sufficiat', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg100', 'soul-or-body', 'Whether the Affections of the Soul Are Worse than Those of the Body', 'Animine an corporis affectiones sint peiores', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg101', 'on-talkativeness', 'On Talkativeness', 'De garrulitate', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg102', 'on-being-a-busybody', 'On Being a Busybody', 'De curiositate', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg103', 'love-of-wealth', 'On Love of Wealth', 'De cupiditate divitiarum', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg104', 'on-compliancy', 'On Compliancy', 'De vitioso pudore', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg105', 'envy-and-hate', 'On Envy and Hate', 'De invidia et odio', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg106', 'praising-oneself', 'On Praising Oneself Inoffensively', 'De se ipsum citra invidiam laudando', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg107', 'delays-of-divine-vengeance', 'On the Delays of the Divine Vengeance', 'De sera numinis vindicta', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg108', 'on-fate', 'On Fate', 'De fato', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg109', 'sign-of-socrates', 'On the Sign of Socrates', 'De genio Socratis', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg110', 'on-exile', 'On Exile', 'De exilio', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg111', 'consolation-to-his-wife', 'Consolation to His Wife', 'Consolatio ad uxorem', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg113', 'dialogue-on-love', 'Dialogue on Love', 'Amatorius', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg115', 'philosopher-and-men-in-power', 'That a Philosopher Ought to Converse Especially With Men in Power', 'Maxime cum principibus viris philosopho esse disserendum', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg116', 'to-an-uneducated-ruler', 'To an Uneducated Ruler', 'Ad principem ineruditum', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg117', 'old-man-in-public-affairs', 'Whether an Old Man Should Engage in Public Affairs', 'An seni respublica gerenda sit', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg118', 'precepts-of-statecraft', 'Precepts of Statecraft', 'Praecepta gerendae reipublicae', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg119', 'monarchy-democracy-oligarchy', 'On Monarchy, Democracy, and Oligarchy', 'De unius in republica dominatione', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg120', 'we-ought-not-to-borrow', 'That We Ought Not to Borrow', 'De vitando aere alieno', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg122', 'aristophanes-and-menander', 'Summary of a Comparison Between Aristophanes and Menander', 'Comparationis Aristophanis et Menandri compendium', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg123', 'malice-of-herodotus', 'On the Malice of Herodotus', 'De Herodoti malignitate', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg125', 'natural-phenomena', 'Causes of Natural Phenomena', 'Quaestiones naturales', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg126', 'face-on-the-moon', 'Concerning the Face Which Appears in the Orb of the Moon', 'De facie quae in orbe lunae apparet', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg127', 'principle-of-cold', 'On the Principle of Cold', 'De primo frigido', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg128', 'fire-or-water', 'Whether Fire or Water Is More Useful', 'Aquane an ignis sit utilior', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg129', 'cleverness-of-animals', 'Whether Land or Sea Animals Are Cleverer', 'De sollertia animalium', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg130', 'beasts-are-rational', 'Beasts Are Rational', 'Bruta animalia ratione uti', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg131', 'eating-of-flesh-1', 'On the Eating of Flesh I', 'De esu carnium I', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg132', 'eating-of-flesh-2', 'On the Eating of Flesh II', 'De esu carnium II', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg134', 'generation-of-the-soul', 'On the Generation of the Soul in the Timaeus', 'De animae procreatione in Timaeo', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg136', 'stoic-self-contradictions', 'On Stoic Self-Contradictions', 'De Stoicorum repugnantiis', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg137', 'stoics-and-poets', 'The Stoics Talk More Paradoxically than the Poets', 'Compendium argumenti Stoicos absurdiora poetis dicere', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg138', 'common-conceptions', 'On Common Conceptions Against the Stoics', 'De communibus notitiis adversus Stoicos', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg139', 'epicurus-pleasant-life', 'That Epicurus Actually Makes a Pleasant Life Impossible', 'Non posse suaviter vivi secundum Epicurum', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg140', 'reply-to-colotes', 'Reply to Colotes', 'Adversus Coloten', 'eng2', PLUTARCH_MORALIA_ATTRIB),
    ('tlg141', 'live-unknown', 'Is "Live Unknown" a Wise Precept?', 'An recte dictum sit latenter esse vivendum', 'eng2', PLUTARCH_MORALIA_ATTRIB),
]

# The three essays Perseus divides chapter → section rather than flat.
PLUTARCH_MORALIA_CH = [
    ('tlg087', 'fortune-of-alexander', 'On the Fortune or the Virtue of Alexander', 'De Alexandri magni fortuna aut virtute', 'eng4', PLUTARCH_MORALIA_ATTRIB),
    ('tlg133', 'platonic-questions', 'Platonic Questions', 'Platonicae quaestiones', 'eng2', PLUTARCH_MORALIA_ATTRIB),
]

# Perseus files a work's Greek under -grc2 almost everywhere; these are the exceptions. The
# apophthegmata group (081–088) carries both -grc3 and -grc4, and only -grc4 divides the same
# way as the English beside it.
PLUTARCH_GRC = {
    'tlg051': 'grc1', 'tlg052': 'grc1', 'tlg081': 'grc4', 'tlg082': 'grc4', 'tlg083': 'grc4',
    'tlg085': 'grc4', 'tlg086': 'grc4', 'tlg087': 'grc4', 'tlg088': 'grc4', 'tlg127': 'grc3',
}

# Works whose shape needs its own call in main() rather than a table row (paired Lives, the
# nine books of the Table Talk, and two essays Perseus divides unlike their neighbours). Listed
# here only so check_licence() covers their English editions too.
PLUTARCH_EXTRA_EDITIONS = [
    ('tlg081', 'eng4'),   # Regum et imperatorum apophthegmata — Hinton, in Goodwin 1874
    ('tlg082', 'eng4'),   # Apophthegmata Laconica  — Goodwin 1874
    ('tlg051', 'eng1'),   # Agis and Cleomenes      — Perrin 1921
    ('tlg052', 'eng1'),   # Tiberius and Caius Gracchus — Perrin 1921
    ('tlg112', 'eng2'),   # Quaestiones convivales  — Creech, in Goodwin 1874
    ('tlg114', 'eng4'),   # Amatoriae narrationes   — Goodwin 1874
    ('tlg121', 'eng4'),   # Vitae decem oratorum    — Goodwin 1874
]



def parse_units(xml_bytes, book_sub, unit_sub):
    """Return {(book|None, unit): text} for a book→unit (or flat unit) TEI. `book_sub` is the
    div subtype that carries the book number (None for treatises without books); `unit_sub` is
    the verse-level div subtype (a Nicomachean Ethics 'section', a Rhetoric/Poetics 'chapter')."""
    xml = strip_notes(xml_bytes)
    root = ET.fromstring(xml)
    out = {}

    def walk(el, book):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, book); continue
            sub = div.get('subtype')
            kids = [k for k in div.findall('t:div', NS) if k.get('type') == 'textpart']
            if book_sub and sub == book_sub and (book is None or kids):
                walk(div, div.get('n'))
            elif sub == unit_sub:
                out[(book, div.get('n'))] = chapter_text(div)
            elif book_sub and book is not None and not kids:
                # A leaf already inside a book-level div is a unit whatever its label says.
                # Perseus tags the sub-divisions of Comparison of Lysander and Sulla 5 as
                # "chapter" — the same subtype as the book level — rather than "section", yet
                # numbers them 2..5, continuing from the "section" 1 beside them and matching
                # the English's five sections word for word. Taking the label at face value
                # recursed into them as if they were chapters of their own and left all four
                # with English and no Greek.
                out[(book, div.get('n'))] = chapter_text(div)
            else:
                walk(div, book)
    walk(root.find('.//t:body', NS), None)
    return out


def drop_empty(chapters):
    """Drop rows, and then chapters, carrying neither Greek nor English. Perseus has Table Talk
    9.7–9.11 as empty section shells, which would otherwise open as blank pages in the reader."""
    out = []
    for c in chapters:
        verses = [v for v in c['verses'] if v.get('text', '').strip() or v.get('greek', '').strip()]
        if verses:
            out.append({**c, 'verses': verses})
    return out


def parse_unit_refs(xml_bytes, book_sub, unit_sub, ref_unit):
    """{(book,unit) -> ref} using the first `ref_unit` milestone inside each unit div — the
    standard reference (Aristotle's Bekker "page" milestone, "1094a")."""
    xml = strip_notes(xml_bytes)
    root = ET.fromstring(xml)
    out = {}

    def walk(el, book):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, book); continue
            sub = div.get('subtype')
            if book_sub and sub == book_sub:
                walk(div, div.get('n'))
            elif sub == unit_sub:
                ms = div.find(f'.//t:milestone[@unit="{ref_unit}"]', NS)
                if ms is not None and ms.get('n'):
                    out[(book, div.get('n'))] = ms.get('n')
            else:
                walk(div, book)
    walk(root.find('.//t:body', NS), None)
    return out


# Perseus' Dio labels five orations wrongly and one pair jointly, which between them hid ten
# numbers. Orations 14-18 carry n="84".."88" — numbers outside the 80-oration corpus, and the
# count only reconciles to 80 if they are 14-18. Confirmed by their openings: 84 is "Οἱ
# ἄνθρωποι ἐπιθυμοῦσι μὲν ἐλεύθεροι εἶναι" (On Slavery and Freedom I), 85 its sequel, 86 On
# Grief, 87 On Covetousness, 88 To Nicomachus. Document order proves nothing here — the file
# runs 1-13, 7, 31-80, 84-88, 19-30 — so the identification rests on content and the count.
# 77 and 78 are transmitted as one continuous work and tagged n="77_78"; it is filed under 77.
DIO_RELABEL = {'84': '14', '85': '15', '86': '16', '87': '17', '88': '18', '77_78': '77'}


def build_greek_only(slug, name, urn_dir, urn_base, book_sub, unit_sub, attrib, no_cache,
                     relabel=None):
    """A book→unit work with no aligned English on Perseus (Marcus Aurelius): chapter = book,
    verse = unit, Greek only. Translations divide the Meditations on a different chapter scheme
    than the critical Greek, so pairing an English by number would misalign — hence Greek-only.

    `relabel` renames a book before it is read, for a source whose own labels are wrong or
    non-numeric — see DIO_RELABEL."""
    grc = parse_units(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache), book_sub, unit_sub)
    books = {}
    for (b, u), gr in grc.items():
        b = (relabel or {}).get(b, b)
        if b and b.isdigit() and u and u.isdigit():
            books.setdefault(int(b), {})[int(u)] = gr
    chapters = [{'number': bk, 'verses': [
        {'number': u, 'text': '', 'greek': books[bk][u]} for u in sorted(books[bk])]} for bk in sorted(books)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'greekOnly': True, 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters),
             'verses': sum(len(c['verses']) for c in chapters)}]


def build_line_poem(slug, name, urn_dir, urn_base, attrib, no_cache, chunk=150):
    """A continuous verse poem addressed by line number (Aratus's Phaenomena). Greek only; the
    lines are grouped into chapters of `chunk` for lazy loading, each verse keeping its poem line
    number as its reference (so "Phaen. 5" cites line 5)."""
    xml = strip_notes(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache))
    root = ET.fromstring(xml)
    lines = [re.sub(r'\s+', ' ', ''.join(l.itertext())).strip()
             for l in root.iter('{http://www.tei-c.org/ns/1.0}l')]
    lines = [l for l in lines if l]
    chapters = []
    for i in range(0, len(lines), chunk):
        block = lines[i:i + chunk]
        chapters.append({'number': i // chunk + 1, 'verses': [
            {'number': i + j + 1, 'ref': str(i + j + 1), 'text': '', 'greek': block[j]}
            for j in range(len(block))]})
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'greekOnly': True,
           'lineChunk': chunk, 'lineCount': len(lines), 'chapters': chapters}
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': len(lines)}]


def _div_text(el):
    """Text of a card/div, dropping headings, labels, and the card milestone."""
    for tag in ('head', 'label'):
        for x in el.findall(f't:{tag}', NS) + el.findall(f'.//t:{tag}', NS):
            tail = x.tail; x.clear(); x.text = ''; x.tail = tail
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()


def parse_lines(xml_bytes, per_book):
    """{(book|None, line): greek} from <l n=..>; book from the (case-insensitive) book div."""
    xml = strip_notes(xml_bytes)
    root = ET.fromstring(xml)
    NSU = '{http://www.tei-c.org/ns/1.0}'
    out = {}

    def add(book, l):
        n = l.get('n')
        if n and n.isdigit():
            t = re.sub(r'\s+', ' ', ''.join(l.itertext())).strip()
            if t:
                out[(book, int(n))] = t

    if per_book:
        for b in root.iter(NSU + 'div'):
            if (b.get('subtype') or '').lower() != 'book' or not (b.get('n') or '').isdigit():
                continue
            for l in b.iter(NSU + 'l'):
                add(int(b.get('n')), l)
    else:
        for l in root.iter(NSU + 'l'):
            add(None, l)
    return out


def parse_eng_chunks(xml_bytes, per_book):
    """{(book|None, startline): english}. Homer's Murray is book→card (card n = the starting
    line); Hesiod's Evelyn-White marks every ~5th line with <l n=..>. Either way the English is
    keyed by the line it starts at, so it can sit beside that Greek line (the rest are Greek-only,
    the Eusebius chunk model)."""
    xml = strip_notes(xml_bytes)
    root = ET.fromstring(xml)
    NSU = '{http://www.tei-c.org/ns/1.0}'
    out = {}
    has_cards = any((d.get('subtype') or '').lower() == 'card' for d in root.iter(NSU + 'div'))
    if has_cards:
        def walk(el, book):
            for d in el.findall('t:div', NS):
                st = (d.get('subtype') or '').lower()
                if st == 'book' and (d.get('n') or '').isdigit():
                    walk(d, int(d.get('n')))
                elif st == 'card' and (d.get('n') or '').isdigit():
                    t = _div_text(d)
                    if t:
                        out[(book if per_book else None, int(d.get('n')))] = t
                else:
                    walk(d, book)
        walk(root.find('.//t:body', NS), None)
    else:
        for l in root.iter(NSU + 'l'):
            n = l.get('n')
            if n and n.isdigit():
                t = re.sub(r'\s+', ' ', ''.join(l.itertext())).strip()
                if t:
                    out[(None, int(n))] = t
    return out


def build_line_parallel(slug, name, urn_dir, urn_base, eng_suffix, per_book, attrib, no_cache, chunk=150):
    """A verse work addressed by line (Homer, Hesiod). Murray's / Evelyn-White's Loeb English is
    not line-aligned — it comes in card / ~5-line groups — so each VERSE is that group: the group's
    Greek lines together (joined with newlines, which the reader renders as line breaks) beside the
    group's English, a Loeb facing layout that actually aligns. Homer: chapter = book, verse = the
    card (numbered by its first line, "Il. 1.1"). Hesiod: verses grouped into `chunk`-line chapters
    ("Theog. 116" opens the group containing line 116)."""
    import bisect
    from collections import defaultdict
    base = f'{urn_dir}/{urn_base}'
    grc = parse_lines(fetch(f'{base}.perseus-grc2.xml', no_cache), per_book)
    eng = parse_eng_chunks(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache), per_book)
    glane, elane = defaultdict(dict), defaultdict(dict)
    for (b, ln), t in grc.items():
        glane[b][ln] = t
    for (b, ln), t in eng.items():
        elane[b][ln] = t

    def group(book):
        """[(start_line, end_line, greek_block, english)] — each English chunk with the Greek
        lines that fall in its range (start ≤ line < next start)."""
        starts = sorted(elane.get(book, {}))
        buckets = defaultdict(list)
        for ln in sorted(glane[book]):
            i = bisect.bisect_right(starts, ln) - 1 if starts else -1
            key = starts[i] if i >= 0 else ln   # lines before the first chunk get their own group
            buckets[key].append(ln)
        out = []
        for start in sorted(buckets):
            lns = buckets[start]
            out.append((start, lns[-1], '\n'.join(glane[book][x] for x in lns),
                        elane.get(book, {}).get(start, '')))
        return out

    chapters = []
    if per_book:
        for b in sorted(glane):
            chapters.append({'number': b, 'verses': [
                {'number': s, 'ref': (str(s) if s == e else f'{s}–{e}'), 'text': en, 'greek': g}
                for (s, e, g, en) in group(b)]})
    else:
        by_ch = defaultdict(list)
        for (s, e, g, en) in group(None):
            by_ch[(s - 1) // chunk + 1].append(
                {'number': s, 'ref': (str(s) if s == e else f'{s}–{e}'), 'text': en, 'greek': g})
        for ch in sorted(by_ch):
            chapters.append({'number': ch, 'verses': by_ch[ch]})
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': drop_empty(chapters)}
    chapters = doc['chapters']
    if not per_book:
        doc['lineChunk'] = chunk
        doc['lineCount'] = len(glane[None])
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    tot = sum(len(c['verses']) for c in chapters)
    n_eng = sum(1 for c in chapters for v in c['verses'] if v['text'])
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': tot, 'eng': n_eng}]


def build_units(slug, name, urn_dir, urn_base, eng_suffix, book_sub, unit_sub, attrib, no_cache,
                ref_unit=None, grc_suffix='grc2'):
    """One work with a book→unit or flat-unit TEI (Aristotle treatises, Plutarch Lives/Moralia).
    With books: chapter = book, verse = unit (Eth. nic. 1.7 → book 1 §7; Plut. Ant. 25.2 → ch. 25
    §2). Without books: chapter = unit, one verse (Poet. 6). `ref_unit` attaches the standard
    reference milestone (Aristotle's Bekker number) to each verse. Nearly every Perseus text
    files its Greek under -grc2, but a handful do not — see PLUTARCH_GRC."""
    base = f'{urn_dir}/{urn_base}'
    grc_bytes = fetch(f'{base}.perseus-{grc_suffix}.xml', no_cache)
    grc = parse_units(grc_bytes, book_sub, unit_sub)
    eng = parse_units(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache), book_sub, unit_sub)
    refs = parse_unit_refs(grc_bytes, book_sub, unit_sub, ref_unit) if ref_unit else {}
    if book_sub:
        books = {}
        for (b, u) in set(eng) | set(grc):
            if b and b.isdigit() and u and u.isdigit():
                books.setdefault(int(b), {})[int(u)] = (eng.get((b, u), ''), grc.get((b, u), ''), refs.get((b, u)))
        chapters = [{'number': bk, 'verses': [
            {'number': u, 'text': books[bk][u][0], **({'greek': books[bk][u][1]} if books[bk][u][1] else {}),
             **({'ref': books[bk][u][2]} if books[bk][u][2] else {})}
            for u in sorted(books[bk])]} for bk in sorted(books)]
    else:
        # Union again: Fowler & Fowler leave Alexander 41-42 untranslated (the passage on
        # Alexander's sexual practices — a Victorian omission, not a defect in the Greek), and
        # keying off the English dropped both chapters from the work entirely.
        units = {int(u): (eng.get((b, u), ''), grc.get((None, u), ''), refs.get((None, u)))
                 for (b, u) in set(eng) | set(grc) if u and u.isdigit()}
        chapters = [{'number': u, 'verses': [
            {'number': 1, 'text': units[u][0], **({'greek': units[u][1]} if units[u][1] else {}),
             **({'ref': units[u][2]} if units[u][2] else {})}]}
            for u in sorted(units)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': drop_empty(chapters)}
    chapters = doc['chapters']
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    n_grk = sum(1 for c in chapters for v in c['verses'] if 'greek' in v)
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters), 'verses': n_grk}]


MARCUS_ATTRIB = ('Greek: Marcus Aurelius, Τὰ εἰς ἑαυτόν (Meditations). Digital edition: Perseus '
                 'Digital Library, CC-BY-SA 4.0 (perseus.tufts.edu). Greek only — see the note on '
                 'the work.')
PHILOSTRATUS_ATTRIB = ('Greek: Philostratus, Life of Apollonius of Tyana (Τὰ ἐς τὸν Τυανέα '
                       'Ἀπολλώνιον). Digital edition: Perseus Digital Library, CC-BY-SA 4.0. '
                       'Greek only.')
DIO_ATTRIB = ('Greek: Dio Chrysostom, Orations (Λόγοι). Digital edition: Perseus Digital '
              'Library, CC-BY-SA 4.0. Greek only.')
ARATUS_ATTRIB = ('Greek: Aratus, Phaenomena. Digital edition: Perseus Digital Library, '
                 'CC-BY-SA 4.0. Greek only; cited by line (line 5 is quoted at Acts 17:28). See '
                 'the “Pagan Sources Quoted in the New Testament” collection for the proem with a '
                 'translation.')
XENOPHON_ATTRIB = ('Text: Xenophon, Memorabilia, tr. E. C. Marchant (Loeb, 1923), public domain; '
                   'Greek ed. Perseus. Digital edition: Perseus Digital Library, CC-BY-SA 4.0 '
                   '(perseus.tufts.edu).')
LUCIAN_ATTRIB = ('Text: The Works of Lucian, tr. H. W. Fowler & F. G. Fowler (Oxford, 1905), '
                 'public domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, '
                 'CC-BY-SA 4.0 (perseus.tufts.edu). The Fowlers leave Alexander 41-42 '
                 'untranslated — a Victorian omission of the passage on Alexander\u2019s sexual '
                 'conduct — so those two chapters appear in Greek only.')
APOLLODORUS_ATTRIB = ('Text: Apollodorus, The Library, tr. Sir James George Frazer (Loeb, '
                      '1921), public domain; Greek ed. Perseus. Digital edition: Perseus Digital '
                      'Library, CC-BY-SA 4.0 (perseus.tufts.edu).')
HOMER_ATTRIB = ('Greek: Homer, ed. D. B. Monro & T. W. Allen (OCT). English: A. T. Murray '
                '(Loeb, 1919–1925), public domain — the prose translation is given per card '
                '(a group of lines) beside the Greek. Digital edition: Perseus Digital Library, '
                'CC-BY-SA 4.0 (perseus.tufts.edu).')
HESIOD_ATTRIB = ('Greek: Hesiod (Perseus). English: Hugh G. Evelyn-White (Loeb, 1914), public '
                 'domain, given per ~5-line group beside the Greek; cited by line. Digital '
                 'edition: Perseus Digital Library, CC-BY-SA 4.0 (perseus.tufts.edu).')
HERODOTUS_ATTRIB = ('Text: Herodotus, The Histories, tr. A. D. Godley (Loeb, 1920–1925), public '
                    'domain; Greek ed. Perseus. Digital edition: Perseus Digital Library, '
                    'CC-BY-SA 4.0 (perseus.tufts.edu).')


def parse_bcs(xml_bytes):
    """Return {(book, chapter, section): text} for a book→chapter→section TEI (Apollodorus)."""
    xml = strip_notes(xml_bytes)
    root = ET.fromstring(xml)
    out = {}

    def walk(el, ctx):
        for div in el.findall('t:div', NS):
            if div.get('type') != 'textpart':
                walk(div, ctx); continue
            sub = (div.get('subtype') or '').lower()   # Herodotus' English uses "Book" (capital)
            c = dict(ctx); c[sub] = div.get('n')
            if sub == 'section':
                out[(c.get('book'), c.get('chapter'), div.get('n'))] = chapter_text(div)
            else:
                walk(div, c)
    walk(root.find('.//t:body', NS), {})
    return out


# A chapter number, optionally with the letter suffix editors give a long chapter's parts:
# Herodotus prints Xerxes' council as 7.8A-D, the Corinthian speech on tyranny as 5.92A-G,
# and Alexander's speech to the Athenians as 8.140A-B. Sections are numeric, except for the
# proem, labelled "pr".
CH_PARTS = re.compile(r'^(\d+)([A-Za-z]*)$')


def bcs_key(b, ch, sec):
    """(book, chapter, suffix, section) for a unit, or None if it isn't addressable.

    These used to be required to be all-digits, which silently discarded 110 units of
    Herodotus — not only the whole of 8.140, which has no unlettered part at all, but the
    body of every lettered chapter, leaving just its opening section behind.
    """
    if not (b and b.isdigit()):
        return None
    m = CH_PARTS.match(ch or '')
    if not m:
        return None
    if sec and sec.isdigit():
        s = int(sec)
    elif sec == 'pr':
        s = 0                                    # the proem sorts before section 1
    else:
        return None
    return int(b), int(m.group(1)), m.group(2), s


def build_bcs(slug_prefix, name_fmt, urn_dir, urn_base, eng_suffix, attrib, no_cache):
    """A book→chapter→section work, one file per book (chapter = chapter, verse = section), so
    "Apollod. 1.9.16" / "Xen. Mem. 1.2.3" opens Book 1, chapter 9/2, section 16/3.

    A chapter's lettered parts are folded into it in printed order and numbered straight
    through, so the chapter reads as one piece; each row keeps the edition's own label in
    `ref` ("A.3"), which is what the reader shows, so the real citation stays visible."""
    base = f'{urn_dir}/{urn_base}'
    grc = parse_bcs(fetch(f'{base}.perseus-grc2.xml', no_cache))
    eng = parse_bcs(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache))
    books = {}
    # Walk the union, not just the English: a translator's omission is not a gap in the work.
    # Herodotus' English skips nine sections the Greek has (7.19.2, 7.37.3, 7.41.2, 7.67.2 …),
    # which is why those chapters ran 1, 3. Such a row carries the Greek with no English
    # beside it, which is the truth of the edition rather than a hole in the text.
    # Two raw keys can land on the same row: Herodotus' proem is section n="0" in the Greek but
    # n="pr" in Godley's English, and bcs_key rightly folds both to section 0. Assigning the row
    # instead of merging it let whichever key the set happened to yield second overwrite the
    # other, so the proem showed its Greek or its English depending on the run's hash order.
    for key_raw in set(eng) | set(grc):
        b, ch, sec = key_raw
        key = bcs_key(b, ch, sec)
        if key:
            bk, cn, suffix, s = key
            row = books.setdefault(bk, {}).setdefault(cn, {})
            was_eng, was_grc = row.get((suffix, s), ('', ''))
            row[(suffix, s)] = (eng.get(key_raw) or was_eng, grc.get(key_raw) or was_grc)
    results = []
    for bk in sorted(books):
        chapters = []
        for ch in sorted(books[bk]):
            parts = books[bk][ch]
            # Only a chapter with lettered parts is renumbered, and it has to be: A.1 and B.1
            # would otherwise collide. Everything else keeps the edition's own section
            # numbers, which are not always contiguous — Herodotus 7.19 runs 1, 3 — so
            # numbering those sequentially would quietly move "7.37.4" to another section.
            lettered = any(suffix for suffix, _ in parts)
            verses = []
            for n, (suffix, s) in enumerate(sorted(parts), start=1):
                en, gr = parts[(suffix, s)]
                v = {'number': n if lettered else s, 'text': en}
                if gr:
                    v['greek'] = gr
                if lettered:
                    v['ref'] = f'{suffix}.{s}' if suffix else str(s)
                elif s == 0:
                    v['ref'] = 'pr'              # the proem is unnumbered in the edition
                verses.append(v)
            chapters.append({'number': ch, 'verses': verses})
        doc = {'work': name_fmt(bk), 'attribution': attrib, 'greek': True, 'chapters': drop_empty(chapters)}
        chapters = doc['chapters']
        slug = f'{slug_prefix}-{bk}'
        (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        results.append({'slug': slug, 'doc': doc, 'chapters': len(chapters),
                        'verses': sum(1 for c in chapters for v in c['verses'] if 'greek' in v)})
    return results


def build(slug_prefix, name_fmt, urn_dir, urn_base, per_book, no_cache):
    grc = parse_chapters(fetch(f'{urn_dir}/{urn_base}.perseus-grc2.xml', no_cache))
    eng = parse_chapters(fetch(f'{urn_dir}/{urn_base}.perseus-eng3.xml', no_cache))
    books = {}
    for (b, ch), en in eng.items():
        if not (ch and ch.isdigit() and int(ch) > 0):
            continue                              # skip the n="0" preface chapter
        bk = int(b) if (per_book and b and b.isdigit()) else 1
        books.setdefault(bk, {})[int(ch)] = (en, grc.get((b, ch), ''))

    works = []
    for bk in sorted(books):
        slug = f'{slug_prefix}-{bk}' if per_book else slug_prefix
        # One verse per chapter (English + parallel Greek); Epictetus chapters are short.
        chapters = [{'number': ch, 'verses': [
            {'number': 1, 'text': books[bk][ch][0], **({'greek': books[bk][ch][1]} if books[bk][ch][1] else {})}]}
            for ch in sorted(books[bk])]
        doc = {'work': name_fmt(bk), 'attribution': ATTRIB, 'greek': True, 'chapters': chapters}
        (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        works.append({'slug': slug, 'book': bk if per_book else None, 'doc': doc,
                      'chapters': len(chapters), 'verses': sum(len(c['verses']) for c in chapters)})
    return works


def resolve(text):
    s = re.sub(r'^cf\.\s*', '', text.strip())
    m = re.match(r'Epictetus,?\s*Ench\.\s+(\d+)', s)                    # Enchiridion, chapter
    if m:
        return ('epictetus-enchiridion', int(m.group(1)), None)
    m = re.match(r'Epictetus(?:,?\s*Diatr\.)?\s+(\d+)\.(\d+)', s)       # Discourses, book.chapter[.sec]
    if m:
        return (f'epictetus-discourses-{m.group(1)}', int(m.group(2)), None)
    m = re.match(r'Diogenes Laertius(?:, Vit\. phil\.)?\s+(\d+(?:\.\d+)+)', s)  # book.…​.section
    if m:
        p = [int(x) for x in m.group(1).split('.')]
        return ('diogenes-laertius', p[0], p[-1])                       # chapter=book, verse=section
    return None


def build_named_book(slug, name, urn_dir, urn_base, eng_suffix, book_n, attrib, no_cache):
    """One Life out of a file that holds a pair of them. Perseus keeps Agis with Cleomenes, and
    the two Gracchi together, as a single book→chapter→section document whose books are *named*
    ("Agis", "Cleomenes", "Tiberius", "Caius") and whose chapter numbers restart in each. Reading
    it with the ordinary chapter→section walk would collide Agis 1 with Cleomenes 1, so each Life
    is selected by its book name and emitted as its own work, numbered the way it is cited
    (Plut. Cleom. 10.1)."""
    def in_book(xml_bytes):
        root = ET.fromstring(strip_notes(xml_bytes))
        out = {}

        def sections(el, chapter):
            for div in el.findall('t:div', NS):
                if div.get('type') != 'textpart':
                    sections(div, chapter); continue
                if div.get('subtype') == 'section':
                    out[(chapter, div.get('n'))] = chapter_text(div)
                elif div.get('subtype') == 'chapter':
                    sections(div, div.get('n'))
                else:
                    sections(div, chapter)

        def find_book(el):
            for div in el.findall('t:div', NS):
                if div.get('type') == 'textpart' and div.get('subtype') == 'book':
                    if (div.get('n') or '') == book_n:
                        sections(div, None)
                else:
                    find_book(div)
        find_book(root.find('.//t:body', NS))
        return out

    base = f'{urn_dir}/{urn_base}'
    grc = in_book(fetch(f'{base}.perseus-grc1.xml', no_cache))
    eng = in_book(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache))
    chapters_map = {}
    for (ch, sec) in set(eng) | set(grc):
        if ch and ch.isdigit() and sec and sec.isdigit():
            chapters_map.setdefault(int(ch), {})[int(sec)] = (eng.get((ch, sec), ''), grc.get((ch, sec), ''))
    chapters = [{'number': ch, 'verses': [
        {'number': s, 'text': chapters_map[ch][s][0],
         **({'greek': chapters_map[ch][s][1]} if chapters_map[ch][s][1] else {})}
        for s in sorted(chapters_map[ch])]} for ch in sorted(chapters_map)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': drop_empty(chapters)}
    chapters = doc['chapters']
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters),
             'verses': sum(1 for c in chapters for v in c['verses'] if 'greek' in v)}]


def build_coarse_english(slug, name, urn_dir, urn_base, eng_suffix, eng_unit, attrib, no_cache,
                         grc_suffix='grc2'):
    """A work whose Greek divides finer than its public-domain English, but on the same frame.

    The two collections of sayings are the case: the Greek numbers every apophthegm — 500 in
    the Kings and Commanders, 416 in the Spartans — while Goodwin's 1874 English gives one
    block per figure. The figures themselves correspond exactly (92 and 69 of them, Artaxerxes
    against Ἀρτοξέρξης, Agasicles against Ἀγασικλῆς), so the chapter is the figure: its Greek
    read as one piece, beside the English for the same person. Babbitt's Loeb does number the
    sayings individually and would align verse for verse, but it is still in copyright.

    Building these off the section numbers instead left the Spartans with no English at all and
    the Kings with Greek on a third of its verses."""
    base = f'{urn_dir}/{urn_base}'
    grc_bytes = fetch(f'{base}.perseus-{grc_suffix}.xml', no_cache)
    grc = parse_chapters(grc_bytes)
    refs = parse_unit_refs(grc_bytes, None, 'chapter', 'stephpage')
    eng = parse_units(fetch(f'{base}.perseus-{eng_suffix}.xml', no_cache), None, eng_unit)
    units = {}
    for (_b, n) in set(grc) | set(eng):
        if n and n.isdigit():
            units[int(n)] = (eng.get((None, n), ''), grc.get((None, n), ''), refs.get((None, n)))
    chapters = [{'number': n, 'verses': [
        {'number': 1, 'text': units[n][0],
         **({'greek': units[n][1]} if units[n][1] else {}),
         **({'ref': units[n][2]} if units[n][2] else {})}]} for n in sorted(units)]
    doc = {'work': name, 'attribution': attrib, 'greek': True, 'chapters': drop_empty(chapters)}
    chapters = doc['chapters']
    (OUT_DIR / f'{slug}.json').write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
    return [{'slug': slug, 'doc': doc, 'chapters': len(chapters),
             'verses': sum(1 for c in chapters for v in c['verses'] if 'greek' in v)}]


def edition_year(xml_bytes):
    """The latest printed-edition year in a TEI header — what decides whether the translation
    may be shipped. Taking the latest, not the earliest, keeps the licence check conservative."""
    years = [int(y) for y in re.findall(r'<date[^>]*>\s*(1[89]\d\d)\s*</date>',
                                        xml_bytes[:20000].decode('utf-8', 'replace'))]
    return max(years) if years else None


def check_licence(no_cache):
    """Re-derive, from the TEI headers themselves, that every English edition the Plutarch
    tables name is out of copyright. Perseus ships in-copyright Loeb translations of the same
    works alongside the public-domain ones, distinguished only by a suffix digit, so a typo in
    a table row is the difference between Goodwin 1874 and Cherniss 1957. This fails the build
    rather than letting that ship."""
    rows = ([(w, e, 'Lives') for w, _s, _t, e in PLUTARCH_LIVES]
            + [(w, e, 'Moralia') for w, _s, _t, _l, e, _a in PLUTARCH_MORALIA + PLUTARCH_MORALIA_CH]
            + [(w, e, 'Moralia') for w, e in PLUTARCH_EXTRA_EDITIONS])
    bad = []
    for wid, suffix, _group in rows:
        yr = edition_year(fetch(f'tlg0007/{wid}/tlg0007.{wid}.perseus-{suffix}.xml', no_cache))
        if yr is None or yr >= PD_CUTOFF:
            bad.append((wid, suffix, yr))
    print(f'\nLicence check: {len(rows)} Plutarch English editions, '
          f'{len(rows) - len(bad)} confirmed pre-{PD_CUTOFF}')
    if bad:
        for wid, suffix, yr in bad:
            print(f'   IN COPYRIGHT  tlg0007.{wid} {suffix} ({yr})')
        sys.exit(f'refusing to build: {len(bad)} edition(s) are not public domain')


def validate(results):
    by_slug = {r['slug']: r for r in results}
    data = json.loads(CROSSREFS.read_text())
    cits = [c['text'] for e in data['entries'] for c in e.get('citations', [])
            if re.sub(r'^cf\.\s*', '', c['text'].strip()).startswith(('Epictetus', 'Diogenes Laertius'))]
    hit = miss = 0; misses = []
    for text in cits:
        r = resolve(text)
        if not r:
            miss += 1; misses.append(('UNMAPPED', text)); continue
        slug, ch, v = r
        w = by_slug.get(slug)
        chap = w and next((c for c in w['doc']['chapters'] if c['number'] == ch), None)
        ok = chap and (v is None or any(vv['number'] == v for vv in chap['verses']))
        if ok:
            hit += 1
        else:
            miss += 1; misses.append((f'{slug} {ch}:{v} missing', text))
    print(f'\nValidation: {len(cits)} Epictetus+Diogenes citations | resolved+found={hit} miss={miss}')
    for why, text in misses[:20]:
        print(f'   MISS  {text:34s} -> {why}')


# `--only <prefix>` restricts the run to slugs starting with that prefix, so adding one corpus
# doesn't rebuild all 120 files (Plutarch alone is 275 source documents). Every builder takes
# its slug — or, for the per-book ones, the slug prefix — as its first argument, so a single
# gate wrapped round them all covers every call site.
ONLY = None


def _gate(fn):
    def gated(slug, *args, **kwargs):
        return [] if ONLY and not slug.startswith(ONLY) else fn(slug, *args, **kwargs)
    return gated


build = _gate(build)
build_sections = _gate(build_sections)
build_stephanus = _gate(build_stephanus)
build_units = _gate(build_units)
build_named_book = _gate(build_named_book)
build_coarse_english = _gate(build_coarse_english)
build_greek_only = _gate(build_greek_only)
build_line_poem = _gate(build_line_poem)
build_line_parallel = _gate(build_line_parallel)
build_bcs = _gate(build_bcs)


def main():
    global ONLY
    no_cache = '--no-cache' in sys.argv
    if '--only' in sys.argv:
        ONLY = sys.argv[sys.argv.index('--only') + 1]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    results += build('epictetus-discourses', lambda b: f'Epictetus, Discourses (Book {b})',
                     'tlg0557/tlg001', 'tlg0557.tlg001', True, no_cache)
    results += build('epictetus-enchiridion', lambda b: 'Epictetus, Enchiridion',
                     'tlg0557/tlg002', 'tlg0557.tlg002', False, no_cache)
    results += build_sections('diogenes-laertius', 'Diogenes Laertius, Lives of the Philosophers',
                              'tlg0004/tlg001', 'tlg0004.tlg001', no_cache)
    # Plato — the dialogues, cited by Stephanus page (chapter = page). slug, display name, work id.
    for slug, name, wid in [
        ('plato-symposium',  'Plato, Symposium',  'tlg011'),
        ('plato-timaeus',    'Plato, Timaeus',    'tlg031'),
        ('plato-apology',    'Plato, Apology',    'tlg002'),
        ('plato-crito',      'Plato, Crito',      'tlg003'),
        ('plato-phaedo',     'Plato, Phaedo',     'tlg004'),
        ('plato-phaedrus',   'Plato, Phaedrus',   'tlg012'),
        ('plato-gorgias',    'Plato, Gorgias',    'tlg023'),
        ('plato-protagoras', 'Plato, Protagoras', 'tlg022'),
    ]:
        results += build_plato(slug, name, f'tlg0059/{wid}', f'tlg0059.{wid}', no_cache)
    # Aristotle — book→section (Ethics), book→chapter (Rhetoric), or flat chapters (Poetics),
    # each verse tagged with its Bekker number (the standard reference) from the "page" milestone.
    results += build_units('aristotle-nicomachean-ethics', 'Aristotle, Nicomachean Ethics',
                           'tlg0086/tlg010', 'tlg0086.tlg010', 'eng2', 'book', 'section', ARISTOTLE_ATTRIB, no_cache, ref_unit='page')
    results += build_units('aristotle-rhetoric', 'Aristotle, Rhetoric',
                           'tlg0086/tlg038', 'tlg0086.tlg038', 'eng2', 'book', 'chapter', ARISTOTLE_ATTRIB, no_cache, ref_unit='page')
    results += build_units('aristotle-poetics', 'Aristotle, Poetics',
                           'tlg0086/tlg034', 'tlg0086.tlg034', 'eng2', None, 'chapter', ARISTOTLE_ATTRIB, no_cache, ref_unit='page')
    # Plutarch — the Lives (Perrin's public-domain Loeb, chapter→section), including the
    # synkriseis, the paired comparisons that close most of the pairs.
    check_licence(no_cache)
    for wid, slug, title, eng_suffix in PLUTARCH_LIVES:
        results += build_units(f'plutarch-{slug}', f'Plutarch, {title}',
                               f'tlg0007/{wid}', f'tlg0007.{wid}', eng_suffix, 'chapter', 'section',
                               PLUTARCH_ATTRIB, no_cache,
                               grc_suffix=PLUTARCH_GRC.get(wid, 'grc2'))
    # Agis/Cleomenes and the two Gracchi share a document apiece — see build_named_book.
    for wid, book, slug, title in [
        ('tlg051', 'Agis', 'agis', 'Life of Agis'),
        ('tlg051', 'Cleomenes', 'cleomenes', 'Life of Cleomenes'),
        ('tlg052', 'Tiberius', 'tiberius-gracchus', 'Life of Tiberius Gracchus'),
        ('tlg052', 'Caius', 'caius-gracchus', 'Life of Caius Gracchus'),
    ]:
        results += build_named_book(f'plutarch-{slug}', f'Plutarch, {title}',
                                    f'tlg0007/{wid}', f'tlg0007.{wid}', 'eng1', book,
                                    PLUTARCH_ATTRIB, no_cache)
    # Plutarch, Moralia. The public-domain English carries no Stephanus milestones, so the
    # essays stay section-aligned; each section takes its Stephanus page ("351c", the standard
    # Moralia citation) from the Greek's "stephpage" milestone and shows it as the reference.
    for wid, slug, title, _latin, eng_suffix, attrib in PLUTARCH_MORALIA:
        results += build_units(f'plutarch-{slug}', f'Plutarch, {title}',
                               f'tlg0007/{wid}', f'tlg0007.{wid}', eng_suffix, None, 'section',
                               attrib, no_cache, ref_unit='stephpage',
                               grc_suffix=PLUTARCH_GRC.get(wid, 'grc2'))
    for wid, slug, title, _latin, eng_suffix, attrib in PLUTARCH_MORALIA_CH:
        results += build_units(f'plutarch-{slug}', f'Plutarch, {title}',
                               f'tlg0007/{wid}', f'tlg0007.{wid}', eng_suffix, 'chapter', 'section',
                               attrib, no_cache, ref_unit='stephpage',
                               grc_suffix=PLUTARCH_GRC.get(wid, 'grc2'))
    # The two collections of sayings, whose public-domain English is coarser than the Greek.
    results += build_coarse_english('plutarch-sayings-of-kings', 'Plutarch, Sayings of Kings and Commanders',
                                    'tlg0007/tlg081', 'tlg0007.tlg081', 'eng4', 'section',
                                    PLUTARCH_MORALIA_ATTRIB, no_cache, grc_suffix='grc4')
    results += build_coarse_english('plutarch-sayings-of-spartans', 'Plutarch, Sayings of Spartans',
                                    'tlg0007/tlg082', 'tlg0007.tlg082', 'eng4', 'chapter',
                                    PLUTARCH_MORALIA_ATTRIB, no_cache, grc_suffix='grc4')
    # The Table Talk is book→chapter→section (each book opening with an unnumbered preface as
    # chapter 0), so it goes one work per book like Herodotus.
    results += build_bcs('plutarch-table-talk', lambda b: f'Plutarch, Table Talk (Book {b})',
                         'tlg0007/tlg112', 'tlg0007.tlg112', 'eng2', PLUTARCH_MORALIA_ATTRIB, no_cache)
    # Two essays Perseus divides unlike their neighbours: the Love Stories to chapter, and the
    # (spurious) Lives of the Ten Orators to a nested section the flat walk reads at its top level.
    results += build_units('plutarch-love-stories', 'Plutarch, Love Stories',
                           'tlg0007/tlg114', 'tlg0007.tlg114', 'eng4', None, 'chapter',
                           PLUTARCH_MORALIA_ATTRIB, no_cache, ref_unit='stephpage')
    results += build_units('plutarch-ten-orators', 'Plutarch, Lives of the Ten Orators',
                           'tlg0007/tlg121', 'tlg0007.tlg121', 'eng4', None, 'section',
                           PLUTARCH_MORALIA_ATTRIB, no_cache, ref_unit='stephpage')
    # Lucian — the two works bearing on early Christianity (Fowler's public-domain English,
    # flat sections; cited by section). Alexander has 61 Greek but 59 English sections.
    results += build_units('lucian-peregrinus', 'Lucian, The Passing of Peregrinus',
                           'tlg0062/tlg042', 'tlg0062.tlg042', 'eng4', None, 'section', LUCIAN_ATTRIB, no_cache)
    results += build_units('lucian-alexander', 'Lucian, Alexander the False Prophet',
                           'tlg0062/tlg038', 'tlg0062.tlg038', 'eng4', None, 'section', LUCIAN_ATTRIB, no_cache)
    # Apollodorus, The Library — the mythographic handbook (one work per book).
    results += build_bcs('apollodorus-library', lambda b: f'Apollodorus, The Library (Book {b})',
                         'tlg0548/tlg001', 'tlg0548.tlg001', 'eng2', APOLLODORUS_ATTRIB, no_cache)
    # Xenophon, Memorabilia — the Socratic ethics (four books; cited Mem. book.chapter.section).
    results += build_bcs('xenophon-memorabilia', lambda b: f'Xenophon, Memorabilia (Book {b})',
                         'tlg0032/tlg002', 'tlg0032.tlg002', 'eng2', XENOPHON_ATTRIB, no_cache)
    # Marcus Aurelius, Meditations — Greek only (no aligned English on Perseus; cited Med. book.chapter).
    results += build_greek_only('marcus-aurelius-meditations', 'Marcus Aurelius, Meditations',
                                'tlg0562/tlg001', 'tlg0562.tlg001', 'book', 'chapter', MARCUS_ATTRIB, no_cache)
    # Philostratus, Life of Apollonius (chapter = book, verse = chapter) and Dio Chrysostom's
    # Orations (chapter = oration, verse = section) — Greek only on Perseus.
    results += build_greek_only('philostratus-apollonius', 'Philostratus, Life of Apollonius of Tyana',
                                'tlg0638/tlg001', 'tlg0638.tlg001', 'book', 'chapter', PHILOSTRATUS_ATTRIB, no_cache)
    results += build_greek_only('dio-chrysostom-orations', 'Dio Chrysostom, Orations',
                                'tlg0612/tlg001', 'tlg0612.tlg001', 'speech', 'section', DIO_ATTRIB,
                                no_cache, relabel=DIO_RELABEL)
    # Aratus, Phaenomena — the full didactic poem (Greek only, cited by line; line 5 = Acts 17:28).
    results += build_line_poem('aratus-phaenomena', 'Aratus, Phaenomena',
                               'tlg0653/tlg001', 'tlg0653.tlg001', ARATUS_ATTRIB, no_cache)
    # Homer — Iliad & Odyssey: Greek line-by-line with Murray's Loeb English per card (chapter =
    # book, verse = line; "Il. 1.1" → Book 1, line 1).
    results += build_line_parallel('homer-iliad', 'Homer, Iliad',
                                   'tlg0012/tlg001', 'tlg0012.tlg001', 'eng3', True, HOMER_ATTRIB, no_cache)
    results += build_line_parallel('homer-odyssey', 'Homer, Odyssey',
                                   'tlg0012/tlg002', 'tlg0012.tlg002', 'eng3', True, HOMER_ATTRIB, no_cache)
    # Hesiod — the three poems, cited by line (Evelyn-White's English per ~5-line group).
    results += build_line_parallel('hesiod-theogony', 'Hesiod, Theogony',
                                   'tlg0020/tlg001', 'tlg0020.tlg001', 'eng2', False, HESIOD_ATTRIB, no_cache)
    results += build_line_parallel('hesiod-works-and-days', 'Hesiod, Works and Days',
                                   'tlg0020/tlg002', 'tlg0020.tlg002', 'eng2', False, HESIOD_ATTRIB, no_cache)
    results += build_line_parallel('hesiod-shield', 'Hesiod, Shield of Heracles',
                                   'tlg0020/tlg003', 'tlg0020.tlg003', 'eng2', False, HESIOD_ATTRIB, no_cache)
    # Herodotus, The Histories — book→chapter→section, one work per book (Godley's Loeb English;
    # "Hdt. 1.1.1" → Book 1, chapter 1, section 1).
    results += build_bcs('herodotus-histories', lambda b: f'Herodotus, The Histories (Book {b})',
                         'tlg0016/tlg001', 'tlg0016.tlg001', 'eng2', HERODOTUS_ATTRIB, no_cache)
    for r in results:
        print(f'{r["slug"]:26s} chapters={r["chapters"]:2d} verses={r["verses"]:4d}')
    validate(results)


if __name__ == '__main__':
    main()
