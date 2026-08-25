/**
 * Pre-render Erasmian pronunciations to audio files.
 *
 * WHY A BUILD STEP, not a runtime call: the files are static, so they cache like the rest of
 * the corpus, cost nothing per play, work under the lockdown CSP (no third-party origin at
 * exam time), and every student hears the SAME voice — not whichever one their browser
 * happens to ship, which is what the live fallback gives.
 *
 * TWO ENGINES:
 *
 *   --engine local  (default)  macOS `say` + `afconvert`. No account, no key, no cost. It
 *     speaks the ENGLISH RESPELLING our transliterator produces ("bahp-TIH-dzoh") in an
 *     English voice, which is a serviceable Erasmian. Voice chosen with the user: Daniel
 *     (en-GB). This is the shipped path.
 *
 *   --engine azure             Azure neural voice, told to say our IPA exactly via
 *     <phoneme alphabet="ipa">. Better naturalness; needs AZURE_SPEECH_KEY and
 *     AZURE_SPEECH_REGION in .env.local (free tier F0 = 500k chars/month; the whole
 *     inventory is ~48k, so it never costs anything). Its MP3 is converted to the same .m4a
 *     the local path writes, so the app needs no change to switch.
 *
 * WHY NOT A GREEK TTS VOICE, in either engine: no voice anywhere speaks Erasmian. A
 * Greek-language voice speaks MODERN Greek, which merges η ι υ ει οι into "ee" and turns β
 * into v — contradicting the Pronunciation chapter on nearly every word.
 *
 * SCOPE: by default the vocabulary the course actually teaches (the BGVB deck) plus the
 * Pronunciation chapter's letters and examples — the "teaching content" this feature was
 * scoped to. `--all` adds every inflected form in the parsing-quiz pool (~4.5k files,
 * ~32MB); those quizzes are about analysing a form rather than saying it, and the live
 * fallback already covers them, so they are opt-in.
 *
 * Usage:
 *   npm run audio:greek                 # render what is missing
 *   npm run audio:greek -- --dry        # list the work, write nothing
 *   npm run audio:greek -- --force      # re-render (after changing a value in erasmian.ts)
 *   npm run audio:greek -- --all        # include every parsing-pool form
 *   npm run audio:greek -- --limit 20   # audition the voice on a few words
 *   npm run audio:greek -- --voice Serena
 *
 * Output: public/audio/greek/<slug>.m4a — slug and extension both come from
 * src/lib/erasmian.ts, which the player imports too, so the two cannot drift.
 * Re-runs are incremental: existing files are skipped unless --force.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { erasmianWordIPA, erasmianRespell, audioSlug, AUDIO_EXT } from '../src/lib/erasmian'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'greek')

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const value = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const DRY = flag('dry')
const FORCE = flag('force')
const ALL = flag('all')
const ENGINE = value('engine', 'local')
const VOICE = value('voice', process.env.SPEECH_VOICE ?? 'Daniel')
const RATE = value('rate', '135')            // words per minute: a model to copy, not chat
const LIMIT = (() => {
  const n = parseInt(value('limit', ''), 10)
  return Number.isFinite(n) ? n : Infinity
})()
/** `say` is cheap, but one process per word is the whole cost — run a few at once. */
const CONCURRENCY = Math.max(2, Math.min(8, os.cpus().length - 2))

interface AudioItem { word: string; ipa: string; respelling: string }

/** The teaching inventory: every Greek word a student meets on a card or in a chapter. */
function inventory(): AudioItem[] {
  const items = new Map<string, AudioItem>()
  const add = (word: string) => {
    const slug = audioSlug(word)
    const ipa = erasmianWordIPA(word)
    const respelling = erasmianRespell(word)
    if (!slug || !ipa || !respelling || items.has(slug)) return
    items.set(slug, { word, ipa, respelling })
  }

  // 1. The vocabulary deck — flashcards, vocab quizzes, the self-study steps.
  const bgvb = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/bgvb-vocabulary.json'), 'utf8'))
  for (const w of bgvb as { word: string }[]) add(w.word)

  // 2. The Pronunciation chapter's own soundable text: the 24 letters (each quoted alone,
  //    which is why erasmian.ts speaks a bare consonant as itself) and its example words.
  for (const letter of 'αβγδεζηθικλμνξοπρστυφχψω') add(letter)
  for (const w of ['ἅγιος', 'ἄγγελος', 'καί', 'εἰμί', 'οἶκος', 'υἱός', 'αὐτός', 'οὐρανός',
                   'εὐαγγέλιον', 'λόγος', 'κόσμος', 'θρόνος', 'βάπτισμα', 'παραβολή',
                   'μυστήριον', 'ψυχή', 'Παῦλος', 'Ἰερουσαλήμ', 'ἄγω', 'ἀρχή']) add(w)

  // 3. Opt-in: every inflected form the parsing quizzes can serve.
  if (ALL) {
    const pool = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/greek-parsing-pool.json'), 'utf8'))
    for (const key of ['verb', 'noun', 'adjective', 'pronoun']) {
      for (const e of (pool[key] ?? []) as { surface: string }[]) add(e.surface)
    }
  }

  return Array.from(items.values())
}

const outFile = (it: AudioItem) => path.join(OUT_DIR, `${audioSlug(it.word)}.${AUDIO_EXT}`)

/** AIFF/MP3 → the AAC the app serves. Mono at 24kbps: speech, and ~7KB a word. */
async function toM4a(src: string, dest: string) {
  await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-c', '1', '-b', '24000', src, dest])
}

async function renderLocal(it: AudioItem, tmp: string) {
  const aiff = path.join(tmp, `${audioSlug(it.word)}.aiff`)
  // The respelling, lowercased: capitals mark stress for a READER, but a synthesiser may
  // read an all-caps syllable as an initialism.
  await run('say', ['-v', VOICE, '-r', RATE, '-o', aiff, it.respelling.toLowerCase()])
  await toM4a(aiff, outFile(it))
  fs.rmSync(aiff, { force: true })
}

function ssml(ipa: string): string {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">`
    + `<voice name="${process.env.AZURE_SPEECH_VOICE ?? 'en-GB-RyanNeural'}"><prosody rate="-15%">`
    + `<phoneme alphabet="ipa" ph="${ipa.replace(/"/g, '&quot;')}"> </phoneme>`
    + `</prosody></voice></speak>`
}

async function renderAzure(it: AudioItem, tmp: string, key: string, region: string) {
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      'User-Agent': 'seminary-greek-reader',
    },
    body: ssml(it.ipa),
  })
  if (!res.ok) throw new Error(`Azure ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const mp3 = path.join(tmp, `${audioSlug(it.word)}.mp3`)
  fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()))
  await toM4a(mp3, outFile(it))
  fs.rmSync(mp3, { force: true })
}

async function main() {
  const all = inventory()
  const todo = all.filter(it => FORCE || !fs.existsSync(outFile(it))).slice(0, LIMIT)

  console.log(`engine:    ${ENGINE}${ENGINE === 'local' ? ` (voice ${VOICE}, ${RATE} wpm)` : ''}`)
  console.log(`inventory: ${all.length} distinct forms${ALL ? ' (including the parsing pool)' : ''}`)
  console.log(`to render: ${todo.length}`)
  if (todo.length) {
    console.log('samples:')
    for (const it of todo.slice(0, 5)) {
      console.log(`  ${it.word.padEnd(14)} ${ENGINE === 'azure' ? it.ipa : it.respelling}`)
    }
  }
  if (DRY) { console.log('\n--dry: nothing was written.'); return }
  if (!todo.length) { console.log('nothing to do.'); return }

  let key = '', region = ''
  if (ENGINE === 'azure') {
    key = process.env.AZURE_SPEECH_KEY ?? ''
    region = process.env.AZURE_SPEECH_REGION ?? ''
    if (!key || !region) {
      console.error('\nAZURE_SPEECH_KEY / AZURE_SPEECH_REGION are not set — see the notes at the top of this file.')
      process.exit(1)
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'erasmian-'))
  let done = 0, failed = 0
  const failures: string[] = []

  const queue = [...todo]
  async function worker() {
    for (;;) {
      const it = queue.shift()
      if (!it) return
      try {
        if (ENGINE === 'azure') await renderAzure(it, tmp, key, region)
        else await renderLocal(it, tmp)
        done++
        if (done % 100 === 0) console.log(`  ${done}/${todo.length}`)
      } catch (e) {
        failed++
        failures.push(`${it.word}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  fs.rmSync(tmp, { recursive: true, force: true })

  // Count what is actually on disk rather than trusting the tally: a build log reading
  // "1,140 written" is not evidence that 1,140 files exist.
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith(`.${AUDIO_EXT}`))
  const bytes = files.reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0)

  console.log(`\nrendered ${done}, failed ${failed}`)
  for (const f of failures.slice(0, 10)) console.error(`  ✗ ${f}`)
  console.log(`files on disk: ${files.length}  (${(bytes / 1024 / 1024).toFixed(1)} MB) → public/audio/greek/`)
  if (files.length < all.length) {
    console.log(`note: ${all.length - files.length} of the inventory have no file; the app speaks those with the browser voice.`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
