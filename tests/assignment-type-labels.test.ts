import fs from 'fs'
import path from 'path'
import { ALL_KEYS } from '@/lib/i18n/messages'

/**
 * Assignment-type labels are looked up with a TEMPLATE key — t(`assign.typePlural.${type}`) —
 * because the type is an enum value carried in the data. That is invisible to the --keys guard,
 * which only sees string literals, so this test is what stands in for it.
 *
 * The source of truth is the Prisma enum, read from the schema rather than re-listed here: a
 * ninth assignment type added to the schema should fail this test, not render as a bare
 * "PASSAGE_VOCABULARY" to a student. That is precisely how the old code failed — ProgressSummary
 * printed the raw enum with underscores swapped for spaces, which is what you get when there is
 * no list to keep in step with.
 */
const SHAPES = ['assign.type', 'assign.typePlural', 'assign.typeShort'] as const

function enumValues(name: string): string[] {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8')
  const body = new RegExp(`enum ${name} \\{([\\s\\S]*?)\\n\\}`).exec(schema)?.[1] ?? ''
  return body.split('\n')
    .map(l => l.replace(/\/\/.*$/, '').trim())
    .filter(l => /^[A-Z][A-Z_]*$/.test(l))
}

describe('assignment type labels', () => {
  const types = enumValues('AssignmentType')

  it('reads the enum from the schema', () => {
    expect(types.length).toBeGreaterThanOrEqual(8)
    expect(types).toContain('VOCABULARY_QUIZ')
    expect(types).toContain('CONSTRUCT_SEARCH')
  })

  it.each(SHAPES)('%s covers every AssignmentType', shape => {
    const known = new Set(ALL_KEYS)
    const missing = types.filter(ty => !known.has(`${shape}.${ty}`))
    expect(missing).toEqual([])
  })
})

describe('grade categories', () => {
  // GradeCategory is a hand-written union that must stay a subset of the enum, since the grade
  // book groups assignments by it and looks its labels up in the same namespace.
  it('are all real assignment types with labels', () => {
    const { GRADE_CATEGORIES } = require('@/lib/grade-weights') as typeof import('@/lib/grade-weights')
    const types = new Set(enumValues('AssignmentType'))
    const known = new Set(ALL_KEYS)
    expect(GRADE_CATEGORIES.filter(c => !types.has(c))).toEqual([])
    expect(GRADE_CATEGORIES.filter(c => !known.has(`assign.typePlural.${c}`))).toEqual([])
  })
})
