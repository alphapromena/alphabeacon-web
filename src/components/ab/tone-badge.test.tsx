import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ToneBadge } from '@/components/ab/tone-badge'

// vitest globals are off, so RTL's auto-cleanup never registers.
afterEach(cleanup)

describe('ToneBadge', () => {
  it('renders the tone name', () => {
    render(<ToneBadge tone={{ name: 'Measured analyst', kind: 'preset' }} />)

    expect(screen.getByText('Measured analyst')).toBeInTheDocument()
  })

  it('renders a custom tone identically to a preset — no second-class treatment', () => {
    const preset = render(<ToneBadge tone={{ name: 'Measured analyst', kind: 'preset' }} />)
    const custom = render(<ToneBadge tone={{ name: 'Measured analyst', kind: 'custom' }} />)

    const presetBadge = within(preset.container).getByText('Measured analyst')
    const customBadge = within(custom.container).getByText('Measured analyst')

    expect(customBadge.className).toBe(presetBadge.className)
    expect(customBadge.textContent).toBe(presetBadge.textContent)
    // Catches a stray dot, suffix, or wrapper that only a custom tone would get.
    expect(customBadge.outerHTML).toBe(presetBadge.outerHTML)
  })
})
