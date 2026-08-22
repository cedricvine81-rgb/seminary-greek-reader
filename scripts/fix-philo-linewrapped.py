r"""Rebuild the three Philo works whose sections were display lines, not sentences.

THE DEFECT. Yonge's source pages hard-wrap their HTML, so a literal newline in the markup is a
line break, not a paragraph break. build-philo.py's page_to_text turned <p>/<br> into '\n' and
its marker-less fallback then split on every '\n' — which meant every wrapped display line became
its own "verse", chopped mid-sentence:

    world 1.1   'There is no existing thing equal in honour to God, but he is the one Ruler, and'
    world 1.2   'King, to whom alone it is lawful to govern and regulate everything; for the verse-'

Three works have no Cohn-Wendland "(n)" markers and so take that fallback: On the World and the
Fragments appendices, and Book I of On Providence (Book II is marker-based and is NOT touched
here). Between them 1,422 "sections" were line fragments.

THE FIX, already applied in build-philo.py, is one line: flatten the source's own newlines to
spaces BEFORE converting <p>/<br>/<div>/<hr> to '\n', so that afterwards '\n' means a real
paragraph tag and nothing else. The marker path is provably unaffected — it collapses \s+ inside
each section either way, so all 33 marker-based works produce byte-identical output.

This script applies that same corrected parse to just the three affected works, reading the pages
from build-philo.py's cache so no network fetch (and no risk to the other works) is involved.

RENUMBERING. Section numbers necessarily change, because the old ones counted line breaks. That
is safe here and was checked: backgrounds-crossrefs.json contains no reference to any of the three
(they are appendices that nothing cites), and the old numbers addressed mid-sentence fragments,
so nothing meaningful could have been anchored to them.

Usage:  python3 scripts/fix-philo-linewrapped.py [--write]
        (run from the repo root; without --write it only reports)
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('bp', ROOT / 'scripts/build-philo.py')
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)          # safe: build-philo.py only runs main() under __main__

# slug -> (cached page, the book number to replace; other books are left alone)
TARGETS = [('world', 'book44', 1), ('fragments', 'book45', 1), ('providence', 'book38', 1)]


def paragraphs(page):
    """Delegate to build-philo.py's own fallback so the two can never drift apart."""
    return [text for _book, _n, text in bp.parse_page((bp.CACHE / f'{page}.html').read_bytes(), 1)]


def main():
    write = '--write' in sys.argv
    for slug, page, book_no in TARGETS:
        path = ROOT / 'public/data/philo' / f'{slug}.json'
        doc = json.loads(path.read_text(encoding='utf-8'))
        chapter = next(c for c in doc['chapters'] if c.get('number') == book_no)
        before = len(chapter['verses'])

        paras = paragraphs(page)
        if not paras:
            print(f'{slug}: no paragraphs parsed — skipped, nothing changed')
            continue
        # Already repaired? The tell-tale is a median section far shorter than a sentence.
        med_before = sorted(len(v['text']) for v in chapter['verses'])[before // 2]
        med_after = sorted(len(p) for p in paras)[len(paras) // 2]
        if med_before > 300 and len(paras) == before:
            print(f'{slug} bk{book_no}: already repaired (median {med_before}) — skipped')
            continue

        chapter['verses'] = [{'number': i, 'text': p} for i, p in enumerate(paras, 1)]
        print(f'{slug} bk{book_no}: {before} -> {len(paras)} §§   '
              f'median {med_before} -> {med_after} chars')
        print(f'    was: {json.loads(path.read_text(encoding="utf-8"))["chapters"][0]["verses"][0]["text"][:78]!r}')
        print(f'    now: {paras[0][:78]!r}')
        if write:
            path.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')

    print('\n' + ('written' if write else 'dry run — pass --write'))


main()
