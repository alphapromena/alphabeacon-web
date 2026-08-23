# Malaky brand assets

The official Malaky identity is the supplied Arabic calligraphic artwork. It is
the primary brand mark — it is never redrawn, set in a font, recoloured with CSS
filters, cropped or stretched.

## Expected file

    public/brand/malaky-logo-gold.png

The approved gold version, with transparency preserved, for use on dark
graphite backgrounds: navigation, pricing navigation, footer and other dark
brand moments.

## Wiring it up

`components/concept-v2/MalakyLogo.tsx` holds a single constant:

    const LOGO_ASSET: string | null = null;

Set it to `"/brand/malaky-logo-gold.png"` once the file is committed here. Every
placement on the site reads that one constant, so no other file changes.

## Rules

- Do not recolour the PNG with CSS filters. A light-background version must be
  supplied as a separate asset, not generated from this one.
- Do not embed the artwork as base64 inside components.
- Size with `height` + `width: auto` + `object-fit: contain` so proportions are
  never altered.
- Do not upscale beyond the point where the raster becomes visibly soft. If a
  larger size is needed, request a higher-resolution or vector master.
- The artwork belongs to the website/product layer only. It never appears
  inside the fictional customer marketing outputs (Falak Logistics, Nura
  Living, Meezan Advisory, Dar Sidra).
