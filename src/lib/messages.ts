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
    // Live-mode auth (INT-1). The session message is the 401 toast; the code
    // message covers verify/reset/invite codes alike (10-minute expiry,
    // 5 attempts); rate limiting always names the wait beside it in mono.
    sessionExpired: 'Your session ended. Sign in again to continue.',
    accountDisabled: 'This account is disabled. Contact your administrator.',
    codeInvalid: 'That code is not right or has expired. Request a fresh one.',
    rateLimited: 'Too many requests. You can try again in',

    // Onboarding (A5)
    offerRequired: 'Describe what you offer in one line — drafts start from this.',
    differentiatorsRequired: 'Add at least one thing that sets you apart.',
    modelRequired: 'Pick which model drafts your copy.',
    toneNameRequired: 'Name this tone so you can pick it later.',
    toneRuleRequired: 'Add at least one do or one dont so the tone means something.',

    // On-demand generate (F1)
    promptRequired: 'Tell us what to write about.',
    generateRateLimited:
      "You've hit the generation limit for now. Your scheduled slots keep running — on-demand runs open up again tomorrow.",
    generatePaused: 'Generation is paused while your payment is unresolved.',

    // Settings (I1–I7)
    sourceUrlRequired: 'Paste the address of a feed, blog, or news page.',
    sourceUrlInvalid: 'That does not look like a web address.',
    inviteEmailTaken: 'Someone with that email is already on the team or invited.',
    lastOwner: 'You are the only owner. Make someone else an owner first.',
    teamActionFailed: 'That team change did not go through. Try again in a moment.',
    knowledgeUnreadable: 'We could not read that file. Try a text-based PDF, DOCX, TXT, or CSV.',
  },
  empty: {
    dashboardFresh: 'Your pipeline has not started yet — finish setup to see drafts here.',
    noDrafts: 'No drafts yet — your next slot will generate them.',
    noNotifications: "You're all caught up.",
    noConnections: 'Nothing connected yet — connect your first account to start posting.',
    noEventSources: "No event sources yet — add your country's holidays or connect a calendar.",
    noCustomTones: 'No custom tones yet — create one to match a campaign or product line.',
    noAnalytics:
      'No analytics yet — connect a channel and turn its analytics permission on to see reach here.',
    noPublishedPosts: 'No published posts yet in this range.',
    noBrandVoice: 'No rules yet — add one so every draft knows what you would never say.',
    noFollowedSources: 'No sources yet — add a feed so drafts have something current to work from.',
    noTopics: 'No topics yet — add a few so drafts stay on subjects you care about.',
    noKnowledge: 'No documents yet — upload your price list, FAQs, or product notes.',
    noInvites: 'Invite your team to collaborate.',
  },
  /** Non-error copy that must stay identical wherever it appears. */
  notices: {
    resetLinkSent:
      'If that email has an account, a reset link is on its way. Check your inbox — and your spam folder.',
    setupIncomplete: "Let's finish setting up your workspace — your pipeline hasn't started yet.",
    xComingSoon: 'X support is coming soon. Everything else is ready to connect now.',
    /** G1/G2 — an absent number is never drawn as a zero. */
    syncPending: 'Sync pending — this channel has not reported numbers for this range yet.',
    limitedAnalytics:
      'This platform only reports follower counts for accounts like yours, so reach and engagement are not available here. That is a limit of the platform, not a gap in your posting.',
    /** I2 — the cross-note tones and brand voice both carry. */
    brandVoiceUnderTones:
      'Brand voice always applies underneath whatever tone is selected — tones vary the style, these rules never bend.',
    /** INT-3 — fields the API does not store yet render disabled, not silent. */
    brandFieldsPending:
      "Don't-rules, examples, and per-tone writing rules arrive with a later backend phase — what you see here is exactly what is stored today.",
    // N4. Both are non-blocking and clear themselves.
    offline: "You're offline — changes will sync when you reconnect.",
    degraded: "We're having trouble reaching Malaky — retrying…",
  },
} as const

export type MessageCatalogue = typeof MESSAGES
