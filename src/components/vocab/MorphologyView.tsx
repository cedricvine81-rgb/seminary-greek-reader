'use client'

import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { Menu } from 'lucide-react'

/* ─────────────────────────────────────────────
   Reusable helpers
───────────────────────────────────────────── */

interface MorphTableProps {
  title?: React.ReactNode
  headers: string[]
  rows: (string | null | undefined)[][]
  dividerRows?: number[]
  note?: string
  firstColIsData?: boolean
  highlight?: string
  highlightCols?: number[]
}

function MorphTable({ title, headers, rows, dividerRows = [], note, firstColIsData = false, highlight, highlightCols }: MorphTableProps) {
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
                <th key={i} className={clsx('px-3 py-2 font-semibold text-gray-700 text-sm whitespace-nowrap', i === 0 ? 'text-left' : 'text-center')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isDivider = divSet.has(ri)
              return (
                <tr key={ri} className={clsx(isDivider ? 'bg-gray-50 border-t border-gray-200' : 'bg-surface', !isDivider && ri > 0 && 'border-t border-gray-100')}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={clsx('px-3 py-2', isDivider ? 'text-xs font-semibold text-gray-500 uppercase tracking-wide' : (ci === 0 && !firstColIsData) ? 'text-left text-sm font-medium text-gray-500 whitespace-nowrap' : (firstColIsData && ci > 0) ? ['text-left text-sm', (highlight && (!highlightCols || highlightCols.includes(ci))) ? highlight : 'text-gray-900'] : ['text-center text-sm', (highlight && (!highlightCols || highlightCols.includes(ci))) ? highlight : 'text-gray-900'])}>
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

function InfoBox({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
      {title && <p className="font-semibold text-gray-800 mb-1.5">{title}</p>}
      {children}
    </div>
  )
}

/**
 * A simple left-aligned multi-column table for parallel lists (e.g. adverbs by
 * How/When/Where, semantic labels). Unlike MorphTable, every cell is plain
 * left-aligned data and cells may be React nodes (for sub-headings).
 */
function ColsTable({ title, headers, rows, note }: {
  title?: React.ReactNode
  headers: string[]
  rows: React.ReactNode[][]
  note?: string
}) {
  return (
    <div className="mb-5">
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{title}</p>
      )}
      <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-semibold text-gray-700 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={clsx('bg-surface align-top', ri > 0 && 'border-t border-gray-100')}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-left text-gray-900">{cell ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

/**
 * Wrap runs of Greek characters in a normal-case span so the section-title
 * CSS `uppercase` transform does not capitalise Greek text.
 * Covers Basic Greek (U+0370–U+03FF) and Greek Extended (U+1F00–U+1FFF).
 */
function gt(text: string): React.ReactNode {
  const re = /[Ͱ-Ͽἀ-῿]+/g
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<span key={m.index} className="normal-case">{m[0]}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length <= 1 && typeof parts[0] === 'string' ? parts[0] ?? text : <>{parts}</>
}

/* ─────────────────────────────────────────────
   Top-level tab definitions
───────────────────────────────────────────── */

type MainTab = 'essentials' | 'nouns' | 'pronouns' | 'prepositions' | 'conjunctions' | 'conj-adv' |
               'indicatives' | 'infinitives' | 'imperatives' | 'participles' | 'subjunctives' | 'mi-verbs' |
               '2nd-aorists' | 'deponents'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'essentials',   label: 'Essentials'      },
  { id: 'nouns',        label: 'Nouns/Adj.'      },
  { id: 'pronouns',     label: 'Pronouns'        },
  { id: 'prepositions', label: 'Prepositions'    },
  { id: 'conjunctions', label: 'Conditionals'    },
  { id: 'conj-adv',     label: 'Conj. & Adv.'    },
  { id: 'indicatives',  label: 'Indicatives'     },
  { id: 'infinitives',  label: 'Infinitives'     },
  { id: 'imperatives',  label: 'Imperatives'     },
  { id: 'participles',  label: 'Participles'     },
  { id: 'subjunctives', label: 'Subjunctives'    },
  { id: 'mi-verbs',     label: 'μι-Verbs'        },
  { id: '2nd-aorists',  label: '2nd Aorists'     },
  { id: 'deponents',    label: 'Deponents'       },
]

/* ─────────────────────────────────────────────
   Essential sections (Ess. 1–8)
───────────────────────────────────────────── */

interface EssSection { id: number; label: string; title: string; content: React.ReactNode }

const ESS_SECTIONS: EssSection[] = [
  {
    id: 1, label: 'Ess. 1', title: '1st & 2nd Declension Endings',
    content: (
      <MorphTable headers={['', 'Masculine', 'Neuter', 'Feminine']} dividerRows={[0, 5]} highlight="text-red-600"
        rows={[
          ['Singular','','',''],
          ['Nom.','‒ος','‒ον','‒η'],['Gen.','‒ου →','‒ου','‒ης'],
          ['Dat.','‒ῳ →','‒ῳ','‒ῃ'],['Acc.','‒ον','= Nom.','‒ην'],
          ['Plural','','',''],
          ['Nom.','‒οι','‒α','‒αι'],['Gen.','‒ων →','‒ων','‒ων'],
          ['Dat.','‒οις →','‒οις','‒αις'],['Acc.','‒ους','= Nom.','‒ας'],
        ]}
        note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
      />
    ),
  },
  {
    id: 2, label: 'Ess. 2', title: '3rd Declension Endings',
    content: (
      <MorphTable headers={['', 'Masc / Fem', 'Neuter']} dividerRows={[0, 5]} highlight="text-red-600"
        rows={[
          ['Singular','',''],
          ['Nom.','‒ς  or  ‒(none)','‒(none)'],['Gen.','‒ος →','‒ος'],
          ['Dat.','‒ι →','‒ι'],['Acc.','‒α  or  ‒ν','= Nom.'],
          ['Plural','',''],
          ['Nom.','‒ες','‒α'],['Gen.','‒ων →','‒ων'],
          ['Dat.','‒σι →','‒σι'],['Acc.','‒ας','= Nom.'],
        ]}
        note="→ neuter takes the same ending as Masc/Fem  ·  Neuter Acc. = Neuter Nom."
      />
    ),
  },
  {
    id: 3, label: 'Ess. 3', title: 'Present & Imperfect Tense Endings',
    content: (
      <>
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-semibold text-center">
          <div className="rounded-md bg-gray-200 border border-gray-300 text-gray-700 px-2 py-1">Secondary · Past Tenses (+ ε augment)</div>
          <div className="rounded-md bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1">Primary · Non-past Tenses</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable title="Imperfect Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ον','‒ομην'],['','2','‒ες','‒ου'],['','3','‒ε(ν)','‒ετο'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ον','‒οντο']]}
          />
          <MorphTable title="Present Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ω','‒ομαι'],['','2','‒εις','‒ῃ (σαι)'],['','3','‒ει','‒εται'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ουσι(ν)','‒ονται']]}
          />
        </div>
      </>
    ),
  },
  {
    id: 4, label: 'Ess. 4', title: 'Tense Identifiers',
    content: (
      <MorphTable headers={['Identifier', 'Tense']} firstColIsData highlight="text-red-600" highlightCols={[0]}
        rows={[
          ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
          ['‒σα','1 Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1 Aorist (passive)'],
          ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle / passive)'],
        ]}
        note="Reduced forms (σ, θ, κ) appear when the identifier directly precedes certain endings."
      />
    ),
  },
  {
    id: 5, label: 'Ess. 5', title: 'Applying Tense Identifiers',
    content: (
      <>
        <p className="text-xs text-gray-500 mb-3">All other tenses use the Present or Imperfect endings as a base. The tense identifier modifies the connecting vowel as follows:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable title="Secondary (Past) — use Imperfect endings" headers={['Tense','Modification']}
            rows={[['Aorist active','replace c.v. with σα'],['Aorist middle','replace c.v. with σα'],
                   ['Aorist passive','replace c.v. with θη'],['Perfect active','replace c.v. with κα']]}
          />
          <MorphTable title="Primary (Non-past) — use Present endings" headers={['Tense','Modification']}
            rows={[['Future active','insert σ before c.v.'],['Future middle','insert σ before c.v.'],
                   ['Future passive','insert θησ before c.v.'],['Perf. mid/pass','delete connecting vowel']]}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">c.v. = connecting vowel</p>
      </>
    ),
  },
  {
    id: 6, label: 'Ess. 6', title: 'Participle Endings',
    content: (
      <>
        <MorphTable title={gt("6-A  ·  Present Participle of εἰμί  (ὤν, οὔσα, ὄν)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
          rows={[['Singular','','',''],['Nom.','ὤν','ὄν','οὔσα'],['Gen.','ὄντος →','ὄντος','οὔσης'],
                 ['Dat.','ὄντι →','ὄντι','οὔσῃ'],['Acc.','ὄντα','ὄν','οὖσαν'],['Plural','','',''],
                 ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων →','ὄντων','οὐσῶν'],
                 ['Dat.','οὖσι →','οὖσι','οὔσαις'],['Acc.','ὄντας','ὄντα','οὔσας']]}
          note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
        />
        <MorphTable title={gt("6-B  ·  Middle / Passive Participle Endings  (‒μεν‒)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
          rows={[['Singular','','',''],['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου →','‒μενου','‒μενης'],
                 ['Dat.','‒μενῳ →','‒μενῳ','‒μενῃ'],['Acc.','‒μενον','= Nom.','‒μενην'],['Plural','','',''],
                 ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων →','‒μενων','‒μενων'],
                 ['Dat.','‒μενοις →','‒μενοις','‒μεναις'],['Acc.','‒μενους','= Nom.','‒μενας']]}
          note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
        />
      </>
    ),
  },
  {
    id: 7, label: 'Ess. 7', title: 'Subjunctive & Imperative',
    content: (
      <>
        <MorphTable title={<>7-A  ·  Subjunctive of <span className="normal-case">εἰμί</span></>} headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
          rows={[['SG','1','ὦ'],['','2','ᾖς'],['','3','ᾖ'],
                 ['PL','1','ὦμεν'],['','2','ἦτε'],['','3','ὦσι(ν)']]}
        />
        <div className="mb-3 rounded-md bg-gray-100 border border-gray-200 px-3 py-2 text-xs text-gray-700">
          <span className="font-semibold">Key endings to memorize — </span>
          3rd Singular: <span className="font-semibold">‒τω</span>&nbsp;&nbsp;|&nbsp;&nbsp;3rd Plural: <span className="font-semibold">‒τωσαν</span>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{gt("7-B  ·  Imperative Paradigms  (λύω)")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable title="Present Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λῦε'],['','3','λυέτω'],['PL','2','λύετε'],['','3','λυέτωσαν']]}
          />
          <MorphTable title="Aorist Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσον'],['','3','λυσάτω'],['PL','2','λύσατε'],['','3','λυσάτωσαν']]}
          />
          <MorphTable title="Aorist Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύθητι'],['','3','λυθήτω'],['PL','2','λύθητε'],['','3','λυθήτωσαν']]}
          />
          <MorphTable title="Present Middle / Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύου'],['','3','λυέσθω'],['PL','2','λύεσθε'],['','3','λυέσθωσαν']]}
          />
          <MorphTable title="Aorist Middle" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσαι'],['','3','λυσάσθω'],['PL','2','λύσασθε'],['','3','λυσάσθωσαν']]}
          />
        </div>
      </>
    ),
  },
  {
    id: 8, label: 'Ess. 8', title: '‒μι Verbs',
    content: (
      <div className="space-y-3 mb-5">
        <InfoBox title="1. Stem vowel alternates (short / long)">
          <p className="text-gray-500 text-xs mb-2">The stem vowel may appear in either its short or long form depending on the form.</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
            <span className="text-gray-500">Short / Long</span><span className="text-gray-500">Verb</span>
            <span className="font-medium">δο / δω</span><span>δίδωμι</span>
            <span className="font-medium">θε / θη</span><span>τίθημι</span>
            <span className="font-medium">στα / στη</span><span>ἵστημι</span>
            <span className="font-medium">ε / η</span><span>ἀφίημι</span>
          </div>
        </InfoBox>
        <InfoBox title="2. Iota reduplication">
          <p className="text-xs text-gray-500">Occurs <span className="font-semibold text-gray-700">only</span> in the present and imperfect tenses. The initial consonant is reduplicated with an iota (e.g., δι‒δω‒μι, τι‒θη‒μι, ἵ‒στη‒μι).</p>
        </InfoBox>
        <InfoBox title="3. All other tenses follow ω conjugation">
          <p className="text-xs text-gray-500">All other tenses (future, perfect, etc.) do <span className="font-semibold text-gray-700">not</span> have iota reduplication and follow the regular ω conjugation (like λύω).</p>
        </InfoBox>
        <InfoBox title="4. Aorist tense identifier is ‒κα">
          <p className="text-xs text-gray-500">The aorist tense identifier for ‒μι verbs is <span className="font-semibold text-gray-700">‒κα</span> instead of the usual ‒σα (e.g., ἔδωκα, ἔθηκα, ἔστησα).</p>
        </InfoBox>
      </div>
    ),
  },
]

/* ─────────────────────────────────────────────
   Revision section content
───────────────────────────────────────────── */

const NOUNS_CONTENT = (
  <>
    <MorphTable title="1st & 2nd Declension Endings" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','‒ος','‒ον','‒η'],['Gen.','‒ου →','‒ου','‒ης'],
        ['Dat.','‒ῳ →','‒ῳ','‒ῃ'],['Acc.','‒ον','= Nom.','‒ην'],
        ['Plural','','',''],
        ['Nom.','‒οι','‒α','‒αι'],['Gen.','‒ων →','‒ων','‒ων'],
        ['Dat.','‒οις →','‒οις','‒αις'],['Acc.','‒ους','= Nom.','‒ας'],
      ]}
      note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
    />
    <MorphTable title="Article & Noun Paradigm" headers={['','','Art.','Noun','Art.','Noun','Art.','Noun']}
      rows={[
        ['','','Masc.','λόγος','Fem.','ἀρχή','Neut.','ἔργον'],
        ['Sg.','Nom.','ὁ','λόγος','ἡ','ἀρχή','τό','ἔργον'],
        ['','Gen.','τοῦ','λόγου','τῆς','ἀρχῆς','τοῦ','ἔργου'],
        ['','Dat.','τῷ','λόγῳ','τῇ','ἀρχῇ','τῷ','ἔργῳ'],
        ['','Acc.','τόν','λόγον','τήν','ἀρχήν','τό','ἔργον'],
        ['Pl.','Nom.','οἱ','λόγοι','αἱ','ἀρχαί','τά','ἔργα'],
        ['','Gen.','τῶν','λόγων','τῶν','ἀρχῶν','τῶν','ἔργων'],
        ['','Dat.','τοῖς','λόγοις','ταῖς','ἀρχαῖς','τοῖς','ἔργοις'],
        ['','Acc.','τούς','λόγους','τάς','ἀρχάς','τά','ἔργα'],
      ]}
    />
    <MorphTable title="3rd Declension Endings" headers={['','Masc./Fem.','Neuter']} dividerRows={[0,5]}
      rows={[
        ['Singular','',''],
        ['Nom.','‒ς  or  ‒(none)','‒(none)'],['Gen.','‒ος →','‒ος'],
        ['Dat.','‒ι →','‒ι'],['Acc.','‒α  or  ‒ν','= Nom.'],
        ['Plural','',''],
        ['Nom.','‒ες','‒α'],['Gen.','‒ων →','‒ων'],['Dat.','‒σι →','‒σι'],['Acc.','‒ας','= Nom.'],
      ]}
      note="→ neuter takes the same ending as Masc./Fem.  ·  Neuter Acc. = Neuter Nom."
    />
    <MorphTable title={gt("πᾶς, πᾶσα, πᾶν  (all, every)")} headers={['','','Masc. (3rd)','Fem. (1st)','Neut. (3rd)']}
      rows={[
        ['Sg.','Nom.','πᾶς','πᾶσα','πᾶν'],['','Gen.','παντός','πάσης','παντός'],
        ['','Dat.','παντί','πάσῃ','παντί'],['','Acc.','πάντα','πᾶσαν','πᾶν'],
        ['Pl.','Nom.','πάντες','πᾶσαι','πάντα'],['','Gen.','πάντων','πασῶν','πάντων'],
        ['','Dat.','πᾶσιν','πάσαις','πᾶσιν'],['','Acc.','πάντας','πάσας','πάντα'],
      ]}
    />
  </>
)

const PRONOUNS_CONTENT = (
  <>
    <MorphTable title={gt("3rd Person Pronoun — αὐτός (he, she, it)")} headers={['','','Masc.','Eng.','Fem.','Eng.','Neut.','Eng.']}
      rows={[
        ['Sg.','Nom.','αὐτός','he','αὐτή','she','αὐτό','it'],
        ['','Gen.','αὐτοῦ','his','αὐτῆς','her','αὐτοῦ','its'],
        ['','Dat.','αὐτῷ','to him','αὐτῇ','to her','αὐτῷ','to it'],
        ['','Acc.','αὐτόν','him','αὐτήν','her','αὐτό','it'],
        ['Pl.','Nom.','αὐτοί','they','αὐταί','they','αὐτά','they'],
        ['','Gen.','αὐτῶν','their','αὐτῶν','their','αὐτῶν','their'],
        ['','Dat.','αὐτοῖς','to them','αὐταῖς','to them','αὐτοῖς','to them'],
        ['','Acc.','αὐτούς','them','αὐτάς','them','αὐτά','them'],
      ]}
    />
    <MorphTable title="1st & 2nd Person Pronouns" headers={['Case','1st Sg.','Eng.','1st Pl.','Eng.','2nd Sg.','Eng.','2nd Pl.']}
      rows={[
        ['Nom.','ἐγώ','I','ἡμεῖς','we','σύ','you','ὑμεῖς'],
        ['Gen.','ἐμοῦ / μου','of me','ἡμῶν','of us','σοῦ','of you','ὑμῶν'],
        ['Dat.','ἐμοί / μοι','to/for me','ἡμῖν','to/for us','σοί','to/for you','ὑμῖν'],
        ['Acc.','ἐμέ / με','me','ἡμᾶς','us','σέ','you','ὑμᾶς'],
      ]}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MorphTable title={gt("οὐδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
        rows={[
          ['Nom.','οὐδείς','οὐδεμία','οὐδέν'],
          ['Gen.','οὐδενός','οὐδεμιᾶς','οὐδενός'],
          ['Dat.','οὐδενί','οὐδεμιᾷ','οὐδενί'],
          ['Acc.','οὐδένα','οὐδεμίαν','οὐδέν'],
        ]}
        note="Used with indicative mood."
      />
      <MorphTable title={gt("μηδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
        rows={[
          ['Nom.','μηδείς','μηδεμία','μηδέν'],
          ['Gen.','μηδενός','μηδεμιᾶς','μηδενός'],
          ['Dat.','μηδενί','μηδεμιᾷ','μηδενί'],
          ['Acc.','μηδένα','μηδεμίαν','μηδέν'],
        ]}
        note="Used with non-indicative moods."
      />
    </div>
    <MorphTable title={gt("τις — Indefinite Pronoun (someone, anyone)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
      rows={[
        ['Sg. Nom.','τις','someone','τι','something'],
        ['Gen.','τινος','of someone','τινος','of something'],
        ['Dat.','τινι','to someone','τινι','to something'],
        ['Acc.','τινα','someone','τι','something'],
        ['Pl. Nom.','τινες','some (people)','τινα','some things'],
        ['Gen.','τινων','of some','τινων','of some things'],
        ['Dat.','τισι','to some','τισι','to some things'],
        ['Acc.','τινας','some (people)','τινα','some things'],
      ]}
      note="Enclitic — no accent on first syllable."
    />
    <MorphTable title={gt("τίς — Interrogative Pronoun (who? what?)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
      rows={[
        ['Sg. Nom.','τίς','who?','τί','which? what? why?'],
        ['Gen.','τίνος','whose?','τίνος','of which? what?'],
        ['Dat.','τίνι','to whom?','τίνι','to which?'],
        ['Acc.','τίνα','whom?','τί','which? what?'],
        ['Pl. Nom.','τίνες','who?','τίνα','which? what?'],
        ['Gen.','τίνων','whose?','τίνων','of which? what?'],
        ['Dat.','τίσι','to whom?','τίσι','to which?'],
        ['Acc.','τίνας','who?','τίνα','which? what?'],
      ]}
      note="Always accented — distinguished from τις by accent."
    />
  </>
)

const PREPOSITIONS_CONTENT = (
  <>
    <MorphTable title="One-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
      rows={[
        ['ἀντί',    '+ genitive',   'instead of, in place of'],
        ['ἀπό',     '+ genitive',   'from, away from'],
        ['ἐκ / ἐξ', '+ genitive',   'out of, from'],
        ['εἰς',     '+ accusative', 'into, to'],
        ['πρός',    '+ accusative', 'to, toward'],
        ['ἐν',      '+ dative',     'in, among'],
        ['σύν',     '+ dative',     'with'],
      ]}
    />
    <MorphTable title="Two-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
      rows={[
        ['διά',  '+ genitive',  'through'],
        ['',     '+ accusative','because of'],
        ['κατά', '+ genitive',  'against, down from'],
        ['',     '+ accusative','according to, along'],
        ['μετά', '+ genitive',  'with'],
        ['',     '+ accusative','after'],
        ['ὑπό',  '+ genitive',  'by (agent)'],
        ['',     '+ accusative','under'],
      ]}
    />
    <MorphTable title="Three-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
      rows={[
        ['ἐπί',  '+ genitive',  'on, over'],
        ['',     '+ dative',    'on, at'],
        ['',     '+ accusative','on, against'],
        ['παρά', '+ genitive',  'from beside'],
        ['',     '+ dative',    'beside, with'],
        ['',     '+ accusative','alongside'],
        ['περί', '+ genitive',  'about, concerning'],
        ['',     '+ dative',    'around, near'],
        ['',     '+ accusative','around'],
      ]}
    />
  </>
)

const CONJUNCTIONS_CONTENT = (
  <>
    <MorphTable title="Conditional Sentences" headers={['Class','Protasis','Apodosis']}
      rows={[
        ['First Class (Assumed True)','εἰ + Indicative','Any mood or tense'],
        ['Second Class (Contrary to Fact)','εἰ + Indicative','ἄν + Indicative'],
        ['Third Class (Probable / Future)','ἐάν + Subjunctive','Any mood or tense'],
      ]}
    />
  </>
)

const INDICATIVES_CONTENT = (
  <>
    <MorphTable title={gt("Present Tense — λύω (I loose, I am loosing)")} headers={['Person','Greek','Translation']}
      rows={[
        ['1st sg.','λύω','I am untying / I untie'],
        ['2nd sg.','λύεις','You are untying / you untie'],
        ['3rd sg.','λύει','He/she/it is untying'],
        ['1st pl.','λύομεν','We are untying / we untie'],
        ['2nd pl.','λύετε','You are untying / you untie'],
        ['3rd pl.','λύουσι(ν)','They are untying / they untie'],
      ]}
    />
    <MorphTable title={gt("Present & Imperfect Full Paradigm — λύω")} headers={['','','Imp. Active','Imp. Mid/Pass','Pres. Active','Pres. Mid/Pass']}
      rows={[
        ['SG','1','ἔλυον','ἐλυόμην','λύω','λύομαι'],
        ['','2','ἔλυες','ἐλύου','λύεις','λύῃ (σαι)'],
        ['','3','ἔλυε(ν)','ἐλύετο','λύει','λύεται'],
        ['PL','1','ἐλύομεν','ἐλυόμεθα','λύομεν','λυόμεθα'],
        ['','2','ἐλύετε','ἐλύεσθε','λύετε','λύεσθε'],
        ['','3','ἔλυον','ἐλύοντο','λύουσι(ν)','λύονται'],
      ]}
    />
    <MorphTable title={gt("εἰμί — Present, Future & Imperfect Indicative")} headers={['Person','Present','Future','Imperfect']}
      rows={[
        ['I','εἰμί','ἔσομαι','ἦμην'],
        ['You (sg.)','εἶ','ἔσῃ','ἦς (or ἦσθα)'],
        ['He/she/it','ἐστί(ν)','ἔσται','ἦν'],
        ['We','ἐσμέν','ἐσόμεθα','ἦμεν (or ἦμεθα)'],
        ['You (pl.)','ἐστέ','ἔσεσθε','ἦτε'],
        ['They','εἰσί(ν)','ἔσονται','ἦσαν'],
      ]}
      note="Present Infinitive: εἶναι · Present Participle (Masc. Nom. Sg./Pl.): ὤν / ὄντες"
    />
    <MorphTable title={gt("Perfect & Pluperfect — λύω")} headers={['Tense','Voice','Form','Translation']}
      rows={[
        ['Perfect','Active','λέλυκα','I have loosed'],
        ['','Middle','λέλυμαι','I have loosed myself'],
        ['','Passive','λέλυμαι','I have been loosed'],
        ['Pluperfect','Active','ἐλελύκειν','I had loosed'],
        ['','Middle','ἐλελύμην','I had loosed myself'],
        ['','Passive','ἐλελύμην','I had been loosed'],
      ]}
    />
    <MorphTable title={gt("Full Tense & Voice Paradigm — λύω (1st sg.)")} headers={['Tense','Voice','Form','Translation']}
      rows={[
        ['Present','Active','λύω','I loose'],
        ['','Middle','λύομαι','I loose myself'],
        ['','Passive','λύομαι','I am being loosed'],
        ['Future','Active','λύσω','I will loose'],
        ['','Middle','λύσομαι','I will loose myself'],
        ['','Passive','λυθήσομαι','I will be loosed'],
        ['Imperfect','Active','ἔλυον','I was loosing'],
        ['','Middle','ἐλυόμην','I was loosing myself'],
        ['','Passive','ἐλυόμην','I was being loosed'],
        ['Aorist','Active','ἔλυσα','I loosed'],
        ['','Middle','ἐλυσάμην','I loosed myself'],
        ['','Passive','ἐλύθην','I was loosed'],
      ]}
    />
    <MorphTable title="Tense Identifiers" headers={['Identifier','Tense']}
      rows={[
        ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
        ['‒σα','1st Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1st Aorist (passive)'],
        ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle/passive)'],
      ]}
    />
    <MorphTable title="Applying Tense Identifiers to Endings" headers={['Tense','Modification to Base Endings']}
      rows={[
        ['Aorist active','Replace connecting vowel with σα  →  use Imperfect endings'],
        ['Aorist middle','Replace connecting vowel with σα  →  use Imperfect endings'],
        ['Aorist passive','Replace connecting vowel with θη  →  use Imperfect endings'],
        ['Perfect active','Replace connecting vowel with κα  →  use Imperfect endings'],
        ['Future active','Insert σ before connecting vowel  →  use Present endings'],
        ['Future middle','Insert σ before connecting vowel  →  use Present endings'],
        ['Future passive','Insert θησ before connecting vowel  →  use Present endings'],
        ['Perfect mid/pass','Delete connecting vowel  →  use Present endings'],
      ]}
    />
    <MorphTable title={gt("Consonant + σ Combinations")} headers={['Stem ends in','+ σ','Result']}
      rows={[
        ['π, β, φ','+ σ','ψ'],
        ['τ, δ, θ, ζ','+ σ','σ'],
        ['κ, γ, χ, σ','+ σ','ξ'],
      ]}
    />
    <MorphTable title={gt("Tense Stem Structure — λύ‒")} headers={['Tense','Active','Middle','Passive']}
      rows={[
        ['Present','λυ','λυ','λυ'],
        ['Future','λυ‒σ','λυ‒σ','λυ‒θησ'],
        ['Imperfect','ε‒λυ','ε‒λυ','ε‒λυ'],
        ['Aorist','ε‒λυ‒σ','ε‒λυ‒σ','ε‒λυ‒θ'],
      ]}
      note="ε = augment (past tenses); σ / θησ / θ = tense identifier"
    />
  </>
)

const INFINITIVES_CONTENT = (
  <>
    <MorphTable title={gt("Most Common Infinitive Forms — λύω")} headers={['','Present Active','Aorist Active']}
      rows={[['Infinitive','λύειν','λύσαι']]}
    />
    <InfoBox title="Notes">
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>The infinitive is translated as "to…"</li>
        <li>The Aorist infinitive has a σ suffix, but <em>no augment</em></li>
        <li>‒εω verbs follow normal rules: φιλεῖν, φιλῆσαι</li>
      </ul>
    </InfoBox>
  </>
)

const IMPERATIVES_CONTENT = (
  <>
    <MorphTable title={gt("Most Common Imperative Forms — λύω")} headers={['','Present Active','Aorist Active']}
      rows={[
        ['2nd Person Singular','λῦε','λύσον'],
        ['2nd Person Plural','λύετε','λύσατε'],
      ]}
    />
    <InfoBox title="Notes">
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>These are 2nd person imperatives</li>
        <li>Aorist imperatives do <em>not</em> have the augment</li>
        <li>Aorist has σ suffix, as in the Indicative</li>
        <li>2nd pl. Present Imperative is identical to 2nd pl. Present Indicative</li>
        <li>‒εω verbs follow normal rules</li>
      </ul>
    </InfoBox>
  </>
)

const PARTICIPLES_CONTENT = (
  <>
    <MorphTable title={gt("Present Participle of εἰμί (ὤν, οὖσα, ὄν)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','ὤν','ὄν','οὖσα'],['Gen.','ὄντος','ὄντος','οὔσης'],
        ['Dat.','ὄντι','ὄντι','οὔσῃ'],['Acc.','ὄντα','ὄν','οὖσαν'],
        ['Plural','','',''],
        ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων','ὄντων','οὐσῶν'],
        ['Dat.','οὖσι','οὖσι','οὔσαις'],['Acc.','ὄντας','ὄντα','οὔσας'],
      ]}
      note="Neuter Gen. & Dat. = Masculine  ·  Neuter Acc. = Neuter Nom."
    />
    <MorphTable title={gt("Present Active Participle — λύων, λύουσα, λύον")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','λύων','λύουσα','λύον'],['Gen.','λύοντος','λυούσης','λύοντος'],
        ['Dat.','λύοντι','λυούσῃ','λύοντι'],['Acc.','λύοντα','λύουσαν','λύον'],
        ['Plural','','',''],
        ['Nom.','λύοντες','λύουσαι','λύοντα'],['Gen.','λυόντων','λυουσῶν','λυόντων'],
        ['Dat.','λύουσιν','λυούσαις','λύουσιν'],['Acc.','λύοντας','λυούσας','λύοντα'],
      ]}
    />
    <MorphTable title={gt("Aorist Active Participle — λύσας, λύσασα, λύσαν")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','λύσας','λύσασα','λύσαν'],['Gen.','λύσαντος','λυσάσης','λύσαντος'],
        ['Dat.','λύσαντι','λυσάσῃ','λύσαντι'],['Acc.','λύσαντα','λύσασαν','λύσαν'],
        ['Plural','','',''],
        ['Nom.','λύσαντες','λύσασαι','λύσαντα'],['Gen.','λυσάντων','λυσασῶν','λυσάντων'],
        ['Dat.','λύσασιν','λυσάσαις','λύσασιν'],['Acc.','λύσαντας','λυσάσας','λύσαντα'],
      ]}
    />
    <MorphTable title={gt("Middle / Passive Participle Endings (‒μεν‒ + endings of ἀγαθός)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου','‒μενου','‒μενης'],
        ['Dat.','‒μενῳ','‒μενῳ','‒μενῃ'],['Acc.','‒μενον','= Nom.','‒μενην'],
        ['Plural','','',''],
        ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων','‒μενων','‒μενων'],
        ['Dat.','‒μενοις','‒μενοις','‒μεναις'],['Acc.','‒μενους','= Nom.','‒μενας'],
      ]}
      note="Neuter Gen. & Dat. = Masculine  ·  Neuter Acc. = Neuter Nom."
    />
    <MorphTable title={gt("Middle/Passive Participle — Tense Identifier + ‒μεν‒")} headers={['Tense','Identifier','Example (Masc. Nom. Sg.)']}
      rows={[
        ['Present m/p','‒ο‒μεν','λυόμενος'],
        ['Aorist middle','‒σα‒μεν','λυσάμενος'],
        ['Perfect m/p','(no c.v.)‒μεν','λελυμένος'],
      ]}
    />
    <InfoBox title="Parsing a Participle — Decision Process">
      <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
        <li>Has the stem been changed? No → regular; Yes → 2nd aorist (uses ‛o' present endings)</li>
        <li>What is the connecting vowel? ο/ου → present; α → aorist</li>
        <li>Is ‒μεν‒ present? No → active participle; Yes → middle/passive (or aorist middle)</li>
      </ol>
    </InfoBox>
  </>
)

const SUBJUNCTIVES_CONTENT = (
  <>
    <MorphTable title={gt("Present Subjunctive — λύω")} headers={['','Pers.','Active','Mid./Pass.']}
      rows={[
        ['SG','1','λύω','λύωμαι'],['','2','λύῃς','λύῃ'],['','3','λύῃ','λύηται'],
        ['PL','1','λύωμεν','λυώμεθα'],['','2','λύητε','λύησθε'],['','3','λύωσιν','λύωνται'],
      ]}
      note="I may (might) be loosing / I may be loosed"
    />
    <MorphTable title={gt("Aorist Subjunctive — λύω")} headers={['','Pers.','Active','Middle','Passive']}
      rows={[
        ['SG','1','λύσω','λύσωμαι','λυθῶ'],['','2','λύσῃς','λύσῃ','λυθῇς'],['','3','λύσῃ','λύσηται','λυθῇ'],
        ['PL','1','λύσωμεν','λυσώμεθα','λυθῶμεν'],['','2','λύσητε','λύσησθε','λυθῆτε'],['','3','λύσωσιν','λύσωνται','λυθῶσιν'],
      ]}
      note="I may (might) loose / I may be loosed"
    />
    <InfoBox title="Uses of the Subjunctive">
      <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
        <li><span className="font-medium">Indefinite clauses:</span> ἄν + subj — ὃς ἄν (whoever), ὅπου ἄν (wherever), ὅταν (whenever)</li>
        <li><span className="font-medium">Purpose clauses:</span> ἵνα / ὅπως + subj — "in order that…"</li>
        <li><span className="font-medium">Exhortations (Hortatory):</span> 1st pl. subj — "Let us…"</li>
        <li><span className="font-medium">Deliberation (Deliberative):</span> 1st pl. subj — "What should we…?"</li>
        <li><span className="font-medium">Prohibitions:</span> μή + aorist subj — "Do not…"</li>
        <li><span className="font-medium">Emphatic negation:</span> οὐ μή + aorist subj — "will definitely not…"</li>
      </ol>
    </InfoBox>
  </>
)

const MI_VERBS_CONTENT = (
  <>
    <MorphTable title={gt("‒μι Verb Stems")} headers={['-μι verb','Verb stem','Present stem']}
      rows={[
        ['δίδωμι','δο / δω','διδο / διδω'],
        ['τίθημι','θε / θη','τιθε / τιθη'],
        ['ἵστημι','στα / στη','ἱστα / ἱστη'],
      ]}
      note="The reduplicated present stem is lengthened in the singular (διδο → διδω, τιθε → τιθη, ἱστα → ἱστη)."
    />
    <MorphTable title="Present Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
      rows={[
        ['Sg.','1.','δίδωμι','τίθημι','ἵστημι'],
        ['','2.','δίδως','τίθης','ἵστης'],
        ['','3.','δίδωσι(ν)','τίθησι(ν)','ἵστησι(ν)'],
        ['Pl.','1.','δίδομεν','τίθεμεν','ἵσταμεν'],
        ['','2.','δίδοτε','τίθετε','ἵστατε'],
        ['','3.','διδόασι(ν)','τιθέασι(ν)','ἱστᾶσι(ν)'],
      ]}
    />
    <MorphTable title="Aorist Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
      rows={[
        ['Sg.','1.','ἔδωκα','ἔθηκα','ἔστησα'],
        ['','2.','ἔδωκας','ἔθηκας','ἔστησας'],
        ['','3.','ἔδωκε(ν)','ἔθηκε(ν)','ἔστησε(ν)'],
        ['Pl.','1.','ἐδώκαμεν','ἐθήκαμεν','ἐστήσαμεν'],
        ['','2.','ἐδώκατε','ἐθήκατε','ἐστήσατε'],
        ['','3.','ἔδωκαν','ἔθηκαν','ἔστησαν'],
      ]}
    />
    <InfoBox title="Key Features of ‒μι Verbs">
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>Stem vowel alternates short/long: δο/δω, θε/θη, στα/στη</li>
        <li>Iota reduplication occurs <em>only</em> in present and imperfect tenses</li>
        <li>Perfect, Aorist, and Future use the short verb stem</li>
        <li>Present and Imperfect use the reduplicated (longer) stem</li>
      </ul>
    </InfoBox>
  </>
)

/* ─────────────────────────────────────────────
   2nd Aorists
───────────────────────────────────────────── */

const SECOND_AORISTS_CONTENT = (
  <>
    <InfoBox title="What is a 2nd Aorist?">
      <p>A <strong>2nd aorist</strong> (also called a strong aorist) uses a <em>different stem</em> rather than the σα suffix of the 1st aorist.
        The endings are identical to the imperfect indicative, but the stem is changed.
        The 2nd aorist stem is typically shorter or different from the present stem (e.g., λαμβάνω → ἔλαβον).</p>
      <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
        <li>Active: uses imperfect active endings (‒ον, ‒ες, ‒ε, ‒ομεν, ‒ετε, ‒ον)</li>
        <li>Middle: uses imperfect middle/passive endings (‒ομην, ‒ου, ‒ετο…)</li>
        <li>Key identifier: no σα suffix; stem change; augment still present</li>
      </ul>
    </InfoBox>
    <MorphTable
      title="40 Most Common 2nd Aorist Verbs"
      headers={['Present', '2nd Aorist', 'Definition']}
      firstColIsData
      rows={[
        ['ἄγω', 'ἤγαγον', 'I lead, bring'],
        ['ἁμαρτάνω', 'ἥμαρτον', 'I sin, miss the mark'],
        ['ἀποθνῄσκω', 'ἀπέθανον', 'I die'],
        ['βάλλω', 'ἔβαλον', 'I throw, put'],
        ['γίνομαι', 'ἐγενόμην', 'I become, happen (mid.)'],
        ['γινώσκω', 'ἔγνων', 'I know'],
        ['ἔρχομαι', 'ἦλθον', 'I come, go'],
        ['εὑρίσκω', 'εὗρον', 'I find'],
        ['ἔχω', 'ἔσχον', 'I have, hold'],
        ['λαμβάνω', 'ἔλαβον', 'I take, receive'],
        ['λέγω', 'εἶπον', 'I say, speak'],
        ['ὁράω', 'εἶδον', 'I see'],
        ['πάσχω', 'ἔπαθον', 'I suffer, experience'],
        ['πίνω', 'ἔπιον', 'I drink'],
        ['πίπτω', 'ἔπεσον', 'I fall'],
        ['φεύγω', 'ἔφυγον', 'I flee'],
        ['ἀναβαίνω', 'ἀνέβην', 'I go up, ascend'],
        ['ἀποστέλλω', 'ἀπέστειλα / ἀπέστειλον', 'I send (away)'],
        ['ἄρχω', 'ἦρξα / ἦρξον', 'I rule; (mid.) begin'],
        ['εἰσέρχομαι', 'εἰσῆλθον', 'I enter'],
        ['ἐξέρχομαι', 'ἐξῆλθον', 'I go out'],
        ['καταβαίνω', 'κατέβην', 'I go down, descend'],
        ['κατέρχομαι', 'κατῆλθον', 'I come down'],
        ['κρίνω', 'ἔκρινα / ἔκρινον', 'I judge'],
        ['λείπω', 'ἔλιπον', 'I leave, abandon'],
        ['μανθάνω', 'ἔμαθον', 'I learn'],
        ['προσέρχομαι', 'προσῆλθον', 'I come/go to'],
        ['συνάγω', 'συνήγαγον', 'I gather together'],
        ['τίκτω', 'ἔτεκον', 'I give birth to'],
        ['τρέχω', 'ἔδραμον', 'I run'],
        ['ἀπέρχομαι', 'ἀπῆλθον', 'I go away, depart'],
        ['ἄρχομαι', 'ἠρξάμην', 'I begin (mid.)'],
        ['βαίνω', 'ἔβην', 'I go, walk'],
        ['εἶπον', '(see λέγω)', 'I said (suppletive aorist)'],
        ['κλέπτω', 'ἔκλεψα / ἔκλαπον', 'I steal'],
        ['λανθάνω', 'ἔλαθον', 'I escape notice'],
        ['ὄλλυμι', 'ὤλεσα / ὤλομην', 'I destroy; (mid.) perish'],
        ['πείθω', 'ἔπιθον', 'I persuade'],
        ['πέμπω', 'ἔπεμψα / ἔπεμπον', 'I send'],
        ['φέρω', 'ἤνεγκον', 'I carry, bear, bring'],
      ]}
      note="Some verbs have both 1st and 2nd aorist forms. Where both exist, the more common form is listed."
    />
    <InfoBox>
      <p className="font-semibold text-gray-800 mb-1">Parsing a 2nd Aorist</p>
      <p>Look for: (1) augment on the verb, (2) no σα/θη suffix, (3) a different stem from the present.
        Use imperfect endings to identify person and number. Compare the stem to the principal parts of the verb.</p>
    </InfoBox>
  </>
)

/* ─────────────────────────────────────────────
   Deponent Verbs
───────────────────────────────────────────── */

const DEPONENTS_CONTENT = (
  <>
    <InfoBox title="What is a Deponent Verb?">
      <p>A <strong>deponent verb</strong> has only middle or passive forms but carries an <em>active meaning</em>.
        There is no active voice form for these verbs. Deponents are identified by their lexical form ending in
        <strong> ‒ομαι</strong> (present middle/passive).</p>
      <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
        <li><strong>Middle deponents</strong>: future and aorist are middle voice (ἔρχομαι, ἤρχομην)</li>
        <li><strong>Passive deponents</strong>: aorist is passive in form (ἀποκρίνομαι, ἀπεκρίθην)</li>
        <li>Key indicator: present lexical form ends in ‒ομαι with active translation</li>
      </ul>
    </InfoBox>
    <MorphTable
      title="40 Most Common Deponent Verbs"
      headers={['Pres. (1st sg.)', 'Fut.', 'Aor.', 'Definition']}
      firstColIsData
      rows={[
        ['ἄρχομαι', 'ἄρξομαι', 'ἠρξάμην', 'I begin'],
        ['ἀποκρίνομαι', '—', 'ἀπεκρίθην', 'I answer'],
        ['γίνομαι', 'γενήσομαι', 'ἐγενόμην', 'I become, am, happen'],
        ['δέχομαι', 'δέξομαι', 'ἐδεξάμην', 'I receive, accept'],
        ['δύναμαι', 'δυνήσομαι', 'ἠδυνήθην', 'I am able, can'],
        ['ἔρχομαι', 'ἐλεύσομαι', 'ἦλθον', 'I come, go'],
        ['ἐργάζομαι', 'ἐργάσομαι', 'ἠργασάμην', 'I work, do, accomplish'],
        ['εὐαγγελίζομαι', '—', 'εὐηγγελισάμην', 'I proclaim good news'],
        ['εὔχομαι', 'εὔξομαι', 'ηὐξάμην', 'I pray, wish'],
        ['θαυμάζω', 'θαυμάσομαι', 'ἐθαύμασα', 'I marvel, wonder (semi-dep.)'],
        ['κάθομαι', 'καθήσομαι', '—', 'I sit'],
        ['λογίζομαι', 'λογίσομαι', 'ἐλογισάμην', 'I reckon, consider, count'],
        ['ὁράω / ὄψομαι', 'ὄψομαι', 'εἶδον', 'I see (fut./aor. suppl.)'],
        ['ὀνομάζομαι', '—', 'ὠνομάσθην', 'I am named, called'],
        ['παραγίνομαι', 'παραγενήσομαι', 'παρεγενόμην', 'I arrive, appear'],
        ['πορεύομαι', 'πορεύσομαι', 'ἐπορεύθην', 'I go, travel, journey'],
        ['προσεύχομαι', 'προσεύξομαι', 'προσηυξάμην', 'I pray'],
        ['προσέρχομαι', 'προσελεύσομαι', 'προσῆλθον', 'I come/go to, approach'],
        ['σπένδομαι', '—', 'ἐσπείσθην', 'I am poured out (as offering)'],
        ['συνέρχομαι', 'συνελεύσομαι', 'συνῆλθον', 'I come together, assemble'],
        ['ἀγωνίζομαι', 'ἀγωνίσομαι', 'ἠγωνισάμην', 'I compete, strive, fight'],
        ['ἀνακρίνομαι', '—', 'ἀνεκρίθην', 'I examine, judge'],
        ['ἀντιλέγομαι', '—', 'ἀντελέχθην', 'I contradict, oppose'],
        ['βούλομαι', 'βουλήσομαι', 'ἐβουλήθην', 'I wish, want, will'],
        ['γεύομαι', 'γεύσομαι', 'ἐγευσάμην', 'I taste, experience'],
        ['διαλογίζομαι', '—', 'διελογισάμην', 'I discuss, reason, debate'],
        ['ἐκπορεύομαι', 'ἐκπορεύσομαι', 'ἐξεπορεύθην', 'I go out, come out from'],
        ['ἐπιστρέφω / ‒ομαι', 'ἐπιστρέψω', 'ἐπεστράφην', 'I turn to, return'],
        ['θέλω / βούλομαι', 'θελήσω', 'ἠθέλησα', 'I will, wish, desire (semi-dep.)'],
        ['κατεργάζομαι', '—', 'κατειργασάμην', 'I accomplish, produce, bring about'],
        ['κομίζομαι', 'κομίσομαι', 'ἐκομισάμην', 'I receive, obtain'],
        ['μάχομαι', 'μαχέσομαι', 'ἐμαχεσάμην', 'I fight, quarrel'],
        ['μετανοέω / ‒ομαι', 'μετανοήσω', 'μετενόησα', 'I repent, change my mind'],
        ['μιμέομαι', 'μιμήσομαι', 'ἐμιμησάμην', 'I imitate, follow the example of'],
        ['ὀδύρομαι', '—', 'ὠδυράμην', 'I grieve, lament, mourn'],
        ['παρακαλέομαι', '—', 'παρεκλήθην', 'I comfort, encourage (pass. dep.)'],
        ['παρατίθεμαι', '—', 'παρεθέμην', 'I set before, entrust (mid.)'],
        ['σώζομαι / σώζω', 'σωθήσομαι', 'ἐσώθην', 'I am saved (pass. used as dep.)'],
        ['ὑπάρχω / ‒ομαι', '—', '—', 'I exist, am (by nature)'],
        ['φοβέομαι', 'φοβηθήσομαι', 'ἐφοβήθην', 'I fear, am afraid'],
      ]}
      note="Dash (—) indicates no separate form exists or it is not attested in the NT. Some verbs are semi-deponent (active forms exist in some tenses)."
    />
    <InfoBox>
      <p className="font-semibold text-gray-800 mb-1">Parsing Deponents</p>
      <p>When you see a verb with middle/passive endings but an active meaning in your lexicon, you have a deponent.
        Parse as you would any middle or passive form, but translate with the active meaning given in the lexicon.</p>
    </InfoBox>
  </>
)

/* ─────────────────────────────────────────────
   Revision section map
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   Conjunctions & Adverbs
   (after David Alan Black, It's Still Greek to Me, 1998)
───────────────────────────────────────────── */

const CONJ_ADV_CONTENT = (
  <>
    <InfoBox title="Key terms">
      <ul className="space-y-1.5 list-disc list-inside">
        <li><strong>Phrase</strong> — a group of words that cannot stand alone as a sentence because it lacks a subject, a predicate, or both.</li>
        <li><strong>Clause</strong> — a group of words forming part of a sentence that contains a subject and a predicate.</li>
        <li><strong>Independent (main) clause</strong> — makes sense standing alone; usually begins with a <em>coordinating conjunction</em>.</li>
        <li><strong>Dependent (subordinate) clause</strong> — cannot stand alone; it functions like an adjective, adverb, or noun and begins with a <em>subordinate conjunction</em>.</li>
      </ul>
    </InfoBox>

    <ColsTable
      title="Independent clauses — coordinating conjunctions"
      headers={['Function', 'Conjunctions']}
      rows={[
        ['Continuation / connective', 'καί (9,158×), δέ (2,792×), τέ (215×) — “and”'],
        ['Adversative / contrastive', 'ἀλλά (638×), δέ (2,792×) — “but”; πλήν (27×) — “however”'],
        ['Correlative', 'μέν … δέ, καί … καί — “on the one hand … on the other”'],
        ['Disjunctive', 'ἤ (343×), εἴτε (65×) — “or”, “whether”'],
        ['Inferential', 'οὖν (499×), διό (53×), ἄρα (53×) — “therefore”'],
        ['Explanatory / causal', 'γάρ (1,041×), διό (53×) — “for”, “for this reason”'],
        ['Negative', 'οὐδέ (143×), οὔτε (87×), μηδέ (56×) — “and not”'],
      ]}
    />

    <ColsTable
      title="Dependent clauses — subordinate conjunctions"
      headers={['Function', 'Conjunctions']}
      rows={[
        ['Purpose', 'ἵνα (663×), ὅπως (53×) — “in order to”'],
        ['Result', 'ὥστε (83×), ὅπως (53×), ἵνα (663×) — “so that”'],
        ['Cause', 'ὅτι (1,296×), ὡς (504×) — “because”'],
        ['Condition', 'εἰ (502×), ἐάν (333×) — “if”'],
        ['Concession', 'εἰ καί, κἄν (17×) — “even if”, “although”'],
        ['Comparison', 'ὡς (504×), καθώς (182×) — “as”, “just as”'],
        ['Content / discourse', 'ὅτι (1,296×) — “that”'],
        ['Place', 'ὅπου (82×) — “where”'],
        ['Time', 'ὅτε (103×) — “when”; ὅταν (123×) — “whenever”; ἕως (146×) — “until”'],
      ]}
    />

    <InfoBox title="Mood indicators">
      <p>Certain conjunctions tend to signal the mood of the verb in their clause:</p>
      <ul className="mt-1.5 space-y-1 list-disc list-inside">
        <li>Usually with the <strong>indicative</strong>: ὅτι, εἰ, καθώς, ὡς, γάρ &amp; ὅτε</li>
        <li>Usually with the <strong>subjunctive</strong>: ἵνα, ἐάν, μή, ἕως, ὅπως &amp; ὅταν</li>
      </ul>
    </InfoBox>

    <ColsTable
      title="Expressions that introduce independent clauses"
      headers={['Demonstrative', 'Interrogative']}
      rows={[
        ['μετὰ τοῦτο — “after this”', 'κατὰ τί — “how?”'],
        ['διὰ τοῦτο — “for this reason”', 'διὰ τί — “why?”'],
        ['ἐπὶ τοῦτο — “for this reason”', 'εἰς τί — “why?”'],
        ['ἐκ τούτου — “as a result of this”', ''],
      ]}
      note="These prepositional phrases open sentences as set expressions — they are not modifiers. They also introduce commands, lists, or a new topic."
    />

    <p className="text-sm font-semibold text-gray-800 mt-6 mb-1">Adverbs</p>
    <p className="text-sm text-gray-600 mb-3">Adverbs are not conjunctions — they modify verbs (they help explain the action).</p>
    <ColsTable
      headers={['How', 'When', 'Where']}
      rows={[
        ['how? — πῶς (103×)', 'when? — πότε (19×)', 'where? — ποῦ (48×)'],
        ['in this way, thus — οὕτως (208×)', 'then, at that time — τότε (160×)', 'there — ἐκεῖ (95×)'],
        ['again — πάλιν (141×)', 'now — νῦν (147×)', 'here, hither — ὧδε (61×)'],
        ['still, yet, even — ἔτι (93×)', 'now, already — ἤδη (61×)', 'outside — ἔξω (44×)'],
        ['more, rather — μᾶλλον (81×)', 'first, earlier — πρῶτον (57×)', 'near — ἐγγύς (33×)'],
        ['only, alone — μόνον (62×)', 'immediately — εὐθύς (51×)', 'from there — ἐκεῖθεν (27×)'],
        ['well — καλῶς (36×)', 'always — πάντοτε (41×)', <span key="neg" className="font-semibold text-gray-700">Negatives</span>],
        ['likewise — ὁμοίως (30×)', 'today — σήμερον (41×)', 'no, not — οὐ, οὐκ, οὐχ (1,623×)'],
        ['truly — ἀληθῶς (18×)', 'now, just now — ἄρτι (36×)', 'not — οὐχί (54×), μή (1,042×)'],
        ['badly — κακῶς (16×)', 'immediately — εὐθέως (36×)', 'no longer — οὐκέτι (47×)'],
        ['quickly — ταχέως (15×)', 'once, formerly — ποτέ (29×)', ''],
      ]}
    />

    <p className="text-sm font-semibold text-gray-800 mt-6 mb-1">Semantic labels</p>
    <p className="text-sm text-gray-600 mb-3">Semantic labels trace the logic of an argument — the main idea, then the basis for it — by showing how sentences connect. The columns group labels by logic, form, and clarification.</p>
    <ColsTable
      title="Proposition labels (in addition to the conjunction labels above)"
      headers={['Logic', 'Form', 'Clarification']}
      rows={[
        ['Event or Action', 'Situation – Response', 'Introduction'],
        ['Assertion', 'Problem – Resolution', 'Conclusion'],
        ['– Idea – Ground', 'Rhetorical question', 'Summary'],
        ['Expansion', 'Entreaty', 'List, Series'],
        ['Restatement', 'Exhortation or Warning', 'Parallel'],
        ['– Alternative', 'Exclamation', 'Apposition'],
        ['– Explanation', 'Desire (wish or hope)', 'Identification'],
        ['– Manner', 'Promise', 'Description'],
        ['– Question – Answer', 'Illustration / Example', 'Verification'],
      ]}
    />

    <p className="mt-5 text-xs text-gray-400 italic">
      Source: David Alan Black, <span className="not-italic">It&rsquo;s Still Greek to Me: An Easy-to-Understand Guide to Intermediate Greek</span> (Grand Rapids: Baker, 1998).
    </p>
  </>
)

const REVISION_CONTENT: Record<MainTab, React.ReactNode> = {
  essentials:    null,
  nouns:         NOUNS_CONTENT,
  pronouns:      PRONOUNS_CONTENT,
  prepositions:  PREPOSITIONS_CONTENT,
  conjunctions:  CONJUNCTIONS_CONTENT,
  'conj-adv':    CONJ_ADV_CONTENT,
  indicatives:   INDICATIVES_CONTENT,
  infinitives:   INFINITIVES_CONTENT,
  imperatives:   IMPERATIVES_CONTENT,
  participles:   PARTICIPLES_CONTENT,
  subjunctives:  SUBJUNCTIVES_CONTENT,
  'mi-verbs':    MI_VERBS_CONTENT,
  '2nd-aorists': SECOND_AORISTS_CONTENT,
  deponents:     DEPONENTS_CONTENT,
}

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */

export function MorphologyView() {
  const [mainTab, setMainTab] = useState<MainTab>('essentials')
  const [essId, setEssId]     = useState(1)

  // Mobile only: the topic tabs + Essentials sections collapse into a hamburger menu
  // (desktop keeps the inline bars). Close it on an outside click.
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const activeEss = ESS_SECTIONS.find(s => s.id === essId)!

  return (
    <div className="flex flex-col min-h-0">
      {/* Mobile: topic tabs + section sub-nav collapse into a hamburger. */}
      <div ref={menuRef} className="lg:hidden relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 py-2 border-b border-gray-100 bg-surface text-left"
        >
          <span className="text-sm font-semibold text-gray-900 truncate">
            {MAIN_TABS.find(t => t.id === mainTab)?.label}
            {mainTab === 'essentials' && <span className="text-gray-400 font-normal"> · {activeEss.label}</span>}
          </span>
          <Menu size={18} className="text-gray-500 shrink-0" />
        </button>
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[70svh] overflow-y-auto bg-popover border border-gray-200 rounded-xl p-3 shadow-lg space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 px-1">Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {MAIN_TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setMainTab(t.id); if (t.id !== 'essentials') setMenuOpen(false) }}
                    className={clsx(
                      'px-3 py-1.5 rounded-none text-sm font-medium transition-colors',
                      mainTab === t.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {mainTab === 'essentials' && (
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 px-1">Section</p>
                <div className="flex flex-wrap gap-1.5">
                  {ESS_SECTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setEssId(s.id); setMenuOpen(false) }}
                      className={clsx(
                        'px-2.5 py-1 rounded-none text-sm font-medium transition-colors',
                        essId === s.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop: inline topic tab bar. */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-1.5 py-2 border-b border-gray-100 bg-surface">
          {MAIN_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              className={clsx(
                'px-3 py-1.5 rounded-none text-sm font-medium transition-colors whitespace-nowrap',
                t.id === 'essentials'
                  ? 'bg-brand-600 text-white'
                  : mainTab === t.id
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {mainTab === 'essentials' ? (
          <>
            {/* Ess. 1–8 sub-navigation (desktop; mobile uses the hamburger) */}
            <div className="hidden lg:flex gap-1.5 flex-wrap py-3 border-b border-gray-100 bg-surface">
              {ESS_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setEssId(s.id)}
                  className={clsx(
                    'px-2.5 py-1 rounded-none text-sm font-medium transition-colors',
                    essId === s.id ? 'text-gray-900 font-semibold underline underline-offset-4' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="py-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">{activeEss.title}</h2>
              {activeEss.content}
            </div>
          </>
        ) : (
          <div className="py-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {MAIN_TABS.find(t => t.id === mainTab)?.label}
            </h2>
            {REVISION_CONTENT[mainTab]}
          </div>
        )}
      </div>
    </div>
  )
}
