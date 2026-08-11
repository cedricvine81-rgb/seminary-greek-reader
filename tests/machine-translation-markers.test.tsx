/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { translatable, notTranslatable, greekText, hebrewText } from '@/lib/i18n/machine-translation'

/**
 * Browser page-translation is denied on <body> and opted into per block. The risk this guards is
 * one-directional and quiet: nobody notices a block that FAILS to translate, but a block that
 * wrongly opts in hands the Greek to Google Translate, and the reader has no way to tell that
 * what they are looking at is machine output.
 *
 * So these assert the mechanism the markers rely on — inheritance and override — rather than
 * where they are currently applied. jsdom implements HTMLElement.translate to the same spec
 * Chrome does, which is what makes the default-deny design safe to build on.
 */
describe('translate markers', () => {
  it('deny inherits, and an opt-in overrides it for its whole subtree', () => {
    const { container } = render(
      <div translate="no">
        <span data-testid="inherits">Greek stays put</span>
        <div {...translatable}>
          <span data-testid="opted-in">English prose</span>
          <em {...notTranslatable} data-testid="re-denied">ἀγάπη</em>
        </div>
      </div>,
    )
    const at = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
    expect(at('inherits').translate).toBe(false)
    expect(at('opted-in').translate).toBe(true)
    // A Greek quotation inside an English paragraph can be pulled back out again.
    expect(at('re-denied').translate).toBe(false)
  })

  it('marks the source languages, which fonts and screen readers use too', () => {
    expect(greekText).toEqual({ translate: 'no', lang: 'grc' })
    expect(hebrewText).toEqual({ translate: 'no', lang: 'he', dir: 'rtl' })
    expect(translatable).toEqual({ translate: 'yes', lang: 'en' })
  })

  it('never lets the ancient-language markers opt into translation', () => {
    // The one property that must hold no matter how these are edited later.
    for (const marker of [greekText, hebrewText, notTranslatable]) {
      expect(marker.translate).toBe('no')
    }
  })
})
