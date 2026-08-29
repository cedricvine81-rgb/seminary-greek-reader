// Spanish for the parsing frame (components/morphology/ParseFrame.tsx).
//
// The grid is one component rendered at the head of every verb chapter, but the morphology
// catalogues are fetched PER CHAPTER (/data/morphology/<locale>/<chapter>.json), so its keys have
// to be present in each of those files or the grid falls back to English on eleven of the twelve
// pages. Written by script rather than by hand for that reason: one source, twelve destinations,
// no chance of them drifting apart.
//
// Each entry carries the fingerprint of the ENGLISH it was translated from — that is what makes a
// stale translation fall back instead of quietly contradicting the English (src/lib/i18n/content.ts).
//
// It has to run AFTER every i18n-content --build. The generator collects keys by rendering the
// chapter .tsx files, and the frame's tm() calls live inside ParseFrame.tsx rather than in any
// chapter, so the build reads these keys as orphans and drops them. `npm run i18n:content` chains
// the two for that reason; run the build on its own and the frame silently reverts to English.
//
// Usage:  npm run i18n:content   (or: node scripts/add-parseframe-es.mjs after a manual build)
import fs from 'node:fs'

function fingerprint(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(36)
}

// Catalogue names are the chapter TAB ids, which are not always the source filename:
// chapters/second-aorists.tsx is served as the tab '2nd-aorists'.
const CHAPTERS = ['parsing', 'indicatives', 'contract-verbs', 'liquids', 'principal-parts',
  '2nd-aorists', 'deponents', 'infinitives', 'imperatives', 'participles',
  'basic-verbs',
  'subjunctives', 'mi-verbs']

// key → [English exactly as ParseFrame passes it, Spanish]
const PAIRS = {
  'parseframe.title': ['To parse a verb, give every slot', 'Para analizar un verbo, indica cada casilla'],
  'parseframe.h.tense': ['Tense', 'Tiempo'],
  'parseframe.h.voice': ['Voice', 'Voz'],
  'parseframe.h.mood': ['Mood', 'Modo'],
  'parseframe.h.person': ['Person', 'Persona'],
  'parseframe.h.number': ['Num.', 'Núm.'],
  'parseframe.h.case': ['Case', 'Caso'],
  'parseframe.h.gender': ['Gen.', 'Gén.'],
  'parseframe.h.lexical': ['1st Person Sg', '1.ª persona sg.'],
  'parseframe.h.meaning': ['Meaning', 'Significado'],
  'parseframe.h.inflected': ['Inflected Meaning', 'Significado de la forma'],
  'parseframe.tense.0': ['Present', 'Presente'],
  'parseframe.tense.1': ['Future', 'Futuro'],
  'parseframe.tense.2': ['Imperfect', 'Imperfecto'],
  'parseframe.tense.3': ['Aorist', 'Aoristo'],
  'parseframe.tense.4': ['Perfect', 'Perfecto'],
  'parseframe.tense.5': ['Pluperfect', 'Pluscuamperfecto'],
  'parseframe.voice.0': ['Active', 'Activa'],
  'parseframe.voice.1': ['Middle', 'Media'],
  'parseframe.voice.2': ['Passive', 'Pasiva'],
  'parseframe.mood.0': ['Indicative', 'Indicativo'],
  'parseframe.mood.1': ['Imperative', 'Imperativo'],
  'parseframe.mood.2': ['Infinitive', 'Infinitivo'],
  'parseframe.mood.3': ['Subjunctive', 'Subjuntivo'],
  'parseframe.mood.participle': ['Participle', 'Participio'],
  'parseframe.person.0': ['1st', '1.ª'],
  'parseframe.person.1': ['2nd', '2.ª'],
  'parseframe.person.2': ['3rd', '3.ª'],
  'parseframe.number.0': ['Sing.', 'Sing.'],
  'parseframe.number.1': ['Plural', 'Plural'],
  'parseframe.case.0': ['Nom.', 'Nom.'],
  'parseframe.case.1': ['Acc.', 'Acus.'],
  'parseframe.case.2': ['Gen.', 'Gen.'],
  'parseframe.case.3': ['Dat.', 'Dat.'],
  'parseframe.gender.0': ['Masc.', 'Masc.'],
  'parseframe.gender.1': ['Fem.', 'Fem.'],
  'parseframe.gender.2': ['Neut.', 'Neut.'],
  'parseframe.ex.meaning': ['I untie', 'desato'],
  'parseframe.ex.inflected': ['e.g. we untied', 'p. ej. desatamos'],
  'parseframe.note': [
    'Every finite verb has the first five; a participle swaps person for case and gender; an infinitive stops after the mood. The parse ends with the lexical form — the 1st person singular — and you should be able to say what both it and the form in front of you mean.',
    'Todo verbo conjugado lleva las cinco primeras; el participio cambia la persona por el caso y el género; el infinitivo se detiene después del modo. El análisis termina con la forma léxica —la 1.ª persona del singular— y debes poder decir qué significan tanto ella como la forma que tienes delante.'],
}

let written = 0
for (const chapter of CHAPTERS) {
  const path = `public/data/morphology/es/${chapter}.json`
  if (!fs.existsSync(path)) { console.log(`  no catalogue yet: ${chapter}`); continue }
  const cat = JSON.parse(fs.readFileSync(path, 'utf8'))
  for (const [key, [en, es]] of Object.entries(PAIRS)) cat[key] = { fp: fingerprint(en), text: es }
  fs.writeFileSync(path, JSON.stringify(Object.fromEntries(Object.entries(cat).sort()), null, 2) + '\n')
  written++
}
console.log(`parsing frame: ${Object.keys(PAIRS).length} keys written into ${written} chapter catalogues`)
