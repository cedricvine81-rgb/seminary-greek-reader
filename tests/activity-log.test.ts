import {
  normalizeActivityConfig, normalizeEntries, weeksReported, autoGrade, weekDeadlines, MAX_WEEKS,
} from '../src/lib/activity-log'

describe('normalizeActivityConfig', () => {
  it('falls back to a one-week Sunday log for junk', () => {
    for (const junk of [null, undefined, 'x', 42, []]) {
      expect(normalizeActivityConfig(junk)).toEqual({ weeks: 1, dayOfWeek: 0, requiredWeeks: 1 })
    }
  })

  it('keeps a valid config', () => {
    expect(normalizeActivityConfig({ weeks: 6, dayOfWeek: 3, requiredWeeks: 5 }))
      .toEqual({ weeks: 6, dayOfWeek: 3, requiredWeeks: 5 })
  })

  it('defaults requiredWeeks to every week', () => {
    expect(normalizeActivityConfig({ weeks: 8, dayOfWeek: 1 }).requiredWeeks).toBe(8)
  })

  // The trap this guards: shortening an activity must never leave it demanding more
  // reports than it has weeks, which would make a pass unreachable.
  it('clamps requiredWeeks down to the number of weeks', () => {
    expect(normalizeActivityConfig({ weeks: 3, dayOfWeek: 0, requiredWeeks: 10 }).requiredWeeks).toBe(3)
  })

  it('clamps weeks and dayOfWeek into range', () => {
    expect(normalizeActivityConfig({ weeks: 999, dayOfWeek: 9 }).weeks).toBe(MAX_WEEKS)
    expect(normalizeActivityConfig({ weeks: 0, dayOfWeek: -4 })).toEqual({ weeks: 1, dayOfWeek: 0, requiredWeeks: 1 })
  })
})

describe('normalizeEntries', () => {
  const at = '2026-09-08T12:00:00.000Z'

  it('keeps only weeks that exist', () => {
    const out = normalizeEntries({ 1: { done: true, at, comment: '' }, 9: { done: true, at, comment: '' } }, 4)
    expect(Object.keys(out)).toEqual(['1'])
  })

  // This used to assert that an un-ticked week was dropped outright. It no longer is, and the
  // change was deliberate: a week now needs a statement of what was done before it can be ticked,
  // so the statement has to be savable while the week is still un-ticked or text typed and not
  // yet ticked would be lost by closing the tab. An un-ticked week with nothing written is still
  // dropped, and weeksReported still counts `done`, so a draft earns no credit.
  it('keeps an un-ticked week that has a statement, drops an empty one', () => {
    const out = normalizeEntries({
      1: { done: false, at, comment: 'x' },
      2: { done: true, at, comment: '' },
      3: { done: false, at, comment: '' },
    }, 4)
    expect(Object.keys(out).sort()).toEqual(['1', '2'])
    expect(out['1'].done).toBe(false)
    expect(weeksReported(out)).toBe(1)
  })

  it('rejects non-object and out-of-range keys', () => {
    expect(normalizeEntries({ 0: { done: true, at }, '-1': { done: true, at }, a: { done: true, at } }, 4)).toEqual({})
    expect(normalizeEntries({ 1: 'yes' }, 4)).toEqual({})
    expect(normalizeEntries(null, 4)).toEqual({})
  })

  it('caps the comment length', () => {
    const out = normalizeEntries({ 1: { done: true, at, comment: 'x'.repeat(5000) } }, 4)
    expect(out['1'].comment.length).toBe(2000)
  })

  it('replaces an unparseable timestamp rather than storing it', () => {
    const out = normalizeEntries({ 1: { done: true, at: 'not a date', comment: '' } }, 4)
    expect(Number.isNaN(Date.parse(out['1'].at))).toBe(false)
  })
})

describe('autoGrade', () => {
  const config = { weeks: 6, dayOfWeek: 0, requiredWeeks: 4 }
  const entriesFor = (n: number) =>
    normalizeEntries(
      Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, { done: true, at: '2026-09-08T00:00:00.000Z', comment: '' }])),
      config.weeks,
    )

  it('passes once the required weeks are reported', () => {
    expect(autoGrade(entriesFor(4), config, true)).toBe(100)
    expect(weeksReported(entriesFor(4))).toBe(4)
  })

  // The point of returning null rather than 0: a log still in progress must not land in the
  // gradebook as a failure while the student can still finish it.
  it('is undecided while the window is open and the target is unmet', () => {
    expect(autoGrade(entriesFor(2), config, true)).toBeNull()
  })

  it('fails once the window has closed short of the target', () => {
    expect(autoGrade(entriesFor(2), config, false)).toBe(0)
  })

  it('passes a closed log that met the target', () => {
    expect(autoGrade(entriesFor(6), config, false)).toBe(100)
  })
})

describe('weekDeadlines', () => {
  it('gives one deadline per week, seven days apart', () => {
    const out = weekDeadlines(new Date('2026-09-07T00:00:00'), { weeks: 4, dayOfWeek: 0, requiredWeeks: 4 })
    expect(out).toHaveLength(4)
    const gaps = out.slice(1).map((d, i) => Date.parse(d) - Date.parse(out[i]))
    expect(gaps.every(g => g === 7 * 24 * 60 * 60 * 1000)).toBe(true)
  })

  it('lands every deadline on the chosen weekday', () => {
    for (let day = 0; day < 7; day++) {
      const out = weekDeadlines(new Date('2026-09-07T00:00:00'), { weeks: 3, dayOfWeek: day, requiredWeeks: 3 })
      expect(out.map(d => new Date(d).getDay())).toEqual([day, day, day])
    }
  })

  // Week 1 must not be retroactive: an instructor who sets "Sundays" on a Wednesday should
  // get the coming Sunday, not the one already past.
  it('never puts week 1 before the due date', () => {
    const due = new Date('2026-09-09T00:00:00') // a Wednesday
    for (let day = 0; day < 7; day++) {
      const first = new Date(weekDeadlines(due, { weeks: 2, dayOfWeek: day, requiredWeeks: 2 })[0])
      expect(first.getTime()).toBeGreaterThanOrEqual(due.getTime())
    }
  })
})
