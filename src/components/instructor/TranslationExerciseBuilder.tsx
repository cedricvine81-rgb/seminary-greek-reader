'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ALL_SYNTAX_OPTIONS } from '@/data/syntax-categories'

interface TranslationExerciseBuilderProps {
  assignmentId: string
}

export function TranslationExerciseBuilder({ assignmentId }: TranslationExerciseBuilderProps) {
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
      <h3 className="font-semibold text-gray-900 text-sm">Add Translation / Syntax Question</h3>

      <Select
        label="Question type"
        value={qType}
        onChange={e => setQType(e.target.value as 'TRANSLATION' | 'SYNTAX_IDENTIFY')}
        options={[
          { value: 'TRANSLATION', label: 'Translation' },
          { value: 'SYNTAX_IDENTIFY', label: 'Syntax identification (dropdown)' },
        ]}
      />

      <Input
        label="Greek text / prompt"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="ἐν ἀρχῇ ἦν ὁ λόγος"
      />

      <Input
        label="Reference"
        value={reference}
        onChange={e => setReference(e.target.value)}
        placeholder="John 1:1"
      />

      {qType === 'SYNTAX_IDENTIFY' && (
        <Select
          label="Correct syntax category"
          value={correctAnswer}
          onChange={e => setCorrectAnswer(e.target.value)}
          placeholder="Select correct category…"
          options={ALL_SYNTAX_OPTIONS.map(o => ({ value: o, label: o }))}
        />
      )}

      {qType === 'TRANSLATION' && (
        <div>
          <label className="label">Model translation</label>
          <textarea
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
            rows={2}
            className="input"
            placeholder="In the beginning was the Word…"
          />
        </div>
      )}

      <Button onClick={handleAdd} variant="secondary" size="sm">Add Question</Button>
    </div>
  )
}
