'use client'
// "View sentences" — a popup showing exactly what a homework set will ask.
//
// Instructors activate a set from a one-line title ("Homework A — Nouns & adjectives
// (Lesson 4) · 6 sentences") with no way to see the sentences behind it short of assigning
// it to themselves. This link opens the set in a modal: each sentence in Greek with its
// model translation, and the note naming the slide it came from.
//
// INSTRUCTOR SURFACES ONLY. The translations shown here are the model answers, so this must
// never render for students — both call sites (the Grammar page's activation card, which is
// role-gated, and the Assignment Builder) are instructor-only.
//
// The set data comes straight from the client bundle (getHomeworkSet), not an API call: the
// Assignment Builder already imports the full GRAMMAR_HOMEWORK_SETS array, so this adds no
// new payload and works instantly.
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { getHomeworkSet } from '@/data/grammar-homework'
import { useT } from '@/lib/i18n/LocaleProvider'

export function HomeworkSetPreviewLink({ setId, className }: { setId: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const t = useT()
  const set = getHomeworkSet(setId)
  if (!set) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'text-xs font-medium text-brand-600 hover:underline'}
      >
        {t('morph.hw.preview')}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={set.title} size="xl">
        <p className="mb-4 text-xs text-gray-500">{t('morph.hw.previewHelp')}</p>
        <ol className="space-y-4">
          {set.sentences.map((s, i) => (
            <li key={i} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
              <p className="font-reading text-lg leading-snug text-gray-900">
                <span className="mr-1.5 text-sm text-gray-400">{i + 1}.</span>
                {s.words.map(w => w.w).join(' ')}
              </p>
              <p className="mt-1 text-sm text-gray-600">{s.translation}</p>
              {s.note && <p className="mt-0.5 text-xs italic text-gray-400">{s.note}</p>}
            </li>
          ))}
        </ol>
      </Modal>
    </>
  )
}
