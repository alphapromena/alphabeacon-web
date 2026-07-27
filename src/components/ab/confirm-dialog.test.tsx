import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { Button } from '@/components/ui/button'

// Vitest globals are off, so Testing Library's auto-cleanup never registers.
afterEach(cleanup)

const CONSEQUENCE =
  "Drafts already using it keep their copy, but you won't be able to select it for new ones."

function renderConfirmDialog(onConfirm: () => void) {
  return render(
    <ConfirmDialog
      trigger={<Button>Delete tone</Button>}
      title="Delete this tone?"
      consequence={CONSEQUENCE}
      confirmLabel="Delete tone"
      onConfirm={onConfirm}
    />,
  )
}

describe('ConfirmDialog', () => {
  it('opens from its trigger and names the consequence', async () => {
    const user = userEvent.setup()
    renderConfirmDialog(vi.fn())

    await user.click(screen.getByRole('button', { name: 'Delete tone' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this tone?' })
    expect(await within(dialog).findByText(CONSEQUENCE)).toBeInTheDocument()
  })

  it('calls onConfirm when the confirm action is chosen', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderConfirmDialog(onConfirm)

    await user.click(screen.getByRole('button', { name: 'Delete tone' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete tone' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('does not call onConfirm when cancelled', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderConfirmDialog(onConfirm)

    await user.click(screen.getByRole('button', { name: 'Delete tone' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
