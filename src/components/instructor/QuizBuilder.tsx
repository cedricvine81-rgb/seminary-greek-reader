'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import type { QuestionType } from '@/types/assignment'
import { useT } from '@/lib/i18n/LocaleProvider'

interface QuizBuilderProps {
  assignmentId: string
  level: string
  provideDefinition?: boolean
}

export function QuizBuilder({ assignmentId, level, provideDefinition = false }: QuizBuilderProps) {
  const t = useT()
  const router = useRouter()
  const [type, setType] = useState<QuestionType>('GREEK_TO_ENGLISH')
  const [count, setCount] = useState(20)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<number | null>(null)

  // If provideDefinition is turned on while English→Greek is selected, reset to Greek→English
  // because typing Greek characters is not supported in the app.
  useEffect(() => {
    if (provideDefinition && type === 'ENGLISH_TO_GREEK') setType('GREEK_TO_ENGLISH')
  }, [provideDefinition]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    setLoading(true)
    setGenerated(null)
    try {
      // 409 = students have already answered. Confirm with the count before replacing
      // their questions (which detaches every answer), and never report success on an
      // error — this used to read `data.count ?? count` and flash "generated" on failure.
      const send = (force?: boolean) => fetch(`/api/assignments/${assignmentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, count, level, ...(force ? { force: true } : {}) }),
      })
      let res = await send()
      let data = await res.json().catch(() => ({}))
      if (res.status === 409 && data.error === 'studentWorkExists') {
        const n = (data.responses ?? 0) + (data.attempts ?? 0)
        if (!confirm(t('as.regenWarn', { n }))) return
        res = await send(true)
        data = await res.json().catch(() => ({}))
      }
      if (!res.ok) { alert(data.error ?? 'Could not generate questions.'); return }
      setGenerated(data.count ?? count)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-gray-900 text-sm">{t('qb.autoGenerate')}</h3>
        <Badge variant={level === 'BEGINNING' ? 'blue' : 'purple'}>
          {t(level === 'BEGINNING' ? 'qb.levelBeginning' : 'qb.levelIntermediate')}
        </Badge>
        <Badge variant={provideDefinition ? 'green' : 'gray'}>
          {t(provideDefinition ? 'qb.provideMode' : 'qb.chooseMode')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Select
            label={t('qb.direction')}
            value={type}
            onChange={e => setType(e.target.value as QuestionType)}
            options={[
              { value: 'GREEK_TO_ENGLISH', label: t('qb.greekToEnglish') },
              ...(!provideDefinition ? [{ value: 'ENGLISH_TO_GREEK', label: t('qb.englishToGreek') }] : []),
            ]}
          />
          {provideDefinition && (
            <p className="mt-1 text-xs text-gray-400">{t('qb.engToGrkUnavailable')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('qb.numQuestions')}</label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} loading={loading} variant="secondary" size="sm">
          {t('qb.generate')}
        </Button>
        {generated !== null && !loading && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <CheckCircle2 size={14} />
            {t('qb.generated', { count: generated, n: generated })}
          </span>
        )}
      </div>
    </div>
  )
}
