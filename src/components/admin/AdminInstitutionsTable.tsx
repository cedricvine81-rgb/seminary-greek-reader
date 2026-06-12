'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pencil, Trash2, X, Check, Plus } from 'lucide-react'

interface Institution {
  id: string
  name: string
  createdAt: string
  _count: { courses: number }
}

export function AdminInstitutionsTable() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/admin/institutions')
    const data = await res.json()
    setInstitutions(data.institutions ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveEdit(id: string) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/institutions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Save failed')
      setSaving(false)
      return
    }
    setSaving(false)
    setEditId(null)
    load()
  }

  async function addInstitution() {
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/admin/institutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to add')
      setAdding(false)
      return
    }
    setNewName('')
    setAdding(false)
    load()
  }

  async function deleteInstitution(id: string, name: string) {
    if (!confirm(`Delete institution "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/institutions/${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Delete failed'); return }
    load()
  }

  if (loading) return <p className="text-gray-400 animate-pulse">Loading institutions…</p>

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle className="mb-4">Add Institution</CardTitle>
        <p className="text-xs text-gray-500 mb-3">
          Institutions listed here appear in the dropdown when new instructors and students sign up.
        </p>
        {error && <p className="text-sm text-red-600 mb-3 bg-red-50 rounded px-3 py-1">{error}</p>}
        <div className="flex gap-2">
          <Input
            placeholder="Institution name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addInstitution()}
            className="flex-1"
          />
          <Button onClick={addInstitution} loading={adding}>
            <Plus size={14} /> Add
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">All Institutions ({institutions.length})</CardTitle>
        <div className="divide-y divide-gray-50">
          {institutions.map(inst => (
            <div key={inst.id} className="flex items-center gap-3 py-2.5 hover:bg-gray-50 rounded-lg px-1">
              {editId === inst.id ? (
                <>
                  <input
                    className="input flex-1"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(inst.id)}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => saveEdit(inst.id)} loading={saving}><Check size={13} /></Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditId(null)}><X size={13} /></Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-gray-800">{inst.name}</span>
                  <span className="text-xs text-gray-400">{inst._count.courses} course{inst._count.courses !== 1 ? 's' : ''}</span>
                  <Button size="sm" variant="secondary" onClick={() => { setEditId(inst.id); setEditName(inst.name); setError('') }}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteInstitution(inst.id, inst.name)}>
                    <Trash2 size={13} />
                  </Button>
                </>
              )}
            </div>
          ))}
          {institutions.length === 0 && <p className="text-sm text-gray-400 italic py-4 text-center">No institutions yet.</p>}
        </div>
      </Card>
    </div>
  )
}
