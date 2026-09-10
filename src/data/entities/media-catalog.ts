/**
 * The DEMO catalog for the 13 media capabilities (ORDER HSN-0910/A) — the
 * static mode's stand-in for `GET catalog/capabilities/:c`, transcribed from
 * the wire as measured on 2026-09-10 (`Docs/qa/hsn-0910/phase0/catalog/`):
 * the same aliases, kinds, display hints, decimal-string prices and the enums
 * the composer reads. Where the plain read carries `plan: null` on an
 * own-model row, the demo carries the plan the `?plan=` read resolved it to,
 * so `demoMediaCatalog(c, plan)` answers the way the wire does.
 *
 * Nothing here is invented: a row that is not in the record is not here.
 */
import type { ApiCapabilityCatalog, ApiCatalogModel, ApiPlan } from '@/api/types'
import { ASPECT_RATIOS, FILM_ASPECTS, OUTPUT_FORMATS } from '@/data/media-capabilities'
import type { MediaCapabilityId } from '@/data/media-capabilities'

const APPROVED_VOICES = ['g3YpdjT1OTh9cunaumJs', 'Rachel'] as const

const imageSchema = (
  extra: Record<string, unknown> = {},
  formats: readonly string[] = OUTPUT_FORMATS,
): Record<string, unknown> => ({
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 20 },
    aspectRatio: { enum: [...ASPECT_RATIOS], type: 'string' },
    outputFormat: { enum: [...formats], type: 'string' },
    ...extra,
  },
  additionalProperties: false,
})
const references = { referenceImages: { type: 'array', minItems: 1, maxItems: 4 } }
const promptExtras = {
  negativePrompt: { type: 'string', maxLength: 1000 },
  seed: { type: 'integer' },
}

const image = (
  alias: string,
  plan: ApiPlan,
  price: string,
  displayHint: string,
  schema: Record<string, unknown>,
): ApiCatalogModel => ({
  alias,
  kind: 'image',
  plan,
  displayHint,
  capabilitySchema: schema,
  cost: { images: price },
  appMetadata: { min_plan: 'pro' },
})
const video = (
  alias: string,
  plan: ApiPlan,
  price: string,
  displayHint: string,
  schema: Record<string, unknown>,
  cost: Record<string, unknown> = {},
): ApiCatalogModel => ({
  alias,
  kind: 'video',
  plan,
  displayHint,
  capabilitySchema: schema,
  cost: { video_seconds: price, ...cost } as Record<string, string>,
  appMetadata: { min_plan: 'pro' },
})

/** The six image rows every selectable image capability shares. */
const imageRows = (withReferences: boolean): ApiCatalogModel[] => [
  image('image-balanced', 'balanced', '0.03', 'Balanced image', imageSchema(promptExtras)),
  ...(withReferences
    ? [
        image(
          'image-reference-lite',
          'balanced',
          '0.05',
          'Edit from a reference',
          imageSchema({ ...references, seed: { type: 'integer' } }, ['png', 'jpeg']),
        ),
      ]
    : []),
  image(
    'image-reference',
    'creative',
    '0.06',
    'Image from a reference',
    imageSchema({ ...promptExtras, ...references }),
  ),
  image('image-super', 'creative', '0.06', 'Super image', imageSchema(promptExtras)),
  image(
    'image-reference-top',
    'precise',
    '0.211',
    'Top edit from a reference',
    imageSchema(references),
  ),
  image('image-top', 'precise', '0.211', 'Top image', imageSchema()),
]

const filmSchema = (min: number, max: number, resolution: boolean): Record<string, unknown> => ({
  type: 'object',
  properties: {
    durationS: { type: 'integer', minimum: min, maximum: max },
    aspectRatio: { enum: [...FILM_ASPECTS], type: 'string' },
    generateAudio: { type: 'boolean' },
    referenceImages: { type: 'array', minItems: 1, maxItems: 7 },
    ...(resolution
      ? { resolution: { enum: ['480p', '720p', '1080p', '4k'], type: 'string' } }
      : {}),
  },
})
const voiceSchema = (full: boolean): Record<string, unknown> => ({
  type: 'object',
  properties: {
    voice: { enum: [...APPROVED_VOICES], type: 'string' },
    lang: { type: 'string', pattern: '^[a-z]{2}$' },
    stability: { type: 'number', minimum: 0, maximum: 1 },
    ...(full
      ? {
          similarity: { type: 'number', minimum: 0, maximum: 1 },
          speed: { type: 'number', minimum: 0.7, maximum: 1.2 },
        }
      : {}),
  },
})
const voice = (
  alias: string,
  plan: ApiPlan,
  price: string,
  displayHint: string,
  full: boolean,
): ApiCatalogModel => ({
  alias,
  kind: 'audio',
  plan,
  displayHint,
  capabilitySchema: voiceSchema(full),
  cost: { audio_text_units: price },
  appMetadata: { min_plan: 'pro' },
})
const motionSchema: Record<string, unknown> = {
  type: 'object',
  properties: {
    imageUrl: { type: 'string' },
    videoUrl: { type: 'string' },
    keepSound: { type: 'boolean' },
    orientation: { enum: ['image', 'video'], type: 'string' },
  },
}
const videoAdSchema: Record<string, unknown> = {
  type: 'object',
  properties: {
    imageUrl: { type: 'string' },
    durationS: { anyOf: [{ const: 5 }, { const: 10 }] },
    seed: { type: 'integer' },
    negativePrompt: { type: 'string', maxLength: 1000 },
  },
}

const selectable = (
  capability: MediaCapabilityId,
  models: ApiCatalogModel[],
): ApiCapabilityCatalog => ({
  capability,
  selectable: true,
  field: 'plan',
  plan: null,
  models,
})
const pinned = (capability: MediaCapabilityId, model: ApiCatalogModel): ApiCapabilityCatalog => ({
  capability,
  selectable: false,
  field: null,
  plan: null,
  models: [model],
})

export const DEMO_MEDIA_CATALOG: readonly ApiCapabilityCatalog[] = [
  selectable('media.generate', [
    ...imageRows(true),
    video(
      'video-reference-core',
      'balanced',
      '0.068',
      'Reference to video',
      filmSchema(2, 10, true),
    ),
    video(
      'video-reference-plus',
      'creative',
      '0.14',
      'Reference to video (plus)',
      filmSchema(2, 20, true),
    ),
    video(
      'video-reference-top',
      'precise',
      '0.28',
      'Reference to video (top)',
      filmSchema(2, 30, true),
    ),
  ]),
  pinned(
    'images.edit',
    image(
      'image-reference',
      'creative',
      '0.06',
      'Image from a reference',
      imageSchema({ ...promptExtras, ...references }),
    ),
  ),
  pinned(
    'photoshoot.generate',
    image(
      'image-reference',
      'creative',
      '0.06',
      'Image from a reference',
      imageSchema({ ...promptExtras, ...references }),
    ),
  ),
  pinned(
    'brand-assets.generate',
    image('image-design', 'balanced', '0.05', 'Design & lettered image', imageSchema(promptExtras)),
  ),
  selectable('logos.generate', imageRows(true)),
  selectable('logos.redesign', [
    image(
      'image-reference-lite',
      'balanced',
      '0.05',
      'Edit from a reference',
      imageSchema({ ...references, seed: { type: 'integer' } }, ['png', 'jpeg']),
    ),
    image(
      'image-reference',
      'creative',
      '0.06',
      'Image from a reference',
      imageSchema({ ...promptExtras, ...references }),
    ),
    image(
      'image-reference-top',
      'precise',
      '0.211',
      'Top edit from a reference',
      imageSchema(references),
    ),
  ]),
  pinned(
    'avatars.generate',
    image(
      'image-reference-top',
      'precise',
      '0.211',
      'Top edit from a reference',
      imageSchema(references),
    ),
  ),
  pinned('avatars.imagine', image('image-top', 'precise', '0.211', 'Top image', imageSchema())),
  selectable('avatar.generate', [
    image(
      'image-balanced-seedream',
      'balanced',
      '0.03',
      'Balanced image (Seedream)',
      imageSchema({ seed: { type: 'integer' } }),
    ),
    image(
      'image-reference-seedream',
      'balanced',
      '0.03',
      'Image from a reference (Seedream)',
      imageSchema({ ...references, seed: { type: 'integer' } }),
    ),
    image(
      'image-reference',
      'creative',
      '0.06',
      'Image from a reference',
      imageSchema({ ...promptExtras, ...references }),
    ),
    image('image-super', 'creative', '0.06', 'Super image', imageSchema(promptExtras)),
    image(
      'image-reference-top',
      'precise',
      '0.211',
      'Top edit from a reference',
      imageSchema(references),
    ),
    image('image-top', 'precise', '0.211', 'Top image', imageSchema()),
  ]),
  selectable('video-ads.generate', [
    video('video-image-core', 'balanced', '0.042', 'Image to video', videoAdSchema),
    video('video-image-balanced', 'creative', '0.07', 'Image to video (balanced)', videoAdSchema),
    video('video-image-super', 'precise', '0.112', 'Image to video (super)', videoAdSchema),
  ]),
  selectable('voice.speak', [
    voice('voice-turbo', 'balanced', '0.05', 'Voice (fast)', true),
    voice('voice-multilingual', 'creative', '0.1', 'Voice (multilingual)', true),
    voice('voice-expressive', 'precise', '0.1', 'Voice (expressive)', false),
  ]),
  selectable('film.generate', [
    video('video-scene-core', 'balanced', '0.14', 'Scene film (silent)', filmSchema(3, 15, false)),
    video('video-scene-plus', 'creative', '0.3034', 'Scene film', filmSchema(4, 15, true), {
      video_seconds_by_resolution: {
        '480p': '0.1415',
        '720p': '0.3034',
        '1080p': '0.6827',
        '4k': '2.7306',
      },
    }),
    video('video-scene-top', 'precise', '0.473', 'Scene film (top)', filmSchema(4, 30, true), {
      video_seconds_by_resolution: { '480p': '0.2205', '720p': '0.473', '1080p': '1.0643' },
    }),
  ]),
  selectable('motion.generate', [
    video('video-motion-core', 'balanced', '0.07', 'Motion recast (draft)', motionSchema),
    video('video-motion-plus', 'creative', '0.112', 'Motion recast', motionSchema),
    video('video-motion-top', 'precise', '0.126', 'Motion recast (top)', motionSchema),
  ]),
]

/**
 * The demo's answer to `GET catalog/capabilities/:c[?plan=]`: the entry, or
 * `null` for a capability the demo does not grant (none of the 13); with a
 * plan, only the rows that plan resolves to, and the plan echoed — the wire's
 * own shape.
 */
export function demoMediaCatalog(capability: string, plan?: ApiPlan): ApiCapabilityCatalog | null {
  const entry = DEMO_MEDIA_CATALOG.find((candidate) => candidate.capability === capability)
  if (!entry) return null
  if (!plan) return structuredClone(entry)
  return {
    ...structuredClone(entry),
    plan,
    models: entry.models
      .filter((model) => model.plan === plan)
      .map((model) => structuredClone(model)),
  }
}
