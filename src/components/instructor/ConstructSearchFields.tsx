'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useT } from '@/lib/i18n/LocaleProvider'
import {
  CONSTRUCT_MAX_FINDINGS, constructCorpusLabel, describeConstruct, parseConstructLink,
} from '@/lib/construct-assignment'

interface Props {
  url: string
  onUrl: (v: string) => void
  count: number
  onCount: (v: number) => void
  askTranslation: boolean
  onAskTranslation: (v: boolean) => void
  askComment: boolean
  onAskComment: (v: boolean) => void
}

// The Construct Search panel shared by the new-assignment form and the settings editor: the
// search link (which is the whole assignment), how many examples to require, and which
// columns the find-list asks for. The pasted link is decoded as you type and echoed back in
// words, so an instructor can see they pasted the search they meant before saving it.
export function ConstructSearchFields({
  url, onUrl, count, onCount, askTranslation, onAskTranslation, askComment, onAskComment,
}: Props) {
  const t = useT()
  const parsed = useMemo(() => parseConstructLink(url), [url])
  const touched = url.trim().length > 0

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-brand-800">{t('cf.heading')}</p>
      <p className="text-xs text-brand-700">{t('cf.intro')}</p>
      <Link
        href="/search/construct"
        target="_blank"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900 hover:underline"
      >
        <Search size={13} /> {t('cf.openSearch')}
      </Link>

      <Input
        label={t('cf.link')}
        value={url}
        onChange={e => onUrl(e.target.value)}
        placeholder={t('cf.linkExample')}
      />

      {touched && (
        parsed ? (
          <div className="rounded-lg border border-brand-200 bg-surface px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-green-700">
              <Check size={13} /> {constructCorpusLabel(parsed.query)}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">{describeConstruct(parsed.query)}</p>
          </div>
        ) : (
          <p className="flex items-start gap-1.5 text-xs text-red-600">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            {t('cf.badLink')}
          </p>
        )
      )}

      <Input
        label={t('cf.count')}
        type="number"
        min={1}
        max={CONSTRUCT_MAX_FINDINGS}
        value={count}
        onChange={e => onCount(Math.min(Math.max(Number(e.target.value) || 1, 1), CONSTRUCT_MAX_FINDINGS))}
      />
      <p className="-mt-2 text-xs text-brand-600">{t('cf.countHelp')}</p>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-brand-800">{t('cf.askFor')}</p>
        <p className="text-xs text-brand-600">{t('cf.alwaysAsked')}</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={askTranslation}
            onChange={e => onAskTranslation(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-brand-800">{t('cf.askTranslation')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={askComment}
            onChange={e => onAskComment(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-brand-800">{t('cf.askComment')}</span>
        </label>
      </div>
    </div>
  )
}
