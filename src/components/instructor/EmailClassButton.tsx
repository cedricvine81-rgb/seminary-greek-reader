'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { AtSign } from 'lucide-react'

interface Student { id: string; name: string; email: string }

interface Props {
  courseName: string
  students: Student[]
}

/**
 * Real-email entry point (matches the admin's mailto pattern). Opens the
 * instructor's own email client with recipients pre-filled — either one student
 * or the whole class. Whole-class sends use BCC so students don't see each
 * other's addresses.
 */
export function EmailClassButton({ courseName, students }: Props) {
  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState('') // '' = whole class

  const withEmail = students.filter(s => s.email)
  const disabled = withEmail.length === 0

  function openMailClient() {
    const subject = `[${courseName}] `
    let url: string
    if (recipient) {
      const s = withEmail.find(x => x.id === recipient)
      if (!s) return
      url = `mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent(subject)}`
    } else {
      // Whole class → BCC every address to keep them private from one another
      const bcc = withEmail.map(s => s.email).join(',')
      url = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}`
    }
    window.location.href = url
    setOpen(false)
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => { setRecipient(''); setOpen(true) }}
        disabled={disabled}
        title={disabled ? 'No enrolled students with an email address yet' : undefined}
        className="flex items-center gap-1.5"
      >
        <AtSign size={14} /> Email
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Email by mail client" size="md">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            This opens your own email program with the recipients filled in. Whole-class emails are sent
            as <span className="font-medium">BCC</span> so students can&rsquo;t see each other&rsquo;s addresses.
          </p>
          <Select
            label="Recipient"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            options={[
              { value: '', label: `Whole class (${withEmail.length} student${withEmail.length === 1 ? '' : 's'})` },
              ...withEmail.map(s => ({ value: s.id, label: `${s.name} — ${s.email}` })),
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={openMailClient} className="flex items-center gap-1.5">
              <AtSign size={14} /> Open email
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
