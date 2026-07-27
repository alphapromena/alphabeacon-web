# AlphaBeacon v4 — Screen-by-Screen Mockup Brief

**Purpose of this document:** a complete, self-contained inventory of every screen in the v4 product, written so it can be handed to a mockup tool, a designer, or a stakeholder review — screen by screen, with exactly what each one contains and how it behaves. Pairs with `design.md` (the v3 visual system — still the system of record for colors, type, motion, voice) and `design4.md` (the architecture behind these screens). This document adds nothing to the visual language; it inventories where that language gets applied, and — new in this revision — spells out the actual user journey end to end: **land on the marketing site → sign up → connect socials + company info → connect calendar → start the pipeline (days, volume, generation model, tones) → land on a real Dashboard → review, approve, create in Studio, publish → watch it work in Calendar and Analytics.**

**How to use it:** each screen entry is self-contained. A mockup tool (or a human designer) should be able to produce a static or interactive mockup from that entry alone, referring to Part 0.2 for shared visual tokens. Review screen by screen, in the suggested order in Part 12, or in whatever order the stakeholder wants.

---

## Part 0 — Before mocking anything

### 0.1 Product in one paragraph

AlphaBeacon is a subscription SaaS for marketing teams. A visitor lands on the public site, sees what it does and what it costs, and signs up. After signup, they connect their social accounts and tell the product about their company, connect a calendar (their own + their country's events), and **start their pipeline**: which days to generate on, how many posts a day, which AI model drafts the copy, and which tones to write in — presets or their own custom ones. From there the **Dashboard** is home base — everything else is one click away, and nothing needing attention goes unnoticed. Drafts show up for **review and approval**; once approved, **Creative Studio** — the product's always-on creative hub — turns that draft into an image or video (and doubles as a free-standing tool for any other creative asset the company needs). Approved, media-ready posts get scheduled and published across every connected channel, and the **Calendar** shows not just what's scheduled but how it performed once it's live.

### 0.2 Visual system quick reference

*(Full source of truth: `design.md` Part 1. This is a cheat-sheet so a mockup tool doesn't need both documents open.)*

| | |
|---|---|
| **Fonts** | Display/headings: **Space Grotesk** (500/600/700). Body/UI: **Geist Sans** (400/500/600). Data/mono: **Geist Mono** — always for numbers, stats, credit counts, timestamps, IDs, source URLs. |
| **Type scale** | display 48 · h1 38 · h2 30 · h3 24 · h4 20 · body-lg 18 · body 16 · body-sm 14 · caption 12 (uppercase, tracked, for eyebrows) · mono 13–16. |
| **Spacing** | Token scale 2/4/6/8/12/16/20/24/32/40/48/64/80px. Never raw px in a mockup — snap to this scale. |
| **Radius** | sm 8 · md 12 · lg 16 · xl 22 · pill 999. Soft-modern, never zero-radius. |
| **Elevation** | 3 shadow levels + a signature `--glow-signal` (soft primary-tinted glow) used only for the beacon/live states and generation-in-progress. |
| **Layout shell** | 256px left rail (collapses to 72px icon rail < 1024px, drawer < 768px) + top bar + main content, max width ~1200px. **The marketing site (Area M) does not use this shell** — it's a full-width public layout of its own (see M1). |
| **Signature motion** | **Signal sweep** — a thin gradient line sweeping a card's top edge when generation starts. **Beacon pulse** — the live-status dot pulses only while something needs attention. Both fully removed under reduced-motion. |
| **The signature component** | **ClaimChip** — a mono-figure data chip (source + verified/flagged state + count-up number) used anywhere the product cites a fact, and reused as the general "stat card" pattern on the Dashboard and Analytics. |
| **Voice** | Active voice, action names persist through their own flow (Approve → Approved; Generate → Generating… → Ready; Publish → Published). Errors say what happened and how to fix it. Empty states invite action. Sentence case. Calm confidence, no hype. |
| **Themes** | Light + dark, both first-class — every authenticated screen below should be considered for both. The marketing site (M1) is light-only by default (public sites rarely need dark mode, but note it if brand guidelines require it). |
| **Breakpoints** | Mobile-first: 360 (mobile) / 768 (tablet) / 1280 (desktop) are the three mockup frames to produce per screen, minimum. |

### 0.3 The four data states — apply to every screen with server data

Every screen that reads data must be mocked in all that apply: **loading** (skeletons, never spinners-only), **empty** (an invitation to act, never a bare "no data"), **error** (what happened + how to fix it, never a raw error string), **populated** (the real content). Screen entries below call out which states matter most; assume all four unless noted.

### 0.4 Global chrome — present on every *authenticated* screen (not on Area M)

- **Left rail (256px, collapsing):** logo mark top; nav items with icon + label, in this order — **Dashboard**, **Today** (queue), **Calendar**, **Studio**, **Analytics**, **Connections**, **Billing**, **Settings**; the **beacon live-status** dot near *Today* (pulses when drafts await review); org switcher at the bottom if the account belongs to multiple orgs; collapse toggle.
- **Top bar:** current screen's `h1`/title + a one-line context (e.g. "5 drafts ready · generated 6:02 AM"); global search (optional, later phase); notification bell (quick-glance dropdown — full history lives on the Dashboard, see D1); theme toggle; account menu (profile, org settings, sign out).
- **Toast host:** bottom-right, polite live region, used for every async confirmation.
- **Command surfaces:** dialogs/sheets (Radix-based) for anything that shouldn't leave the current screen — media generation, schedule/publish, tone creation, connection permission edit.
- **Plan/credit indicator:** small persistent chip in the top bar (or rail footer) showing current plan name + credit balance — always visible, since credits gate the Studio.

### 0.5 Complete screen inventory (40 screens across 11 areas)

| Area | Screens | Notes |
|---|---|---|
| **M — Marketing (public)** | Home / Landing | New — the pre-signup front door: product, features, pricing |
| **A — Auth & Onboarding** | Sign up · Sign in · Verify email · Reset password · Onboarding wizard (5 steps) | Wizard expanded: now includes connecting a calendar and starting the pipeline |
| **B — Connections** | Connections hub · Permission sheet · OAuth return states | Unchanged from prior revision |
| **C — Calendar & Scheduling** | Schedule config · Event sources · Calendar view · Slot detail | Schedule config gains generation-model + tone fields; Calendar view gains performance data |
| **D — Dashboard & Review Queue** | **Dashboard (new home)** · Today (queue) · Draft detail · Media generation panel · Schedule/publish dialog | Dashboard is new — the "all pages + notifications" hub |
| **E — Creative Studio** | Model gallery · Composer · Job list · Asset detail | Reframed as the company's general creative hub, used both standalone and draft-scoped |
| **F — On-demand Generate** | Generate (streaming) | Unchanged |
| **G — Analytics** | Overview dashboard · Channel detail | Unchanged, now cross-linked from Calendar |
| **H — Billing** | Plans · Subscription management · Credits history · Checkout return | Unchanged |
| **I — Settings** | Org profile · Brand voice · **Tones library (new)** · **Create/edit custom tone (new)** · Followed sources & topics · Knowledge docs · Team members | Two new tone-management screens |
| **J — System & notifications** | Notification panel (dropdown) · 404 · Empty-org first-run · Offline banner | Notification panel is now explicitly the "quick glance"; Dashboard is the full view |

---
## Part 1 — Area M: Marketing (public)

### M1 — Home / Landing · `/` (public, unauthenticated)
**Purpose:** the front door for anyone who isn't signed in yet — explains the product, shows pricing, and converts to signup. This is the literal starting point of the whole journey.
**Layout:** full-width public marketing layout (not the app shell — no left rail). Sticky top nav; stacked full-bleed sections below; footer.
**Contains:**
- **Top nav:** logo · links (Features, How it works, Pricing, FAQ) · "Sign in" (text link) · primary "Start free" button.
- **Hero section:** headline (e.g. "Your marketing team's AI co-pilot") · one-line subheadline explaining the loop (connect → draft → approve → create → publish) · primary CTA "Start free" + secondary "See pricing" (anchor-scrolls down) · a hero visual — a styled mockup of the review queue or calendar in a browser-chrome frame.
- **Social proof strip:** logo row or a stat callout (placeholder-ready — "Trusted by marketing teams at…").
- **Features section:** 4 feature blocks (icon + heading + 1–2 line copy), mapped to the product's real pillars: *"Connect once, post everywhere"* (socials), *"Drafts that sound like you"* (brand voice + event-aware calendar), *"A creative studio for everything"* (Studio), *"See what's working"* (analytics).
- **How it works:** a 4-step numbered visual walkthrough mirroring the actual onboarding flow — Connect your accounts → Tell us about your brand → Set your posting rhythm → Review and publish.
- **Pricing section:** plan cards (same data as H1, marketing-toned copy), each with a "Get started" CTA → A1, and a note "Cancel anytime, no long-term contracts."
- **FAQ:** accordion — data privacy, which platforms are supported, how the credit system works, cancellation.
- **Final CTA band:** "Start free today" + button.
- **Footer:** column links (Product, Pricing, Legal, Contact), social icons, copyright line.
**States:** the page is mostly static; the pricing section fetches live plan data — **loading** (skeleton cards), **error** (falls back to the last-known/static pricing copy rather than showing a broken section — pricing must never look broken to a prospect).
**Primary actions:** "Start free" / "Get started" (any instance) → A1 (Sign up). "Sign in" → A2.

---

## Part 2 — Area A: Auth & Onboarding

### A1 — Sign up · `/signup`
**Purpose:** create an account and organization in one step.
**Layout:** centered card (max 440px) on a subtly branded split background (signal-gradient panel on desktop ≥1024px; form-only on mobile).
**Contains:** logo mark · `h1` "Create your account" · fields: full name, work email, password (strength meter, live checklist) · organization name · terms/privacy checkbox · primary "Create account" · divider "or" · secondary "Continue with Google" (if in scope) · footer link "Already have an account? Sign in."
**States:** default → inline field errors → submitting → error (e.g. "That email is already registered," with a sign-in link) → success (→ A3).
**Primary action:** Create account → Verify email.

### A2 — Sign in · `/login`
**Purpose:** returning-user authentication.
**Contains:** logo · `h1` "Welcome back" · email + password · "Forgot password?" link · primary "Sign in" · divider + social option (if in scope) · footer link "New here? Create an account."
**States:** default → validating → error (generic "Incorrect email or password"; a distinct **locked-out** state with a countdown after repeated failures) → success (→ D1 Dashboard).
**Primary action:** Sign in → Dashboard.

### A3 — Verify email · `/verify-email`
**Contains:** icon · `h2` "Check your inbox" · the submitted email (editable, links back to A1) · "Resend email" with a cooldown timer (mono countdown) · auto-advancing success state once the emailed link is opened.
**States:** pending, resent-confirmation toast, expired-link error (with fresh resend), verified (→ A5).

### A4 — Reset password · `/reset-password` (request + confirm)
**Contains (request):** email field, "Send reset link," a no-enumeration success state regardless of whether the email exists.
**Contains (confirm):** new password + confirm fields (same strength meter as A1), "Reset password."
**States:** pending, error, success; confirm sub-screen additionally needs an expired/invalid-token error with a "request a new link" action.

### A5 — Onboarding wizard · `/onboarding` (5 steps, one screen, progressive)
**Purpose:** the guided path from a bare account to a **running pipeline** — this is the real sequence the product depends on: brand → accounts → calendar → pipeline configuration → done. Every step remains independently reachable later (Settings, Connections, Calendar) for edits.
**Layout:** centered card ~640px, a step indicator ("Step 3 of 5") pinned above, "Skip for now" available on steps 2–4 (not step 1, not step 4 — starting the pipeline is the point of onboarding, so it isn't skippable without an explicit "I'll set this up later" secondary link that exits to the Dashboard in an unconfigured state, per N3).

- **Step 1 — Brand basics:** company name (pre-filled), one-line offer, 3–5 differentiators (tag input), logo upload (drag-and-drop + crop).
- **Step 2 — Connect your accounts:** condensed Connections hub (see B1) — one card per platform, "Connect" buttons, X shown as "Coming soon" (disabled, tooltipped). Skippable.
- **Step 3 — Connect your calendar:** condensed Event sources (see C2) — connect Google Calendar and/or pick a country holiday feed, with a one-line explainer ("So we can plan posts around what matters to your audience — launches, holidays, local events"). Skippable.
- **Step 4 — Start your pipeline:** the core configuration step —
  - **Active days:** day-of-week pill selector.
  - **Posts per day:** stepper, hard-capped at 3, cap visible in the UI.
  - **Generation model:** a small card/radio list choosing which AI model drafts the copy — friendly names, not vendor names (e.g. "Balanced," "Creative," "Precise"), each with a one-line description of its style/speed trade-off and a plan-tier note where relevant.
  - **Tones:** multi-select chips showing **preset tones** (provocative, data-driven, educational, story, direct-CTA) **and any custom tones already created**, plus an inline **"+ Create custom tone"** action that opens I4 as an overlay — saving there returns to this step with the new tone auto-selected and the wizard's progress untouched.
  - A live summary sentence updating as fields change (mono numbers): *"Up to **6** drafts a week, in **3** tones, drafted by **Balanced**."*
  - Primary action: **"Start pipeline"** — this literally activates scheduling for the org, not a soft "save."
- **Step 5 — Ready:** success state (beacon animation), a summary of everything just configured, primary CTA **"Go to your dashboard."**

**States:** each step: default, validating, submitting, error (inline); step transitions animate per the motion system; the tone-creation sub-flow is a nested overlay state; a returning user resumes at the correct step (persisted).
**Primary action per step:** Continue → (step 4) Start pipeline → (step 5) Go to your dashboard.

---
## Part 3 — Area B: Connections (Social Hub)

### B1 — Connections hub · `/connections`
**Purpose:** the single place to see and manage every connected social account.
**Layout:** page header ("Connections", one-line explainer) + a responsive grid of platform cards (2 columns desktop, 1 mobile).
**Contains, per platform card:** platform icon + name (Facebook Page, Instagram, LinkedIn, X) · connection status badge (Not connected / Active / Needs re-auth / Revoked — icon **and** text, never color-only) · if connected: account name/handle + avatar, "connected since" date (mono) · two permission toggles: **Analytics** and **Posting** (each with a one-line description of what it unlocks) · primary action button that changes by state: "Connect" / "Manage" / "Reconnect" · overflow menu (⋯) with "Disconnect."
**Special card — X:** always shown, permanently "Coming soon" (reduced opacity, badge), Connect disabled with a tooltip.
**Special card — Facebook multi-page:** connecting opens a page picker sub-state (checklist of Pages with avatars, multi-select, "Connect selected").
**States:** empty (no connections yet) · loading (skeleton cards) · error (a card's sync failed — inline retry) · populated.
**Primary action:** Connect → OAuth redirect (external) → return to B3.

### B2 — Connection permission sheet (slide-over from B1)
**Purpose:** edit what a connected account is allowed to do, without leaving the hub.
**Layout:** right-side sheet, ~420px.
**Contains:** platform + account header (avatar, name, handle) · full permission toggles with longer explanatory text · granted scopes list (mono, collapsible) · last analytics sync timestamp · "Disconnect this account" (danger, confirm dialog) · close.
**States:** default, saving (optimistic toggle with rollback on failure), disconnect-confirm.

### B3 — OAuth return states (full-page, transient)
**Contains:** centered spinner/beacon-pulse + "Connecting your [Platform] account…" — then success toast + redirect to B1 (new card highlighted), or an error screen if consent was denied or the exchange failed.
**States:** connecting · success (transient) · denied-by-user · exchange-failed.

---

## Part 4 — Area C: Calendar & Scheduling

### C1 — Schedule configuration · `/calendar/settings`
**Purpose:** the durable, editable home for everything set up in onboarding Step 4 — days, volume, generation model, tones — plus event-awareness.
**Layout:** single-column form, max ~680px, grouped into labeled sections.
**Contains:**
- **When:** timezone select (searchable) · active-days pill selector · "generate at" time picker.
- **How much & how:** posts-per-day stepper (capped at 3, cap visible) · **generation model** selector — the same friendly-named card/radio list from onboarding Step 4, editable any time.
- **Tones:** multi-select chips of preset + custom tones, with the same inline **"+ Create custom tone"** action opening I4 and returning here with the new tone selected · a small "Manage tones →" link to I3 for editing/deleting existing custom ones.
- **Events:** "Attach to events" toggle · when on, a summary of connected event sources with a link to C2 ("Manage sources →").
- Live summary sentence (mono numbers), same pattern as onboarding.
- Sticky save bar: Save / Cancel, dirty-state guard.
**States:** loading (skeleton form) · default · validating (mirrors the shared Zod schema, so errors match the API 1:1) · saving · saved (toast) · error.

### C2 — Event sources · `/calendar/sources`
**Purpose:** manage what feeds event-aware scheduling — country holidays + the user's Google Calendar. (This is the same screen, condensed, that appears as onboarding Step 3.)
**Layout:** list of source cards + an "Add source" entry point.
**Contains, per source card:** source type icon · label (e.g. "Jordan public holidays" or the connected Google account email) · status (Active / Needs re-auth) · for Google: a multi-select of which calendars feed in · remove action.
**Add source flow:** a dialog choosing "Country holidays" (searchable country picker) vs. "Google Calendar" (OAuth connect, same return pattern as B3).
**States:** empty ("No event sources yet — add your country's holidays or connect a calendar") · loading · populated · error (sync failed, inline retry) · needs_reauth.

### C3 — Calendar view · `/calendar`
**Purpose:** see the schedule **and how it's performing** — the visual heart of the product's promise, now closing the loop back to results, not just plans.
**Layout:** month view by default (toggle to week), standard grid, top toolbar (month/week toggle, prev/next, "Today" jump, a legend for slot-status colors **and** the new performance indicator).
**Contains:** each day cell shows up to 3 slot chips — time, a status dot (pending/generating/review/done/skipped), event-type icon + name if attached · **once a slot's post is published, its chip additionally shows a small performance indicator** (a compact trend arrow or a single mono metric, e.g. "142 👍" — full detail on tap, see C4) · days with an attached event get a tinted background + the event name as a label · click a day or chip opens C4.
**Week view:** same chips with more room — shows the draft's tone label directly, and the performance metric un-abbreviated.
**States:** loading (skeleton grid) · empty month (no schedule configured — CTA to C1) · populated · "generation delayed" indicator if the dispatcher is behind · a published chip whose analytics haven't synced yet shows a neutral "Syncing…" micro-state instead of a stale zero.

### C4 — Slot detail sheet (from C3)
**Purpose:** zoom into one day's slot(s) — including, for published posts, exactly how they did.
**Layout:** right-side sheet.
**Contains:** date + slot time header · attached event card if any · list of the slot's draft(s) with status badge + condensed preview · "Open in queue" link per draft (→ D3) · "Skip this slot" (pending slots, with confirm) · **for published drafts: a "Performance" section** — the same stat-chip pattern as G2, scaled down (reach, engagement, a mini sparkline) + a "View full analytics →" link to G2.
**States:** loading · empty (slot not yet generated, "Drafting starts at [time]") · populated · skipped (greyed, undo if same-day) · performance sub-state: syncing / populated / limited-data (platform-dependent, matches G2's honesty rule).

---
## Part 5 — Area D: Dashboard & Review Queue

### D1 — Dashboard · `/` (home after login) — **new**
**Purpose:** the single page with everything on it — every other screen is one click away, and nothing needing attention gets missed. This is the answer to "where do all the pages and notifications live."
**Layout:** header + a 4-up stat row + a two-column body (quick-links grid on one side, a combined notifications/activity feed on the other; stacks to one column on mobile).
**Contains:**
- **Header:** greeting ("Good morning, [Name]") + org name + current date.
- **Stat row** (mono ClaimChip-style cards, each clickable):
  - *Drafts awaiting review* (count → D2 Today)
  - *Scheduled this week* (count → Calendar)
  - *Credits balance* (mono figure → Studio, with a low-balance warning treatment when close to zero)
  - *Connections needing attention* (count, warning styling if > 0 → Connections)
- **Quick-links grid:** one card per major area — Today's Queue, Calendar, Creative Studio, Analytics, Connections, Billing, Settings — icon + name + one-line description, mirroring the nav exactly. This is the literal "dashboard with all the pages" the product needs.
- **Notifications & activity feed:** a persistent, fuller version of N1's list — same item design (icon by type, message, relative timestamp), merged with recent activity (posts published, media generated, drafts approved) into one reverse-chronological feed · a filter (All / Notifications / Activity) · "Mark all as read."
**States:** loading (skeleton stat cards + feed) · empty/new-org (mostly zeros — nudges toward finishing setup or approving the first draft) · populated · **setup-incomplete banner** if onboarding was skipped, linking back into A5 at the right step.
**Primary actions:** every stat card and quick-link card navigates; "Mark all as read" on the feed.

### D2 — Today (queue) · `/today` *(was the standalone hero at `/`)*
**Purpose:** the screen the product is judged on. Where drafts get approved.
**Layout:** header block + a **slot-grouped** list — each slot is a labeled group (e.g. "Today, 9:00 AM" or "Independence Day · 9:00 AM" if event-attached) containing 1–3 draft cards.
**Header contains:** eyebrow "Today" · count summary ("7 drafts ready across 3 slots") · beacon live-status · a compact strip of upcoming slot times.
**Draft card contains:** tone badge (shows custom-tone names identically to presets — no visual second-class treatment) · post copy in `body-lg` · "why this post" rationale (collapsible) · sources as ClaimChips (verified/flagged) · event chip if attached · status badge across the full v4 machine (pending_review / approved / media_pending / media_ready / scheduled / published / rejected / expired / publish_failed) · action row that changes by status: pending_review → Approve / Edit / Reject; approved → **"Create image/video"** (opens D4) + "Schedule" (opens D5); media_ready → thumbnail + "Schedule"; publish_failed → "Retry" + reason.
**States:** loading (staggered skeleton) · empty ("No drafts yet — your next slot generates at [time]," or a link to Generate) · error (a slot's generation failed, doesn't block other slots) · populated · the media-generation entry point is **only ever visible on `approved`+ cards** — absent, never a disabled tease, on earlier states.
**Primary actions:** Approve, Reject (with a reason picker + free text), Edit (inline), Create image/video, Schedule.

### D3 — Draft detail (expanded, from D2's card or C4's deep-link)
**Layout:** dialog or `/drafts/:id`, two-column on desktop.
**Contains (left):** full editable copy · media preview area (empty if not generated, thumbnail + "Regenerate" if present) · full source list as ClaimChips.
**Contains (right rail):** status timeline (generated → reviewed → approved → media → scheduled → published, timestamped) · tone + slot info · quality/judge score (mono) · quick actions mirrored from D2.
**States:** loading · default · editing (dirty-state guard) · saving · same status-driven action visibility as D2.

### D4 — Media generation panel (from an approved draft) — *this is Creative Studio, in context*
**Purpose:** the moment credits get spent. **This screen is not a separate feature** — it's the exact Composer from E2, opened in **draft-scoped mode**: same model gallery, same schema-driven params form, the same generation engine — just pre-attached to this draft and returning here when done, so approving a post and creating its art feels like one continuous tool, not two.
**Layout:** dialog, ~560px, the draft's copy snippet pinned at the top for context throughout.
**Contains:** kind toggle (Image / Video) · model picker (compact card grid — name, credit cost, lock+"Upgrade" if above plan tier) · the same dynamic params form as E2 (driven by `model_catalog.capabilities` — fields change per model) · credit cost summary (mono: "This will use **12** credits · Balance after: **38**") · primary "Generate," disabled with an inline upsell if balance is short (`402`) · cancel.
**States:** selecting → **generating** (informative progress, signal-sweep motion, "Usually takes ~30s") → **succeeded** (asset preview inline, "Use this" / "Regenerate" / "Try another model") → **failed** (clear reason, credits auto-released, "Try again").
**Primary action:** Generate → asset attached, draft becomes `media_ready`, returns to D2/D3. (The same asset also shows up in E3's job list, tagged as belonging to this draft — see Part 6.)

### D5 — Schedule / publish dialog (from an approved or media_ready draft)
**Layout:** dialog, ~480px.
**Contains:** date + time picker (defaults to the slot's own time, or "now" for on-demand drafts) · channel multi-select — only `posting_allowed = true` connections appear, pre-checked if the org has a default · a per-channel preview toggle (character-limit and media-spec warnings inline — e.g. "Video too long for X") · primary "Schedule" (or "Publish now").
**States:** default · a channel in `needs_reauth` shown disabled with an inline "Reconnect" link (other channels still publish) · submitting · success (toast, action-name-persists) · partial failure (explicit per-channel result list).

---
## Part 6 — Area E: Creative Studio

*Framing: Studio is **the center where the user creates everything the company needs** — images, video, any creative asset — whether or not it's tied to a specific post. It has two modes that share every component: **standalone** (opened from the nav, fully free-form) and **draft-scoped** (opened from an approved draft as D4 — same screens, pre-attached to that draft). Nothing about the generation experience differs between the two; only the entry point and whether an attach target is pre-selected.*

### E1 — Model gallery · `/studio`
**Purpose:** the higgsfield-style browsing entry point for standalone generation.
**Layout:** filter bar (kind: Image/Video, plan-tier) + a responsive card grid (3–4 columns desktop).
**Contains, per model card:** representative thumbnail/sample · friendly model name (never the raw vendor id) · kind badge · credit cost (mono) · plan-gate badge if above tier · click → E2, pre-selected.
**Header contains:** page title, credit balance chip, a "My jobs" link to E3.
**States:** loading (skeleton cards) · populated · filtered-empty ("No models match these filters").

### E2 — Composer · `/studio/new` (standalone) or the same component in draft-scoped mode (D4)
**Purpose:** configure and submit a generation.
**Layout:** two-column — left: schema-driven form; right: a live preview area (model sample/thumbnail + running cost estimate). **In draft-scoped mode**, a pinned context bar above the form shows the draft's copy snippet, and the final step skips the separate "attach" action from E4 since the target is already set.
**Contains:** selected model header (swappable — "Change model" reopens E1's grid inline) · prompt textarea · dynamic params per model capability (aspect ratio, duration, seed, style/reference upload) · credit cost + balance line · "Generate" primary button.
**States:** default → generating (progress, signal-sweep, informative wait copy) → succeeded (redirects to E4, or shows inline with "View in gallery" / in draft-scoped mode, "Use this" returns straight to the draft) → failed (credits released, retry) → `402` insufficient-credits (inline upsell, prompt preserved).

### E3 — Job list · `/studio/jobs`
**Purpose:** every generation, standalone or draft-scoped, in one accountable list.
**Layout:** table/list, most-recent first, status filter tabs (All / Running / Succeeded / Failed).
**Contains, per row:** thumbnail (or spinner while running) · model name · prompt excerpt · credits spent (mono) · status badge · relative timestamp (mono) · **a small origin tag — "Standalone" or "For draft: [tone/date]"** — so users can tell at a glance which jobs were made for a specific post · click → E4.
**States:** empty ("Nothing generated yet — try the gallery") · loading · populated · a running row updates live (poll-driven, a pulsing status dot rather than a spinner, matching the beacon language).

### E4 — Asset detail · `/studio/assets/:id`
**Purpose:** view, download, or (for standalone assets) retroactively attach a completed generation to a post.
**Layout:** centered large preview (image or video player) + a meta rail.
**Contains:** full-size asset · download button · meta rail: model used, full prompt, params, credits spent, timestamp, origin tag (Standalone / For draft) · **"Attach to a draft"** action (standalone assets only — draft-scoped assets are already attached) — opens a picker listing only `approved`-or-later drafts, the gate enforced in the picker's own filter · "Generate similar" (pre-fills E2 with the same prompt/model) · delete asset (confirm).
**States:** loading · populated · failed-job variant (error shown, prompt for retry, no asset to preview) · attach-picker empty state ("No approved drafts yet — approve one from Today first").

---

## Part 7 — Area F: On-demand Generate

### F1 — Generate · `/generate`
**Purpose:** the standalone composer for "I want a post about X right now" — streams tokens live.
**Layout:** single centered column, max ~720px.
**Contains:** `h1` "What should we write about?" · large prompt textarea · optional refinements (tone select — defaults to org tones, **including custom ones**; source URL field to ground the draft in a specific link) · "Generate" primary button · on submit: input collapses upward, result area **streams in live** token-by-token, signal-sweep active on the card's top edge · on completion, the result becomes a normal draft card (same component as D2's) with the full action row, dropping the user straight into the same review flow.
**States:** idle · streaming (live text, "stop generating" affordance) · guardrail-flagged mid-stream (inline flag indicator, content never hidden) · complete · error (stream dropped, partial text preserved) · rate-limited (clear "You've hit the generation limit for now," never a silent failure).

---

## Part 8 — Area G: Analytics

### G1 — Overview dashboard · `/analytics`
**Purpose:** the org-wide "how are we doing" view — the same underlying data the Calendar now surfaces inline (C3/C4), shown here in full depth.
**Layout:** top summary-stat row (4 mono ClaimChip-style stat cards) + a per-channel breakdown grid.
**Contains (summary row):** total reach, total engagement, posts published (period), follower growth — each with a period-over-period delta (icon + color, never color-only) · a date-range selector above the row.
**Contains (per-channel grid):** one card per connected+analytics-enabled channel — platform icon, handle, trend sparkline, 2–3 key metrics, "View details →" to G2.
**States:** empty (no analytics-enabled connections — CTA to Connections) · loading (skeleton stats + sparklines) · populated · partial (a channel shows "Sync pending" without breaking the layout).

### G2 — Channel detail · `/analytics/:connectionId`
**Purpose:** deep dive on one connected account — the destination of both the nav and Calendar's per-post "View full analytics" link.
**Layout:** header (platform + handle + avatar) + date range selector + a chart area + a recent-posts performance table.
**Contains:** primary trend chart (toggleable metric) · secondary stat chips (mono: avg. engagement rate, best-performing tone, posting frequency) · table of recent published posts with per-post metrics, thumbnail, published date, sortable by performance.
**States:** loading · empty ("No published posts yet in this range") · populated · limited-data note for platforms with restricted analytics (e.g. LinkedIn member accounts) — an honest inline explanation, not a broken-looking empty chart.

---
## Part 9 — Area H: Billing

### H1 — Plans · `/billing/plans`
**Purpose:** the in-app pricing/upgrade surface — pulled live from `GET /billing/plans`, the same data source as the marketing site's pricing section (M1), so the two never drift.
**Layout:** 3-column pricing card grid (Free / Pro / Studio), current plan visually distinguished.
**Contains, per plan card:** plan name · price (mono) · monthly credit grant (mono, prominent) · entitlement list (channels, slots/day cap, Studio access, model tiers) with check/cross icons · primary CTA ("Current plan" disabled / "Upgrade" / "Downgrade").
**States:** loading · populated · plan-change confirmation dialog (proration note if applicable) before checkout.

### H2 — Subscription management · `/billing/subscription`
**Contains:** current plan card (name, price, renewal date mono) · payment method summary (masked, possibly deep-linking to the gateway's own portal) · "Change plan" → H1 · "Cancel subscription" (danger, confirm dialog explaining what's lost) · billing history table below.
**States:** active · **past_due** (a banner here and echoed globally in the top bar — "Your payment failed. Update your payment method to keep posting.") · canceled (shows end-of-access date) · loading · error.

### H3 — Credits history · `/billing/credits`
**Contains:** current balance (large, mono) · next grant date · transaction table: date (mono), type badge (Grant/Reserved/Committed/Released/Refund), amount (signed, mono, colored +/−), reference (links to the Studio job or subscription event).
**States:** loading · empty (new account, only the initial grant) · populated · a reserved-but-not-committed row shown distinctly.

### H4 — Checkout return states (transient, full-page)
**Contains:** success ("You're on the Pro plan — credits added," CTA to Dashboard) · canceled ("Checkout canceled — no charge was made," CTA to H1) · processing (webhook-lag fallback, brief poll before resolving).

---

## Part 10 — Area I: Settings

### I1 — Organization profile · `/settings/organization`
**Contains:** org name, logo (upload/crop), one-line offer, differentiators (tag input), standard CTA text, timezone (mirrors C1, single source) · save bar with dirty-state guard.
**States:** standard form pattern (loading, default, validating, saving, saved, error) — used across every Settings screen.

### I2 — Brand voice · `/settings/brand-voice`
**Purpose:** the org-wide do/don't rules that shape every draft, regardless of tone.
**Contains:** structured do/don't rule list (add/remove rows) · example tone snippets (optional, illustrative) · a cross-note: "See also **Tones** for per-post style variations — brand voice always applies underneath whatever tone is selected." · save bar.
**States:** standard form pattern; empty (invites adding at least one rule).

### I3 — Tones library · `/settings/tones` — **new**
**Purpose:** manage every tone the generation pipeline can use — the 5 presets plus the org's own custom ones. The durable home for what's first created inline during onboarding Step 4 or from C1.
**Layout:** grid/list of tone cards.
**Contains:** preset tone cards (Provocative, Data-driven, Educational, Story, Direct-CTA), badge "Preset," view-only (no edit/delete) · custom tone cards, badge "Custom," with edit and delete actions · primary **"+ Create custom tone"** button.
**States:** loading · populated (presets always present) · empty-custom ("No custom tones yet — create one to match a specific campaign or product line").

### I4 — Create / edit custom tone · `/settings/tones/new` (also reachable as an overlay from A5 Step 4 and from C1) — **new**
**Purpose:** define a new tone. The exact same component whether opened as a full page from I3 or as an overlay mid-flow elsewhere — one implementation, three entry points.
**Layout:** form — sheet when opened as an overlay, full page at its own route.
**Contains:** tone name · short description (what this tone sounds like, 1–2 sentences) · do/don't rule list, scoped to this tone (same pattern as I2 but narrower — e.g. "Do: short, punchy sentences. Don't: jargon.") · optional example snippet (a sample sentence in this tone, used to steer generation) · optional **"Preview"** action — generates one sample line combining the org's brand voice (I2) with this tone's rules, so the user can see the interaction before saving · Save / Cancel.
**States:** default · validating (name required, at least one rule) · saving · saved (toast; when opened as an overlay, returns to the calling screen with the new tone auto-selected; when opened standalone, returns to I3) · error · delete-confirm (from I3's edit path — "Delete this tone? Drafts already using it keep their existing copy, but you won't be able to select it for new ones.").

### I5 — Followed sources & topics · `/settings/sources` *(was I3)*
**Layout:** two sections (or tabs): Sources (RSS/news/blog URLs) and Topics (tag list).
**Contains:** add-source form (URL + auto-detected name/favicon) · source list with remove · a note that social feeds aren't supported as sources (only as publish targets) · topics as an editable tag input.
**States:** standard form pattern; empty states per section.

### I6 — Knowledge docs · `/settings/knowledge` *(was I4)*
**Layout:** a drag-and-drop dropzone + a file list.
**Contains:** dropzone (drag state, browse fallback) · per-file row: filename, size (mono), progress bar, ingestion status (Uploading → Processing → Ready / Failed) · remove action.
**States:** idle, drag-hover, uploading, processing, ready, failed (with reason + retry) — all per-file, mixed states in one batch.

### I7 — Team members · `/settings/team` *(was I5)*
**Layout:** a table of members + an invite entry point.
**Contains:** member rows (avatar, name, email, role badge, joined date mono, remove for admins) · "Invite member" dialog (email + role select) · pending-invite rows (badge "Invited," resend/revoke).
**States:** loading, empty ("Invite your team to collaborate"), populated, invite-sending, invite-error.

---

## Part 11 — Area J: System & notifications

### N1 — Notification panel (dropdown from the top-bar bell, not a route)
**Purpose:** the **quick-glance** version — the full, persistent version lives on the Dashboard (D1).
**Contains:** a scrollable list, most-recent first, each item: icon by type (re-auth needed, low credits, generation failed, payment failed, drafts ready), one-line message, relative timestamp, click-through to the relevant screen · "Mark all as read" · unread items visually distinct.
**States:** empty ("You're all caught up") · populated · unread badge count on the bell icon.

### N2 — 404 · any unmatched route
**Contains:** on-brand illustration or signal-gradient pattern, "Page not found," primary CTA to the Dashboard, secondary link to support.

### N3 — Empty-org first-run (shown if a user reaches an authenticated screen before finishing onboarding)
**Contains:** a friendly redirect — "Let's finish setting up your workspace" — primary CTA resuming A5 at the correct step.

### N4 — Offline / degraded-service banner (global, conditional overlay on the top bar)
**Contains:** a thin, non-blocking top banner — "You're offline — changes will sync when you reconnect" or "We're having trouble reaching AlphaBeacon — retrying…" — dismissible once resolved, non-modal.

---
## Part 12 — Suggested mockup review order

1. **Marketing home** (M1) + **auth screens** (A1–A4) — the front door, reviewable before any app-shell work exists.
2. **Onboarding wizard** (A5, 5 steps) — the real setup journey; review this closely, since it now carries the calendar-connect and pipeline-start logic the rest of the product depends on.
3. **Dashboard** (D1) — the first authenticated screen and the nav model for everything after it.
4. **Connections hub** (B1–B3).
5. **Calendar + Tones** (C1–C4, I3–I4) — grouped together since tone creation is tightly coupled to schedule configuration.
6. **Review queue** (D2–D5) — the hero; review hardest here, especially D4's "this is Studio, in context" framing.
7. **Creative Studio** (E1–E4) — both its standalone and draft-scoped modes.
8. **Generate / streaming** (F1).
9. **Billing** (H1–H4) — cross-check H1's plan cards against M1's pricing section for visual/data consistency.
10. **Analytics** (G1–G2) — review with realistic fixture numbers; also verify against C3/C4's inline performance indicators for consistency.
11. **Remaining Settings + system screens** (I1, I2, I5–I7, J) — lowest novelty, mostly reuses patterns established earlier.

## Part 13 — Consistency checklist (apply across all 40 screens before calling a mockup pass "done")

- [ ] Every screen mocked at 360 / 768 / 1280.
- [ ] Every screen with server data has loading, empty, error, **and** populated variants.
- [ ] Status/state is never color-only — every badge pairs a color with an icon and/or text.
- [ ] Every number that matters (credits, counts, percentages, timestamps, performance metrics) uses **Geist Mono**.
- [ ] The approval-gate rule is visually honest everywhere it appears (D2, D3, D4, E4): media-generation entry points don't exist for un-approved drafts — they're absent, not disabled-and-teasing.
- [ ] **D4 and E2 are visually and functionally the same composer** — a reviewer flipping between "create media for this draft" and "open Studio directly" should recognize it as one tool, not two.
- [ ] Custom tones (I3/I4) render identically to preset tones everywhere they appear (D2's tone badges, C1's tone picker, F1's tone select, A5 Step 4) — no second-class visual treatment.
- [ ] The Dashboard's stat-card numbers (D1) match what Today, Calendar, and Billing show independently — no divergent counts.
- [ ] Every destructive action (disconnect, cancel subscription, remove member, delete asset, delete tone) has a confirm step that names the consequence, not just "Are you sure?"
- [ ] Action names persist through their own flow (Approve → Approved; Start pipeline → Started; Generate → Generating… → Ready; Publish → Published).
- [ ] Both light and dark themes reviewed for at least the hero screens (D1 Dashboard, D2 Today, C3 Calendar, E1 Studio). Marketing (M1) may remain light-only.
- [ ] The beacon/signal-sweep motion language appears only where the system defines it (live-status dot, generation-in-progress) — not scattered decoratively elsewhere.
- [ ] Every form's validation errors are worded the way a human would explain the problem, not a raw API error code.
- [ ] Pricing shown in M1 (marketing) and H1 (in-app) is visually distinct in chrome but numerically identical — same source data, no copy drift.
