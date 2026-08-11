'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ALL_SYNTAX_OPTIONS } from '@/data/syntax-categories'
import { useT } from '@/lib/i18n/LocaleProvider'

interface TranslationExerciseBuilderProps {
  assignmentId: string
}

export function TranslationExerciseBuilder({ assignmentId }: TranslationExerciseBuilderProps) {
  const t = useT()
  const [qType, setQType] = useState<'TRANSLATION' | 'SYNTAX_IDENTIFY'>('TRANSLATION')
  const [prompt, setPrompt] = useState('')
  const [reference, setReference] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')

  async function handleAdd() {
    if (!prompt.trim()) return
    await fetch(`/api/assignments/${assignmentId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt, type: qType, reference, correctAnswer,
        options: qType === 'SYNTAX_IDENTIFY' ? ALL_SYNTAX_OPTIONS : [],
      }),
    })
    setPrompt('')
    setCorrectAnswer('')
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <h3 className="font-semibold text-gray-900 text-sm">{t('te.addHeading')}</h3>

      <Select
        label={t('te.questionType')}
        value={qType}
        onChange={e => setQType(e.target.value as 'TRANSLATION' | 'SYNTAX_IDENTIFY')}
        options={[
          { value: 'TRANSLATION', label: t('te.typeTranslation') },
          { value: 'SYNTAX_IDENTIFY', label: t('te.typeSyntax') },
        ]}
      />

      <Input
        label={t('te.prompt')}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={t('te.promptExample')}
      />

      <Input
        label={t('te.reference')}
        value={reference}
        onChange={e => setReference(e.target.value)}
        placeholder={t('te.referenceExample')}
      />

      {qType === 'SYNTAX_IDENTIFY' && (
        <Select
          label={t('te.syntaxCategory')}
          value={correctAnswer}
          onChange={e => setCorrectAnswer(e.target.value)}
          placeholder={t('te.selectCategory')}
          options={ALL_SYNTAX_OPTIONS.map(o => ({ value: o, label: o }))}
        />
      )}

      {qType === 'TRANSLATION' && (
        <div>
          <label className="label">{t('te.modelTranslation')}</label>
          <textarea
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
            rows={2}
            className="input"
            placeholder={t('te.modelExample')}
          />
        </div>
      )}

      <Button onClick={handleAdd} variant="secondary" size="sm">{t('te.addQuestion')}</Button>
    </div>
  )
}
