# The 13 media capabilities — what each one is for, what you send, what you get

One page per capability, in the same four parts each time: the **name**, the
**usecase** (why a person would reach for it), the **json** you send with the
allowed values written beside every key, and the **output** you get back.

Written in plain words on purpose. The full technical reference is
[`API-REFERENCE.md`](API-REFERENCE.md); this file is the short version.

---

## Read this first — it applies to all 13

**They all go to the same door.**

```
POST /v1/media/jobs
```

Never from a browser. Your backend signs it. The seven service headers plus
`X-APS-Idempotency-Key` are required on every one.

**They all answer the same way.** You get `202` immediately with a **job**, not
a picture. The picture, clip or audio arrives later — either pushed to you as a
`media.outcome` callback, or pulled by you from `GET /v1/media/jobs/:jobId`.

**Reading the json blocks below.** The comment after each key says what may go
there:

- `// fix` — the value never changes. Send it exactly as written.
- `// a | b | c` — pick one of these.
- anything else — the shape and the limits.

The comments are notes for you. Real JSON has no comments, so strip them.

**Four keys exist on all 13** and are not repeated in every block:

```jsonc
{
  "capability": "…",        // fix per capability — the name of the section
  "plan": "balanced",       // balanced | creative | precise. Default balanced.
                            // Five capabilities IGNORE it — each says so.
  "origin": {               // optional, your own bookkeeping. Echoed back, never read.
    "kind": "standalone",   // standalone | linked
    "ref": "your-own-id"    // any string, your id for the thing this is for
  },
  "guidance": []            // extra direction, 0 to 6 items. See below.
}
```

**`guidance` items** are either a plain string, or `{"role": "…", "text": "…"}`
with `text` 1 to 2000 characters. The role says what the text **is**, and the
platform writes the sentence around it:

| `role` | The sentence the platform puts in front of your text |
| --- | --- |
| `headline` | Render this text in the image, exactly as written, as the headline: |
| `palette` | Use this colour palette: |
| `style` | Match this visual style: |
| `subject` | The image must feature this subject: |
| `scene` | Place the subject in this setting: |
| `edit` | Apply this edit to the supplied image, changing nothing else: |
| `motion` | (how the shot moves) |
| `audio` | (what is heard) |
| `instruction` | the default when you send a bare string |

**Shared image `params`.** Where a capability takes image params, these are the
usual ones. Unknown keys are **refused**, not ignored.

| Key | Values |
| --- | --- |
| `aspectRatio` | `1:1` · `16:9` · `9:16` · `4:3` · `3:4` · `3:2` · `2:3` |
| `outputFormat` | `png` · `jpeg` · `webp` — some rows drop `webp` |
| `count` | integer, 1 to 20 |
| `negativePrompt` | text, up to 1000 chars. Not on `plan: precise`. |
| `seed` | integer. Not on `plan: precise`. |

**The output shape, once the job finishes.** Same for all 13:

```jsonc
{
  "jobId": "mjob_…",
  "status": "succeeded",     // queued | submitted | succeeded | failed
  "capability": "…",
  "plan": "balanced",        // or null when the capability picks its own model
  "modelAlias": "image.core",// your app's alias. Never a vendor name.
  "assets": [
    {
      "assetId": "masset_…",
      "kind": "image",       // image | video | audio | document
      "url": "https://…",    // presigned download link, minted fresh on each read
      "expiresAt": "…",      // one hour out
      "meta": { "width": 1024, "height": 1024, "synthetic": true }
    }
  ],
  "createdAt": "…",
  "updatedAt": "…"
}
```

Per capability, only the **number and kind** of assets differ. That is what the
"output" line says each time.

---

## 1. `media.generate`

**Usecase.** You know exactly what picture you want and you want to type it
yourself. No template, no help — the raw door. Reach for it when none of the
twelve below describes the job, or when you already have a prompt that works.

**JSON sent**

```jsonc
{
  "capability": "media.generate",  // fix
  "plan": "balanced",              // balanced | creative | precise
  "kind": "image",                 // image | video. Say nothing and you get an image.
                                   // Only this capability and social-posts.media reach both kinds.
  "prompt": "a flat-vector report cover, deep navy, generous negative space",
                                   // REQUIRED. 1 to 4000 characters. Your own words.
  "params": {
    "aspectRatio": "1:1",          // 1:1 | 16:9 | 9:16 | 4:3 | 3:4 | 3:2 | 2:3
    "outputFormat": "png"          // png | jpeg | webp
  },
  "guidance": [                    // optional, 0 to 6
    { "role": "headline", "text": "Poor data quality costs $12.9M a year" },
                                   // role: headline | palette | style | subject | scene | edit | motion | audio | instruction
    { "role": "palette", "text": "deep navy, slate grey, one teal accent" }
  ],
  "collection": {                  // optional. Only this capability and social-posts.media have it.
    "use": true,                   // true | false
    "hint": "our mark and the product shot"  // 1 to 300 characters
  }
}
```

**Output.** One `image` asset — or one `video` when you asked for `kind: video`.

---

## 2. `images.edit`

**Usecase.** You have a photograph and want one thing about it changed. Swap
the background, remove a distraction, recolour a wall. Everything you did not
mention must survive untouched.

**JSON sent**

```jsonc
{
  "capability": "images.edit",     // fix
  "instruction": "replace the background with a plain deep-navy studio backdrop",
                                   // REQUIRED. 1 to 2000 characters. The change you want.
  "params": {
    "referenceImages": [           // REQUIRED. EXACTLY ONE url. Not two.
      "https://…/your-photo.png"
    ],
    "aspectRatio": "1:1",          // 1:1 | 16:9 | 9:16 | 4:3 | 3:4 | 3:2 | 2:3
    "outputFormat": "png"          // png | jpeg | webp
  }
}
```

`plan` and `kind` are **ignored** here. This capability pins its own model, and
the job comes back with `"plan": null`.

**Output.** One `image` asset — your photo with the one change made.

---

## 3. `photoshoot.generate`

**Usecase.** You have plain photos of a product and want a proper shoot of it
somewhere better. The product stays exactly itself; the room, the light and the
mood are new. It is the shortcut past hiring a studio.

**JSON sent**

```jsonc
{
  "capability": "photoshoot.generate",  // fix
  "params": {
    "referenceImages": [                // REQUIRED. 1 to 4 urls of the subject.
      "https://…/product-1.png",        // More than one is better: identity is learned from variety.
      "https://…/product-2.png"
    ],
    "aspectRatio": "1:1",               // 1:1 | 16:9 | 9:16 | 4:3 | 3:4 | 3:2 | 2:3
    "outputFormat": "png"               // png | jpeg | webp
  },
  "guidance": [                         // REQUIRED. At least 1 item, at most 6.
    { "role": "scene", "text": "on a brushed-steel table in a glass-walled briefing room" },
    { "role": "style", "text": "corporate editorial photography, soft key light" },
    { "role": "palette", "text": "cool neutrals, deep navy, one teal accent" }
  ]
}
```

`plan` and `kind` are **ignored**. Pinned model, so `"plan": null` comes back.

**Output.** One `image` asset — the same product, photographed somewhere new.

---

## 4. `brand-assets.generate`

**Usecase.** You are designing a mark and want several genuinely different
attempts side by side to choose from. Not one picture — a spread to compare.

**JSON sent**

```jsonc
{
  "capability": "brand-assets.generate",  // fix
  "params": {
    "count": 2                            // REQUIRED. 2 to 20. One is not a batch — use media.generate for that.
                                          // Your wallet must cover count x price before anything starts.
  },
  "guidance": [                           // REQUIRED. At least 1 item, at most 6.
    { "role": "subject", "text": "a wordmark for 'Alpha Pro MENA' with a compact abstract mark above it" },
    { "role": "style", "text": "flat, minimal, enterprise-grade — a working mark, not an illustration" },
    { "role": "palette", "text": "deep navy on warm off-white, one teal accent" }
  ]
}
```

`plan` and `kind` are **ignored**. Pinned to the lettering-strong model, so
`"plan": null` comes back.

**Output.** `count` `image` assets, all different takes on the one description.

---

## 5. `logos.generate`

**Usecase.** A new company has no logo yet and you want options from a
description alone. You show the client a wall of them and they point at one.

**JSON sent**

```jsonc
{
  "capability": "logos.generate",  // fix
  "plan": "balanced",              // balanced | creative | precise — real here, $0.03 / $0.06 / $0.211 per image
  "params": {
    "count": 1,                    // REQUIRED. 1 to 20.
    "aspectRatio": "1:1",          // 1:1 | 16:9 | 9:16 | 4:3 | 3:4 | 3:2 | 2:3
    "outputFormat": "png"          // png | jpeg | webp
  },
  "guidance": [                    // REQUIRED. At least 1 item, at most 6.
    { "role": "headline", "text": "Alpha Pro MENA" },
                                   // the exact lettering to draw
    { "role": "subject", "text": "a data-lineage platform; three aligned nodes joined by one line" },
    { "role": "style", "text": "flat, geometric — a working mark for a browser tab and a slide master" },
    { "role": "palette", "text": "deep navy on warm off-white, one teal accent" }
  ]
}
```

The brief the platform adds covers legibility at small sizes, exact lettering
and a clean isolated background. You cannot see or override it.

**Output.** `count` `image` assets, each a different logo direction.

---

## 6. `logos.redesign`

**Usecase.** You already have a logo and it looks dated. You want it modernised
without losing what makes people recognise it. The opposite of starting over.

**JSON sent**

```jsonc
{
  "capability": "logos.redesign",  // fix
  "plan": "balanced",              // balanced | creative | precise — real here
  "params": {
    "referenceImages": [           // REQUIRED. EXACTLY ONE url — the logo you have now.
      "https://…/current-logo.png"
    ],
    "count": 1,                    // REQUIRED. 1 to 20 directions.
    "aspectRatio": "1:1",          // 1:1 | 16:9 | 9:16 | 4:3 | 3:4 | 3:2 | 2:3
    "outputFormat": "png"          // png | jpeg | webp
  },
  "guidance": [                    // optional, 0 to 6
    { "role": "style", "text": "simpler geometry, more negative space, lighter type; keep it recognisable" }
  ]
}
```

The built-in brief says the opposite of `images.edit`'s: keep what makes the
mark recognisable, change the execution.

**Output.** `count` `image` assets, all recognisably the same brand.

---

## 7. `avatars.generate`

**Usecase.** You have photos of a real person — a founder, a staff member — and
you want a clean presenter portrait of them that a talking-head video can
animate later. Their face has to stay their face.

**JSON sent**

```jsonc
{
  "capability": "avatars.generate",  // fix
  "params": {
    "referenceImages": [             // REQUIRED. 1 to 4 photographs of the person.
      "https://…/person-1.jpg"       // Several is better: one frame teaches one angle and one light.
    ],
    "count": 1                       // optional. 1 to 8.
  },
  "guidance": [                      // optional, 0 to 6
    { "role": "style", "text": "corporate headshot, navy blazer, plain light backdrop" }
  ]
}
```

`plan` and `kind` are **ignored**. Pinned model, `"plan": null` comes back.

**Output.** `count` `image` assets — head-and-shoulders, neutral background,
even light. Built to be animated, not to be admired.

---

## 8. `avatars.imagine`

**Usecase.** The same presenter portrait, but you have no photographs and do not
want to use a real person's face. You describe who they are instead.

**JSON sent**

```jsonc
{
  "capability": "avatars.imagine",  // fix
  "instruction": "an Arabian woman in her thirties wearing a hijab",
                                    // REQUIRED. 1 to 600 characters. The whole request.
  "params": {
    "count": 1                      // optional. 1 to 8.
  }
}
```

`plan` and `kind` are **ignored**. Pinned model, `"plan": null` comes back.

**Output.** `count` `image` assets — an invented presenter, framed the same way
as `avatars.generate`.

---

## 9. `avatar.generate`

**Usecase.** You want a **character sheet** of a presenter — the same person
drawn from the front, three-quarter, profile and back, plus a strip of
expressions, all in one picture. It is the reference an artist or a later render
works from, so the person stays consistent across everything you make.

**JSON sent**

```jsonc
{
  "capability": "avatar.generate",  // fix
  "plan": "balanced",               // balanced | creative | precise — its OWN three models,
                                    // $0.03 / $0.06 / $0.211 per image
  "instruction": "a man in his forties with a short grey beard, in a dark blazer",
                                    // REQUIRED. 1 to 600 characters.
                                    // With no photos this is the whole request.
                                    // With photos it is the direction — wardrobe, setting.
  "params": {
    "count": 2,                     // optional. 1 to 8. DEFAULT 2, so you can pick from a pair.
    "referenceImages": [            // optional. 1 to 4 photos.
      "https://…/person.jpg"        // Send them and that person IS the presenter.
    ],                              // Send none and the presenter is invented.
    "aspectRatio": "3:2"            // 1:1 | 16:9 | 9:16 | 4:3 | 3:4 | 3:2 | 2:3
                                    // A sheet is wide — 3:2 or 16:9 reads better than the default 1:1.
  },
  "guidance": []                    // optional, 0 to 6. Rarely needed — the brief knows what a sheet is.
}
```

There is no `prompt` field here.

**Output.** `count` `image` assets, each one a full turnaround sheet.

Then: approve the one your client picked with
`POST /v1/media/assets/:assetId/approve`. It joins your collection, and later
renders can use it.

---

## 10. `video-ads.generate`

**Usecase.** You have one good product still and want it to move — a short
advertisement clip for a feed, without a camera crew.

**JSON sent**

```jsonc
{
  "capability": "video-ads.generate",  // fix
  "plan": "balanced",                  // balanced | creative | precise — real here
  "params": {
    "imageUrl": "https://…/still.png", // REQUIRED. ONE url. This is the clip's FIRST FRAME,
                                       // not reference material. Do not send referenceImages.
    "durationS": 5                     // 5 | 10 only. 10 costs exactly twice 5.
                                       // Leave it out and you are costed as 5.
  },
  "guidance": [                        // REQUIRED. At least 1 item, at most 6.
    { "role": "motion", "text": "slow push-in, the product turning once, ending centred" }
  ]
}
```

Two things get refused here, so know them before you send:

- `params.generateAudio: true` — **refused**. This lane is silent. `false` or
  leaving it out is fine.
- `params.aspectRatio` — **refused**. The frame comes from your source image.

**Output.** One `video` asset, silent.

---

## 11. `voice.speak`

**Usecase.** You have words and you want them spoken aloud — a weekly update, a
voiceover, an announcement in Arabic or English. No microphone, no presenter.

**JSON sent**

```jsonc
{
  "capability": "voice.speak",  // fix
  "plan": "balanced",           // balanced | creative | precise — its OWN three models.
                                // balanced $0.05 per 1000 chars, creative and precise $0.10.
  "prompt": "Welcome to Alpha Pro. Here is what changed this week.",
                                // REQUIRED. 1 to 5000 characters. This is READ ALOUD word for word.
  "params": {
    "voice": "Rachel",          // an APPROVED voice id. Anything else is a 400 before you are billed.
                                // Approved today: "Rachel" (English and Arabic, the stock voice)
                                // and "g3YpdjT1OTh9cunaumJs" (the approved Arabic voice).
                                // Always read the live list from
                                // GET /v1/catalog/capabilities/voice.speak?plan=<plan> —
                                // adding a voice is a catalog change, not a code change.
    "lang": "en",               // two-letter code — en, ar, fr …
                                // On balanced and creative an unsupported language is an ERROR.
                                // On precise it may just be spoken badly.
    "stability": 0.5,           // 0 to 1. 0 expressive and variable, 1 flat and consistent.
    "similarity": 0.75,         // 0 to 1. balanced and creative ONLY — a 400 on precise.
    "speed": 1                  // 0.7 to 1.2. balanced and creative ONLY — a 400 on precise.
  }
}
```

There is no `guidance`, no `instruction` and no `count`. Anything the platform
added would be spoken out loud, so it adds nothing.

**What you pay is exact, not an estimate:** `ceil(characters / 1000) x price`. A
52-character line and a 900-character one both cost one unit.

**Output.** Two assets:

- one `audio` asset — the spoken track. Its length is on `meta.durationS`.
- one `document` asset — character-level timestamps, when the model returns
  them. A `words` array is derived for any language written with spaces,
  Arabic included. For Thai, Japanese and Chinese you get characters only.

---

## 12. `film.generate`

**Usecase.** You want a short film with several shots, not one clip — a wide
establishing shot, then a push-in, then a close-up — and someone speaking over
or inside it. You write the scene list; the platform renders the whole thing in
one go, so nothing is stitched together afterwards.

**JSON sent**

```jsonc
{
  "capability": "film.generate",  // fix
  "plan": "balanced",             // balanced | creative | precise — its OWN three models.
                                  // balanced is the SILENT lane: a film that speaks is refused there.
  "sec": 3,                       // REQUIRED. The whole film's length.
                                  // 3-15 on balanced, 4-15 on creative, 4-30 on precise.
                                  // The scenes' own sec values must add up to this EXACTLY.
  "aspect": "9:16",               // 16:9 | 9:16 | 1:1
  "resolution": "720p",           // 480p | 720p | 1080p | 4k — creative and precise ONLY.
                                  // balanced has no such field and refuses it.
  "audio": true,                  // true | false. Default true. Native ambience on or off.
  "lang": "en",                   // two-letter code. Required when anyone speaks.
  "voice": {
    "id": "Rachel"                // an APPROVED voice id — the same list voice.speak publishes
  },
  "character": {                  // optional — who the presenter is
    "source": "masset_…",         // a collection asset id, OR the literal "generate"
    "desc": "a woman in her thirties, business-casual"  // up to 600 chars, used when source is "generate"
  },
  "scenes": [                     // REQUIRED. 1 to 6 scenes. The order is the cut order.
    {
      "sec": 2,                   // REQUIRED. This scene's length, at least 1.
      "speak": "none",            // talking | voiceover | none. Default none.
                                  // talking = on camera, lips match. voiceover = narration.
                                  // On balanced ONLY "none" is legal.
      "script": "…",              // 1 to 2500 chars. Required when the scene speaks.
                                  // All scripts join into ONE voice call, 5000 chars total.
      "references": ["masset_…"], // 0 to 4 of YOUR collection asset ids — the venue, the product
      "camera": "wide establishing shot of a sunlit café, morning light"
                                  // 1 to 500 chars. A strong hint, not a contract.
    },
    { "sec": 1, "camera": "slow push toward a coffee cup, steam rising" }
  ]
}
```

There is no `prompt`, no `instruction`, no `guidance` and no `count`. Direction
lives on the scenes.

**What you pay is exact:** the film's seconds at the plan's per-second price,
plus the voice by character count, plus the Arabic lip repair when it is due.

**Output.** Up to three assets:

- one `video` asset — the film.
- one `audio` asset — the voice track, when it speaks.
- one `document` asset — the timestamps for that track.

Named failures you can act on: `reference_refused` (the likeness gate said no),
`output_refused` (the vendor's screen said no), `script_unfit` (the script
speaks for longer than the film — shorten it). In every case the voice track you
already paid for is delivered.

---

## 13. `motion.generate`

**Usecase.** You have a picture of your character in your scene, and separately
a video of someone moving the way you want. You want your character doing that
movement. The result looks like your picture and moves like your video.

**JSON sent**

```jsonc
{
  "capability": "motion.generate",  // fix
  "plan": "balanced",               // balanced | creative | precise — its OWN three models.
                                    // $0.07 / $0.112 / $0.126 per second, flat.
  "image": "masset_…",              // REQUIRED. An IMAGE asset id you own.
                                    // The character AND the scene in ONE frame.
                                    // 340-3850 px per side, aspect between 0.4 and 2.5.
  "video": "masset_…",              // REQUIRED. A VIDEO asset id you own — the movement to copy.
                                    // 3 to 30 seconds, 100 MB or less.
                                    // The output is as long as this clip.
  "orientation": "image",           // REQUIRED. image | video.
                                    // Which input the framing follows.
                                    // video: complex motion, source up to 30 s.
                                    // image: camera moves, source up to 10 s.
  "keepSound": true,                // true | false. Default true. Carry the motion clip's own sound over.
  "prompt": "she keeps her warm, natural delivery; soft office light",
                                    // optional. 1 to 2500 chars. The only text here.
  "lang": "ar"                      // two-letter code. Only "ar" does anything —
                                    // it buys an Arabic lip repair pass.
}
```

There is no `sec`, no `aspect` and no `resolution`: the shape follows the image
and the length follows the video. There is no `guidance` and no `count`.

**One pricing trap worth knowing.** When the motion source is one of your own
earlier renders, the platform knows its length and bills the real seconds. When
it is an **upload**, the platform cannot measure it, so it bills the
orientation's whole cap — 10 or 30 seconds. For a short clip, a prior render is
always cheaper.

**Output.** One `video` asset — your character, your scene, the other clip's
movement.

---

## Quick comparison

| Capability | You must send | You get | Can you pick a plan? |
| --- | --- | --- | --- |
| `media.generate` | `prompt` | 1 image or video | yes |
| `images.edit` | `instruction` + 1 image | 1 image | no, pinned |
| `photoshoot.generate` | 1-4 images + guidance | 1 image | no, pinned |
| `brand-assets.generate` | `count` 2-20 + guidance | `count` images | no, pinned |
| `logos.generate` | `count` 1-20 + guidance | `count` images | yes |
| `logos.redesign` | 1 image + `count` | `count` images | yes |
| `avatars.generate` | 1-4 photos | portrait images | no, pinned |
| `avatars.imagine` | `instruction` | portrait images | no, pinned |
| `avatar.generate` | `instruction` | turnaround sheets | yes, own models |
| `video-ads.generate` | `imageUrl` + guidance | 1 silent video | yes |
| `voice.speak` | `prompt` | audio + timings | yes, own models |
| `film.generate` | `sec` + `scenes` | video (+ audio) | yes, own models |
| `motion.generate` | image id + video id + `orientation` | 1 video | yes, own models |

"Pinned" means the platform picks the model and the job comes back with
`"plan": null`. Sending a plan there is not an error; it is simply ignored.
