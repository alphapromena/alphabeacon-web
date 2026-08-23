# Customer logo assets

Six real Malaky customers appear in the concept. This directory holds their
**official artwork, exactly as supplied**. Nothing in it is drawn, traced,
lettered, recoloured, cropped out of a screenshot or otherwise reconstructed.

Until a file lands here the customer's `logo` field in
`lib/concept-v2/customers.ts` stays `null`, and the interface renders a neutral
placeholder that is visibly not a logo. That is the intended behaviour: an
approximate mark on a real customer is worse than an honest gap.

## Expected files

| Customer | Path | Status |
| --- | --- | --- |
| Ataccama | `ataccama/ataccama-logo.svg` | outstanding |
| Baker Tilly Saudi Arabia | `baker-tilly-saudi/baker-tilly-logo.svg` | outstanding |
| Inception DAP | `inception-dap/inception-dap-logo.svg` | outstanding |
| Shrimp Joint | `shrimp-joint/shrimp-joint-logo.svg` | outstanding |
| International Language Academy | `ila/ila-logo.png` | **supplied** — official knockout lockup, 500×500, transparent |
| Alpha Pro MENA | `alpha-pro-mena/alpha-pro-logo.svg` | outstanding |

The supplied ILA file is white artwork on transparency, drawn for dark
backgrounds. It therefore looks empty when previewed on a white canvas — that
is correct, not a broken file. The other five should ideally match it: a
knockout or full-colour version that holds on graphite.

## What to supply

- **SVG preferred**, transparent PNG accepted. For PNG, at least 3× the largest
  rendered size — the mark is drawn at 24–40px, so 120px on the short edge is
  the floor.
- **Transparent background.** These sit on dark graphite surfaces.
- **The full official lockup or the official mark alone** — whichever the
  customer's own guidelines designate for small square placements. Not a
  screenshot, not a crop from a social post, not a favicon.
- **Trimmed.** No baked-in white plate and no large empty margin: the artwork
  is placed at its own aspect ratio, so padding inside the file becomes
  padding on the page.

## Wiring one in

Drop the file in, then fill the `logo` field for that customer in
`lib/concept-v2/customers.ts` with its path, intrinsic width, height and alt
text. Nothing else changes — every placement reads that one field, and the
layouts are already sized for it.

## Rules

- Never recolour a customer's mark, including with CSS filters.
- Never letter a company name as a substitute for its logo.
- Never place a customer's logo on Malaky-prepared concept creative in a way
  that implies the customer published it. The card's own label does that work.
