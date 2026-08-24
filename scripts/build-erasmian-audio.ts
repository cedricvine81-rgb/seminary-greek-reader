/**
 * Pre-render Erasmian pronunciations to MP3.
 *
 * WHY A BUILD STEP, not a runtime call: the files are static, so they cache like the rest of
 * the corpus, cost nothing per play, work under the lockdown CSP (no third-party origin at
 * exam time), and keep the API key on this machine and out of the app entirely.
 *
 * WHY IPA: no text-to-speech voice on earth speaks Erasmian — a Greek-language voice speaks
 * MODERN Greek, which merges η ι υ ει οι into "ee" and turns β into v, contradicting the
 * chapter on nearly every word. So we don't send Greek text at all. src/lib/erasmian.ts
 * turns each word into the IPA the chapter's own tables prescribe, and an ENGLISH neural
 * voice is told to say exactly those phonemes via <phoneme alphabet="ipa">. The result is a
 * natural human-sounding voice reading genuinely Erasmian Greek.
 *
 * SETUP (once, ~5 minutes):
 *   1. portal.azure.com → Create a resource → "Speech service" → free tier F0.
 *      The free tier is permanent and covers 500,000 characters/month; the whole teaching
 *      inventory below is a few tens of thousands, so this never costs anything.
 *   2. In the resource: Keys and Endpoint → copy KEY 1 and the Location/Region.
 *   3. Add to .env.local:  AZURE_SPEECH_KEY=...   AZURE_SPEECH_REGION=westeurope
 *   4. npm run audio:greek
 *
 * Measured 2026-08-24: 4,593 distinct forms = 47,531 characters, under 10% of one month's
 * free allowance, so a full rebuild is free and repeatable.
 *
 * Flags (npm run audio:greek -- --dry):
 *   --dry     Show what would be generated (and the character count) without calling Azure.
 *   --force   Re-render files that already exist (after changing a value in erasmian.ts).
 *   --limit N Only the first N items — a cheap way to audition the voice.
 *
 * Output: public/audio/greek/<slug>.mp3, where slug is the accent-stripped word (see
 * audioSlug in src/components/audio/SpeakGreek.tsx — the two MUST agree, and the test
 * tests/erasmian.test.ts guards the transliteration they share).
 * Re-runs are incremental: existing files are skipped unless --force.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { erasmianWordIPA } from '../src/lib/erasmian'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'greek')

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const FORCE = args.includes('--force')
const LIMIT = (() => {
  const i = args.indexOf('--limit')
  return i >= 0 ? parseInt(args[i + 1], 10) : Infinity
})()

// The voice. en-GB Ryan reads phoneme strings cleanly and at a teacherly pace; any en-*
// neural voice works — swap and re-run with --force to audition another.
const VOICE = process.env.AZURE_SPEECH_VOICE ?? 'en-GB-RyanNeural'
const RATE = process.env.AZURE_SPEECH_RATE ?? '-15%'   // a model to copy, not conversation

/** Same rule as audioSlug() in SpeakGreek.tsx. Keep the two in step. */
function audioSlug(greek: string): string {
  return greek.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/ς/g, 'σ').replace(/[^α-ω]/g, '')
}

interface AudioItem { word: string; ipa: string }

/** The teaching inventory: every Greek word a student meets on a card or in a quiz. */
function inventory(): AudioItem[] {
  const items = new Map<string, AudioItem>()
  const add = (word: string) => {
    const slug = audioSlug(word)
    const ipa = erasmianWordIPA(word)
    if (!slug || !ipa || items.has(slug)) return
    items.set(slug, { word, ipa })
  }

  // 1. The vocabulary decks — the flashcards, the vocab quizzes, the self-study steps.
  const bgvb = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/bgvb-vocabulary.json'), 'utf8'))
  for (const w of bgvb as { word: string }[]) add(w.word)

  // 2. Every inflected form the parsing quizzes can ask about (they are real NT forms, and
  //    hearing the form is the point of a parsing drill).
  const pool = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/greek-parsing-pool.json'), 'utf8'))
  for (const key of ['verb', 'noun', 'adjective', 'pronoun']) {
    for (const e of (pool[key] ?? []) as { surface: string }[]) add(e.surface)
  }

  return Array.from(items.values())
}

function ssml(ipa: string): string {
  // The phoneme tag carries the whole word; the text inside is only a fallback for engines
  // that ignore the tag, so it is never what a student hears from Azure.
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">`
    + `<voice name="${VOICE}"><prosody rate="${RATE}">`
    + `<phoneme alphabet="ipa" ph="${ipa.replace(/"/g, '&quot;')}"> </phoneme>`
    + `</prosody></voice></speak>`
}

async function synthesize(ipa: string, key: string, region: string): Promise<Buffer> {
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      'User-Agent': 'seminary-greek-reader',
    },
    body: ssml(ipa),
  })
  if (!res.ok) throw new Error(`Azure ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const all = inventory()
  const todo = all
    .filter((it: AudioItem) => FORCE || !fs.existsSync(path.join(OUT_DIR, `${audioSlug(it.word)}.mp3`)))
    .slice(0, LIMIT)

  const chars = todo.reduce((n: number, it: AudioItem) => n + it.ipa.length, 0)
  console.log(`inventory: ${all.length} distinct forms`)
  console.log(`to render: ${todo.length}  (${chars.toLocaleString()} characters — the Azure free tier allows 500,000/month)`)
  if (todo.length) {
    console.log('samples:')
    for (const it of todo.slice(0, 5)) console.log(`  ${it.word.padEnd(16)} ${it.ipa}`)
  }
  if (DRY) { console.log('\n--dry: nothing was generated.'); return }

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) {
    console.error('\nAZURE_SPEECH_KEY / AZURE_SPEECH_REGION are not set — see the setup notes at the top of this file.')
    console.error('Until they are, the app still speaks every word: SpeakGreek falls back to the browser voice reading our respelling.')
    process.exit(1)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  let done = 0, failed = 0
  for (const it of todo) {
    const file = path.join(OUT_DIR, `${audioSlug(it.word)}.mp3`)
    try {
      fs.writeFileSync(file, await synthesize(it.ipa, key, region))
      done++
      if (done % 50 === 0) console.log(`  ${done}/${todo.length}`)
    } catch (e) {
      failed++
      console.error(`  ✗ ${it.word} (${it.ipa}): ${e instanceof Error ? e.message : String(e)}`)
      if (failed > 10) { console.error('too many failures — stopping'); break }
    }
    await new Promise(r => setTimeout(r, 60))   // stay well inside the free-tier rate limit
  }
  console.log(`\ndone: ${done} rendered, ${failed} failed → public/audio/greek/`)
}

main().catch(e => { console.error(e); process.exit(1) })
