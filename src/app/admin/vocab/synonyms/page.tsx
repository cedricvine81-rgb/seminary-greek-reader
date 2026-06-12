import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminLexiconSynonyms } from '@/components/admin/AdminLexiconSynonyms'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Vocab Synonyms' }

export default async function AdminVocabSynonymsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Vocab Synonyms" pageDescription="Manage accepted English synonyms per Greek lemma. Future quiz submissions only.">
      <AdminLexiconSynonyms />
    </DashboardShell>
  )
}
