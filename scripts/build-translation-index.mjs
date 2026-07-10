// Build a full-text search index for one or more parallel translations, so the mobile
// reader can search the translation it's showing (English, Spanish, …) the same way it
// searches Greek. Fetches each translation once from getbible.net (per book) and writes a
// gzipped index to public/data/search-index-<lang>.json.gz.
//
// Usage:  node scripts/build-translation-index.mjs en es       (defaults to en es)
//
// Note: needs network. In restricted shells: CURL_CA_BUNDLE=/etc/ssl/cert.pem and a
// sandbox that allows outbound HTTPS.

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// App lang code → getbible.net translation code (mirrors src/app/api/translation/route.ts).
const LANG_TO_TRANSLATION = {
  en: 'web', es: 'valera', fr: 'ls1910', pt: 'almeida', ru: 'synodal', ko: 'korean', zh: 'cut',
}

// getbible book number → the reader's osisId (so result ids match the reader's verses and
// parseReference can jump to them). Deuterocanon isn't covered by these translations.
const NUM_TO_OSIS = {
  1: 'Gen', 2: 'Exod', 3: 'Lev', 4: 'Num', 5: 'Deut', 6: 'JoshB', 7: 'JudgB', 8: 'Ruth',
  9: '1Sam', 10: '2Sam', 11: '1Kgs', 12: '2Kgs', 13: '1Chr', 14: '2Chr', 15: 'Ezra', 16: 'Neh',
  17: 'EsthGr', 18: 'Job', 19: 'Ps', 20: 'Prov', 21: 'Eccl', 22: 'Song', 23: 'Isa', 24: 'Jer',
  25: 'Lam', 26: 'Ezek', 27: 'DanLXX', 28: 'Hos', 29: 'Joel', 30: 'Amos', 31: 'Obad', 32: 'Jonah',
  33: 'Mic', 34: 'Nah', 35: 'Hab', 36: 'Zeph', 37: 'Hag', 38: 'Zech', 39: 'Mal',
  40: 'Matt', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts', 45: 'Rom', 46: '1Cor', 47: '2Cor',
  48: 'Gal', 49: 'Eph', 50: 'Phil', 51: 'Col', 52: '1Thess', 53: '2Thess', 54: '1Tim', 55: '2Tim',
  56: 'Titus', 57: 'Phlm', 58: 'Heb', 59: 'Jas', 60: '1Pet', 61: '2Pet', 62: '1John', 63: '2John',
  64: '3John', 65: 'Jude', 66: 'Rev',
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchBook(code, num, attempt = 1) {
  try {
    const res = await fetch(`https://api.getbible.net/v2/${code}/${num}.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    if (attempt < 4) { await sleep(500 * attempt); return fetchBook(code, num, attempt + 1) }
    throw err
  }
}

async function buildLang(lang) {
  const code = LANG_TO_TRANSLATION[lang]
  if (!code) throw new Error(`No getbible translation for lang "${lang}"`)
  const entries = []
  for (let num = 1; num <= 66; num++) {
    const osis = NUM_TO_OSIS[num]
    process.stdout.write(`  ${lang}: book ${num} (${osis})…\r`)
    let book
    try { book = await fetchBook(code, num) } catch (e) { console.warn(`\n  ! ${lang} book ${num} failed: ${e.message}`); continue }
    for (const ch of book.chapters ?? []) {
      for (const v of ch.verses ?? []) {
        const text = String(v.text ?? '').replace(/\s+/g, ' ').trim()
        if (text) entries.push({ id: `${osis}.${ch.chapter}.${v.verse}`, t: text })
      }
    }
    await sleep(120) // be polite to the API
  }
  const outPath = path.join(process.cwd(), 'public', 'data', `search-index-${lang}.json.gz`)
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(entries), 'utf8'), { level: 9 })
  fs.writeFileSync(outPath, gz)
  console.log(`\n  ✓ ${lang}: ${entries.length} verses → ${outPath} (${(gz.length / 1e6).toFixed(1)} MB gz)`)
}

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['en', 'es']
for (const lang of langs) {
  console.log(`Building ${lang}…`)
  await buildLang(lang)
}
console.log('Done.')
