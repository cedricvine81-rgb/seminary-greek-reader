// Word tokens extracted from a MACULA phrase-tree file (public/data/phrase-tree/*.json),
// carrying the two syntax facts the Synopsis redaction compare consumes:
//
//   role   — the word's grammatical slot inside its clause (s, o, io, v, adv, p, vc, …):
//            the role of the nearest ancestor constituent that has one, reset at every
//            clause boundary. In [cl [np role=s ὁ Ἰησοῦς] [w role=v εἶπεν]] both ὁ and
//            Ἰησοῦς are 's', εἶπεν is 'v'.
//   headId — for words inside a noun/prepositional phrase, the id of that phrase's
//            lexical head (the last noun or pronoun in its subtree, else the last other
//            lexical word). This is what lets an article travel with ITS noun instead of
//            being window-matched to a neighbour: ὁ in [np ὁ Ἰησοῦς] heads to Ἰησοῦς.
//
// Only the Nestle 1904 edition ships these trees; the Tischendorf JSON has no syntax, so
// consumers treat both fields as optional and fall back to the positional heuristics.

export interface PhraseTreeSyn { role?: string; headId?: string }
export interface PhraseTreeToken {
  id: string
  surface: string
  parsing: string
  lemma: string
  gloss?: string
  strongs?: string
  syn?: PhraseTreeSyn
}

type Node = {
  t: string; id?: string; w?: string; cls?: string; role?: string
  parsing?: string; lemma?: string; gloss?: string; strongs?: string; c?: Node[]
}
export interface PhraseTreeDoc { sentences?: { tree: Node }[] }

const PHRASE_CLS = new Set(['np', 'pp', 'adjp', 'advp'])

/** Lexical head of a phrase subtree: the last noun/pronoun, else the last lexical word. */
function headOf(n: Node): string | undefined {
  let noun: string | undefined
  let lex: string | undefined
  const scan = (m: Node): void => {
    if (m.t === 'w' && m.id) {
      const c = m.cls ?? ''
      if (c === 'noun' || c === 'pron') noun = m.id
      if (c === 'noun' || c === 'pron' || c === 'verb' || c === 'adj' || c === 'num' || c === 'adv') lex = m.id
    }
    ;(m.c ?? []).forEach(scan)
  }
  scan(n)
  return noun ?? lex
}

/** All of a book's words keyed "Book.chapter.verse", in verse order, with syntax facts. */
export function phraseTreeVerses(doc: PhraseTreeDoc): Record<string, PhraseTreeToken[]> {
  const byVerse: Record<string, { i: number; tok: PhraseTreeToken }[]> = {}
  const heads = new Map<Node, string | undefined>()

  const walk = (n: Node, role: string | undefined, head: string | undefined): void => {
    if (n.t === 'w' && n.id) {
      const [bk, ch, vs, wd] = n.id.split('.')
      ;(byVerse[`${bk}.${ch}.${vs}`] ??= []).push({
        i: parseInt(wd || '0', 10),
        tok: {
          id: n.id, surface: n.w ?? '', parsing: n.parsing ?? '', lemma: n.lemma ?? '',
          gloss: n.gloss, strongs: n.strongs,
          syn: { role: n.role ?? role, headId: head },
        },
      })
      return
    }
    let r = role, h = head
    if (n.t === 'g') {
      if (n.cls === 'cl') { r = undefined; h = undefined }   // clause boundary: slots restart
      if (n.role) r = n.role
      if (n.cls && PHRASE_CLS.has(n.cls)) {
        if (!heads.has(n)) heads.set(n, headOf(n))
        h = heads.get(n)
      }
    }
    ;(n.c ?? []).forEach(c => walk(c, r, h))
  }
  for (const s of doc.sentences ?? []) walk(s.tree, undefined, undefined)

  const out: Record<string, PhraseTreeToken[]> = {}
  for (const [k, ws] of Object.entries(byVerse)) {
    ws.sort((a, b) => a.i - b.i)
    out[k] = ws.map(x => x.tok)
  }
  return out
}
