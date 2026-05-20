'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MoreVertical, X } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { GreekVerse } from './GreekVerse'
import { ParsingPanel } from './ParsingPanel'
import { SyntaxMenu } from './SyntaxMenu'
import type { BiblicalBook, BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { SyntaxEntry, SyntaxContext } from '@/lib/wallace-categories'
import { loadGbi, type GbiEntry } from '@/lib/gbi-data'
import { loadAbsSyntax, type AbsSyntaxEntry } from '@/lib/abs-syntax'
import { loadMaculaSyntax } from '@/lib/macula-syntax'
import { parseReference } from '@/lib/parseReference'
import { normalizeGreek } from '@/lib/greek-utils'

// ── Lazy syntax.json loader ────────────────────────────────────────────────────
let _syntaxCache: Record<string, SyntaxEntry> | null = null
let _syntaxLoading = false
const _syntaxCallbacks: Array<(data: Record<string, SyntaxEntry>) => void> = []

function loadSyntax(): Promise<Record<string, SyntaxEntry>> {
  if (_syntaxCache) return Promise.resolve(_syntaxCache)
  return new Promise(resolve => {
    _syntaxCallbacks.push(resolve)
    if (!_syntaxLoading) {
      _syntaxLoading = true
      fetch('/data/syntax.json')
        .then(r => r.json())
        .then((data: Record<string, SyntaxEntry>) => {
          _syntaxCache = data
          _syntaxCallbacks.splice(0).forEach(cb => cb(data))
        })
        .catch(() => {
          _syntaxCache = {}
          _syntaxCallbacks.splice(0).forEach(cb => cb({}))
        })
    }
  })
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface TextSection {
  key: string
  bookName: string
  corpus: string
  verses: BiblicalVerse[]
}

interface CorpusSeries {
  sections: TextSection[]
  queueIdx: number
  done: boolean
}

interface ChapterItem {
  osisId: string
  chapter: number
  bookName: string
  corpus: string
}

type FontSize = 'sm' | 'md' | 'lg' | 'xl'

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '0.9rem',
  md: '1.125rem',
  lg: '1.375rem',
  xl: '1.65rem',
}

const PARALLEL_LANGS = [
  { code: 'en', label: 'English', sub: 'World English Bible' },
  { code: 'es', label: 'Spanish', sub: 'Reina-Valera 1909' },
  { code: 'fr', label: 'French', sub: 'Louis Segond 1910' },
  { code: 'pt', label: 'Portuguese', sub: 'João Ferreira de Almeida (ARC)' },
  { code: 'ru', label: 'Russian', sub: 'Russian Synodal Bible' },
  { code: 'ko', label: 'Korean', sub: 'Korean Revised Version' },
  { code: 'zh', label: 'Mandarin', sub: 'Chinese Union Version' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

const LOOKAHEAD = 800

function buildQueue(books: BiblicalBook[]): ChapterItem[] {
  return books.flatMap(b =>
    Array.from({ length: b.totalChapters }, (_, i) => ({
      osisId: b.osisId,
      chapter: i + 1,
      bookName: b.name,
      corpus: b.corpus,
    }))
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function GreekReader() {
  // ── Corpus queues & loaded sections ─────────────────────────────────────────
  const [gntQueue, setGntQueue] = useState<ChapterItem[]>([])
  const [lxxQueue, setLxxQueue] = useState<ChapterItem[]>([])
  const [gnt, setGnt] = useState<CorpusSeries>({ sections: [], queueIdx: 0, done: false })
  const [lxx, setLxx] = useState<CorpusSeries>({ sections: [], queueIdx: 0, done: false })

  // ── Word interaction ─────────────────────────────────────────────────────────
  const [activeWordId, setActiveWordId]   = useState<string | null>(null)
  const [parsingInfo, setParsingInfo]     = useState<LexicalInfoPanel | null>(null)
  const [lockedInfo, setLockedInfo]       = useState<LexicalInfoPanel | null>(null)

  // ── Search ───────────────────────────────────────────────────────────────────
  const [searchResults, setSearchResults]   = useState<BiblicalVerse[] | null>(null)
  const [searchType, setSearchType]         = useState<'word' | 'reference' | null>(null)
  const [wordSearchTerm, setWordSearchTerm] = useState<string | null>(null)   // normalized
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null)
  const [searchLoading, setSearchLoading]   = useState(false)

  // ── Settings ─────────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings]     = useState(false)
  const [fontSize, setFontSize]             = useState<FontSize>('md')
  const [parallelLang, setParallelLang]     = useState<string | null>(null)
  const [translationVerses, setTranslationVerses] = useState<Record<string, string>>({})
  const [wallaceOn, setWallaceOn]           = useState(true)
  const [proielOn,  setProielOn]            = useState(true)
  const [gbiOn,     setGbiOn]              = useState(true)
  const [absOn,     setAbsOn]              = useState(true)

  type GntEdition = 'tischendorf' | 'nestle1904'
  const [gntEdition, setGntEdition]         = useState<GntEdition>('tischendorf')

  // ── Syntax right-click menu ────────────────────────────────────────────────
  const [syntaxMenu, setSyntaxMenu] = useState<{
    word: VerseWord
    syntax: SyntaxEntry | null
    gbiEntry: GbiEntry | null
    absEntry: AbsSyntaxEntry | null
    ctx: SyntaxContext
    x: number
    y: number
  } | null>(null)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const textPanelRef  = useRef<HTMLDivElement>(null)
  const settingsRef   = useRef<HTMLDivElement>(null)
  const gntSentinel   = useRef<HTMLDivElement>(null)
  const lxxSentinel   = useRef<HTMLDivElement>(null)
  const verseRefs     = useRef<Record<string, HTMLElement>>({})

  const gntLoading  = useRef(false)
  const lxxLoading  = useRef(false)

  const gntRef      = useRef(gnt)
  const lxxRef      = useRef(lxx)
  const gntQueueRef = useRef(gntQueue)
  const lxxQueueRef = useRef(lxxQueue)
  const parsingRef  = useRef(parsingInfo)
  const lockedRef   = useRef(lockedInfo)
  const fetchedTransKeys = useRef<Set<string>>(new Set())

  useEffect(() => { gntRef.current      = gnt },        [gnt])
  useEffect(() => { lxxRef.current      = lxx },        [lxx])
  useEffect(() => { gntQueueRef.current = gntQueue },   [gntQueue])
  useEffect(() => { lxxQueueRef.current = lxxQueue },   [lxxQueue])
  useEffect(() => { parsingRef.current  = parsingInfo }, [parsingInfo])
  useEffect(() => { lockedRef.current   = lockedInfo },  [lockedInfo])

  // ── Close settings on outside click ─────────────────────────────────────────

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // ── Fetch chapters ───────────────────────────────────────────────────────────

  const fetchChapter = useCallback(async (item: ChapterItem): Promise<TextSection | null> => {
    try {
      const res  = await fetch(`/api/reader?book=${item.osisId}&chapter=${item.chapter}`)
      const data = await res.json()
      if (!data.verses?.length) return null
      return { key: `${item.osisId}-${item.chapter}`, bookName: item.bookName, corpus: item.corpus, verses: data.verses }
    } catch { return null }
  }, [])

  const loadMoreGnt = useCallback(async () => {
    const series = gntRef.current
    const queue  = gntQueueRef.current
    if (gntLoading.current || series.done || !queue.length) return
    const item = queue[series.queueIdx]
    if (!item) { setGnt(s => ({ ...s, done: true })); return }
    gntLoading.current = true
    const section = await fetchChapter(item)
    setGnt(s => ({
      sections: section ? [...s.sections, section] : s.sections,
      queueIdx: s.queueIdx + 1,
      done: s.queueIdx + 1 >= queue.length,
    }))
    gntLoading.current = false
  }, [fetchChapter])

  const loadMoreLxx = useCallback(async () => {
    const series = lxxRef.current
    const queue  = lxxQueueRef.current
    if (lxxLoading.current || series.done || !queue.length) return
    const item = queue[series.queueIdx]
    if (!item) { setLxx(s => ({ ...s, done: true })); return }
    lxxLoading.current = true
    const section = await fetchChapter(item)
    setLxx(s => ({
      sections: section ? [...s.sections, section] : s.sections,
      queueIdx: s.queueIdx + 1,
      done: s.queueIdx + 1 >= queue.length,
    }))
    lxxLoading.current = false
  }, [fetchChapter])

  // ── Mount: seed LXX corpus ───────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/reader?corpus=LXX')
      .then(r => r.json())
      .then(lxxData => {
        const lxxQ = buildQueue(lxxData.books ?? [])
        setLxxQueue(lxxQ)
        if (lxxQ[0]) {
          lxxLoading.current = true
          fetchChapter(lxxQ[0]).then(section => {
            setLxx({ sections: section ? [section] : [], queueIdx: 1, done: 1 >= lxxQ.length })
            lxxLoading.current = false
          })
        }
      })
      .catch(() => {})
  }, [fetchChapter])

  // ── GNT edition: load/reload GNT corpus when edition changes ─────────────────
  // Also runs on mount (initial value 'tischendorf') to seed the first GNT chapter.

  useEffect(() => {
    setGnt({ sections: [], queueIdx: 0, done: false })
    gntLoading.current = false
    const corpus = gntEdition === 'nestle1904' ? 'NA1904' : 'GNT'
    fetch(`/api/reader?corpus=${corpus}`)
      .then(r => r.json())
      .then(data => {
        const q = buildQueue(data.books ?? [])
        setGntQueue(q)
        if (q[0]) {
          gntLoading.current = true
          fetchChapter(q[0]).then(section => {
            setGnt({ sections: section ? [section] : [], queueIdx: 1, done: 1 >= q.length })
            gntLoading.current = false
          })
        }
      })
      .catch(() => {})
  }, [gntEdition, fetchChapter])

  // ── Scroll-based infinite loading ────────────────────────────────────────────

  useEffect(() => {
    const panel = textPanelRef.current
    if (!panel) return

    function onScroll() {
      const panelBottom = panel!.getBoundingClientRect().bottom
      if (gntSentinel.current && !gntRef.current.done) {
        if (gntSentinel.current.getBoundingClientRect().top < panelBottom + LOOKAHEAD) loadMoreGnt()
      }
      if (lxxSentinel.current && !lxxRef.current.done) {
        if (lxxSentinel.current.getBoundingClientRect().top < panelBottom + LOOKAHEAD) loadMoreLxx()
      }
    }

    panel.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => panel.removeEventListener('scroll', onScroll)
  }, [loadMoreGnt, loadMoreLxx])

  // ── Shift: freeze / unfreeze parsing panel ───────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Shift' || e.repeat) return
      const current = parsingRef.current
      const locked  = lockedRef.current
      if (locked) { setLockedInfo(null); setParsingInfo(null) }
      else if (current) { setLockedInfo(current) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Scroll to highlighted verse ───────────────────────────────────────────────

  useEffect(() => {
    if (highlightedVerse && verseRefs.current[highlightedVerse]) {
      verseRefs.current[highlightedVerse].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedVerse])

  // ── Parallel translation fetching ─────────────────────────────────────────────
  // Reset cached keys and verse map whenever the selected language changes.

  const prevParallelLang = useRef<string | null>(null)
  useEffect(() => {
    if (parallelLang !== prevParallelLang.current) {
      prevParallelLang.current = parallelLang
      fetchedTransKeys.current = new Set()
      setTranslationVerses({})
    }
  }, [parallelLang])

  // Fetch translation for every newly loaded section when a language is active.
  // After each fetch (success or failure) mark every verse in the section with
  // '' if no translation came back — prevents "Loading…" showing indefinitely
  // for deuterocanonical books or any chapter the API doesn't cover.
  useEffect(() => {
    if (!parallelLang) return
    const allSections = [...gnt.sections, ...lxx.sections]
    for (const sec of allSections) {
      const key = `${parallelLang}.${sec.key}`
      if (fetchedTransKeys.current.has(key)) continue
      fetchedTransKeys.current.add(key)
      const [osisId, chapterStr] = sec.key.split('-')
      const chapter = parseInt(chapterStr, 10)
      const verseIds = sec.verses.map(v => v.id)
      fetch(`/api/translation?book=${osisId}&chapter=${chapter}&lang=${parallelLang}`)
        .then(r => r.json())
        .then(data => {
          const received: Record<string, string> = data.verses ?? {}
          // Fill in '' for any verse the API didn't return
          const patch: Record<string, string> = {}
          for (const id of verseIds) patch[id] = received[id] ?? ''
          setTranslationVerses(prev => ({ ...prev, ...patch }))
        })
        .catch(() => {
          const patch = Object.fromEntries(verseIds.map(id => [id, '']))
          setTranslationVerses(prev => ({ ...prev, ...patch }))
        })
    }
  }, [parallelLang, gnt.sections, lxx.sections])

  // Fetch translations for search results (they aren't in gnt/lxx sections so the
  // effect above never covers them). Group by book+chapter to minimise requests.
  useEffect(() => {
    if (!parallelLang || !searchResults?.length) return
    const groups: Record<string, { osisId: string; chapter: number; verseIds: string[] }> = {}
    for (const v of searchResults) {
      const secKey = `${v.bookId}-${v.chapter}`
      if (!groups[secKey]) groups[secKey] = { osisId: v.bookId, chapter: v.chapter, verseIds: [] }
      groups[secKey].verseIds.push(v.id)
    }
    for (const [secKey, group] of Object.entries(groups)) {
      const key = `${parallelLang}.${secKey}`
      if (fetchedTransKeys.current.has(key)) continue
      fetchedTransKeys.current.add(key)
      fetch(`/api/translation?book=${group.osisId}&chapter=${group.chapter}&lang=${parallelLang}`)
        .then(r => r.json())
        .then(data => {
          const received: Record<string, string> = data.verses ?? {}
          const patch: Record<string, string> = {}
          for (const id of group.verseIds) patch[id] = received[id] ?? ''
          setTranslationVerses(prev => ({ ...prev, ...patch }))
        })
        .catch(() => {
          const patch = Object.fromEntries(group.verseIds.map(id => [id, '']))
          setTranslationVerses(prev => ({ ...prev, ...patch }))
        })
    }
  }, [parallelLang, searchResults])

  // ── Search / navigation ────────────────────────────────────────────────────────

  async function handleSearch(query: string, type: 'word' | 'reference') {
    const trimmed = query.trim()

    if (type === 'reference') {
      const booksFromQueues: BiblicalBook[] = []
      const seen = new Set<string>()
      for (const q of [...gntQueue, ...lxxQueue]) {
        if (seen.has(q.osisId)) continue
        seen.add(q.osisId)
        booksFromQueues.push({
          id: q.osisId, osisId: q.osisId, name: q.bookName,
          abbrev: q.osisId, corpus: q.corpus as 'GNT' | 'LXX' | 'NA1904',
          totalChapters: (q.corpus === 'GNT' || q.corpus === 'NA1904' ? gntQueue : lxxQueue)
            .filter(x => x.osisId === q.osisId).length,
        })
      }
      const ref = parseReference(trimmed, booksFromQueues)
      if (ref) {
        setSearchLoading(true)
        setSearchResults(null)
        setSearchType('reference')
        setWordSearchTerm(null)
        try {
          const res  = await fetch(`/api/reader?book=${ref.book.osisId}&chapter=${ref.chapter}`)
          const data = await res.json()
          if (data.verses?.length) {
            setSearchResults(data.verses)
            const vId = ref.verse
              ? (data.verses.find((v: BiblicalVerse) => v.verse === ref.verse)?.id ?? null)
              : null
            setHighlightedVerse(vId)
          }
        } finally { setSearchLoading(false) }
        return
      }
    }

    setSearchLoading(true)
    setSearchType(type)
    setWordSearchTerm(type === 'word' ? normalizeGreek(trimmed) : null)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${type}&corpus=BOTH`)
      const data = await res.json()
      setSearchResults(data.results ?? [])
      setHighlightedVerse(null)
    } finally { setSearchLoading(false) }
  }

  // ── Word interaction ───────────────────────────────────────────────────────────

  function handleWordHover(wordId: string | null, info: LexicalInfoPanel | null) {
    setActiveWordId(wordId)
    if (!lockedRef.current) setParsingInfo(info)
  }

  function handleWordClick(info: LexicalInfoPanel | null) {
    if (!lockedRef.current) setParsingInfo(info)
  }

  function handleWordRightClick(word: VerseWord, x: number, y: number) {
    Promise.all([loadSyntax(), loadGbi(), loadAbsSyntax(), loadMaculaSyntax()]).then(([data, gbiData, absData, maculaData]) => {
      const gbiEntry    = gbiData[word.id]    ?? null
      const absEntry    = absData[word.id]    ?? null
      const maculaEntry = maculaData[word.id] ?? null
      const syn = data[word.id] ?? null

      // Find the verse that contains this word
      let verse: BiblicalVerse | null = null
      for (const sec of [...gntRef.current.sections, ...lxxRef.current.sections]) {
        const found = sec.verses.find(v => v.id === word.verseId)
        if (found) { verse = found; break }
      }
      // Also check search results
      if (!verse && searchResults) {
        verse = searchResults.find(v => v.id === word.verseId) ?? null
      }

      const words = verse?.words ?? []
      const myPos  = word.position
      const parse  = word.parses?.[0]
      const mood   = parse?.mood ?? ''
      const kase   = parse?.casus ?? ''
      const pos    = parse?.partOfSpeech ?? ''

      // Words before this one, closest first
      const prevWords = [...words]
        .filter(w => w.position < myPos)
        .sort((a, b) => b.position - a.position)

      // 1. Governing preposition (for nominals in a PP, or in an NP nested inside a PP)
      // Direct: syn.c === 'pp' (word is in a PP) or syn.gc === 'pp' (word is in NP inside PP).
      // Nested: some PPs wrap their object in two NP levels (PP→NP→NP→word, gc="np").
      //   Detect this by checking whether any of the 4 nearest preceding words
      //   themselves have gc="pp" or c="pp" in the syntax data.
      let governingPrep: string | null = null
      // Prepositions never govern nominatives in Greek — skip detection entirely
      // Every word that genuinely belongs to a PP's NP has gc='pp' in Lowfat,
      // so directlyInPP is sufficient. Secondary NPs nested inside the PP object
      // (appositives, genitive modifiers) have gc='np' and should show their own
      // genitive category (possessive, apposition, etc.), not prepositional governance.
      // Articular NP heads are one level deeper than the article in Lowfat: the
      // article keeps gc='pp' but the head word gets gc='np' (e.g. ἐρήμῳ in
      // Matt 3:1, where τῇ has gc='pp' but ἐρήμῳ has gc='np'). Check only the
      // immediately preceding word (the article) to avoid cross-phrase
      // contamination — looking further back would re-introduce the κυρίου
      // false-positive (cf. Matt 3:3, where Ἡσαΐου gc='pp' is 2 words before
      // the genitive modifier προφήτου).
      const directlyInPP = kase !== 'Nominative' && (
        syn?.c === 'pp' ||
        (syn?.gc === 'pp' && syn?.h === true) ||
        // Articular NP head, 1 level of NP nesting inside the PP (article gc='pp')
        (syn?.h === true && !!prevWords[0] && data[prevWords[0].id]?.gc === 'pp') ||
        // Articular NP head, 2 levels of NP nesting (e.g. appositive in the NP creates
        // an extra NP wrapper): PREP(c:pp) → NP → NP → head.
        // Detected by: the word before the article is the preposition itself.
        (syn?.h === true &&
          prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article' &&
          prevWords[1]?.parses?.[0]?.partOfSpeech === 'Preposition')
      )
      if (directlyInPP) {
        for (const pw of prevWords.slice(0, 6)) {
          if (pw.parses?.[0]?.partOfSpeech === 'Preposition') {
            governingPrep = pw.lexeme?.lexeme ?? pw.surface
            break
          }
        }
      }
      // Articular infinitive: PREP + τό + [μή/οὐ] + INFINITIVE
      // The infinitive heads the articular clause, which is the PP object — so
      // directlyInPP is false for the infinitive itself. Detect the pattern by
      // scanning backwards through negation particles, then an article, then a preposition.
      if (!governingPrep && mood === 'Infinitive') {
        const NEGS = new Set(['μή', 'οὐ', 'οὐκ', 'οὐχ'])
        let i = 0
        while (i < prevWords.length && NEGS.has(prevWords[i].lexeme?.lexeme ?? prevWords[i].surface)) i++
        if (i < prevWords.length && prevWords[i].parses?.[0]?.partOfSpeech === 'Article') {
          i++
          if (i < prevWords.length && prevWords[i].parses?.[0]?.partOfSpeech === 'Preposition')
            governingPrep = prevWords[i].lexeme?.lexeme ?? prevWords[i].surface
        }
      }

      // 2. Preceding conjunction (ἵνα, ἐάν, εἰ, ὥστε, πρίν, etc.) for verbs and infinitives
      let precedingConj: string | null = null
      if (mood === 'Subjunctive' || mood === 'Indicative' || mood === 'Infinitive') {
        const CONJUNCTIONS = new Set(['ἵνα', 'ὅπως', 'ἐάν', 'εἰ', 'ὡς', 'ὅτε', 'ὅταν', 'ἄν', 'ὥστε', 'πρίν'])
        for (const pw of prevWords.slice(0, 6)) {
          const lex = pw.lexeme?.lexeme ?? pw.surface
          if (CONJUNCTIONS.has(lex)) { precedingConj = lex; break }
        }
      }

      // 3. Emphatic negation (οὐ μή before subjunctive) and standalone μή (prohibition)
      let emphNeg = false
      let hasPrecedingMh = false
      if (mood === 'Subjunctive') {
        const nearby = prevWords.slice(0, 3).map(w => w.lexeme?.lexeme ?? w.surface)
        emphNeg = nearby.some(l => ['οὐ', 'οὐκ', 'οὐχ'].includes(l)) && nearby.some(l => l === 'μή')
        // Standalone μή (without preceding οὐ/οὐκ/οὐχ) → prohibition or negative purpose
        hasPrecedingMh = !emphNeg && nearby.some(l => l === 'μή')
      }

      // 4. Nearby linking verb (for predicate nominative detection)
      let nearbyLinkingVerb = false
      if (kase === 'Nominative' && pos !== 'Verb' && pos !== 'Article') {
        const LINKING = new Set(['εἰμί', 'γίνομαι'])
        nearbyLinkingVerb = words.some(w => {
          const lex = w.lexeme?.lexeme ?? w.surface
          const wp  = w.parses?.[0]
          return LINKING.has(lex) && wp?.mood !== 'Participle' && wp?.mood !== 'Infinitive'
        })
      }

      // 5. Double accusative: same clause (between nearest head verbs) contains o2
      let clauseHasO2 = false
      if (kase === 'Accusative') {
        const wordIdx = words.findIndex(w => w.id === word.id)
        // Find nearest preceding head verb
        let clauseStart = 0
        for (let i = wordIdx - 1; i >= 0; i--) {
          const ws = data[words[i].id]
          if (ws?.r === 'v' && ws?.h) { clauseStart = i; break }
        }
        // Find next head verb (exclusive end)
        let clauseEnd = words.length
        for (let i = wordIdx + 1; i < words.length; i++) {
          const ws = data[words[i].id]
          if (ws?.r === 'v' && ws?.h) { clauseEnd = i; break }
        }
        clauseHasO2 = words.slice(clauseStart, clauseEnd).some(w => {
          const ws = data[w.id]
          return ws?.pr === 'o2' || ws?.r === 'o2' || ws?.gr === 'o2'
        })
      }

      // 6. Genitive absolute: a genitive subject (r:'s', c:'cl') within ±3 words
      let hasGenitiveAbsSubject = false
      if (kase === 'Genitive' && mood === 'Participle') {
        const wordIdx = words.findIndex(w => w.id === word.id)
        const window3 = words.slice(Math.max(0, wordIdx - 3), wordIdx + 4)
        hasGenitiveAbsSubject = window3.some(w => {
          if (w.id === word.id) return false
          const ws = data[w.id]
          return ws?.r === 's' && ws?.c === 'cl'
        })
      }

      // 7. Participle article context: detect substantival (article + participle,
      // no preceding noun) vs. 2nd-position attributive (noun + article + participle)
      let precedingArticle = false
      let nounBeforeArticle = false
      if (mood === 'Participle') {
        if (prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article') {
          precedingArticle = true
          const NOMINAL_POS = new Set(['Noun', 'Pronoun', 'Demonstrative',
            'Personal pronoun', 'Reflexive pronoun', 'Relative pronoun'])
          nounBeforeArticle = NOMINAL_POS.has(prevWords[1]?.parses?.[0]?.partOfSpeech ?? '')
        }
      }

      // 8. Coordination detection: if a coordinating conjunction with a clause role (pr)
      // appears within the 4 preceding words, this nominal is a compound element
      // (compound subject, compound object, etc.) rather than an appositive.
      let nearbyConjunctionRole: string | undefined
      for (const pw of prevWords.slice(0, 5)) {
        const pws = data[pw.id]
        if (pw.parses?.[0]?.partOfSpeech === 'Conjunction' && pws?.pr) {
          nearbyConjunctionRole = pws.pr
          break
        }
      }

      // 9. Enclosing head case/pos/lexeme: for genitive nouns nested inside an NP, properties
      // of the head noun they modify. Case distinguishes Genitive of Apposition from Descriptive.
      // POS and lexeme enable Partitive Genitive detection (numerals, quantifiers, pronouns).
      let enclosingHeadCase: string | undefined
      let enclosingHeadPos: string | undefined
      let enclosingHeadLexeme: string | undefined
      if (kase === 'Genitive' && syn?.h === true && syn?.gc === 'np') {
        let headWord: VerseWord | undefined
        if (prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article') {
          // Articular: article immediately precedes, head noun is one step further back
          headWord = prevWords[1]
        } else {
          // Anarthrous: scan backward for the nearest word with h:true in the syntax
          // data. This skips intervening modifiers (e.g. ἡμῶν in κυρίου ἡμῶν Ἰησοῦ)
          // and finds the actual head noun that this genitive NP is attached to.
          headWord = prevWords.find(w => data[w.id]?.h === true) ?? prevWords[0]
        }
        if (headWord) {
          enclosingHeadCase   = headWord.parses?.[0]?.casus          ?? undefined
          enclosingHeadPos    = headWord.parses?.[0]?.partOfSpeech    ?? undefined
          enclosingHeadLexeme = headWord.lexeme?.lexeme               ?? undefined
        }
      }

      // 10. Apposition guard: the word before the preceding article must be a nominal syntax head.
      // When an article is at prevWords[0], prevWords[1] is the potential head noun.
      // If δέ or another particle intervenes (no article at prevWords[0]), prevHeadNounExists=false,
      // preventing false apposition for constructions like ἡ δὲ τροφή (Matt 3:4).
      // Must be a nominal POS — verbs are clause heads (h:true) but are not apposition targets.
      const NOMINAL_POS_SET = new Set(['Noun', 'Adjective', 'Demonstrative', 'Personal Pronoun',
        'Reflexive Pronoun', 'Reciprocal Pronoun', 'Relative Pronoun', 'Indefinite Pronoun',
        'Interrogative Pronoun', 'Pronoun'])
      let prevHeadNounExists = false
      if (prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article') {
        const pw1 = prevWords[1]
        const pw1Pos = pw1?.parses?.[0]?.partOfSpeech ?? ''
        prevHeadNounExists = NOMINAL_POS_SET.has(pw1Pos) && (data[pw1?.id ?? '']?.h === true)
      }

      // 11. Attendant circumstance: find the nearest main clause verb to detect
      // aorist participle + aorist verb pattern (GGBB pp. 640–645).
      let mainVerbTense: string | null = null
      if (mood === 'Participle' && kase === 'Nominative') {
        const myPos = word.position
        let closestDist = Infinity
        for (const w of words) {
          if (w.id === word.id) continue
          const ws = data[w.id]
          if (ws?.r === 'v' && ws?.c === 'cl') {
            const dist = Math.abs(w.position - myPos)
            if (dist < closestDist) {
              closestDist = dist
              mainVerbTense = w.parses?.[0]?.tense ?? null
            }
          }
        }
      }

      // 12. Colwell's Rule: for nominative nouns with a nearby equative verb, whether this
      // word is immediately preceded by an article determines subject (articular) vs predicate
      // (anarthrous).
      const isArticular = kase === 'Nominative'
        ? prevWords[0]?.parses?.[0]?.partOfSpeech === 'Article'
        : false

      // 13. Modal verb detection: for infinitives with role='o', check whether a
      // modal/auxiliary verb governs it (→ Complementary Infinitive rather than
      // Substantival Infinitive (Object)).
      const MODAL_VERBS = new Set([
        'δύναμαι', 'θέλω', 'ἐθέλω', 'βούλομαι', 'μέλλω', 'ἄρχομαι', 'ὀφείλω',
        'δεῖ', 'ἔξεστιν', 'ζητέω', 'ἐπιτρέπω', 'ἀφίημι', 'πειράομαι',
        'ἐπιχειρέω', 'τολμάω', 'δύνομαι',
      ])
      let nearbyModalVerb = false
      if (mood === 'Infinitive') {
        const NEGS = new Set(['μή', 'οὐ', 'οὐκ', 'οὐχ'])
        for (const pw of prevWords.slice(0, 4)) {
          const pwLex = pw.lexeme?.lexeme ?? pw.surface
          if (MODAL_VERBS.has(pwLex)) { nearbyModalVerb = true; break }
          if (NEGS.has(pwLex)) continue  // skip negations
          if (pw.parses?.[0]?.partOfSpeech === 'Verb') break  // non-modal verb — stop
        }
      }

      const maculaRole        = maculaEntry?.role        ?? null
      const maculaPhraseClass = maculaEntry?.phraseClass ?? null
      const maculaClauseRule  = maculaEntry?.clauseRule  ?? null
      const maculaClauseRole  = maculaEntry?.clauseRole  ?? null

      const ctx: SyntaxContext = { governingPrep, precedingConj, emphNeg, hasPrecedingMh, nearbyLinkingVerb, clauseHasO2, hasGenitiveAbsSubject, precedingArticle, nounBeforeArticle, enclosingHeadCase, enclosingHeadPos, enclosingHeadLexeme, nearbyConjunctionRole, prevHeadNounExists, isArticular, maculaRole, maculaPhraseClass, maculaClauseRule, maculaClauseRole, mainVerbTense, nearbyModalVerb }

      const menuW = 380, menuH = 520
      const nx = x + menuW > window.innerWidth  ? x - menuW : x
      const ny = y + menuH > window.innerHeight ? y - menuH : y
      setSyntaxMenu({ word, syntax: syn, gbiEntry, absEntry, ctx, x: Math.max(8, nx), y: Math.max(8, ny) })
    })
  }

  // ── Render helpers ─────────────────────────────────────────────────────────────

  function renderVerseRow(v: BiblicalVerse) {
    const greek = (
      <GreekVerse
        key={v.id}
        verse={v}
        activeWordId={activeWordId}
        highlighted={v.id === highlightedVerse}
        searchWord={wordSearchTerm ?? undefined}
        onWordHover={handleWordHover}
        onWordClick={handleWordClick}
        onWordRightClick={handleWordRightClick}
        verseRefCallback={el => { if (el) verseRefs.current[v.id] = el }}
      />
    )

    if (!parallelLang) return greek

    const transTxt = translationVerses[v.id]
    return (
      <div key={v.id} className="grid grid-cols-2 gap-6 mb-1">
        {greek}
        <p className="leading-relaxed text-gray-700 pt-0.5" style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>
          {transTxt === undefined
            ? <span className="text-gray-300 italic text-xs">Loading…</span>
            : transTxt
              ? <><sup className="text-xs text-gray-400 mr-1">{v.verse}</sup>{transTxt}</>
              : null}
        </p>
      </div>
    )
  }

  function renderSections(sections: TextSection[]) {
    let lastBook = ''
    return sections.map(sec => {
      const bookChanged = sec.bookName !== lastBook
      lastBook = sec.bookName
      const chapter = sec.verses[0]?.chapter ?? null
      return (
        <div key={sec.key}>
          {bookChanged && (
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-5 mb-1 pb-1 border-b border-gray-100">
              {sec.bookName}
            </h3>
          )}
          {chapter !== null && (
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-1 select-none">
              Chapter {chapter}
            </h4>
          )}
          {sec.verses.map(v => renderVerseRow(v))}
        </div>
      )
    })
  }

  // ── Layout ──────────────────────────────────────────────────────────────────────

  const parallelLangInfo = PARALLEL_LANGS.find(l => l.code === parallelLang)

  return (
    <div className="flex flex-col h-full gap-2">

      {/* ── Settings button row ── */}
      <div className="flex-none flex items-center justify-end">
        <div ref={settingsRef} className="relative">
          <button
            title="Settings"
            onClick={() => setShowSettings(v => !v)}
            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <MoreVertical size={20} />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-white border border-gray-200 rounded-xl p-4 space-y-5 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">Reader Settings</span>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              </div>

              {/* Font size */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text Size</p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 select-none leading-none" style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '0.8rem' }}>A</span>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={(['sm','md','lg','xl'] as FontSize[]).indexOf(fontSize)}
                    onChange={e => setFontSize((['sm','md','lg','xl'] as FontSize[])[e.target.valueAsNumber])}
                    className="flex-1 accent-brand-600 cursor-pointer"
                  />
                  <span className="text-gray-400 select-none leading-none" style={{ fontFamily: 'Gentium Plus, Georgia, serif', fontSize: '1.35rem' }}>A</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                  <span>Small</span><span>Med</span><span>Large</span><span>X-Lg</span>
                </div>
              </div>

              {/* GNT Edition */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">GNT Edition</p>
                <div className="space-y-1.5">
                  {([
                    { label: 'Tischendorf 8th', value: 'tischendorf' as const },
                    { label: 'Nestle 1904',     value: 'nestle1904'  as const },
                  ]).map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setGntEdition(value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        gntEdition === value
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Syntax sources */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Syntax</p>
                <div className="space-y-1.5">
                  {([
                    { label: 'Wallace',     value: wallaceOn, set: setWallaceOn as React.Dispatch<React.SetStateAction<boolean>> },
                    { label: 'PROIEL',      value: proielOn,  set: setProielOn  as React.Dispatch<React.SetStateAction<boolean>> },
                    { label: 'GBI',         value: gbiOn,     set: setGbiOn     as React.Dispatch<React.SetStateAction<boolean>> },
                    { label: 'ABS Syntax',  value: absOn,     set: setAbsOn     as React.Dispatch<React.SetStateAction<boolean>> },
                  ]).map(({ label, value, set }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{label}</span>
                      <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
                        {([true, false] as const).map(on => (
                          <button
                            key={String(on)}
                            onClick={() => set(on)}
                            className={`px-2.5 py-1 transition-colors ${
                              value === on
                                ? 'bg-brand-50 text-brand-700 font-medium'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {on ? 'On' : 'Off'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translations */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Translations</p>
                <div className="space-y-1">
                  <button
                    onClick={() => setParallelLang(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      parallelLang === null
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    None
                  </button>
                  {PARALLEL_LANGS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => setParallelLang(l.code)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        parallelLang === l.code
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm">{l.label}</span>
                      <span className="block text-xs text-gray-400">{l.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Controls</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Word information panel</p>
                    <ul className="space-y-1 text-xs text-gray-500 leading-relaxed">
                      <li><span className="font-medium text-gray-600">Hover</span> over any word to see its lexical entry, parsing, and glosses.</li>
                      <li><span className="font-medium text-gray-600">Press Shift</span> to freeze the panel on the current word — useful when you want to keep reading while referring back to a word.</li>
                      <li><span className="font-medium text-gray-600">Press Shift again</span> to unfreeze and return to hover mode.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Syntax analysis</p>
                    <ul className="space-y-1 text-xs text-gray-500 leading-relaxed">
                      <li><span className="font-medium text-gray-600">Right-click</span> any word to open the syntax menu.</li>
                      <li>The menu shows grammatical categories from the sources you have turned on — Wallace, PROIEL, GBI, and ABS Syntax.</li>
                      <li>Each category includes a description and a reference to the relevant section in a standard grammar.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Search</p>
                    <ul className="space-y-1 text-xs text-gray-500 leading-relaxed">
                      <li>Type a <span className="font-medium text-gray-600">Greek word</span> to find every occurrence in the corpus.</li>
                      <li>Type a <span className="font-medium text-gray-600">reference</span> (e.g. Matt 5:3, Rom 8) to jump to a passage.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Attribution */}
              <div className="border-t border-gray-100 pt-3 space-y-1">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Greek text: <span className="font-medium text-gray-500">SBL Greek New Testament</span> (SBLGNT) &copy; 2010 Society of Biblical Literature and Logos Bible Software.
                </p>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Syntax: <span className="font-medium text-gray-500">Lowfat SBLGNT</span> treebank (Wallace &amp; PROIEL) &middot; <span className="font-medium text-gray-500">Macula-Greek SBLGNT</span> (GBI) &copy; Clear Bible, CC BY 4.0 &middot; <span className="font-medium text-gray-500">ABS NT Syntax Database</span> &copy; Asian Bible Society.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="flex-none">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* ── Search result bar ── */}
      {searchResults !== null && (
        <div className="flex-none flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {searchLoading
              ? 'Searching…'
              : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
          </p>
          <button
            className="text-sm text-brand-600 hover:underline"
            onClick={() => {
              setSearchResults(null); setSearchType(null)
              setWordSearchTerm(null); setLockedInfo(null); setHighlightedVerse(null)
            }}
          >
            ← Exit {searchType === 'word' ? 'word search' : 'search'} · return to scrolling
          </button>
        </div>
      )}

      {/* ── Text panel ── */}
      <div
        ref={textPanelRef}
        style={{ '--greek-fs': FONT_SIZE_MAP[fontSize] } as React.CSSProperties}
        className="flex-1 min-h-0 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        {searchLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading…</div>
        ) : searchResults !== null ? (
          searchResults.length === 0
            ? <p className="text-gray-400 text-sm italic">No results found.</p>
            : <div>{searchResults.map(v => renderVerseRow(v))}</div>
        ) : (
          <div>
            {renderSections(gnt.sections)}
            {!gnt.done && <div ref={gntSentinel} className="h-1" aria-hidden />}

            <div className="mt-10">
              {renderSections(lxx.sections)}
              {!lxx.done && <div ref={lxxSentinel} className="h-1" aria-hidden />}
            </div>
          </div>
        )}
      </div>

      {/* ── Parsing panel ── */}
      <div className="flex-none">
        <ParsingPanel info={parsingInfo} locked={!!lockedInfo} />
      </div>

      {/* ── Syntax right-click menu ── */}
      {syntaxMenu && (
        <SyntaxMenu
          word={syntaxMenu.word}
          syntax={syntaxMenu.syntax}
          gbiEntry={syntaxMenu.gbiEntry}
          absEntry={syntaxMenu.absEntry}
          ctx={syntaxMenu.ctx}
          x={syntaxMenu.x}
          y={syntaxMenu.y}
          wallaceOn={wallaceOn}
          proielOn={proielOn}
          gbiOn={gbiOn}
          absOn={absOn}
          onClose={() => setSyntaxMenu(null)}
        />
      )}
    </div>
  )
}
