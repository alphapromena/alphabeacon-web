/**
 * The one table's laws (ORDER HSN-0910/A): the 13 are all there; the
 * document's refusals are refused client-side, one trap per capability; the
 * scene-sum rule; the fields a plan hides; the cost rules on the catalog's
 * decimal strings; and the body a valid input builds — the document's example
 * shapes, which Phase 0 measured clearing validation (402 at the wallet).
 */
import { describe, expect, it } from 'vitest'
import {
  asIds,
  buildCapabilityBody,
  defaultValues,
  emptyScene,
  estimateCost,
  fieldsOnPlan,
  MEDIA_CAPABILITIES,
  MEDIA_CAPABILITY_IDS,
  mediaCapability,
  multiplyDecimalString,
  validateCapabilityInput,
  type CapabilityValues,
} from './media-capabilities'

const valid = (
  id: (typeof MEDIA_CAPABILITY_IDS)[number],
  patch: CapabilityValues,
): CapabilityValues => ({
  ...defaultValues(mediaCapability(id)),
  ...patch,
})
const g = (role: string, text: string) => ({ role, text }) as { role: 'style'; text: string }

describe('the table', () => {
  it("holds Hasan's 13 exactly, in the document's order, and nothing else (A1)", () => {
    expect(MEDIA_CAPABILITIES.map((entry) => entry.id)).toEqual([...MEDIA_CAPABILITY_IDS])
    expect(MEDIA_CAPABILITY_IDS).toHaveLength(13)
    expect(MEDIA_CAPABILITY_IDS).not.toContain('social-posts.media')
  })

  it('says what the document says about plans, but never decides selectable itself', () => {
    const ignored = MEDIA_CAPABILITIES.filter((entry) => entry.documentPlan === 'ignored').map(
      (e) => e.id,
    )
    expect(ignored).toEqual([
      'images.edit',
      'photoshoot.generate',
      'brand-assets.generate',
      'avatars.generate',
      'avatars.imagine',
    ])
    for (const entry of MEDIA_CAPABILITIES) expect(entry).not.toHaveProperty('selectable')
  })

  it('names a card image per capability, by id', () => {
    for (const entry of MEDIA_CAPABILITIES) {
      expect(`/studio/cards/${entry.id}.webp`).toMatch(/^\/studio\/cards\/[a-z.-]+\.webp$/)
    }
  })
})

describe('the validation law — one trap per capability, refused before any round-trip', () => {
  const A = 'masset_a'
  const B = 'masset_b'
  const V = 'masset_v'

  it('media.generate refuses an empty prompt and accepts the example', () => {
    const cap = mediaCapability('media.generate')
    expect(
      validateCapabilityInput(cap, 'balanced', valid('media.generate', { prompt: '' })),
    ).not.toEqual([])
    expect(
      validateCapabilityInput(cap, 'balanced', valid('media.generate', { prompt: 'a cover' })),
    ).toEqual([])
  })

  it('images.edit refuses two references and no instruction', () => {
    const cap = mediaCapability('images.edit')
    const ok = valid('images.edit', { instruction: 'replace the background', referenceImages: [A] })
    expect(validateCapabilityInput(cap, null, ok)).toEqual([])
    expect(validateCapabilityInput(cap, null, { ...ok, referenceImages: [A, B] })).not.toEqual([])
    expect(validateCapabilityInput(cap, null, { ...ok, instruction: '' })).not.toEqual([])
  })

  it('photoshoot.generate refuses five references (item 58: above four the wire answers 502) and needs a direction', () => {
    const cap = mediaCapability('photoshoot.generate')
    const ok = valid('photoshoot.generate', {
      referenceImages: [A, B],
      guidance: [g('style', 'soft key light')],
    })
    expect(validateCapabilityInput(cap, null, ok)).toEqual([])
    expect(
      validateCapabilityInput(cap, null, { ...ok, referenceImages: [A, B, A, B, A] }),
    ).not.toEqual([])
    expect(validateCapabilityInput(cap, null, { ...ok, guidance: [] })).not.toEqual([])
  })

  it('brand-assets.generate refuses a count of one — one is not a batch', () => {
    const cap = mediaCapability('brand-assets.generate')
    const ok = valid('brand-assets.generate', { count: 2, guidance: [g('style', 'flat')] })
    expect(validateCapabilityInput(cap, null, ok)).toEqual([])
    expect(validateCapabilityInput(cap, null, { ...ok, count: 1 })).not.toEqual([])
  })

  it('logos.generate refuses a count of twenty-one', () => {
    const cap = mediaCapability('logos.generate')
    const ok = valid('logos.generate', { count: 1, guidance: [g('style', 'flat')] })
    expect(validateCapabilityInput(cap, 'balanced', ok)).toEqual([])
    expect(validateCapabilityInput(cap, 'balanced', { ...ok, count: 21 })).not.toEqual([])
  })

  it('logos.redesign refuses no reference image', () => {
    const cap = mediaCapability('logos.redesign')
    const ok = valid('logos.redesign', { referenceImages: [A], count: 1 })
    expect(validateCapabilityInput(cap, 'balanced', ok)).toEqual([])
    expect(validateCapabilityInput(cap, 'balanced', { ...ok, referenceImages: [] })).not.toEqual([])
  })

  it('avatars.generate and avatar.generate refuse a count of nine', () => {
    const avatars = mediaCapability('avatars.generate')
    const ok = valid('avatars.generate', { referenceImages: [A], count: 1 })
    expect(validateCapabilityInput(avatars, null, ok)).toEqual([])
    expect(validateCapabilityInput(avatars, null, { ...ok, count: 9 })).not.toEqual([])
    const sheet = mediaCapability('avatar.generate')
    const okSheet = valid('avatar.generate', { instruction: 'a man in a blazer' })
    expect(validateCapabilityInput(sheet, 'balanced', okSheet)).toEqual([])
    expect(validateCapabilityInput(sheet, 'balanced', { ...okSheet, count: 9 })).not.toEqual([])
  })

  it('avatars.imagine refuses a 601-character description', () => {
    const cap = mediaCapability('avatars.imagine')
    expect(
      validateCapabilityInput(
        cap,
        null,
        valid('avatars.imagine', { instruction: 'x'.repeat(600) }),
      ),
    ).toEqual([])
    expect(
      validateCapabilityInput(
        cap,
        null,
        valid('avatars.imagine', { instruction: 'x'.repeat(601) }),
      ),
    ).not.toEqual([])
  })

  it('video-ads.generate offers 5 or 10 seconds and nothing else, and no aspect ratio or audio at all', () => {
    const cap = mediaCapability('video-ads.generate')
    const ok = valid('video-ads.generate', {
      imageUrl: [A],
      durationS: '5',
      guidance: [g('style', 'slow push-in')],
    })
    expect(validateCapabilityInput(cap, 'balanced', ok)).toEqual([])
    expect(validateCapabilityInput(cap, 'balanced', { ...ok, durationS: '8' })).not.toEqual([])
    expect(cap.fields.map((field) => field.key)).not.toContain('aspectRatio')
    expect(cap.fields.map((field) => field.key)).not.toContain('generateAudio')
  })

  it('voice.speak refuses an unapproved voice, and hides similarity and speed on precise', () => {
    const cap = mediaCapability('voice.speak')
    const ok = valid('voice.speak', { prompt: 'Welcome.', voice: 'Rachel', lang: 'en' })
    const voices = ['Rachel', 'g3YpdjT1OTh9cunaumJs']
    expect(validateCapabilityInput(cap, 'balanced', ok, { voiceOptions: voices })).toEqual([])
    expect(
      validateCapabilityInput(
        cap,
        'balanced',
        { ...ok, voice: 'NotAVoice' },
        { voiceOptions: voices },
      ),
    ).not.toEqual([])
    expect(
      validateCapabilityInput(cap, 'balanced', { ...ok, lang: 'eng' }, { voiceOptions: voices }),
    ).not.toEqual([])
    const precise = fieldsOnPlan(cap, 'precise').map((field) => field.key)
    expect(precise).not.toContain('similarity')
    expect(precise).not.toContain('speed')
    expect(fieldsOnPlan(cap, 'balanced').map((field) => field.key)).toContain('similarity')
  })

  it('film.generate enforces the scene sum, the silent balanced lane and the per-plan length', () => {
    const cap = mediaCapability('film.generate')
    const ok = valid('film.generate', {
      sec: 3,
      scenes: [
        { ...emptyScene(2), camera: 'wide' },
        { ...emptyScene(1), camera: 'push' },
      ],
    })
    expect(validateCapabilityInput(cap, 'balanced', ok)).toEqual([])
    // The trap: scenes that do not add up.
    expect(
      validateCapabilityInput(cap, 'balanced', { ...ok, scenes: [emptyScene(2), emptyScene(2)] }),
    ).not.toEqual([])
    // Balanced is the silent lane.
    expect(
      validateCapabilityInput(cap, 'balanced', {
        ...ok,
        scenes: [{ ...emptyScene(2), speak: 'talking', script: 'hi' }, emptyScene(1)],
      }),
    ).not.toEqual([])
    // Creative may speak — with a language and a voice.
    const talking = {
      ...ok,
      sec: 4,
      scenes: [{ ...emptyScene(3), speak: 'voiceover' as const, script: 'hi' }, emptyScene(1)],
    }
    expect(validateCapabilityInput(cap, 'creative', talking)).not.toEqual([])
    expect(
      validateCapabilityInput(cap, 'creative', { ...talking, lang: 'en', voiceId: 'Rachel' }),
    ).toEqual([])
    // Resolution is hidden on balanced, and 3 seconds is too short on creative.
    expect(fieldsOnPlan(cap, 'balanced').map((field) => field.key)).not.toContain('resolution')
    expect(fieldsOnPlan(cap, 'creative').map((field) => field.key)).toContain('resolution')
    expect(validateCapabilityInput(cap, 'creative', ok)).not.toEqual([])
  })

  it('motion.generate refuses a missing framing choice and carries no lang field (item 57)', () => {
    const cap = mediaCapability('motion.generate')
    const ok = valid('motion.generate', { image: [A], video: [V] })
    expect(validateCapabilityInput(cap, 'balanced', ok)).toEqual([])
    expect(validateCapabilityInput(cap, 'balanced', { ...ok, orientation: '' })).not.toEqual([])
    expect(cap.fields.map((field) => field.key)).not.toContain('lang')
  })

  it('hides negativePrompt and seed on precise wherever they exist', () => {
    for (const entry of MEDIA_CAPABILITIES) {
      const precise = fieldsOnPlan(entry, 'precise').map((field) => field.key)
      expect(precise).not.toContain('negativePrompt')
      expect(precise).not.toContain('seed')
    }
  })

  it('caps guidance at six lines of at most 2000 characters', () => {
    const cap = mediaCapability('logos.generate')
    const seven = Array.from({ length: 7 }, () => g('style', 'x'))
    expect(
      validateCapabilityInput(cap, 'balanced', valid('logos.generate', { guidance: seven })),
    ).not.toEqual([])
    expect(
      validateCapabilityInput(
        cap,
        'balanced',
        valid('logos.generate', { guidance: [g('style', 'x'.repeat(2001))] }),
      ),
    ).not.toEqual([])
  })
})

describe('the body — the document’s example shapes', () => {
  it('images.edit: instruction, exactly one url, the image params, origin — and no plan (pinned)', () => {
    const body = buildCapabilityBody(
      mediaCapability('images.edit'),
      null,
      valid('images.edit', {
        instruction: 'replace the background',
        referenceImages: ['masset_a'],
      }),
      {
        includePlan: false,
        urls: { masset_a: '<read url for masset_a>' },
        originRef: 'studio:images.edit',
      },
    )
    expect(body).toEqual({
      capability: 'images.edit',
      instruction: 'replace the background',
      params: {
        referenceImages: ['<read url for masset_a>'],
        aspectRatio: '1:1',
        outputFormat: 'png',
      },
      origin: { kind: 'standalone', ref: 'studio:images.edit' },
    })
  })

  it('video-ads.generate: imageUrl is one url and durationS a number', () => {
    const body = buildCapabilityBody(
      mediaCapability('video-ads.generate'),
      'balanced',
      valid('video-ads.generate', {
        imageUrl: ['masset_a'],
        durationS: '10',
        guidance: [g('style', 'slow')],
      }),
      { includePlan: true, urls: { masset_a: '<read url for masset_a>' } },
    )
    expect(body.plan).toBe('balanced')
    expect(body.params).toEqual({ imageUrl: '<read url for masset_a>', durationS: 10 })
    expect(body).not.toHaveProperty('kind')
  })

  it('motion.generate: asset ids, not urls; no lang', () => {
    const body = buildCapabilityBody(
      mediaCapability('motion.generate'),
      'balanced',
      valid('motion.generate', { image: ['masset_i'], video: ['masset_v'], prompt: '' }),
      { includePlan: true },
    )
    expect(body).toEqual({
      capability: 'motion.generate',
      plan: 'balanced',
      image: 'masset_i',
      video: 'masset_v',
      orientation: 'image',
      keepSound: true,
      origin: { kind: 'standalone' },
    })
  })

  it('film.generate on balanced: sec, aspect, audio, scenes with speak none — no voice, no lang, no resolution', () => {
    const body = buildCapabilityBody(
      mediaCapability('film.generate'),
      'balanced',
      valid('film.generate', {
        sec: 3,
        scenes: [
          { ...emptyScene(2), camera: 'wide establishing shot', references: ['masset_r'] },
          { ...emptyScene(1), camera: 'slow push' },
        ],
      }),
      { includePlan: true },
    )
    expect(body).toEqual({
      capability: 'film.generate',
      plan: 'balanced',
      sec: 3,
      aspect: '9:16',
      audio: true,
      scenes: [
        { sec: 2, speak: 'none', references: ['masset_r'], camera: 'wide establishing shot' },
        { sec: 1, speak: 'none', camera: 'slow push' },
      ],
      origin: { kind: 'standalone' },
    })
  })

  it('media.generate: prompt, kind, params, collection only when on, origin', () => {
    const on = buildCapabilityBody(
      mediaCapability('media.generate'),
      'balanced',
      valid('media.generate', { prompt: 'a cover', collectionHint: 'our mark' }),
      { includePlan: true },
    )
    expect(on).toMatchObject({
      capability: 'media.generate',
      plan: 'balanced',
      kind: 'image',
      prompt: 'a cover',
      params: { aspectRatio: '1:1', outputFormat: 'png' },
      collection: { use: true, hint: 'our mark' },
    })
    const off = buildCapabilityBody(
      mediaCapability('media.generate'),
      'balanced',
      valid('media.generate', {
        prompt: 'a cover',
        collectionUse: false,
        collectionHint: 'our mark',
      }),
      { includePlan: true },
    )
    expect(off).not.toHaveProperty('collection')
    // Precise hides seed and negativePrompt: they never reach the body.
    const precise = buildCapabilityBody(
      mediaCapability('media.generate'),
      'precise',
      valid('media.generate', { prompt: 'a cover', seed: 7, negativePrompt: 'text' }),
      { includePlan: true },
    )
    expect(precise.params).toEqual({ aspectRatio: '1:1', outputFormat: 'png' })
  })
})

describe('the cost line — the catalog’s decimal strings, never a float', () => {
  it('multiplies exactly on the price’s own scale', () => {
    expect(multiplyDecimalString('0.03', 3)).toBe('0.09')
    expect(multiplyDecimalString('0.211', 20)).toBe('4.220')
    expect(multiplyDecimalString('0.3034', 15)).toBe('4.5510')
    expect(multiplyDecimalString('0.07', 0)).toBe('0.00')
  })

  it('images: count × price; one image when there is no count', () => {
    expect(
      estimateCost(mediaCapability('logos.generate'), { count: 3 }, { images: '0.03' }),
    ).toMatchObject({
      units: 3,
      total: '0.09',
    })
    expect(estimateCost(mediaCapability('images.edit'), {}, { images: '0.06' })).toMatchObject({
      units: 1,
      total: '0.06',
    })
  })

  it('voice: ceil(characters / 1000) × price — 52 characters and 1000 are one unit, 1001 is two', () => {
    const cap = mediaCapability('voice.speak')
    expect(
      estimateCost(cap, { prompt: 'x'.repeat(52) }, { audio_text_units: '0.05' }),
    ).toMatchObject({ units: 1, total: '0.05' })
    expect(
      estimateCost(cap, { prompt: 'x'.repeat(1000) }, { audio_text_units: '0.05' }),
    ).toMatchObject({ units: 1 })
    expect(
      estimateCost(cap, { prompt: 'x'.repeat(1001) }, { audio_text_units: '0.05' }),
    ).toMatchObject({ units: 2, total: '0.10' })
  })

  it('video ads and films: seconds × price', () => {
    expect(
      estimateCost(
        mediaCapability('video-ads.generate'),
        { durationS: '10' },
        { video_seconds: '0.042' },
      ),
    ).toMatchObject({
      units: 10,
      total: '0.420',
    })
    expect(
      estimateCost(mediaCapability('film.generate'), { sec: 15 }, { video_seconds: '0.14' }),
    ).toMatchObject({ units: 15, total: '2.10' })
  })

  it('motion: the clip’s real length when known, else the framing’s cap — and says which', () => {
    const cap = mediaCapability('motion.generate')
    const capped = estimateCost(cap, { orientation: 'image' }, { video_seconds: '0.07' })
    expect(capped).toMatchObject({ units: 10, total: '0.70' })
    expect(capped?.note).toMatch(/cap of 10 seconds/)
    expect(estimateCost(cap, { orientation: 'video' }, { video_seconds: '0.07' })).toMatchObject({
      units: 30,
    })
    const measured = estimateCost(
      cap,
      { orientation: 'video' },
      { video_seconds: '0.07' },
      { clipSeconds: 5 },
    )
    expect(measured).toMatchObject({ units: 5, total: '0.35' })
    expect(measured?.note).toBeUndefined()
  })

  it('answers null when the catalog carries no price for the unit', () => {
    expect(estimateCost(mediaCapability('logos.generate'), { count: 1 }, undefined)).toBeNull()
  })
})

describe('helpers', () => {
  it('reads ids out of a field value defensively', () => {
    expect(asIds(['a', 'b'])).toEqual(['a', 'b'])
    expect(asIds('a')).toEqual([])
    expect(asIds(undefined)).toEqual([])
  })
})
