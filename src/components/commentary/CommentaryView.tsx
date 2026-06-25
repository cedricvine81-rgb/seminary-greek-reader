'use client'
import { useEffect, useState } from 'react'
import { GreekVerse } from '@/components/reader/GreekVerse'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import type { BiblicalVerse } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { NoteAnchor } from '@/components/student/NotesView'

interface CommentaryMeta { id: string; name: string; author: string; attribution: string; books: string[] }

/**
 * Commentary tab: the Greek text (NA1904) on the left with a parsing box beneath it,
 * and a verse-tracked commentary pane on the right. Pick a commentary from the
 * dropdown; the pane follows whichever verse you click in the Greek. Commentary data
 * is static, verse-keyed JSON (public/data/commentary/<id>/<book>.json).
 */
export function CommentaryView({ anchor }: { anchor: NoteAnchor | null }) {
  const [verses, setVerses] = useState<BiblicalVerse[]>([])
  const [activeVerse, setActiveVerse] = useState<number | null>(null)
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  const [commentaries, setCommentaries] = useState<CommentaryMeta[]>([])
  const [commentaryId, setCommentaryId] = useState('robertson')
  const [verseMap, setVerseMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Registry of available commentaries.
  useEffect(() => {
    fetch('/data/commentary/index.json').then(r => r.json()).then(d => {
      const list: CommentaryMeta[] = d.commentaries ?? []
      setCommentaries(list)
      if (list.length && !list.some(c => c.id === commentaryId)) setCommentaryId(list[0].id)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Greek text for the passage (NA1904).
  useEffect(() => {
    if (!anchor) { setVerses([]); setActiveVerse(null); return }
    setLoading(true); setInfo(null)
    fetch(`/api/reader?corpus=NA1904&book=${anchor.book}&chapter=${anchor.chapter}`)
      .then(r => r.json())
      .then(d => {
        const vs: BiblicalVerse[] = (d.verses ?? []).filter((v: BiblicalVerse) => v.verse >= anchor.verseStart && v.verse <= anchor.verseEnd)
        setVerses(vs); setActiveVerse(vs[0]?.verse ?? anchor.verseStart)
      }).catch(() => setVerses([])).finally(() => setLoading(false))
  }, [anchor?.book, anchor?.chapter, anchor?.verseStart, anchor?.verseEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // Commentary text for the current book + selected commentary.
  useEffect(() => {
    if (!anchor) { setVerseMap({}); return }
    fetch(`/data/commentary/${commentaryId}/${anchor.book}.json`)
      .then(r => (r.ok ? r.json() : {})).then(setVerseMap).catch(() => setVerseMap({}))
  }, [commentaryId, anchor?.book]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!anchor) return <p className="text-sm text-gray-400 italic py-10 text-center">Enter a passage above to read the commentary.</p>

  const html = activeVerse != null ? verseMap[`${anchor.chapter}:${activeVerse}`] : undefined
  const meta = commentaries.find(c => c.id === commentaryId)

  return (
    <div className="grid lg:grid-cols-2 gap-4 h-full min-h-0">
      {/* Left: Greek text (scrolls) + parsing box (fixed, bottom-left) */}
      <div className="flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : verses.map(v => (
            <div key={v.id} onClick={() => setActiveVerse(v.verse)}
              className={`rounded-lg px-2 py-1 transition-colors ${v.verse === activeVerse ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-gray-50'}`}>
              <GreekVerse verse={v} activeWordId={null} highlighted={false}
                onWordHover={() => {}} onWordClick={i => { setInfo(i); setActiveVerse(v.verse) }} />
            </div>
          ))}
        </div>
        <div className="shrink-0 mt-3">
          <ParsingPanel info={info} bgClass="bg-gray-50" />
        </div>
      </div>

      {/* Right: commentary, tracking the active verse */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <select value={commentaryId} onChange={e => setCommentaryId(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
            {commentaries.length === 0 && <option value="robertson">Robertson — Word Pictures in the NT</option>}
            {commentaries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {activeVerse != null && <span className="text-sm font-semibold text-gray-700">{anchor.name} {anchor.chapter}:{activeVerse}</span>}
        </div>
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-800 [&_p]:mb-2.5 [&_b]:font-semibold [&_b]:text-gray-900 [&_i]:italic">
          {html
            ? <div dangerouslySetInnerHTML={{ __html: html }} />
            : <p className="text-gray-400 italic">No commentary for this verse{activeVerse != null ? ` (${anchor.name} ${anchor.chapter}:${activeVerse})` : ''}.</p>}
        </div>
        {meta?.attribution && <p className="text-[11px] text-gray-400 mt-2">{meta.attribution}</p>}
      </div>
    </div>
  )
}
