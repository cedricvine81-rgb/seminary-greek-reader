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
    const known = new Set([...STUDY_ROUTES, '/tools', '/exegesis/diagramming-guide'])
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
