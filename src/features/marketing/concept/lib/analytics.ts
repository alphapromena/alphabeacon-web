/**
 * Analytics hooks for the concept.
 *
 * No vendor is attached — this repository has no analytics provider, and the
 * brief said not to add one. Events are funnelled through a single `track`
 * call so a provider can be wired up in one place later.
 *
 * Until then events are buffered in memory (and mirrored to
 * `window.__malakyEvents` in development, which is what the QA script reads).
 */

export type ConceptEvent =
  | 'brand_demo_started'
  | 'brand_demo_analysis_completed'
  | 'brand_demo_channel_viewed'
  | 'brand_demo_approved'
  | 'brand_demo_reset'
  /* The private-demo request funnel. */
  | 'demo_request_view'
  | 'demo_request_started'
  | 'demo_request_interest_selected'
  | 'demo_request_submitted'
  | 'demo_request_success'
  | 'demo_request_error'
  /* The self-serve purchase and onboarding journey. */
  | 'get_started_view'
  | 'plan_selected'
  | 'term_selected'
  | 'managed_toggled'
  | 'checkout_view'
  | 'checkout_submitted'
  | 'checkout_error'
  | 'checkout_success'
  | 'onboarding_view'
  | 'onboarding_step_completed'
  | 'onboarding_submitted'
  | 'walkthrough_view'
  | 'walkthrough_requested'
  | 'onboarding_complete_view'

export interface TrackedEvent {
  name: ConceptEvent
  payload?: Record<string, unknown>
  at: number
}

/** Keeps the buffer from growing without bound in a long session. */
const MAX_BUFFERED = 100

const buffer: TrackedEvent[] = []

declare global {
  interface Window {
    __malakyEvents?: TrackedEvent[]
  }
}

export function track(name: ConceptEvent, payload?: Record<string, unknown>): void {
  const event: TrackedEvent = { name, payload, at: Date.now() }

  buffer.push(event)
  if (buffer.length > MAX_BUFFERED) buffer.shift()

  if (typeof window !== 'undefined') {
    // Replace this block with the provider call when one is chosen.
    window.__malakyEvents = window.__malakyEvents ?? []
    window.__malakyEvents.push(event)
    if (window.__malakyEvents.length > MAX_BUFFERED) window.__malakyEvents.shift()
  }
}

/** Everything tracked so far, oldest first. */
export function getTrackedEvents(): readonly TrackedEvent[] {
  return buffer
}
