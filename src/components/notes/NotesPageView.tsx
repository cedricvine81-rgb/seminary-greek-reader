'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotesView } from '@/components/student/NotesView'

interface Book { osisId: string; name: string }

// The standalone /notes page: the same notebook the Exegesis "Notes" tab shows, without the
// workspace chrome around it. No passage is committed here, so NotesView gets a null anchor
// (no side text pane) and renders the full notebook. Following a note's passage reference
// still lands in the Exegesis workspace — that is where a passage is studied.
export function NotesPageView({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])

  // Same book catalogue the Exegesis workspace loads — needed to turn a note's OSIS id
  // ("Mark") back into its display name for the jump reference.
  useEffect(() => {
    let alive = true
    fetch('/data/books.json')
      .then(r => r.json())
      .then(d => { if (alive) setBooks([...(d.gnt ?? []), ...(d.lxx ?? [])] as Book[]) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  return (
    <NotesView
      isAuthenticated={isAuthenticated}
      anchor={null}
      books={books}
      standalone
      onJumpToPassage={ref => router.push(`/exegesis?ref=${encodeURIComponent(ref)}`)}
    />
  )
}
