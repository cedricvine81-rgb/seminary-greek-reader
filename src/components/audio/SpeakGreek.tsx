'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Volume2, Loader2 } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { erasmianRespell } from '@/lib/erasmian'

// "Say this word" — Erasmian, the pronunciation the course teaches.
//
// TWO SOURCES, one button. A pre-rendered MP3 (public/audio/greek/<slug>.mp3, built by
// scripts/build-erasmian-audio.mjs from the IPA) is used when the word has one; otherwise
// the browser's own speech synthesis reads the ENGLISH RESPELLING of the same
// transliteration ("bahp-TI-dzoh") in an English voice, which lands close enough to be
// useful. That fallback is why the feature works the day it ships and on any word a student
// meets, including one the build has never seen — and why no page needs to know which words
// have recordings.
//
// Erasmian is the point: no TTS voice anywhere speaks it (Greek voices speak MODERN Greek,
// which merges six spellings into "ee" and turns β into v), so a Greek-language voice would
// actively contradict the chapter. An English voice reading our respelling does not.

/** Audio files are named by the word, stripped of accents and non-letters. */
export function audioSlug(greek: string): string {
  return greek.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/ς/g, 'σ').replace(/[^α-ω]/g, '')
}

type Status = 'idle' | 'loading' | 'playing'

/** Cache of which slugs have a recording, so a missing file is probed only once. */
const known = new Map<string, boolean>()

export function SpeakGreek({ text, className, size = 14, label }: {
  text: string
  className?: string
  size?: number
  /** Overrides the default "Hear it in Erasmian" tooltip. */
  label?: string
}) {
  const t = useT()
  const [status, setStatus] = useState<Status>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    // Set on the way IN as well as out: a ref survives unmount, so a remount (React's
    // StrictMode double-mount in dev, or the card simply re-keying) would otherwise leave
    // this false forever and silently swallow every later playback.
    mounted.current = true
    return () => {
      mounted.current = false
      audioRef.current?.pause()
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    }
  }, [])

  const speakFallback = useCallback(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!synth) { setStatus('idle'); return }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(erasmianRespell(text).toLowerCase())
    // An English voice reading the respelling. Slower than speech: this is a model to copy.
    u.lang = 'en-US'
    u.rate = 0.75
    u.onend = () => { if (mounted.current) setStatus('idle') }
    u.onerror = () => { if (mounted.current) setStatus('idle') }
    setStatus('playing')
    synth.speak(u)
  }, [text])

  const play = useCallback(() => {
    if (status !== 'idle') {   // second click stops
      audioRef.current?.pause()
      window.speechSynthesis?.cancel()
      setStatus('idle')
      return
    }
    const slug = audioSlug(text)
    if (!slug || known.get(slug) === false) { speakFallback(); return }

    setStatus('loading')
    const audio = new Audio(`/audio/greek/${slug}.mp3`)
    audioRef.current = audio
    // A missing file reports itself twice — the element's `error` event AND the rejected
    // play() promise — so the handover runs once or the word is spoken over itself.
    let handedOver = false
    const fallBack = () => {
      if (handedOver) return
      handedOver = true
      known.set(slug, false)          // no recording yet — don't probe this slug again
      if (mounted.current) speakFallback()
    }
    audio.onplaying = () => { if (mounted.current) setStatus('playing') }
    audio.onended = () => { if (mounted.current) setStatus('idle') }
    audio.onerror = fallBack
    audio.play().then(() => known.set(slug, true)).catch(fallBack)
  }, [status, text, speakFallback])

  return (
    <button
      type="button"
      onClick={e => { e.preventDefault(); e.stopPropagation(); play() }}
      title={label ?? t('audio.hear')}
      aria-label={label ?? t('audio.hear')}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded p-1 align-middle transition-colors',
        status === 'playing' ? 'text-brand-600' : 'text-gray-400 hover:text-brand-600',
        className,
      )}
    >
      {status === 'loading'
        ? <Loader2 size={size} className="animate-spin" />
        : <Volume2 size={size} />}
    </button>
  )
}
