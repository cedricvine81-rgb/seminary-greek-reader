// morph-paradigm-tables.ts decides which paradigm a practice drill offers when a parse is
// marked wrong. It is a RULE plus an exception list, not a lookup table — the pools carry 372
// nominal lexemes, far too many to enumerate — so the risks are that a lexeme resolves to
// nothing, that a table id stops existing, or that the exception list rots.
//
// The last of those is not hypothetical. The first draft of the exception list was written
// from general knowledge of Greek rather than from the pools, and more than half its entries
// were for words that appear in no pool at all: they looked authoritative and had never been
// checked against anything. The `every exception is a real lexeme` test below exists for that.
import fs from 'node:fs'
import path from 'node:path'
import { NOUN_POOL, ADJECTIVE_POOL, PRONOUN_POOL, VERB_POOL } from '@/data/greek-parsing-pool'
import {
  paradigmFor, classifyDeclension, DECLENSION_EXCEPTIONS, PARADIGM_TABLE_DATA,
} from '@/lib/morph-paradigm-tables'

type PoolEntry = { lexeme: string; gender?: string }

const NOMINAL: [string, PoolEntry[]][] = [
  ['Noun', NOUN_POOL as PoolEntry[]],
  ['Adjective', ADJECTIVE_POOL as PoolEntry[]],
  ['Pronoun', PRONOUN_POOL as PoolEntry[]],
]

const lexemesOf = (pool: PoolEntry[]) => Array.from(new Set(pool.map(e => e.lexeme)))

describe('morph-paradigm-tables', () => {
  it('resolves a paradigm for every nominal lexeme in the pools', () => {
    const unresolved: string[] = []
    for (const [partOfSpeech, pool] of NOMINAL) {
      for (const lexeme of lexemesOf(pool)) {
        if (!paradigmFor({ partOfSpeech, lexeme })) unresolved.push(`${partOfSpeech} ${lexeme}`)
      }
    }
    expect(unresolved).toEqual([])
  })

  it('covers a non-trivial number of lexemes (guards against an emptied pool)', () => {
    const total = NOMINAL.reduce((n, [, pool]) => n + lexemesOf(pool).length, 0)
    expect(total).toBeGreaterThan(300)
  })

  // Verbs are deliberately unresolved: which conjugation table a form belongs to depends on the
  // verb's class (contract, liquid, μι-, second aorist), and VERB_POOL records no such field.
  // Guessing would put a student in front of the wrong paradigm, so verbs keep the
  // chapter-level link from morph-grammar-links.ts instead.
  it('returns null for verbs rather than guessing a conjugation', () => {
    for (const lexeme of lexemesOf(VERB_POOL as PoolEntry[]).slice(0, 50)) {
      expect(paradigmFor({ partOfSpeech: 'Verb', lexeme })).toBeNull()
    }
  })

  it('every exception is a lexeme that actually occurs in a pool', () => {
    const real = new Set(NOMINAL.flatMap(([, pool]) => lexemesOf(pool)))
    const phantom = Object.keys(DECLENSION_EXCEPTIONS).filter(l => !real.has(l))
    expect(phantom).toEqual([])
  })

  it('every exception actually changes the answer the bare rule would give', () => {
    // An exception that agrees with the rule is dead weight and hides the ones that matter.
    // Κόρινθος / παρθένος / στείρος are the deliberate documentation of a gender trap and are
    // allowed to agree; anything else must be doing real work.
    const documented = new Set(['Κόρινθος', 'παρθένος', 'στείρος', 'προφήτης'])
    const inert: string[] = []
    // Mirrors classifyDeclension WITHOUT its exception lookup — including the accent
    // normalisation, which the rule depends on. Keep the two in step.
    const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    for (const [lexeme, declension] of Object.entries(DECLENSION_EXCEPTIONS)) {
      if (documented.has(lexeme)) continue
      const s = strip(lexeme)
      const bare = /μα$/.test(s) ? '3rd'
        : /ευς$/.test(s) ? '3rd'
          : /(ος|ον)$/.test(s) ? '2nd'
            : /(α|η|ας|ης)$/.test(s) ? '1st' : '3rd'
      if (bare === declension) inert.push(lexeme)
    }
    expect(inert).toEqual([])
  })

  it('strips accents before matching the ending', () => {
    // An accented ending is a different codepoint from its bare form, so matching the raw
    // lexeme drops every word accented on its last syllable. Without normalising, all of these
    // fell through to the third declension, which is wrong for five of the six.
    expect(classifyDeclension('θεός')).toBe('2nd')
    expect(classifyDeclension('ἀδελφός')).toBe('2nd')
    expect(classifyDeclension('γραφή')).toBe('1st')
    expect(classifyDeclension('ἐντολή')).toBe('1st')
    expect(classifyDeclension('κεφαλή')).toBe('1st')
    expect(classifyDeclension('γυνή')).toBe('3rd')   // exception: γυναικ- stem
  })

  it('handles the stems no ending can reveal', () => {
    expect(classifyDeclension('γραμματεύς')).toBe('3rd')  // -ευς
    expect(classifyDeclension('βοῦς')).toBe('3rd')
    expect(classifyDeclension('νοῦς')).toBe('2nd')
    expect(classifyDeclension('ἀσθενής')).toBe('3rd')     // -ες adjective
    expect(classifyDeclension('κρεῖσσον')).toBe('3rd')    // comparative
    expect(classifyDeclension('προφήτης')).toBe('1st')
  })

  it('-μα stems are third declension, not first', () => {
    // The ending is -α, so a naive first-declension test swallows the whole -ματ- class.
    for (const lexeme of ['ὄνομα', 'πνεῦμα', 'χάρισμα', 'θέλημα', 'σῶμα']) {
      expect(classifyDeclension(lexeme)).toBe('3rd')
    }
  })

  it('points only at table ids that exist in their chapter', () => {
    const chapters = path.join(process.cwd(), 'src/components/morphology/chapters')
    const source = fs.readdirSync(chapters)
      .filter(f => f.endsWith('.tsx'))
      .map(f => fs.readFileSync(path.join(chapters, f), 'utf8'))
      .join('\n')
    const targets = new Set<string>()
    for (const [partOfSpeech, pool] of NOMINAL) {
      for (const lexeme of lexemesOf(pool)) {
        const target = paradigmFor({ partOfSpeech, lexeme })
        if (target) targets.add(target.tableId)
      }
    }
    expect(targets.size).toBeGreaterThan(0)
    for (const tableId of Array.from(targets)) {
      expect(source).toContain(`MorphTable id="${tableId}"`)
    }
  })

  it('keeps the panel\'s copy of a table identical to the chapter\'s', () => {
    // The chapter imports PARADIGM_TABLE_DATA rather than holding its own rows, so this asserts
    // the import is still wired — if someone pastes literal rows back into nouns.tsx, the two
    // copies can drift and a student would see one table in the drill and another in the chapter.
    const nouns = fs.readFileSync(
      path.join(process.cwd(), 'src/components/morphology/chapters/nouns.tsx'), 'utf8')
    expect(nouns).toContain("PARADIGM_TABLE_DATA['nouns.t3']")
    expect(nouns).toContain("PARADIGM_TABLE_DATA['nouns.t5']")
    expect(nouns).toContain('rows={T3.rows}')
    expect(nouns).toContain('rows={T5.rows}')
    for (const data of Object.values(PARADIGM_TABLE_DATA)) {
      expect(data.rows.length).toBeGreaterThan(0)
      // Every row has to be as wide as the header, or MorphTable renders a ragged table.
      for (const row of data.rows) expect(row).toHaveLength(data.headers.length)
    }
  })
})
