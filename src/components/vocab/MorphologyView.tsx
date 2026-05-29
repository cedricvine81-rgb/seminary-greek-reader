'use client'

import { useState } from 'react'
import clsx from 'clsx'

/* ─────────────────────────────────────────────
   Reusable table component
───────────────────────────────────────────── */

interface MorphTableProps {
  title?: string
  headers: string[]
  rows: (string | null | undefined)[][]
  /** Row indices that should be rendered as section-divider rows */
  dividerRows?: number[]
  note?: string
}

function MorphTable({ title, headers, rows, dividerRows = [], note }: MorphTableProps) {
  const divSet = new Set(dividerRows)
  return (
    <div className="mb-5">
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {title}
        </p>
      )}
      <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={clsx(
                    'px-3 py-2 font-semibold text-gray-700 text-xs tracking-wide',
                    i === 0 ? 'text-left' : 'text-center'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isDivider = divSet.has(ri)
              return (
                <tr
                  key={ri}
                  className={clsx(
                    isDivider ? 'bg-gray-50 border-t border-gray-200' : 'bg-white',
                    !isDivider && ri > 0 && 'border-t border-gray-100'
                  )}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={clsx(
                        'px-3 py-2',
                        isDivider
                          ? 'text-xs font-semibold text-gray-500 uppercase tracking-wide'
                          : ci === 0
                          ? 'text-left text-xs font-medium text-gray-500'
                          : 'text-center text-gray-900 text-base'
                      )}
                    >
                      {cell ?? ''}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Section data
───────────────────────────────────────────── */

interface Section {
  id: number
  label: string
  title: string
  content: React.ReactNode
}

const sections: Section[] = [
  /* ── MIN 1: 1st & 2nd Declension ─────────── */
  {
    id: 1,
    label: 'Ess. 1',
    title: '1st & 2nd Declension Endings',
    content: (
      <MorphTable
        headers={['', 'Masculine', 'Neuter', 'Feminine']}
        dividerRows={[0, 5]}
        rows={[
          ['Singular', '', '', ''],
          ['Nom.', '‒ος', '‒ον', '‒η'],
          ['Gen.', '‒ου', '', '‒ης'],
          ['Dat.', '‒ῳ', '', '‒ῃ'],
          ['Acc.', '‒ον', '', '‒ην'],
          ['Plural', '', '', ''],
          ['Nom.', '‒οι', '‒α', '‒αι'],
          ['Gen.', '‒ων', '', '‒ων'],
          ['Dat.', '‒οις', '', '‒αις'],
          ['Acc.', '‒ους', '', '‒ας'],
        ]}
        note="Empty neuter cells share the masculine ending."
      />
    ),
  },

  /* ── MIN 2: 3rd Declension ────────────────── */
  {
    id: 2,
    label: 'Ess. 2',
    title: '3rd Declension Endings',
    content: (
      <MorphTable
        headers={['', 'Masc / Fem', 'Neuter']}
        dividerRows={[0, 5]}
        rows={[
          ['Singular', '', ''],
          ['Nom.', '‒ς  or  ‒(none)', '‒(none)'],
          ['Gen.', '‒ος', ''],
          ['Dat.', '‒ι', ''],
          ['Acc.', '‒α  or  ‒ν', ''],
          ['Plural', '', ''],
          ['Nom.', '‒ες', '‒α'],
          ['Gen.', '‒ων', ''],
          ['Dat.', '‒σι', ''],
          ['Acc.', '‒ας', ''],
        ]}
        note="Empty neuter cells share the Masc/Fem ending."
      />
    ),
  },

  /* ── MIN 3: Present & Imperfect Endings ───── */
  {
    id: 3,
    label: 'Ess. 3',
    title: 'Present & Imperfect Tense Endings',
    content: (
      <>
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-semibold text-center">
          <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1">
            Secondary · Past Tenses (+ ε augment)
          </div>
          <div className="rounded-md bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1">
            Primary · Non-past Tenses
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MorphTable
            title="Imperfect Endings"
            headers={['', '', 'Active', 'Mid/Pass']}
            rows={[
              ['SG', '1', '‒ον', '‒ομην'],
              ['', '2', '‒ες', '‒ου'],
              ['', '3', '‒ε(ν)', '‒ετο'],
              ['PL', '1', '‒ομεν', '‒ομεθα'],
              ['', '2', '‒ετε', '‒εσθε'],
              ['', '3', '‒ον', '‒οντο'],
            ]}
          />
          <MorphTable
            title="Present Endings"
            headers={['', '', 'Active', 'Mid/Pass']}
            rows={[
              ['SG', '1', '‒ω', '‒ομαι'],
              ['', '2', '‒εις', '‒ῃ (σαι)'],
              ['', '3', '‒ει', '‒εται'],
              ['PL', '1', '‒ομεν', '‒ομεθα'],
              ['', '2', '‒ετε', '‒εσθε'],
              ['', '3', '‒ουσι(ν)', '‒ονται'],
            ]}
          />
        </div>
      </>
    ),
  },

  /* ── MIN 4: Tense Identifiers ──────────────── */
  {
    id: 4,
    label: 'Ess. 4',
    title: 'Tense Identifiers',
    content: (
      <MorphTable
        headers={['Identifier', 'Tense']}
        rows={[
          ['‒σ', 'Future (active and middle)'],
          ['‒θησ', 'Future (passive)'],
          ['‒σα', '1 Aorist (active and middle)'],
          ['‒θη / ‒θε / ‒θ', '1 Aorist (passive)'],
          ['‒κα / ‒κ', 'Perfect (active)'],
          ['‒(none)', 'Perfect (middle / passive)'],
        ]}
        note="Reduced forms (σ, θ, κ) appear when the identifier directly precedes certain endings."
      />
    ),
  },

  /* ── MIN 5: Applying Tense Identifiers ──────── */
  {
    id: 5,
    label: 'Ess. 5',
    title: 'Applying Tense Identifiers',
    content: (
      <>
        <p className="text-xs text-gray-500 mb-3">
          All other tenses use the Present or Imperfect endings as a base. The tense identifier
          modifies the connecting vowel as follows:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MorphTable
            title="Secondary (Past) — use Imperfect endings"
            headers={['Tense', 'Modification']}
            rows={[
              ['Aorist active', 'replace c.v. with σα'],
              ['Aorist middle', 'replace c.v. with σα'],
              ['Aorist passive', 'replace c.v. with θη'],
              ['Perfect active', 'replace c.v. with κα'],
            ]}
          />
          <MorphTable
            title="Primary (Non-past) — use Present endings"
            headers={['Tense', 'Modification']}
            rows={[
              ['Future active', 'insert σ before c.v.'],
              ['Future middle', 'insert σ before c.v.'],
              ['Future passive', 'insert θησ before c.v.'],
              ['Perf. mid/pass', 'delete connecting vowel'],
            ]}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">c.v. = connecting vowel</p>
      </>
    ),
  },

  /* ── MIN 6: Participles ───────────────────── */
  {
    id: 6,
    label: 'Ess. 6',
    title: 'Participle Endings',
    content: (
      <>
        <MorphTable
          title="6-A  ·  Present Participle of εἰμί  (ὤν, οὔσα, ὄν)"
          headers={['', 'Masculine', 'Neuter', 'Feminine']}
          dividerRows={[0, 5]}
          rows={[
            ['Singular', '', '', ''],
            ['Nom.', 'ὤν', 'ὄν', 'οὔσα'],
            ['Gen.', 'ὄντος', '', 'οὔσης'],
            ['Dat.', 'ὄντι', '', 'οὔσῃ'],
            ['Acc.', 'ὄντα', '', 'οὖσαν'],
            ['Plural', '', '', ''],
            ['Nom.', 'ὄντες', 'ὄντα', 'οὖσαι'],
            ['Gen.', 'ὄντων', '', 'οὐσῶν'],
            ['Dat.', 'ὄντσι', '', 'οὔσαις'],
            ['Acc.', 'ὄντας', '', 'οὔσας'],
          ]}
          note="Empty neuter cells share the masculine ending."
        />
        <MorphTable
          title="6-B  ·  Middle / Passive Participle Endings  (‒μεν‒)"
          headers={['', 'Masculine', 'Neuter', 'Feminine']}
          dividerRows={[0, 5]}
          rows={[
            ['Singular', '', '', ''],
            ['Nom.', '‒μενος', '‒μενον', '‒μενη'],
            ['Gen.', '‒μενου', '', '‒μενης'],
            ['Dat.', '‒μενῳ', '', '‒μενῃ'],
            ['Acc.', '‒μενον', '', '‒μενην'],
            ['Plural', '', '', ''],
            ['Nom.', '‒μενοι', '‒μενα', '‒μεναι'],
            ['Gen.', '‒μενων', '', '‒μενων'],
            ['Dat.', '‒μενοις', '', '‒μεναις'],
            ['Acc.', '‒μενους', '', '‒μενας'],
          ]}
          note="Empty neuter cells share the masculine ending."
        />
      </>
    ),
  },

  /* ── MIN 7: Subjunctive & Imperative ─────── */
  {
    id: 7,
    label: 'Ess. 7',
    title: 'Subjunctive & Imperative',
    content: (
      <>
        <MorphTable
          title="7-A  ·  Subjunctive of εἰμί"
          headers={['', 'Pers.', 'Form']}
          rows={[
            ['SG', '1', 'ὦ'],
            ['', '2', 'ᾖς'],
            ['', '3', 'ᾖ'],
            ['PL', '1', 'ὦμεν'],
            ['', '2', 'ἦτε'],
            ['', '3', 'ὦσι(ν)'],
          ]}
        />

        <div className="mb-3 rounded-md bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs text-indigo-800">
          <span className="font-semibold">Key endings to memorize — </span>
          3rd Singular: <span className="font-semibold">‒τω</span>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          3rd Plural: <span className="font-semibold">‒τωσαν</span>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          7-B  ·  Imperative Paradigms  (λύω)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MorphTable
            title="Present Active"
            headers={['', 'Pers.', 'Form']}
            rows={[
              ['SG', '2', 'λῦε'],
              ['', '3', 'λυέτω'],
              ['PL', '2', 'λύετε'],
              ['', '3', 'λυέτωσαν'],
            ]}
          />
          <MorphTable
            title="Aorist Active"
            headers={['', 'Pers.', 'Form']}
            rows={[
              ['SG', '2', 'λύσον'],
              ['', '3', 'λυσάτω'],
              ['PL', '2', 'λύσατε'],
              ['', '3', 'λυσάτωσαν'],
            ]}
          />
          <MorphTable
            title="Aorist Passive"
            headers={['', 'Pers.', 'Form']}
            rows={[
              ['SG', '2', 'λύθητι'],
              ['', '3', 'λυθήτω'],
              ['PL', '2', 'λύθητε'],
              ['', '3', 'λυθήτωσαν'],
            ]}
          />
          <MorphTable
            title="Present Middle / Passive"
            headers={['', 'Pers.', 'Form']}
            rows={[
              ['SG', '2', 'λύου'],
              ['', '3', 'λυέσθω'],
              ['PL', '2', 'λύεσθε'],
              ['', '3', 'λυέσθωσαν'],
            ]}
          />
          <MorphTable
            title="Aorist Middle"
            headers={['', 'Pers.', 'Form']}
            rows={[
              ['SG', '2', 'λύσαι'],
              ['', '3', 'λυσάσθω'],
              ['PL', '2', 'λύσασθε'],
              ['', '3', 'λυσάσθωσαν'],
            ]}
          />
        </div>
      </>
    ),
  },

  /* ── MIN 8: ‒μι Verbs ──────────────────────── */
  {
    id: 8,
    label: 'Ess. 8',
    title: '‒μι Verbs',
    content: (
      <>
        <div className="space-y-3 mb-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1">1. Stem vowel alternates (short / long)</p>
            <p className="text-gray-500 text-xs mb-2">
              The stem vowel may appear in either its short or long form depending on the form.
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <span className="text-gray-500">Short / Long</span>
              <span className="text-gray-500">Verb</span>
              <span className="font-medium">δο / δω</span>
              <span>δίδωμι</span>
              <span className="font-medium">θε / θη</span>
              <span>τίθημι</span>
              <span className="font-medium">στα / στη</span>
              <span>ἵστημι</span>
              <span className="font-medium">ε / η</span>
              <span>ἀφίημι</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1">
              2. Iota reduplication
            </p>
            <p className="text-xs text-gray-500">
              Occurs <span className="font-semibold text-gray-700">only</span> in the present and
              imperfect tenses. The initial consonant is reduplicated with an iota (e.g., δι‒δω‒μι,
              τι‒θη‒μι, ἵ‒στη‒μι).
            </p>
          </div>
        </div>
      </>
    ),
  },
]

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */

export function MorphologyView() {
  const [activeId, setActiveId] = useState(1)

  const active = sections.find(s => s.id === activeId)!

  return (
    <div className="flex flex-col min-h-0">
      {/* Page heading */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Essential Endings</h1>
      </div>

      {/* Section selector */}
      <div className="flex gap-1.5 flex-wrap px-4 py-3 border-b border-gray-100 bg-white">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={clsx(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              activeId === s.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{active.title}</h2>
        {active.content}
      </div>
    </div>
  )
}
