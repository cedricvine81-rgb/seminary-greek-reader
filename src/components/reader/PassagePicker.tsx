'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import type { BiblicalBook } from '@/types/biblical-text'

// Mobile-only visual passage selector: pick a book (grouped + colour-coded by canon
// section, SBL abbreviations), then a chapter, then a verse — each in a pane that slides
// in from the right. Emits an "{osisId} {chapter}:{verse}" reference the reader jumps to.

type ColorKey = 'blue' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'sky' | 'violet'
interface Section { label: string; color: ColorKey; ids: string[] }

// Full literal class strings so Tailwind keeps them.
const COLORS: Record<ColorKey, { btn: string; head: string }> = {
  blue:    { btn: 'border-blue-200 text-blue-700 hover:bg-blue-50',       head: 'text-blue-600' },
  emerald: { btn: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50', head: 'text-emerald-600' },
  indigo:  { btn: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50',  head: 'text-indigo-600' },
  amber:   { btn: 'border-amber-200 text-amber-700 hover:bg-amber-50',     head: 'text-amber-600' },
  rose:    { btn: 'border-rose-200 text-rose-700 hover:bg-rose-50',        head: 'text-rose-600' },
  sky:     { btn: 'border-sky-200 text-sky-700 hover:bg-sky-50',           head: 'text-sky-600' },
  violet:  { btn: 'border-violet-200 text-violet-700 hover:bg-violet-50',  head: 'text-violet-600' },
}

// SBL Handbook of Style book abbreviations, keyed by the app's osisId.
const SBL_ABBR: Record<string, string> = {
  Matt: 'Matt', Mark: 'Mark', Luke: 'Luke', John: 'John', Acts: 'Acts',
  Rom: 'Rom', '1Cor': '1 Cor', '2Cor': '2 Cor', Gal: 'Gal', Eph: 'Eph', Phil: 'Phil', Col: 'Col',
  '1Thess': '1 Thess', '2Thess': '2 Thess', '1Tim': '1 Tim', '2Tim': '2 Tim', Titus: 'Titus', Phlm: 'Phlm',
  Heb: 'Heb', Jas: 'Jas', '1Pet': '1 Pet', '2Pet': '2 Pet', '1John': '1 John', '2John': '2 John', '3John': '3 John', Jude: 'Jude', Rev: 'Rev',
  Gen: 'Gen', Exod: 'Exod', Lev: 'Lev', Num: 'Num', Deut: 'Deut',
  JoshB: 'Josh', JudgB: 'Judg', Ruth: 'Ruth', '1Sam': '1 Sam', '2Sam': '2 Sam', '1Kgs': '1 Kgs', '2Kgs': '2 Kgs',
  '1Chr': '1 Chr', '2Chr': '2 Chr', Ezra: 'Ezra', Neh: 'Neh', '1Esd': '1 Esd', Tob: 'Tob', Jdt: 'Jdt', EsthGr: 'Add Esth',
  Job: 'Job', Ps: 'Ps', PsSol: 'Pss. Sol.', Prov: 'Prov', Eccl: 'Eccl', Song: 'Song', Wis: 'Wis', Sir: 'Sir',
  Isa: 'Isa', Jer: 'Jer', Lam: 'Lam', EpJer: 'Ep Jer', Bar: 'Bar', Sus: 'Sus', Ezek: 'Ezek', DanLXX: 'Dan', Bel: 'Bel',
  Hos: 'Hos', Joel: 'Joel', Amos: 'Amos', Obad: 'Obad', Jonah: 'Jonah', Mic: 'Mic', Nah: 'Nah', Hab: 'Hab',
  Zeph: 'Zeph', Hag: 'Hag', Zech: 'Zech', Mal: 'Mal',
  '1Macc': '1 Macc', '2Macc': '2 Macc', '3Macc': '3 Macc', '4Macc': '4 Macc', Odes: 'Odes',
}
const sbl = (b: { osisId: string; abbrev: string }) => SBL_ABBR[b.osisId] ?? b.abbrev

const NT_SECTIONS: Section[] = [
  { label: 'Gospels',          color: 'blue',    ids: ['Matt', 'Mark', 'Luke', 'John'] },
  { label: 'History',          color: 'emerald', ids: ['Acts'] },
  { label: 'Pauline Epistles', color: 'indigo',  ids: ['Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm'] },
  { label: 'General Epistles', color: 'amber',   ids: ['Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude'] },
  { label: 'Apocalypse',       color: 'rose',    ids: ['Rev'] },
]
const OT_SECTIONS: Section[] = [
  { label: 'Law',             color: 'sky',     ids: ['Gen', 'Exod', 'Lev', 'Num', 'Deut'] },
  { label: 'History',         color: 'emerald', ids: ['JoshB', 'JudgB', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', '1Esd', 'Tob', 'Jdt', 'EsthGr', '1Macc', '2Macc', '3Macc', '4Macc'] },
  { label: 'Wisdom & Poetry', color: 'amber',   ids: ['Job', 'Ps', 'PsSol', 'Prov', 'Eccl', 'Song', 'Wis', 'Sir', 'Odes'] },
  { label: 'Prophets',        color: 'violet',  ids: ['Isa', 'Jer', 'Lam', 'EpJer', 'Bar', 'Sus', 'Ezek', 'DanLXX', 'Bel', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal'] },
]

export function PassagePicker({ books, onPick, onClose }: {
  books: BiblicalBook[]
  onPick: (ref: string) => void
  onClose: () => void
}) {
  const [book, setBook] = useState<BiblicalBook | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<number[] | null>(null)
  const [loadingVerses, setLoadingVerses] = useState(false)

  const step = chapter ? 2 : book ? 1 : 0

  // Fetch the chosen chapter's verse numbers so we can show a button per verse.
  useEffect(() => {
    if (!book || !chapter) return
    let alive = true
    setLoadingVerses(true); setVerses(null)
    fetch(`/data/${book.corpus.toLowerCase()}/${book.osisId}_${chapter}.json`)
      .then(r => (r.ok ? r.json() : { verses: [] }))
      .then((d: { verses?: { verse: number }[] }) => { if (alive) setVerses((d.verses ?? []).map(v => v.verse)) })
      .catch(() => { if (alive) setVerses([]) })
      .finally(() => { if (alive) setLoadingVerses(false) })
    return () => { alive = false }
  }, [book, chapter])

  const byId = new Map(books.map(b => [b.osisId, b]))
  function renderSections(sections: Section[]) {
    return sections.map(sec => {
      const secBooks = sec.ids.map(id => byId.get(id)).filter((b): b is BiblicalBook => !!b)
      if (secBooks.length === 0) return null
      const c = COLORS[sec.color]
      return (
        <div key={sec.label} className="mb-4">
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${c.head}`}>{sec.label}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {secBooks.map(b => (
              <button key={b.osisId} type="button"
                onClick={() => { setBook(b); setChapter(null); setVerses(null) }}
                className={`rounded-lg border px-1 py-2 text-[13px] leading-tight font-medium bg-white transition-colors ${c.btn}`}>
                {sbl(b)}
              </button>
            ))}
          </div>
        </div>
      )
    })
  }

  const hasNT = books.some(b => b.corpus === 'GNT')
  const hasOT = books.some(b => b.corpus === 'LXX')

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col lg:hidden">
      {/* Header / breadcrumb */}
      <div className="flex items-center gap-2 px-3 h-12 border-b border-gray-200 shrink-0">
        {step > 0 ? (
          <button type="button"
            onClick={() => { if (step === 2) { setChapter(null); setVerses(null) } else setBook(null) }}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 -ml-1 px-1 py-1">
            <ChevronLeft size={18} /> Back
          </button>
        ) : (
          <span className="text-sm font-semibold text-gray-800">Select a passage</span>
        )}
        <span className="ml-auto text-sm text-gray-500 truncate">
          {book ? `${sbl(book)}${chapter ? ` ${chapter}` : ''}` : ''}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 -mr-1 p-1"><X size={18} /></button>
      </div>

      {/* Sliding panes: books → chapters → verses */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full transition-transform duration-300 ease-out"
          style={{ width: '300%', transform: `translateX(-${step * (100 / 3)}%)` }}>

          {/* Pane 1 — books */}
          <div className="w-1/3 h-full overflow-y-auto px-3 py-3">
            {hasNT && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">New Testament</p>
                {renderSections(NT_SECTIONS)}
              </>
            )}
            {hasOT && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 mt-1">Old Testament (Septuagint)</p>
                {renderSections(OT_SECTIONS)}
              </>
            )}
            {books.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">Loading books…</p>}
          </div>

          {/* Pane 2 — chapters */}
          <div className="w-1/3 h-full overflow-y-auto px-3 py-3">
            {book && (
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: book.totalChapters }, (_, i) => i + 1).map(ch => (
                  <button key={ch} type="button" onClick={() => setChapter(ch)}
                    className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors">
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pane 3 — verses */}
          <div className="w-1/3 h-full overflow-y-auto px-3 py-3">
            {loadingVerses && <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>}
            {verses && verses.length > 0 && (
              <div className="grid grid-cols-5 gap-1.5">
                {verses.map(vn => (
                  <button key={vn} type="button"
                    onClick={() => { if (book && chapter) onPick(`${book.osisId} ${chapter}:${vn}`) }}
                    className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors">
                    {vn}
                  </button>
                ))}
              </div>
            )}
            {verses && verses.length === 0 && !loadingVerses && (
              <p className="text-sm text-gray-400 py-6 text-center">No verses found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
