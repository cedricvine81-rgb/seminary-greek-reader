'use client'

import { useState, useRef, useEffect, createContext, useContext } from 'react'
import clsx from 'clsx'
import { Menu, GraduationCap } from 'lucide-react'
import { ESS_EXPLANATIONS, TAB_EXPLANATIONS, type MorphLevel, type Explanation } from './morphology-explanations'

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
  /** Drop the default bottom margin (used when the table sits inside a TableAside row). */
  flush?: boolean
}

function MorphTable({ title, headers, rows, dividerRows = [], note, firstColIsData = false, highlight, highlightCols, flush = false }: MorphTableProps) {
  const divSet = new Set(dividerRows)
  return (
    <div className={flush ? '' : 'mb-5'}>
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

/* ─────────────────────────────────────────────
   Beginning / Intermediate explanations
───────────────────────────────────────────── */

const LEVELS: { id: MorphLevel; label: string }[] = [
  { id: 'beginning',    label: 'Beginning'    },
  { id: 'intermediate', label: 'Intermediate' },
]

/** Segmented Beginning ⇄ Intermediate control. */
function LevelToggle({ level, onChange }: { level: MorphLevel; onChange: (l: MorphLevel) => void }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="tablist" aria-label="Explanation level">
      {LEVELS.map(l => (
        <button
          key={l.id}
          role="tab"
          aria-selected={level === l.id}
          onClick={() => onChange(l.id)}
          className={clsx(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            level === l.id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

/** Teaching-note card that renders the current level's explanation. */
function ExplanationCard({ explanation, level }: { explanation?: Explanation; level: MorphLevel }) {
  if (!explanation) return null
  return (
    <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <GraduationCap size={15} className="text-brand-600 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {level === 'beginning' ? 'Getting started' : 'Going deeper'}
        </span>
      </div>
      {level === 'beginning' ? explanation.beginning : explanation.intermediate}
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
   Table + aside layout

   Paradigm tables are only as wide as their content, leaving space to the
   right. TableAside fills that space with a level-aware explanation/example
   panel: it reads the current Beginning/Intermediate level from context and
   shows the matching aside. On mobile the aside stacks under the table.
───────────────────────────────────────────── */

const LevelContext = createContext<MorphLevel>('beginning')

function TableAside({ beginning, intermediate, children, sticky = false }: {
  beginning?: React.ReactNode
  intermediate?: React.ReactNode
  children: React.ReactNode
  /** Keep the aside pinned in view while a long table scrolls past it. */
  sticky?: boolean
}) {
  const level = useContext(LevelContext)
  const aside = level === 'beginning' ? beginning : intermediate
  return (
    <div className="mb-5 flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-6">
      <div className="w-fit max-w-full lg:shrink-0">{children}</div>
      {aside && (
        <aside className={clsx(
          'lg:flex-1 min-w-0 lg:pl-6 lg:border-l lg:border-gray-100 space-y-2 text-sm leading-relaxed text-gray-600',
          sticky && 'lg:sticky lg:top-2 lg:self-start'
        )}>
          {aside}
        </aside>
      )}
    </div>
  )
}

/** Greek run in an aside (asides are not uppercased, but this keeps intent explicit). */
function Gk({ children }: { children: React.ReactNode }) {
  return <span className="normal-case font-medium text-gray-800">{children}</span>
}

/** An example line in an aside: Greek → English. */
function Ex({ grc, en }: { grc: React.ReactNode; en: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="normal-case text-gray-800">{grc}</span>
      <span className="mx-1.5 text-gray-400">→</span>
      <span className="text-gray-600">{en}</span>
    </p>
  )
}

/** A small bold sub-label inside an aside (e.g. "Default translations"). */
function AsideLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</p>
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
      <TableAside
        beginning={<>
          <AsideLabel>What the endings tell you</AsideLabel>
          <p>The ending shows the noun's job. Masculine &amp; neuter nouns use the 2nd-declension columns; feminine nouns use the 1st.</p>
          <AsideLabel>Default translations</AsideLabel>
          <Ex grc="ὁ λόγος" en="the word (subject)" />
          <Ex grc="τοῦ λόγου" en="of the word" />
          <Ex grc="τῷ λόγῳ" en="to / for the word" />
          <Ex grc="τὸν λόγον" en="the word (direct object)" />
        </>}
        intermediate={<>
          <p>One paradigm covers nouns <em>and</em> adjectives. Endings repeat across genders (<Gk>‒ων</Gk> is the genitive plural everywhere), so let the article settle an ambiguous form.</p>
          <p>Two memory savers: neuter matches masculine except in the nom./acc., and neuter nom. = neuter acc.</p>
          <AsideLabel>In a sentence</AsideLabel>
          <Ex grc="ὁ ἀπόστολος λέγει τὸν λόγον τοῦ θεοῦ" en="the apostle speaks the word of God" />
        </>}
      >
        <MorphTable flush headers={['', 'Masc.', 'Neut.', 'Fem.', 'Sense']} dividerRows={[0, 5]} highlight="text-red-600" highlightCols={[1, 2, 3]}
          rows={[
            ['Singular','','','',''],
            ['Nom.','‒ος','‒ον','‒η','subject'],['Gen.','‒ου →','‒ου','‒ης','of'],
            ['Dat.','‒ῳ →','‒ῳ','‒ῃ','to / for'],['Acc.','‒ον','= Nom.','‒ην','object'],
            ['Plural','','','',''],
            ['Nom.','‒οι','‒α','‒αι','subject'],['Gen.','‒ων →','‒ων','‒ων','of'],
            ['Dat.','‒οις →','‒οις','‒αις','to / for'],['Acc.','‒ους','= Nom.','‒ας','object'],
          ]}
          note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
        />
      </TableAside>
    ),
  },
  {
    id: 2, label: 'Ess. 2', title: '3rd Declension Endings',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Finding the stem</AsideLabel>
          <p>The stem hides in the nominative — find it by dropping <Gk>‒ος</Gk> from the genitive, then add the endings.</p>
          <Ex grc="σάρξ, σαρκός" en="flesh → stem σαρκ‒" />
          <AsideLabel>Default translations</AsideLabel>
          <Ex grc="ἡ σάρξ" en="the flesh (subject)" />
          <Ex grc="τῆς σαρκός" en="of the flesh" />
          <Ex grc="τῇ σαρκί" en="to / for the flesh" />
          <Ex grc="τὴν σάρκα" en="the flesh (object)" />
        </>}
        intermediate={<>
          <p>Parse a 3rd-declension noun from its <em>genitive</em>: when <Gk>‒ς</Gk> is added in the nominative, stem consonants (<Gk>τ, δ, θ</Gk>) drop out and disguise the word.</p>
          <p>The dative plural <Gk>‒σι(ν)</Gk> triggers the same consonant + <Gk>σ</Gk> changes you meet in the future and aorist.</p>
          <Ex grc="ἐλπίς, ἐλπίδος" en="hope → dat. pl. ἐλπίσι" />
        </>}
      >
        <MorphTable flush headers={['', 'Masc / Fem', 'Neuter', 'Sense']} dividerRows={[0, 5]} highlight="text-red-600" highlightCols={[1, 2]}
          rows={[
            ['Singular','','',''],
            ['Nom.','‒ς  or  ‒(none)','‒(none)','subject'],['Gen.','‒ος →','‒ος','of'],
            ['Dat.','‒ι →','‒ι','to / for'],['Acc.','‒α  or  ‒ν','= Nom.','object'],
            ['Plural','','',''],
            ['Nom.','‒ες','‒α','subject'],['Gen.','‒ων →','‒ων','of'],
            ['Dat.','‒σι →','‒σι','to / for'],['Acc.','‒ας','= Nom.','object'],
          ]}
          note="→ neuter takes the same ending as Masc/Fem  ·  Neuter Acc. = Neuter Nom."
        />
      </TableAside>
    ),
  },
  {
    id: 3, label: 'Ess. 3', title: 'Present & Imperfect Tense Endings',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Who is acting (person key)</AsideLabel>
          <p>1 = I · 2 = you · 3 = he/she/it · then we · you (pl.) · they.</p>
          <AsideLabel>Default translations (add the verb)</AsideLabel>
          <p><Gk>Present</Gk> active: "I ‒, I am ‒ing" · mid/pass: "I am (being) ‒ed."</p>
          <p><Gk>Imperfect</Gk> active: "I was ‒ing" · mid/pass: "I was being ‒ed." The middle adds "for myself."</p>
          <Ex grc="λύομεν" en="we loose / we are loosing" />
          <Ex grc="ἐλυόμεθα" en="we were loosing (for ourselves)" />
        </>}
        intermediate={<>
          <p>These two rows are the <strong>base</strong> for the whole indicative — every other tense just inserts a marker and reuses them.</p>
          <p>The augment <Gk>ε‒</Gk> on the imperfect is the surest sign of a past-time indicative. Present/imperfect carry <em>imperfective</em> aspect (ongoing action).</p>
          <p>The 2nd-sg. middle <Gk>‒ῃ / ‒ου</Gk> looks odd because an intervocalic <Gk>σ</Gk> dropped out (<Gk>‒σαι → ‒ῃ</Gk>).</p>
        </>}
      >
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-semibold text-center">
          <div className="rounded-md bg-gray-200 border border-gray-300 text-gray-700 px-2 py-1">Secondary · Past Tenses (+ ε augment)</div>
          <div className="rounded-md bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1">Primary · Non-past Tenses</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable flush title="Imperfect Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ον','‒ομην'],['','2','‒ες','‒ου'],['','3','‒ε(ν)','‒ετο'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ον','‒οντο']]}
          />
          <MorphTable flush title="Present Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ω','‒ομαι'],['','2','‒εις','‒ῃ (σαι)'],['','3','‒ει','‒εται'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ουσι(ν)','‒ονται']]}
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 4, label: 'Ess. 4', title: 'Tense Identifiers',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>How to use this</AsideLabel>
          <p>A tense identifier is a "flag" letter added to the stem that tells you the tense at a glance. Spot the flag, then read the ending for person.</p>
          <Ex grc="λύω → λύσω" en="the ‒σ‒ makes it future: “I will loose”" />
          <Ex grc="ἔλυσα" en="the ‒σα‒ makes it aorist: “I loosed”" />
        </>}
        intermediate={<>
          <p>The identifier sits <em>between</em> the stem and the ending, so parsing is a two-step scan: find the marker (tense/voice), then read the ending (person/number).</p>
          <p>Recognize the <em>family</em> rather than an exact string: a <Gk>σ</Gk>-cluster = aorist/future, a <Gk>θ</Gk>-cluster = passive. The perfect's reduplication (<Gk>λε‒λυ‒κα</Gk>) reinforces its <Gk>‒κα</Gk>.</p>
        </>}
      >
        <MorphTable flush headers={['Identifier', 'Tense']} firstColIsData highlight="text-red-600" highlightCols={[0]}
          rows={[
            ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
            ['‒σα','1 Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1 Aorist (passive)'],
            ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle / passive)'],
          ]}
          note="Reduced forms (σ, θ, κ) appear when the identifier directly precedes certain endings."
        />
      </TableAside>
    ),
  },
  {
    id: 5, label: 'Ess. 5', title: 'Applying Tense Identifiers',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>The recipe</AsideLabel>
          <p>Start from the present or imperfect endings, then change the connecting vowel with the right identifier. Past tenses build on <em>imperfect</em> endings; non-past on <em>present</em> endings.</p>
          <Ex grc="ἔλυον → ἔλυσα" en="imperfect endings + σα = aorist “I loosed”" />
          <Ex grc="λύω → λύσω" en="present endings + σ = future “I will loose”" />
        </>}
        intermediate={<>
          <p>You never memorize a new paradigm, only a <em>transformation</em> of a base. "Insert" operations (future) keep primary endings; "replace" operations (aorist/perfect) reshape the connecting vowel and take secondary endings.</p>
          <p>Run it backwards to parse the unknown: strip the ending, spot the marker, subtract it, and you're left with the lexical stem to look up.</p>
        </>}
      >
        <p className="text-xs text-gray-500 mb-3">All other tenses use the Present or Imperfect endings as a base. The tense identifier modifies the connecting vowel as follows:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable flush title="Secondary (Past) — use Imperfect endings" headers={['Tense','Modification']}
            rows={[['Aorist active','replace c.v. with σα'],['Aorist middle','replace c.v. with σα'],
                   ['Aorist passive','replace c.v. with θη'],['Perfect active','replace c.v. with κα']]}
          />
          <MorphTable flush title="Primary (Non-past) — use Present endings" headers={['Tense','Modification']}
            rows={[['Future active','insert σ before c.v.'],['Future middle','insert σ before c.v.'],
                   ['Future passive','insert θησ before c.v.'],['Perf. mid/pass','delete connecting vowel']]}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">c.v. = connecting vowel</p>
      </TableAside>
    ),
  },
  {
    id: 6, label: 'Ess. 6', title: 'Participle Endings',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Default translations</AsideLabel>
          <p>Active participle = "‒ing"; middle/passive = "being ‒ed." The giveaway chunk <Gk>‒μεν‒</Gk> marks middle/passive.</p>
          <Ex grc="ὤν, οὖσα, ὄν" en="being" />
          <Ex grc="λύων" en="loosing" />
          <Ex grc="λυόμενος" en="being loosed" />
          <Ex grc="ὁ ἄνθρωπος ὁ λύων" en="the man who is loosing" />
        </>}
        intermediate={<>
          <p>A participle carries tense (aspect) and voice but <em>no person</em>, so translate it relative to the main verb: present participle = same time / ongoing, aorist participle = usually prior action.</p>
          <p>The active endings decline on a 3rd-declension pattern for masc./neut. (hence the <Gk>‒ντ‒</Gk>) plus 1st-declension for the feminine.</p>
        </>}
      >
        <div className="space-y-4">
          <MorphTable flush title={gt("6-A  ·  Present Participle of εἰμί  (ὤν, οὔσα, ὄν)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
            rows={[['Singular','','',''],['Nom.','ὤν','ὄν','οὔσα'],['Gen.','ὄντος →','ὄντος','οὔσης'],
                   ['Dat.','ὄντι →','ὄντι','οὔσῃ'],['Acc.','ὄντα','ὄν','οὖσαν'],['Plural','','',''],
                   ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων →','ὄντων','οὐσῶν'],
                   ['Dat.','οὖσι →','οὖσι','οὔσαις'],['Acc.','ὄντας','ὄντα','οὔσας']]}
            note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
          />
          <MorphTable flush title={gt("6-B  ·  Middle / Passive Participle Endings  (‒μεν‒)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
            rows={[['Singular','','',''],['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου →','‒μενου','‒μενης'],
                   ['Dat.','‒μενῳ →','‒μενῳ','‒μενῃ'],['Acc.','‒μενον','= Nom.','‒μενην'],['Plural','','',''],
                   ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων →','‒μενων','‒μενων'],
                   ['Dat.','‒μενοις →','‒μενοις','‒μεναις'],['Acc.','‒μενους','= Nom.','‒μενας']]}
            note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 7, label: 'Ess. 7', title: 'Subjunctive & Imperative',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Default translations</AsideLabel>
          <p><Gk>Subjunctive</Gk> = "may / might / should" (its flag is the long vowel <Gk>ω/η</Gk>).</p>
          <p><Gk>Imperative</Gk> = a command. Learn <Gk>‒τω</Gk> "let him…" and <Gk>‒τωσαν</Gk> "let them…".</p>
          <Ex grc="λῦε" en="loose! (you, sg.)" />
          <Ex grc="λυέτω" en="let him loose" />
          <Ex grc="λύετε" en="loose! (you all)" />
        </>}
        intermediate={<>
          <p>Neither mood ever takes an augment — even the aorist subjunctive/imperative — because they express <em>aspect</em>, not time: aorist = a single whole action, present = ongoing.</p>
          <p>Greek's 3rd-person imperative has no clean English equal, so render it with "let / should."</p>
        </>}
      >
        <MorphTable flush title={<>7-A  ·  Subjunctive of <span className="normal-case">εἰμί</span></>} headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
          rows={[['SG','1','ὦ'],['','2','ᾖς'],['','3','ᾖ'],
                 ['PL','1','ὦμεν'],['','2','ἦτε'],['','3','ὦσι(ν)']]}
        />
        <div className="mt-3 mb-3 rounded-md bg-gray-100 border border-gray-200 px-3 py-2 text-xs text-gray-700">
          <span className="font-semibold">Key endings to memorize — </span>
          3rd Singular: <span className="font-semibold">‒τω</span>&nbsp;&nbsp;|&nbsp;&nbsp;3rd Plural: <span className="font-semibold">‒τωσαν</span>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{gt("7-B  ·  Imperative Paradigms  (λύω)")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable flush title="Present Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λῦε'],['','3','λυέτω'],['PL','2','λύετε'],['','3','λυέτωσαν']]}
          />
          <MorphTable flush title="Aorist Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσον'],['','3','λυσάτω'],['PL','2','λύσατε'],['','3','λυσάτωσαν']]}
          />
          <MorphTable flush title="Aorist Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύθητι'],['','3','λυθήτω'],['PL','2','λύθητε'],['','3','λυθήτωσαν']]}
          />
          <MorphTable flush title="Present Middle / Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύου'],['','3','λυέσθω'],['PL','2','λύεσθε'],['','3','λυέσθωσαν']]}
          />
          <MorphTable flush title="Aorist Middle" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσαι'],['','3','λυσάσθω'],['PL','2','λύσασθε'],['','3','λυσάσθωσαν']]}
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 8, label: 'Ess. 8', title: '‒μι Verbs',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>What makes them look strange</AsideLabel>
          <p><strong>Iota reduplication:</strong> in the present &amp; imperfect the first consonant repeats with an iota (<Gk>δι‒δω‒μι</Gk>). See an iota → it's present or imperfect.</p>
          <p>Every <em>other</em> tense drops the iota and follows the regular <Gk>λύω</Gk> pattern, and the aorist marker is <Gk>‒κα</Gk> (not <Gk>‒σα</Gk>).</p>
          <Ex grc="δίδωμί σοι" en="I give to you" />
          <Ex grc="ἔδωκα" en="I gave (aorist ‒κα)" />
        </>}
        intermediate={<>
          <p><Gk>‒μι</Gk> verbs have <strong>two stems</strong>: the present stem (longer, reduplicated) for present + imperfect; the verbal stem (shorter) for future, aorist + perfect.</p>
          <p><Gk>ἵστημι</Gk> is transitive in some tenses ("I set/place") but intransitive in others ("I stand"); its perfect <Gk>ἕστηκα</Gk> means a present state, "I stand."</p>
          <p>Many key NT terms are <Gk>‒μι</Gk> compounds — <Gk>ἀφίημι</Gk> "forgive," <Gk>παραδίδωμι</Gk> "hand over / betray."</p>
        </>}
      >
        <MorphTable flush title="Stem vowels (short / long)" headers={['Short / Long', 'Verb', 'Meaning']} firstColIsData
          rows={[
            ['δο / δω','δίδωμι','I give'],
            ['θε / θη','τίθημι','I put / place'],
            ['στα / στη','ἵστημι','I stand'],
            ['ε / η','ἀφίημι','I forgive / release'],
          ]}
          note="The stem vowel appears short or long depending on the form."
        />
      </TableAside>
    ),
  },
]

/* ─────────────────────────────────────────────
   Revision section content
───────────────────────────────────────────── */

const NOUNS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations</AsideLabel>
        <Ex grc="ὁ λόγος" en="the word (subject)" />
        <Ex grc="τοῦ λόγου" en="of the word" />
        <Ex grc="τῷ λόγῳ" en="to / for the word" />
        <Ex grc="τὸν λόγον" en="the word (object)" />
        <p>An adjective must <strong>agree</strong> with its noun in gender, case, and number: <Gk>καλὸς λόγος</Gk> "a good word."</p>
      </>}
      intermediate={<>
        <p>One set of endings serves nouns <em>and</em> adjectives. Read the case as a function: Nom = subject, Gen = "of," Dat = "to/for/with/by," Acc = object.</p>
        <p>An adjective inside the article is <strong>attributive</strong> ("the good word"); outside it, <strong>predicate</strong> ("the word <em>is</em> good"). Endings repeat across genders, so let the article decide.</p>
      </>}
    >
      <MorphTable flush title="1st & 2nd Declension Endings" headers={['','Masc.','Neut.','Fem.','Sense']} dividerRows={[0,5]}
        rows={[
          ['Singular','','','',''],
          ['Nom.','‒ος','‒ον','‒η','subject'],['Gen.','‒ου →','‒ου','‒ης','of'],
          ['Dat.','‒ῳ →','‒ῳ','‒ῃ','to / for'],['Acc.','‒ον','= Nom.','‒ην','object'],
          ['Plural','','','',''],
          ['Nom.','‒οι','‒α','‒αι','subject'],['Gen.','‒ων →','‒ων','‒ων','of'],
          ['Dat.','‒οις →','‒οις','‒αις','to / for'],['Acc.','‒ους','= Nom.','‒ας','object'],
        ]}
        note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>The article is your best clue</AsideLabel>
        <p>"The" (<Gk>ὁ, ἡ, τό</Gk>) agrees with its noun in gender, case, and number — so it tells you how to parse the noun.</p>
        <Ex grc="ὁ λόγος" en="the word (masc.)" />
        <Ex grc="ἡ ἀρχή" en="the beginning (fem.)" />
        <Ex grc="τὸ ἔργον" en="the work (neut.)" />
      </>}
      intermediate={<>
        <p>The article can turn almost anything into a noun (substantivize): <Gk>τὸ ἀγαθόν</Gk> "the good thing," <Gk>οἱ πιστεύοντες</Gk> "the believers."</p>
        <p>Greek has no indefinite article — an anarthrous noun is often "a(n) …," but word order and context can still make it definite (Colwell's rule).</p>
      </>}
    >
      <MorphTable flush title="Article & Noun Paradigm" headers={['','','Art.','Noun','Art.','Noun','Art.','Noun']}
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
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations</AsideLabel>
        <Ex grc="ἡ σάρξ" en="the flesh (subject)" />
        <Ex grc="τῆς σαρκός" en="of the flesh" />
        <Ex grc="τῇ σαρκί" en="to / for the flesh" />
        <Ex grc="τὴν σάρκα" en="the flesh (object)" />
        <p>Find the stem by dropping <Gk>‒ος</Gk> from the genitive (<Gk>σαρκός → σαρκ‒</Gk>), then add these endings.</p>
      </>}
      intermediate={<>
        <p>Always parse a 3rd-declension noun from its <em>genitive</em> — the nominative often hides the stem when stem consonants collide with <Gk>‒ς</Gk>.</p>
        <p>The dative plural <Gk>‒σι(ν)</Gk> triggers the same consonant + <Gk>σ</Gk> changes as the future and aorist.</p>
      </>}
    >
      <MorphTable flush title="3rd Declension Endings" headers={['','Masc./Fem.','Neuter','Sense']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','‒ς  or  ‒(none)','‒(none)','subject'],['Gen.','‒ος →','‒ος','of'],
          ['Dat.','‒ι →','‒ι','to / for'],['Acc.','‒α  or  ‒ν','= Nom.','object'],
          ['Plural','','',''],
          ['Nom.','‒ες','‒α','subject'],['Gen.','‒ων →','‒ων','of'],['Dat.','‒σι →','‒σι','to / for'],['Acc.','‒ας','= Nom.','object'],
        ]}
        note="→ neuter takes the same ending as Masc./Fem.  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>Meaning</AsideLabel>
        <p><Gk>πᾶς, πᾶσα, πᾶν</Gk> = "all, every, whole."</p>
        <Ex grc="πᾶς ἄνθρωπος" en="every person" />
        <Ex grc="πάντες" en="everyone / all (people)" />
        <Ex grc="πάντα τὰ ἔθνη" en="all the nations" />
      </>}
      intermediate={<>
        <p><Gk>πᾶς</Gk> is a handy <strong>mixed model</strong>: 3rd declension in the masculine/neuter, 1st declension in the feminine — the same split you see in active participles.</p>
        <p>Sense shifts with the article: <Gk>πᾶσα πόλις</Gk> "every city," <Gk>πᾶσα ἡ πόλις</Gk> "the whole city," <Gk>οἱ πάντες</Gk> "the whole group."</p>
      </>}
    >
      <MorphTable flush title={gt("πᾶς, πᾶσα, πᾶν  (all, every)")} headers={['','','Masc. (3rd)','Fem. (1st)','Neut. (3rd)']}
        rows={[
          ['Sg.','Nom.','πᾶς','πᾶσα','πᾶν'],['','Gen.','παντός','πάσης','παντός'],
          ['','Dat.','παντί','πάσῃ','παντί'],['','Acc.','πάντα','πᾶσαν','πᾶν'],
          ['Pl.','Nom.','πάντες','πᾶσαι','πάντα'],['','Gen.','πάντων','πασῶν','πάντων'],
          ['','Dat.','πᾶσιν','πάσαις','πᾶσιν'],['','Acc.','πάντας','πάσας','πάντα'],
        ]}
      />
    </TableAside>
  </>
)

const PRONOUNS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p><Gk>αὐτός</Gk> is the everyday "he / she / it, they." It agrees in gender with the noun it stands for.</p>
        <Ex grc="βλέπω αὐτόν" en="I see him" />
        <Ex grc="ὁ λόγος αὐτοῦ" en="his word" />
      </>}
      intermediate={<>
        <p><Gk>αὐτός</Gk> does triple duty: alone in an oblique case = "him"; in the attributive position (<Gk>ὁ αὐτός</Gk>) = "the same"; in the predicate position (<Gk>αὐτὸς ὁ…</Gk>) = intensive "himself."</p>
      </>}
    >
      <MorphTable flush title={gt("3rd Person Pronoun — αὐτός (he, she, it)")} headers={['','','Masc.','Eng.','Fem.','Eng.','Neut.','Eng.']}
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>Greek usually leaves out "I / you" — the verb ending already says who acts. So when <Gk>ἐγώ</Gk> or <Gk>σύ</Gk> <em>do</em> appear, they add emphasis.</p>
        <Ex grc="ἐγὼ λέγω" en="I (myself) say" />
      </>}
      intermediate={<>
        <p>Each has an emphatic and an unemphatic (enclitic) form: <Gk>ἐμοῦ / μου</Gk>, <Gk>ἐμοί / μοι</Gk>, <Gk>ἐμέ / με</Gk>. The longer form is used for stress or after a preposition.</p>
      </>}
    >
      <MorphTable flush title="1st & 2nd Person Pronouns" headers={['Case','1st Sg.','Eng.','1st Pl.','Eng.','2nd Sg.','Eng.','2nd Pl.']}
        rows={[
          ['Nom.','ἐγώ','I','ἡμεῖς','we','σύ','you','ὑμεῖς'],
          ['Gen.','ἐμοῦ / μου','of me','ἡμῶν','of us','σοῦ','of you','ὑμῶν'],
          ['Dat.','ἐμοί / μοι','to/for me','ἡμῖν','to/for us','σοί','to/for you','ὑμῖν'],
          ['Acc.','ἐμέ / με','me','ἡμᾶς','us','σέ','you','ὑμᾶς'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Both mean "no one / nothing." Use <Gk>οὐδείς</Gk> with the indicative (statements of fact); use <Gk>μηδείς</Gk> with the other moods (commands, subjunctives, infinitives, participles).</p>
        <Ex grc="οὐδεὶς οἶδεν" en="no one knows" />
      </>}
      intermediate={<>
        <p>Both are built from a negative + <Gk>εἷς</Gk> ("not even one"). Unlike English, Greek can stack negatives for <em>emphasis</em> — two negatives do not cancel (<Gk>οὐκ … οὐδείς</Gk> = "not … anyone").</p>
      </>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MorphTable flush title={gt("οὐδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
          rows={[
            ['Nom.','οὐδείς','οὐδεμία','οὐδέν'],
            ['Gen.','οὐδενός','οὐδεμιᾶς','οὐδενός'],
            ['Dat.','οὐδενί','οὐδεμιᾷ','οὐδενί'],
            ['Acc.','οὐδένα','οὐδεμίαν','οὐδέν'],
          ]}
          note="Used with indicative mood."
        />
        <MorphTable flush title={gt("μηδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
          rows={[
            ['Nom.','μηδείς','μηδεμία','μηδέν'],
            ['Gen.','μηδενός','μηδεμιᾶς','μηδενός'],
            ['Dat.','μηδενί','μηδεμιᾷ','μηδενί'],
            ['Acc.','μηδένα','μηδεμίαν','μηδέν'],
          ]}
          note="Used with non-indicative moods."
        />
      </div>
    </TableAside>
    <TableAside
      beginning={<>
        <p>Unaccented <Gk>τις</Gk> = "someone, anyone, a certain." It is <em>enclitic</em> — it leans on the previous word and has no accent of its own.</p>
        <Ex grc="ἄνθρωπός τις" en="a certain man" />
      </>}
      intermediate={<>
        <p><Gk>τις</Gk> can be a pronoun ("someone") or an adjective ("a certain …"). Tell it from the question word <Gk>τίς</Gk> purely by the <strong>accent</strong>.</p>
      </>}
    >
      <MorphTable flush title={gt("τις — Indefinite Pronoun (someone, anyone)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>Accented <Gk>τίς</Gk> asks a question: "who? what?" The accent is the <em>only</em> difference from indefinite <Gk>τις</Gk>.</p>
        <Ex grc="τίς εἶ;" en="Who are you?" />
      </>}
      intermediate={<>
        <p>The neuter <Gk>τί</Gk> often means "why?" as well as "what?" (<Gk>τί ποιεῖτε;</Gk> "why are you doing this?").</p>
      </>}
    >
      <MorphTable flush title={gt("τίς — Interrogative Pronoun (who? what?)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
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
    </TableAside>
  </>
)

const PREPOSITIONS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>A preposition <strong>governs a case</strong> — the noun after it must be in the case shown. Learn each preposition with its case and gloss.</p>
        <Ex grc="ἐν τῷ οἴκῳ" en="in the house (dative)" />
        <Ex grc="εἰς τὸν οἶκον" en="into the house (accusative)" />
      </>}
      intermediate={<>
        <p>A rough logic underlies the cases: <strong>genitive</strong> = away / source, <strong>dative</strong> = rest / position, <strong>accusative</strong> = motion toward. These same words also fuse onto verbs as prefixes.</p>
      </>}
    >
      <MorphTable flush title="One-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>These take <em>two</em> cases — and the case changes the meaning. Always check the ending of the following noun.</p>
        <Ex grc="διὰ τοῦ ἀγγέλου" en="through the messenger (gen.)" />
        <Ex grc="διὰ τὸν ὄχλον" en="because of the crowd (acc.)" />
      </>}
      intermediate={<>
        <p>The genitive typically keeps the "source / through" sense, the accusative the "toward / because-of" sense — the same gen.-vs-acc. logic you meet everywhere.</p>
      </>}
    >
      <MorphTable flush title="Two-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>These take <em>three</em> cases — three senses. Let the case of the noun tell you which.</p>
        <Ex grc="ἐπὶ τῆς γῆς" en="on the earth (gen.)" />
        <Ex grc="ἐπὶ τὸ βιβλίον" en="onto the book (acc.)" />
      </>}
      intermediate={<>
        <p>In Koine the edges blur — <Gk>εἰς</Gk> and <Gk>ἐν</Gk> sometimes overlap — so weigh context alongside the case rather than trusting a one-word gloss.</p>
      </>}
    >
      <MorphTable flush title="Three-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
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
    </TableAside>
  </>
)

const CONJUNCTIONS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>A conditional has an "if" clause (protasis) and a "then" clause (apodosis). Count the words to classify it: <Gk>εἰ</Gk> = One Word (1st) · <Gk>εἰ … ἄν</Gk> = Two Words (2nd) · <Gk>ἐάν</Gk> = Three Letters (3rd).</p>
        <Ex grc="εἰ υἱὸς εἶ τοῦ θεοῦ…" en="if you are the Son of God… (1st class)" />
      </>}
      intermediate={<>
        <p>Classify by the <em>protasis</em>. The class shows the speaker's rhetorical stance, not objective fact — a 1st-class condition can frame something known to be false. A <strong>"would"</strong> in English (and <Gk>ἄν</Gk> in Greek) flags the contrary-to-fact 2nd class.</p>
      </>}
    >
      <MorphTable flush title="Conditional Sentences" headers={['Class','Protasis','Apodosis']}
        rows={[
          ['First Class (Assumed True)','εἰ + Indicative','Any mood or tense'],
          ['Second Class (Contrary to Fact)','εἰ + Indicative','ἄν + Indicative'],
          ['Third Class (Probable / Future)','ἐάν + Subjunctive','Any mood or tense'],
        ]}
      />
    </TableAside>
  </>
)

const INDICATIVES_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>Greek's present covers <em>both</em> English "I loose" and "I am loosing" — it does not distinguish the two.</p>
        <Ex grc="πιστεύω εἰς τὸν θεόν" en="I believe in God" />
        <Ex grc="ὁ Ἰησοῦς διδάσκει" en="Jesus teaches / is teaching" />
      </>}
      intermediate={<>
        <p>Present = <em>imperfective</em> aspect (ongoing). Watch for the <strong>historical present</strong> — a present-tense verb telling a past story for vividness (<Gk>λέγει αὐτῷ</Gk> = "he said to him").</p>
      </>}
    >
      <MorphTable flush title={gt("Present Tense — λύω (I loose, I am loosing)")} headers={['Person','Greek','Translation']}
        rows={[
          ['1st sg.','λύω','I am untying / I untie'],
          ['2nd sg.','λύεις','You are untying / you untie'],
          ['3rd sg.','λύει','He/she/it is untying'],
          ['1st pl.','λύομεν','We are untying / we untie'],
          ['2nd pl.','λύετε','You are untying / you untie'],
          ['3rd pl.','λύουσι(ν)','They are untying / they untie'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations (add the verb)</AsideLabel>
        <p><Gk>Present</Gk> active: "I ‒ / I am ‒ing" · mid/pass: "I am (being) ‒ed."</p>
        <p><Gk>Imperfect</Gk> active: "I was ‒ing" · mid/pass: "I was being ‒ed." The middle adds "for myself."</p>
        <p>The imperfect's <Gk>ε‒</Gk> augment marks past time.</p>
      </>}
      intermediate={<>
        <p>The imperfect is <em>past imperfective</em> — ongoing or repeated action in the past ("kept on…, was beginning to…"), as opposed to the aorist's single, whole action.</p>
        <p>The 2nd-sg. middle (<Gk>ἐλύου, λύῃ</Gk>) lost an intervocalic <Gk>σ</Gk>, which is why it looks irregular.</p>
      </>}
    >
      <MorphTable flush title={gt("Present & Imperfect Full Paradigm — λύω")} headers={['','','Imp. Active','Imp. Mid/Pass','Pres. Active','Pres. Mid/Pass']}
        rows={[
          ['SG','1','ἔλυον','ἐλυόμην','λύω','λύομαι'],
          ['','2','ἔλυες','ἐλύου','λύεις','λύῃ (σαι)'],
          ['','3','ἔλυε(ν)','ἐλύετο','λύει','λύεται'],
          ['PL','1','ἐλύομεν','ἐλυόμεθα','λύομεν','λυόμεθα'],
          ['','2','ἐλύετε','ἐλύεσθε','λύετε','λύεσθε'],
          ['','3','ἔλυον','ἐλύοντο','λύουσι(ν)','λύονται'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>The verb "to be"</AsideLabel>
        <p><Gk>εἰμί</Gk> is irregular and very common — memorize it. It has no voice.</p>
        <Ex grc="ἐγώ εἰμι" en="I am" />
        <Ex grc="ἦν ὁ λόγος" en="the Word was" />
      </>}
      intermediate={<>
        <p><Gk>εἰμί</Gk> is an <strong>equative</strong> verb: it links the subject to a <em>predicate nominative</em>, so both stand in the nominative (<Gk>θεὸς ἦν ὁ λόγος</Gk>).</p>
        <p>Its future <Gk>ἔσομαι</Gk> is a middle (deponent) form.</p>
      </>}
    >
      <MorphTable flush title={gt("εἰμί — Present, Future & Imperfect Indicative")} headers={['Person','Present','Future','Imperfect']}
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>Perfect = "I have ‒ed": a completed past act with a result that <em>still stands</em>. Its front-of-word flag is <strong>reduplication</strong> (<Gk>λε‒λυκα</Gk>).</p>
        <p>Pluperfect = "I had ‒ed": the same idea one step further back in time.</p>
      </>}
      intermediate={<>
        <p>The perfect stresses the <strong>present state</strong> produced by a past action — <Gk>γέγραπται</Gk> "it stands written." That resultative force is why it matters exegetically.</p>
      </>}
    >
      <MorphTable flush title={gt("Perfect & Pluperfect — λύω")} headers={['Tense','Voice','Form','Translation']}
        rows={[
          ['Perfect','Active','λέλυκα','I have loosed'],
          ['','Middle','λέλυμαι','I have loosed myself'],
          ['','Passive','λέλυμαι','I have been loosed'],
          ['Pluperfect','Active','ἐλελύκειν','I had loosed'],
          ['','Middle','ἐλελύμην','I had loosed myself'],
          ['','Passive','ἐλελύμην','I had been loosed'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>Read across the voices</AsideLabel>
        <p><strong>Active</strong> = "I loose" (subject acts) · <strong>Middle</strong> = "I loose myself / for myself" · <strong>Passive</strong> = "I am loosed" (subject is acted on).</p>
      </>}
      intermediate={<>
        <p>The middle often means acting <em>in one's own interest</em>. The future/aorist passive show the <Gk>θη</Gk> marker (<Gk>λυθήσομαι, ἐλύθην</Gk>).</p>
        <p>Many middle-looking forms are simply <strong>deponents</strong> with an active meaning.</p>
      </>}
    >
      <MorphTable flush title={gt("Full Tense & Voice Paradigm — λύω (1st sg.)")} headers={['Tense','Voice','Form','Translation']}
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>Spot the flag letter, then read the ending for person. <Gk>‒σ‒</Gk> future, <Gk>‒σα‒</Gk> aorist, <Gk>‒θη‒</Gk> aorist passive, <Gk>‒κα‒</Gk> perfect.</p>
      </>}
      intermediate={<>
        <p>Recognize the <em>family</em>, not an exact string: a <Gk>σ</Gk>-cluster = aorist/future, a <Gk>θ</Gk>-cluster = passive. Reduced forms appear right before certain endings.</p>
      </>}
    >
      <MorphTable flush title="Tense Identifiers" headers={['Identifier','Tense']}
        rows={[
          ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
          ['‒σα','1st Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1st Aorist (passive)'],
          ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle/passive)'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Build any tense from the present/imperfect base plus the modification shown.</p>
        <Ex grc="ἔλυον → ἔλυσα" en="+ σα = aorist “I loosed”" />
        <Ex grc="λύω → λύσω" en="+ σ = future “I will loose”" />
      </>}
      intermediate={<>
        <p>Run it backwards to parse an unknown form: strip the ending, spot the marker, subtract it, and you're left with the lexical stem to look up.</p>
      </>}
    >
      <MorphTable flush title="Applying Tense Identifiers to Endings" headers={['Tense','Modification to Base Endings']}
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>When the <Gk>σ</Gk> of the future/aorist meets a stem consonant, the two merge into a single letter.</p>
        <Ex grc="γραφ + σω → γράψω" en="I will write" />
        <Ex grc="κηρυκ + σω → κηρύξω" en="I will preach" />
      </>}
      intermediate={<>
        <p>The very same mergers drive the dative plural (<Gk>‒σι</Gk>) and many 3rd-declension nominatives — one rule, several places.</p>
      </>}
    >
      <MorphTable flush title={gt("Consonant + σ Combinations")} headers={['Stem ends in','+ σ','Result']}
        rows={[
          ['π, β, φ','+ σ','ψ'],
          ['τ, δ, θ, ζ','+ σ','σ'],
          ['κ, γ, χ, σ','+ σ','ξ'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>This shows the moving parts of a verb: an <strong>augment</strong> (<Gk>ε‒</Gk>) goes on the <em>front</em> for past tenses, and the <strong>identifier</strong> (<Gk>σ / θ</Gk>) goes <em>after</em> the stem.</p>
      </>}
      intermediate={<>
        <p>The passive builds on <Gk>θη / θησ</Gk>; the middle borrows the active's <Gk>σ</Gk> in the future and aorist. Stem + augment + identifier is the whole machine.</p>
      </>}
    >
      <MorphTable flush title={gt("Tense Stem Structure — λύ‒")} headers={['Tense','Active','Middle','Passive']}
        rows={[
          ['Present','λυ','λυ','λυ'],
          ['Future','λυ‒σ','λυ‒σ','λυ‒θησ'],
          ['Imperfect','ε‒λυ','ε‒λυ','ε‒λυ'],
          ['Aorist','ε‒λυ‒σ','ε‒λυ‒σ','ε‒λυ‒θ'],
        ]}
        note="ε = augment (past tenses); σ / θησ / θ = tense identifier"
      />
    </TableAside>
  </>
)

const INFINITIVES_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>The infinitive is the "to ‒" form. It has no person or number, so it never changes for "I / you / he."</p>
        <Ex grc="θέλω λύειν" en="I want to loose" />
        <Ex grc="λύσαι" en="to loose (aorist — σ, but no augment)" />
      </>}
      intermediate={<>
        <p>It's a <strong>verbal noun</strong>: it can take an article (<Gk>τό</Gk>) and even an accusative subject (<Gk>θέλω τὸν ἄγγελον ἀπελθεῖν</Gk> "I want the messenger to depart"). Present vs. aorist = aspect, not time.</p>
      </>}
    >
      <MorphTable flush title={gt("Most Common Infinitive Forms — λύω")} headers={['','Present Active','Aorist Active']}
        rows={[['Infinitive','λύειν','λύσαι']]}
      />
    </TableAside>
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
    <TableAside
      beginning={<>
        <p>The imperative gives a command. Learn the 2nd-person forms first.</p>
        <Ex grc="λῦε" en="loose! (you, sg.)" />
        <Ex grc="λύετε" en="loose! (you all)" />
        <Ex grc="πίστευε" en="believe! (keep believing)" />
      </>}
      intermediate={<>
        <p>Present vs. aorist imperative is aspect: present = ongoing / general, aorist = a single specific act. Beware the look-alike future indicative — the ending decides (<Gk>πίστευσον</Gk> "believe!" vs. <Gk>πιστεύσομεν</Gk> "we will believe").</p>
      </>}
    >
      <MorphTable flush title={gt("Most Common Imperative Forms — λύω")} headers={['','Present Active','Aorist Active']}
        rows={[
          ['2nd Person Singular','λῦε','λύσον'],
          ['2nd Person Plural','λύετε','λύσατε'],
        ]}
      />
    </TableAside>
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
    <TableAside
      beginning={<>
        <p><Gk>ὤν, οὖσα, ὄν</Gk> = "being." Translate the article + participle as "the one who is…"</p>
        <Ex grc="ὁ ὢν ἐν τῷ οὐρανῷ" en="the one who is in heaven" />
      </>}
      intermediate={<>
        <p><Gk>εἰμί</Gk> has only a present participle; it helps build <em>periphrastic</em> tenses (<Gk>ἦν διδάσκων</Gk> "he was teaching").</p>
      </>}
    >
      <MorphTable flush title={gt("Present Participle of εἰμί (ὤν, οὖσα, ὄν)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>Present active participle = "loosing" — action going on at the <em>same time</em> as the main verb (Simultaneous).</p>
        <Ex grc="ὁ λύων τὸν δοῦλον" en="the one loosing the slave" />
      </>}
      intermediate={<>
        <p>It declines on a 3rd-declension pattern for masc./neut. (note the <Gk>‒ντ‒</Gk>) plus 1st-declension for the feminine — the same split as <Gk>πᾶς</Gk>.</p>
      </>}
    >
      <MorphTable flush title={gt("Present Active Participle — λύων, λύουσα, λύον")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','λύων','λύουσα','λύον'],['Gen.','λύοντος','λυούσης','λύοντος'],
          ['Dat.','λύοντι','λυούσῃ','λύοντι'],['Acc.','λύοντα','λύουσαν','λύον'],
          ['Plural','','',''],
          ['Nom.','λύοντες','λύουσαι','λύοντα'],['Gen.','λυόντων','λυουσῶν','λυόντων'],
          ['Dat.','λύουσιν','λυούσαις','λύουσιν'],['Acc.','λύοντας','λυούσας','λύοντα'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Aorist active participle = "having loosed" — action that happened <em>before</em> the main verb (Sequence).</p>
        <Ex grc="λύσας τὸν δοῦλον ἀπῆλθεν" en="having loosed the slave, he left" />
      </>}
      intermediate={<>
        <p>Note there is <strong>no augment</strong> (augments live only in the indicative). The aorist participle marks relative time, not absolute past.</p>
      </>}
    >
      <MorphTable flush title={gt("Aorist Active Participle — λύσας, λύσασα, λύσαν")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','λύσας','λύσασα','λύσαν'],['Gen.','λύσαντος','λυσάσης','λύσαντος'],
          ['Dat.','λύσαντι','λυσάσῃ','λύσαντι'],['Acc.','λύσαντα','λύσασαν','λύσαν'],
          ['Plural','','',''],
          ['Nom.','λύσαντες','λύσασαι','λύσαντα'],['Gen.','λυσάντων','λυσασῶν','λυσάντων'],
          ['Dat.','λύσασιν','λυσάσαις','λύσασιν'],['Acc.','λύσαντας','λυσάσας','λύσαντα'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>The chunk <Gk>‒μεν‒</Gk> marks a middle/passive participle: "being loosed."</p>
        <Ex grc="ὁ λυόμενος" en="the one being loosed" />
      </>}
      intermediate={<>
        <p>These take the regular 1st/2nd-declension endings of <Gk>ἀγαθός</Gk> — fully predictable, unlike the active's 3rd-declension pattern.</p>
      </>}
    >
      <MorphTable flush title={gt("Middle / Passive Participle Endings (‒μεν‒ + endings of ἀγαθός)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
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
    </TableAside>
    <TableAside
      beginning={<>
        <p>Build a middle/passive participle from tense marker + <Gk>‒μεν‒</Gk>. The connecting vowel tells the tense.</p>
        <Ex grc="λυόμενος" en="being loosed (present)" />
        <Ex grc="λελυμένος" en="having been loosed (perfect)" />
      </>}
      intermediate={<>
        <p>Reading it in reverse: <Gk>ο</Gk> before <Gk>‒μεν‒</Gk> = present, <Gk>σα</Gk> = aorist middle, and no connecting vowel (with reduplication) = perfect.</p>
      </>}
    >
      <MorphTable flush title={gt("Middle/Passive Participle — Tense Identifier + ‒μεν‒")} headers={['Tense','Identifier','Example (Masc. Nom. Sg.)']}
        rows={[
          ['Present m/p','‒ο‒μεν','λυόμενος'],
          ['Aorist middle','‒σα‒μεν','λυσάμενος'],
          ['Perfect m/p','(no c.v.)‒μεν','λελυμένος'],
        ]}
      />
    </TableAside>
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
    <TableAside
      beginning={<>
        <p>The subjunctive = "may / might / should." Its flag is the <strong>long vowel</strong> <Gk>ω/η</Gk> where the indicative had <Gk>ο/ε</Gk>.</p>
        <Ex grc="ἵνα λύῃ" en="in order that he may loose" />
      </>}
      intermediate={<>
        <p>The present subjunctive carries <em>imperfective</em> aspect (ongoing) — never past time. It usually follows a "flag word" like <Gk>ἵνα</Gk> or <Gk>ἐάν</Gk>.</p>
      </>}
    >
      <MorphTable flush title={gt("Present Subjunctive — λύω")} headers={['','Pers.','Active','Mid./Pass.']}
        rows={[
          ['SG','1','λύω','λύωμαι'],['','2','λύῃς','λύῃ'],['','3','λύῃ','λύηται'],
          ['PL','1','λύωμεν','λυώμεθα'],['','2','λύητε','λύησθε'],['','3','λύωσιν','λύωνται'],
        ]}
        note="I may (might) be loosing / I may be loosed"
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>The aorist subjunctive views the action as a single whole — but it is <em>not</em> past (no augment).</p>
        <Ex grc="ἐὰν λύσῃ" en="if he looses" />
      </>}
      intermediate={<>
        <p>Aspect only: aorist = perfective (a whole action), present = ongoing. Prohibitions use <Gk>μή</Gk> + aorist subjunctive ("don't ever…"), and <Gk>οὐ μή</Gk> + aorist subjunctive is the strongest "no."</p>
      </>}
    >
      <MorphTable flush title={gt("Aorist Subjunctive — λύω")} headers={['','Pers.','Active','Middle','Passive']}
        rows={[
          ['SG','1','λύσω','λύσωμαι','λυθῶ'],['','2','λύσῃς','λύσῃ','λυθῇς'],['','3','λύσῃ','λύσηται','λυθῇ'],
          ['PL','1','λύσωμεν','λυσώμεθα','λυθῶμεν'],['','2','λύσητε','λύσησθε','λυθῆτε'],['','3','λύσωσιν','λύσωνται','λυθῶσιν'],
        ]}
        note="I may (might) loose / I may be loosed"
      />
    </TableAside>
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
    <TableAside
      beginning={<>
        <AsideLabel>Meanings</AsideLabel>
        <Ex grc="δίδωμι" en="I give" />
        <Ex grc="τίθημι" en="I put / place" />
        <Ex grc="ἵστημι" en="I stand / set" />
      </>}
      intermediate={<>
        <p>Each has <strong>two stems</strong>: the reduplicated <em>present</em> stem (longer) for present + imperfect, and the shorter <em>verb</em> stem for future, aorist + perfect.</p>
      </>}
    >
      <MorphTable flush title={gt("‒μι Verb Stems")} headers={['-μι verb','Verb stem','Present stem']}
        rows={[
          ['δίδωμι','δο / δω','διδο / διδω'],
          ['τίθημι','θε / θη','τιθε / τιθη'],
          ['ἵστημι','στα / στη','ἱστα / ἱστη'],
        ]}
        note="The reduplicated present stem is lengthened in the singular (διδο → διδω, τιθε → τιθη, ἱστα → ἱστη)."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>The iota reduplication (<Gk>δι‒, τι‒, ἱ‒</Gk>) marks the present. See it → the verb is present or imperfect.</p>
        <Ex grc="δίδωμί σοι" en="I give to you" />
      </>}
      intermediate={<>
        <p>Endings attach directly to the long stem (no connecting vowel), which is why the singular looks so different from <Gk>‒ω</Gk> verbs; the plural shortens the stem again.</p>
      </>}
    >
      <MorphTable flush title="Present Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
        rows={[
          ['Sg.','1.','δίδωμι','τίθημι','ἵστημι'],
          ['','2.','δίδως','τίθης','ἵστης'],
          ['','3.','δίδωσι(ν)','τίθησι(ν)','ἵστησι(ν)'],
          ['Pl.','1.','δίδομεν','τίθεμεν','ἵσταμεν'],
          ['','2.','δίδοτε','τίθετε','ἵστατε'],
          ['','3.','διδόασι(ν)','τιθέασι(ν)','ἱστᾶσι(ν)'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>No iota here — the aorist drops the reduplication and takes a <Gk>‒κα</Gk> marker (not <Gk>‒σα</Gk>).</p>
        <Ex grc="ἔδωκα" en="I gave" />
        <Ex grc="ἔθηκα" en="I put" />
      </>}
      intermediate={<>
        <p>The <Gk>‒κα</Gk> aorist can look like a perfect — tell them apart by reduplication (perfect) and context. <Gk>ἵστημι</Gk> keeps its <Gk>‒σα</Gk> (<Gk>ἔστησα</Gk>) and is transitive here ("I set up").</p>
      </>}
    >
      <MorphTable flush title="Aorist Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
        rows={[
          ['Sg.','1.','ἔδωκα','ἔθηκα','ἔστησα'],
          ['','2.','ἔδωκας','ἔθηκας','ἔστησας'],
          ['','3.','ἔδωκε(ν)','ἔθηκε(ν)','ἔστησε(ν)'],
          ['Pl.','1.','ἐδώκαμεν','ἐθήκαμεν','ἐστήσαμεν'],
          ['','2.','ἐδώκατε','ἐθήκατε','ἐστήσατε'],
          ['','3.','ἔδωκαν','ἔθηκαν','ἔστησαν'],
        ]}
      />
    </TableAside>
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
    <TableAside
      sticky
      beginning={<>
        <p>A <strong>2nd (strong) aorist</strong> is still just a simple past ("I did"), but it forms by <em>changing the stem</em> instead of adding <Gk>σα</Gk>. You memorize these like vocabulary.</p>
        <Ex grc="λαμβάνω → ἔλαβον" en="I take → I took" />
        <p>It uses the imperfect's endings, but with a changed stem — read the row left to right: present → aorist → meaning.</p>
      </>}
      intermediate={<>
        <p>Three clues together identify it: an <strong>augment</strong>, a stem <strong>different from the present</strong>, and <strong>no σα/θη</strong> marker.</p>
        <p>Some are <em>suppletive</em> — they borrow a whole different root (<Gk>λέγω → εἶπον</Gk>, <Gk>ὁράω → εἶδον</Gk>). Learn the aorist stem as part of the verb's principal parts.</p>
      </>}
    >
    <MorphTable
      flush
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
    </TableAside>
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
    <TableAside
      sticky
      beginning={<>
        <p>A <strong>deponent</strong> looks middle/passive (ending in <Gk>‒ομαι</Gk>) but means something <em>active</em>. Just translate it actively — the middle/passive form is its only form.</p>
        <Ex grc="ἔρχομαι" en="I come / go" />
        <Ex grc="ἀποκρίνομαι" en="I answer" />
      </>}
      intermediate={<>
        <p>Parse it exactly as a middle/passive (tense, person, number), then use the active gloss. Some are <strong>middle</strong> in the future/aorist, others <strong>passive</strong> (<Gk>ἀποκρίνομαι → ἀπεκρίθην</Gk>).</p>
        <p>Many now argue the Greek <strong>middle voice</strong> genuinely fits these verbs (subject-affectedness) rather than being a defective active — but the practical rule (active meaning) still holds.</p>
      </>}
    >
    <MorphTable
      flush
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
    </TableAside>
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

  // Beginning / Intermediate explanation level, remembered across visits.
  // Default to 'beginning' on first render (server + first client paint) to
  // avoid a hydration mismatch, then hydrate from localStorage.
  const [level, setLevel] = useState<MorphLevel>('beginning')
  useEffect(() => {
    const saved = localStorage.getItem('morph-level')
    if (saved === 'beginning' || saved === 'intermediate') setLevel(saved)
  }, [])
  function changeLevel(l: MorphLevel) {
    setLevel(l)
    try { localStorage.setItem('morph-level', l) } catch { /* ignore */ }
  }

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
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
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
                        'px-2.5 py-1 rounded-lg text-sm font-medium transition-colors',
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
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
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
      <LevelContext.Provider value={level}>
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
                    'px-2.5 py-1 rounded-lg text-sm font-medium transition-colors',
                    essId === s.id ? 'text-gray-900 font-semibold underline underline-offset-4' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="py-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-900">{activeEss.title}</h2>
                <LevelToggle level={level} onChange={changeLevel} />
              </div>
              <ExplanationCard explanation={ESS_EXPLANATIONS[essId]} level={level} />
              {activeEss.content}
            </div>
          </>
        ) : (
          <div className="py-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                {MAIN_TABS.find(t => t.id === mainTab)?.label}
              </h2>
              <LevelToggle level={level} onChange={changeLevel} />
            </div>
            <ExplanationCard explanation={TAB_EXPLANATIONS[mainTab]} level={level} />
            {REVISION_CONTENT[mainTab]}
          </div>
        )}
      </div>
      </LevelContext.Provider>
    </div>
  )
}
