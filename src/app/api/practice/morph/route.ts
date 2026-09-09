import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'
import {
  countMorphForms, generateMorphQuestionsFromConfig, type MorphGenConfig,
  countHebrewMorphForms, generateHebrewMorphologyQuestions,
} from '@/lib/quiz-generation'
import type { MorphologySubtype, MorphParseFilter } from '@/lib/quiz-fields'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'

// The student's OWN parsing drill: they choose the part of speech, the fields to be asked and
// which values to draw from, and this route says how many forms match — and then generates
// them. Formative: it reads static pools and writes nothing at all.
//
// Two modes on one route because they must agree. The count the builder shows and the quiz it
// then generates have to come from the same pipeline, or the builder is lying: the generators
// deliberately FALL BACK when a filter matches too little (an instructor's over-tight quiz
// should still run), so a student could otherwise be shown "0 forms" and still get a full
// quiz of forms they did not ask for — or, worse, be told nothing and quietly get them.
//
// POST rather than GET because the query is a structured object (eight filter axes, each a
// list). Nothing is created; `count` is a read.
//
// ASKING FOR EXACTLY WHAT EXISTS is what actually disarms that fallback. The generators drop
// the filter when `matches < min(requested, 3)`, so a filter matching two forms would be
// thrown away for a 15-question request. Clamping the request to the counted number makes
// `matches >= min(requested, 3)` true by construction: a two-form drill is two questions
// about the two forms the student asked for, never fifteen about something else.

const GREEK_SUBTYPES = new Set<MorphologySubtype>([
  'VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED',
])
const HEBREW_SUBTYPES = new Set<HebrewMorphologySubtype>([
  'VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED',
])
const GREEK_FILTER_KEYS = ['tenses', 'voices', 'moods', 'persons', 'numbers', 'cases',
  'genders', 'pronounTypes']
const HEBREW_FILTER_KEYS = ['stems', 'conjugations', 'persons', 'genders', 'numbers',
  'states', 'types', 'rootClasses']
const MAX_QUESTIONS = 30

/** Whitelist the filter to known axes of known-shaped values — it comes from a client. */
function cleanFilter(raw: unknown, keys: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const k of keys) {
    const v = (raw as Record<string, unknown>)[k]
    if (!Array.isArray(v)) continue
    const vals = v.filter((x): x is string => typeof x === 'string' && x.length < 40).slice(0, 40)
    if (vals.length) out[k] = vals
  }
  return out
}

const cleanFields = (raw: unknown) =>
  Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === 'string' && x.length < 20).slice(0, 10)
    : []

export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Generous: the builder counts on every toggle (debounced), and a student rebuilding a
    // drill a dozen times in a minute is using it exactly as intended.
    const rl = rateLimit(`practice-morph:${payload.sub}`, 120, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
    }

    const body = await req.json() as {
      lang?: string; subtype?: string; fields?: unknown; parseFilter?: unknown
      vocabThruLesson?: unknown; vocabThruBand?: unknown; count?: unknown
    }
    const hebrew = body.lang === 'hebrew'
    const fields = cleanFields(body.fields)
    // 0 (or absent) = count only. The builder asks for the count on every change and for
    // questions once, when the student presses Start.
    const want = Math.min(MAX_QUESTIONS, Math.max(0, Number(body.count) || 0))

    if (hebrew) {
      const subtype = body.subtype as HebrewMorphologySubtype
      if (!HEBREW_SUBTYPES.has(subtype)) {
        return NextResponse.json({ error: 'Unknown subtype' }, { status: 400 })
      }
      const parseFilter = cleanFilter(body.parseFilter, HEBREW_FILTER_KEYS) as HebrewMorphParseFilter
      const band = typeof body.vocabThruBand === 'string' && body.vocabThruBand
        ? body.vocabThruBand : null
      const count = countHebrewMorphForms(subtype, fields, parseFilter, band)
      const n = Math.min(want, count)
      return NextResponse.json({
        count,
        questions: n > 0
          ? generateHebrewMorphologyQuestions(subtype, n, fields, parseFilter, band)
          : undefined,
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const subtype = body.subtype as MorphologySubtype
    if (!GREEK_SUBTYPES.has(subtype)) {
      return NextResponse.json({ error: 'Unknown subtype' }, { status: 400 })
    }
    const lessonRaw = Number(body.vocabThruLesson)
    const vocabThruLesson = Number.isInteger(lessonRaw) && lessonRaw > 0
      ? Math.min(lessonRaw, 16) : null
    const config: MorphGenConfig = {
      fields: fields.length ? fields : undefined,
      parseFilter: cleanFilter(body.parseFilter, GREEK_FILTER_KEYS) as MorphParseFilter,
    }
    const count = await countMorphForms(subtype, vocabThruLesson, config)
    const n = Math.min(want, count)
    return NextResponse.json({
      count,
      questions: n > 0
        ? await generateMorphQuestionsFromConfig(subtype, n, vocabThruLesson, config)
        : undefined,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    logError('practice/morph POST', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
