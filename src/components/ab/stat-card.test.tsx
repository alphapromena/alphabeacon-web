import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { StatCard } from '@/components/ab/stat-card'

// vitest globals are off, so RTL's auto-cleanup never registers.
afterEach(cleanup)

describe('StatCard', () => {
  it('renders its value through MonoNumber, never as raw digits', () => {
    render(<StatCard label="Credits balance" value={2500} />)

    const value = screen.getByText('2,500')

    expect(value).toHaveClass('font-mono', 'tabular-nums')
  })

  it('makes the whole card a link with an accessible name', () => {
    render(
      <MemoryRouter>
        <StatCard label="Drafts awaiting review" value={3} to="/today" />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /drafts awaiting review/i })

    expect(link).toHaveAttribute('href', '/today')
    expect(link).toHaveTextContent('3')
  })

  it('pairs a warning tone with an icon and a status word, not color alone', () => {
    const { container } = render(
      <StatCard label="Connections needing attention" value={1} tone="warning" />,
    )

    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
    expect(screen.getByText('1')).toHaveClass('text-warning')
  })

  it('shows no icon for the default tone, so the warning icon is the signal', () => {
    const { container } = render(<StatCard label="Scheduled this week" value={4} />)

    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })
})
