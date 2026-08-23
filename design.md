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

**Two design systems live in this repo (since 2026-08-23 / M2).** Parts 1–6
are the SIGNED-IN PRODUCT: light-first, Inter, the shadcn token map. **Part 7
is the VISITOR WORLD** — Abdullah's concept-v2, dark, DM Sans, its own token
file at `src/styles/marketing.css` and its own contrast guard at
`src/styles/marketing-tokens.test.ts`. They are scoped so they cannot reach
each other, and the boundary is Part 7's first rule. Where the two disagree,
neither is wrong: they describe different places.

---

## Part 1 — Color

### 1.1 The kit palette

| Swatch           | Hex       | OKLCH                         | Role in this product                             |
| ---------------- | --------- | ----------------------------- | ------------------------------------------------ |
| Deep Charcoal    | `#1D1D1F` | `oklch(0.2316 0.0038 286.1)`  | Primary text, logo, buttons; dark-theme surfaces |
| Warm Ivory       | `#F7F4EF` | `oklch(0.9681 0.0074 80.72)`  | Page background (light), body text (dark)        |
| Limestone        | `#EFE9DF` | `oklch(0.936 0.0149 80.71)`   | Secondary background (`--secondary`, `--muted`)  |
| Champagne Gold   | `#C7A76A` | `oklch(0.7432 0.0876 82.76)`  | Primary accent — see 1.3 for where it may live   |
| Burnished Bronze | `#8C6A3F` | `oklch(0.5487 0.0735 71.79)`  | Secondary accent (`--brand-strong`, light)       |
| Muted Emerald    | `#3F7C57` | —                             | Basis of `--success` (deepened, see 1.4)         |
| Terracotta       | `#B9654A` | —                             | Basis of `--warning` / `--destructive` (see 1.4) |

The previous identity's signature pink `#FF1E57` and the
`#FF1E57 → #B1204A` signal gradient are **retired everywhere**. No bright
gradients exist anywhere in the product (kit: "No bright gradients").

### 1.2 The accessibility constraint

Every piece of text must clear **WCAG AA — 4.5:1** for small text, 3:1 for
large text and meaningful UI boundaries. Measured against the kit's own
palette:

| Color                    | As small text on ivory | Large-type minimum (3:1) | Verdict                  |
| ------------------------ | ---------------------- | ------------------------ | ------------------------ |
| `#C7A76A` Champagne Gold | **1.90:1**             | fails                    | Cannot carry text on light — not even display |
| `#8C6A3F` Bronze         | **4.04:1**             | passes                   | Large type only on light |
| `#3F7C57` Emerald        | **3.86:1**             | passes                   | Needs deepening for badges |
| `#B9654A` Terracotta     | **3.05:1**             | passes                   | Needs deepening for badges |
| `#1D1D1F` Charcoal       | **15.16:1**            | passes                   | Carries everything       |

The binding surface is the `bg-X/10 text-X` tint pattern every status badge
uses — stricter than text on the page, and where failures actually surface.

### 1.3 The resolution: split the gold by role, never dilute it

Champagne gold is not softened into legibility and it is not dropped. It is
assigned the surfaces where it genuinely reads, and the charcoal takes the
jobs the kit already gave it:

- **`--primary`** — **Deep Charcoal on light, Champagne Gold on dark.** The
  kit assigns charcoal "primary text, logo, buttons"; buttons and interactive
  text are charcoal in the light theme. On dark, gold is the interactive
  color: charcoal text on a gold fill reads 7.34:1, and the kit calls gold on
  dark the premium treatment.
- **`--brand` (light) `#9A7B4F`** — the gold family's voice on light surfaces:
  gold deepened toward bronze until it clears 3:1 for large display type
  (3.60:1 on ivory). Display only, never body text. The light-theme brand
  contrast is asserted to sit in the `[3.0, 4.5)` window — readable as
  display, never mistaken for a text color.
- **`--brand` (dark) `#C7A76A`** — the true champagne gold (7.34:1 on
  charcoal). The premium moment lives on dark: the gold wordmark, the gold
  primary.

### 1.4 Adjustments made for AA, and why

Every value that is not a kit color exactly (light / dark):

| Token                | Kit basis           | Shipped               | Why                                                                     |
| -------------------- | ------------------- | --------------------- | ----------------------------------------------------------------------- |
| `--brand` (light)    | `#C7A76A` → bronze  | `#9A7B4F`             | Gold reads 1.9:1 on ivory; deepened until ≥3:1 for display type.        |
| `--success`          | `#3F7C57`           | `#33684A` / `#84BE9C` | Deepened (lifted on dark) until 4.5:1 on its own 10% tint.              |
| `--warning`          | `#B9654A` (softened)| `#7D5226` / `#DCA96A` | Terracotta's cautionary voice, darkened until its tints read.           |
| `--destructive`      | `#B9654A` (deepened)| `#8F3E26` / `#EDA58C` | A step deeper and redder than warning so "delete" outweighs "careful"; >12° hue gap from `--primary` asserted. |
| `--muted-foreground` | charcoal family     | `#5C5850` / `#B5AFA3` | Warm greys that clear 4.5:1 on Limestone / dark muted.                  |
| `--input`            | —                   | `#8A8577` / `#787367` | Form-control boundaries carry meaning; ≥3:1 (WCAG 1.4.11) on page and card, unlike decorative `--border`. |
| `--accent`           | gold family         | `#F1E9DA` / `#33302A` | A gold-tinted wash for hover/selected surfaces; its foreground pair clears 4.5:1. |

`--border` stays deliberately subtle (`#E3DCCD` light / 12% white dark) — the
kit's "light borders"; decorative dividers carry no 3:1 requirement.

### 1.5 Semantic tokens

Features never use a hex or a Tailwind palette class — ESLint fails the build.
The full set lives in `src/styles/tokens.css`, light and dark:

`background` `foreground` `card` `popover` `primary` `secondary` `muted`
`accent` `destructive` `warning` `success` `border` `input` `ring`
`chart-1…5` `sidebar*` `brand` `brand-strong` `shadow-soft-sm/md/lg`

Gone with the rebrand: `--signal-gradient`, `--glow-signal`, `--ab-ink`,
`--ab-cinema-seam`.

---

## Part 2 — Typography

**The kit names no typeface.** The choice below is recorded in `decisions.md`
as **proposed, pending founder confirmation** — everything else in this part
is law regardless of which family finally carries it.

**Inter** (variable, self-hosted) is the single family, display to caption:
`--font-display`, `--font-sans`, and `--font-mono` all resolve to it. Barlow
and Geist Mono are retired with the old identity.

Figures that matter — credits, counts, percentages, timestamps, IDs — still
render through the `MonoNumber` component, which now means **Inter with
`tabular-nums`**: columns align and digits do not jitter as they count up.
That requirement is functional, not a brand choice, and it survives any
future typeface swap.

| Role                     | Face  | Weight  |
| ------------------------ | ----- | ------- |
| Display / headings       | Inter | 600–700 |
| Body / UI                | Inter | 400–500 |
| Figures, timestamps, IDs | Inter + `tabular-nums` | 400–500 |

**Type scale** (unchanged from `screens4.md` §0.2): display 48 · h1 38 · h2 30
· h3 24 · h4 20 · body-lg 18 · body 16 · body-sm 14 · caption 12 (uppercase,
tracked) · mono 13–16. Kit: "Large headlines, short paragraphs, clear
hierarchy."

**Font files:** vendored WOFF2 under `src/styles/fonts/` with hand-written
`@font-face` (see decisions.md — the npm registry was unreachable the day of
the rebrand; swap to `@fontsource-variable/inter` when it returns).

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

Two animations exist inside the product, and only two:

- **Signal sweep** — a line crossing a surface's top edge while work is in
  flight (now `--brand`, not a gradient).
- **Beacon pulse** — the live-status ring, pulsing only while something needs
  attention.

Both opt in through the `data-ab-motion` attribute; `styles/globals.css`
removes them wholesale under `prefers-reduced-motion`, and Playwright asserts
it. The count-up in `useCountUp` enforces the same rule in JavaScript, where
CSS cannot reach: under reduced motion the final figure renders immediately.
No other animation may be added without extending this part.

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

Very dark graphite, warm-leaning. Six steps, darkest first:

| Token             | Value     | Where                                     |
| ----------------- | --------- | ----------------------------------------- |
| `--c-void`        | `#05080b` | the footer, the deepest ground            |
| `--c-bg`          | `#080d11` | the page                                  |
| `--c-surface-1`   | `#0c1217` | cards at rest                             |
| `--c-surface-2`   | `#10171c` | cards that have arrived                   |
| `--c-surface-3`   | `#161f26` | icon tiles, chips, the customer monogram  |
| `--c-surface-4`   | `#1d272f` | declared by the prototype; unused so far  |

Lines are white at 7% / 12% / 20% (`--c-line`, `-2`, `-3`).

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

**REVERTED 2026-08-24 (D-M2-F-r).** The founder decided otherwise, and the
"reversible in one line" below was taken up: on `design/m2-concept-v2` all
four values are Abdullah's again, so the preview he reviews is his design
verbatim rather than the corrected one. The four are therefore **live WCAG AA
failures on that branch**, allowlisted by name and by measured ratio in
`marketing-tokens.test.ts`, `e2e/marketing.spec.ts` and `verify:w02` — never
by switching the contrast rule off — and re-applying the fixes is a gate on
the merge to `main` (open-items 21). What follows describes the fixes as
D-M2-F made them; read each one as the state to RESTORE.

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

One more change is not a deviation but a bug fix: `RealBrands` carried
`role="group"` on a `<ul>`, which strips the list role from every child. The
scroll container keeps its focus and its label without claiming to be a group.

### 7.8 — What did NOT come across

The prototype's purchase flow (get-started, checkout, onboarding,
`PaymentSurface`, the adapters) is an honest inert fiction there and would be
a second, fake "get started" journey here, next to a real signup. It is not
ported, and `verify:w02` fails if any of it reappears. Its concept login is
replaced by the real `/login`. See decisions.md D-M2-C.
