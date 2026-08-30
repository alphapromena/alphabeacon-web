/**
 * The tone-fields SIDECAR (ORDER HSN-03, decisions.md 2026-08-30) — interim,
 * and named as such.
 *
 * Every tone now carries `language` and `length`, set in Settings. The tones
 * API persists only `{name, description, preset, rules}` today — Hasan has not
 * added the two fields yet — so until he does they live HERE, client-side, in
 * localStorage, keyed by org id and tone id, and are hydrated into the tone
 * model on every brand read. The wire body does not carry them yet
 * (`TONE_FIELDS_ON_WIRE` in `src/data/brand.ts` is the one switch to flip).
 *
 * The retirement rule is written into `hydrateToneFields`: a value the SERVER
 * echoes wins over the sidecar's, and once the server carries both fields for
 * a tone its entry is deleted. Entries for tones that no longer exist are
 * pruned on the same pass. So the day Hasan ships persistence the switch flips,
 * existing tones are optionally re-saved, and this file empties itself.
 *
 * Live mode only. Static mode persists nothing by law (architecture.md) — the
 * demo world carries the fields on the tone record itself.
 *
 * Key: `ab-tone-fields:<orgId>` → `{ [toneId]: { language?, length? } }`.
 */
import type { Tone, ToneLanguage, ToneLength } from '@/data/types'

export interface ToneFields {
  language?: ToneLanguage
  length?: ToneLength
}

const KEY_PREFIX = 'ab-tone-fields:'

const keyFor = (orgId: string) => `${KEY_PREFIX}${orgId}`

function readAll(orgId: string): Record<string, ToneFields> {
  try {
    const raw = window.localStorage.getItem(keyFor(orgId))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, ToneFields>) : {}
  } catch {
    return {}
  }
}

function writeAll(orgId: string, entries: Record<string, ToneFields>): void {
  try {
    if (Object.keys(entries).length === 0) {
      window.localStorage.removeItem(keyFor(orgId))
      return
    }
    window.localStorage.setItem(keyFor(orgId), JSON.stringify(entries))
  } catch {
    // A full or blocked store loses the interim fields, nothing more; the
    // screen then shows them as not set, which is the honest state.
  }
}

/** Only the two fields, only when set — an entry never holds an undefined. */
function compact(fields: ToneFields): ToneFields {
  return {
    ...(fields.language ? { language: fields.language } : {}),
    ...(fields.length ? { length: fields.length } : {}),
  }
}

/** Record a tone's fields after a save. An entry with nothing in it is removed. */
export function writeToneFields(orgId: string, toneId: string, fields: ToneFields): void {
  const entries = readAll(orgId)
  const next = compact(fields)
  if (Object.keys(next).length === 0) delete entries[toneId]
  else entries[toneId] = next
  writeAll(orgId, entries)
}

/** A deleted tone takes its entry with it. */
export function retireToneFields(orgId: string, toneId: string): void {
  const entries = readAll(orgId)
  if (!(toneId in entries)) return
  delete entries[toneId]
  writeAll(orgId, entries)
}

/**
 * Fill each tone's `language`/`length` from the sidecar where the server did
 * not answer. Server value wins per field; an entry the server has fully
 * superseded is retired, and entries for tones that no longer exist are
 * pruned. Pure over its inputs apart from that storage housekeeping.
 */
export function hydrateToneFields(orgId: string, tones: Tone[]): Tone[] {
  const entries = readAll(orgId)
  let changed = false
  const known = new Set(tones.map((tone) => tone.id))

  for (const toneId of Object.keys(entries)) {
    if (!known.has(toneId)) {
      delete entries[toneId]
      changed = true
    }
  }

  const hydrated = tones.map((tone) => {
    const local = entries[tone.id]
    if (!local) return tone
    if (tone.language && tone.length) {
      // The server carries both: the sidecar's job for this tone is done.
      delete entries[tone.id]
      changed = true
      return tone
    }
    return {
      ...tone,
      ...((tone.language ?? local.language) ? { language: tone.language ?? local.language } : {}),
      ...((tone.length ?? local.length) ? { length: tone.length ?? local.length } : {}),
    }
  })

  if (changed) writeAll(orgId, entries)
  return hydrated
}
