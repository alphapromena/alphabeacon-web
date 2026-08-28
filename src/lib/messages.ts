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

    /**
     * Finishing onboarding (E2E-0820 F12). Two outcomes, and they are not the
     * same fact: either the workspace could not be created at all, or it was
     * created and part of what the wizard collected did not save. The second
     * one used to report success, which is how an org reached the product
     * with tones but no schedule and no country.
     */
    /**
     * Creating the workspace (ORDER ONB-0827, D-ONB-C). One outcome now, not
     * two: the org either exists or it does not. `onboardingIncomplete` — "the
     * workspace is ready but part of the setup did not save" — described a
     * Finish that pushed four things at once and could half-land. It pushes
     * one thing, so there is no half.
     */
    workspaceCreateFailed: 'We could not create your workspace. Nothing was saved — try again.',

    // Early access (M-series request form).
    requestCompanyRequired: 'Tell us your company so we know who the workspace is for.',
    requestCountryRequired: 'Tell us where you operate — Malaky prepares around your calendar.',
    requestRoleRequired: 'Pick the role closest to yours.',
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

    // What the onboarding wizard used to validate. A5 is deleted (ORDER
    // ONB-0827) and these moved with their fields: the offer line to I1, the
    // model to C1. `differentiatorsRequired` went with the wizard — no screen
    // renders it, and an unreachable catalogue entry is what the W7
    // completeness test exists to catch.
    offerRequired: 'Describe what you offer in one line — drafts start from this.',
    modelRequired: 'Pick which model drafts your copy.',
    toneNameRequired: 'Name this tone so you can pick it later.',
    toneRuleRequired: 'Add at least one do or one dont so the tone means something.',

    // On-demand generate (F1)
    promptRequired: 'Tell us what to write about.',
    generateRateLimited:
      "You've hit the generation limit for now. Your scheduled slots keep running — on-demand runs open up again tomorrow.",
    generatePaused: 'Generation is paused while your payment is unresolved.',
    /**
     * The server refused a run the client thought was ready (ORDER
     * ONB-0827). The gate is UX, not security: this is what honesty
     * looks like when the two disagree, and it is always shown with the
     * request reference beside it.
     */
    generationRefused:
      'The platform refused this run. Check your brand setup is complete, then try again.',

    // Settings (I1–I7)
    sourceUrlRequired: 'Paste the address of a feed, blog, or news page.',
    sourceUrlInvalid: 'That does not look like a web address.',
    inviteEmailTaken: 'Someone with that email is already on the team or invited.',
    lastOwner: 'You are the only owner. Make someone else an owner first.',
    teamActionFailed: 'That team change did not go through. Try again in a moment.',
    knowledgeUnreadable: 'We could not read that file. Try a text-based PDF, DOCX, TXT, or CSV.',

    // I4's live preview (INT-7). Three outcomes worth telling apart: the org
    // has nothing to ground on yet, the platform is busy, and everything else.
    previewNeedsBrandVoice:
      'Save your brand voice first — a preview is written against it, so there is nothing to ground on yet.',
    previewRateLimited: 'Too many previews just now. Try again in about a minute.',
    previewFailed: "We couldn't write a preview just now. Your tone is unchanged — try again.",

    // Org country (INT-8). The lookup is external, so a refusal is about the
    // value, not about the network.
    countryInvalid: 'Pick a country from the list — holidays are only available for these.',

    // On-demand generation, live mode (INT-10).
    /** Refused client-side: the upstream refuses an over-budget fan-out too. */
    fanoutTooLarge: 'That is more than 6 drafts. Pick fewer tones, or one draft per tone.',
    runFailed: 'That run did not finish. Nothing was charged for a failed run — try again.',
    runMissing: 'That run is no longer available, so it has been removed from your recent runs.',

    // The proposals ledger (INT-12).
    /** 409 on approve: the id is taken, so the record is already elsewhere. */
    approveConflict:
      'This was already recorded under a different id. Refresh to see where it went — nothing was changed.',
    /** 404: the proposal is gone from the ledger. */
    proposalGone: 'That draft is no longer in your queue. Refresh to see what is.',
    decisionFailed: 'That decision did not go through. Nothing changed — try again.',

    // Generation, live mode (INT-6 — the two codes the 2026-08-17 contract
    // added). Both are states a screen renders, not toasts to shrug at.
    /** 402 wallet_insufficient. There is no self-serve top-up on this API. */
    walletInsufficient:
      "Your balance can't cover this generation. There's no self-serve top-up yet — contact support and we'll add funds.",
    /** 502 bad_gateway. The contract guarantees nothing changed — say so. */
    upstreamUnavailable:
      'The generation service is unavailable right now. Nothing was changed or charged — try again in a moment.',
  },
  empty: {
    dashboardFresh: 'Your pipeline has not started yet — finish setup to see drafts here.',
    noDrafts: 'No drafts yet — your next slot will generate them.',
    noNotifications: "You're all caught up.",
    noConnections: 'Nothing connected yet — connect your first account to start posting.',
    noEventSources: "No event sources yet — add your country's holidays or connect a calendar.",
    noCustomTones: 'No custom tones yet — create one to match a campaign or product line.',
    /**
     * A workspace with NO tones at all (ORDER ONB-0827): live orgs are no
     * longer seeded with presets, so this is the first thing a new owner
     * sees on I3. It names the consequence, because a tone is the one
     * brand entity whose absence stops generation dead.
     */
    noTones:
      'No tones yet — create your first one. Nothing generates until this workspace has at least one tone.',
    noAnalytics:
      'No analytics yet — connect a channel and turn its analytics permission on to see reach here.',
    noPublishedPosts: 'No published posts yet in this range.',
    noBrandVoice: 'No rules yet — add one so every draft knows what you would never say.',
    noFollowedSources: 'No sources yet — add a feed so drafts have something current to work from.',
    noTopics: 'No topics yet — add a few so drafts stay on subjects you care about.',
    noKnowledge: 'No documents yet — upload your price list, FAQs, or product notes.',
    noCapabilities: 'Nothing in the studio is available to this workspace yet.',
    noJobs: 'Nothing rendered yet — create something and it shows up here.',
    noReview: 'Nothing waiting for review — generate posts to start.',
    noApproved: 'Nothing approved yet.',
    noDeclined: 'Nothing declined yet.',
    noInvites: 'Invite your team to collaborate.',
    noCountry: 'No country set yet — your calendar has no public holidays in it.',
    noHolidays: 'No public holidays left this year for this country.',
  },
  /** Non-error copy that must stay identical wherever it appears. */
  notices: {
    resetLinkSent:
      'If that email has an account, a reset link is on its way. Check your inbox — and your spam folder.',
    /**
     * N3 (ORDER ONB-0827, D-ONB-C). This used to say "let's finish setting up
     * your workspace" and pointed at the wizard. There is no wizard and
     * nothing to finish: the account is verified and the ONE thing missing is
     * the workspace record itself, which the screen offers to create again.
     */
    workspaceMissing:
      'Your account is ready, but your workspace was never created. One press finishes it.',
    /** The same surface when the name it needs could not be recovered. */
    workspaceNeedsName: 'Name your workspace and we will finish setting it up.',
    xComingSoon: 'X support is coming soon. Everything else is ready to connect now.',
    /** G1/G2 — an absent number is never drawn as a zero. */
    syncPending: 'Sync pending — this channel has not reported numbers for this range yet.',
    /**
     * The readiness gate (ORDER ONB-0827, D-ONB-D). Three strings, three
     * different jobs: the checklist's own subtitle, what a BLOCKED generation
     * entry point says, and the reassurance that the checklist is not a
     * wizard — nothing here has to be done in order or in one sitting.
     */
    setupChecklist:
      'Finish these and this workspace can write. Each one has its own screen — do them in any order.',
    generationBlocked:
      'Generation is off until your brand setup is complete — drafts would have nothing to sound like.',
    setupComplete: 'Setup is complete. Everything below is optional polish.',
    limitedAnalytics:
      'This platform only reports follower counts for accounts like yours, so reach and engagement are not available here. That is a limit of the platform, not a gap in your posting.',
    /** I2 — the cross-note tones and brand voice both carry. */
    brandVoiceUnderTones:
      'Brand voice always applies underneath whatever tone is selected — tones vary the style, these rules never bend.',
    /**
     * INT-7 — the note NARROWED. Rules landed on the wire in the 2026-08-17
     * contract, so do/don't editors are real in live mode; only the example
     * line still has nowhere to be stored between runs (open-items 7).
     */
    brandExamplesPending:
      'Example lines arrive with a later backend phase — everything else on this screen is saved exactly as you write it.',
    /** I2/I5 — why a save here matters, said where the saving happens. */
    reachesNextGeneration: 'Saved changes reach the next generation automatically.',
    // Org country (INT-8) — the single holiday control in live mode.
    countryLoadsHolidays:
      "Setting this loads that country's public holidays into your calendar, and drafts start working around them.",
    countryLoading: 'Loading your calendar…',
    countryUnchanged: 'Already set to that country — nothing was reloaded.',
    countryAdminOnly: 'Only an admin or owner can change this.',
    /**
     * INT-9 — an all-zero wallet is funding that has not landed yet, not an
     * empty one, and not an error. Orgs are funded server-side at creation.
     *
     * E2E-0820 F9: this claim is only true of a wallet the API actually
     * answered with. It may NOT stand in for "not read yet" — the two below
     * carry those states, because a balance nobody has read is not a balance
     * that is missing.
     */
    balanceUnavailable: 'Balance unavailable — funding pending',
    /** The read is in flight. Neutral by design: nothing is known yet. */
    balanceLoading: 'Loading balance…',
    /** The sync finished and brought no wallet back — a failure, not a state. */
    balanceUnread: 'Balance could not be read',
    /** There is no self-serve top-up endpoint on this API, so say so once. */
    noSelfServeTopUp:
      "There's no self-serve top-up yet — contact support and we'll add funds to your workspace.",
    /**
     * E2E-0820 F4 — the product says MONEY, never "credits" (D-INT-E). The
     * plan's grant is a credit count with no honest exchange rate into
     * currency, so the allowance is named rather than numbered; each plan's
     * `entitlements.features` is what actually differentiates the cards.
     */
    planAllowance: 'Includes a monthly generation allowance',
    /** H1/H2/H4 in live mode: plans are not on the wire. */
    billingStatic:
      'Plans and checkout are not connected yet. Your workspace runs on its balance, and this page is a preview of what is coming.',
    /** C2 in live mode: there is nothing to add here any more, and why. */
    eventSourcesSuperseded:
      'Your country is the event source now — public holidays load automatically and scheduling works around them. Calendars you keep yourself will connect here in a later phase.',
    // On-demand generation, live mode (INT-10).
    occasionOutranks: "The day's own guidance outranks your tone and brand rules for that post.",
    generateNotesPending:
      'Steering notes are not on the wire yet — for now drafts follow your tones, brand voice, sources and knowledge.',
    generateWorking: 'Writing your drafts…',
    generateStillWorking:
      'Still working. It keeps running even if you leave — check Waiting for review in a minute.',
    /**
     * E2E-0820 F10 — this used to promise approving "when the drafts backend
     * does". INT-12 shipped it: approve and decline are live on Today, off the
     * proposals ledger, so the honest line points there instead of forward.
     */
    draftsReadOnly: 'These are read-only here. Approve or decline them in the review queue.',
    /** INT-12: this is the shared ledger now, not a per-browser cache. */
    recentRunsFromLedger:
      'Everything still waiting on your review, including drafts written while you were away.',
    visualComingNext: 'Visuals for a draft arrive with the Studio integration.',

    // Today, live mode (INT-12).
    /** The whole truth about what Approve does today (D-INT-K). */
    approveRecordsAsPosted:
      'Malaky records this as posted and stops suggesting anything like it. Copy the text to publish it yourself — connecting your channels arrives in a later phase.',
    approveConfirm:
      'This adds a permanent record that the post went out. You can still decline it later, but the record stays.',
    declineTeaches:
      'Why not? Malaky is shown your declines before it writes again, so a reason turns "avoid this" into "avoid this, because".',
    recordedAsPosted: 'Recorded as posted',
    /** D-INT-L: editing needs a drafts store that does not exist yet. */
    editComingWithScheduling:
      'Editing a draft arrives with scheduling — for now, copy the text and adjust it wherever you post.',
    /** D5/B1-B3 stay static in live mode. */
    publishingComingSoon:
      'Publishing and channel connections are not wired up yet. Approving records the post; copying it is how it goes out.',
    // Studio, live mode (INT-11).
    chargedToBalance: 'charged to your balance',
    capabilityComingSoon: 'Available to your workspace — the form for it arrives in a later phase.',
    knowledgeUploadBlocked:
      'Uploading a file from the browser is not available yet. Paste the text or add a link instead.',
    knowledgeAccepts: 'PDF, Word, plain text or Markdown.',
    /** C4 — what the day's rules actually are. */
    holidayGuidance: 'How Malaky will treat this day',
    holidayGenericRule: 'General guidance for this day.',
    // N4. Both are non-blocking and clear themselves.
    offline: "You're offline — changes will sync when you reconnect.",
    degraded: "We're having trouble reaching Malaky — retrying…",
  },
} as const

export type MessageCatalogue = typeof MESSAGES
