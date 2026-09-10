/**
 * THE ONE TABLE for Hasan's 13 media capabilities (ORDER HSN-0910/A, the
 * founder's word 2026-09-10; the contract is `Docs/api/media-capabilities.md`,
 * the wire's answers are `Docs/qa/hsn-0910/phase0/`).
 *
 * Everything that knows a capability's SHAPE reads this file and nothing
 * else: the grid, the composer, the client-side validation, the body builder,
 * the cost line, the demo catalog and the e2e specs. They cannot disagree
 * because there is one place for them to agree with.
 *
 * What lives here: the fields each body carries (required or optional, their
 * ranges and enums, which plans hide them), the reference inputs (urls or
 * asset ids, how many), the guidance rules (0–6 items, text 1–2000), the
 * output kinds, and the pricing rule the catalog's price plugs into. What does
 * NOT live here: whether `plan` is selectable (the catalog's `selectable`,
 * read on the wire — never hardcoded), the prices themselves (the catalog's
 * decimal strings), and the approved voice list (the catalog per plan).
 *
 * THE VALIDATION LAW (decisions.md HSN-0910): the UI refuses what the
 * document refuses, so a user never pays a round-trip for a known 400 — and a
 * 400 that still arrives renders as itself, because the wire remains the judge
 * and its sentence names no field (open-item 49).
 *
 * The document's own values are the source of every limit below. Where the
 * wire disagreed with the document in Phase 0, the wire won and the note says
 * so: `motion.generate` sends no `lang` (item 57), and the 1–4 reference range
 * is enforced here because above four the upstream answers 502, not 400
 * (item 58).
 */
import type { ApiPlan } from '@/api/types'

export const MEDIA_CAPABILITY_IDS = [
  'media.generate',
  'images.edit',
  'photoshoot.generate',
  'brand-assets.generate',
  'logos.generate',
  'logos.redesign',
  'avatars.generate',
  'avatars.imagine',
  'avatar.generate',
  'video-ads.generate',
  'voice.speak',
  'film.generate',
  'motion.generate',
] as const
export type MediaCapabilityId = (typeof MEDIA_CAPABILITY_IDS)[number]

export function isMediaCapabilityId(value: string): value is MediaCapabilityId {
  return (MEDIA_CAPABILITY_IDS as readonly string[]).includes(value)
}

export const MEDIA_PLANS: readonly ApiPlan[] = ['balanced', 'creative', 'precise']

export type OutputKind = 'image' | 'video' | 'audio' | 'document'

/** The nine guidance roles the platform writes a sentence around. */
export const GUIDANCE_ROLES = [
  'headline',
  'palette',
  'style',
  'subject',
  'scene',
  'edit',
  'motion',
  'audio',
  'instruction',
] as const
export type GuidanceRole = (typeof GUIDANCE_ROLES)[number]
export interface GuidanceItem {
  role: GuidanceRole
  text: string
}
export const GUIDANCE_MAX = 6
export const GUIDANCE_TEXT_MIN = 1
export const GUIDANCE_TEXT_MAX = 2000

/** The shared image params, as the document lists them. */
export const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'] as const
export const OUTPUT_FORMATS = ['png', 'jpeg', 'webp'] as const
export const COUNT_MAX = 20
export const NEGATIVE_PROMPT_MAX = 1000

/** The film's own vocabulary. */
export const FILM_ASPECTS = ['16:9', '9:16', '1:1'] as const
export const FILM_RESOLUTIONS = ['480p', '720p', '1080p', '4k'] as const
export const FILM_SPEAK = ['none', 'talking', 'voiceover'] as const
export type FilmSpeak = (typeof FILM_SPEAK)[number]
/** The whole film's length, per plan (the scenes must add up to it exactly). */
export const FILM_SEC_RANGE: Readonly<Record<ApiPlan, { min: number; max: number }>> = {
  balanced: { min: 3, max: 15 },
  creative: { min: 4, max: 15 },
  precise: { min: 4, max: 30 },
}
export const FILM_SCENES_MIN = 1
export const FILM_SCENES_MAX = 6
export const FILM_SCENE_SEC_MIN = 1
export const FILM_SCRIPT_MAX = 2500
export const FILM_SCRIPTS_TOTAL_MAX = 5000
export const FILM_CAMERA_MAX = 500
export const FILM_CHARACTER_DESC_MAX = 600
export const FILM_REFERENCES_MAX = 4
export interface FilmScene {
  sec: number
  speak: FilmSpeak
  script: string
  /** Collection asset ids — the venue, the product. */
  references: string[]
  camera: string
}
export interface FilmCharacter {
  /** A collection asset id, the literal "generate", or empty for none. */
  source: string
  desc: string
}

/** The video ad's only two lengths; 10 costs exactly twice 5. */
export const VIDEO_AD_DURATIONS = [5, 10] as const
export const VIDEO_AD_DURATION_DEFAULT = 5

/** The voice's ranges. `similarity` and `speed` exist on balanced and creative only. */
export const VOICE_STABILITY = { min: 0, max: 1, default: 0.5 } as const
export const VOICE_SIMILARITY = { min: 0, max: 1, default: 0.75 } as const
export const VOICE_SPEED = { min: 0.7, max: 1.2, default: 1 } as const
export const VOICE_PROMPT_MAX = 5000
export const VOICE_TEXT_UNIT_CHARS = 1000
export const LANG_PATTERN = /^[a-z]{2}$/

/**
 * Motion: the orientation's cap is what an UPLOADED clip is billed at, because
 * the platform cannot measure it; a prior render is billed at its real length
 * (the document's pricing trap, in the UI copy).
 */
export const MOTION_CAP_S: Readonly<Record<'image' | 'video', number>> = { image: 10, video: 30 }
export const MOTION_ORIENTATIONS = ['image', 'video'] as const
/** The still's floors, from the document — NOT checked by the door at intake (Phase 0). */
export const MOTION_STILL = { minPx: 340, maxPx: 3850, aspectMin: 0.4, aspectMax: 2.5 } as const
export const MOTION_CLIP = { minS: 3, maxS: 30, maxBytes: 100 * 1024 * 1024 } as const
export const MOTION_PROMPT_MAX = 2500

export const AVATAR_INSTRUCTION_MAX = 600
export const EDIT_INSTRUCTION_MAX = 2000
export const PROMPT_MAX = 4000
export const COLLECTION_HINT_MAX = 300

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

interface FieldBase {
  /** The composer's key for the value. */
  key: string
  /** Where the value goes in the body: a dot path (`params.count`, `sec`, `voice.id`). */
  path: string
  label: string
  hint?: string
  required?: boolean
  /** The plans on which the field is NOT offered (the document's "not on precise"). */
  hiddenOn?: readonly ApiPlan[]
}
export type CapabilityField =
  | (FieldBase & { kind: 'text'; multiline?: boolean; min: number; max: number })
  | (FieldBase & {
      kind: 'enum'
      options: readonly string[]
      default?: string
      /**
       * When the catalog's schema for the resolved row carries an enum for
       * this params key, its values replace `options` (some rows drop `webp`;
       * the approved voices live only in the catalog).
       */
      optionsFromSchema?: string
    })
  | (FieldBase & { kind: 'integer'; min: number; max: number; default?: number })
  | (FieldBase & { kind: 'number'; min: number; max: number; step: number; default?: number })
  | (FieldBase & { kind: 'boolean'; default: boolean })
  | (FieldBase & {
      kind: 'assets'
      /** `url` = our read-presigned url of each asset; `id` = the `masset_…` id itself. */
      mode: 'url' | 'id'
      assetKind: 'image' | 'video'
      min: number
      max: number
    })
  | (FieldBase & { kind: 'guidance'; min: number; max: number })
  | (FieldBase & { kind: 'scenes' })
  | (FieldBase & { kind: 'character' })

export type PricingRule =
  /** `count × price`, or one image when there is no count field. */
  | { unit: 'images'; countKey?: string }
  /** `ceil(characters / 1000) × price` — exact, not an estimate. */
  | { unit: 'audio_text_units'; textKey: string }
  /** `seconds × price`; the seconds come from a field. */
  | { unit: 'video_seconds'; secondsKey: string }
  /** `seconds × price`; the seconds are the motion clip's real length, or the orientation's cap. */
  | { unit: 'video_seconds'; motion: true }

export interface MediaCapability {
  id: MediaCapabilityId
  /** The card's name — the accessible label, the composer's heading. */
  name: string
  /** One line from the document's usecase, in the user's words. */
  usecase: string
  /** What the document says about `plan`; the catalog's `selectable` is what the composer reads. */
  documentPlan: 'selectable' | 'ignored'
  /** The asset kinds a finished job carries. */
  output: readonly OutputKind[]
  /** `image` | `video` when the body carries `kind`; only media.generate does. */
  kindField?: boolean
  fields: readonly CapabilityField[]
  pricing: PricingRule
  /** The trap the static e2e drives — the document's own refusal, in words. */
  trap: { field: string; description: string }
  /** A note the composer shows verbatim (the pricing trap, the silent lane). */
  note?: string
}

const guidance = (min: number, hint: string): CapabilityField => ({
  key: 'guidance',
  path: 'guidance',
  kind: 'guidance',
  label: 'Direction',
  hint,
  min,
  max: GUIDANCE_MAX,
  required: min > 0,
})
const aspectRatio = (defaultValue = '1:1'): CapabilityField => ({
  key: 'aspectRatio',
  path: 'params.aspectRatio',
  kind: 'enum',
  label: 'Aspect ratio',
  options: ASPECT_RATIOS,
  default: defaultValue,
  optionsFromSchema: 'aspectRatio',
})
const outputFormat: CapabilityField = {
  key: 'outputFormat',
  path: 'params.outputFormat',
  kind: 'enum',
  label: 'Format',
  options: OUTPUT_FORMATS,
  default: 'png',
  optionsFromSchema: 'outputFormat',
}
const count = (
  min: number,
  max: number,
  defaultValue: number,
  required: boolean,
): CapabilityField => ({
  key: 'count',
  path: 'params.count',
  kind: 'integer',
  label: 'How many',
  hint: `${min} to ${max}. Your wallet must cover every one before anything starts.`,
  min,
  max,
  default: defaultValue,
  required,
})
const referenceImages = (min: number, max: number, hint: string): CapabilityField => ({
  key: 'referenceImages',
  path: 'params.referenceImages',
  kind: 'assets',
  mode: 'url',
  assetKind: 'image',
  label: max === 1 ? 'Reference image' : 'Reference images',
  hint,
  min,
  max,
  required: min > 0,
})
const negativePrompt: CapabilityField = {
  key: 'negativePrompt',
  path: 'params.negativePrompt',
  kind: 'text',
  label: 'Avoid',
  hint: 'What must not appear. Not on precise.',
  min: 0,
  max: NEGATIVE_PROMPT_MAX,
  hiddenOn: ['precise'],
}
const seed: CapabilityField = {
  key: 'seed',
  path: 'params.seed',
  kind: 'integer',
  label: 'Seed',
  hint: 'The same seed and prompt repeat a result. Not on precise.',
  min: 0,
  max: 4294967295,
  hiddenOn: ['precise'],
}

export const MEDIA_CAPABILITIES: readonly MediaCapability[] = [
  {
    id: 'media.generate',
    name: 'Generate',
    usecase: 'You know exactly what picture or clip you want and you want to type it yourself.',
    documentPlan: 'selectable',
    output: ['image', 'video'],
    kindField: true,
    fields: [
      {
        key: 'kind',
        path: 'kind',
        kind: 'enum',
        label: 'Image or video',
        options: ['image', 'video'],
        default: 'image',
        required: true,
      },
      {
        key: 'prompt',
        path: 'prompt',
        kind: 'text',
        multiline: true,
        label: 'What should it show?',
        min: 1,
        max: PROMPT_MAX,
        required: true,
      },
      aspectRatio(),
      outputFormat,
      negativePrompt,
      seed,
      guidance(0, 'Optional. A headline to render, a palette, a style, a subject, a setting.'),
      {
        key: 'collectionUse',
        path: 'collection.use',
        kind: 'boolean',
        label: 'Use our brand files',
        hint: 'The logo and the uploads in Knowledge are offered to the render.',
        default: true,
      },
      {
        key: 'collectionHint',
        path: 'collection.hint',
        kind: 'text',
        label: 'Which files matter',
        hint: 'Optional, up to 300 characters — "our mark and the product shot".',
        min: 0,
        max: COLLECTION_HINT_MAX,
      },
    ],
    pricing: { unit: 'images' },
    trap: { field: 'prompt', description: 'an empty prompt' },
  },
  {
    id: 'images.edit',
    name: 'Edit a photo',
    usecase: 'One thing about a photograph changed; everything you did not mention survives.',
    documentPlan: 'ignored',
    output: ['image'],
    fields: [
      {
        key: 'instruction',
        path: 'instruction',
        kind: 'text',
        multiline: true,
        label: 'The change',
        hint: '"Replace the background with a plain deep-navy studio backdrop."',
        min: 1,
        max: EDIT_INSTRUCTION_MAX,
        required: true,
      },
      referenceImages(1, 1, 'Exactly one photograph.'),
      aspectRatio(),
      outputFormat,
    ],
    pricing: { unit: 'images' },
    trap: { field: 'referenceImages', description: 'two reference images' },
  },
  {
    id: 'photoshoot.generate',
    name: 'Product photoshoot',
    usecase: 'Plain photos of a product, shot somewhere better — the product stays itself.',
    documentPlan: 'ignored',
    output: ['image'],
    fields: [
      referenceImages(1, 4, 'One to four photos of the subject. More is better.'),
      aspectRatio(),
      outputFormat,
      guidance(1, 'At least one line: the setting, the style, the palette.'),
    ],
    pricing: { unit: 'images' },
    trap: { field: 'referenceImages', description: 'five reference images' },
  },
  {
    id: 'brand-assets.generate',
    name: 'Brand mark options',
    usecase: 'Several genuinely different attempts at a mark, side by side, to choose from.',
    documentPlan: 'ignored',
    output: ['image'],
    fields: [
      count(2, COUNT_MAX, 2, true),
      guidance(1, 'At least one line: the subject, the style, the palette.'),
    ],
    pricing: { unit: 'images', countKey: 'count' },
    trap: { field: 'count', description: 'a count of one' },
  },
  {
    id: 'logos.generate',
    name: 'New logo',
    usecase: 'Logo options from a description alone — a wall of them to point at.',
    documentPlan: 'selectable',
    output: ['image'],
    fields: [
      count(1, COUNT_MAX, 1, true),
      aspectRatio(),
      outputFormat,
      guidance(1, 'The exact lettering as a headline, then the subject, the style, the palette.'),
    ],
    pricing: { unit: 'images', countKey: 'count' },
    trap: { field: 'count', description: 'a count of twenty-one' },
  },
  {
    id: 'logos.redesign',
    name: 'Logo redesign',
    usecase: 'A dated logo modernised without losing what makes it recognisable.',
    documentPlan: 'selectable',
    output: ['image'],
    fields: [
      referenceImages(1, 1, 'The logo you have now.'),
      count(1, COUNT_MAX, 1, true),
      aspectRatio(),
      outputFormat,
      guidance(0, 'Optional: "simpler geometry, more negative space, lighter type".'),
    ],
    pricing: { unit: 'images', countKey: 'count' },
    trap: { field: 'referenceImages', description: 'no reference image' },
  },
  {
    id: 'avatars.generate',
    name: 'Presenter from photos',
    usecase: 'A clean presenter portrait of a real person, built to be animated later.',
    documentPlan: 'ignored',
    output: ['image'],
    fields: [
      referenceImages(1, 4, 'One to four photographs of the person. Several angles help.'),
      count(1, 8, 1, false),
      guidance(0, 'Optional: "corporate headshot, navy blazer, plain light backdrop".'),
    ],
    pricing: { unit: 'images', countKey: 'count' },
    trap: { field: 'count', description: 'a count of nine' },
  },
  {
    id: 'avatars.imagine',
    name: 'Presenter, imagined',
    usecase: 'The same portrait with no photographs — you describe who they are.',
    documentPlan: 'ignored',
    output: ['image'],
    fields: [
      {
        key: 'instruction',
        path: 'instruction',
        kind: 'text',
        multiline: true,
        label: 'Who they are',
        hint: 'Up to 600 characters — "an Arabian woman in her thirties wearing a hijab".',
        min: 1,
        max: AVATAR_INSTRUCTION_MAX,
        required: true,
      },
      count(1, 8, 1, false),
    ],
    pricing: { unit: 'images', countKey: 'count' },
    trap: { field: 'instruction', description: 'a 601-character description' },
  },
  {
    id: 'avatar.generate',
    name: 'Character sheet',
    usecase: 'Front, three-quarter, profile and back, plus expressions — one picture to work from.',
    documentPlan: 'selectable',
    output: ['image'],
    fields: [
      {
        key: 'instruction',
        path: 'instruction',
        kind: 'text',
        multiline: true,
        label: 'Who they are',
        hint: 'Up to 600 characters. With photos it is the direction — wardrobe, setting.',
        min: 1,
        max: AVATAR_INSTRUCTION_MAX,
        required: true,
      },
      count(1, 8, 2, false),
      referenceImages(0, 4, 'Optional. Send photos and that person is the presenter.'),
      aspectRatio('3:2'),
      guidance(0, 'Rarely needed — the brief knows what a sheet is.'),
    ],
    pricing: { unit: 'images', countKey: 'count' },
    trap: { field: 'count', description: 'a count of nine' },
  },
  {
    id: 'video-ads.generate',
    name: 'Video ad from a still',
    usecase: 'One good product still, moving — a short silent clip for a feed.',
    documentPlan: 'selectable',
    output: ['video'],
    fields: [
      {
        key: 'imageUrl',
        path: 'params.imageUrl',
        kind: 'assets',
        mode: 'url',
        assetKind: 'image',
        label: 'The first frame',
        hint: 'One still. The clip starts from it; its shape sets the frame.',
        min: 1,
        max: 1,
        required: true,
      },
      {
        key: 'durationS',
        path: 'params.durationS',
        kind: 'enum',
        label: 'Length',
        hint: '5 or 10 seconds. 10 costs exactly twice 5.',
        options: VIDEO_AD_DURATIONS.map(String),
        default: String(VIDEO_AD_DURATION_DEFAULT),
        required: true,
      },
      guidance(1, 'At least one line of motion: "slow push-in, the product turning once".'),
    ],
    pricing: { unit: 'video_seconds', secondsKey: 'durationS' },
    trap: { field: 'durationS', description: 'a length of eight seconds' },
    note: 'This lane is silent, and the frame comes from your still.',
  },
  {
    id: 'voice.speak',
    name: 'Voiceover',
    usecase: 'Words spoken aloud, in English or Arabic — no microphone, no presenter.',
    documentPlan: 'selectable',
    output: ['audio', 'document'],
    fields: [
      {
        key: 'prompt',
        path: 'prompt',
        kind: 'text',
        multiline: true,
        label: 'The words',
        hint: 'Read aloud exactly as written. Up to 5000 characters; every 1000 is one unit.',
        min: 1,
        max: VOICE_PROMPT_MAX,
        required: true,
      },
      {
        key: 'voice',
        path: 'params.voice',
        kind: 'enum',
        label: 'Voice',
        hint: 'The approved voices for this quality.',
        options: [],
        optionsFromSchema: 'voice',
        required: true,
      },
      {
        key: 'lang',
        path: 'params.lang',
        kind: 'text',
        label: 'Language',
        hint: 'A two-letter code — en, ar, fr.',
        min: 2,
        max: 2,
        required: true,
      },
      {
        key: 'stability',
        path: 'params.stability',
        kind: 'number',
        label: 'Stability',
        hint: '0 is expressive and variable, 1 is flat and consistent.',
        min: VOICE_STABILITY.min,
        max: VOICE_STABILITY.max,
        step: 0.05,
        default: VOICE_STABILITY.default,
      },
      {
        key: 'similarity',
        path: 'params.similarity',
        kind: 'number',
        label: 'Similarity',
        min: VOICE_SIMILARITY.min,
        max: VOICE_SIMILARITY.max,
        step: 0.05,
        default: VOICE_SIMILARITY.default,
        hiddenOn: ['precise'],
      },
      {
        key: 'speed',
        path: 'params.speed',
        kind: 'number',
        label: 'Speed',
        min: VOICE_SPEED.min,
        max: VOICE_SPEED.max,
        step: 0.05,
        default: VOICE_SPEED.default,
        hiddenOn: ['precise'],
      },
    ],
    pricing: { unit: 'audio_text_units', textKey: 'prompt' },
    trap: { field: 'voice', description: 'a voice that is not approved' },
  },
  {
    id: 'film.generate',
    name: 'Short film',
    usecase: 'Several shots and someone speaking, rendered in one go — nothing stitched after.',
    documentPlan: 'selectable',
    output: ['video', 'audio', 'document'],
    fields: [
      {
        key: 'sec',
        path: 'sec',
        kind: 'integer',
        label: 'Length in seconds',
        hint: 'The scenes below must add up to this exactly.',
        min: 3,
        max: 30,
        default: 3,
        required: true,
      },
      {
        key: 'aspect',
        path: 'aspect',
        kind: 'enum',
        label: 'Aspect',
        options: FILM_ASPECTS,
        default: '9:16',
        required: true,
      },
      {
        key: 'resolution',
        path: 'resolution',
        kind: 'enum',
        label: 'Resolution',
        hint: 'Creative and precise only; balanced has no such setting.',
        options: FILM_RESOLUTIONS,
        default: '720p',
        hiddenOn: ['balanced'],
      },
      {
        key: 'audio',
        path: 'audio',
        kind: 'boolean',
        label: 'Native ambience',
        default: true,
      },
      {
        key: 'lang',
        path: 'lang',
        kind: 'text',
        label: 'Language',
        hint: 'A two-letter code. Required when anyone speaks.',
        min: 2,
        max: 2,
      },
      {
        key: 'voiceId',
        path: 'voice.id',
        kind: 'enum',
        label: 'Voice',
        hint: 'The approved voices, when a scene speaks.',
        options: [],
        optionsFromSchema: 'voice',
      },
      {
        key: 'character',
        path: 'character',
        kind: 'character',
        label: 'The presenter',
        hint: 'Optional: one of your assets, or a described person the platform generates.',
      },
      {
        key: 'scenes',
        path: 'scenes',
        kind: 'scenes',
        label: 'Scenes',
        hint: 'One to six, in cut order.',
        required: true,
      },
    ],
    pricing: { unit: 'video_seconds', secondsKey: 'sec' },
    trap: { field: 'scenes', description: 'scenes that do not add up to the length' },
    note: 'On balanced the film is silent: no scene may speak and there is no resolution to choose.',
  },
  {
    id: 'motion.generate',
    name: 'Motion transfer',
    usecase: 'Your character in your scene, moving the way a clip of someone else moves.',
    documentPlan: 'selectable',
    output: ['video'],
    fields: [
      {
        key: 'image',
        path: 'image',
        kind: 'assets',
        mode: 'id',
        assetKind: 'image',
        label: 'The still',
        hint: 'The character AND the scene in one frame, 340 to 3850 px per side.',
        min: 1,
        max: 1,
        required: true,
      },
      {
        key: 'video',
        path: 'video',
        kind: 'assets',
        mode: 'id',
        assetKind: 'video',
        label: 'The movement',
        hint: 'A clip of 3 to 30 seconds, 100 MB or less. The result is as long as this clip.',
        min: 1,
        max: 1,
        required: true,
      },
      {
        key: 'orientation',
        path: 'orientation',
        kind: 'enum',
        label: 'Framing follows',
        hint: 'video: complex motion, a source up to 30 s. image: camera moves, a source up to 10 s.',
        options: MOTION_ORIENTATIONS,
        default: 'image',
        required: true,
      },
      {
        key: 'keepSound',
        path: 'keepSound',
        kind: 'boolean',
        label: "Keep the clip's own sound",
        default: true,
      },
      {
        key: 'prompt',
        path: 'prompt',
        kind: 'text',
        multiline: true,
        label: 'Direction',
        hint: 'Optional, up to 2500 characters — "she keeps her warm, natural delivery".',
        min: 0,
        max: MOTION_PROMPT_MAX,
      },
    ],
    pricing: { unit: 'video_seconds', motion: true },
    trap: { field: 'orientation', description: 'no framing choice' },
    note: 'An uploaded clip is billed at the framing’s whole cap (10 or 30 seconds) because the platform cannot measure it; a clip you rendered here is billed at its real length.',
  },
]

export function mediaCapability(id: MediaCapabilityId): MediaCapability {
  const found = MEDIA_CAPABILITIES.find((entry) => entry.id === id)
  if (!found) throw new Error(`unknown media capability ${id}`)
  return found
}

/** The card image, by id — a plain file Abdullah may replace (addendum A2). */
export function cardImagePath(id: MediaCapabilityId): string {
  return `/studio/cards/${id}.webp`
}

/** The fields the composer shows on a plan (the document's "not on precise"). */
export function fieldsOnPlan(
  capability: MediaCapability,
  plan: ApiPlan | null,
): readonly CapabilityField[] {
  return capability.fields.filter((field) => !plan || !field.hiddenOn?.includes(plan))
}

// ---------------------------------------------------------------------------
// Values, defaults, validation
// ---------------------------------------------------------------------------

/** What the composer holds per field key: text, a number, a flag, ids, guidance, scenes, a character. */
export type FieldValue =
  string | number | boolean | string[] | GuidanceItem[] | FilmScene[] | FilmCharacter | undefined
export type CapabilityValues = Record<string, FieldValue>

export function emptyScene(sec = FILM_SCENE_SEC_MIN): FilmScene {
  return { sec, speak: 'none', script: '', references: [], camera: '' }
}

export function defaultValues(capability: MediaCapability): CapabilityValues {
  const values: CapabilityValues = {}
  for (const field of capability.fields) {
    switch (field.kind) {
      case 'text':
        values[field.key] = ''
        break
      case 'enum':
        values[field.key] = field.default ?? field.options[0] ?? ''
        break
      case 'integer':
      case 'number':
        values[field.key] = field.default
        break
      case 'boolean':
        values[field.key] = field.default
        break
      case 'assets':
        values[field.key] = []
        break
      case 'guidance':
        values[field.key] = []
        break
      case 'scenes':
        values[field.key] = [emptyScene(3)]
        break
      case 'character':
        values[field.key] = { source: '', desc: '' }
        break
    }
  }
  return values
}

export interface ValidationIssue {
  key: string
  message: string
}

const asString = (value: FieldValue) => (typeof value === 'string' ? value : '')
const asNumber = (value: FieldValue) => (typeof value === 'number' ? value : NaN)
export const asIds = (value: FieldValue): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
export const asGuidance = (value: FieldValue): GuidanceItem[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is GuidanceItem =>
          typeof entry === 'object' && entry !== null && 'role' in entry && 'text' in entry,
      )
    : []
export const asScenes = (value: FieldValue): FilmScene[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is FilmScene =>
          typeof entry === 'object' && entry !== null && 'sec' in entry && 'camera' in entry,
      )
    : []
export const asCharacter = (value: FieldValue): FilmCharacter =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && 'source' in value
    ? value
    : { source: '', desc: '' }

/**
 * THE VALIDATION LAW: every refusal the document states, checked here so the
 * user never pays a round-trip for a known 400. The wire remains the judge.
 */
export function validateCapabilityInput(
  capability: MediaCapability,
  plan: ApiPlan | null,
  values: CapabilityValues,
  options: { voiceOptions?: readonly string[] } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const push = (key: string, message: string) => issues.push({ key, message })
  const fields = fieldsOnPlan(capability, plan)

  for (const field of fields) {
    const value = values[field.key]
    switch (field.kind) {
      case 'text': {
        const text = asString(value).trim()
        if (field.required && text.length < Math.max(field.min, 1)) {
          push(field.key, `${field.label} is required.`)
        } else if (text.length > field.max) {
          push(field.key, `${field.label} is over ${field.max} characters.`)
        } else if (text.length > 0 && text.length < field.min) {
          push(field.key, `${field.label} needs at least ${field.min} characters.`)
        }
        if (
          (field.key === 'lang' || field.path.endsWith('.lang')) &&
          text &&
          !LANG_PATTERN.test(text)
        ) {
          push(field.key, `${field.label} is a two-letter code like en or ar.`)
        }
        break
      }
      case 'enum': {
        const chosen = asString(value)
        const allowed =
          field.optionsFromSchema === 'voice' ? (options.voiceOptions ?? []) : field.options
        if (field.required && !chosen) push(field.key, `${field.label} is required.`)
        else if (chosen && allowed.length > 0 && !allowed.includes(chosen)) {
          push(field.key, `${field.label}: "${chosen}" is not one of the allowed values.`)
        }
        break
      }
      case 'integer':
      case 'number': {
        const number = asNumber(value)
        if (Number.isNaN(number)) {
          if (field.required) push(field.key, `${field.label} is required.`)
          break
        }
        if (field.kind === 'integer' && !Number.isInteger(number)) {
          push(field.key, `${field.label} must be a whole number.`)
        } else if (number < field.min || number > field.max) {
          push(field.key, `${field.label} must be between ${field.min} and ${field.max}.`)
        }
        break
      }
      case 'assets': {
        const ids = asIds(value)
        if (ids.length < field.min) {
          push(
            field.key,
            field.min === 1 && field.max === 1
              ? `${field.label} is required — exactly one.`
              : `${field.label}: at least ${field.min} needed.`,
          )
        } else if (ids.length > field.max) {
          push(field.key, `${field.label}: at most ${field.max} — you have ${ids.length}.`)
        }
        break
      }
      case 'guidance': {
        const items = asGuidance(value)
        if (items.length < field.min) push(field.key, 'At least one line of direction is needed.')
        if (items.length > field.max) push(field.key, `At most ${field.max} lines of direction.`)
        items.forEach((item, index) => {
          const text = item.text.trim()
          if (text.length < GUIDANCE_TEXT_MIN)
            push(field.key, `Direction line ${index + 1} is empty.`)
          else if (text.length > GUIDANCE_TEXT_MAX) {
            push(field.key, `Direction line ${index + 1} is over ${GUIDANCE_TEXT_MAX} characters.`)
          }
          if (!(GUIDANCE_ROLES as readonly string[]).includes(item.role)) {
            push(field.key, `Direction line ${index + 1} has an unknown role.`)
          }
        })
        break
      }
      case 'character': {
        const character = asCharacter(value)
        if (character.desc.length > FILM_CHARACTER_DESC_MAX) {
          push(
            field.key,
            `The presenter's description is over ${FILM_CHARACTER_DESC_MAX} characters.`,
          )
        }
        if (character.source === 'generate' && character.desc.trim().length === 0) {
          push(field.key, 'A generated presenter needs a description.')
        }
        break
      }
      case 'scenes':
        // Validated below with the film's cross-field rules.
        break
      case 'boolean':
        break
    }
  }

  if (capability.id === 'film.generate') {
    const effectivePlan = plan ?? 'balanced'
    const range = FILM_SEC_RANGE[effectivePlan]
    const sec = asNumber(values.sec)
    if (!Number.isNaN(sec) && (sec < range.min || sec > range.max)) {
      push('sec', `On ${effectivePlan} the film is ${range.min} to ${range.max} seconds.`)
    }
    const scenes = asScenes(values.scenes)
    if (scenes.length < FILM_SCENES_MIN) push('scenes', 'At least one scene.')
    if (scenes.length > FILM_SCENES_MAX) push('scenes', `At most ${FILM_SCENES_MAX} scenes.`)
    let speaks = false
    let scriptTotal = 0
    scenes.forEach((scene, index) => {
      const n = index + 1
      if (!Number.isInteger(scene.sec) || scene.sec < FILM_SCENE_SEC_MIN) {
        push('scenes', `Scene ${n}: at least ${FILM_SCENE_SEC_MIN} second, whole seconds.`)
      }
      if (!FILM_SPEAK.includes(scene.speak)) push('scenes', `Scene ${n}: unknown speak value.`)
      if (effectivePlan === 'balanced' && scene.speak !== 'none') {
        push('scenes', `Scene ${n}: on balanced nobody speaks — choose creative or precise.`)
      }
      if (scene.speak !== 'none') {
        speaks = true
        const script = scene.script.trim()
        if (script.length === 0) push('scenes', `Scene ${n} speaks but has no script.`)
        if (script.length > FILM_SCRIPT_MAX) {
          push('scenes', `Scene ${n}: the script is over ${FILM_SCRIPT_MAX} characters.`)
        }
        scriptTotal += script.length
      }
      if (scene.references.length > FILM_REFERENCES_MAX) {
        push('scenes', `Scene ${n}: at most ${FILM_REFERENCES_MAX} references.`)
      }
      if (scene.camera.length > FILM_CAMERA_MAX) {
        push('scenes', `Scene ${n}: the camera note is over ${FILM_CAMERA_MAX} characters.`)
      }
    })
    if (scriptTotal > FILM_SCRIPTS_TOTAL_MAX) {
      push('scenes', `All scripts together are over ${FILM_SCRIPTS_TOTAL_MAX} characters.`)
    }
    const sum = scenes.reduce(
      (total, scene) => total + (Number.isFinite(scene.sec) ? scene.sec : 0),
      0,
    )
    if (!Number.isNaN(sec) && scenes.length > 0 && sum !== sec) {
      push('scenes', `The scenes add up to ${sum} seconds; the film is ${sec}.`)
    }
    if (speaks) {
      if (!LANG_PATTERN.test(asString(values.lang).trim())) {
        push('lang', 'A language is required when a scene speaks.')
      }
      if (!asString(values.voiceId)) push('voiceId', 'A voice is required when a scene speaks.')
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// The body
// ---------------------------------------------------------------------------

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.')
  let cursor = target
  for (const part of parts.slice(0, -1)) {
    const next = cursor[part]
    if (typeof next !== 'object' || next === null) cursor[part] = {}
    cursor = cursor[part] as Record<string, unknown>
  }
  cursor[parts[parts.length - 1]] = value
}

export interface BuildBodyOptions {
  /** `true` when the catalog said `selectable` — the plan rides the body; pinned capabilities send none. */
  includePlan: boolean
  /** Our read-presigned url per asset id, minted at submit time for `url` fields. */
  urls?: Record<string, string>
  /** Our own bookkeeping, echoed back and never read. */
  originRef?: string
}

/**
 * The body, from the table: each field's value at its path, empty optional
 * fields omitted, `origin` on every body. A `url` asset field carries our
 * read-presigned url per id; an `id` field carries the ids themselves.
 */
export function buildCapabilityBody(
  capability: MediaCapability,
  plan: ApiPlan | null,
  values: CapabilityValues,
  options: BuildBodyOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = { capability: capability.id }
  if (options.includePlan && plan) body.plan = plan
  for (const field of fieldsOnPlan(capability, plan)) {
    const value = values[field.key]
    switch (field.kind) {
      case 'text': {
        const text = asString(value).trim()
        if (text.length > 0) setPath(body, field.path, text)
        break
      }
      case 'enum': {
        const chosen = asString(value)
        if (!chosen) break
        // The video ad's length is a number on the wire; every other enum is a string.
        setPath(body, field.path, field.key === 'durationS' ? Number(chosen) : chosen)
        break
      }
      case 'integer':
      case 'number': {
        const number = asNumber(value)
        if (!Number.isNaN(number)) setPath(body, field.path, number)
        break
      }
      case 'boolean':
        if (typeof value === 'boolean') setPath(body, field.path, value)
        break
      case 'assets': {
        const ids = asIds(value)
        if (ids.length === 0) break
        const items = field.mode === 'url' ? ids.map((id) => options.urls?.[id] ?? id) : ids
        setPath(
          body,
          field.path,
          field.max === 1 && field.mode === 'id'
            ? items[0]
            : field.key === 'imageUrl'
              ? items[0]
              : items,
        )
        break
      }
      case 'guidance': {
        const items = asGuidance(value)
          .map((item) => ({ role: item.role, text: item.text.trim() }))
          .filter((item) => item.text.length > 0)
        if (items.length > 0 || field.min > 0) setPath(body, field.path, items)
        break
      }
      case 'character': {
        const character = asCharacter(value)
        if (!character.source) break
        setPath(
          body,
          field.path,
          character.desc.trim()
            ? { source: character.source, desc: character.desc.trim() }
            : { source: character.source },
        )
        break
      }
      case 'scenes': {
        const scenes = asScenes(value).map((scene) => {
          const out: Record<string, unknown> = { sec: scene.sec }
          if (scene.speak !== 'none') {
            out.speak = scene.speak
            out.script = scene.script.trim()
          } else {
            out.speak = 'none'
          }
          if (scene.references.length > 0) out.references = scene.references
          if (scene.camera.trim()) out.camera = scene.camera.trim()
          return out
        })
        setPath(body, field.path, scenes)
        break
      }
    }
  }
  // The film's voice rides as `voice.id` only when a scene speaks; an empty
  // `voice: {}` would be a guessed key.
  if (capability.id === 'film.generate') {
    const voice = body.voice as { id?: string } | undefined
    if (voice && !voice.id) delete body.voice
    const speaks = asScenes(values.scenes).some((scene) => scene.speak !== 'none')
    if (!speaks) {
      delete body.voice
      delete body.lang
    }
  }
  // media.generate: `collection` rides only when the toggle is on; the hint alone means nothing.
  if (capability.id === 'media.generate') {
    const collection = body.collection as { use?: boolean; hint?: string } | undefined
    if (collection && collection.use !== true) delete body.collection
  }
  body.origin = { kind: 'standalone', ...(options.originRef ? { ref: options.originRef } : {}) }
  return body
}

// ---------------------------------------------------------------------------
// The cost line — from the catalog's decimal strings, never a float
// ---------------------------------------------------------------------------

/** `"0.03" × 3` → `"0.09"`, exactly, on the price's own scale. */
export function multiplyDecimalString(value: string, times: number): string {
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(value.trim())
  if (!match || !Number.isInteger(times) || times < 0) return value
  const [, sign, wholeRaw, fractionRaw = ''] = match
  const scale = fractionRaw.length
  const scaled = BigInt(`${wholeRaw || '0'}${fractionRaw}` || '0') * BigInt(times)
  const digits = scaled.toString().padStart(scale + 1, '0')
  const whole = digits.slice(0, digits.length - scale) || '0'
  const fraction = scale > 0 ? digits.slice(digits.length - scale) : ''
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`
}

export interface CostEstimate {
  /** How many of the unit the request buys. */
  units: number
  /** The catalog's unit, in words ("image", "second", "unit of 1000 characters"). */
  unitLabel: string
  /** The catalog's price per unit, a decimal string. */
  unitPrice: string
  /** `units × unitPrice`, a decimal string. */
  total: string
  /** When the seconds are the orientation's cap rather than a measured length. */
  note?: string
}

/**
 * The document's rules, priced with the catalog's own decimal strings:
 * `count × price` for images, `ceil(characters / 1000) × price` for a voice,
 * `seconds × price` for video — and for motion, the clip's real length when
 * the asset is one of our renders, else the orientation's cap.
 */
export function estimateCost(
  capability: MediaCapability,
  values: CapabilityValues,
  cost: Record<string, unknown> | undefined,
  motion: { clipSeconds?: number } = {},
): CostEstimate | null {
  const rule = capability.pricing
  const priceOf = (unit: string) => {
    const price = cost?.[unit]
    return typeof price === 'string' ? price : null
  }
  if (rule.unit === 'images') {
    const price = priceOf('images')
    if (!price) return null
    const requested = rule.countKey ? asNumber(values[rule.countKey]) : 1
    const units = Number.isInteger(requested) && requested > 0 ? requested : 1
    return {
      units,
      unitLabel: 'image',
      unitPrice: price,
      total: multiplyDecimalString(price, units),
    }
  }
  if (rule.unit === 'audio_text_units') {
    const price = priceOf('audio_text_units')
    if (!price) return null
    const chars = asString(values[rule.textKey]).length
    const units = Math.max(1, Math.ceil(chars / VOICE_TEXT_UNIT_CHARS))
    return {
      units,
      unitLabel: `unit of ${VOICE_TEXT_UNIT_CHARS} characters`,
      unitPrice: price,
      total: multiplyDecimalString(price, units),
    }
  }
  const price = priceOf('video_seconds')
  if (!price) return null
  if ('motion' in rule) {
    const orientation = asString(values.orientation) === 'video' ? 'video' : 'image'
    const cap = MOTION_CAP_S[orientation]
    const measured = motion.clipSeconds
    const units = measured && measured > 0 ? Math.ceil(measured) : cap
    return {
      units,
      unitLabel: 'second',
      unitPrice: price,
      total: multiplyDecimalString(price, units),
      note:
        measured && measured > 0
          ? undefined
          : `Billed at the framing's cap of ${cap} seconds — an uploaded clip cannot be measured; a clip rendered here is billed at its real length.`,
    }
  }
  const raw = values[rule.secondsKey]
  // The video ad’s length is an enum held as a string; the film’s is a number.
  const seconds = typeof raw === 'string' ? Number(raw) : asNumber(raw)
  if (!Number.isInteger(seconds) || seconds <= 0) return null
  return {
    units: seconds,
    unitLabel: 'second',
    unitPrice: price,
    total: multiplyDecimalString(price, seconds),
  }
}
