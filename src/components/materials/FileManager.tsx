'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MATERIALS_BUCKET } from '@/lib/storage'
import { sortMaterials, SORT_OPTIONS, type MaterialSort } from '@/lib/materials-sort'
import { Button } from '@/components/ui/Button'
import {
  Folder, FileText, Upload, FolderPlus, FolderUp, Trash2, Share2,
  ChevronRight, Loader2, X, Check,
} from 'lucide-react'

interface Course { id: string; name: string }
interface Share { courseId: string }
interface FolderItem { id: string; name: string; createdAt: string; shares: Share[]; _count: { children: number; materials: number } }
interface FileItem { id: string; title: string; createdAt: string; originalName: string | null; mimeType: string | null; sizeBytes: number | null; storagePath: string | null; fileUrl: string | null; shares: Share[] }
interface Crumb { id: string; name: string }
// Minimal shape of the non-standard FileSystem entries API used for folder drops.
interface FsEntry {
  isFile: boolean
  isDirectory: boolean
  name: string
  file?: (cb: (f: File) => void, err?: () => void) => void
  createReader?: () => { readEntries: (cb: (e: FsEntry[]) => void, err?: () => void) => void }
}

const MAX_MB = 50

function humanSize(n: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function FileManager({ courses }: { courses: Course[] }) {
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string>('')        // progress text while uploading
  const [error, setError] = useState('')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [share, setShare] = useState<{ type: 'file' | 'folder'; id: string; name: string; courseIds: Set<string> } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [sort, setSort] = useState<MaterialSort>('name-asc')

  // Remember the chosen order across sessions.
  useEffect(() => {
    const saved = localStorage.getItem('materials-sort') as MaterialSort | null
    if (saved && SORT_OPTIONS.some(o => o.value === saved)) setSort(saved)
  }, [])
  useEffect(() => { localStorage.setItem('materials-sort', sort) }, [sort])

  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async (id: string | null) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/materials/list?folderId=${id ?? ''}`)
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

  /* ── Uploads ────────────────────────────────────────────── */

  // Upload one File's bytes directly to Supabase, then record the DB row.
  async function uploadOne(file: File, targetFolderId: string | null) {
    if (file.size > MAX_MB * 1024 * 1024) throw new Error(`${file.name} exceeds the ${MAX_MB} MB limit`)
    const urlRes = await fetch('/api/materials/upload-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, size: file.size }),
    })
    const signed = await urlRes.json()
    if (!urlRes.ok) throw new Error(signed.error ?? 'Upload failed')
    const up = await supabase.storage.from(MATERIALS_BUCKET).uploadToSignedUrl(signed.path, signed.token, file)
    if (up.error) throw new Error(up.error.message)
    const recRes = await fetch('/api/materials/files', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folderId: targetFolderId, title: file.name, originalName: file.name,
        storagePath: signed.path, mimeType: file.type || undefined, sizeBytes: file.size,
      }),
    })
    if (!recRes.ok) throw new Error((await recRes.json()).error ?? 'Could not save file')
  }

  // Ensure the nested folders implied by webkitRelativePath exist; return path→id.
  async function ensureFolders(dirPaths: string[], base: string | null): Promise<Map<string, string>> {
    const map = new Map<string, string>()    // "A/B" → folderId
    for (const dir of dirPaths.sort((a, b) => a.split('/').length - b.split('/').length)) {
      const parts = dir.split('/')
      const name = parts[parts.length - 1]
      const parentKey = parts.slice(0, -1).join('/')
      const parentId = parentKey ? map.get(parentKey)! : base
      const res = await fetch('/api/materials/folders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not create folder')
      map.set(dir, data.folder.id)
    }
    return map
  }

  // Core uploader. Each item carries a File plus the directory path it belongs in
  // ('' = the current folder). Used by the file/folder pickers and drag-and-drop.
  async function processUploads(items: { file: File; dir: string }[]) {
    if (items.length === 0) return
    setError('')
    try {
      // Every ancestor directory that must exist before uploading.
      const dirSet = new Set<string>()
      for (const { dir } of items) {
        if (!dir) continue
        const parts = dir.split('/')
        for (let i = 1; i <= parts.length; i++) dirSet.add(parts.slice(0, i).join('/'))
      }
      let folderMap = new Map<string, string>()
      if (dirSet.size) {
        setBusy(`Creating ${dirSet.size} folder${dirSet.size === 1 ? '' : 's'}…`)
        folderMap = await ensureFolders(Array.from(dirSet), folderId)
      }
      let done = 0
      for (const { file, dir } of items) {
        done++
        setBusy(`Uploading ${done} of ${items.length}: ${file.name}`)
        const target = dir ? folderMap.get(dir) ?? folderId : folderId
        await uploadOne(file, target)
      }
      await load(folderId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy('')
      if (fileInput.current) fileInput.current.value = ''
      if (folderInput.current) folderInput.current.value = ''
    }
  }

  // <input> pickers: folder picker files carry webkitRelativePath "Top/sub/file.ext".
  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    const items = Array.from(list).map(f => {
      const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || ''
      return { file: f, dir: rel.split('/').slice(0, -1).join('/') }
    })
    processUploads(items)
  }

  // Recursively walk a dropped filesystem entry into { file, dir } items. Dropped
  // folders only expose their structure through the (non-standard) entries API.
  function readEntry(entry: FsEntry, dir: string): Promise<{ file: File; dir: string }[]> {
    return new Promise(resolve => {
      if (entry.isFile && entry.file) {
        entry.file(file => resolve([{ file, dir }]), () => resolve([]))
      } else if (entry.isDirectory && entry.createReader) {
        const reader = entry.createReader()
        const all: { file: File; dir: string }[] = []
        const childDir = dir ? `${dir}/${entry.name}` : entry.name
        const readBatch = () => reader.readEntries(async batch => {
          if (!batch.length) { resolve(all); return }   // empty batch = done
          for (const child of batch) all.push(...await readEntry(child, childDir))
          readBatch()                                    // dirs may need several reads
        }, () => resolve(all))
        readBatch()
      } else resolve([])
    })
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const dt = e.dataTransfer
    const entries: FsEntry[] = []
    for (const it of Array.from(dt.items ?? [])) {
      const entry = (it as DataTransferItem & { webkitGetAsEntry?: () => FsEntry | null }).webkitGetAsEntry?.()
      if (entry) entries.push(entry)
    }
    if (entries.length) {
      setBusy('Reading dropped items…')
      const items: { file: File; dir: string }[] = []
      for (const entry of entries) items.push(...await readEntry(entry, ''))
      await processUploads(items)
    } else if (dt.files?.length) {
      await processUploads(Array.from(dt.files).map(f => ({ file: f, dir: '' })))
    }
  }

  /* ── Folder / file ops ──────────────────────────────────── */

  async function createFolder() {
    if (!newFolderName.trim()) return
    setBusy('Creating folder…'); setError('')
    try {
      const res = await fetch('/api/materials/folders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: folderId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setNewFolderName(''); setNewFolderOpen(false); await load(folderId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally { setBusy('') }
  }

  async function remove(type: 'file' | 'folder', id: string, name: string) {
    const msg = type === 'folder'
      ? `Delete the folder “${name}” and everything inside it? This permanently removes the files from storage.`
      : `Delete “${name}”? This permanently removes the file from storage.`
    if (!confirm(msg)) return
    setBusy('Deleting…'); setError('')
    try {
      const path = type === 'folder' ? `/api/materials/folders?id=${id}` : `/api/materials/files?id=${id}`
      const res = await fetch(path, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      await load(folderId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally { setBusy('') }
  }

  async function toggleShare(courseId: string) {
    if (!share) return
    const has = share.courseIds.has(courseId)
    const next = new Set(share.courseIds)
    has ? next.delete(courseId) : next.add(courseId)
    setShare({ ...share, courseIds: next })
    await fetch('/api/materials/share', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: share.type, id: share.id, courseId, action: has ? 'remove' : 'add' }),
    })
    // Reflect the new count in the list without a full reload.
    load(folderId)
  }

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div
      className={`space-y-4 rounded-xl transition-shadow ${dragOver ? 'ring-2 ring-brand-400 ring-offset-4 ring-offset-white' : ''}`}
      onDragOver={e => { e.preventDefault(); if (!dragOver) setDragOver(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false) }}
      onDrop={onDrop}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setNewFolderOpen(true)}><FolderPlus size={14} /> New folder</Button>
        <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}><Upload size={14} /> Upload files</Button>
        <Button size="sm" variant="secondary" onClick={() => folderInput.current?.click()}><FolderUp size={14} /> Upload folder</Button>
        <span className="text-xs text-gray-400 hidden sm:inline">or drag files &amp; folders anywhere here</span>
        {busy && <span className="inline-flex items-center gap-1.5 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> {busy}</span>}
        <input ref={fileInput} type="file" multiple hidden onChange={e => handleFiles(e.target.files)} />
        {/* webkitdirectory enables folder selection */}
        <input ref={folderInput} type="file" hidden onChange={e => handleFiles(e.target.files)}
          // @ts-expect-error non-standard but widely supported directory-upload attrs
          webkitdirectory="" directory="" />
      </div>

      {/* New-folder inline form */}
      {newFolderOpen && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setNewFolderOpen(false) }}
            placeholder="Folder name" className="input flex-1" />
          <Button size="sm" onClick={createFolder}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => { setNewFolderOpen(false); setNewFolderName('') }}>Cancel</Button>
        </div>
      )}

      {/* Breadcrumb + sort */}
      <div className="flex items-center flex-wrap gap-1 text-sm">
        <button onClick={() => setFolderId(null)} className="text-gray-600 hover:text-gray-900 font-medium">Library</button>
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

      {/* Listing */}
      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center"><Loader2 size={16} className="inline animate-spin" /> Loading…</p>
      ) : folders.length === 0 && files.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-8 text-center">This folder is empty. Create a folder, use the upload buttons, or drag files and folders here.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {sortMaterials(folders, sort).map(f => (
            <Row key={f.id} icon={<Folder size={18} className="text-amber-500" />}
              title={f.name} subtitle={`${f._count.children} folder${f._count.children === 1 ? '' : 's'}, ${f._count.materials} file${f._count.materials === 1 ? '' : 's'}`}
              onOpen={() => setFolderId(f.id)} shareCount={f.shares.length}
              onShare={() => setShare({ type: 'folder', id: f.id, name: f.name, courseIds: new Set(f.shares.map(s => s.courseId)) })}
              onDelete={() => remove('folder', f.id, f.name)} />
          ))}
          {sortMaterials(files, sort).map(f => (
            <Row key={f.id} icon={<FileText size={18} className="text-brand-600" />}
              title={f.title} subtitle={[f.originalName !== f.title ? f.originalName : null, humanSize(f.sizeBytes)].filter(Boolean).join(' · ')}
              href={`/api/materials/download?id=${f.id}`} shareCount={f.shares.length}
              onShare={() => setShare({ type: 'file', id: f.id, name: f.title, courseIds: new Set(f.shares.map(s => s.courseId)) })}
              onDelete={() => remove('file', f.id, f.title)} />
          ))}
        </div>
      )}

      {/* Share dialog */}
      {share && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShare(null)}>
          <div className="w-full max-w-md rounded-xl bg-popover shadow-xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900">Share with courses</h3>
              <button onClick={() => setShare(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {share.type === 'folder' ? 'Everyone in a selected course can see this folder and everything inside it.' : 'Everyone in a selected course can download this file.'}
            </p>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-400 italic">You have no courses yet.</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {courses.map(c => {
                  const on = share.courseIds.has(c.id)
                  return (
                    <button key={c.id} onClick={() => toggleShare(c.id)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <span className={`flex h-5 w-5 items-center justify-center rounded border ${on ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300'}`}>
                        {on && <Check size={13} />}
                      </span>
                      <span className="text-gray-800">{c.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShare(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, title, subtitle, onOpen, href, onShare, onDelete, shareCount }: {
  icon: React.ReactNode; title: string; subtitle?: string
  onOpen?: () => void; href?: string; onShare: () => void; onDelete: () => void; shareCount: number
}) {
  const label = (
    <>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900 truncate">{title}</span>
        {subtitle && <span className="block text-xs text-gray-400 truncate">{subtitle}</span>}
      </span>
    </>
  )
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-surface hover:bg-gray-50">
      {href ? (
        // Files: a real anchor (opens reliably, never popup-blocked).
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 flex-1 text-left">{label}</a>
      ) : (
        // Folders: navigate within the manager.
        <button onClick={onOpen} className="flex items-center gap-3 min-w-0 flex-1 text-left">{label}</button>
      )}
      <button onClick={onShare} title="Share with courses"
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${shareCount > 0 ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}>
        <Share2 size={13} /> {shareCount > 0 ? shareCount : 'Share'}
      </button>
      <button onClick={onDelete} title="Delete" className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
    </div>
  )
}
