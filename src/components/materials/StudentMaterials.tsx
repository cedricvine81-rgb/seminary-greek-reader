'use client'
import { useCallback, useEffect, useState } from 'react'
import { Folder, FileText, Download, ExternalLink, Loader2, ChevronRight } from 'lucide-react'
import { sortMaterials, SORT_OPTIONS, type MaterialSort } from '@/lib/materials-sort'

interface FolderItem { id: string; name: string; createdAt: string; _count: { children: number; materials: number } }
interface FileItem {
  id: string; title: string; createdAt: string; description?: string | null; content?: string | null
  fileUrl?: string | null; storagePath?: string | null; sizeBytes?: number | null
}
interface Crumb { id: string; name: string }

function humanSize(n?: number | null): string {
  if (!n) return ''
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

// Read-only mirror of the instructor's library — students browse the same folder
// structure, limited to what's shared with their courses, and download files.
export function StudentMaterials() {
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<MaterialSort>('name-asc')

  useEffect(() => {
    const saved = localStorage.getItem('student-materials-sort') as MaterialSort | null
    if (saved && SORT_OPTIONS.some(o => o.value === saved)) setSort(saved)
  }, [])
  useEffect(() => { localStorage.setItem('student-materials-sort', sort) }, [sort])

  const load = useCallback(async (id: string | null) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/materials/browse?folderId=${id ?? ''}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setFolders(data.folders); setFiles(data.files); setCrumbs(data.breadcrumb ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(folderId) }, [folderId, load])

  return (
    <div className="space-y-4">
      {/* Breadcrumb + sort */}
      <div className="flex items-center flex-wrap gap-1 text-sm">
        <button onClick={() => setFolderId(null)} className="text-gray-600 hover:text-gray-900 font-medium">Materials</button>
        {crumbs.map(c => (
          <span key={c.id} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-300" />
            <button onClick={() => setFolderId(c.id)} className="text-gray-600 hover:text-gray-900">{c.name}</button>
          </span>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
          Sort
          <select value={sort} onChange={e => setSort(e.target.value as MaterialSort)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center"><Loader2 size={16} className="inline animate-spin" /> Loading…</p>
      ) : folders.length === 0 && files.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-8 text-center">
          {folderId ? 'This folder is empty.' : 'No materials have been shared with your courses yet.'}
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {sortMaterials(folders, sort).map(f => (
            <button key={f.id} onClick={() => setFolderId(f.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-surface hover:bg-gray-50 text-left">
              <Folder size={18} className="text-amber-500 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900 truncate">{f.name}</span>
                <span className="block text-xs text-gray-400">{f._count.children} folder{f._count.children === 1 ? '' : 's'}, {f._count.materials} file{f._count.materials === 1 ? '' : 's'}</span>
              </span>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
          {sortMaterials(files, sort).map(m => {
            const downloadable = !!(m.storagePath || m.fileUrl)
            const inner = (
              <>
                <FileText size={18} className="text-brand-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                  {(m.description || m.content) && <p className="text-xs text-gray-500 truncate">{m.description || m.content}</p>}
                  {humanSize(m.sizeBytes) && <p className="text-xs text-gray-400">{humanSize(m.sizeBytes)}</p>}
                </div>
                {downloadable && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 shrink-0">
                    {m.storagePath ? <Download size={14} /> : <ExternalLink size={14} />}
                    {m.storagePath ? 'Download' : 'Open'}
                  </span>
                )}
              </>
            )
            // The whole row is the link, so clicking the name (not just the icon) opens it.
            return downloadable ? (
              <a key={m.id} href={`/api/materials/download?id=${m.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 bg-surface hover:bg-gray-50">{inner}</a>
            ) : (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface">{inner}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
