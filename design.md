# Malaky — Design System

The visual system of record for **Malaky** (Arabic wordmark **ملاكي**), derived
from the **Malaky Brand Starter Guide v1.0**
(`Docs/brand/Malaky_Brand_Standards_v1.pages`, with the extracted text and page
render under `Docs/brand/reference/`). `screens4.md` says _what_ each screen
contains; this document says _how_ everything looks.

The kit defines a palette, logo usage rules, a visual style ("Apple-inspired
minimalism, premium Middle Eastern aesthetic"), a motion law ("gentle fades,
subtle hover effects, no flashy animations"), and a personality ("trust before
features"). It names **no typeface** — see Part 2. Everything else here — the
derived hues, the spacing and radius scales — is recorded below so the
derivation is auditable rather than assumed.

**Implementation:** `src/styles/tokens.css` is the machine-readable copy of
Part 1. `src/styles/tokens.test.ts` asserts every contrast pair in this
document and fails the build if an edit breaks one. If this file and
`tokens.css` ever disagree, that is a bug in one of them — not a matter of
taste.

**ONE design system governs this repo (since 2026-09-14 / ORDER THEME-0913).**
It was two — Parts 1–6 the signed-in product, light-first and Inter; Part 7 the
visitor world, dark and DM Sans — and they were scoped so they could not reach
each other. **The founder repealed that separation** (D-THEME-0913-A) on
Abdallah's requirement that the product wear the website's theme.

So: **Part 7's token file, `src/styles/marketing.css`, is the SOURCE**, and
Part 1 is now the product's copy of it — the same graphite ladder, the same
warm ink, the same accent, the same gold, plus the handful of roles a work
surface needs that a landing page never did (error, warning, a form boundary, a
scrim). `src/styles/one-theme.test.ts` fails the build if the two files drift.

**The CSS isolation was NOT repealed, only the design separation.**
`marketing.css` is still scoped to `html[data-mk-world]`, still declares nothing
on `:root`, and `verify:w02` still asserts it. Part 7 keeps its own contrast
guard at `src/styles/marketing-tokens.test.ts`. The two worlds share values, not
a cascade — and where their text disagrees, **the stylesheet wins and the prose
is the bug**, which is exactly how §7.1's "warm-leaning" defect was caught.

---

## Part 1 — Color

**REWRITTEN 2026-09-14 by ORDER THEME-0913.** Everything this part used to say
— Warm Ivory page, Deep Charcoal ink, the gold family split by role because it
could not carry text on a light surface — described a light product that no
longer exists. That system is retired, not deprecated: there is no toggle and
no second palette. Keeping the old text beside the new would leave two
contradictory parts, so it is replaced.

### 1.1 One theme, and where it comes from

**The product wears the website's theme** (D-THEME-0913-A). Abdallah reviewed
the live app and required it; the founder ruled; the rule in `CLAUDE.md` that
scoped Part 1 and Part 7 apart is repealed.

`src/styles/marketing.css` — the concept-v2 token file Part 7 documents — is
the **source**. `src/styles/tokens.css` carries its values **to the byte**, and
`src/styles/one-theme.test.ts` fails the build if the two ever disagree. Values
are written as hex in both files for exactly that reason: a reader must be able
to diff them by eye.

Only the **design** separation was repealed. The **CSS** isolation stands:
`marketing.css` is still scoped to `html[data-mk-world]`, still declares nothing
on `:root`, and `verify:w02` still asserts it. The two worlds share values, not
a cascade.

### 1.2 The surface ladder — elevation is lightness

Shadow does not read on graphite, so depth is **lightness plus a hairline**
(D-THEME-0913-E). Four roles, two hover steps, all six taken whole from Part 7:

| Token          | Value     | L      | Role                                   |
| -------------- | --------- | ------ | -------------------------------------- |
| `--sunken`     | `#05080b` | 0.1316 | inputs, wells                          |
| `--background` | `#080d11` | 0.1556 | the page                               |
| `--card`       | `#0c1217` | 0.1784 | cards, panels                          |
| `--muted`      | `#10171c` | 0.1999 | zebra, row hover, quiet fill           |
| `--popover`    | `#161f26` | 0.2338 | menus, popovers, modals                |
| `--accent`     | `#1d272f` | 0.2668 | menu-item hover inside a popover       |

Strictly monotonic, one hue throughout (~242°, **cool** — see the correction in
§7.1), asserted by `tokens.test.ts`. Separation is the step **plus** a
white-12% hairline (`--border`). **Neither pure black nor pure white appears in
the token set**, and the test asserts that too.

Shadow survives only under a true overlay, as ambient wash: Tailwind's
`--shadow-sm/md/lg` are overridden in `globals.css` so the `shadow-md` the
shadcn primitives already carry stops pretending to be elevation. The scrim is
`rgba(0, 0, 0, 0.72)` — chosen by measurement, because on this canvas a scrim
cannot create contrast (1.18:1 → 1.24:1 at any alpha) and can only **suppress**
the page behind it (13.1:1 → 2.0:1).

### 1.3 Text

Three real tiers, warm off-white, never stark. The warmth is here, not in the
surfaces.

| Token                  | Value     | On page | On card | Role              |
| ---------------------- | --------- | ------- | ------- | ----------------- |
| `--foreground`         | `#f3ede6` | 16.79   | 16.21   | headings, body    |
| `--muted-foreground`   | `#b3ada6` | 8.78    | 8.47    | supporting copy   |
| `--subtle-foreground`  | `#857f79` | 4.93    | 4.76    | captions, meta    |

**`--subtle-foreground` is barred from `--popover` and below** — 4.22:1 there,
under AA. That is the same bar Part 7 sets on its own quiet tiers, and
`tokens.test.ts` asserts **both halves**: that it clears AA on page and card,
and that it still fails on the overlay steps. If a future edit lifted it until
it passed everywhere, the ladder would have flattened, and that is worth
failing on.

Body line length stays under 80 characters. Tabular figures in tables and
metrics, through `MonoNumber`.

### 1.4 The colour roles — spend the accent, don't spray it

**`--primary` `#ff4e2d` is the one action colour** (D-THEME-0913-C). One
primary action per view region; three orange buttons on a screen is a bug, not
a style. It also carries the focus ring (`--ring`) and the selected state.
Secondary actions are a neutral surface with a border. Ink on the accent is
`--primary-foreground` `#1a0a05` at 5.86:1 — never white, which is 3.29:1 and
fails AA for a label.

**`--brand` `#e3c084` is quiet metal.** The active navigation indicator, plan
and status badges, brand moments, a secondary chart series, a header rule.
**Never a button fill, never a link colour.** The visitor world declares a
`.gold` button tone and has zero call sites for it; the product keeps that
discipline, and `tokens.test.ts` asserts `--primary` and `--ring` are never the
gold — the exact failure that withdrew the previous palette attempt
(D-UX-0913-C).

**Error leaves red** (D-THEME-0913-D). The accent is a red-orange at hue 32.7°;
a red error collides with it. `--destructive` `#ed647c` sits at hue 12.1° —
**20.6° of circular hue distance**, a deliberate compromise recorded in the
decision. Error is **never colour alone**: icon plus text, always.

| Token           | Value     | Hue    | On page | On card | On popover |
| --------------- | --------- | ------ | ------- | ------- | ---------- |
| `--primary`     | `#ff4e2d` | 32.7°  | 5.93    | 5.72    | 5.07       |
| `--brand`       | `#e3c084` | 80.5°  | 11.28   | 10.89   | 9.65       |
| `--success`     | `#4fb286` | 161.9° | 7.48    | 7.22    | 6.39       |
| `--destructive` | `#ed647c` | 12.1°  | 6.24    | 6.02    | 5.34       |
| `--warning`     | `#ea9e51` | 63.9°  | 8.84    | 8.53    | 7.56       |

`--destructive` and `--warning` are the two roles the visitor world never
needed; both are ours, both measured. Success is Part 7's `--c-ok`.

**Informational and neutral states use surface steps and text tokens, not a
hue.** Hover is a surface step, never the accent.

### 1.5 Boundaries and focus

`--border` is `rgba(255,255,255,0.12)` — decorative separation, no contrast
duty. **`--input` `#857f79` is different**: it identifies a control, so WCAG
1.4.11 wants 3:1, and Part 7's hairlines top out at 1.84:1. Solving for ≥3:1 on
all six surfaces landed on the value Part 7 already had for `--c-text-3`. The
one role the visitor world never needed is filled by a colour it already owned.

Focus is the accent ring, visible on every interactive element, never the
browser default. Both `--input` and `--ring` are asserted at ≥3:1 against every
surface in the ladder.

### 1.6 Charts

Built only from colours this palette owns (D-THEME-0913-G): `--chart-1` gold →
`--chart-2` gold dimmed one lightness step → `--chart-3` success → `--chart-4`
warning → `--chart-5` the neutral text tier. **The accent is deliberately not a
series** — it is the action colour and a chart is not an action. The test
asserts every series is within 6° of a hue the palette already contains, so an
invented hue fails the build.

### 1.7 Radius, and what is measured

Radius is Part 7's scale: **8 / 12 / 18 / 26px**, wider and more characterful
than the 8/10/12/16 the product carried.

`tokens.test.ts` is the contract: every text pair on every surface it may
appear on, the `bg-X/10 text-X` badge pattern that broke this palette three
times historically, the monotonic ladder, the hue separations as **circular**
distance, `--input` and `--ring` at 3:1, and the chart ramp. axe covers what a
rendered page shows; this covers the palette itself.

---

## Part 2 — Typography

**The kit names no typeface.** It did not name Inter either — Inter was
recorded here as **PROPOSED, pending founder confirmation**, and was never
chosen so much as defaulted to.

**SETTLED 2026-09-14 (D-THEME-0913-F). The confirmation came, and it was a
CHANGE, not an alignment: Inter is retired.**

**DM Sans** (variable, the opsz axis, self-hosted) is the single Latin family,
display to caption — the website's face, now the product's too.
`--font-display`, `--font-sans` and `--font-mono` all resolve to it.
**IBM Plex Sans Arabic** (400 / 500 / 600) is the Arabic pairing,
`--font-arabic`. Barlow and Geist Mono were retired with the old identity;
Inter joins them.

No new dependency: both faces were already installed for the visitor world.
The vendored `src/styles/fonts/inter-latin*.woff2` are deleted.

Figures that matter — credits, counts, percentages, timestamps, IDs — still
render through the `MonoNumber` component, which now means **DM Sans with
`tabular-nums`**: columns align and digits do not jitter as they count up.
That requirement is functional, not a brand choice, and it survived this
typeface swap exactly as it was written to.

| Role                     | Face  | Weight  |
| ------------------------ | ----- | ------- |
| Display / headings       | DM Sans | 500–600 |
| Body / UI                | DM Sans | 400–500 |
| Figures, timestamps, IDs | DM Sans + `tabular-nums` | 400–500 |
| Arabic, all roles        | IBM Plex Sans Arabic | one step above the Latin equivalent at body size and below |

**The Arabic weight step is law, not preference:** thin light-on-dark Arabic
blooms, so at body size and below Arabic sits one weight step up. It is
recorded and not yet applicable — the product has no Arabic UI strings at all
(open-items 68). For the same reason the product **loses** a light-weight step
wherever one was used.

**Type scale.** Display steps are **fixed**, not fluid: Part 7's
`clamp()` display sizes are right for a page scrolled once and wrong for a work
surface, where a heading should not resize as a sidebar collapses (see §1.7 and
Part 7's own note). display 32 · title 24 · section 18 · body 15 · small 13 ·
micro 11, with intentional weight and tracking per step.

**No all-caps labels, no tracked-out eyebrow labels above headings, no
monospace for ordinary small text.** The caption tier is no longer "12,
uppercase, tracked" — that row of the old scale is deleted. Today's eyebrow was
the first casualty and the rest go with Phase 4's sweep.

---

## Part 3 — Logo

From the kit, verbatim in spirit:

- Use **only the founder-approved Arabic wordmark (ملاكي) exactly as
  supplied**. Never redraw, simplify, edit, or distort it; never remove or
  alter the decorative marks above the letters; preserve proportions and
  spacing.
- **Colorways:** Deep Charcoal (default, on light), Champagne Gold (premium),
  White (on dark backgrounds).
- The English wordmark "MALAKY" is secondary — only where Arabic is not
  appropriate.

**In this product:** the artwork enters only as `<img>` of the three supplied
files (`public/brand/malaky-logo-{charcoal,gold,white}.png`) — the app rail,
the auth and wizard lockups, and the marketing page all swap charcoal ↔ white
with the theme; gold is reserved for premium brand moments (the marketing
"Built for the Middle East" panel). The accessible name is always the plain
text "Malaky" (`alt` or `sr-only`), never baked into the artwork. The favicon
and touch icon are **crops** of the charcoal wordmark's rightmost glyph — a
crop is the one manipulation allowed, because it edits nothing inside the
frame. `verify:w02` greps structurally that marketing never redraws the mark.

The vector original has been requested from the designer; until it arrives the
610×352 PNGs are the only artwork (open-items).

---

## Part 4 — Spacing, radius, elevation

The kit asks for "rounded corners, premium spacing, soft shadows, plenty of
whitespace" and defines no numbers; these are the chosen values, recorded here
so there is one source.

- **Spacing scale:** 2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 /
  80. Never a raw pixel value — snap to the scale.
- **Radius:** sm 8 · md 10 · lg 12 (`--radius: 0.75rem`) · xl 16 · 2xl 20 ·
  pill 999. Soft-modern, never zero-radius.
- **Elevation:** three warm, low-alpha soft shadows —
  `--shadow-soft-sm/md/lg` (charcoal at 5/7/9% alpha in light; deeper blacks
  on dark, where lifted surface colors do most of the depth work). **Never a
  glow.** The old `--glow-signal` is retired.

---

## Part 5 — Motion

The kit's motion law: **"Gentle fades, subtle hover effects, no flashy
animations."** Calm micro-animations only.

### 5.0 The scale — three durations, and everything comes from them

Added ORDER MOTION-0914/A §2, and it is part of the token system rather than a
separate document: the durations live in `styles/tokens.css` beside the colour
ladder, and `motion-scale.test.ts` fails the build if the scale grows a fourth
value, runs out of order, or stops collapsing.

| Token             | Value   | What it is for                                                                        |
| ----------------- | ------- | ------------------------------------------------------------------------------------- |
| `--motion-fast`   | `120ms` | Hover and press. Everything that answers a pointer.                                   |
| `--motion-medium` | `220ms` | Entrances and state changes — overlays, the nav indicator, content after a skeleton.  |
| `--motion-slow`   | `900ms` | **Reserved** for the memorable moments. One exists (§5.7's queue-clear).              |

Easings are `--ease-out` and `--ease-inout`, both `marketing.css`'s to the
byte, both guarded by `one-theme.test.ts`.

**`fast` is deliberately under the 150ms the product had been running on.**
That 150ms was Tailwind's default, inherited rather than chosen and written
down nowhere; measured, it was the duration of every transition in the app that
had one at all. A press that answers later than an unconsidered default would
be a design system making the product worse.

**A literal duration in code we author is a bug.** Tailwind's
`--default-transition-duration` and `--default-transition-timing-function`
point at the scale, so every `transition-colors` and `transition-all` the
shadcn primitives ship inherits it without a single hand-edit under
`components/ui/`. Two exemptions, both named rather than quietly tolerated: the
**two ambient loops** below (a heartbeat is a tempo, not a duration), and the
**sidebar's own collapse**, which still carries shadcn's `duration-200` inside
`components/ui/sidebar.tsx` — a file rule 3 forbids editing, and 200ms is
within a rounding error of `medium`.

**THE PRESS VOCABULARY on this canvas is a surface step plus the hairline,
never a shadow.** Shadow does not read on graphite (Part 1, D-THEME-0913-E) and
an inset shadow is the light-UI idiom for "pushed". A press steps the surface
DOWN to `--sunken`, the well below the page — on a dark canvas, being pushed in
means going darker — and strengthens the border to `--input` where one already
exists. Hover keeps the rung it had, so the two never collide. The one
accent-filled control has no ladder to step down and steps down its own ramp
instead (`--primary-pressed`; the website's own `--c-accent-lo` was refused at
a measured 4.49:1 under the button label).

**Reduced motion collapses the scale to `0ms`; it does not remove it.** The
distinction is the whole of §4 and it is not a softening of the law below: a
hover fill, a press step, a focus ring and the nav indicator are STATE, and
removing them would remove the interface's answer to the user. The signature
animations below say nothing a still screen does not already say, so those are
still REMOVED outright. One block in `globals.css` does both.

### 5.1 The signature animations

Two animations exist inside the product, and only two:

- **Signal sweep** — a line crossing a surface's top edge while work is in
  flight (now `--brand`, not a gradient).
- **Beacon pulse** — the live-status ring, pulsing only while something needs
  attention.

Both opt in through the `data-ab-motion` attribute; `styles/globals.css`
removes them wholesale under `prefers-reduced-motion`, and Playwright asserts
it. The count-up in `useCountUp` enforces the same rule in JavaScript, where
CSS cannot reach: under reduced motion the final figure renders immediately —
and so does `useNumberTransition`, which carries §3's "numbers that change
animate to their new value" for every figure in the product through
`MonoNumber`. No other animation may be added without extending this part.

**`data-ab-motion` is for flourishes only, and must never be hung on a
control.** That attribute carries `display: none !important` under reduced
motion; putting it on a button would delete the button for anyone who asked for
stillness. The baseline reaches the same guarantee by collapsing the scale, in
the same block — see 5.0.

F1's token-by-token stream is **not** a third animation: it is content
arriving. The caret beside it is a static glyph — a blinking cursor is exactly
the decorative animation this part exists to refuse.

### The marketing layer (M1) — SUPERSEDED 2026-08-23 by Part 7

**Everything under this heading described M1, and M1 is retired.** The visitor
world is concept-v2 now (decisions.md D-M2-A): the reveal, the pinned copy
beats, the 3D orbit of demo-brand cards, the ambient drift and the two-tier
reduced-motion gate all left the bundle with `features/marketing/outputs/` and
the `[data-mk-*]` block in `globals.css`. The concept-v2 world carries its own
motion, described in **Part 7**.

It is kept, not deleted, because it is the record of what was tried and why —
and because the ONE law that survives the change is stated here first: motion
is REMOVED under `prefers-reduced-motion`, never slowed. Part 7 inherits it.

The rest of this section is history.

### (historical) The marketing layer (M1 only) — two tiers since 2026-08-08

**Tier 1 — calm (the base page, and the app's only tier).** M1's base motion
budget is **one gentle fade-and-rise per section** as it first enters the
viewport, plus (production pass 2026-08-11) **state-driven micro-transitions**
on the interactive demos — the workspace approval loop, the how-it-works
active step, the memory learning moment, the calendar reveal — all
`motion-safe:` transitions of transform/opacity/color whose finished state
renders immediately under reduced motion: an `IntersectionObserver` flips `data-mk-reveal`, and the animated
state exists only inside a `prefers-reduced-motion: no-preference` media
query in `globals.css` — under reduced motion every section renders
finished, removed rather than slowed. The dark-ink cinematic concept of
2026-07 (ink hero, film, marquee) stays retired; its assets live only in git
history.

**Tier 2 — cinematic-calm v2 (AMENDED 2026-08-10 by the V1 brief · M1
only).** The tier is REDEFINED from scrubbed footage to
**scroll-choreographed 3D card transforms** (brief §13, decisions.md D8):
the hero object is the marketing Malaky produces — floating,
publication-ready, channel-specific posts for the demo customer brands,
each in that customer's own colors. **Amended 2026-08-11 (founder-directed):
the cards do not move on scroll.** They hold one resting fan for the whole
story; scrolling the pinned section advances only the copy beats (headline
cross-fades, the memory chips, the approval moment, the channel row). The
app keeps the strict calm law — nothing in this tier may leak into
`AppShell`.

Since 2026-08-11 (founder-directed, final form the same day) the cards
travel **one autonomous 3D orbit** — a slow luxury-showroom carousel on
the hero's right side, and the cards' only motion. Six cards, 60° apart
on an elliptical ring (horizontal radius ~280–430 px resolved from the
viewport, vertical 70 px, depth 250 px), one revolution every 28 s.
Depth drives everything each frame: scale 0.90→1.05, opacity 0.72→1,
z-index 0→18 (the copy rail sits at z-20 and stays readable), so cards
naturally pass in front of and behind each other. Orientation stays
viewer-facing (rotateY ≤10°, rotateX ≤3°, rotateZ ≤2°) under a per-card
`perspective(1500px)` — per-frame opacity makes every slot a grouping
element, which would flatten a shared preserve-3d scene. Hovering any
card (or the approval beat, so the demo stays clickable) eases the orbit
to ~0.45× — never a stop — and lifts the hovered card forward with +2 %
scale; scroll never touches the orbit. The narrow-viewport swipe strip
keeps a light Z-only CSS drift; under reduced motion the engine never
mounts and the static layered composition renders instead.
The rb/01 dashboard-as-glass-object film is retired from the route (D1);
its masters live in the local takes archive and the Higgsfield library.

Forbidden even in this tier: bouncing, fast spinning, particles, exploding
cards, excessive parallax (brief §13) — plus the house bans: dark voids,
kinetic type slams, film grain, neon, AI clichés (robots, brains,
circuits, glowing effects). No canvas frame sequences and no video on the
marketing route — the film ban is now an assertion, and `<video
currentTime>` stays banned repo-wide. `prefers-reduced-motion` renders the
static tier-1 page: the scroll engine never mounts, and every scene's
content is fully readable in normal document flow. M1 stays
**light-canonical**: the route ignores the app theme (decisions.md).

**Surfaces in this tier (brief §12):** 18–24 px corner radius, thin
warm-gray borders, very subtle shadows, ivory/white surfaces, generous
internal padding. No pervasive glassmorphism, no neon or glowing borders,
no heavy gradients or giant drop shadows.

**Customer-content palette exemption (D5):** Malaky chrome — navigation,
section copy, buttons, chips, everything that is Malaky — stays strictly
under the palette law: Warm Ivory / Deep Charcoal / Limestone surfaces,
champagne gold as the only Malaky accent, used selectively (active states,
tiny dividers, status details, CTA moments). Demo-brand artwork INSIDE a
mock post may use that demo brand's own palette — that contrast is the
story ("Malaky learns each customer's identity", brief §3/§10). The
exemption covers card interiors only; it never licenses customer colors on
Malaky chrome.

**The copy system (brief §11):** large, short headlines, generous
whitespace, always the pattern short statement → visual proof → short
explanation. The headline set: "Your marketing, already done." · "Built
overnight." · "It remembers your business." · "Malaky doesn't wait for a
prompt." · "You approve what goes out." · "Arabic, natively."

The one deliberate dark moment on the light page — the Call-to-Action panel —
is a scoped `.dark` island (charcoal card, white wordmark, gold button), so
its text uses the dark palette's tested contrast pairs. It is a card, not a
theme flip.

---

## Part 6 — The rules that outrank taste

1. Contrast ≥ AA everywhere; the palette is guarded by `tokens.test.ts` and
   every screen is scanned by axe in both themes.
2. Status is never color alone — always an icon and words as well.
3. Numbers that matter are mono (Inter `tabular-nums`), via `MonoNumber`.
4. Destructive actions name their consequence.
5. Action labels persist through their flow (Approve → Approved).
6. Custom tones render identically to preset tones, everywhere.
7. Reduced motion removes signature animation entirely.
8. Light-first **inside the product**: light is the app's default face; dark
   is charcoal with ivory text and the white wordmark, and the app honors the
   selected theme in every signed-in route. **AMENDED 2026-08-23 (M2):** the
   visitor world is the exception and it is DARK-canonical — concept-v2 is a
   dark site, it ignores the app theme entirely, and it says so through
   `color-scheme: dark` on the document while it is mounted. Rules 1–7 and
   9–11 apply to both worlds; this one is the only rule with a border in it.
   See Part 7.
9. A figure nobody reported is absent, never zero — "Syncing…" on a post, no
   delta at all where there is no comparable prior period.
10. A metric moving the wrong way is `warning`, not `destructive`. Reach
    falling is news; it is not an error, and colouring it like one cries wolf
    on the screen where a real failure has to stand out.
11. The wordmark is never redrawn, recolored outside its three supplied
    colorways, or distorted. Trust before features — when a flourish and
    clarity compete, clarity wins.

---

## Part 7 — The visitor world (concept-v2)

_Added 2026-08-23 (M2). The brief called this "Part 6"; Part 6 was already the
rules that outrank taste, and renumbering it would have broken the checks and
docs that cite "Part 6 rule 8". Same content, next number._

The marketing site is a **port of Abdullah's `malaky-prototype`
(`components/concept-v2/**`)**, and its tokens — not this document — are the
source of truth for its values. `src/styles/marketing.css` is that token file,
copied from the prototype's `app/globals.css` with one structural change and
three accessibility ones, all listed below. What follows describes the system
so a reader knows what they are looking at; when this text and `marketing.css`
disagree, the stylesheet wins and this section is the bug.

### 7.0 — The boundary

The product keeps its own design system. So:

- Every concept-v2 token hangs off `html[data-mk-world]`, an attribute
  `MarketingLayout` sets before paint and removes on unmount.
- Every element reset hangs off `.mk-world`, the layout's own root element,
  written `:where(.mk-world) button` so each rule keeps the exact specificity
  it had in the prototype. (A plain `.mk-world button` would outrank the
  port's own `.primary`, and did — the filled CTA silently lost its label
  colour until the `:where()` went in.)
- Nothing under `src/features/marketing/` reads `@/data`, with one exception:
  the layout asks the provider whether `/` is the site or the product.

`verify:w02` asserts all three. Break one and the concept's dark palette
leaks into a signed-in screen.

### 7.1 — Surfaces

Very dark graphite, **cool-leaning**. Six steps, darkest first, with the
measured OKLCH lightness and hue of each:

| Token             | Value     | L      | Hue    | Where                                     |
| ----------------- | --------- | ------ | ------ | ----------------------------------------- |
| `--c-void`        | `#05080b` | 0.1316 | 242.7° | the footer, the deepest ground            |
| `--c-bg`          | `#080d11` | 0.1556 | 242.0° | the page                                  |
| `--c-surface-1`   | `#0c1217` | 0.1784 | 243.8° | cards at rest                             |
| `--c-surface-2`   | `#10171c` | 0.1999 | 239.5° | cards that have arrived                   |
| `--c-surface-3`   | `#161f26` | 0.2338 | 242.0° | icon tiles, chips, the customer monogram  |
| `--c-surface-4`   | `#1d272f` | 0.2668 | 242.7° | declared by the prototype; unused so far  |

> **CORRECTED 2026-09-14 (D-THEME-0913-A) — a documentation defect, not a
> design change. This section said "warm-leaning" from M2 until now, and the
> values never were.** Measured, all six surfaces sit at **hue 239–244°, which
> is blue.** Nothing in `marketing.css` changed and nothing on the site moved;
> the prose was simply wrong about the stylesheet it documents, which §7.0
> already says wins.
>
> **The warmth in this palette lives in the INK, not the ground** —
> `--c-text` is h 71.9°, `--c-text-2` h 71.9°, `--c-text-3` h 67.6°. Warm
> off-white on cool graphite is the actual system, and it is a better one than
> the sentence that described it.
>
> This mattered beyond tidiness: ORDER THEME-0913's design law was written from
> this sentence and said "one **warm** graphite hue across all four surfaces".
> The founder amended the law to the measurement — one graphite hue taken from
> the reference **as measured**, warmth carried by the text — rather than
> re-hueing a palette to match a typo. `tokens.test.ts` now asserts the ladder
> holds one hue within 8°, so the claim is checked rather than written.

Lines are white at 7% / 12% / 20% (`--c-line`, `-2`, `-3`). They are decorative
separation and carry no contrast duty; measured, they reach only **1.18 / 1.38
/ 1.84:1** against `--c-surface-1`, which is why the product needed a real
`--input` value for anything that identifies a control (Part 1).

### 7.2 — Text

Warm off-white, never stark. **Four tiers, of which three are distinct:**

| Token          | Value     | Role                                    |
| -------------- | --------- | --------------------------------------- |
| `--c-text`     | `#f3ede6` | headlines, body                         |
| `--c-text-2`   | `#b3ada6` | leads, supporting copy                  |
| `--c-text-3`   | `#857f79` | captions, meta                          |
| `--c-text-4`   | `#857f79` | **aliases `--c-text-3`** — see 7.7      |

Quiet tiers never sit on `--c-surface-3` or `-4`: they cannot clear AA there.
`marketing-tokens.test.ts` asserts the matrix, and `verify:w02` sweeps the CSS
modules for the pairing.

### 7.3 — Accent, and the gold law

**`--c-accent` is `#ff4e2d`** and it is the identity. Used sparingly: the full
stop that closes an editorial headline, the filled CTA, the focus ring
(`--c-accent-hi`, `#ff6a4d`), the timeline dot, a rule or a glow. It is the
site's single signal for "this is the action", which is why there is never
more than one filled button in a viewport.

**Gold (`--c-gold`, `#e3c084`) is for pricing tiers and the wordmark only, and
never for an action.** The prototype states this in the token file itself and
this document restates it because it is the rule most likely to erode: gold is
a premium tone, not a second accent, and a gold button would make the page
have two answers to "what do I press".

`--c-ok` (`#4fb286`) is the one semantic state colour the site uses.

### 7.4 — Type

**DM Sans** carries the whole English hierarchy — one family, two roles.
`--f-display` is the same face as `--f-sans`; the separate name marks the
places set as display type, because those need their own tracking, not their
own typeface. **IBM Plex Sans Arabic** carries Arabic (`--f-arabic`), in 400,
500 and 600.

Both are **self-hosted** through `@fontsource-variable/dm-sans` (the opsz axis,
normal + italic) and `@fontsource/ibm-plex-sans-arabic` (the arabic subset).
No Google Fonts request is made — the static e2e asserts zero network and this
is why it can.

**Weights — four steps, used everywhere.** Display type sits at 400 and leans
on size rather than weight; 450 is the single-step lift inside a headline; 500
carries UI (buttons, labels, table headers); 600 is the top of the scale and
is reserved for small type that has to hold at 11–13px.

| Token             | Value |
| ----------------- | ----- |
| `--w-display`     | 400   |
| `--w-display-em`  | 450   |
| `--w-ui`          | 500   |
| `--w-strong`      | 600   |

**Tracking — the optical correction the size axis does not make.** One face
across 11px to 66px needs it: negative at display sizes so words hold
together, positive on small uppercase so they do not clot.

| Token                | Value      |
| -------------------- | ---------- |
| `--track-display`    | `-0.03em`  |
| `--track-display-sm` | `-0.022em` |
| `--track-caps`       | `0.1em`    |

**Sizes** are fluid: `--t-display-1` `clamp(2.75rem, 6.1vw, 5.25rem)`,
`-2` `clamp(2.25rem, 4.4vw, 3.75rem)`, `-3` `clamp(1.75rem, 2.9vw, 2.5rem)`,
`--t-lead` `clamp(1rem, 1.15vw, 1.1875rem)`, then fixed: `--t-body` 15px,
`--t-small` 13px, `--t-micro` 11px.

### 7.5 — Section rhythm (FROZEN)

```
--shell:           1240px
--gutter:          clamp(1.25rem, 4vw, 3rem)
--section-y:       clamp(3.5rem, 6vw, 6.5rem)      /* FROZEN */
--section-y-dense: clamp(2.5rem, 4vw, 4.25rem)     /* FROZEN */
```

**These two are frozen and the freeze is enforced.** The hero is the approved
reference and `--section-y` is its own bottom padding — 86px at 1440, 56px at
390. Sections were carrying 130/80 before, half again as much air as the
section everyone liked. `--section-y-dense` is for functional pages (pricing,
forms), about two thirds of the hero's rhythm, because a reader who is
comparing and filling in is not being introduced to anything.

A third value is frozen with them: the section head's step down to its
content, `margin-bottom: clamp(2rem, 3.1vw, 2.75rem)` in `ui.module.css`,
taken from the hero's own CTA-row-to-activity-strip gap.

`verify:w02` asserts all three literally. Changing one fails that run, which
is the point — it makes a rhythm change a decision rather than a diff.

(Upstream asserted the same law from `scripts/spacing-qa.mjs`. That harness
did not come across: our gate culture stays ours, D-M2-C.)

### 7.6 — Radius, elevation, easing

`--r-sm` 8px · `--r-md` 12px · `--r-lg` 18px · `--r-xl` 26px. Two shadows,
both deep and both black — `--shadow-card` and `--shadow-float`. Two easings:
`--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` and `--ease-inout`
`cubic-bezier(0.65, 0, 0.35, 1)`.

### 7.7 — Motion, and the four deviations from the prototype

Part 5's surviving law applies here: **reduced motion REMOVES, it never
slows.** `marketing.css` collapses every animation and transition inside
`.mk-world` under `prefers-reduced-motion: reduce`, `BrandVideo` never mounts
a `<video>` element at all under the preference (the poster carries the whole
story), and the hero orbit renders a composed, readable still.

**Settled 2026-08-24 (D-M2-F-r2).** These four were briefly reverted so
Abdullah could review his palette verbatim (D-M2-F-r); he delegated the call
and the founder ruled that accessibility wins with the design spirit preserved.
All four corrections below are in place, and **no allowlist survives anywhere
in the branch** — axe enforces contrast on the real homepage with zero
exceptions. A fifth correction came out of the same pass and is recorded after
the four.

**Four values differ from Abdullah's prototype. All four are accessibility
fixes, all four are commented at the site of the change, and all four are
reversible in one line if the founder decides otherwise.**

1. **`--c-text-4` was `#5d5a57`.** 2.63–2.93:1 against the surfaces it is used
   on — under WCAG AA for normal text, on roughly forty elements across five
   pages (footer, eyebrows, section numbers, "Optional", the pricing page's
   planned-capability list). There is no room for a fourth tier above the AA
   floor while the third sits where it does, so the fourth **aliases** the
   third rather than inventing a new value in the designer's palette. Every
   usage site keeps the `--c-text-4` name.
2. **The filled CTA set `color: #fff` on `--c-accent`.** 3.29:1 at 14–15px.
   **The accent is untouched** — it is the identity — and the ink on it is
   now `--c-on-accent` (`#1a0a05`, 5.9:1, and 6.8:1 on the hover tint). The
   design already used that idiom: `.gold` sets `#1a1206` on the gold fill.
   Changing the fill instead would have meant a different orange on every CTA
   on the site.
3. **The approval preview was held at `opacity: 0.3`.** Two rules land on that
   at once: "never dim real text with opacity" (state.md — it has broken AA
   three times in this repo), and "the approval-gated surface is ABSENT before
   approval, never disabled-teasing" (conventions.md). At 0.3 the card still
   read: "Scheduled — Monday, 11:00" was legible enough to be a claim, made
   before the visitor had approved anything. It is now genuinely not there
   until the sequence reaches it.
4. **The customer monogram set `--c-text-3` on `--c-surface-3`.** 4.22:1, and
   those are a customer's initials — real text. One tier up clears AA.

5. **The Memory section's reveal faded as well as moved** (found 2026-08-24,
   D-M2-F-r2). `.draft, .learned, .future` rested at `opacity: 0.55`, which
   multiplied every text tier inside all three cards — 1.60:1 on the original
   draft, 2.18:1 on the rule list, 3.21:1 on "what it learned". It was never a
   "superseded" signal: it applied equally to the learned rule and the future
   draft. No dim value fixes it, because `--c-text-3` is 4.76:1 on
   `--c-surface-1` and 4.57:1 on `--c-surface-2` at full strength. **The reveal
   now slides without fading** — the movement and the border transition are
   kept, and Part 5's rule against dimming real text holds.
   One consequence of deviation 1 is paid for here: `--c-text-4` was the ONLY
   thing saying "this draft was superseded", and aliasing it to `--c-text-3`
   makes it the same colour as the rule list beside it. A small `Superseded`
   badge in the label row carries the meaning in a channel that does not
   require perceiving colour. The alternative considered was a strikethrough
   on the draft body; the badge won because the label row is structure the
   design already had.

One more change is not a deviation but a bug fix: `RealBrands` carried
`role="group"` on a `<ul>`, which strips the list role from every child. The
scroll container keeps its focus and its label without claiming to be a group.

And one was a broken check rather than a broken design: the homepage's axe
scan had never actually scanned the homepage — `analyze()` does not auto-wait,
so it read whatever was still mounted. It now waits for the hero `h1` and
scans under reduced motion, which this stylesheet collapses to the settled end
state. A moving page reports mid-transition blends as defects.

### 7.8 — What did NOT come across

The prototype's purchase flow (get-started, checkout, onboarding,
`PaymentSurface`, the adapters) is an honest inert fiction there and would be
a second, fake "get started" journey here, next to a real signup. It is not
ported, and `verify:w02` fails if any of it reappears. Its concept login is
replaced by the real `/login`. See decisions.md D-M2-C.
