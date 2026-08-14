/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { P, SectionHeading, Tr, Gk, Term } from '@/components/morphology/shared'
import { rangeFromOffsets, offsetWithin } from '@/components/highlights/range-utils'

/**
 * The annotation layer's whole contract with the chapters is `data-ann-block`. These tests
 * pin the two things that make it safe to have added a wrapper to 900+ places: the anchor is
 * emitted on EVERY path through <Tr> (including the English one, which is what most readers
 * see), and the wrapper never becomes invalid markup.
 */
describe('annotation anchors', () => {
  it('anchors a paragraph on the untranslated (English) path', () => {
    const { container } = render(<P id="nouns-intro">A Greek noun carries its case in the ending.</P>)
    const block = container.querySelector('[data-ann-block="nouns-intro"]')
    expect(block).toBeInTheDocument()
    expect(block!.textContent).toBe('A Greek noun carries its case in the ending.')
  })

  it('anchors the heading text WITHOUT its number badge', () => {
    // The offsets are measured against the anchored element. If the anchor were the <h3>,
    // every offset in every heading note would be shifted by the width of "3".
    const { container } = render(<SectionHeading n={3} id="nouns-h3">The Genitive</SectionHeading>)
    const block = container.querySelector('[data-ann-block="nouns-h3"]')
    expect(block!.textContent).toBe('The Genitive')
    expect(container.querySelector('h3')!.textContent).toContain('3')
  })

  it('leaves a paragraph with no id unanchored', () => {
    // No stable id means no durable anchor, so it must not offer one.
    const { container } = render(<P>Untranslatable aside.</P>)
    expect(container.querySelector('[data-ann-block]')).toBeNull()
  })

  it('never puts a block element inside the inline wrapper', () => {
    // <span><p/></span> is invalid and browsers recover from it by restructuring the DOM —
    // which would move text out from under the anchor the offsets were measured against.
    const { container } = render(
      <>
        <P id="a">Plain prose.</P>
        <Tr id="b" paragraphs>
          <p>First paragraph.</p>
          <p>Second paragraph.</p>
        </Tr>
      </>,
    )
    for (const el of Array.from(container.querySelectorAll('span[data-ann-block]'))) {
      expect(el.querySelector('p, div, h1, h2, h3, table, ul, ol')).toBeNull()
    }
    // The multi-paragraph block still gets an anchor — just a block-level one.
    expect(container.querySelector('div[data-ann-block="b"]')).toBeInTheDocument()
  })

  it('rebuilds a range that starts in plain text and ends inside a Greek span', () => {
    // The reason highlights are painted rather than wrapped: a selection routinely crosses
    // the nested markup a chapter is full of.
    const { container } = render(
      <P id="c">
        The ending <Gk>-ου</Gk> marks the genitive.
      </P>,
    )
    const block = container.querySelector<HTMLElement>('[data-ann-block="c"]')!
    const text = block.textContent!
    const start = text.indexOf('ending')
    const end = text.indexOf('marks')
    const range = rangeFromOffsets(block, start, end)
    expect(range).not.toBeNull()
    expect(range!.toString()).toBe(text.slice(start, end))
    // …and the round trip: measuring that range back gives the offsets we asked for.
    expect(offsetWithin(block, range!.startContainer, range!.startOffset)).toBe(start)
  })

  it('returns null when the stored offsets are longer than the block now is', () => {
    // The signal that a block was edited. Painting a clipped range instead would highlight
    // an arbitrary tail of the paragraph.
    const { container } = render(<P id="d">Short.</P>)
    const block = container.querySelector<HTMLElement>('[data-ann-block="d"]')!
    expect(rangeFromOffsets(block, 2, 400)).toBeNull()
  })

  it('measures offsets past a glossary Term the same as past plain words', () => {
    const { container } = render(
      <P id="e">
        A <Term t="case">case</Term> ending is a suffix.
      </P>,
    )
    const block = container.querySelector<HTMLElement>('[data-ann-block="e"]')!
    const text = block.textContent!
    const start = text.indexOf('ending')
    const range = rangeFromOffsets(block, start, start + 6)
    expect(range!.toString()).toBe('ending')
  })
})
