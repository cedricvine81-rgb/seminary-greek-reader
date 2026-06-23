#!/usr/bin/env node
/**
 * Builds whole-Bible pericope (section) boundaries from the Berean Standard Bible
 * USFX (public domain), for the Exegesis passage box's autocomplete.
 *
 * Source: BSB USFX from eBible.org (engbsb_usfx.xml) — public domain.
 * Output: public/data/pericopes.json  { [osisId]: [{c,v,ec,ev,t}, ...] }
 *   c/v = section start chapter/verse, ec/ev = end chapter/verse, t = title.
 *
 * NT versification matches the app's Greek NT exactly. The OT is approximate
 * (BSB is Masoretic; the app's OT is the LXX), per the product decision.
 *
 * Usage: node scripts/import-pericopes.js /path/to/engbsb_usfx.xml
 */
const fs = require('fs')
const path = require('path')

const SRC = process.argv[2] || '/tmp/bsb2/engbsb_usfx.xml'
const OUT = path.join(__dirname, '..', 'public', 'data', 'pericopes.json')

// USFX/USFM book code → the app's osisId (from public/data/books.json).
// Books not present in the app (e.g. Eccl/Obadiah/Nahum/Zephaniah, or BSB lacking
// the deuterocanon) are simply omitted — no suggestion there.
const CODE_TO_OSIS = {
  MAT: 'Matt', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Rom',
  '1CO': '1Cor', '2CO': '2Cor', GAL: 'Gal', EPH: 'Eph', PHP: 'Phil', COL: 'Col',
  '1TH': '1Thess', '2TH': '2Thess', '1TI': '1Tim', '2TI': '2Tim', TIT: 'Titus',
  PHM: 'Phlm', HEB: 'Heb', JAS: 'Jas', '1PE': '1Pet', '2PE': '2Pet',
  '1JN': '1John', '2JN': '2John', '3JN': '3John', JUD: 'Jude', REV: 'Rev',
  GEN: 'Gen', EXO: 'Exod', LEV: 'Lev', NUM: 'Num', DEU: 'Deut', JOS: 'JoshB',
  JDG: 'JudgB', RUT: 'Ruth', '1SA': '1Sam', '2SA': '2Sam', '1KI': '1Kgs',
  '2KI': '2Kgs', '1CH': '1Chr', '2CH': '2Chr', EZR: 'Ezra', NEH: 'Neh',
  EST: 'EsthGr', JOB: 'Job', PSA: 'Ps', PRO: 'Prov', SNG: 'Song', ISA: 'Isa',
  JER: 'Jer', LAM: 'Lam', EZK: 'Ezek', DAN: 'DanLXX', HOS: 'Hos', JOL: 'Joel',
  AMO: 'Amos', JON: 'Jonah', MIC: 'Mic', HAB: 'Hab', HAG: 'Hag', ZEC: 'Zech', MAL: 'Mal',
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8217;|&rsquo;/g, '’').replace(/\s+/g, ' ').trim()

function main() {
  const xml = fs.readFileSync(SRC, 'utf8')
  const out = {}            // osisId → array of sections
  let cur = null            // section currently being extended
  let pendingTitle = null   // s1 title awaiting its first verse

  // Walk s1 section headings and verse markers in document order.
  const re = /<s style="s1"[^>]*>([^<]*)<\/s>|<v\b[^>]*\bbcv="([^"]+)"/g
  let m
  while ((m = re.exec(xml)) !== null) {
    if (m[1] !== undefined) { pendingTitle = decode(m[1]); continue }
    const [code, cs, vs] = m[2].split('.')
    const osis = CODE_TO_OSIS[code]
    const c = parseInt(cs, 10), v = parseInt(vs, 10)
    if (pendingTitle !== null) {
      const title = pendingTitle
      pendingTitle = null
      if (!osis) { cur = null; continue }
      cur = { c, v, ec: c, ev: v, t: title }
      ;(out[osis] ??= []).push(cur)
    } else if (cur && osis && (out[osis] && out[osis][out[osis].length - 1] === cur)) {
      // extend the current section's end as long as we're in the same book
      cur.ec = c; cur.ev = v
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(out))
  const books = Object.keys(out).length
  const sections = Object.values(out).reduce((n, a) => n + a.length, 0)
  console.log(`Wrote ${sections} sections across ${books} books → ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`)
}
main()
