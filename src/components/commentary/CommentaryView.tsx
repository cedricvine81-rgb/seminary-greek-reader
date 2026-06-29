'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GreekVerse } from '@/components/reader/GreekVerse'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import { useCommentaryFontScale, useCommentaryLineSpacing } from '@/lib/note-prefs'
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
export function CommentaryView({ anchor, onAttribution }: { anchor: NoteAnchor | null; onAttribution?: (a: string | null) => void }) {
  const [verses, setVerses] = useState<BiblicalVerse[]>([])
  const [activeVerse, setActiveVerse] = useState<number | null>(null)
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  const [commentaries, setCommentaries] = useState<CommentaryMeta[]>([])
  const [commentaryId, setCommentaryId] = useState('robertson')
  const [verseMap, setVerseMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  // Greek edition shown alongside the commentary. Nestle 1904 = NA1904, Tischendorf 8th = GNT.
  const [gntEdition, setGntEdition] = useState<'nestle1904' | 'tischendorf'>('nestle1904')
  // The three-dot text-settings menu (font size / line spacing / copyright) is hoisted
  // up into the shared exegesis tools menu — this still needs the live values to style
  // its own text, kept in sync with that menu via the shared localStorage-backed hooks.
  const [fontScale] = useCommentaryFontScale()
  const [lineSpacing] = useCommentaryLineSpacing()
  const scrollRef = useRef<HTMLDivElement>(null)
  const verseEls = useRef<Map<number, HTMLElement>>(new Map())

  // Registry of available commentaries.
  useEffect(() => {
    fetch('/data/commentary/index.json').then(r => r.json()).then(d => {
      const list: CommentaryMeta[] = d.commentaries ?? []
      setCommentaries(list)
      if (list.length && !list.some(c => c.id === commentaryId)) setCommentaryId(list[0].id)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Greek text for the passage (Nestle 1904 or Tischendorf, per the dropdown).
  useEffect(() => {
    if (!anchor) { setVerses([]); setActiveVerse(null); return }
    setLoading(true); setInfo(null)
    const corpus = gntEdition === 'nestle1904' ? 'NA1904' : 'GNT'
    fetch(`/api/reader?corpus=${corpus}&book=${anchor.book}&chapter=${anchor.chapter}`)
      .then(r => r.json())
      .then(d => {
        const vs: BiblicalVerse[] = (d.verses ?? []).filter((v: BiblicalVerse) => v.verse >= anchor.verseStart && v.verse <= anchor.verseEnd)
        setVerses(vs); setActiveVerse(vs[0]?.verse ?? anchor.verseStart)
      }).catch(() => setVerses([])).finally(() => setLoading(false))
  }, [anchor?.book, anchor?.chapter, anchor?.verseStart, anchor?.verseEnd, gntEdition]) // eslint-disable-line react-hooks/exhaustive-deps

  // Commentary text for the current book + selected commentary.
  useEffect(() => {
    if (!anchor) { setVerseMap({}); return }
    fetch(`/data/commentary/${commentaryId}/${anchor.book}.json`)
      .then(r => (r.ok ? r.json() : {})).then(setVerseMap).catch(() => setVerseMap({}))
  }, [commentaryId, anchor?.book]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-tracking: whichever verse sits nearest the top of the Greek pane becomes
  // active, so the commentary follows as you scroll (clicking a verse still works).
  useEffect(() => {
    const root = scrollRef.current
    if (!root || verses.length === 0) return
    const tops = new Map<number, number>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const v = Number((e.target as HTMLElement).dataset.verse)
        if (e.isIntersecting) tops.set(v, e.boundingClientRect.top)
        else tops.delete(v)
      }
      let pick: number | null = null, best = Infinity
      tops.forEach((t, v) => { if (t < best) { best = t; pick = v } })
      if (pick != null) setActiveVerse(pick)
    }, { root, rootMargin: '0px 0px -65% 0px', threshold: 0 })
    verseEls.current.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [verses])

  // Report the selected commentary's attribution up so the hoisted tools menu can
  // show the "Copyright" subheading without needing the commentary list itself.
  const meta = commentaries.find(c => c.id === commentaryId)
  useEffect(() => { onAttribution?.(meta?.attribution ?? null) }, [meta?.attribution, onAttribution])

  if (!anchor) return <p className="text-sm text-gray-400 italic py-10 text-center">Enter a passage above to read the commentary.</p>

  const html = activeVerse != null ? verseMap[`${anchor.chapter}:${activeVerse}`] : undefined

  return (
    <div className="grid lg:grid-cols-2 gap-4 h-full min-h-0">
      {/* Left: Greek text (scrolls) + parsing box (fixed, bottom-left) */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Greek</span>
          <select value={gntEdition} onChange={e => setGntEdition(e.target.value as 'nestle1904' | 'tischendorf')}
            title="Choose the Greek edition"
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="nestle1904">Nestle 1904</option>
            <option value="tischendorf">Tischendorf 8th</option>
          </select>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-1.5"
          style={{ '--greek-fs': `${1.125 * fontScale}rem`, '--greek-lh': lineSpacing } as CSSProperties}>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : verses.map(v => (
            <div key={v.id} data-verse={v.verse}
              ref={el => { if (el) verseEls.current.set(v.verse, el); else verseEls.current.delete(v.verse) }}
              onClick={() => setActiveVerse(v.verse)}
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
        </div>
        <div
          style={{ fontSize: `${0.875 * fontScale}rem`, lineHeight: lineSpacing }}
          className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 text-ink-900 [&_p]:mb-2.5 [&_b]:font-semibold [&_b]:text-ink-900 [&_i]:italic"
        >
          {html
            ? <div dangerouslySetInnerHTML={{ __html: html }} />
            : <p className="text-gray-400 italic">No commentary for this verse{activeVerse != null ? ` (${anchor.name} ${anchor.chapter}:${activeVerse})` : ''}.</p>}
        </div>
      </div>
    </div>
  )
}
