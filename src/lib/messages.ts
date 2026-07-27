/**
 * Every designed error and empty-state string, in one catalogue.
 *
 * Features never inline error/empty copy — they reference an entry here, so
 * the W7 completeness test can prove every message is reachable and no screen
 * renders an unlisted string. One of the three integration reconciliation
 * points (web-plan.md §13). Voice rules (design law): errors say what happened
 * and how to fix it; empty states invite action; sentence case.
 */
export const MESSAGES = {
  errors: {
    generic: 'Something went wrong on our side. Try again — your work is safe.',
    screenLoadFailed: "We couldn't load this screen. Try again in a moment.",
    postsPerDayCap: 'You can schedule at most 3 posts a day.',
    activeDaysRequired: 'Pick at least one day to generate on.',
    toneRequired: 'Pick at least one tone so drafts know how to sound.',
    timezoneRequired: 'Pick a timezone so posts go out at the right local time.',
  },
  empty: {
    dashboardFresh: 'Your pipeline has not started yet — finish setup to see drafts here.',
    noDrafts: 'No drafts yet — your next slot will generate them.',
    noNotifications: "You're all caught up.",
    noConnections: 'Nothing connected yet — connect your first account to start posting.',
  },
} as const

export type MessageCatalogue = typeof MESSAGES
