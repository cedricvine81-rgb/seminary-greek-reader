/**
 * @jest-environment jsdom
 *
 * Component tests for Construct search's word card.
 *
 * Every case here pins a defect that actually shipped, or nearly did. All three were client-side
 * STATE handling, which the library-level tests can't see: a query can be perfectly well formed and
 * still be the wrong query, because the card built it from stale pieces.
 */
import '@testing-library/jest-dom'
import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ConstructTermCard } from '@/components/search/ConstructTermCard'
import { toBiblicalHit, type ConstructTerm, type LemmaForms } from '@/lib/construct-query'

// A slice of the real lemma table (public/data/lemma-forms-gnt.json).
const LEMMAS = new Map<string, LemmaForms>([
  // A masculine noun, never in the vocative: gender and part of speech are settled, case narrowed.
  ['λογος', { p: ['noun'], d: 'λόγος', g: 'a word', n: 331,
    case: ['nominative', 'genitive', 'dative', 'accusative'], gender: ['masculine'] } as unknown as LemmaForms],
  // Attested as conjunction OR adverb, and never inflected — `degree: []` says "never occurs".
  ['ινα', { p: ['conjunction', 'adverb'], d: 'ἵνα', g: 'in order that', n: 669,
    degree: [] } as unknown as LemmaForms],
])

// The card is controlled, so tests drive it the way the page does.
function Harness({ initial, termCount = 2 }: { initial?: Partial<ConstructTerm>; termCount?: number }) {
  const [term, setTerm] = useState<ConstructTerm>(() => ({ features: {}, ...initial }))
  return (
    <>
      <ConstructTermCard index={0} termCount={termCount} term={term} corpus="GNT"
        lemmaForms={LEMMAS} onChange={setTerm} />
      {/* The query the card has actually built — what gets searched. */}
      <pre data-testid="term">{JSON.stringify(term)}</pre>
    </>
  )
}

const builtTerm = (): ConstructTerm => JSON.parse(screen.getByTestId('term').textContent ?? '{}')
const wordField = () => screen.getByPlaceholderText(/πνεῦμα/)

// Case-SENSITIVE: the agreement row ("agrees with Word 2 in case number gender") carries the same
// words in lower case, and matching those too made every count wrong.
const CATEGORY = /^(Part of speech|Tense|Voice|Mood|Person|Case|Number|Gender|Degree)$/
const categoryLabels = () => screen.getAllByText(CATEGORY).map(el => el.textContent!.trim())

// Each category is a label plus its own control, so a menu is reached through its label rather than
// by button text — every closed menu reads "any".
const menuFor = (category: string) => {
  const label = screen.getByText(new RegExp(`^${category}$`))
  return within(label.parentElement as HTMLElement).getByRole('button')
}

describe('the word decides which options are relevant', () => {
  it('narrows the form controls to what the word can be', () => {
    render(<Harness />)
    fireEvent.change(wordField(), { target: { value: 'λόγος' } })

    expect(screen.getByText(/Recognised/)).toHaveTextContent('noun')
    // A noun has no tense, voice, mood or person.
    expect(categoryLabels()).toEqual(['Part of speech', 'Case', 'Number', 'Gender'])
    expect(builtTerm().features.pos).toEqual(['noun'])
  })

  it('states a settled category instead of offering it as a choice', () => {
    render(<Harness />)
    fireEvent.change(wordField(), { target: { value: 'λόγος' } })

    // λόγος is masculine and nothing else, so Gender is a fact, not a menu — and it is NOT sent as
    // a constraint, since the lemma already implies it.
    // Two facts: it is a noun, and it is masculine.
    expect(screen.getAllByTitle('Fixed by the word you chose')).toHaveLength(2)
    expect(screen.getByText('Masculine')).toBeInTheDocument()
    expect(screen.getByText('Noun')).toBeInTheDocument()
    expect(builtTerm().features.gender).toBeUndefined()
  })

  it('offers only the cases the word actually occurs in', () => {
    render(<Harness />)
    fireEvent.change(wordField(), { target: { value: 'λόγος' } })

    fireEvent.click(menuFor('Case'))
    expect(screen.getByRole('button', { name: 'Nominative' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accusative' })).toBeInTheDocument()
    // λόγος never appears in the vocative, so offering one could only ever return nothing.
    expect(screen.queryByRole('button', { name: 'Vocative' })).not.toBeInTheDocument()
  })
})

describe('a part of speech the word cannot be is discarded', () => {
  // THE ἵνα BUG. Choosing Verb and then typing ἵνα left the Verb in the query, so the search asked
  // for a verb whose lemma is ἵνα — impossible. It returned zero verses with nothing on screen to
  // explain why, because the dropdown had already narrowed to Conjunction/Adverb and so couldn't
  // display the stale value it was still searching on.
  it('drops a stale part of speech when the word changes', () => {
    render(<Harness initial={{ features: { pos: ['verb'], mood: ['subjunctive'] } }} />)
    expect(builtTerm().features.pos).toEqual(['verb'])

    fireEvent.change(wordField(), { target: { value: 'ἵνα' } })

    const term = builtTerm()
    expect(term.features.pos).toBeUndefined()          // not ['verb']
    expect(term.features.mood).toBeUndefined()         // nor the mood that came with it
    expect(screen.getByText(/Recognised/)).toHaveTextContent('conjunction or adverb')
  })

  it('offers no inflection at all for a word that never inflects', () => {
    render(<Harness />)
    fireEvent.change(wordField(), { target: { value: 'ἵνα' } })
    // Neither of ἵνα's parts of speech inflects, and it is never attested with a degree.
    expect(categoryLabels()).toEqual(['Part of speech'])
  })

  it('adopts the part of speech when the word leaves no doubt', () => {
    render(<Harness />)
    fireEvent.change(wordField(), { target: { value: 'λόγος' } })
    expect(builtTerm().features.pos).toEqual(['noun'])
    // But keeps the choice open when the word is attested as more than one thing.
    fireEvent.change(wordField(), { target: { value: 'ἵνα' } })
    expect(builtTerm().features.pos).toBeUndefined()
  })
})

describe('choosing a form', () => {
  it('closes the menu on a plain click', () => {
    render(<Harness initial={{ features: { pos: ['verb'] } }} />)
    fireEvent.click(menuFor('Tense'))
    fireEvent.click(screen.getByRole('button', { name: 'Aorist' }))

    expect(screen.queryByRole('button', { name: 'Perfect' })).not.toBeInTheDocument()
    expect(builtTerm().features.tense).toEqual(['aorist'])
  })

  it('keeps the menu open on a modifier click, so more than one can be picked', () => {
    render(<Harness initial={{ features: { pos: ['verb'] } }} />)
    fireEvent.click(menuFor('Tense'))
    fireEvent.click(screen.getByRole('button', { name: 'Aorist' }), { metaKey: true })
    fireEvent.click(screen.getByRole('button', { name: 'Perfect' }), { metaKey: true })

    // Two values in one category means "either" — the menu must survive the first pick.
    expect(builtTerm().features.tense).toEqual(['aorist', 'perfect'])
  })
})

describe('predictive lexemes', () => {
  it('suggests dictionary forms and fills the accented spelling', () => {
    render(<Harness />)
    // Typed without accents (or via the Greek keyboard) — the suggestion carries them.
    fireEvent.change(wordField(), { target: { value: 'λογο' } })
    const suggestion = screen.getByRole('button', { name: /λόγος/ })
    fireEvent.mouseDown(suggestion)

    expect(builtTerm().lemma).toBe('λόγος')
    expect(builtTerm().features.pos).toEqual(['noun'])
  })
})

describe('the API-to-results mapping', () => {
  // The cross-corpus view rendered references as a bare "2:1" with no book name, because the API
  // speaks `bookId` and the results view keys on `osisId`. One shared mapper now, so a second
  // caller can't reintroduce it.
  it('renames bookId to osisId and carries the highlighting fields', () => {
    expect(toBiblicalHit({
      bookId: 'Matt', chapter: 2, verse: 1, text: 'Τοῦ δὲ Ἰησοῦ…',
      matchedLemmas: ['γενναω'], matchedWords: [3, 5], crossesVerse: false,
    })).toEqual({
      osisId: 'Matt', chapter: 2, verse: 1, text: 'Τοῦ δὲ Ἰησοῦ…',
      matchedLemmas: ['γενναω'], matchedWords: [3, 5], crossesVerse: false,
    })
  })
})
