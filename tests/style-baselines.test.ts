/**
 * The Classical and Koine baselines.
 *
 * These are the columns a reader uses to judge whether a rate is remarkable, so a
 * misclassified author moves a number nobody can check by eye. The guard is that the
 * baselines must reproduce the developments every grammar of Koine describes: if the optative
 * is not visibly dying between the two columns, something is in the wrong one.
 */
import fs from 'fs'
import path from 'path'
import type { StyleMeta } from '@/lib/style-register'

const meta: StyleMeta = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/style/index.json'), 'utf8'),
).meta
const { classical, koine, excluded } = meta.periods
const authors = (p: typeof classical) => p.members.map(m => m.author)

describe('period baselines', () => {
  it('puts the Attic prose authors in the Classical column', () => {
    expect(authors(classical).sort()).toEqual([
      'Aristotle', 'Demosthenes', 'Herodotus', 'Isocrates',
      'Lysias', 'Plato', 'Thucydides', 'Xenophon',
    ])
  })

  it('counts the imperial Atticizers as Koine, since the labels are periods not registers', () => {
    for (const a of ['Plutarch', 'Dio Chrysostom', 'Philostratus', 'Diogenes Laertius']) {
      expect(authors(koine)).toContain(a)
    }
  })

  it('leaves epic verse out of both', () => {
    const epic = excluded.map(e => e.label)
    expect(epic.some(l => l.startsWith('Homer'))).toBe(true)
    expect(epic.some(l => l.startsWith('Hesiod'))).toBe(true)
    expect(authors(classical).concat(authors(koine))).not.toContain('Homer')
  })

  it('gives each author one vote, so no one author is the average', () => {
    // Demosthenes brought 63 speeches and Plutarch 138 works; as texts they would be about
    // half of their column apiece.
    expect(classical.members.find(m => m.author === 'Demosthenes')!.works).toBeGreaterThan(50)
    expect(koine.members.find(m => m.author === 'Plutarch')!.works).toBeGreaterThan(100)
    expect(authors(classical).length).toBe(8)
    expect(authors(koine).length).toBeGreaterThan(100)   // many-handed collections, per book
  })

  it('reproduces the developments every grammar of Koine describes', () => {
    // The optative all but disappears.
    expect(koine.features.optative).toBeLessThan(classical.features.optative / 3)
    // The literary particles go with it.
    expect(koine.features.literaryParticles).toBeLessThan(classical.features.literaryParticles / 3)
    // Parataxis rises: καί up, δέ down.
    expect(koine.words['και']).toBeGreaterThan(classical.words['και'])
    expect(koine.words['δε']).toBeLessThan(classical.words['δε'])
    // ἵνα + subjunctive spreads at the expense of the infinitive.
    expect(koine.features.hina).toBeGreaterThan(classical.features.hina)
    expect(koine.features.infinitive).toBeLessThan(classical.features.infinitive)
  })

  it('covers every feature and every Delta word, so no column can read blank', () => {
    for (const f of meta.features) {
      expect(typeof classical.features[f.key]).toBe('number')
      expect(typeof koine.features[f.key]).toBe('number')
    }
    for (const l of meta.deltaWords) {
      expect(typeof classical.words[l]).toBe('number')
      expect(typeof koine.words[l]).toBe('number')
    }
  })
})

/**
 * Genre pools.
 *
 * A period average blends Demosthenes with the Septuagint, so a Gospel was being judged against
 * a figure that is mostly forensic oratory. These pools let a reader compare like with like —
 * and, just as usefully, deliberately unlike, which is how a number becomes evidence. What the
 * library can and cannot support is pinned here because the absences matter as much as the
 * pools: there is no classical epistolography at all.
 */
describe('genre pools', () => {
  const { classicalGenres, koineGenres, genreOfWork } = meta.periods

  it('labels the New Testament by its actual genres', () => {
    expect(genreOfWork.Mark).toBe('narrative')
    expect(genreOfWork.Acts).toBe('narrative')
    expect(genreOfWork.Phil).toBe('letters')
    expect(genreOfWork.Heb).toBe('letters')
    expect(genreOfWork.Rev).toBe('apocalyptic')
  })

  it('splits an author who wrote in more than one genre', () => {
    // Plutarch's Lives narrate and his Moralia argue; averaged together they would blur the
    // distinction these pools exist to draw.
    expect(genreOfWork['greco/plutarch-antony']).toBe('narrative')
    expect(genreOfWork['greco/plutarch-isis-osiris']).toBe('treatise')
  })

  it('has no Classical letters, which is a fact about the library and not a bug', () => {
    expect(classicalGenres.letters).toBeUndefined()
    expect(koineGenres.letters).toBeDefined()
    expect(koineGenres.letters.members.length).toBeGreaterThan(20)
  })

  it('offers classical narrative on the strength of two historians, and says so', () => {
    expect(classicalGenres.narrative.members.map(m => m.author).sort())
      .toEqual(['Herodotus', 'Thucydides'])
  })

  it('separates the genres it claims to separate', () => {
    // If narrative and oratory produced the same figures the pools would be decoration.
    const narr = classicalGenres.narrative.features
    const orat = classicalGenres.oratory.features
    expect(Math.abs(narr.literaryParticles - orat.literaryParticles)).toBeGreaterThan(5)
    // And the period difference survives inside a single genre: Koine narrative still uses far
    // fewer literary particles than Classical narrative.
    expect(koineGenres.narrative.features.literaryParticles)
      .toBeLessThan(classicalGenres.narrative.features.literaryParticles / 3)
  })

  it('covers every feature in every pool it publishes', () => {
    for (const pools of [classicalGenres, koineGenres]) {
      for (const pool of Object.values(pools)) {
        for (const f of meta.features) expect(typeof pool.features[f.key]).toBe('number')
      }
    }
  })
})
