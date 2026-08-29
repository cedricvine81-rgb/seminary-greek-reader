import fs from 'fs'
import path from 'path'

/**
 * A SectionHeading gets its number one of two ways, and a chapter must not mix them up.
 *
 *  - No `n`: useSectionToc counts the headings actually IN THE DOM, stamps data-secno ("2.4"),
 *    and globals.css prints it. Recomputed per render, so it is right at both levels.
 *  - `n={4}`: the heading draws its own numbered circle from a value fixed in the source.
 *
 * The second is only safe in a chapter whose section list never changes. Half the Greek chapters
 * hide a section behind <LevelOnly>, and there a hand-set number goes wrong the moment the reader
 * switches level and the sections above it disappear — which is exactly what Parsing did: its
 * headings carried circles 1–4 while its own sidebar counted 2.2–2.5, because "Before the forms"
 * is Beginning-only. The two numbering schemes on one screen disagreed by one.
 *
 * The Hebrew chapters number every heading by hand and none of them gates a heading by level, so
 * their circles cannot drift. This test is what keeps that true.
 */
const DIRS = ['src/components/morphology/chapters', 'src/components/morphology/hebrew']

function sources(): { file: string; src: string }[] {
  return DIRS.flatMap(d => {
    const dir = path.join(process.cwd(), d)
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.tsx'))
      .map(f => ({ file: `${d}/${f}`, src: fs.readFileSync(path.join(dir, f), 'utf8') }))
  })
}

/** Does this file hide a SectionHeading behind a level gate? */
function gatesAHeading(src: string): boolean {
  const blocks = src.matchAll(/<LevelOnly[^>]*>([\s\S]*?)<\/LevelOnly>/g)
  return Array.from(blocks).some(m => m[1].includes('<SectionHeading'))
}

/** Does this file hand-set any section number? */
function handNumbers(src: string): boolean {
  return /<SectionHeading[^>]*\sn=\{/.test(src)
}

describe('grammar section numbering', () => {
  const files = sources()

  it('reads a non-trivial set of chapters', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it('never hand-numbers a chapter whose sections change with the level', () => {
    const conflicts = files.filter(f => gatesAHeading(f.src) && handNumbers(f.src)).map(f => f.file)
    expect(conflicts).toEqual([])
  })

  it('hand-numbers run 1..N with no gaps, so the circles match the sidebar', () => {
    const wrong: string[] = []
    for (const { file, src } of files) {
      const ns = Array.from(src.matchAll(/<SectionHeading[^>]*\sn=\{(\d+)\}/g)).map(m => Number(m[1]))
      if (ns.length === 0) continue
      const expected = ns.map((_, i) => i + 1)
      if (JSON.stringify(ns) !== JSON.stringify(expected)) wrong.push(`${file}: ${ns.join(',')}`)
    }
    expect(wrong).toEqual([])
  })
})
