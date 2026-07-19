'use client'

/* ─────────────────────────────────────────────
   MorphologyView — shell

   Tab navigation + the Beginning/Intermediate level toggle. All chapter
   content lives in src/components/morphology/chapters/*, shared building
   blocks (tables, asides, glossary terms, practice) in
   src/components/morphology/shared.tsx.
───────────────────────────────────────────── */

import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { Menu, GraduationCap } from 'lucide-react'
import { ESS_EXPLANATIONS, TAB_EXPLANATIONS, type Explanation } from './morphology-explanations'
import { LevelContext, type MorphLevel } from '@/components/morphology/shared'
import { ESS_SECTIONS } from '@/components/morphology/chapters/essentials'
import { NOUNS_CONTENT } from '@/components/morphology/chapters/nouns'
import { PRONOUNS_CONTENT } from '@/components/morphology/chapters/pronouns'
import { PREPOSITIONS_CONTENT } from '@/components/morphology/chapters/prepositions'
import { CONJUNCTIONS_CONTENT } from '@/components/morphology/chapters/conditionals'
import { CONJ_ADV_CONTENT } from '@/components/morphology/chapters/conj-adv'
import { INDICATIVES_CONTENT } from '@/components/morphology/chapters/indicatives'
import { INFINITIVES_CONTENT } from '@/components/morphology/chapters/infinitives'
import { IMPERATIVES_CONTENT } from '@/components/morphology/chapters/imperatives'
import { PARTICIPLES_CONTENT } from '@/components/morphology/chapters/participles'
import { SUBJUNCTIVES_CONTENT } from '@/components/morphology/chapters/subjunctives'
import { MI_VERBS_CONTENT } from '@/components/morphology/chapters/mi-verbs'
import { SECOND_AORISTS_CONTENT } from '@/components/morphology/chapters/second-aorists'
import { DEPONENTS_CONTENT } from '@/components/morphology/chapters/deponents'

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
