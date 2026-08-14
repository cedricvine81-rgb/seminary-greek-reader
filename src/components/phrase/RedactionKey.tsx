'use client'
// Explainer panel for the Synopsis Compare mode: the ancient editorial techniques
// (Theon / Quintilian / Licona), how each maps to the color-coding, and where to read
// more. Rendered inline below the synopsis columns when the user opens the key.

import { BookOpen } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { rich } from '@/lib/i18n/rich'
import { WORD_LEVEL, NARRATIVE_LEVEL, TECHNIQUE_SOURCES, type TechniqueRef } from '@/lib/redaction-techniques'
import { openProsePassage } from '@/lib/prose-panel-bus'

// A citation. Sources embedded in this app (Theon, Quintilian) open in the side panel
// beside the key, so a student can read the ancient text against the passage that cited
// it; everything else stays an ordinary external link.
function Refs({ refs }: { refs: TechniqueRef[] }) {
  const t = useT()
  return (
    <span className="text-[11px] text-gray-400">
      {refs.map((r, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {r.passage ? (
            <button
              type="button"
              onClick={() => openProsePassage(r.passage!)}
              title={t('red.readBeside')}
              className="inline-flex items-baseline gap-0.5 text-brand-600 hover:underline"
            >
              <BookOpen size={11} className="translate-y-px" aria-hidden />
              {r.label}
            </button>
          ) : r.url ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{r.label}</a>
          ) : r.label}
        </span>
      ))}
    </span>
  )
}

/** The colored chip showing how a word-level technique is marked in the columns. */
function Swatch({ tag, children }: { tag: string; children: React.ReactNode }) {
  return <span className={`rc-mark rc-${tag} rounded px-1.5 py-0.5 text-xs font-medium text-gray-800 whitespace-nowrap`}>{children}</span>
}

export function RedactionKey() {
  const t = useT()
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 space-y-5 text-sm">
      <div>
        <h3 className="font-semibold text-gray-800">{t('red.heading')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          {rich(t('red.intro'), {
            progym:   <span className="italic">Progymnasmata</span>,
            inst:     <span className="italic">Institutio Oratoria</span>,
            onPara:   <span className="italic">On Paraphrase</span>,
            lives:    <span className="italic">Lives</span>,
            modes:    <span className="font-medium">{t('red.fourModes')}</span>,
            selector: <span className="font-medium">{t('red.sourceModel')}</span>,
          })}
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('red.wordModes')}</h4>
        <ul className="space-y-3">
          <li className="flex flex-col gap-0.5">
            <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs font-medium text-gray-700 w-fit">{t('red.plainVerbatim')}</span>
            <span className="text-xs text-gray-500">{t('red.plainDesc')}</span>
          </li>
          {WORD_LEVEL.map(tech => (
            <li key={tech.tag} className="flex flex-col gap-0.5">
              <span className="flex items-baseline gap-2 flex-wrap">
                <Swatch tag={tech.tag}>{tech.name}</Swatch>
                <span className="text-[11px] italic text-gray-400">{tech.ancient}</span>
              </span>
              <span className="text-xs text-gray-500">{tech.description}</span>
              <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">{t('red.example')}</span> {tech.example}</span>
              <Refs refs={tech.refs} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('red.narrativeDevices')}</h4>
        <p className="mb-2 text-xs leading-relaxed text-gray-500">
          {rich(t('red.registers'), {
            parchment: <span className="rounded border border-parchment-300 bg-parchment-50 px-1 text-gray-700">{t('red.parchmentChips')}</span>,
            dashed:    <span className="rounded border border-dashed border-gray-400 px-1 text-gray-600">{t('red.dashedChips')}</span>,
            signals:   <span className="italic">{t('red.signals')}</span>,
          })}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {NARRATIVE_LEVEL.map(tech => (
            <li key={tech.name} className="rounded-lg border border-gray-200 p-2.5 flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-700">{tech.name}</span>
              <span className="text-xs text-gray-500">{tech.description}</span>
              <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">{t('red.example')}</span> {tech.example}</span>
              <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">{t('red.inTheColors')}</span> {tech.lookFor}</span>
              <Refs refs={tech.refs} />
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-gray-400">
        {rich(t('red.sourcesNote'), {
          refs:    <Refs refs={TECHNIQUE_SOURCES} />,
          ours:    <span className="italic">{t('red.ourTranslation')}</span>,
          chreia:  <span className="italic">On the Chreia</span>,
          onPara:  <span className="italic">On Paraphrase</span>,
          kennedy: <span className="italic">Progymnasmata: Greek Textbooks of Prose Composition and Rhetoric</span>,
        })}
      </p>
    </div>
  )
}
