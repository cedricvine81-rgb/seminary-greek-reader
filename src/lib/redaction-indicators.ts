// Narrative-level device SIGNALS, computed from a finished word alignment. These are
// deliberately weaker claims than the word-level colours: each is an indicator that the
// evidence is *consistent with* one of the compositional devices (Licona; ultimately
// Theon/Quintilian's school practices), never an assertion that the device was used.
// Every indicator carries the token indices that generated it, so the UI can highlight
// its evidence and the student can weigh it — the inference stays theirs.

import { isFunctionWord, isProperNoun, morphFacts, type CompareResult, type CompareToken } from './redaction-compare'

export interface Indicator {
  id: 'transferal' | 'spotlight-names' | 'spotlight-number' | 'hist-present' | 'condense' | 'expand' | 'sequence' | 'span-note'
  /** NarrativeDeviceName this signal points toward ('' for the span note). */
  device: string
  /** Short chip text, e.g. "person shifts · 2". */
  label: string
  /** Fuller tooltip text with the specifics. */
  title: string
  /** Flat token indices of the evidence, source side and target side. */
  srcEvidence: number[]
  tgtEvidence: number[]
}

// When the two columns cover clearly different spans of text (a whole discourse against
// a few verses), add/omit balance says more about the span than about editing — so the
// condensation/expansion indicators are suppressed and a note says why.
const SPAN_RATIO = 2.2
const CONDENSE_OMIT = 0.25
const CONDENSE_ADD = 0.15
const EXPAND_ADD = 0.4
const EXPAND_OMIT = 0.2

export function computeColumnIndicators(source: CompareToken[], target: CompareToken[], r: CompareResult): Indicator[] {
  const out: Indicator[] = []
  const contentS = source.filter(t => !isFunctionWord(t)).length
  const contentT = target.filter(t => !isFunctionWord(t)).length
  if (!contentS || !contentT) return out

  // Facts for every matched pair (form / moved / subst — 'same' pairs can't shift).
  const personShiftS: number[] = [], personShiftT: number[] = []
  const numShiftS: number[] = [], numShiftT: number[] = []
  const histS: number[] = [], histT: number[] = []
  r.links.forEach((si, ti) => {
    if (si === null || r.tags[ti] === 'same') return
    const a = morphFacts(source[si]), b = morphFacts(target[ti])
    if (a.person && b.person && a.person !== b.person) { personShiftS.push(si); personShiftT.push(ti) }
    if (a.cls === 'verb' && b.cls === 'verb' && a.number === 'plural' && b.number === 'singular') { numShiftS.push(si); numShiftT.push(ti) }
    if (a.cls === 'verb' && b.cls === 'verb' && a.indicative && b.indicative && a.tense === 'present' && b.tense === 'aorist') { histS.push(si); histT.push(ti) }
  })
  if (personShiftT.length) out.push({
    id: 'transferal', device: 'Transferal',
    label: `person shifts · ${personShiftT.length}`,
    title: 'Grammatical person changes between the matched words — speech or action re-addressed. The characteristic signal of transferal.',
    srcEvidence: personShiftS, tgtEvidence: personShiftT,
  })
  if (numShiftT.length) out.push({
    id: 'spotlight-number', device: 'Spotlighting',
    label: `plural → singular · ${numShiftT.length}`,
    title: 'Verbs go from plural to singular — a group’s action told of one person. A spotlighting signal.',
    srcEvidence: numShiftS, tgtEvidence: numShiftT,
  })
  if (histT.length >= 2) out.push({
    id: 'hist-present', device: 'Paraphrase',
    label: `presents → aorists · ${histT.length}`,
    title: 'Indicative presents become aorists — vivid historical presents smoothed to narrative past, the best-known redactional fingerprint.',
    srcEvidence: histS, tgtEvidence: histT,
  })

  // Named participants the target never takes up, in any form. Counted by name, not by
  // occurrence (Luke 21 drops Ἰησοῦς twice; that is one dropped name).
  const nameIdx = source.map((t, i) => i).filter(i => !r.sourceUsed[i] && isProperNoun(source[i]))
  if (nameIdx.length) {
    const seen = new Set<string>()
    const names: string[] = []
    for (const i of nameIdx) {
      const lemma = source[i].lemma || source[i].surface
      if (seen.has(lemma)) continue
      seen.add(lemma)
      names.push(source[i].surface.replace(/[,.·;]+$/, ''))
    }
    out.push({
      id: 'spotlight-names', device: 'Spotlighting',
      label: `names dropped · ${names.length}`,
      title: `Named participants not taken up: ${names.join(', ')}. Consistent with spotlighting or simplification.`,
      srcEvidence: nameIdx, tgtEvidence: [],
    })
  }

  // Add/omit balance — only when the columns cover comparable spans.
  const ratio = Math.max(contentT / contentS, contentS / contentT)
  if (ratio > SPAN_RATIO) {
    out.push({
      id: 'span-note', device: '',
      label: 'different spans',
      title: 'These columns cover clearly different amounts of text, so the add/omit balance reflects the span rather than editing — the condensation and expansion signals are muted.',
      srcEvidence: [], tgtEvidence: [],
    })
  } else {
    const omitted = source.map((t, i) => i).filter(i => !r.sourceUsed[i] && !isFunctionWord(source[i]))
    const added = target.map((t, i) => i).filter(i => r.tags[i] === 'added' && !isFunctionWord(target[i]))
    const omitShare = omitted.length / contentS
    const addShare = added.length / contentS
    if (omitShare >= CONDENSE_OMIT && addShare <= CONDENSE_ADD) out.push({
      id: 'condense', device: 'Compression',
      label: 'condensation',
      title: `Drops ${omitted.length} of ${contentS} content words while adding few — Theon’s condensation; where narrated time shortens too, Licona’s compression.`,
      srcEvidence: omitted, tgtEvidence: [],
    })
    if (addShare >= EXPAND_ADD && omitShare <= EXPAND_OMIT) out.push({
      id: 'expand', device: 'Expansion of narrative details',
      label: 'expansion',
      title: `Adds ${added.length} content words beyond the source while dropping little — expansion of narrative details.`,
      srcEvidence: [], tgtEvidence: added,
    })
  }
  return out
}

// ── Displacement: pericope order across gospels ────────────────────────────────────
// Among the pericopes both gospels contain, does this one sit at a clearly different
// position in each gospel's own sequence? Uses the harmony dataset the Synopsis already
// loads. |rank difference| >= 2 avoids flagging simple neighbour swaps.
const REF_RE = /(\d+):(\d+)/
function posOf(ref: string): number {
  const m = ref.match(REF_RE)
  return m ? parseInt(m[1], 10) * 1000 + parseInt(m[2], 10) : 0
}

export function computeSequenceShift(
  pericopes: Record<string, string>[], title: string, srcOsis: string, tgtOsis: string,
): { dir: 'earlier' | 'later'; diff: number } | null {
  const both = pericopes.filter(p => p[srcOsis] && p[tgtOsis] && p.title)
  if (both.length < 4) return null
  const byS = [...both].sort((a, b) => posOf(a[srcOsis]) - posOf(b[srcOsis]))
  const byT = [...both].sort((a, b) => posOf(a[tgtOsis]) - posOf(b[tgtOsis]))
  const iS = byS.findIndex(p => p.title === title)
  const iT = byT.findIndex(p => p.title === title)
  if (iS === -1 || iT === -1) return null
  const diff = iT - iS
  if (Math.abs(diff) < 2) return null
  return { dir: diff < 0 ? 'earlier' : 'later', diff }
}
