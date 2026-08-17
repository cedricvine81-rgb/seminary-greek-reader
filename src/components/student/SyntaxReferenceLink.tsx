'use client'
// "Syntax categories & grading criteria" — the reference students may open DURING a
// translation exam.
//
// It must be an IN-PAGE modal, never a link that navigates or opens a tab: lockdown mode
// watches for tab/window switches and fullscreen exits, so an external link would either be
// blocked or flag the student for consulting the very document they are entitled to see.
// A modal changes nothing the integrity checks observe.
//
// The content (src/data/syntax-reference.ts) is the instructor's own grading document,
// rendered verbatim.
import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useT } from '@/lib/i18n/LocaleProvider'
import {
  SYNTAX_REFERENCE, SYNTAX_REFERENCE_TITLE, SYNTAX_REFERENCE_SUBTITLE,
  GRADING_CRITERIA, GRADING_CRITERIA_TITLE,
} from '@/data/syntax-reference'

export function SyntaxReferenceLink({ lockdown = false }: { lockdown?: boolean }) {
  const [open, setOpen] = useState(false)
  const t = useT()
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
      >
        <BookOpen size={15} aria-hidden />
        {t('exeg.syntaxRef')}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={SYNTAX_REFERENCE_TITLE} size="xl">
        <p className="-mt-3 mb-4 text-xs italic text-gray-500">{SYNTAX_REFERENCE_SUBTITLE}</p>
        {/* The browser exits fullscreen on Esc no matter what this dialog does, and the
            integrity log records the exit — so under lockdown, steer students to the ✕. */}
        {lockdown && (
          <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            {t('exeg.syntaxRefEscHint')}
          </p>
        )}
        <div className="columns-1 sm:columns-2 gap-6">
          {SYNTAX_REFERENCE.map(g => (
            <div key={g.heading} className="mb-4 break-inside-avoid">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1">{g.heading}</p>
              <ul className="space-y-0.5">
                {g.items.map(i => (
                  <li key={i} className="text-sm text-gray-700">{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <h3 className="mt-6 mb-2 border-t border-gray-200 pt-4 text-sm font-semibold text-gray-900">
          {GRADING_CRITERIA_TITLE}
        </h3>
        <div className="space-y-3">
          {GRADING_CRITERIA.map(g => (
            <div key={g.grade}>
              <p className="text-sm font-semibold text-gray-800">
                {g.grade}
                {g.scope && <span className="ml-1.5 text-xs font-normal text-gray-500">— {g.scope}</span>}
              </p>
              <p className="text-sm text-gray-600">{g.text}</p>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}
