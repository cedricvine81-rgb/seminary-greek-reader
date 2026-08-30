/**
 * Every study surface must carry its own guide.
 *
 * The gap this closes was found by a reader, not by a test: four pages shipped over several
 * months with no "what is this page for?" panel, and nothing anywhere said so — the help button
 * simply hides itself when a route has no guide, which is the right behaviour and also a
 * perfectly silent one.
 *
 * So the study routes are enumerated here, and adding a page to the app's own navigation
 * without writing its guide now fails. The list is deliberately hand-written rather than
 * derived from the filesystem: not every route is a study tool, and deciding which ones are is
 * a judgement, not a glob.
 */
import { PAGE_GUIDES, guideForPath, resolveGuide } from '@/lib/page-guides'

/** Everything a student reaches from the header, plus the tools behind the Tools menu. */
const STUDY_ROUTES = [
  '/reader', '/vocab', '/grammar', '/exegesis', '/notes', '/texts',
  '/themes', '/map', '/search', '/search/construct', '/tools/register',
]

/** Pages that deliberately have none: settings, dashboards, marketing, sign-in. */
const NO_GUIDE = ['/settings', '/dashboard', '/pricing', '/privacy', '/terms', '/auth/sign-in']

describe('page guides', () => {
  it.each(STUDY_ROUTES)('covers %s', route => {
    expect(guideForPath(route, '')).toBeDefined()
  })

  it.each(NO_GUIDE)('leaves %s without one, so the button hides itself', route => {
    expect(guideForPath(route, '')).toBeUndefined()
  })

  it('sends every Exegesis tab to its own guide', () => {
    for (const tab of ['workspace', 'phrasing', 'synopsis', 'variants', 'backgrounds',
      'allusions', 'rhetoric', 'commentary', 'notes']) {
      expect(guideForPath('/exegesis', `?tab=${tab}`)?.id).toBe(`exegesis:${tab}`)
    }
    // An unknown tab falls back to the page's own guide rather than to nothing.
    expect(guideForPath('/exegesis', '?tab=nonsense')?.id).toBe('exegesis')
  })

  it('gives every guide the parts the panel renders', () => {
    for (const g of PAGE_GUIDES) {
      expect(g.title.length).toBeGreaterThan(0)
      // The lede answers "am I in the right place?", so it has to be a sentence.
      expect(g.lede.length).toBeGreaterThan(30)
      expect(g.sections.length).toBeGreaterThanOrEqual(2)
      for (const s of g.sections) {
        expect(s.heading.length).toBeGreaterThan(0)
        expect(s.body.length).toBeGreaterThan(60)
      }
    }
  })

  it('has no duplicate ids, since the panel indexes by them', () => {
    const ids = PAGE_GUIDES.map(g => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('points its onward links at routes that exist', () => {
    const known = new Set([...STUDY_ROUTES, '/tools', '/exegesis/diagramming-guide',
      '/tools/register/background'])
    for (const g of PAGE_GUIDES) {
      for (const r of g.related ?? []) {
        // Strip any query string: /exegesis?tab=notes is a real destination.
        expect(known).toContain(r.href.split('?')[0])
      }
    }
  })

  it('keeps the Hebrew overlay a complete substitution where it applies', () => {
    for (const g of PAGE_GUIDES) {
      if (!g.hebrew) continue
      const resolved = resolveGuide(g, true)
      expect(resolved.sections.length).toBeGreaterThanOrEqual(2)
      for (const s of resolved.sections) expect(s.body.length).toBeGreaterThan(60)
    }
  })
})

/**
 * The guides in Spanish.
 *
 * The catalogue is keyed by guide id and by the POSITION of each field, so reordering a
 * section keeps its translation and only an edited one goes stale. That makes the keys easy to
 * drift out of step with the guides themselves — a section inserted in the middle silently
 * shifts every key after it onto the wrong English — so the pairing is checked here rather
 * than trusted.
 */
import { ES_PAGEGUIDES } from '@/lib/i18n/generated/es.pageGuides'
import { fingerprint } from '@/lib/i18n/content'

describe('page guides in Spanish', () => {
  /** Every renderable field, keyed exactly as the panel asks for it. */
  const expected: { key: string; english: string }[] = []
  for (const g of PAGE_GUIDES) {
    const faces: [string, Partial<typeof g>][] = [['', g]]
    if (g.hebrew) faces.push(['hebrew.', g.hebrew])
    for (const [p, face] of faces) {
      if (face.title) expected.push({ key: `guide.${g.id}.${p}title`, english: face.title })
      if (face.lede) expected.push({ key: `guide.${g.id}.${p}lede`, english: face.lede })
      face.sections?.forEach((s, i) => {
        expected.push({ key: `guide.${g.id}.${p}s${i}.h`, english: s.heading })
        expected.push({ key: `guide.${g.id}.${p}s${i}.b`, english: s.body })
      })
      face.gestures?.forEach((ge, i) => {
        expected.push({ key: `guide.${g.id}.${p}g${i}.does`, english: ge.does })
        expected.push({ key: `guide.${g.id}.${p}g${i}.gets`, english: ge.gets })
      })
      face.related?.forEach((r, i) => expected.push({ key: `guide.${g.id}.${p}r${i}`, english: r.label }))
    }
  }

  it('translates every field the panel renders', () => {
    const missing = expected.filter(e => !ES_PAGEGUIDES[e.key]).map(e => e.key)
    expect(missing).toEqual([])
  })

  it('is in step with the English it was translated from', () => {
    // A stale entry is not a failure at runtime — the reader gets English — but it IS a
    // failure here, because it means a guide was edited and its translation was not.
    const stale = expected
      .filter(e => ES_PAGEGUIDES[e.key] && ES_PAGEGUIDES[e.key].fp !== fingerprint(e.english))
      .map(e => e.key)
    expect(stale).toEqual([])
  })

  it('carries no key the guides no longer have', () => {
    const live = new Set(expected.map(e => e.key))
    expect(Object.keys(ES_PAGEGUIDES).filter(k => !live.has(k))).toEqual([])
  })

  it('actually says something different from the English', () => {
    // A catalogue that echoed the English would pass every check above and translate nothing.
    const echoed = expected.filter(e =>
      e.english.length > 40 && ES_PAGEGUIDES[e.key]?.text === e.english)
    expect(echoed).toEqual([])
  })
})
