// Dump the next N untranslated summaries, grouped by work, for translation.
// Usage: node scripts/next-summaries.mjs [count]
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const n = Number(process.argv[2] ?? 25)
const all = JSON.parse(execSync('npx tsx scripts/i18n-content.ts --list summaries 2>/dev/null').toString())
const have = fs.existsSync('src/lib/i18n/es/summaries.json')
  ? JSON.parse(fs.readFileSync('src/lib/i18n/es/summaries.json', 'utf8')) : {}

const byWork = new Map()
for (const [k, v] of Object.entries(all)) {
  if (k.startsWith('summary.heading.') || have[k]) continue
  const w = k.split('.')[1]
  if (!byWork.has(w)) byWork.set(w, [])
  byWork.get(w).push([k, v])
}
const works = Array.from(byWork.keys()).slice(0, n)
for (const w of works) for (const [k, v] of byWork.get(w)) console.log(`${k}\n${v}\n`)
console.error(`${works.length} works dumped; ${byWork.size} works still untranslated`)
