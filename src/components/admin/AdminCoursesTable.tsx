'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Pencil, Trash2, X, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Course {
  id: string
  name: string
  description: string | null
  isPublished: boolean
  level: string
  instructor: { firstName: string; surname: string; email: string }
  institution: { name: string } | null
  _count: { enrollments: number; assignments: number }
  startDate: string
  endDate: string
}

export function AdminCoursesTable() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ name: string; description: string; isPublished: boolean }>({ name: '', description: '', isPublished: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    const res = await fetch('/api/admin/courses')
    const data = await res.json()
    setCourses(data.courses ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(c: Course) {
    setEditId(c.id)
    setEditData({ name: c.name, description: c.description ?? '', isPublished: c.isPublished })
    setError('')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    if (!res.ok) { setError('Save failed'); setSaving(false); return }
    setSaving(false)
    setEditId(null)
    load()
  }

  async function deleteCourse(id: string, name: string) {
    if (!confirm(`Delete course "${name}" and all its assignments? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Delete failed'); return }
    load()
  }

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    return !q || `${c.name} ${c.instructor.surname} ${c.instructor.email} ${c.institution?.name ?? ''}`.toLowerCase().includes(q)
  })

  if (loading) return <p className="text-gray-400 animate-pulse">Loading courses…</p>

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 mb-4">
        <CardTitle>All Courses ({courses.length})</CardTitle>
        <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="w-52" />
      </div>
      {error && <p className="text-sm text-red-600 mb-3 bg-red-50 rounded px-3 py-1">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 pr-4">Course</th>
              <th className="pb-2 pr-4">Instructor</th>
              <th className="pb-2 pr-4">Institution</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Enrolments / Assignments</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                {editId === c.id ? (
                  <>
                    <td className="py-2 pr-4" colSpan={2}>
                      <input className="input w-64" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                    </td>
                    <td className="py-2 pr-4">
                      <input className="input w-48" value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} placeholder="Description" />
                    </td>
                    <td className="py-2 pr-4">
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={editData.isPublished} onChange={e => setEditData(d => ({ ...d, isPublished: e.target.checked }))} />
                        Published
                      </label>
                    </td>
                    <td className="py-2 pr-4 text-gray-400 text-xs">{c._count.enrollments} / {c._count.assignments}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => saveEdit(c.id)} loading={saving}><Check size={13} /></Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditId(null)}><X size={13} /></Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-4 font-medium text-gray-800 max-w-[200px] truncate">{c.name}</td>
                    <td className="py-2 pr-4 text-gray-500 text-xs">{c.instructor.firstName} {c.instructor.surname}</td>
                    <td className="py-2 pr-4 text-gray-400 text-xs max-w-[140px] truncate">{c.institution?.name ?? '—'}</td>
                    <td className="py-2 pr-4"><Badge variant={c.isPublished ? 'green' : 'gray'}>{c.isPublished ? 'Published' : 'Draft'}</Badge></td>
                    <td className="py-2 pr-4 text-gray-400 text-xs">{c._count.enrollments} / {c._count.assignments}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(c)}><Pencil size={13} /></Button>
                        <Button size="sm" variant="danger" onClick={() => deleteCourse(c.id, c.name)}><Trash2 size={13} /></Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-gray-400 italic py-4 text-center">No courses found.</p>}
      </div>
    </Card>
  )
}
