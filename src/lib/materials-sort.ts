// Shared client-side ordering for the materials views. Folders and files are each
// sorted with the same comparator (callers keep folders grouped above files).
export type MaterialSort = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'

export const SORT_OPTIONS: { value: MaterialSort; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
]

export function sortMaterials<T extends { name?: string; title?: string; createdAt?: string }>(
  arr: T[], sort: MaterialSort,
): T[] {
  const [key, dir] = sort.split('-') as ['name' | 'date', 'asc' | 'desc']
  const mul = dir === 'asc' ? 1 : -1
  return [...arr].sort((a, b) => {
    if (key === 'name') {
      const an = (a.name ?? a.title ?? '').toLowerCase()
      const bn = (b.name ?? b.title ?? '').toLowerCase()
      return an.localeCompare(bn) * mul
    }
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return (at - bt) * mul
  })
}
