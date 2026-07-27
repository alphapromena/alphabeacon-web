import { cleanup, render, screen } from '@testing-library/react'
import { CheckCircle2 } from 'lucide-react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ConnectionStatusBadge,
  DraftStatusBadge,
  JobStatusBadge,
  StatusBadge,
} from '@/components/ab/status-badge'
import { DRAFT_STATUSES } from '@/lib/draft-status'

// Vitest globals are off, so Testing Library never registers its auto-cleanup
// and renders would otherwise pile up across cases.
afterEach(cleanup)

describe('StatusBadge', () => {
  it('keeps the icon and the label in one element', () => {
    render(<StatusBadge label="Approved" tone="success" icon={CheckCircle2} />)

    const badge = screen.getByText('Approved')

    expect(badge.querySelector('svg')).toBeInTheDocument()
  })

  it('hides the icon from assistive tech, because the label already says it', () => {
    render(<StatusBadge label="Approved" tone="success" icon={CheckCircle2} />)

    const icon = screen.getByText('Approved').querySelector('svg')

    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('DraftStatusBadge', () => {
  it.each(DRAFT_STATUSES)('pairs an icon with a text label for %s', (status) => {
    const { container } = render(<DraftStatusBadge status={status} />)

    const badge = screen.getByText(/\S/)

    expect(badge).toContainElement(container.querySelector('svg'))
  })

  it('says Generating… while media is in flight, rather than spinning silently', () => {
    render(<DraftStatusBadge status="media_pending" />)

    expect(screen.getByText('Generating…')).toBeInTheDocument()
  })

  it('names a failed publish in words and in the destructive tone', () => {
    render(<DraftStatusBadge status="publish_failed" />)

    const badge = screen.getByText('Publish failed')

    expect(badge).toHaveClass('bg-destructive/10', 'text-destructive')
  })
})

describe('ConnectionStatusBadge', () => {
  it('reads Needs re-auth with the warning tone, never color alone', () => {
    const { container } = render(<ConnectionStatusBadge status="needs_reauth" />)

    const badge = screen.getByText('Needs re-auth')

    expect(badge).toHaveClass('bg-warning/10', 'text-warning')
    expect(badge).toContainElement(container.querySelector('svg'))
  })
})

describe('JobStatusBadge', () => {
  it('labels a running job in words', () => {
    const { container } = render(<JobStatusBadge status="running" />)

    const badge = screen.getByText('Running')

    expect(badge).toContainElement(container.querySelector('svg'))
  })
})
