/**
 * Build the Hebrew Vocabulary List PDF — the Hebrew counterpart to the Greek
 * Vocabulary Builder download on the assignment builder and the student quiz page.
 *
 * IT IS NOT THE SAME KIND OF THING as the Greek PDF, and the wording in the UI says so.
 * The Greek download is a published textbook (Biblical Greek Vocabulary Builder, Glanz,
 * Kostyu & Vine) with lessons, exercises and page numbers the quizzes cite. There is no
 * Hebrew equivalent to ship, so this is generated from OUR OWN deck
 * (src/data/hebrew-vocabulary.json) and is a study list, not a textbook.
 *
 * Generating rather than hand-making it is the point: the sections and subsections here
 * are read from HEBREW_DECK, the same object the quiz builder and the flashcards use, so
 * a student revising "Section 2-C" from the PDF meets exactly the words a 2-C quiz can
 * ask. Re-run it whenever the deck changes.
 *
 * Usage:  npx tsx scripts/build-hebrew-vocab-pdf.ts
 * Needs:  Google Chrome (headless --print-to-pdf) and network access for the webfont.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HEBREW_DECK } from '../src/lib/vocab-decks'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT  = join(ROOT, 'public', 'downloads', 'hebrew-vocabulary-list.pdf')
const TMP  = join(ROOT, '.hebrew-vocab-list.tmp.html')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function html(): string {
  const deck = HEBREW_DECK
  const total = deck.words.length

  const sections = deck.sections.map(s => {
    const subs = deck.subsections[s]
    const count = subs.reduce((n, sub) => n + sub.words.length, 0)
    const rows = subs.map(sub => `
      <section class="sub">
        <h3><span class="key">${esc(sub.key)}</span> <span class="rank">words ${esc(sub.rankRange)} of section ${s}</span></h3>
        <table>
          <tbody>
            ${sub.words.map(w => `
            <tr>
              <td class="heb" dir="rtl" lang="he">${esc(w.word)}</td>
              <td class="gloss">${esc(w.gloss)}</td>
              <td class="pos">${esc(w.pos ?? '')}</td>
              <td class="freq">${w.freq ?? ''}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </section>`).join('')

    return `
    <div class="section-block">
      <h2>Section ${s}
        <span class="meta">${count} words · cumulative coverage ${deck.coverage[s]}% of ${esc(deck.corpusLabel)}</span>
      </h2>
      ${rows}
    </div>`
  }).join('')

  const toc = deck.sections.map(s => {
    const count = deck.subsections[s].reduce((n, sub) => n + sub.words.length, 0)
    return `<tr><td>Section ${s}</td><td>${count} words</td>
            <td>${deck.subsections[s].map(x => x.label).join(' · ')}</td>
            <td class="freq">${deck.coverage[s]}%</td></tr>`
  }).join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Hebrew Vocabulary List</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 16mm 14mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, system-ui, sans-serif; color: #1c1917; margin: 0; font-size: 10pt; }

  .cover { height: 245mm; display: flex; flex-direction: column; justify-content: center; }
  .cover h1 { font-size: 30pt; margin: 0 0 6mm; letter-spacing: -0.5px; }
  .cover .sub { font-size: 12pt; color: #57534e; margin: 0 0 14mm; }
  .cover table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .cover th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em;
              color: #78716c; border-bottom: 1px solid #d6d3d1; padding: 0 0 2mm; }
  .cover td { padding: 2.2mm 0; border-bottom: 1px solid #f5f5f4; }
  .note { margin-top: 12mm; font-size: 9pt; color: #57534e; line-height: 1.65; max-width: 150mm; }
  .note strong { color: #1c1917; }

  .section-block { break-before: page; }
  h2 { font-size: 15pt; margin: 0 0 5mm; padding-bottom: 2mm; border-bottom: 2px solid #1c1917; }
  h2 .meta { display: block; font-size: 8.5pt; font-weight: 400; color: #78716c; margin-top: 1.5mm; }

  .sub { break-inside: avoid; margin-bottom: 6mm; }
  h3 { font-size: 10pt; margin: 0 0 1.5mm; display: flex; align-items: baseline; gap: 3mm; }
  h3 .key { background: #1c1917; color: #fff; padding: 0.8mm 2.2mm; border-radius: 2mm; font-size: 9pt; }
  h3 .rank { font-weight: 400; color: #78716c; font-size: 8.5pt; }

  table { width: 100%; border-collapse: collapse; }
  td { padding: 1.1mm 2mm; border-bottom: 1px solid #f5f5f4; vertical-align: baseline; }
  tr:nth-child(even) td { background: #fafaf9; }
  .heb { font-family: 'Noto Serif Hebrew', 'SBL Hebrew', serif; font-size: 14pt;
         width: 34mm; text-align: right; line-height: 1.75; white-space: nowrap; }
  .gloss { font-size: 9.5pt; }
  .pos   { font-size: 8pt; color: #78716c; width: 24mm; }
  .freq  { font-size: 8pt; color: #a8a29e; width: 14mm; text-align: right; font-variant-numeric: tabular-nums; }
</style></head>
<body>

<div class="cover">
  <h1>Hebrew Vocabulary List</h1>
  <p class="sub">${total.toLocaleString('en-US')} words of Biblical Hebrew, ordered by frequency<br>
     seminarygreek.app</p>

  <table>
    <thead><tr><th>Section</th><th>Size</th><th>Subsections</th><th class="freq">Coverage</th></tr></thead>
    <tbody>${toc}</tbody>
  </table>

  <div class="note">
    <p><strong>How the list is organised.</strong> Words are ranked by how often they occur in
    the Hebrew Bible and divided into seven sections. Learning section 1 alone accounts for
    ${deck.coverage[deck.sections[0]]}% of the words on the page; all seven reach
    ${deck.coverage[deck.sections[deck.sections.length - 1]]}%. Each section is split into
    lettered subsections of about twenty words — the unit vocabulary quizzes are set from, so
    revising <em>2-C</em> here covers exactly what a 2-C quiz can ask.</p>
    <p><strong>Coverage</strong> is cumulative and counts word occurrences, not distinct words:
    it is the share of the running text a reader who knows every word through that section
    would recognise.</p>
    <p>Glosses are deliberately short — enough to fix the word, not to replace a lexicon.
    Generated from the app's own vocabulary deck; the Greek download it sits beside is a
    published textbook and is a different kind of thing.</p>
  </div>
</div>

${sections}
</body></html>`
}

const page = html()
writeFileSync(TMP, page, 'utf8')
mkdirSync(dirname(OUT), { recursive: true })

try {
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-pdf-header-footer',
    // Give the webfont time to arrive; without it the Hebrew silently falls back.
    '--virtual-time-budget=20000',
    `--print-to-pdf=${OUT}`,
    `file://${TMP}`,
  ], { stdio: 'inherit' })
} finally {
  unlinkSync(TMP)
}

const words = HEBREW_DECK.words.length
const subs  = HEBREW_DECK.allSubsectionKeys.length
console.log(`wrote ${OUT}`)
console.log(`  ${words} words · ${HEBREW_DECK.sections.length} sections · ${subs} subsections`)
