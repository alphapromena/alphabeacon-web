/**
 * Marketing-funnel event hooks (Phase 2 §23). Privacy-conscious and
 * vendor-free by design: no vendor has been approved, and the network law
 * (decisions.md 2026-07-30) bans requests outside src/api — so `track`
 * SENDS NOTHING. It buffers events on `window.__malakyEvents` and pushes
 * to `window.dataLayer` when a tag manager is present, which is exactly
 * the seam a future approved vendor plugs into without touching call
 * sites. Events carry a name and a small flat payload only — no
 * identifiers, no fingerprinting.
 */

export type MarketingEvent =
  | 'hero_view'
  | 'hero_story_progress'
  | 'workspace_interaction'
  | 'workspace_approve_demo'
  | 'calendar_demo_view'
  | 'channel_demo_view'
  | 'executive_linkedin_view'
  | 'arabic_section_view'
  | 'memory_demo_view'
  | 'how_it_works_view'
  | 'faq_open'
  | 'request_access_click'
  | 'request_access_submitted'

interface EventRecord {
  event: MarketingEvent
  props?: Record<string, string | number | boolean>
  t: number
}

declare global {
  interface Window {
    __malakyEvents?: EventRecord[]
    dataLayer?: unknown[]
  }
}

const seen = new Set<string>()

export function track(
  event: MarketingEvent,
  props?: Record<string, string | number | boolean>,
  options?: { once?: boolean },
): void {
  if (typeof window === 'undefined') return
  if (options?.once) {
    const key = event + JSON.stringify(props ?? {})
    if (seen.has(key)) return
    seen.add(key)
  }
  const record: EventRecord = { event, props, t: Date.now() }
  ;(window.__malakyEvents ??= []).push(record)
  window.dataLayer?.push({ event: `malaky_${event}`, ...props })
  if (import.meta.env.DEV) console.debug('[malaky-event]', event, props ?? '')
}
