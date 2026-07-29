import type { StudioModel } from '@/data/types'

/**
 * Creative Studio model catalog. `paramsSchema` is JSON-Schema-shaped; W5
 * renders the composer's params form from it (no hardcoded per-model UI).
 */
export const STUDIO_MODELS: StudioModel[] = [
  {
    id: 'sm_spark',
    name: 'Spark',
    kind: 'image',
    credits: 8,
    tier: 'free',
    // Two enums only — the simplest shape a capability can publish.
    paramsSchema: {
      type: 'object',
      properties: {
        aspect_ratio: { type: 'string', enum: ['1:1', '4:5', '16:9'], default: '1:1' },
        style: { type: 'string', enum: ['photo', 'illustration', 'flat'], default: 'photo' },
      },
      required: ['aspect_ratio'],
    },
  },
  {
    id: 'sm_prism',
    name: 'Prism',
    kind: 'image',
    credits: 12,
    tier: 'pro',
    // Enum + bounded integer + bounded float: proves numbers are not all one
    // control, and that min/max travel from the schema to the input.
    paramsSchema: {
      type: 'object',
      properties: {
        aspect_ratio: { type: 'string', enum: ['1:1', '4:5', '16:9', '9:16'], default: '4:5' },
        seed: { type: 'integer', minimum: 0, maximum: 999999 },
        reference_strength: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
      },
      required: ['aspect_ratio'],
    },
  },
  {
    id: 'sm_motion',
    name: 'Motion',
    kind: 'video',
    credits: 30,
    tier: 'pro',
    // A NUMERIC enum: duration must render as a picker, not a free number
    // field, because 7 seconds is not a thing this model can do.
    paramsSchema: {
      type: 'object',
      properties: {
        aspect_ratio: { type: 'string', enum: ['16:9', '9:16', '1:1'], default: '9:16' },
        duration_seconds: { type: 'integer', enum: [5, 10, 15], default: 10 },
        loop: { type: 'boolean', default: false, title: 'Loop seamlessly' },
      },
      required: ['aspect_ratio', 'duration_seconds'],
    },
  },
  {
    id: 'sm_cinema',
    name: 'Cinema',
    kind: 'video',
    credits: 60,
    tier: 'studio',
    // Free text + boolean + a titled field: covers every control kind, and
    // proves `title` wins over the humanised property name.
    paramsSchema: {
      type: 'object',
      properties: {
        aspect_ratio: { type: 'string', enum: ['16:9', '9:16'], default: '16:9' },
        duration_seconds: { type: 'integer', enum: [10, 15, 30], default: 15 },
        camera_motion: { type: 'string', enum: ['static', 'pan', 'orbit'], default: 'static' },
        negative_prompt: { type: 'string', title: 'Avoid in the shot' },
        film_grain: { type: 'boolean', default: true },
      },
      required: ['aspect_ratio', 'duration_seconds'],
    },
  },
]
