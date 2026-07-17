'use client'

// A compact, grouped book grid (styled like the mobile Reader's passage picker) for the
// Master Search "Book" scope. Multi-select: click books to toggle them; the search then
// covers every selected book, so a range (e.g. the Gospels, or the Pentateuch) is just a
// few clicks. Each group header toggles its whole section (a one-click canon-range).

export interface PickBook { osisId: string; name: string; abbrev: string }
export interface BookGroup { heading: string; books: readonly PickBook[] }

export function BookPicker({ groups, selected, onToggle, onToggleGroup, onClear }: {
  groups: BookGroup[]
  selected: Set<string>
  onToggle: (osisId: string) => void
  onToggleGroup: (osisIds: string[], select: boolean) => void
  onClear: () => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-surface">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100">
        <span className="text-[11px] text-gray-500">
          {selected.size === 0 ? 'Searching all books' : `${selected.size} book${selected.size === 1 ? '' : 's'} selected`}
        </span>
        {selected.size > 0 && (
          <button type="button" onClick={onClear} className="text-[11px] text-brand-600 hover:underline">Clear</button>
        )}
      </div>
      <div className="p-2 max-h-[26vh] overflow-y-auto">
        {groups.map(g => {
          const ids = g.books.map(b => b.osisId)
          const allSel = ids.every(id => selected.has(id))
          return (
            <div key={g.heading} className="mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{g.heading}</p>
                <button type="button" onClick={() => onToggleGroup(ids, !allSel)}
                  className="text-[10px] text-brand-600 hover:underline">{allSel ? 'Clear' : 'Select all'}</button>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {g.books.map(b => {
                  const on = selected.has(b.osisId)
                  return (
                    <button key={b.osisId} type="button" onClick={() => onToggle(b.osisId)}
                      title={b.name}
                      className={`rounded-lg border px-0.5 py-1 text-[11px] leading-none font-medium transition-colors ${
                        on ? 'bg-brand-600 border-brand-600 text-white'
                           : 'bg-surface border-gray-200 text-gray-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700'}`}>
                      {b.abbrev}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
