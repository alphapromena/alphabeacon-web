# AlphaBeacon — Design System

The visual system of record for AlphaBeacon, derived from the **Alpha MENA
Branding Kit** (`Alpha MENA Branding Kit.pdf`, in this repo). `screens4.md` says
_what_ each screen contains; this document says _how_ everything looks.

The kit defines four things: a color palette, a typeface, logo variations, and
logo usage rules. Everything else here — the neutral ramp, the status hues, the
spacing and radius scales, the motion language — is derived from those four and
recorded below so the derivation is auditable rather than assumed.

**Implementation:** `src/styles/tokens.css` is the machine-readable copy of Part

1. `src/styles/tokens.test.ts` asserts every contrast pair in this document and
   fails the build if an edit breaks one. If this file and `tokens.css` ever
   disagree, that is a bug in one of them — not a matter of taste.

---

## Part 1 — Color

### 1.1 The kit palette

| Swatch         | Hex       | OKLCH                         | Role in this product                                  |
| -------------- | --------- | ----------------------------- | ----------------------------------------------------- |
| Off-white      | `#F3F2F1` | `oklch(0.9616 0.0017 67.8)`   | Page background (light), body text (dark)             |
| Signature pink | `#FF1E57` | `oklch(0.6429 0.2461 16.08)`  | `--brand` — logo, gradient, beacon glow, display type |
| Mid rose       | `#E92156` | `oklch(0.6047 0.227 14.26)`   | `--brand-strong` — gradient stop, hover               |
| Deep rose      | `#B7274F` | `oklch(0.5174 0.1795 10.57)`  | Basis of `--primary` (see 1.3)                        |
| Charcoal       | `#313234` | `oklch(0.3169 0.0038 264.51)` | Body text (light), dark-theme neutral family          |
| Black          | `#000000` | —                             | Logo on light backgrounds                             |

### 1.2 The accessibility constraint

Every piece of text in this product must clear **WCAG AA — 4.5:1** for small
text, 3:1 for large text and meaningful UI boundaries. Measured against the
kit's own palette:

| Color     | As small text on white | On its own 10% tint | Verdict              |
| --------- | ---------------------- | ------------------- | -------------------- |
| `#FF1E57` | **3.77:1**             | **3.24:1**          | Fails — display only |
| `#E92156` | **4.36:1**             | **3.74:1**          | Fails — display only |
| `#B7274F` | 6.15:1                 | 5.24:1              | Passes               |
| `#313234` | 12.83:1                | —                   | Passes               |

The 10% tint column is the `bg-X/10 text-X` pattern every status badge uses. It
is stricter than text on the page, and it is where failures actually surface.

### 1.3 The resolution: split the brand by role, never dilute it

The signature pink is not softened and it is not dropped. It is assigned the
jobs it can do accessibly, and a second kit color takes the jobs it cannot:

- **`--brand` `#FF1E57`** — the logo mark, the signal gradient, the beacon glow,
  large display type, marketing hero art. Never small text, never body copy.
- **`--primary` `#B1204A`** — every interactive text, link, focus ring, and
  button fill. This is the kit's deep rose `#B7274F` darkened by 0.017 in
  lightness so it clears AA on _muted_ surfaces too, not just white.

Both are the brand's own colors. Only their jobs differ.

### 1.4 Adjustments made for AA, and why

Every value that is not a kit color exactly:

| Token                   | Kit basis        | Shipped               | Why                                                                                                                                |
| ----------------------- | ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--primary` (light)     | `#B7274F`        | `#B1204A`             | `#B7274F` reads 4.26:1 on its own tint over a muted surface. Darkened until 4.55:1.                                                |
| `--primary` (dark)      | `#B7274F`        | `#FF6F8E`             | The deep rose sits near 2:1 on a dark page. Same hue, lifted for dark.                                                             |
| `--destructive` (light) | —                | `#B2251D`             | A brick red ~18° off the brand rose, so "delete" never reads as "primary action".                                                  |
| `--destructive` (dark)  | —                | `#FF9882`             | Lifted until it clears AA at the `/20` tint shadcn uses for dark destructive buttons.                                              |
| `--warning`             | —                | `#835500` / `#F5B942` | No kit equivalent; chosen to clear AA on both surfaces in both themes.                                                             |
| `--success`             | —                | `#0F6C42` / `#4ADE9B` | As above.                                                                                                                          |
| `--muted-foreground`    | `#313234` family | `#5A5C5F` / `#A3A5AA` | Secondary text that still clears 4.5:1 on muted surfaces.                                                                          |
| `--input`               | —                | `#8D8A88` / `#696A6F` | Form-control boundaries carry meaning; these clear WCAG 1.4.11's 3:1 rather than sitting at the usual near-invisible border value. |

`--border` stays deliberately subtle (decorative dividers, no 3:1 requirement).

### 1.5 Semantic tokens

Features never use a hex or a Tailwind palette class — ESLint fails the build.
The full set lives in `src/styles/tokens.css`, light and dark:

`background` `foreground` `card` `popover` `primary` `secondary` `muted`
`accent` `destructive` `warning` `success` `border` `input` `ring`
`chart-1…5` `sidebar*` `brand` `brand-strong` `glow-signal` `signal-gradient`

---

## Part 2 — Typography

**Barlow** is the brand typeface — the only one the kit specifies. It carries
display and UI alike (`--font-display`, `--font-sans`), shipped self-hosted from
`@fontsource/barlow` at weights 400/500/600/700.

**Geist Mono** carries every figure that matters — credits, counts,
percentages, timestamps, IDs — through the `MonoNumber` component. The kit
defines no monospace; tabular numerals are a functional requirement (columns
must align, digits must not jitter as they count up), not a brand choice. This
is the one documented departure from a kit-only font stack.

| Role                     | Face       | Weight  |
| ------------------------ | ---------- | ------- |
| Display / headings       | Barlow     | 600–700 |
| Body / UI                | Barlow     | 400–500 |
| Figures, timestamps, IDs | Geist Mono | 400–500 |

**Type scale** (unchanged from `screens4.md` §0.2): display 48 · h1 38 · h2 30 ·
h3 24 · h4 20 · body-lg 18 · body 16 · body-sm 14 · caption 12 (uppercase,
tracked) · mono 13–16.

---

## Part 3 — Logo

From the kit's "LOGO DETAILS":

- **Typeface:** Barlow, **all capital letters**.
- **Color:** black on light backgrounds, white on dark backgrounds.
- The kit also supplies a **logo mark** used alongside or instead of the
  wordmark.

**In this product:** the wordmark renders in Barlow, uppercase, tracked
(`0.14em`) in the app rail and the marketing header. The mark is a rounded
square carrying the signal gradient (`#FF1E57 → #B1204A`) — the one place the
signature pink appears at full strength in the chrome. On the neutral surfaces
this product uses, the wordmark takes `--foreground` (charcoal on light,
off-white on dark), which satisfies the kit's black/white rule while keeping
text contrast at 11:1 or better.

---

## Part 4 — Spacing, radius, elevation

The kit defines none of these; they carry over from `screens4.md` §0.2 and are
recorded here so there is one source.

- **Spacing scale:** 2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80.
  Never a raw pixel value — snap to the scale.
- **Radius:** sm 8 · md 12 · lg 16 (`--radius`) · xl 22 · pill 999. Soft-modern,
  never zero-radius.
- **Elevation:** three shadow levels, plus `--glow-signal` — a brand-pink glow
  reserved for the beacon and generation-in-progress states.

---

## Part 5 — Motion

Two animations exist in this product, and only two:

- **Signal sweep** — a gradient line crossing a surface's top edge while work is
  in flight.
- **Beacon pulse** — the live-status ring, pulsing only while something needs
  attention.

Both opt in through the `data-ab-motion` attribute; `styles/globals.css` removes
them wholesale under `prefers-reduced-motion`, and Playwright asserts it. The
count-up in `useCountUp` enforces the same rule in JavaScript, where CSS cannot
reach: under reduced motion the final figure renders immediately rather than
animating faster. No other animation may be added without extending this part.

F1's token-by-token stream is **not** a third animation: it is content arriving,
the same way a list grows when data lands. The only motion on that screen is the
signal sweep on the card's top edge while the run is in flight. The caret beside
the text is a static glyph — it does not blink, because a blinking cursor would
be exactly the decorative animation this part exists to refuse.

---

## Part 6 — The rules that outrank taste

1. Contrast ≥ AA everywhere; the palette is guarded by `tokens.test.ts` and
   every screen is scanned by axe in both themes.
2. Status is never color alone — always an icon and words as well.
3. Numbers that matter are mono, via `MonoNumber`.
4. Destructive actions name their consequence.
5. Action labels persist through their flow (Approve → Approved).
6. Custom tones render identically to preset tones, everywhere.
7. Reduced motion removes signature animation entirely.
8. The app is light + dark; marketing is light-only.
9. A figure nobody reported is absent, never zero — "Syncing…" on a post, no
   delta at all where there is no comparable prior period.
10. A metric moving the wrong way is `warning`, not `destructive`. Reach falling
    is news; it is not an error, and colouring it like one cries wolf on the
    screen where a real failure has to stand out.
