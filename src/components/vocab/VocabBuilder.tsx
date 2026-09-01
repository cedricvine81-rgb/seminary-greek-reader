'use client'
import { useState, useMemo, useEffect, createContext, useContext, type ReactNode } from 'react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { useDeckGloss } from '@/lib/use-deck-gloss'
import { useNarrowScreen } from '@/lib/use-narrow-screen'
import Link from 'next/link'
import { Search, RotateCcw, ChevronRight, ChevronDown, Check, List, X, CheckCircle2, XCircle, BookOpen, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import { sm2 } from '@/lib/spaced-repetition'
import { bandForSection, BAND_LEGEND, freqRange } from '@/lib/vocab-bands'
import { HEBREW_DECK } from '@/lib/vocab-decks'
import bgvbData from '@/data/bgvb-vocabulary.json'
import hebrewData from '@/data/hebrew-vocabulary.json'
import { SpeakGreek } from '@/components/audio/SpeakGreek'

/**
 * Band labels via LITERAL t() keys, not `t(`vocab.band.${band}.short`)`. A template-literal key
 * is invisible to `npm run i18n:keys`, so a missing one would print the key on screen with every
 * check green — the exact failure that guard exists to catch.
 */
function useBandLabels() {
  const t = useT()
  return {
    name: (b: string) => b === 'BEGINNING' ? t('vocab.band.BEGINNING.name')
      : b === 'INTERMEDIATE' ? t('vocab.band.INTERMEDIATE.name') : t('vocab.band.BEYOND.name'),
    short: (b: string) => b === 'BEGINNING' ? t('vocab.band.BEGINNING.short')
      : b === 'INTERMEDIATE' ? t('vocab.band.INTERMEDIATE.short') : t('vocab.band.BEYOND.short'),
    freq: (b: string) => b === 'BEGINNING' ? t('vocab.band.BEGINNING.freq')
      : b === 'INTERMEDIATE' ? t('vocab.band.INTERMEDIATE.freq') : t('vocab.band.BEYOND.freq'),
  }
}

export type VocabLang = 'greek' | 'hebrew'

// ── Types ────────────────────────────────────────────────────────────────────

interface BgvbWord {
  word: string
  inflection: string | null
  gloss: string
  pos: string
  section: number
  sub?: string    // printed subsection key, e.g. "1-C" — Greek only; Hebrew chunks by 20
  freq: number | null
  order?: number  // PDF frequency rank (1 = most frequent); used for subsection sorting
  id?: string     // stable unique key. Greek lemmas are unique so it falls back to `word`;
                  // Hebrew has homographs (same pointing, different Strong's) so the data
                  // supplies an explicit id to keep React keys and progress from colliding.
}

// Identity of a card, for React keys, the progress map, and subsection lookup. Must be unique
// within a deck — see the `id` note above (Hebrew homographs would otherwise share a key).
const wid = (w: BgvbWord): string => w.id ?? w.word

interface WordProgress {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: string
  correct: number
  total: number
}

type ProgressMap = Record<string, WordProgress>
// 'flashcards' / 'test' / 'identify' are the three study MODES launched from the mode row; they
// all study the same selected vocab (filterWords(config)). 'study' = the setup screen, 'browse'
// = the word list.
type Tab = 'study' | 'flashcards' | 'browse' | 'test' | 'identify'
type LaunchMode = 'flashcards' | 'test' | 'identify'
type StudyMode = 'greek-to-english' | 'english-to-greek'

interface Subsection {
  key: string      // e.g. "1-A"
  label: string    // e.g. "A"
  rankRange: string // e.g. "1–20" (position within section)
  words: BgvbWord[]
}

type SectionListMode = 'greek-english' | 'greek' | 'english'

interface StudyConfig {
  mode: StudyMode
  subsections: string[]  // selected subsection keys, e.g. ["1-A", "1-B", "2-A"]
  pos: string[]
}

// ── Constants ────────────────────────────────────────────────────────────────

// Fisher–Yates: an unbiased shuffle (unlike `sort(() => Math.random() - 0.5)`,
// which skews toward the original order).
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Part-of-speech tags are DATA (they key off the corpus's own abbreviations), so the label is
// resolved at render through posLabel() rather than being baked in here.
const POS_KEYS = ['Verb', 'Noun', 'Adj', 'Adv', 'Prep', 'Conj', 'Pron', 'Art', 'Interj', 'Particle'] as const
const posLabelKey = (pos: string) => (POS_KEYS as readonly string[]).includes(pos) ? `pos.${pos}` : null

// ── Per-language vocabulary datasets ──────────────────────────────────────────
// The Greek (Biblical Greek Vocabulary Builder) and Hebrew (frequency-ranked from the MT,
// scripts/build-hebrew-vocabulary.py) decks share the same shape and UI; a VocabData bundles a
// deck with everything the components need (font/direction, storage key, section coverage).

interface VocabData {
  words: BgvbWord[]
  sections: number[]
  allPos: string[]
  coverage: Record<number, number>            // cumulative % of the corpus through section N
  subsections: Record<number, Subsection[]>
  wordSubsection: Record<string, string>      // word → its subsection key ("1-A")
  allSubsectionKeys: string[]
  // Glanz bands (Hebrew only): the OTST 551 weekly list, a SECOND grouping over the same
  // deck. Selecting a band studies exactly the 20 words its quizzes draw on.
  bands?: { key: string; label: string; rankRange: string; words: BgvbWord[] }[]
  wordBand?: Record<string, string>           // word → its band key ("Glanz 1A")
  scriptClass: string                          // headword font class: greek-text | font-hebrew
  rtl: boolean
  storageKey: string
  scriptLabel: string                          // 'Gk' / 'Heb' for the direction toggle
  scriptName: string                           // 'Greek' / 'Hebrew' for hints
  corpusKey: string                            // i18n key of the corpus name, for the frequency line
  /**
   * The gloss to SHOW. Every display, dedup and search site goes through this, so a translated
   * deck behaves like the English one: the multiple-choice distractor filter dedups on what the
   * student actually reads, and Browse searches the language they are reading in.
   */
  gloss: (w: BgvbWord) => string
}

function buildVocab(
  words: BgvbWord[],
  coverage: Record<number, number>,
  opts: { scriptClass: string; rtl: boolean; storageKey: string; scriptLabel: string; scriptName: string; corpusKey: string },
): VocabData {
  const sections = Array.from(new Set(words.map(w => w.section))).sort((a, b) => a - b)
  const allPos = Array.from(new Set(words.map(w => w.pos))).sort()
  // Subsections come from the printed BGVB handout via each word's `sub` key, so the app's
  // lists begin and end on the same words as the sheet students print. A few hold 18–19
  // words: the handout prints a dozen words twice and only the first placement is kept.
  // Decks without `sub` (Hebrew) keep the original 20-word chunking.
  const subsections: Record<number, Subsection[]> = {}
  const wordSubsection: Record<string, string> = {}
  sections.forEach(s => {
    const sectionWords = [...words.filter(w => w.section === s)].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return (b.freq ?? 0) - (a.freq ?? 0)
    })
    const subs: Subsection[] = []
    const groups = new Map<string, BgvbWord[]>()
    for (const w of sectionWords) {
      if (!w.sub) continue
      const list = groups.get(w.sub)
      if (list) list.push(w)
      else groups.set(w.sub, [w])
    }

    if (groups.size > 0) {
      let position = 1
      for (const key of Array.from(groups.keys()).sort()) {
        const chunk = groups.get(key)!
        subs.push({
          key,
          label: key.split('-')[1],
          rankRange: `${position}–${position + chunk.length - 1}`,
          words: chunk,
        })
        position += chunk.length
        chunk.forEach(w => { wordSubsection[wid(w)] = key })
      }
    } else {
      for (let i = 0; i < sectionWords.length; i += 20) {
        const chunk = sectionWords.slice(i, i + 20)
        const label = String.fromCharCode(65 + subs.length) // A, B, C…
        const key = `${s}-${label}`
        subs.push({ key, label, rankRange: `${i + 1}–${Math.min(i + 20, sectionWords.length)}`, words: chunk })
        chunk.forEach(w => { wordSubsection[wid(w)] = key })
      }
    }
    subsections[s] = subs
  })
  const allSubsectionKeys = sections.flatMap(s => subsections[s].map(sub => sub.key))
  return {
    gloss: (w: BgvbWord) => w.gloss, words, sections, allPos, coverage, subsections, wordSubsection, allSubsectionKeys, ...opts }
}

const GREEK_VOCAB = buildVocab(
  bgvbData as BgvbWord[],
  { 1: 69.5, 2: 77.2, 3: 81.6, 4: 84.4, 5: 86.4, 6: 87.8, 7: 89.2 },
  { scriptClass: 'greek-text', rtl: false, storageKey: 'bgvb-progress-v1', scriptLabel: 'Gk', scriptName: 'Greek', corpusKey: 'vocab.corpus.greek' },
)
const HEBREW_VOCAB = buildVocab(
  hebrewData as BgvbWord[],
  { 1: 60.8, 2: 71.1, 3: 76.9, 4: 80.3, 5: 82.8, 6: 84.9, 7: 86.8 },
  { scriptClass: 'font-hebrew', rtl: true, storageKey: 'hebrew-vocab-progress-v1', scriptLabel: 'Heb', scriptName: 'Hebrew', corpusKey: 'vocab.corpus.hebrew' },
)
// The quiz generators draw from lib/vocab-decks' HEBREW_DECK, which carries the Glanz
// bands and seven supplement words (וְ, הַ, לְ … — words the corpus frequency pass cannot
// see) that this page's own build lacks. Graft both on, so a student can open the exact
// band a quiz names — supplement words included. The supplement gets no §-subsection, so
// the §-view and everyone's saved selections stay byte-identical to before.
{
  const known = new Set(HEBREW_VOCAB.words.map(w => wid(w)))
  const extras = (HEBREW_DECK.bands ?? [])
    .flatMap(b => b.words)
    .filter(w => !known.has(w.id ?? w.word)) as unknown as BgvbWord[]
  HEBREW_VOCAB.words = [...HEBREW_VOCAB.words, ...extras]
  HEBREW_VOCAB.bands = (HEBREW_DECK.bands ?? []).map(b => ({
    key: b.key, label: b.label, rankRange: b.rankRange,
    words: b.words as unknown as BgvbWord[],
  }))
  HEBREW_VOCAB.wordBand = HEBREW_DECK.wordBand
}

const VOCAB: Record<VocabLang, VocabData> = { greek: GREEK_VOCAB, hebrew: HEBREW_VOCAB }

const VocabCtx = createContext<VocabData>(GREEK_VOCAB)
const useVocab = () => useContext(VocabCtx)

function defaultConfig(V: VocabData): StudyConfig {
  return { mode: 'greek-to-english', subsections: [], pos: [...V.allPos] }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function isDue(p: WordProgress) {
  return p.dueDate <= todayStr()
}

function loadProgress(storageKey: string): ProgressMap {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
}

function saveProgress(storageKey: string, p: ProgressMap) {
  localStorage.setItem(storageKey, JSON.stringify(p))
}

function filterWords(config: StudyConfig, V: VocabData): BgvbWord[] {
  // No sections selected → treat as all sections selected
  const effectiveSubSet = config.subsections.length === 0
    ? new Set(V.allSubsectionKeys)
    : new Set(config.subsections)

  return V.words.filter(w => {
    // A word belongs if its §-subsection OR its Glanz band is selected. With nothing
    // selected the effective set is all §-subsections, so band-only words (the Hebrew
    // supplement) appear exactly when their band is chosen — never by default.
    if (!effectiveSubSet.has(V.wordSubsection[wid(w)] ?? '')
      && !effectiveSubSet.has(V.wordBand?.[wid(w)] ?? '')) return false
    if (!config.pos.includes(w.pos)) return false
    return true
  })
}

// ── Main component ───────────────────────────────────────────────────────────

export function VocabBuilder({ lang = 'greek', onLangChange, initialSubsections }: {
  lang?: VocabLang
  onLangChange?: (l: VocabLang) => void
  /**
   * Subsection keys to open already selected, e.g. ["1-A"]. Used when the deck is opened FROM
   * something that already names its vocabulary — a quiz assignment — so the student lands on
   * the right words instead of hunting for them. Seeded once, not a controlled prop: the
   * picker is theirs to change from that starting point.
   */
  initialSubsections?: string[]
}) {
  const t = useT()
  // The active deck. VocabBuilder is remounted (key={lang}) when the language switches, so
  // per-language state (config, session, progress) simply starts fresh — no cross-over.
  const base = VOCAB[lang]
  const locale = useLocale()
  // One shared implementation (lib/use-deck-gloss.ts) — every surface that shows deck words
  // needs this, and each private copy was a place for English to leak back in.
  const deckGloss = useDeckGloss(locale, lang)
  const V = useMemo<VocabData>(() => ({ ...base, gloss: deckGloss }), [base, deckGloss])
  const [tab, setTab] = useState<Tab>('study')
  const [progress, setProgress] = useState<ProgressMap>({})
  const [config, setConfig] = useState<StudyConfig>(() => {
    const base = defaultConfig(V)
    // Only honour keys this deck actually has: a stale or wrong-language subsection would
    // otherwise select nothing and look like an empty deck rather than a bad argument.
    const wanted = (initialSubsections ?? []).filter(k => V.allSubsectionKeys.includes(k))
    return wanted.length ? { ...base, subsections: wanted } : base
  })
  const [sessionWords, setSessionWords] = useState<BgvbWord[] | null>(null)
  const [directions, setDirections] = useState<boolean[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)
  const [missedWordKeys, setMissedWordKeys] = useState<Set<string>>(new Set())

  useEffect(() => { setProgress(loadProgress(V.storageKey)) }, [V.storageKey])

  const previewWords = useMemo(() => filterWords(config, V), [config, V])

  // Launch one of the three study modes on the currently-selected vocab. Flashcards keeps its
  // SM-2 session machinery; Test yourself / Identify the word just take the shuffled word list.
  const startStudying = (mode: LaunchMode = 'flashcards') => {
    const words = shuffled(filterWords(config, V))
    setSessionWords(words)
    if (mode === 'flashcards') {
      setDirections(words.map(() => config.mode !== 'english-to-greek'))
      setIdx(0)
      setFlipped(false)
      setFinished(false)
      setSessionStats({ correct: 0, total: 0 })
      setMissedWordKeys(new Set())
    }
    setTab(mode)
  }

  // quality: 1 = Again, 3 = Hard (correct but difficult), 4 = Got it
  const advance = (quality: 1 | 3 | 4) => {
    if (!sessionWords) return
    // Flip to reveal before scoring
    if (!flipped) { setFlipped(true); return }
    const word = sessionWords[idx]
    const isAgain = quality === 1

    // Re-queue this card 4 positions ahead when answered "Again"
    if (isAgain) {
      setMissedWordKeys(prev => { const s = new Set(prev); s.add(wid(word)); return s })
      setSessionWords(prev => {
        if (!prev) return prev
        const next = [...prev]
        next.splice(Math.min(idx + 4, next.length), 0, word)
        return next
      })
    }

    // Update SM-2 progress
    const prev = progress[wid(word)]
    const result = sm2({
      easeFactor: prev?.easeFactor ?? 2.5,
      interval: prev?.interval ?? 1,
      repetitions: prev?.repetitions ?? 0,
      quality,
    })
    const updated: ProgressMap = {
      ...progress,
      [wid(word)]: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        dueDate: result.nextReviewDate.toISOString().slice(0, 10),
        correct: (prev?.correct ?? 0) + (quality >= 3 ? 1 : 0),
        total: (prev?.total ?? 0) + 1,
      },
    }
    saveProgress(V.storageKey, updated)
    setProgress(updated)
    setSessionStats(s => ({ correct: s.correct + (quality >= 3 ? 1 : 0), total: s.total + 1 }))

    // Only finish when not re-queuing and we've reached the end
    if (!isAgain && idx + 1 >= sessionWords.length) {
      setFinished(true)
    } else {
      setIdx(i => i + 1)
      setFlipped(false)
    }
  }

  // Start a new session using only the words missed this session
  const startMissed = () => {
    if (!sessionWords) return
    const seen = new Set<string>()
    const missed = sessionWords.filter(w => {
      if (!missedWordKeys.has(wid(w)) || seen.has(wid(w))) return false
      seen.add(wid(w))
      return true
    })
    if (missed.length === 0) return
    const dirs = missed.map(() => {
      if (config.mode === 'greek-to-english') return true
      if (config.mode === 'english-to-greek') return false
      return Math.random() > 0.5
    })
    setSessionWords(missed)
    setDirections(dirs)
    setIdx(0)
    setFlipped(false)
    setFinished(false)
    setSessionStats({ correct: 0, total: 0 })
    setMissedWordKeys(new Set())
    setTab('flashcards')
  }

  const TABS = [
    { id: 'study'  as Tab, label: t('vocab.study'),  action: () => setTab('study') },
    { id: 'browse' as Tab, label: t('vocab.browse'), action: () => setTab('browse') },
  ]

  return (
    <VocabCtx.Provider value={V}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex shrink-0 gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map(({ id, label, action }) => (
            <button
              key={id}
              onClick={action}
              className={clsx(
                'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* The printable word list these sections are taken from. Greek is the BGVB
            handout; Hebrew is generated from this deck by build-hebrew-vocab-pdf.ts. */}
        {(
          <a
            href={lang === 'greek'
              ? '/docs/bgvb-vocabulary-master-list.pdf'
              : '/downloads/hebrew-vocabulary-list.pdf'}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto mr-1 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
          >
            <FileText size={15} />
            <span className="hidden sm:inline">{t('vocab.printableWordList')}</span>
            <span className="sm:hidden">{t('vocab.wordList')}</span>
          </a>
        )}

        {onLangChange && (
          <div className="flex shrink-0 gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {([['greek', t('vocab.langGreek')], ['hebrew', t('vocab.langHebrew')]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => onLangChange(id)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  lang === id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'study' && (
        <StudySettings
          config={config}
          onChange={setConfig}
          cardCount={previewWords.length}
          onStart={startStudying}
        />
      )}

      {tab === 'test' && (
        <TestYourself words={sessionWords ?? []} onGoBack={() => setTab('study')} />
      )}

      {tab === 'identify' && (
        <IdentifyWord words={sessionWords ?? []} lang={lang} onGoBack={() => setTab('study')} />
      )}

      {tab === 'flashcards' && (
        <FlashcardPlayer
          sessionWords={sessionWords ?? []}
          directions={directions}
          idx={idx}
          flipped={flipped}
          finished={finished}
          sessionStats={sessionStats}
          missedWordKeys={missedWordKeys}
          config={config}
          onConfigChange={setConfig}
          onFlip={() => setFlipped(f => !f)}
          onReveal={() => setFlipped(true)}
          onHide={() => setFlipped(false)}
          onAdvance={advance}
          onPrev={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
          onNext={() => { setIdx(i => Math.min((sessionWords?.length ?? 1) - 1, i + 1)); setFlipped(false) }}
          onGoBack={() => setTab('study')}
          onRestart={() => { setSessionWords(prev => prev ? shuffled(prev) : prev); setIdx(0); setFlipped(false); setFinished(false); setSessionStats({ correct: 0, total: 0 }); setMissedWordKeys(new Set()) }}
          onStudyMissed={startMissed}
        />
      )}

      {tab === 'browse' && <BrowseView progress={progress} />}
    </div>
    </VocabCtx.Provider>
  )
}

// ── Flashcard player ──────────────────────────────────────────────────────────

function FlashcardPlayer({
  sessionWords, directions, idx, flipped, finished, sessionStats, missedWordKeys,
  config, onConfigChange, onFlip, onReveal, onHide, onAdvance, onPrev, onNext, onGoBack, onRestart, onStudyMissed,
}: {
  sessionWords: BgvbWord[]
  directions: boolean[]
  idx: number
  flipped: boolean
  finished: boolean
  sessionStats: { correct: number; total: number }
  missedWordKeys: Set<string>
  config: StudyConfig
  onConfigChange: (c: StudyConfig) => void
  onFlip: () => void
  onReveal: () => void
  onHide: () => void
  onAdvance: (quality: 1 | 3 | 4) => void
  onPrev: () => void
  onNext: () => void
  onGoBack: () => void
  onRestart: () => void
  onStudyMissed: () => void
}) {
  const t = useT()
  const V = useVocab()
  // Keyboard shortcuts (the desktop controls): ← / → move to the previous / next card,
  // ↑ reveals the translation and ↓ hides it (script only). Enter/Space still flip, and 1/2/3
  // still rate for anyone who wants spaced-repetition grading from the keyboard.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onFlip() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); onReveal() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); onHide() }
      else if (e.key === '1') { e.preventDefault(); onAdvance(1) }
      else if (e.key === '2') { e.preventDefault(); onAdvance(3) }
      else if (e.key === '3') { e.preventDefault(); onAdvance(4) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [flipped, onFlip, onReveal, onHide, onAdvance, onPrev, onNext])

  if (sessionWords.length === 0) {
    return (
      <div className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <p className="text-xl font-semibold text-gray-700">{t('vocab.noCardsMatch')}</p>
        <p className="text-gray-600 text-sm">{t('vocab.noCardsHint')}</p>
        <button onClick={onGoBack} className="btn bg-surface border border-brand-300 text-brand-700 hover:bg-brand-50 text-sm mt-2">← Back to settings</button>
      </div>
    )
  }

  if (finished) {
    const pct = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0
    // Deduplicate missed words preserving order of first occurrence
    const seen = new Set<string>()
    const missedWords = sessionWords.filter(w => {
      if (!missedWordKeys.has(wid(w)) || seen.has(wid(w))) return false
      seen.add(wid(w)); return true
    })
    return (
      <div className="max-w-lg mx-auto py-12 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-gray-700">{t('vocab.sessionComplete')}</p>
          <p className="text-6xl font-bold text-gray-900 py-2">{pct}%</p>
          <p className="text-gray-500 text-sm">
            {sessionStats.correct} correct · {sessionStats.total - sessionStats.correct} missed · {sessionStats.total} attempts
          </p>
        </div>

        {missedWords.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Words to review ({missedWords.length})</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {missedWords.map(w => (
                <div key={wid(w)} className="px-4 py-2.5 flex items-baseline justify-between gap-4">
                  <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-base font-semibold text-gray-900`}>{w.word}</span>
                  <span className="text-sm text-gray-600">{V.gloss(w)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button className="btn bg-surface border border-brand-300 text-brand-700 hover:bg-brand-50" onClick={onGoBack}>← Return</button>
          <button className="btn bg-surface border border-gray-300 text-gray-800 hover:bg-gray-50 flex-1 justify-center" onClick={onRestart}>{t('vocab.reviewAgain')}</button>
          {missedWords.length > 0 && (
            <button className="btn bg-surface border border-gray-300 text-gray-800 hover:bg-gray-50 flex-1 justify-center" onClick={onStudyMissed}>
              Study missed ({missedWords.length})
            </button>
          )}
        </div>
      </div>
    )
  }

  const word = sessionWords[idx]
  if (!word) return null

  const greekFirst = config.mode !== 'english-to-greek'

  return (
    <div className="space-y-6">
      {/* Header: back link + progress bar + counter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onGoBack} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
              <ChevronRight size={16} className="rotate-180" /> {t('action.back')}
            </button>
            <span className="text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full">§{word.section}</span>
            <span className="text-sm text-gray-500">{idx + 1} / {sessionWords.length}</span>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['greek-to-english', 'english-to-greek'] as const).map(m => (
              <button
                key={m}
                onClick={() => onConfigChange({ ...config, mode: m })}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  config.mode === m ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {m === 'greek-to-english' ? `${V.scriptLabel} → En` : `En → ${V.scriptLabel}`}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-400 rounded-full transition-all duration-300"
            style={{ width: `${(idx / sessionWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card + response buttons side by side */}
      <div className="flex items-center gap-4">
        {/* Card (clickable to flip) — fixed height so buttons never shift */}
        <div
          className="flex-1 cursor-pointer select-none h-52"
          onClick={onFlip}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFlip()}
          aria-label={t('vocab.flipCard')}
        >
          {/* One card, one layout: the front term stays locked in place and the translation
              simply fades in below it (its space is always reserved, so nothing shifts). Primary
              terms share one size (text-3xl); secondary lines share text-sm. */}
          <div className="bg-surface rounded-2xl h-full flex flex-col items-center justify-between p-6 shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center gap-1">
              {/* Front — never moves */}
              {greekFirst ? (
                <>
                  <p dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-3xl text-gray-900 font-bold text-center leading-snug`}>
                    {word.word}
                    {/* Greek only: the button speaks Erasmian, which has no Hebrew counterpart. */}
                    {!V.rtl && <SpeakGreek text={word.word} size={18} className="ml-2" />}
                  </p>
                  {word.inflection && <p dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-sm text-gray-500`}>{word.inflection}</p>}
                </>
              ) : (
                <>
                  <p className="text-3xl text-gray-900 font-semibold text-center">{V.gloss(word)}</p>
                  <p className="text-sm text-gray-500">{posLabelKey(word.pos) ? t(posLabelKey(word.pos)!) : word.pos}</p>
                </>
              )}
              {/* Back — space always reserved; fades in on reveal */}
              <div className={`flex flex-col items-center gap-1 transition-opacity duration-150 ${flipped ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!flipped}>
                <div className="my-1 w-12 h-px bg-gray-200" />
                {greekFirst ? (
                  <>
                    <p className="text-3xl text-gray-900 font-semibold text-center">{V.gloss(word)}</p>
                    <p className="text-sm text-gray-500">{posLabelKey(word.pos) ? t(posLabelKey(word.pos)!) : word.pos}</p>
                  </>
                ) : (
                  <>
                    <p dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-3xl text-gray-900 font-bold text-center`}>
                      {word.word}
                      {!V.rtl && <SpeakGreek text={word.word} size={18} className="ml-2" />}
                    </p>
                    {word.inflection && <p dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-sm text-gray-500`}>{word.inflection}</p>}
                  </>
                )}
                {word.freq && <p className="text-xs text-gray-300 mt-0.5">{t('vocab.freqInCorpus', { n: word.freq.toLocaleString(), corpus: t(V.corpusKey) })}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Response buttons — mobile/touch only. On desktop the four arrow keys drive
            everything (← → navigate, ↑ ↓ reveal/hide), so the grading buttons are hidden. */}
        <div className="lg:hidden flex flex-col gap-2 w-28 shrink-0">
          <button
            onClick={() => onAdvance(4)}
            className="py-3 text-sm font-semibold rounded-lg bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 transition-colors"
          >
            {t('vocab.gotIt')}
          </button>
          <button
            onClick={() => onAdvance(1)}
            className="py-2.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            {t('vocab.again')}
          </button>
          <button
            onClick={() => onAdvance(3)}
            className="py-2.5 text-xs font-medium rounded-lg bg-surface text-brand-700 border border-brand-200 hover:bg-brand-50 transition-colors"
          >
            {t('vocab.hard')}
          </button>
        </div>
      </div>

      {/* Controls sit BELOW the card, not inside it: the card is a fixed height with
          overflow hidden (so the buttons beside it never shift), and a revealed card —
          word, inflection, gloss, part of speech, frequency — filled that height and
          clipped the hints right off the bottom. Outside the card they are always visible,
          and they no longer swallow a click meant to flip. */}
      <p className="mt-2 text-center text-xs leading-relaxed tracking-wide text-gray-400">
        <span className="lg:hidden">{flipped ? `Tap for ${V.scriptName} only` : 'Tap to reveal'}</span>
        <span className="hidden lg:inline">
          {flipped
            ? <><span className="font-medium">↓</span> {V.scriptName} {t('vocab.hintOnly')} · <span className="font-medium">←</span> {t('vocab.hintBack')} · <span className="font-medium">→</span> {t('vocab.hintNext')}</>
            : <><span className="font-medium">↑</span> {t('vocab.hintReveal')} · <span className="font-medium">←</span> {t('vocab.hintBack')} · <span className="font-medium">→</span> {t('vocab.hintNext')}</>}
        </span>
      </p>

    </div>
  )
}

// ── Shared checkbox ───────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate = false, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className={clsx(
        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        checked || indeterminate
          ? 'bg-surface border-gray-300'
          : 'border-gray-300 hover:border-gray-400'
      )}
      aria-checked={indeterminate ? 'mixed' : checked}
      role="checkbox"
    >
      {checked && !indeterminate && <Check size={11} className="text-gray-700" strokeWidth={3} />}
      {indeterminate && <span className="block w-2 h-0.5 bg-gray-600 rounded-full" />}
    </button>
  )
}

// ── Test yourself: multiple-choice quiz ───────────────────────────────────────
// A one-question-at-a-time MC quiz over the selected words. Greek→English shows the word and
// asks for its meaning; English→Greek shows the meaning and asks for the word. Distractors are
// drawn from the whole deck (same part of speech first, so the choices are plausible). Fully
// client-side — no progress writes; it's a quick self-check on top of the flashcard SRS.
type QuizDir = 'greek-to-english' | 'english-to-greek'

function TestYourself({ words, onGoBack }: { words: BgvbWord[]; onGoBack: () => void }) {
  const t = useT()
  const V = useVocab()
  const [dir, setDir] = useState<QuizDir>('greek-to-english')
  const [qIdx, setQIdx] = useState(0)
  const [chosen, setChosen] = useState<BgvbWord | null>(null)
  const [correct, setCorrect] = useState(0)

  const questions = useMemo(() => {
    const key = (w: BgvbWord) => (dir === 'greek-to-english' ? V.gloss(w) : wid(w))
    return words.map(word => {
      const correctKey = key(word)
      const pool = shuffled(V.words.filter(w => key(w) !== correctKey))
      const distractors: BgvbWord[] = []
      const seen = new Set([correctKey])
      for (const c of [...pool.filter(w => w.pos === word.pos), ...pool]) {
        const k = key(c)
        if (seen.has(k)) continue
        seen.add(k); distractors.push(c)
        if (distractors.length >= 3) break
      }
      return { word, options: shuffled([word, ...distractors]) }
    })
  }, [words, dir, V.words])

  // Restart the run when the direction flips.
  useEffect(() => { setQIdx(0); setChosen(null); setCorrect(0) }, [dir])

  if (words.length === 0) {
    return <ModeShell title={t('vocab.multipleChoice')} onGoBack={onGoBack}><p className="py-16 text-center text-sm text-gray-400">{t('vocab.noWordsSelected')}</p></ModeShell>
  }

  const showWord = (w: BgvbWord) => (
    <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} font-semibold`}>{w.word}</span>
  )

  // Finished summary.
  if (qIdx >= questions.length) {
    const pct = Math.round((correct / questions.length) * 100)
    return (
      <ModeShell title={t('vocab.multipleChoice')} onGoBack={onGoBack}>
        <div className="max-w-md mx-auto py-12 text-center space-y-4">
          <p className="text-2xl font-bold text-gray-700">{t('vocab.quizComplete')}</p>
          <p className="text-6xl font-bold text-gray-900">{pct}%</p>
          <p className="text-sm text-gray-500">{correct} of {questions.length} correct</p>
          <button onClick={() => { setQIdx(0); setChosen(null); setCorrect(0) }}
            className="btn btn-primary px-6 py-2">{t('action.tryAgain')}</button>
        </div>
      </ModeShell>
    )
  }

  const q = questions[qIdx]
  const promptIsWord = dir === 'greek-to-english'
  const answer = (opt: BgvbWord) => {
    if (chosen) return
    setChosen(opt)
    if (opt === q.word) setCorrect(c => c + 1)
  }

  return (
    <ModeShell title={t('vocab.multipleChoice')} onGoBack={onGoBack}
      right={<span className="text-sm text-gray-500 tabular-nums">{qIdx + 1} / {questions.length} · {correct} correct</span>}>
      <div className="flex justify-center mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-xs">
          {([['greek-to-english', `${V.scriptName} → English`], ['english-to-greek', `English → ${V.scriptName}`]] as const).map(([d, label]) => (
            <button key={d} onClick={() => setDir(d)}
              className={clsx('px-3 py-1 rounded-md font-medium transition-colors', dir === d ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        <div className="bg-surface border border-gray-200 rounded-2xl px-6 py-8 text-center">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            {promptIsWord ? 'What does this mean?' : `Which ${V.scriptName} word?`}
          </p>
          <p className="text-3xl leading-snug text-gray-900" dir={promptIsWord && V.rtl ? 'rtl' : undefined}>
            {promptIsWord
              ? <span className={V.scriptClass}>{q.word.word}</span>
              : <>{V.gloss(q.word)} <span className="text-sm text-gray-400">({posLabelKey(q.word.pos) ? t(posLabelKey(q.word.pos)!) : q.word.pos})</span></>}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.word
            const isChosen = chosen === opt
            const state = !chosen ? 'idle' : isCorrect ? 'correct' : isChosen ? 'wrong' : 'dim'
            return (
              <button key={i} onClick={() => answer(opt)} disabled={!!chosen}
                className={clsx('rounded-xl border px-4 py-3 text-left text-lg transition-colors',
                  state === 'idle' && 'bg-surface border-gray-200 hover:border-brand-300 hover:bg-brand-50',
                  state === 'correct' && 'bg-green-50 border-green-300 text-green-800',
                  state === 'wrong' && 'bg-red-50 border-red-300 text-red-800',
                  state === 'dim' && 'bg-surface border-gray-100 text-gray-400')}>
                {promptIsWord
                  ? V.gloss(opt)
                  : <span dir={V.rtl ? 'rtl' : undefined} className={V.scriptClass}>{opt.word}</span>}
              </button>
            )
          })}
        </div>

        {chosen && (
          <div className="flex justify-end">
            <button onClick={() => { setChosen(null); setQIdx(i => i + 1) }} className="btn btn-primary px-6 py-2">
              {qIdx + 1 >= questions.length ? t('vocab.seeResults') : t('action.next')} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </ModeShell>
  )
}

// ── Identify the word: find the target word in a real sentence ─────────────────
// Given the English meaning of a selected word, the student clicks the word in a real NT (Greek)
// or MT (Hebrew) sentence that has that meaning. Sentences come from /api/vocab-sentence (a verse
// containing an inflected form of the word, with the target position(s) marked). Trains
// recognition of the lexeme across its inflections, in context.
interface SentenceItem { ref: string; tokens: string[]; targets: number[]; rtl: boolean; loc?: { book: string; chapter: number; verse: number } | null }

function IdentifyWord({ words, lang, onGoBack }: { words: BgvbWord[]; lang: VocabLang; onGoBack: () => void }) {
  const t = useT()
  const V = useVocab()
  const [qIdx, setQIdx] = useState(0)
  const [item, setItem] = useState<SentenceItem | null | 'loading' | 'none'>('loading')
  const [picked, setPicked] = useState<number | null>(null)
  const [translation, setTranslation] = useState<string | null | 'loading'>(null)
  const [correct, setCorrect] = useState(0)
  const [asked, setAsked] = useState(0)

  const word = words[qIdx]

  useEffect(() => {
    if (!word) return
    setItem('loading'); setPicked(null); setTranslation(null)
    const param = lang === 'hebrew'
      ? `corpus=MT&strongs=${encodeURIComponent((word.id ?? '').split('|')[1] ?? '')}`
      : `corpus=GNT&lemma=${encodeURIComponent(word.word)}`
    const ctrl = new AbortController()
    fetch(`/api/vocab-sentence?${param}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then((d: SentenceItem | { error: string } | null) => {
        setItem(d && 'tokens' in d ? d : 'none')
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [qIdx, word, lang])

  // Once the student answers, fetch the English translation of the verse to show below it.
  useEffect(() => {
    if (picked == null || typeof item === 'string' || !item?.loc) return
    const { book, chapter, verse } = item.loc
    setTranslation('loading')
    const ctrl = new AbortController()
    fetch(`/api/translation?book=${encodeURIComponent(book)}&chapter=${chapter}&lang=en`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then((d: { verses?: Record<string, string> } | null) => {
        // The translation API keys verses by full OSIS id (e.g. "Rom.4.2").
        setTranslation(d?.verses?.[`${book}.${chapter}.${verse}`] ?? null)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [picked, item])

  if (words.length === 0) {
    return <ModeShell title={t('vocab.identifyWord')} onGoBack={onGoBack}><p className="py-16 text-center text-sm text-gray-400">{t('vocab.noWordsSelected')}</p></ModeShell>
  }

  if (qIdx >= words.length) {
    const pct = asked > 0 ? Math.round((correct / asked) * 100) : 0
    return (
      <ModeShell title={t('vocab.identifyWord')} onGoBack={onGoBack}>
        <div className="max-w-md mx-auto py-12 text-center space-y-4">
          <p className="text-2xl font-bold text-gray-700">{t('action.done')}</p>
          <p className="text-6xl font-bold text-gray-900">{pct}%</p>
          <p className="text-sm text-gray-500">{correct} of {asked} correct{asked < words.length ? ` · ${words.length - asked} had no example` : ''}</p>
          <button onClick={() => { setQIdx(0); setCorrect(0); setAsked(0) }} className="btn btn-primary px-6 py-2">{t('action.startOver')}</button>
        </div>
      </ModeShell>
    )
  }

  const next = () => { setPicked(null); setQIdx(i => i + 1) }
  const pick = (i: number) => {
    if (picked != null || item === 'loading' || item === 'none' || !item) return
    setPicked(i)
    setAsked(a => a + 1)
    if (item.targets.includes(i)) setCorrect(c => c + 1)
  }

  return (
    <ModeShell title={t('vocab.identifyWord')} onGoBack={onGoBack}
      right={<span className="text-sm text-gray-500 tabular-nums">{qIdx + 1} / {words.length} · {correct}/{asked}</span>}>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Clue: given this English meaning, click the matching word in the verse below. */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t('vocab.whichWordMeans')}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {V.gloss(word)} <span className="text-sm font-normal text-gray-400">({posLabelKey(word.pos) ? t(posLabelKey(word.pos)!) : word.pos})</span>
          </p>
        </div>

        {item === 'loading' ? (
          <p className="py-10 text-center text-sm text-gray-400">{t('vocab.findingSentence')}</p>
        ) : item === 'none' || !item ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-gray-400">{t('vocab.noExampleSentence')}</p>
            <button onClick={next} className="btn btn-primary px-6 py-2">Skip <ChevronRight size={16} /></button>
          </div>
        ) : (
          <>
            {/* The sentence — click the word that matches the clue. */}
            <div dir={item.rtl ? 'rtl' : undefined}
              className={`bg-surface border border-gray-200 rounded-2xl px-5 py-7 text-3xl leading-relaxed text-center ${item.rtl ? 'font-hebrew' : 'greek-text'}`}>
              {item.tokens.map((tok, i) => {
                const isTarget = item.targets.includes(i)
                const state = picked == null ? 'idle' : isTarget ? 'correct' : picked === i ? 'wrong' : 'idle'
                return (
                  <span key={i}>
                    <span onClick={() => pick(i)}
                      className={clsx('rounded-md px-1 py-0.5 transition-colors',
                        picked == null && 'cursor-pointer hover:bg-brand-100',
                        state === 'correct' && 'bg-green-100 text-green-800',
                        state === 'wrong' && 'bg-red-100 text-red-800')}>
                      {tok}
                    </span>
                    {i < item.tokens.length - 1 ? ' ' : ''}
                  </span>
                )
              })}
            </div>

            {/* Before answering: a hint. After: a reveal panel grouping the result, the verse
                translation, and its reference (which deep-links into the Reader). */}
            {picked == null ? (
              <p className="text-center text-sm text-gray-400 italic">{t('vocab.clickMatchingWord')}</p>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-surface p-4">
                <div className="flex items-center gap-2">
                  {item.targets.includes(picked)
                    ? <CheckCircle2 size={18} className="flex-none text-green-600" />
                    : <XCircle size={18} className="flex-none text-red-600" />}
                  <span className={clsx('text-base font-semibold', item.targets.includes(picked) ? 'text-green-700' : 'text-red-700')}>
                    {item.targets.includes(picked) ? t('vocab.correct') : t('vocab.notQuite')}
                  </span>
                </div>

                {translation && translation !== 'loading' && (
                  <p className="mt-3 text-lg italic leading-relaxed text-gray-600">{translation}</p>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  {item.rtl ? (
                    <span className="text-xs text-gray-400">{item.ref}</span>
                  ) : (
                    <Link href={`/reader?ref=${encodeURIComponent(item.ref)}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline">
                      <BookOpen size={12} /> {item.ref} · open in Reader
                    </Link>
                  )}
                  <button onClick={next} className="btn btn-primary px-6 py-2 flex-none">
                    {qIdx + 1 >= words.length ? t('vocab.seeResults') : t('action.next')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ModeShell>
  )
}

// Shared frame for the Test/Identify modes: a back button and an optional right slot. The page
// header is intentionally omitted — the mode is already obvious from the launch button and the
// clue on screen, so a centered title just repeated it.
function ModeShell({ title, right, onGoBack, children }: { title: string; right?: ReactNode; onGoBack: () => void; children: ReactNode }) {
  return (
    <div aria-label={title}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onGoBack} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
          <ChevronRight size={16} className="rotate-180" /> Back
        </button>
        <span className="min-w-[6rem] text-right">{right}</span>
      </div>
      {children}
    </div>
  )
}

// ── Study Settings ────────────────────────────────────────────────────────────

function StudySettings({
  config, onChange, cardCount, onStart,
}: {
  config: StudyConfig
  onChange: (c: StudyConfig) => void
  cardCount: number
  onStart: (mode: LaunchMode) => void
}) {
  const t = useT()
  const narrow = useNarrowScreen()
  const bandL = useBandLabels()
  const V = useVocab()
  const isGreek = V.scriptName === 'Greek'
  const [expandedSections, setExpandedSections] = useState<number[]>(V.sections)
  const [listSubKey, setListSubKey] = useState<string | null>(null)
  const [subListMode, setSubListMode] = useState<Record<string, SectionListMode>>({})

  const subSet = useMemo(() => new Set(config.subsections), [config.subsections])

  // Section-level selection state: 'all' | 'none' | 'partial'
  const sectionState = (s: number): 'all' | 'none' | 'partial' => {
    const keys = V.subsections[s].map(sub => sub.key)
    const selectedCount = keys.filter(k => subSet.has(k)).length
    if (selectedCount === 0) return 'none'
    if (selectedCount === keys.length) return 'all'
    return 'partial'
  }

  const toggleSection = (s: number) => {
    const sectionKeys = V.subsections[s].map(sub => sub.key)
    const state = sectionState(s)
    if (state === 'all') {
      onChange({ ...config, subsections: config.subsections.filter(k => !sectionKeys.includes(k)) })
    } else {
      const next = Array.from(new Set([...config.subsections, ...sectionKeys]))
      onChange({ ...config, subsections: next })
    }
  }

  const toggleSubsection = (key: string) => {
    const next = subSet.has(key)
      ? config.subsections.filter(k => k !== key)
      : [...config.subsections, key]
    onChange({ ...config, subsections: next })
  }

  const togglePos = (p: string) => {
    const next = config.pos.includes(p)
      ? config.pos.filter(x => x !== p)
      : [...config.pos, p].sort()
    onChange({ ...config, pos: next })
  }

  const toggleExpand = (s: number) => {
    setExpandedSections(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const disabled = cardCount === 0 || config.pos.length === 0

  return (
    <div className="space-y-5">
      {/* Study-mode row: three ways to drill the selected vocab. Flashcards keeps the far-left
          third (its original spot); Test yourself + Identify the word share the rest. All three
          run on the same section/POS selection below. */}
      {disabled ? (
        <button disabled
          className="w-full btn bg-surface border border-gray-300 text-gray-400 py-4 text-lg justify-center opacity-60 cursor-not-allowed">
          {t('vocab.noCardsAdjust')}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onStart('flashcards')}
            className="btn bg-surface border border-gray-300 text-gray-800 hover:bg-gray-50 active:bg-gray-100 py-4 text-base sm:text-lg justify-center"
          >
            {t('vocab.flashcards')}
          </button>
          <button
            onClick={() => onStart('test')}
            title={t('vocab.mcTooltip')}
            className="btn bg-surface border border-gray-300 text-gray-800 hover:bg-gray-50 active:bg-gray-100 py-4 text-base sm:text-lg justify-center"
          >
            {t('vocab.multipleChoice')}
          </button>
          <button
            onClick={() => onStart('identify')}
            title={t('vocab.identifyTooltip')}
            className="btn bg-surface border border-gray-300 text-gray-800 hover:bg-gray-50 active:bg-gray-100 py-4 text-base sm:text-lg justify-center"
          >
            {t('vocab.identifyWord')}
          </button>
        </div>
      )}

      {/* Single settings panel */}
      <div className="bg-surface border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">

        {/* Frequency Sections */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('vocab.frequencySections')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => onChange({ ...config, subsections: [...V.allSubsectionKeys] })}
                className="text-sm text-gray-700 hover:underline font-medium"
              >
                {t('action.all')}
              </button>
              <button
                onClick={() => onChange({ ...config, subsections: [] })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {t('action.clear')}
              </button>
            </div>
          </div>

          {/* Course bands: which sections belong to Beginning vs Intermediate Greek.
              Greek only — the Hebrew deck's sections don't map to these courses. */}
          {isGreek && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {BAND_LEGEND.map(b => (
                <span
                  key={b.band}
                  className={clsx('text-xs px-2 py-0.5 rounded-full border', b.chip)}
                >
                  {bandL.name(b.band)} · {bandL.freq(b.band)}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            {V.sections.map(s => {
              const state = sectionState(s)
              const isExpanded = expandedSections.includes(s)
              const subs = V.subsections[s]
              const coverage = V.coverage[s]
              const band = isGreek ? bandForSection(s) : null
              const sectionRange = freqRange(subs.flatMap(sub => sub.words))

              return (
                <div
                  key={s}
                  className={clsx(
                    'rounded-lg border overflow-hidden transition-colors',
                    'border-gray-200',
                    band?.edge
                  )}
                >
                  {/* Section row */}
                  <div className="flex items-center px-4 py-3 gap-3 bg-surface">
                    <Checkbox
                      checked={state === 'all'}
                      indeterminate={state === 'partial'}
                      onChange={() => toggleSection(s)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-medium text-gray-900">{t('vocab.sectionN', { n: s })}</span>
                      {band && (
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full border ml-2 align-middle', band.chip)}>
                          {bandL.short(band.band)}
                        </span>
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        {t('vocab.wordCount', { n: subs.reduce((n, sub) => n + sub.words.length, 0) })}
                        {sectionRange && <> · {sectionRange}</>}
                        {' '}· {t('vocab.upToCoverage', { pct: coverage, corpus: t(V.corpusKey) })}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleExpand(s)}
                      className="p-0.5 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-surface space-y-3">
                      {/* Chip grid — each chip has a selection button + list toggle */}
                      <div className="grid grid-cols-8 gap-2">
                        {subs.map(sub => {
                          const isSubSelected = subSet.has(sub.key)
                          const isListed = listSubKey === sub.key
                          return (
                            <div key={sub.key} className="flex flex-col gap-1">
                              {/* Selection chip */}
                              <button
                                onClick={() => toggleSubsection(sub.key)}
                                className={clsx(
                                  'flex flex-col items-center justify-center py-2.5 rounded-lg border text-center transition-colors',
                                  // Selected sections carry the brand tint, not a grey one step off
                                  // the unselected chip: which sections are on is the whole state of
                                  // this picker, and in grey alone it was easy to misread. The
                                  // unselected code sits at full strength too — students scanning
                                  // for the section a quiz names reported it as hard to read.
                                  isSubSelected
                                    ? 'bg-brand-100 border-brand-400 text-brand-900 ring-1 ring-brand-300'
                                    : 'bg-surface border-gray-200 text-gray-800 hover:text-gray-900'
                                )}
                              >
                                <span className="text-base font-semibold leading-none">{sub.label}</span>
                                <span className={clsx('text-xs mt-1 leading-none', isSubSelected ? 'text-brand-700' : 'text-gray-600')}>
                                  {sub.rankRange}
                                </span>
                              </button>
                              {/* Word-list toggle */}
                              <button
                                onClick={() => setListSubKey(isListed ? null : sub.key)}
                                title={`View ${sub.label} word list`}
                                className={clsx(
                                  'flex items-center justify-center py-1 rounded border text-center transition-colors',
                                  isListed
                                    ? 'border-gray-200 bg-gray-50 text-gray-700'
                                    : 'border-gray-200 text-gray-500 hover:text-gray-700'
                                )}
                              >
                                <List size={11} />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Inline word list for the active subsection in this section */}
                      {listSubKey && subs.some(sub => sub.key === listSubKey) && (() => {
                        const sub = subs.find(sub => sub.key === listSubKey)!
                        const mode: SectionListMode = subListMode[sub.key] ?? 'greek-english'
                        const setMode = (m: SectionListMode) =>
                          setSubListMode(prev => ({ ...prev, [sub.key]: m }))
                        // One column on a phone for word+gloss, two for the single-language lists. Two columns
                        // of ~130px each showed neither the whole Greek/Hebrew word nor its English.
                        const cols = mode === 'greek-english' ? (narrow ? 1 : 2) : (narrow ? 2 : 3)
                        return (
                          <div className="rounded-lg border border-gray-200 overflow-hidden">
                            {/* List header */}
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                              <p className="text-sm font-semibold text-gray-700">
                                §{s}{sub.label} · Words {sub.rankRange}
                                <span className="text-gray-400 font-normal ml-1.5">({t('vocab.wordCountPlural', { count: sub.words.length, n: sub.words.length })})</span>
                                {freqRange(sub.words) && (
                                  <span className="text-gray-500 font-normal ml-1.5">· {freqRange(sub.words)}</span>
                                )}
                              </p>
                              <div className="flex items-center gap-2">
                                {/* Mode toggle */}
                                <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5">
                                  {(['greek-english', 'greek', 'english'] as const).map(m => (
                                    <button
                                      key={m}
                                      onClick={() => setMode(m)}
                                      className={clsx(
                                        'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                                        mode === m
                                          ? 'bg-surface text-gray-900 shadow-sm'
                                          : 'text-gray-400 hover:text-gray-600'
                                      )}
                                    >
                                      {m === 'greek-english' ? `${V.scriptName}-English` : m === 'greek' ? V.scriptName : 'English'}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => setListSubKey(null)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            </div>
                            {/* Word rows */}
                            <div className={clsx('grid', cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                              {sub.words.map((w, i) => (
                                <div
                                  key={wid(w)}
                                  className={clsx(
                                    'px-4 py-2.5',
                                    i % cols !== cols - 1 ? 'border-r border-gray-100' : '',
                                    i < sub.words.length - cols ? 'border-b border-gray-100' : ''
                                  )}
                                >
                                  {mode === 'greek-english' && (
                                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                                      <div className="min-w-0 flex-1 sm:truncate">
                                        <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-base font-semibold text-gray-900`}>{w.word}</span>
                                        {w.inflection && (
                                          <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-xs text-gray-400 ml-1`}>{w.inflection}</span>
                                        )}
                                        <span className="text-sm text-gray-600 ml-1.5">{V.gloss(w)}</span>
                                      </div>
                                      {w.freq && (
                                        <span className="text-xs text-gray-300 shrink-0">×{w.freq.toLocaleString()}</span>
                                      )}
                                    </div>
                                  )}
                                  {mode === 'greek' && (
                                    <div className="flex items-baseline gap-1.5 min-w-0">
                                      <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-base font-semibold text-gray-900`}>{w.word}</span>
                                      {w.inflection && (
                                        <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-xs text-gray-400`}>{w.inflection}</span>
                                      )}
                                    </div>
                                  )}
                                  {mode === 'english' && (
                                    <span className="text-sm text-gray-700">{V.gloss(w)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Glanz bands (Hebrew): the OTST 551 weekly list. Quiz titles name these —
            "Week 5 — Vocabulary Quiz (Glanz 1E)" — so a student clicks the same band here
            and studies exactly the twenty words that quiz draws on. */}
        {V.bands && V.bands.length > 0 && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('vocab.glanzBands')}</p>
              <button
                onClick={() => onChange({ ...config, subsections: config.subsections.filter(k => !V.bands!.some(b => b.key === k)) })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {t('action.clear')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">{t('vocab.glanzBandsQuizHint')}</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {V.bands.map(b => {
                const isSelected = subSet.has(b.key)
                const isListed = listSubKey === b.key
                return (
                  <div key={b.key} className="flex flex-col gap-1">
                    <button
                      onClick={() => toggleSubsection(b.key)}
                      className={clsx(
                        'flex flex-col items-center justify-center py-2.5 rounded-lg border text-center transition-colors',
                        // Same treatment as the §-subsection chips above, so the two grids of
                        // chips cannot disagree about what "selected" looks like.
                        isSelected
                          ? 'bg-brand-100 border-brand-400 text-brand-900 ring-1 ring-brand-300'
                          : 'bg-surface border-gray-200 text-gray-800 hover:text-gray-900'
                      )}
                    >
                      <span className="text-base font-semibold leading-none">{b.label}</span>
                      <span className={clsx('text-xs mt-1 leading-none', isSelected ? 'text-brand-700' : 'text-gray-600')}>
                        {b.rankRange}
                      </span>
                    </button>
                    <button
                      onClick={() => setListSubKey(isListed ? null : b.key)}
                      title={`View ${b.label} word list`}
                      className={clsx(
                        'flex items-center justify-center py-1 rounded border text-center transition-colors',
                        isListed ? 'border-gray-200 bg-gray-50 text-gray-700' : 'border-gray-200 text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <List size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
            {listSubKey && V.bands.some(b => b.key === listSubKey) && (() => {
              const b = V.bands!.find(b => b.key === listSubKey)!
              return (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    {b.key}
                    <span className="text-gray-400 font-normal ml-1.5">({t('vocab.wordCountPlural', { count: b.words.length, n: b.words.length })})</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    {b.words.map(w => (
                      <div key={wid(w)} className="flex items-baseline justify-between gap-2 py-1 border-b border-gray-100 min-w-0">
                        <div className="min-w-0 flex-1">
                          <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-base font-semibold text-gray-900`}>{w.word}</span>
                          {w.inflection && (
                            <span dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-xs text-gray-400 ml-1`}>{w.inflection}</span>
                          )}
                          <span className="text-sm text-gray-600 ml-1.5">{V.gloss(w)}</span>
                        </div>
                        {w.freq && <span className="text-xs text-gray-300 shrink-0">×{w.freq.toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Part of Speech */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('vocab.partOfSpeech')}</p>
            <div className="flex gap-3">
              <button onClick={() => onChange({ ...config, pos: [...V.allPos] })} className="text-sm text-gray-700 hover:underline font-medium">{t('action.all')}</button>
              <button onClick={() => onChange({ ...config, pos: [] })} className="text-sm text-gray-500 hover:text-gray-700">{t('action.clear')}</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {V.allPos.map(p => {
              const isSelected = config.pos.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePos(p)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left transition-colors',
                    isSelected
                      ? 'border-gray-300 bg-gray-100 text-gray-900'
                      : 'border-gray-200 bg-surface text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className={clsx(
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-surface border-gray-300' : 'border-gray-300'
                  )}>
                    {isSelected && <Check size={11} className="text-gray-700" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-medium">{posLabelKey(p) ? t(posLabelKey(p)!) : p}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Browse view ──────────────────────────────────────────────────────────────

function BrowseView({ progress }: { progress: ProgressMap }) {
  const t = useT()
  const V = useVocab()
  const [query, setQuery] = useState('')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterPos, setFilterPos] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return V.words.filter(w => {
      if (filterSection !== 'all' && w.section !== Number(filterSection)) return false
      if (filterPos !== 'all' && w.pos !== filterPos) return false
      if (!q) return true
      return (
        w.word.toLowerCase().includes(q) ||
        V.gloss(w).toLowerCase().includes(q) ||
        (w.inflection ?? '').toLowerCase().includes(q)
      )
    })
  }, [query, filterSection, filterPos, V.words])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={V.scriptName === 'Hebrew' ? t('vocab.searchHebrewOrEnglish') : t('vocab.searchGreekOrEnglish')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input pl-8 text-sm w-full"
          />
        </div>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="input text-sm w-auto">
          <option value="all">{t('vocab.allSections')}</option>
          {V.sections.map(s => <option key={s} value={s}>{t('vocab.sectionN', { n: s })}</option>)}
        </select>
        <select value={filterPos} onChange={e => setFilterPos(e.target.value)} className="input text-sm w-auto">
          <option value="all">{t('vocab.allParts')}</option>
          {V.allPos.map(p => <option key={p} value={p}>{posLabelKey(p) ? t(posLabelKey(p)!) : p}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-400">{t('vocab.wordCountPlural', { count: filtered.length, n: filtered.length })}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map(w => {
          const p = progress[wid(w)]
          const mastered = p && p.repetitions >= 3 && !isDue(p)
          return (
            <div
              key={wid(w)}
              className={clsx(
                'border rounded-lg p-3 flex justify-between items-start gap-2',
                mastered ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-surface'
              )}
            >
              <div className="min-w-0">
                <p dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-base font-medium text-gray-900 leading-tight`}>{w.word}</p>
                {w.inflection && <p dir={V.rtl ? 'rtl' : undefined} className={`${V.scriptClass} text-xs text-gray-400`}>{w.inflection}</p>}
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">{V.gloss(w)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">§{w.section}</span>
                <span className="text-xs text-gray-400">{posLabelKey(w.pos) ? t(posLabelKey(w.pos)!) : w.pos}</span>
                {w.freq && <span className="text-xs text-gray-300">×{w.freq}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
