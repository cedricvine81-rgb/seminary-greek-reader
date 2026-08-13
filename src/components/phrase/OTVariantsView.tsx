'use client'
/* ─────────────────────────────────────────────
   Variants for the OLD TESTAMENT — a versional comparison.

   The NT tab collates manuscripts (CNTR). Nothing comparable exists for
   the OT in the public domain in structured form: the BHS/BHQ apparatus
   is copyrighted, and the great PD collations (Kennicott, de Rossi) are
   scanned books. But OT textual criticism is TAUGHT versionally first —
   MT beside the ancient versions — and those versions are already in the
   app. So this view sets, verse by verse:

     MT (WLC, Hebrew) ‖ LXX (Greek) ‖ Targum (English, where embedded) ‖ WEB

   The columns pair by verse NUMBER. For most books that is content
   alignment too; for the books where LXX versification diverges (Psalms,
   Jeremiah, Job, Esther, Daniel) a visible caveat says so rather than
   letting rows silently mislead.
───────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { matchProseCitation, type ProseChapter } from '@/lib/prose-texts'
import { HebrewVerse, HEBREW_LAYER } from '@/components/reader/HebrewVerse'
import { GreekVerse } from '@/components/reader/GreekVerse'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { loadHebrewLexicon, type HebrewLexicon } from '@/lib/hebrew-lexicon'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { openWordSearch } from '@/lib/word-search-bus'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { wordAtPoint, EDGE_PUNCT } from '@/lib/word-at-point'
import type { BiblicalVerse } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { FONT_SIZE_MAP, FONT_SIZES, type PhraseFontSize } from './PhraseExplorer'

interface VRow { verse: number; mtV?: BiblicalVerse; lxxV?: BiblicalVerse; tg?: string; en?: string }
interface SpNote { sp?: string; note: string; source: string }

// osisId → targum citation prefix (resolved through the prose registry, so the work's
// own parser finds the right embedded text).
const TARGUM: Record<string, string> = {
  Gen: 'Tg. Ps.-J. Gen', Exod: 'Tg. Ps.-J. Exod', Lev: 'Tg. Ps.-J. Lev',
  Num: 'Tg. Ps.-J. Num', Deut: 'Tg. Ps.-J. Deut', Isa: 'Tg. Isa.',
}
// LXX versification diverges enough in these books that number-pairing is not
// content-pairing. Say so; never silently mislead.
const VERSIFICATION_DIVERGES = new Set(['Ps', 'Jer', 'Job', 'Esth', 'Dan'])

const ATTRIBUTION =
  'Hebrew: Westminster Leningrad Codex (public domain). Greek: Septuagint, public-domain edition as carried by the Reader. ' +
  'Targums: Etheridge (Pseudo-Jonathan) / Pauli (Isaiah), public domain. English: World English Bible. ' +
  'A manuscript apparatus for the OT (BHS/BHQ) is under copyright and is not reproduced here.'

export function OTVariantsView({ osis, name, chapter, verseStart, verseEnd, isAuthenticated = false, fontSize = 'lg', onAttribution }: {
  osis: string
  name: string
  chapter: number
  verseStart: number
  verseEnd: number
  isAuthenticated?: boolean
  fontSize?: PhraseFontSize
  onAttribution?: (a: string) => void
}) {
  const t = useT()
  const [rows, setRows] = useState<VRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tgAttrib, setTgAttrib] = useState('')
  // Curated Samaritan Pentateuch readings — OUR OWN transcriptions from the public-domain
  // von Gall edition (see docs/sp-permission-request.md for why the full text is blocked).
  const [spNotes, setSpNotes] = useState<Record<string, SpNote>>({})
  const [spAttrib, setSpAttrib] = useState('')
  // Parsing pane, exactly as the Reader and Commentary have it: hover previews, click pins.
  // The MT column parses against the Hebrew lexicon; the LXX column against the Greek data
  // its corpus already carries.
  const [hebrewLex, setHebrewLex] = useState<HebrewLexicon | null>(null)
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  const [hoverInfo, setHoverInfo] = useState<LexicalInfoPanel | null>(null)
  useEffect(() => { loadHebrewLexicon().then(setHebrewLex).catch(() => {}) }, [])
  const reqRef = useRef(0)
  // Notes / highlights / right-click search — the same wiring every reading pane has
  // (CommentaryView is the pattern). MT column highlights live on the Hebrew layer,
  // LXX on 'grc': both shared with the Reader, so marks made here show there too.
  const scrollRef = useRef<HTMLDivElement>(null)
  const highlights = useHighlights(isAuthenticated)
  const highlightSelection = useHighlightSelection(scrollRef)
  const [notedKeys, setNotedKeys] = useState<Set<number>>(new Set())
  const loadNoted = useCallback(async () => {
    if (!isAuthenticated) { setNotedKeys(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(osis)}&chapter=${chapter}&verseStart=1&verseEnd=500`)
      const d = await r.json()
      setNotedKeys(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* leave as-is */ }
  }, [isAuthenticated, osis, chapter])
  useEffect(() => { void loadNoted() }, [loadNoted])
  useEffect(() => onNotesChanged(() => void loadNoted()), [loadNoted])
  // Right-click on the English columns (Targum / WEB): search the word under the cursor,
  // or the selection when one exists.
  const onEnglishContextMenu = useCallback((verse: number) => (e: React.MouseEvent<HTMLParagraphElement>) => {
    const sel = window.getSelection()
    let word = sel && !sel.isCollapsed ? sel.toString().trim() : ''
    if (!word) word = wordAtPoint(e.clientX, e.clientY)
    word = word.replace(EDGE_PUNCT, '').trim()
    if (!word) return
    e.preventDefault()
    openWordSearch({ x: e.clientX, y: e.clientY, surface: word, reference: `${name} ${chapter}:${verse}`, kind: 'translation', transLang: 'en', book: osis })
  }, [name, chapter, osis])

  useEffect(() => { onAttribution?.([ATTRIBUTION, tgAttrib, spAttrib].filter(Boolean).join(' ')) }, [onAttribution, tgAttrib, spAttrib])

  useEffect(() => {
    fetch('/data/sp-notable.json').then(r => r.json())
      .then((d: { attribution?: string; entries?: Record<string, Record<string, SpNote>> }) => {
        setSpNotes(d.entries?.[osis] ?? {})
        if (d.attribution) setSpAttrib(d.attribution)
      }).catch(() => {})
  }, [osis])

  useEffect(() => {
    const id = ++reqRef.current
    setLoading(true)
    const targum = TARGUM[osis] ? matchProseCitation(`${TARGUM[osis]} ${chapter}:1`) : null

    Promise.all([
      fetch(`/api/reader?book=${osis}&chapter=${chapter}&corpus=MT`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/reader?book=${osis}&chapter=${chapter}&corpus=LXX`).then(r => r.json()).catch(() => ({})),
      targum
        ? fetch(targum.work.dataUrl).then(r => r.json()).catch(() => ({}))
        : Promise.resolve({}),
      fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=en`).then(r => r.json()).catch(() => ({})),
    ]).then(([mt, lxx, tg, en]: [
      { verses?: BiblicalVerse[] },
      { verses?: BiblicalVerse[] },
      { attribution?: string; chapters?: ProseChapter[] },
      { verses?: Record<string, string> },
    ]) => {
      if (id !== reqRef.current) return
      const byVerse = new Map<number, VRow>()
      const row = (v: number) => {
        let r = byVerse.get(v)
        if (!r) { r = { verse: v }; byVerse.set(v, r) }
        return r
      }
      for (const v of mt.verses ?? []) if (v.verse >= verseStart && v.verse <= verseEnd) row(v.verse).mtV = v
      for (const v of lxx.verses ?? []) if (v.verse >= verseStart && v.verse <= verseEnd) row(v.verse).lxxV = v
      const tgCh = (tg.chapters ?? []).find(c => c.number === chapter)
      if (tg.attribution) setTgAttrib(tg.attribution)
      for (const vv of tgCh?.verses ?? []) if (vv.number >= verseStart && vv.number <= verseEnd) row(vv.number).tg = vv.text
      for (const [k, text] of Object.entries(en.verses ?? {})) {
        const vn = parseInt(k.split('.').pop() ?? '', 10)
        if (vn >= verseStart && vn <= verseEnd) row(vn).en = text
      }
      setRows(Array.from(byVerse.values()).sort((a, b) => a.verse - b.verse))
      setLoading(false)
    })
  }, [osis, chapter, verseStart, verseEnd])

  // The size control drives BOTH original-language columns; Hebrew takes one step more than
  // the Greek beside it, since its vowel points carry meaning and vanish first when small.
  const greekFs = FONT_SIZE_MAP[fontSize]
  const hebrewFs = FONT_SIZE_MAP[FONT_SIZES[Math.min(FONT_SIZES.indexOf(fontSize) + 1, FONT_SIZES.length - 1)]]
  const hasTg = !!TARGUM[osis]
  const cols = hasTg ? 'lg:grid-cols-4' : 'lg:grid-cols-3'

  return (
    <div className="h-full flex flex-col min-h-0">
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 pb-4">
      <div className="mb-3 mt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {t('var.ot.header')} — {name} {chapter}:{verseStart}{verseEnd !== verseStart ? `–${verseEnd}` : ''}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 max-w-3xl">{t('var.ot.intro')}</p>
        {VERSIFICATION_DIVERGES.has(osis) && (
          <p className="mt-1.5 inline-block rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
            {t('var.ot.versification', { name })}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 mt-6 text-center">{t('var.ot.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 mt-6 text-center">{t('var.ot.noText')}</p>
      ) : (
        <div className="space-y-3">
          {/* Column headers (desktop) */}
          <div className={`hidden lg:grid ${cols} gap-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 px-3`}>
            <span>{t('var.ot.colMT')}</span>
            <span>{t('var.ot.colLXX')}</span>
            {hasTg && <span>{t('var.ot.colTargum')}</span>}
            <span>{t('var.ot.colWEB')}</span>
          </div>
          {rows.map(r => (
            <div key={r.verse} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-1 mb-1.5">
                {isAuthenticated && (
                  <span className="print:hidden"><VerseNoteButton book={osis} chapter={chapter} verse={r.verse}
                    noted={notedKeys.has(r.verse)} onChanged={loadNoted} /></span>
                )}
                <p className="text-[11px] font-semibold text-brand-600">{name} {chapter}:{r.verse}</p>
              </div>
              <div className={`grid grid-cols-1 ${cols} gap-3`}>
                <div className="leading-relaxed text-gray-900" style={{ '--greek-fs': hebrewFs, fontSize: hebrewFs } as React.CSSProperties}>
                  {r.mtV
                    ? <HebrewVerse verse={r.mtV} activeWordId={null} highlighted={false} lexicon={hebrewLex}
                        textHighlights={highlights.forVerse(osis, chapter, r.verse, HEBREW_LAYER)}
                        onWordHover={(_id, hi) => setHoverInfo(hi)}
                        onWordClick={i => { setInfo(i); setHoverInfo(null) }}
                        onWordRightClick={(word, x, y, start, end) => {
                          const existing = highlights.forVerse(osis, chapter, r.verse, HEBREW_LAYER).find(h => start < h.endOffset && end > h.startOffset)
                          openWordSearch({ x, y, surface: word.surface, reference: `${name} ${chapter}:${r.verse}`, kind: 'hebrew',
                            highlight: isAuthenticated ? {
                              activeColor: existing?.color ?? null,
                              onPick: c => existing ? void highlights.recolor(existing.id, osis, chapter, c) : void highlights.create(osis, chapter, r.verse, start, end, c, HEBREW_LAYER),
                              onRemove: () => { if (existing) void highlights.remove(existing.id, osis, chapter) },
                            } : undefined })
                        }} />
                    : <span className="font-sans text-xs text-gray-300 italic">—</span>}
                </div>
                <div className="leading-relaxed text-gray-800" style={{ '--greek-fs': greekFs, fontSize: greekFs } as React.CSSProperties}>
                  {r.lxxV
                    ? <GreekVerse verse={r.lxxV} activeWordId={null} highlighted={false}
                        textHighlights={highlights.forVerse(osis, chapter, r.verse, 'grc')}
                        onWordHover={(_id, hi) => setHoverInfo(hi)}
                        onWordClick={i => { setInfo(i); setHoverInfo(null) }}
                        onWordRightClick={(word, x, y, start, end) => {
                          const existing = highlights.forVerse(osis, chapter, r.verse, 'grc').find(h => start < h.endOffset && end > h.startOffset)
                          openWordSearch({ x, y, surface: word.surface, lemma: word.lexeme?.lexeme ?? null, reference: `${name} ${chapter}:${r.verse}`, kind: 'greek', greekCorpus: 'LXX', book: osis,
                            highlight: isAuthenticated ? {
                              activeColor: existing?.color ?? null,
                              onPick: c => existing ? void highlights.recolor(existing.id, osis, chapter, c) : void highlights.create(osis, chapter, r.verse, start, end, c, 'grc'),
                              onRemove: () => { if (existing) void highlights.remove(existing.id, osis, chapter) },
                            } : undefined })
                        }} />
                    : <span className="font-sans text-xs text-gray-300 italic">{t('var.ot.noLXX')}</span>}
                </div>
                {hasTg && <p className="font-reading text-sm leading-relaxed text-gray-700" onContextMenu={r.tg ? onEnglishContextMenu(r.verse) : undefined}>{r.tg ?? <span className="text-xs text-gray-300 italic">—</span>}</p>}
                <p className="font-reading text-sm leading-relaxed text-gray-700" onContextMenu={r.en ? onEnglishContextMenu(r.verse) : undefined}>{r.en ?? <span className="text-xs text-gray-300 italic">—</span>}</p>
              </div>
              {(() => {
                const sn = spNotes[`${chapter}:${r.verse}`]
                if (!sn) return null
                return (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">{t('var.ot.spNotable')}</p>
                    {sn.sp && <p dir="rtl" lang="he" className="font-hebrew text-lg leading-relaxed text-gray-900 mt-1">{sn.sp}</p>}
                    <p className="text-xs leading-relaxed text-amber-900 mt-1">{sn.note}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">{sn.source} — {t('var.ot.spTranscription')}</p>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
    <div className="shrink-0 mt-2 px-1">
      <ResizableParsingPane storageKey="ot-variants" info={hoverInfo ?? info} bgClass="bg-gray-50" />
    </div>
    {isAuthenticated && highlightSelection.popup && (
      <HighlightPopup
        state={highlightSelection.popup}
        onPick={color => {
          const state = highlightSelection.popup!
          if (state.kind === 'new') for (const s of state.splits) void highlights.create(s.book, s.chapter, s.verse, s.start, s.end, color, s.layer)
          else void highlights.recolor(state.id, state.book, state.chapter, color)
          highlightSelection.close()
        }}
        onRemove={() => {
          const state = highlightSelection.popup!
          if (state.kind === 'edit') void highlights.remove(state.id, state.book, state.chapter)
          highlightSelection.close()
        }}
        onClose={highlightSelection.close}
      />
    )}
    </div>
  )
}
