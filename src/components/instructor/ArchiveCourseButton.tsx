'use client'
import { useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  courseId: string
  isArchived: boolean
}

export function ArchiveCourseButton({ courseId, isArchived }: Props) {
  const t = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      await fetch(`/api/courses?id=${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !isArchived }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      loading={loading}
      onClick={toggle}
      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700"
      title={t(isArchived ? 'inst.restoreCourse' : 'inst.archiveCourse')}
    >
      {isArchived
        ? <><ArchiveRestore size={14} /> {t('ab.restore')}</>
        : <><Archive size={14} /> {t('ab.archive')}</>}
    </Button>
  )
}
