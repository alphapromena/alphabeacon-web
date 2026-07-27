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
    paramsSchema: {
      type: 'object',
      properties: {
        aspect_ratio: { type: 'string', enum: ['1:1', '4:5', '16:9', '9:16'], default: '4:5' },
        seed: { type: 'integer', minimum: 0 },
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
    paramsSchema: {
      type: 'object',
      properties: {
        aspect_ratio: { type: 'string', enum: ['16:9', '9:16', '1:1'], default: '9:16' },
        duration_seconds: { type: 'integer', enum: [5, 10, 15], default: 10 },
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
    paramsSchema: {
      type: 'object',
      properties: {
        aspect_ratio: { type: 'string', enum: ['16:9', '9:16'], default: '16:9' },
        duration_seconds: { type: 'integer', enum: [10, 15, 30], default: 15 },
        camera_motion: { type: 'string', enum: ['static', 'pan', 'orbit'], default: 'static' },
      },
      required: ['aspect_ratio', 'duration_seconds'],
    },
  },
]
