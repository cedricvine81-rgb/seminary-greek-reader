/**
 * The two named axes, against what the grammars say.
 *
 * These are the tool's only claims phrased in the scholarship's own terms rather than as raw
 * counts, so they carry more weight than a rate does — and a plausible-looking number in the
 * wrong order would be believed. Every assertion here is a position the literature has held
 * since Blass, and the axes have to reproduce it from counting alone.
 */
import fs from 'fs'
import path from 'path'

interface Unit { work: string; kind: string; label: string; periodicity: number; classicalLean: number }
const units: Unit[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/style/index.json'), 'utf8'),
).units
const w = (id: string) => units.find(u => u.kind === 'work' && u.work === id)!
const per = (id: string) => w(id).periodicity
const lean = (id: string) => w(id).classicalLean

describe('periodicity — Aristotle’s εἰρομένη against κατεστραμμένη', () => {
  it('puts the paratactic books at the bottom', () => {
    // Revelation and Mark are the standard examples of the "strung-on" style.
    expect(per('Rev')).toBeLessThan(per('Mark'))
    expect(per('Mark')).toBeLessThan(per('Matt'))
    expect(per('Mark')).toBeLessThan(per('John'))
  })

  it('puts the literary books at the top, in the order the grammars give', () => {
    expect(per('Heb')).toBeGreaterThan(per('Rom'))
    expect(per('1Pet')).toBeGreaterThan(per('Rom'))
    // Acts is more periodic than the Gospel of Luke — the same author writing up.
    expect(per('Acts')).toBeGreaterThan(per('Luke'))
  })

  it('ranks the whole New Testament between Revelation and 1 Peter', () => {
    const nt = ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', 'Heb', '1Pet', 'Rev']
    const sorted = nt.slice().sort((a, b) => per(a) - per(b))
    expect(sorted[0]).toBe('Rev')
    expect(sorted[sorted.length - 1]).toBe('1Pet')
  })

  it('finds translation Greek the most paratactic thing in the library', () => {
    // Genesis is Hebrew narrative rendered clause for clause; it should out-parataxis Mark.
    expect(per('Gen')).toBeLessThan(per('Mark'))
  })
})

describe('classical lean — where a text sits between the two periods', () => {
  it('separates the periods it was built to separate', () => {
    expect(lean('greco/plato-gorgias')).toBeGreaterThan(lean('josephus/jewish-war'))
    expect(lean('josephus/jewish-war')).toBeGreaterThan(lean('Gen'))
  })

  it('places the Second Sophistic above its literary contemporaries', () => {
    // Atticizers writing under the Empire: the point of having the axis at all.
    for (const sophist of ['greco/dio-chrysostom-orations', 'greco/philostratus-apollonius']) {
      expect(lean(sophist)).toBeGreaterThan(lean('josephus/jewish-war'))
    }
  })

  it('puts the Septuagint furthest from Attic, and Revelation with it', () => {
    expect(lean('Ps')).toBeLessThan(lean('Rev'))
    expect(lean('Rev')).toBeLessThan(lean('Mark'))
    expect(lean('Gen')).toBeLessThan(lean('Mark'))
  })

  it('disagrees with periodicity, which is the finding and not a fault', () => {
    // 1 Peter is the most periodic book in the New Testament and yet leans further from Attic
    // than John does: a text can be rhetorically wrought in thoroughly Koine words. If these
    // two ever move together the second axis has stopped earning its place.
    expect(per('1Pet')).toBeGreaterThan(per('John'))
    expect(lean('1Pet')).toBeLessThan(lean('John'))
  })
})
