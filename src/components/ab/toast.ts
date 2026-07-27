/**
 * The toast vocabulary — three verbs, and no fourth.
 *
 * Every async confirmation in this product speaks through these, so the voice
 * stays consistent (sentence case, active, concrete) and `lib/messages.ts`
 * stays the single source of error copy: features pass a catalogue entry in,
 * they never inline a string at the call site. Wrapping sonner also means the
 * icon set lives once in `ui/sonner.tsx`, keeping every toast icon + text
 * rather than color alone.
 *
 * `toastError` takes `retry` instead of sonner's generic `action` because the
 * design law says an error states how to fix it — the only action an error
 * toast offers is the way out of it.
 */
import { toast } from 'sonner'

export function toastSuccess(message: string, options?: { description?: string }): void {
  toast.success(message, { description: options?.description })
}

export function toastError(
  message: string,
  options?: {
    description?: string
    /** The way out of the failure — rendered as the toast's action button. */
    retry?: { label: string; onClick: () => void }
  },
): void {
  const retry = options?.retry
  toast.error(message, {
    description: options?.description,
    action: retry ? { label: retry.label, onClick: retry.onClick } : undefined,
  })
}

export function toastInfo(message: string, options?: { description?: string }): void {
  toast.info(message, { description: options?.description })
}
