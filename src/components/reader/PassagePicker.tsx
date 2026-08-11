'use client'
import { useEffect, useState } from 'react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { bookAbbrev } from '@/lib/i18n/book-names'
import { ChevronLeft, X } from 'lucide-react'
import type { BiblicalBook } from '@/types/biblical-text'

// Mobile-only visual passage selector: pick a book (grouped + colour-coded by canon
// section, SBL abbreviations), then a chapter, then a verse — each in a pane that slides
// in from the right. Emits an "{osisId} {chapter}:{verse}" reference the reader jumps to.

type ColorKey = 'blue' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'sky' | 'violet'

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
  // Hebrew (MT) osisIds that differ from the LXX book keys above.
  Josh: 'Josh', Judg: 'Judg', Esth: 'Esth', Dan: 'Dan',
  Job: 'Job', Ps: 'Ps', PsSol: 'Pss. Sol.', Prov: 'Prov', Eccl: 'Eccl', Song: 'Song', Wis: 'Wis', Sir: 'Sir',
  Isa: 'Isa', Jer: 'Jer', Lam: 'Lam', EpJer: 'Ep Jer', Bar: 'Bar', Sus: 'Sus', Ezek: 'Ezek', DanLXX: 'Dan', Bel: 'Bel',
  Hos: 'Hos', Joel: 'Joel', Amos: 'Amos', Obad: 'Obad', Jonah: 'Jonah', Mic: 'Mic', Nah: 'Nah', Hab: 'Hab',
  Zeph: 'Zeph', Hag: 'Hag', Zech: 'Zech', Mal: 'Mal',
  '1Macc': '1 Macc', '2Macc': '2 Macc', '3Macc': '3 Macc', '4Macc': '4 Macc', Odes: 'Odes',
}
// SBL is the English citation standard; a localized abbreviation wins where one exists, because
// this grid is a NAVIGATION aid rather than a citation — a Spanish student scans for "Mt", not
// "Matt". Falls back to SBL, then to the catalog's own abbreviation.
const sbl = (b: { osisId: string; abbrev: string }, locale: string) =>
  bookAbbrev(b.osisId, locale, SBL_ABBR[b.osisId] ?? b.abbrev)

// Each book's colour comes from its canon section; books are listed in canonical
// sequence within their heading (so colours vary down the list, but order is continuous).
const COLOR_OF: Record<string, ColorKey> = {
  // New Testament
  Matt: 'blue', Mark: 'blue', Luke: 'blue', John: 'blue',
  Acts: 'emerald',
  Rom: 'indigo', '1Cor': 'indigo', '2Cor': 'indigo', Gal: 'indigo', Eph: 'indigo', Phil: 'indigo', Col: 'indigo',
  '1Thess': 'indigo', '2Thess': 'indigo', '1Tim': 'indigo', '2Tim': 'indigo', Titus: 'indigo', Phlm: 'indigo',
  Heb: 'amber', Jas: 'amber', '1Pet': 'amber', '2Pet': 'amber', '1John': 'amber', '2John': 'amber', '3John': 'amber', Jude: 'amber',
  Rev: 'rose',
  // Old Testament
  Gen: 'sky', Exod: 'sky', Lev: 'sky', Num: 'sky', Deut: 'sky',
  JoshB: 'emerald', JudgB: 'emerald', Ruth: 'emerald', '1Sam': 'emerald', '2Sam': 'emerald', '1Kgs': 'emerald', '2Kgs': 'emerald',
  '1Chr': 'emerald', '2Chr': 'emerald', Ezra: 'emerald', Neh: 'emerald', EsthGr: 'emerald',
  Job: 'amber', Ps: 'amber', Prov: 'amber', Eccl: 'amber', Song: 'amber',
  Isa: 'violet', Jer: 'violet', Lam: 'violet', Ezek: 'violet', DanLXX: 'violet', Hos: 'violet', Joel: 'violet', Amos: 'violet',
  Obad: 'violet', Jonah: 'violet', Mic: 'violet', Nah: 'violet', Hab: 'violet', Zeph: 'violet', Hag: 'violet', Zech: 'violet', Mal: 'violet',
  // Hebrew (MT) osisIds that differ from the LXX book keys above.
  Josh: 'emerald', Judg: 'emerald', Esth: 'emerald', Dan: 'violet',
  // Deutero-Canonical
  '1Esd': 'emerald', Tob: 'emerald', Jdt: 'emerald', '1Macc': 'emerald', '2Macc': 'emerald', '3Macc': 'emerald', '4Macc': 'emerald',
  Wis: 'amber', Sir: 'amber', PsSol: 'amber', Odes: 'amber',
  Bar: 'violet', EpJer: 'violet', Sus: 'violet', Bel: 'violet',
}

const GROUPS: { headingKey: string; corpus: 'GNT' | 'LXX' | 'MT'; order: string[] }[] = [
  { headingKey: 'books.ot', corpus: 'LXX', order: ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'JoshB', 'JudgB', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'EsthGr', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'DanLXX', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal'] },
  { headingKey: 'books.deutero', corpus: 'LXX', order: ['1Esd', 'Tob', 'Jdt', '1Macc', '2Macc', '3Macc', '4Macc', 'Wis', 'Sir', 'PsSol', 'Odes', 'Bar', 'EpJer', 'Sus', 'Bel'] },
  { headingKey: 'books.nt', corpus: 'GNT', order: ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'] },
  // Hebrew Masoretic OT — the standard 39-book Hebrew canon (MT osisIds).
  { headingKey: 'books.hebrewBible', corpus: 'MT', order: ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal'] },
]

export function PassagePicker({ books, corpus, onPick, onClose }: {
  books: BiblicalBook[]
  corpus: 'GNT' | 'LXX' | 'MT'
  onPick: (ref: string) => void
  onClose: () => void
}) {
  const t = useT()
  const locale = useLocale()
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

  // Scope to the active corpus: MT and LXX share osisIds (both have "Gen"), so an
  // unscoped map would collide and the OT picker could fetch the wrong corpus's book.
  const byId = new Map(books.filter(b => b.corpus === corpus).map(b => [b.osisId, b]))
  function renderGroup(order: string[]) {
    const gBooks = order.map(id => byId.get(id)).filter((b): b is BiblicalBook => !!b)
    if (gBooks.length === 0) return null
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {gBooks.map(b => {
          const c = COLORS[COLOR_OF[b.osisId] ?? 'blue']
          return (
            <button key={b.osisId} type="button"
              onClick={() => { setBook(b); setChapter(null); setVerses(null) }}
              className={`rounded-lg border px-1 py-2 text-[13px] leading-tight font-medium bg-surface transition-colors ${c.btn}`}>
              {sbl(b, locale)}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] bg-surface flex flex-col lg:hidden">
      {/* Header / breadcrumb */}
      <div className="flex items-center gap-2 px-3 h-12 border-b border-gray-200 shrink-0">
        {step > 0 ? (
          <button type="button"
            onClick={() => { if (step === 2) { setChapter(null); setVerses(null) } else setBook(null) }}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 -ml-1 px-1 py-1">
            <ChevronLeft size={18} /> Back
          </button>
        ) : (
          <span className="text-sm font-semibold text-gray-800">Select {corpus === 'GNT' ? 'an NT' : corpus === 'MT' ? 'a Hebrew' : 'an LXX'} passage</span>
        )}
        <span className="ml-auto text-sm text-gray-500 truncate">
          {book ? `${sbl(book, locale)}${chapter ? ` ${chapter}` : ''}` : ''}
        </span>
        <button type="button" onClick={onClose} aria-label={t('action.close')} className="text-gray-400 -mr-1 p-1"><X size={18} /></button>
      </div>

      {/* Sliding panes: books → chapters → verses */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full transition-transform duration-300 ease-out"
          style={{ width: '300%', transform: `translateX(-${step * (100 / 3)}%)` }}>

          {/* Pane 1 — books, grouped OT / Deutero-Canonical / NT, each in canonical order */}
          <div className="w-1/3 h-full overflow-y-auto px-3 py-3">
            {GROUPS.filter(g => g.corpus === corpus).map(g => {
              const pane = renderGroup(g.order)
              if (!pane) return null
              return (
                <div key={g.headingKey} className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t(g.headingKey)}</p>
                  {pane}
                </div>
              )
            })}
            {books.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">{t('reader.loadingBooks')}</p>}
          </div>

          {/* Pane 2 — chapters */}
          <div className="w-1/3 h-full overflow-y-auto px-3 py-3">
            {book && (
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: book.totalChapters }, (_, i) => i + 1).map(ch => (
                  <button key={ch} type="button" onClick={() => setChapter(ch)}
                    className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 bg-surface hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors">
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
                    className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 bg-surface hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors">
                    {vn}
                  </button>
                ))}
              </div>
            )}
            {verses && verses.length === 0 && !loadingVerses && (
              <p className="text-sm text-gray-400 py-6 text-center">{t('reader.noVerses')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
