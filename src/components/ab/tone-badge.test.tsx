import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ToneBadge } from '@/components/ab/tone-badge'

// vitest globals are off, so RTL's auto-cleanup never registers.
afterEach(cleanup)

describe('ToneBadge', () => {
  it('renders the tone name, and ONLY the name', () => {
    // CUT-0831: the preset concept is gone, so the old proof (preset and
    // custom render byte-identically) is now structural — the type cannot
    // express a second-class tone. What remains to guard is that the badge
    // never grows a decoration around the name.
    const { container } = render(<ToneBadge tone={{ name: 'Measured analyst' }} />)

    const badge = screen.getByText('Measured analyst')
    expect(badge).toBeInTheDocument()
    expect(container.textContent).toBe('Measured analyst')
  })
})
