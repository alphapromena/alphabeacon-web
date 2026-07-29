/**
 * Turns a model's capability JSON Schema into a list of form fields.
 *
 * The rule this exists to enforce (web-plan.md W5): the composer's params form
 * is GENERATED from the schema a model publishes, never hardcoded per model.
 * A new model with a new parameter should render correctly without anyone
 * touching a component — which is exactly what a real model catalog does when
 * a vendor adds a knob.
 *
 * Deliberately a small subset of JSON Schema — the part a capability actually
 * uses. Anything unrecognised is skipped rather than guessed at, so an unknown
 * construct degrades to "not offered" instead of to a broken control.
 */

export type ParamField =
  | {
      kind: 'select'
      name: string
      label: string
      required: boolean
      options: { value: string; label: string }[]
      defaultValue?: string | number
    }
  | {
      kind: 'number'
      name: string
      label: string
      required: boolean
      min?: number
      max?: number
      integer: boolean
      defaultValue?: number
    }
  | { kind: 'text'; name: string; label: string; required: boolean; defaultValue?: string }
  | { kind: 'boolean'; name: string; label: string; required: boolean; defaultValue?: boolean }

export type ParamValues = Record<string, string | number | boolean>

interface JsonSchemaProperty {
  type?: string
  enum?: (string | number)[]
  default?: string | number | boolean
  minimum?: number
  maximum?: number
  title?: string
  description?: string
}

/** `aspect_ratio` → "Aspect ratio". Vendors name in snake_case; people do not. */
export function humanizeParamName(name: string): string {
  const spaced = name.replace(/[_-]+/g, ' ').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function fieldsFromSchema(schema: Record<string, unknown> | undefined): ParamField[] {
  if (!schema || schema.type !== 'object') return []
  const properties = schema.properties as Record<string, JsonSchemaProperty> | undefined
  if (!properties) return []
  const required = new Set((schema.required as string[] | undefined) ?? [])

  const fields: ParamField[] = []
  for (const [name, property] of Object.entries(properties)) {
    const label = property.title ?? humanizeParamName(name)
    const isRequired = required.has(name)

    // An enum is a choice regardless of its underlying type — this is what
    // lets `duration_seconds: {type: integer, enum: [5,10,15]}` render as a
    // picker rather than as a free number field nobody can guess.
    if (property.enum && property.enum.length > 0) {
      fields.push({
        kind: 'select',
        name,
        label,
        required: isRequired,
        options: property.enum.map((value) => ({ value: String(value), label: String(value) })),
        defaultValue: property.default as string | number | undefined,
      })
      continue
    }

    switch (property.type) {
      case 'integer':
      case 'number':
        fields.push({
          kind: 'number',
          name,
          label,
          required: isRequired,
          min: property.minimum,
          max: property.maximum,
          integer: property.type === 'integer',
          defaultValue: property.default as number | undefined,
        })
        break
      case 'boolean':
        fields.push({
          kind: 'boolean',
          name,
          label,
          required: isRequired,
          defaultValue: property.default as boolean | undefined,
        })
        break
      case 'string':
        fields.push({
          kind: 'text',
          name,
          label,
          required: isRequired,
          defaultValue: property.default as string | undefined,
        })
        break
      default:
        // Unknown construct: offer nothing rather than a control that lies
        // about what the model accepts.
        break
    }
  }
  return fields
}

/** The values a form should start with, taken from the schema's own defaults. */
export function defaultsFromSchema(schema: Record<string, unknown> | undefined): ParamValues {
  const values: ParamValues = {}
  for (const field of fieldsFromSchema(schema)) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue
    } else if (field.kind === 'select' && field.options.length > 0) {
      // A required choice with no stated default still needs a valid starting
      // value, or the first submit fails for a reason the user did not cause.
      if (field.required) values[field.name] = field.options[0].value
    } else if (field.kind === 'boolean') {
      values[field.name] = false
    }
  }
  return values
}

/** Names of required fields with no usable value — the composer blocks on these. */
export function missingRequired(
  schema: Record<string, unknown> | undefined,
  values: ParamValues,
): string[] {
  return fieldsFromSchema(schema)
    .filter((field) => field.required)
    .filter((field) => {
      const value = values[field.name]
      if (field.kind === 'boolean') return value === undefined
      return value === undefined || value === ''
    })
    .map((field) => field.label)
}
