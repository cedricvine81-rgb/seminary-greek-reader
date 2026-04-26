'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface MaterialEditorProps {
  materialId: string
  initialData: { title: string; description?: string | null; content?: string | null; fileUrl?: string | null; weekNumber?: number | null }
}

export function MaterialEditor({ materialId, initialData }: MaterialEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: initialData.title,
    description: initialData.description ?? '',
    content: initialData.content ?? '',
    fileUrl: initialData.fileUrl ?? '',
    weekNumber: String(initialData.weekNumber ?? ''),
  })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/materials?id=${materialId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, weekNumber: form.weekNumber ? Number(form.weekNumber) : undefined }),
    })
    setLoading(false)
    router.push('/instructor/materials')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <Input label="Title" required value={form.title} onChange={set('title')} />
      <Input label="Description" value={form.description} onChange={set('description')} />
      <Input label="Week number" type="number" value={form.weekNumber} onChange={set('weekNumber')} />
      <Input label="File URL" value={form.fileUrl} onChange={set('fileUrl')} />
      <div>
        <label className="label">Content</label>
        <textarea rows={6} className="input" value={form.content} onChange={set('content')} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Save Changes</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
