/**
 * @jest-environment jsdom
 *
 * Limiting a construct to particular books or works.
 */
import '@testing-library/jest-dom'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConstructScopePicker, type ScopeEntry } from '@/components/search/ConstructScopePicker'

const WORKS: ScopeEntry[] = [
  { id: 'greco/plato-apology', label: 'Plato, Apology', short: 'Plato, Apology', group: 'Plato, Apology' },
  { id: 'greco/plato-crito', label: 'Plato, Crito', short: 'Plato, Crito', group: 'Plato, Crito' },
  { id: 'greco/plato-timaeus', label: 'Plato, Timaeus', short: 'Plato, Timaeus', group: 'Plato, Timaeus' },
  { id: 'greco/aristotle-poetics', label: 'Aristotle, Poetics', short: 'Aristotle, Poetics', group: 'Aristotle, Poetics' },
]
const BOOKS: ScopeEntry[] = [
  { id: 'Matt', label: 'Matthew', short: 'Matt', group: 'New Testament' },
  { id: 'Mark', label: 'Mark', short: 'Mark', group: 'New Testament' },
]

function Harness({ entries, biblical }: { entries: ScopeEntry[]; biblical: boolean }) {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <>
      <ConstructScopePicker entries={entries} selected={selected} biblical={biblical}
        onChange={setSelected} onClose={() => {}} />
      <pre data-testid="selected">{JSON.stringify(selected)}</pre>
    </>
  )
}
const selected = (): string[] => JSON.parse(screen.getByTestId('selected').textContent ?? '[]')

describe('choosing works', () => {
  it('accumulates rather than replacing', () => {
    // Each pick must add to the scope. (A version of this that read a stale selection kept only the
    // last click, which is easy to miss because it only shows when picks land in one render.)
    render(<Harness entries={WORKS} biblical={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Plato, Apology/ }))
    fireEvent.click(screen.getByRole('button', { name: /Plato, Crito/ }))
    fireEvent.click(screen.getByRole('button', { name: /Plato, Timaeus/ }))
    expect(selected()).toEqual(['greco/plato-apology', 'greco/plato-crito', 'greco/plato-timaeus'])
  })

  it('deselects on a second click, and clears', () => {
    render(<Harness entries={WORKS} biblical={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Plato, Crito/ }))
    fireEvent.click(screen.getByRole('button', { name: /Plato, Crito/ }))
    expect(selected()).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: /Plato, Apology/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(selected()).toEqual([])
  })

  it('filters a long list without losing what is already chosen', () => {
    // Greco-Roman has 49 works, so the list is filterable — and filtering must not clear the scope.
    render(<Harness entries={WORKS} biblical={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Aristotle, Poetics/ }))
    fireEvent.change(screen.getByPlaceholderText('Filter works…'), { target: { value: 'Plato' } })

    expect(screen.queryByRole('button', { name: /Aristotle/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Plato, Crito/ })).toBeInTheDocument()
    expect(selected()).toEqual(['greco/aristotle-poetics'])
  })

  it('says so when nothing matches the filter', () => {
    render(<Harness entries={WORKS} biblical={false} />)
    fireEvent.change(screen.getByPlaceholderText('Filter works…'), { target: { value: 'Cicero' } })
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument()
  })
})

describe('choosing books', () => {
  it('shows abbreviations and no filter box', () => {
    // 27 or 54 well-known abbreviations fit a grid; filtering would be in the way.
    render(<Harness entries={BOOKS} biblical />)
    expect(screen.queryByPlaceholderText('Filter works…')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Matt' }))
    expect(selected()).toEqual(['Matt'])
  })

  it('selects and clears a whole group in one click', () => {
    render(<Harness entries={BOOKS} biblical />)
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(selected()).toEqual(['Matt', 'Mark'])
    // The group's own toggle, distinct from the header's "Clear" which drops every group.
    fireEvent.click(screen.getByRole('button', { name: 'Deselect all' }))
    expect(selected()).toEqual([])
  })
})
