'use client'
import { useCallback, useEffect, useState } from 'react'
import { Folder, FileText, Download, ExternalLink, Loader2, ChevronRight } from 'lucide-react'

interface FolderItem { id: string; name: string; _count: { children: number; materials: number } }
interface FileItem {
  id: string; title: string; description?: string | null; content?: string | null
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
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

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

  async function open(id: string) {
    setBusy(id); setError('')
    try {
      const res = await fetch(`/api/materials/download?id=${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unavailable')
      window.open(data.url, '_blank', 'noopener')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open file')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center flex-wrap gap-1 text-sm">
        <button onClick={() => setFolderId(null)} className="text-gray-600 hover:text-gray-900 font-medium">Materials</button>
        {crumbs.map(c => (
          <span key={c.id} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-300" />
            <button onClick={() => setFolderId(c.id)} className="text-gray-600 hover:text-gray-900">{c.name}</button>
          </span>
        ))}
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
          {folders.map(f => (
            <button key={f.id} onClick={() => setFolderId(f.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-gray-50 text-left">
              <Folder size={18} className="text-amber-500 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900 truncate">{f.name}</span>
                <span className="block text-xs text-gray-400">{f._count.children} folder{f._count.children === 1 ? '' : 's'}, {f._count.materials} file{f._count.materials === 1 ? '' : 's'}</span>
              </span>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
          {files.map(m => {
            const downloadable = !!(m.storagePath || m.fileUrl)
            return (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-gray-50">
                <FileText size={18} className="text-brand-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                  {(m.description || m.content) && <p className="text-xs text-gray-500 truncate">{m.description || m.content}</p>}
                  {humanSize(m.sizeBytes) && <p className="text-xs text-gray-400">{humanSize(m.sizeBytes)}</p>}
                </div>
                {downloadable && (
                  <button onClick={() => open(m.id)} disabled={busy === m.id}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 shrink-0">
                    {busy === m.id ? <Loader2 size={14} className="animate-spin" /> : (m.storagePath ? <Download size={14} /> : <ExternalLink size={14} />)}
                    {m.storagePath ? 'Download' : 'Open'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
