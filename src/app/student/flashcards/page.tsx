import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { VocabBuilder } from '@/components/vocab/VocabBuilder'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'

export const metadata: Metadata = { title: 'Flashcards' }

export default async function FlashcardsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  // The full Vocab Builder: 1,000+ NT words organised by frequency section
  // (with A–H subsections) and part of speech, plus Study / Flashcards / Browse
  // modes. Data is the static bgvb-vocabulary.json (not the database), so it is
  // unaffected by any DB changes; progress is saved per device in localStorage.
  return (
    <DashboardShell role="STUDENT" pageTitle="Flashcards" pageDescription="Study Greek vocabulary by frequency section and part of speech.">
      <VocabBuilder />
    </DashboardShell>
  )
}
