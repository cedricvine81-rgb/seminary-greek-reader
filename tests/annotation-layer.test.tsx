/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { AnnotationLayer } from '@/components/annotations/AnnotationLayer'
import { fingerprint } from '@/lib/i18n/content'

/**
 * The end-to-end path a reader takes to START a note: select some words in a block, lift the
 * pointer, get the palette. Everything else in the feature is downstream of this working, and
 * it is the part that cannot be checked by reading the code — it depends on the interaction
 * between the selection API, the anchor lookup and the enabled/auth gate.
 */

const TEXT = 'A Greek noun carries its case in the ending, not in its position.'

// jsdom implements neither of these, and both run on mount. Stubbing them here rather than
// guarding the source: a browser always has them, and a `typeof` guard in production code to
// satisfy a test runner is how real branches go untested.
beforeAll(() => {
  // jsdom's Range has no getBoundingClientRect (no layout engine). The hook needs it to
  // position the palette over the selection.
  // @ts-ignore jsdom has no Range layout
  Range.prototype.getBoundingClientRect = () => ({ left: 10, top: 20, width: 50, height: 12 })
  // @ts-ignore jsdom has no matchMedia
  window.matchMedia = (q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })
})

function stubFetch(status: number, body: unknown = { annotations: [] }) {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
  // @ts-ignore jsdom has no fetch
  global.fetch = fn
  return fn
}

function renderLayer() {
  return render(
    <LocaleProvider locale="en">
      <AnnotationLayer page="nouns">
        <p><span data-ann-block="nouns-intro">{TEXT}</span></p>
      </AnnotationLayer>
    </LocaleProvider>,
  )
}

/** Select `word` inside the block, then lift the pointer over it, as a reader would. */
function selectAndRelease(container: HTMLElement, word: string) {
  const block = container.querySelector<HTMLElement>('[data-ann-block]')!
  const node = block.firstChild!
  const start = TEXT.indexOf(word)
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, start + word.length)
  const sel = window.getSelection()!
  sel.removeAllRanges()
  sel.addRange(range)
  act(() => {
    block.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0 }) as PointerEvent)
  })
}

describe('AnnotationLayer', () => {
  afterEach(() => { window.getSelection()?.removeAllRanges() })

  it('offers the palette when a signed-in reader selects words in a block', async () => {
    stubFetch(200)
    const { container } = renderLayer()
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    selectAndRelease(container, 'the ending')
    expect(await screen.findByPlaceholderText('Write a note…')).toBeInTheDocument()
  })

  it('stays completely inert when the reader is signed out', async () => {
    // A 401 must not produce controls that would fail on save.
    stubFetch(401, { error: 'Unauthorized' })
    const { container } = renderLayer()
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    selectAndRelease(container, 'the ending')
    expect(screen.queryByPlaceholderText('Write a note…')).not.toBeInTheDocument()
  })

  it('lists a saved note so it can be reached without finding a margin dot', async () => {
    // The reported failure: a note was written and saved, and there was no labelled way back
    // to it. A painted highlight can be missed, a margin dot can be missed or unsupported —
    // the list is the affordance that cannot be.
    stubFetch(200, {
      annotations: [{
        id: 'n1', page: 'nouns', blockId: 'nouns-intro', locale: 'en',
        startOffset: TEXT.indexOf('the ending'), endOffset: TEXT.indexOf('the ending') + 10,
        quote: 'the ending', fp: fingerprint(TEXT), color: 'yellow',
        body: 'ask about this in class', ink: null,
      }],
    })
    renderLayer()
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })

    // The count is a control, not decoration.
    const opener = screen.getByRole('button', { name: /1 note on this chapter/i })
    await act(async () => { opener.click() })
    expect(screen.getByText(/ask about this in class/)).toBeInTheDocument()
    // The quoted words come with it, so the note reads as being ABOUT something — scoped to
    // the list, since the same phrase is in the prose behind it.
    expect(screen.getByRole('listitem').textContent).toContain('the ending')
  })

  it('lists a handwriting-only note, which has no body text to show', async () => {
    stubFetch(200, {
      annotations: [{
        id: 'n2', page: 'nouns', blockId: 'nouns-intro', locale: 'en',
        startOffset: 0, endOffset: 7, quote: 'A Greek', fp: fingerprint(TEXT),
        color: 'blue', body: '', ink: '{"w":10,"h":10,"strokes":[{"color":"#000","size":2,"pts":[1,2,0.5]}]}',
      }],
    })
    renderLayer()
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    const opener = screen.getByRole('button', { name: /1 note on this chapter/i })
    await act(async () => { opener.click() })
    expect(screen.getByText('Handwritten note')).toBeInTheDocument()
  })

  it('puts a note icon beside a block with no annotations at all', async () => {
    // The affordance has to exist BEFORE there is anything to show, which is the whole
    // reason the rail is built from the DOM rather than from the annotations.
    stubFetch(200)
    renderLayer()
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    expect(screen.getByRole('button', { name: 'Add a note on this section' })).toBeInTheDocument()
  })

  it('gives one icon per section, not one per paragraph', async () => {
    // ~96 blocks a chapter: an icon beside each read as clutter rather than an invitation.
    // A section starts at a heading; everything before the first heading is one section.
    stubFetch(200)
    render(
      <LocaleProvider locale="en">
        <AnnotationLayer page="nouns">
          <p><span data-ann-block="intro">Opening prose before any heading.</span></p>
          <p><span data-ann-block="intro-2">More of the same section.</span></p>
          <h3><span data-ann-block="h-gen">The Genitive</span></h3>
          <p><span data-ann-block="gen-1">Genitive prose.</span></p>
          <h3><span data-ann-block="h-dat">The Dative</span></h3>
          <p><span data-ann-block="dat-1">Dative prose.</span></p>
        </AnnotationLayer>
      </LocaleProvider>,
    )
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    // Three sections from six blocks: the intro, the genitive, the dative.
    expect(screen.getAllByRole('button', { name: 'Add a note on this section' })).toHaveLength(3)
  })

  it('keeps a note picked up by a colour swatch from being lost', async () => {
    // The reported failure: clicking a swatch created the highlight and closed the popover,
    // so the note box went away before it could be typed in.
    const fetchMock = stubFetch(200)
    const { container } = renderLayer()
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    selectAndRelease(container, 'the ending')

    const box = await screen.findByPlaceholderText('Write a note…')
    await act(async () => { screen.getByTitle('Green').click() })
    // Still open, and still holding what was typed.
    expect(screen.getByPlaceholderText('Write a note…')).toBe(box)

    fireEvent.change(box, { target: { value: 'genitive of source?' } })
    await act(async () => { screen.getByRole('button', { name: 'Save' }).click() })

    const post = fetchMock.mock.calls.find(c => c[1]?.method === 'POST')
    expect(post).toBeDefined()
    const sent = JSON.parse(post![1].body)
    expect(sent.body).toBe('genitive of source?')
    expect(sent.color).toBe('green')
  })

  it('drops the native selection on a touch device once the range is captured', async () => {
    // iOS raises Copy / Look Up / Translate over any live selection and the callout cannot be
    // suppressed while one exists, so it opened on top of the palette every time. Clearing the
    // selection takes the callout with it — the range is already measured by then, and the
    // layer paints it so the reader still sees what they picked.
    const real = window.matchMedia
    // @ts-ignore coarse pointer, i.e. an iPad
    window.matchMedia = (q: string) => ({
      matches: q.includes('coarse'), media: q, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    })
    try {
      stubFetch(200)
      const { container } = renderLayer()
      await act(async () => { await new Promise(r => setTimeout(r, 0)) })
      selectAndRelease(container, 'the ending')

      // The palette still opens — the range survived the clear...
      expect(await screen.findByPlaceholderText('Write a note…')).toBeInTheDocument()
      // ...and the document has no selection left for iOS to decorate.
      expect(window.getSelection()?.rangeCount ?? 0).toBe(0)
      // The Copy the system menu used to provide is on the palette instead.
      expect(screen.getByTitle('Copy text')).toBeInTheDocument()
    } finally {
      window.matchMedia = real
    }
  })

  it('leaves the selection alone on a mouse, where nothing competes with it', async () => {
    stubFetch(200)
    const { container } = renderLayer()
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    selectAndRelease(container, 'the ending')
    await screen.findByPlaceholderText('Write a note…')
    expect(window.getSelection()?.rangeCount).toBe(1)
  })

  it('ignores a selection that lands outside any annotatable block', async () => {
    stubFetch(200)
    const { container } = render(
      <LocaleProvider locale="en">
        <AnnotationLayer page="nouns">
          <p id="plain">Prose with no stable id, so no durable anchor.</p>
        </AnnotationLayer>
      </LocaleProvider>,
    )
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    const p = container.querySelector('#plain')!
    const range = document.createRange()
    range.setStart(p.firstChild!, 0)
    range.setEnd(p.firstChild!, 5)
    const sel = window.getSelection()!
    sel.removeAllRanges(); sel.addRange(range)
    act(() => { p.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0 }) as PointerEvent) })
    expect(screen.queryByPlaceholderText('Write a note…')).not.toBeInTheDocument()
  })
})
