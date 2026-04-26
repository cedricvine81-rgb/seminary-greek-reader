'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface MaterialUploadFormProps {
  courseId: string
}

export function MaterialUploadForm({ courseId }: MaterialUploadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', content: '', fileUrl: '', weekNumber: '' })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, ...form, weekNumber: form.weekNumber ? Number(form.weekNumber) : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      router.push('/instructor/materials')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <Input label="Title" required value={form.title} onChange={set('title')} />
      <Input label="Description (optional)" value={form.description} onChange={set('description')} />
      <Input label="Week number (optional)" type="number" value={form.weekNumber} onChange={set('weekNumber')} />
      <Input label="File URL (optional)" value={form.fileUrl} onChange={set('fileUrl')} placeholder="https://…" />
      <div>
        <label className="label">Content / Notes</label>
        <textarea rows={5} className="input" value={form.content} onChange={set('content')} placeholder="Paste notes or content here…" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Save Material</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
