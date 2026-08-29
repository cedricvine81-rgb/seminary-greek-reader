'use client'

/* ─────────────────────────────────────────────
   The parsing frame — what a full parse of a Greek verb contains.

   One grid at the head of every verb chapter, so the shape of a parse is in front of the student
   before the forms are. The chapters teach the slots one at a time (the parsing chapter has a
   table per form: finite, participle, infinitive); this is the whole frame at once, and it adds
   the two things those tables leave out — the LEXICAL FORM the parse ends with, and the two
   meanings a student should be able to give: what the dictionary form means, and what the
   inflected form in front of them means.

   The participle row is why this is hand-built rather than a MorphTable: a participle takes case,
   number and gender where a finite verb takes person and number, so the row has to span the same
   columns differently. Flattening that into one row of eight columns would misrepresent it.

   Translation goes through one shared id, `parseframe.*`, so the grid is translated once — but
   the morphology catalogues are per chapter, so those keys have to exist in every chapter file
   that renders it (scripts/add-parseframe-es.mjs puts them there).
───────────────────────────────────────────── */

import { useTm } from './shared'

const TENSES = ['Present', 'Future', 'Imperfect', 'Aorist', 'Perfect', 'Pluperfect']
const VOICES = ['Active', 'Middle', 'Passive']
const MOODS = ['Indicative', 'Imperative', 'Infinitive', 'Subjunctive']
const PERSONS = ['1st', '2nd', '3rd']
const NUMBERS = ['Sing.', 'Plural']
const CASES = ['Nom.', 'Acc.', 'Gen.', 'Dat.']
const GENDERS = ['Masc.', 'Fem.', 'Neut.']

/** A stacked list of options — one cell of the grid, read top to bottom. */
function Options({ items, tm, k }: { items: string[]; tm: (key: string, en: string) => string; k: string }) {
  return (
    <span className="block leading-relaxed">
      {items.map((x, i) => <span key={x} className="block">{tm(`parseframe.${k}.${i}`, x)}</span>)}
    </span>
  )
}

export function ParseFrame() {
  const tm = useTm()
  const th = 'border border-gray-300 px-2 py-1.5 text-center text-xs font-semibold text-gray-700 bg-parchment-50'
  const td = 'border border-gray-300 px-2 py-1.5 align-top text-sm text-gray-800'
  return (
    <div className="mb-6">
      <p className="mb-1.5 text-sm font-semibold text-gray-900">
        {tm('parseframe.title', 'To parse a verb, provide every element')}
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse w-full min-w-[640px]">
          <thead>
            <tr>
              <th className={th}>{tm('parseframe.h.tense', 'Tense')}</th>
              <th className={th}>{tm('parseframe.h.voice', 'Voice')}</th>
              <th className={th}>{tm('parseframe.h.mood', 'Mood')}</th>
              <th className={th} colSpan={2}>{tm('parseframe.h.person', 'Person')}</th>
              <th className={th}>{tm('parseframe.h.number', 'Num.')}</th>
              <th className={th}>{tm('parseframe.h.lexical', '1st Person Sg')}</th>
              <th className={th}>{tm('parseframe.h.meaning', 'Meaning')}</th>
              <th className={th}>{tm('parseframe.h.inflected', 'Inflected Meaning')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td} rowSpan={2}><Options items={TENSES} tm={tm} k="tense" /></td>
              <td className={td} rowSpan={2}><Options items={VOICES} tm={tm} k="voice" /></td>
              <td className={td}><Options items={MOODS} tm={tm} k="mood" /></td>
              <td className={td} colSpan={2}><Options items={PERSONS} tm={tm} k="person" /></td>
              <td className={td}><Options items={NUMBERS} tm={tm} k="number" /></td>
              <td className={td} rowSpan={2}><span className="font-greek">λύω</span></td>
              <td className={td} rowSpan={2}>{tm('parseframe.ex.meaning', 'I untie')}</td>
              <td className={td} rowSpan={2}>{tm('parseframe.ex.inflected', 'e.g. we untied')}</td>
            </tr>
            {/* A participle takes case, number and gender where a finite verb takes person. */}
            <tr>
              <td className={td}>{tm('parseframe.mood.participle', 'Participle')}</td>
              <td className={td}>
                <span className="block text-xs font-semibold text-gray-600">{tm('parseframe.h.case', 'Case')}</span>
                <Options items={CASES} tm={tm} k="case" />
              </td>
              <td className={td}>
                <span className="block text-xs font-semibold text-gray-600">{tm('parseframe.h.number', 'Num.')}</span>
                <Options items={NUMBERS} tm={tm} k="number" />
              </td>
              <td className={td}>
                <span className="block text-xs font-semibold text-gray-600">{tm('parseframe.h.gender', 'Gen.')}</span>
                <Options items={GENDERS} tm={tm} k="gender" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {tm('parseframe.note',
          'Every finite verb has the first five; a participle swaps person for case and gender; an infinitive stops after the mood. The parse ends with the lexical form — the 1st person singular — and you should be able to say what both it and the form in front of you mean.')}
      </p>
    </div>
  )
}
