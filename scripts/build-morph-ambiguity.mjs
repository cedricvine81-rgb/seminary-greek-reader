// Which Greek forms have more than one legitimate parse.
//
// WHY. A parsing quiz shows a form with no context, and Greek forms are routinely identical
// across parses: παντί is masculine AND neuter dative singular, πολλῶν is genitive plural in all
// three genders, πάντα is nominative and accusative neuter plural. The quiz pool stores each
// reading as its own entry, so one of them ends up as "the" answer and a student who gave the
// other was marked down for saying something entirely correct.
//
// This emits only the forms where that can happen — a few hundred entries, not the 3,900-form
// pool — so the grader can load it without pulling the whole pool into an API route.
//
// Output: src/data/morph-ambiguity.json  { "surface|lexeme": [ {parse}, {parse} ] }
//
// Usage:  node scripts/build-morph-ambiguity.mjs

import fs from 'node:fs'
import path from 'node:path'

const FIELDS = ['tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender', 'pronounType']
const pool = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/greek-parsing-pool.json'), 'utf8'))

const byForm = new Map()
for (const pos of ['verb', 'noun', 'adjective', 'pronoun']) {
  for (const e of pool[pos] ?? []) {
    const key = `${e.surface}|${e.lexeme}`
    const parse = { partOfSpeech: e.partOfSpeech }
    for (const f of FIELDS) if (e[f]) parse[f] = e[f]
    const seen = byForm.get(key) ?? []
    const sig = JSON.stringify(parse)
    if (!seen.some(p => JSON.stringify(p) === sig)) seen.push(parse)
    byForm.set(key, seen)
  }
}

const out = {}
for (const [key, parses] of byForm) if (parses.length > 1) out[key] = parses

const file = path.join(process.cwd(), 'src/data/morph-ambiguity.json')
fs.writeFileSync(file, JSON.stringify(out, null, 0))
const n = Object.keys(out).length
const readings = Object.values(out).reduce((s, p) => s + p.length, 0)
console.log(`morph-ambiguity.json: ${n} forms with more than one parse (${readings} readings), ${(fs.statSync(file).size / 1024).toFixed(0)} KB`)
const worst = Object.entries(out).sort((a, b) => b[1].length - a[1].length).slice(0, 6)
for (const [k, v] of worst) {
  console.log(`  ${k.split('|')[0]} (${k.split('|')[1]}) — ${v.length} readings`)
}
