/**
 * The SaveBar's "Saved" (THEME-0913 §5.3), and the three ways it went wrong.
 *
 * TEST-0915 found them through `live-scheduling` on the built app: the bar
 * read "Saved" from `dirty` going true → false and held it for 1.6 s, but the
 * effect's cleanup cleared that timer whenever `dirty` changed again — so an
 * edit inside the window left the bar stuck on "Saved" with its buttons
 * hidden, and nothing could be saved until a reload. And because ANY clean
 * edge counted, a sync landing on a pristine form after a reload (one render
 * of dirty while the draft adopted the wire) said "Saved" for a save nobody
 * made — as did Cancel after a save that had failed.
 *
 * The bar is rendered inside a data router because it owns the leave-guard
 * (`useBlocker`), which is only defined there.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SaveBar } from './save-bar'

/** A screen in miniature: local edits, a save that lands or does not, a sync. */
function Host({ saveLands = true }: { saveLands?: boolean }) {
  const [dirty, setDirty] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => setDirty(true)}>
        edit
      </button>
      {/* A live sync landing on a pristine form: the draft is dirty for one
          render while the reconciler adopts the wire, then clean again. */}
      <button
        type="button"
        onClick={() => {
          setDirty(true)
          setTimeout(() => setDirty(false), 0)
        }}
      >
        sync
      </button>
      <SaveBar
        dirty={dirty}
        onSave={() => {
          if (saveLands) setDirty(false)
        }}
        onCancel={() => setDirty(false)}
        consequence="Your edits would be lost."
      />
    </div>
  )
}

function renderHost(props: { saveLands?: boolean } = {}) {
  const router = createMemoryRouter([{ path: '/', element: <Host {...props} /> }])
  return render(<RouterProvider router={router} />)
}

const UNSAVED = 'You have unsaved changes.'

describe('SaveBar — "Saved" at the bar (§5.3)', () => {
  it('a save that lands says "Saved" at the bar, then lets the bar go', async () => {
    const user = userEvent.setup()
    renderHost()
    await user.click(screen.getByRole('button', { name: 'edit' }))
    expect(screen.getByText(UNSAVED)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument(), {
      timeout: 2_500,
    })
    expect(screen.queryByText(UNSAVED)).not.toBeInTheDocument()
  })

  it('an edit inside the "Saved" window is unsaved work again — the bar never sticks', async () => {
    const user = userEvent.setup()
    renderHost()
    await user.click(screen.getByRole('button', { name: 'edit' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    // Straight away, well inside the 1.6 s the bar holds "Saved".
    await user.click(screen.getByRole('button', { name: 'edit' }))
    expect(await screen.findByText(UNSAVED)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('a clean edge nobody pressed Save for — a sync landing — never says "Saved"', async () => {
    const user = userEvent.setup()
    renderHost()
    await user.click(screen.getByRole('button', { name: 'sync' }))
    await waitFor(() => expect(screen.queryByText(UNSAVED)).not.toBeInTheDocument())
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('a save that did not land keeps "unsaved", and Cancel afterwards does not say "Saved"', async () => {
    const user = userEvent.setup()
    renderHost({ saveLands: false })
    await user.click(screen.getByRole('button', { name: 'edit' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText(UNSAVED)).toBeInTheDocument()
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText(UNSAVED)).not.toBeInTheDocument())
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })
})
