import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from '@/components/ab/error-state'
import { MESSAGES } from '@/lib/messages'

describe('ErrorState', () => {
  it('announces the failure and says how to fix it', () => {
    render(<ErrorState message={MESSAGES.errors.screenLoadFailed} />)

    const alert = screen.getByRole('alert')

    expect(alert).toHaveTextContent('Something went wrong')
    expect(alert).toHaveTextContent(MESSAGES.errors.screenLoadFailed)
  })

  it('pairs the destructive color with an icon and words, never color alone', () => {
    render(<ErrorState title="Publishing failed" message={MESSAGES.errors.generic} />)

    const alert = screen.getByRole('alert')
    const icon = alert.querySelector('svg')

    expect(icon).not.toBeNull()
    // Decorative: the written title carries the meaning for assistive tech.
    expect(icon).toHaveAttribute('aria-hidden')
    expect(alert).toHaveTextContent('Publishing failed')
  })

  it('offers no retry when the caller cannot retry', () => {
    render(<ErrorState message={MESSAGES.errors.generic} />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('runs the caller retry when the retry button is pressed', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState message={MESSAGES.errors.screenLoadFailed} onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('uses the caller retry label when one is given', () => {
    const message = MESSAGES.errors.generic

    render(<ErrorState message={message} onRetry={() => {}} retryLabel="Reload drafts" />)

    expect(screen.getByRole('button', { name: 'Reload drafts' })).toBeInTheDocument()
  })
})
