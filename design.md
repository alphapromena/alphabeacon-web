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

### The marketing layer (M1 only) — two tiers since 2026-08-08

**Tier 1 — calm (the base page, and the app's only tier).** M1's base motion
budget is **one gentle fade-and-rise per section** as it first enters the
viewport: an `IntersectionObserver` flips `data-mk-reveal`, and the animated
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

Since 2026-08-11 (founder-directed) the cards also carry a **continuous
ambient idle drift** so the composition never freezes between scrolls:
each card floats on its own duration (8–16 s), phase, distance (2–8 px)
and rotation (≤ 0.8°), with a whisper of scale breathing. The drift is a
CSS keyframe animation on a wrapper NESTED inside the scroll-owned slot —
scroll wrapper → ambient wrapper → card — so the two systems write
`transform` on different elements and can never cancel each other
(`motion-tokens.ts` holds the per-card profiles). Hovering a card pauses
its drift for inspection; the narrow-viewport swipe strip drifts at half
amplitude; under reduced motion the animation does not exist at all (same
no-preference query as everything else).
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
8. Light-first, everywhere: light is the brand's default face; dark is
   charcoal with ivory text and the white wordmark. The app honors the
   selected theme in every route; M1 becomes light-canonical when the
   cinematic layer lands (Part 5 amendment, 2026-08-08) — its footage is
   graded for ivory and the marketing route will ignore the app theme.
9. A figure nobody reported is absent, never zero — "Syncing…" on a post, no
   delta at all where there is no comparable prior period.
10. A metric moving the wrong way is `warning`, not `destructive`. Reach
    falling is news; it is not an error, and colouring it like one cries wolf
    on the screen where a real failure has to stand out.
11. The wordmark is never redrawn, recolored outside its three supplied
    colorways, or distorted. Trust before features — when a flourish and
    clarity compete, clarity wins.
