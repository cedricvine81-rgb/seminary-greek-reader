'use client'
import { useState } from 'react'
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react'

interface Item {
  id: string
  title: string
  description?: string | null
  content?: string | null
  fileUrl?: string | null
  storagePath?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  weekNumber?: number | null
}

function humanSize(n?: number | null): string {
  if (!n) return ''
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function StudentMaterials({ items }: { items: Item[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

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

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 italic py-8 text-center">No materials have been shared with your courses yet.</p>
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {items.map(m => {
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
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50">
                  {busy === m.id ? <Loader2 size={14} className="animate-spin" /> : (m.storagePath ? <Download size={14} /> : <ExternalLink size={14} />)}
                  {m.storagePath ? 'Download' : 'Open'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
