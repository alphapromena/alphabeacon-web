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

    // Auth (A1–A4). Sign-in stays deliberately vague about which half was
    // wrong; everything else says exactly what to fix.
    nameRequired: 'Tell us your name so drafts can be attributed to you.',
    emailRequired: 'Enter your work email.',
    emailInvalid: "That doesn't look like an email address.",
    emailTaken: 'That email is already registered.',
    passwordTooShort: 'Use at least 8 characters.',
    passwordTooWeak: 'Add a number or a symbol to make this harder to guess.',
    passwordsDoNotMatch: 'Both passwords need to match.',
    orgNameRequired: 'Name your organization — you can change it later.',
    termsRequired: 'Accept the terms to create your account.',
    signInIncorrect: 'Incorrect email or password.',
    signInLockedOut: 'Too many attempts. Try again in',
    verifyLinkExpired: 'That link has expired. Send yourself a fresh one.',
    resetLinkExpired: 'That reset link has expired or has already been used.',

    // Onboarding (A5)
    offerRequired: 'Describe what you offer in one line — drafts start from this.',
    differentiatorsRequired: 'Add at least one thing that sets you apart.',
    modelRequired: 'Pick which model drafts your copy.',
    toneNameRequired: 'Name this tone so you can pick it later.',
    toneRuleRequired: 'Add at least one do or one dont so the tone means something.',
  },
  empty: {
    dashboardFresh: 'Your pipeline has not started yet — finish setup to see drafts here.',
    noDrafts: 'No drafts yet — your next slot will generate them.',
    noNotifications: "You're all caught up.",
    noConnections: 'Nothing connected yet — connect your first account to start posting.',
    noEventSources: "No event sources yet — add your country's holidays or connect a calendar.",
    noCustomTones: 'No custom tones yet — create one to match a campaign or product line.',
  },
  /** Non-error copy that must stay identical wherever it appears. */
  notices: {
    resetLinkSent:
      'If that email has an account, a reset link is on its way. Check your inbox — and your spam folder.',
    setupIncomplete: "Let's finish setting up your workspace — your pipeline hasn't started yet.",
    xComingSoon: 'X support is coming soon. Everything else is ready to connect now.',
  },
} as const

export type MessageCatalogue = typeof MESSAGES
