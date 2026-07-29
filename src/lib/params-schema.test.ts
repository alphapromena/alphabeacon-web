/**
 * W5's headline verify: "the params form renders correctly from ≥3 different
 * capability schemas in `src/data/`".
 *
 * These run against the REAL catalog rather than fixtures, so adding a model
 * with a construct the generator cannot render fails here — which is the whole
 * point of generating the form instead of hand-writing one per model.
 */
import { describe, expect, it } from 'vitest'
import { STUDIO_MODELS } from '@/data/entities/studio-models'
import {
  defaultsFromSchema,
  fieldsFromSchema,
  humanizeParamName,
  missingRequired,
} from './params-schema'

const modelNamed = (name: string) => STUDIO_MODELS.find((model) => model.name === name)!

describe('field generation across the real catalog', () => {
  it('covers at least three genuinely different schemas', () => {
    const shapes = new Set(
      STUDIO_MODELS.map((model) =>
        fieldsFromSchema(model.paramsSchema)
          .map((field) => field.kind)
          .sort()
          .join(','),
      ),
    )
    expect(shapes.size).toBeGreaterThanOrEqual(3)
  })

  it('renders every model in the catalog without dropping a declared parameter', () => {
    for (const model of STUDIO_MODELS) {
      const declared = Object.keys(
        (model.paramsSchema as { properties: Record<string, unknown> }).properties,
      )
      const generated = fieldsFromSchema(model.paramsSchema).map((field) => field.name)
      expect(generated, `${model.name} lost a parameter`).toEqual(declared)
    }
  })

  it('Spark: two enums become two pickers', () => {
    const fields = fieldsFromSchema(modelNamed('Spark').paramsSchema)
    expect(fields).toHaveLength(2)
    expect(fields.every((field) => field.kind === 'select')).toBe(true)
  })

  it('Prism: a bounded integer and a bounded float become number inputs carrying their bounds', () => {
    const fields = fieldsFromSchema(modelNamed('Prism').paramsSchema)
    const seed = fields.find((field) => field.name === 'seed')
    const strength = fields.find((field) => field.name === 'reference_strength')

    expect(seed).toMatchObject({ kind: 'number', integer: true, min: 0, max: 999999 })
    expect(strength).toMatchObject({ kind: 'number', integer: false, min: 0, max: 1 })
    expect(strength).toMatchObject({ defaultValue: 0.5 })
  })

  it('Motion: a NUMERIC enum is a picker, not a free number field', () => {
    const fields = fieldsFromSchema(modelNamed('Motion').paramsSchema)
    const duration = fields.find((field) => field.name === 'duration_seconds')
    // 7 seconds is not something this model can do, so it must not be typeable.
    expect(duration?.kind).toBe('select')
    expect(duration).toMatchObject({ options: [{ value: '5' }, { value: '10' }, { value: '15' }] })
  })

  it('Cinema: free text and booleans both render, and `title` wins over the property name', () => {
    const fields = fieldsFromSchema(modelNamed('Cinema').paramsSchema)
    expect(fields.find((field) => field.name === 'negative_prompt')).toMatchObject({
      kind: 'text',
      label: 'Avoid in the shot',
    })
    expect(fields.find((field) => field.name === 'film_grain')).toMatchObject({
      kind: 'boolean',
      label: 'Film grain',
      defaultValue: true,
    })
  })
})

describe('defaults', () => {
  it('takes the schema at its word', () => {
    const values = defaultsFromSchema(modelNamed('Cinema').paramsSchema)
    expect(values.aspect_ratio).toBe('16:9')
    expect(values.duration_seconds).toBe(15)
    expect(values.film_grain).toBe(true)
  })

  it('gives a required choice a valid starting value even with no stated default', () => {
    const schema = {
      type: 'object',
      properties: { size: { type: 'string', enum: ['small', 'large'] } },
      required: ['size'],
    }
    // Otherwise the very first submit fails for a reason the user did not cause.
    expect(defaultsFromSchema(schema).size).toBe('small')
  })

  it('leaves optional fields empty rather than inventing an answer', () => {
    const values = defaultsFromSchema(modelNamed('Prism').paramsSchema)
    expect(values.seed).toBeUndefined()
  })
})

describe('required-field checking', () => {
  it('names what is missing, using the label a person actually sees', () => {
    const schema = modelNamed('Motion').paramsSchema
    expect(missingRequired(schema, {})).toEqual(['Aspect ratio', 'Duration seconds'])
    expect(missingRequired(schema, defaultsFromSchema(schema))).toEqual([])
  })
})

describe('unknown constructs degrade safely', () => {
  it('skips a property type it cannot render rather than guessing', () => {
    const schema = {
      type: 'object',
      properties: {
        good: { type: 'string' },
        weird: { type: 'array', items: { type: 'string' } },
      },
    }
    expect(fieldsFromSchema(schema).map((field) => field.name)).toEqual(['good'])
  })

  it('returns nothing for a schema that is not an object', () => {
    expect(fieldsFromSchema(undefined)).toEqual([])
    expect(fieldsFromSchema({ type: 'string' })).toEqual([])
  })
})

describe('labels', () => {
  it('turns vendor snake_case into something readable', () => {
    expect(humanizeParamName('aspect_ratio')).toBe('Aspect ratio')
    expect(humanizeParamName('duration_seconds')).toBe('Duration seconds')
    expect(humanizeParamName('seed')).toBe('Seed')
  })
})
