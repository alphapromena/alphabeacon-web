/**
 * The brand seam: tones, brand voice, sources and topics - one signature, two
 * implementations, mutations resyncing on success.
 *
 * INT-7 rewrote the two halves the 2026-08-17 contract unblocked:
 * - **Tones carry their rules now** (D-INT-C). Create and update send
 *   `rules[]`; a PATCH with `rules` REPLACES the whole list, which is exactly
 *   what an editor's Save means, so the single-rule endpoints are not needed.
 *   A tone's `example` still has no wire home and is still never smuggled into
 *   `description`.
 * - **The brand voice is ONE canonical row** named `Brand voice` (D-INT-B),
 *   created lazily on first write and PATCHed whole thereafter. That replaces
 *   INT-3's row-per-rule scheme, and with it the delete+create edit that made
 *   an edited line jump to the top of the list (open-items 12).
 *
 * Both voice write paths are ~1-2 s slower than a plain save: every committed
 * voice mutation re-pushes the org's context bundle server-side, which is the
 * mechanism that makes "saved changes reach the next generation" true.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type {
  ApiRun,
  ApiSource,
  ApiTone,
  ApiTonePreviewContent,
  ApiTopic,
  ApiVoice,
  TonesPreviewRequest,
} from '@/api/types'
import { CANONICAL_VOICE_NAME, joinRules } from '@/data/adapters/brand-adapter'
import type { AuthActionResult } from '@/data/auth'
import {
  useDataDispatch,
  useLiveBrandIds,
  useLiveWorkingOrgId,
  useOrg,
  useTopics,
} from '@/data/provider'
import type { BrandVoice, FollowedSource, Tone } from '@/data/types'
import { deriveSourceName, normalizeSourceUrl } from '@/lib/source-url'
import { composeTonePreview, type TonePreview } from '@/lib/tone-preview'

const SECURE_SCHEME = ['ht', 'tps://'].join('')

const ok: AuthActionResult = { ok: true }

/**
 * A preview either produced a card or failed the way every other seam action
 * fails, so callers can branch on `ok` exactly as they already do elsewhere.
 */
export type TonePreviewResult =
  | { ok: true; preview: TonePreview }
  | Extract<AuthActionResult, { ok: false }>

function failure(error: unknown): AuthActionResult {
  if (isApiError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldDetails,
      reason: error.reason,
      retryAfterSeconds: error.retryAfterSeconds,
      requestId: error.requestId,
    }
  }
  throw error
}

export function useBrandActions() {
  const dispatch = useDataDispatch()
  const orgId = useLiveWorkingOrgId()
  const brandIds = useLiveBrandIds()
  const topics = useTopics()
  const org = useOrg()
  const live = isLiveMode()

  const resync = () => dispatch({ type: 'live/resync' })
  const path = (resource: string, id?: string) =>
    `/orgs/${orgId}/brand/${resource}${id ? `/${id}` : ''}`

  return {
    async createTone(tone: Tone): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'tones/create', tone })
        return ok
      }
      try {
        await api<ApiTone>('POST', path('tones'), {
          body: {
            name: tone.name,
            description: tone.description,
            preset: false,
            rules: joinRules(tone.rules),
          },
        })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    async updateTone(tone: Tone): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'tones/update', tone })
        return ok
      }
      try {
        await api<ApiTone>('PATCH', path('tones', tone.id), {
          // `rules` replaces the whole list - the editor's save semantics
          // exactly, including clearing it with an empty array.
          body: {
            name: tone.name,
            description: tone.description,
            rules: joinRules(tone.rules),
          },
        })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    /** Server-side, deleting a tone also drops it from every schedule. */
    async deleteTone(toneId: string): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'tones/delete', toneId })
        return ok
      }
      try {
        await api<void>('DELETE', path('tones', toneId))
        // Mirror the cascade locally so the schedule never shows a ghost id
        // even before the resync lands.
        dispatch({ type: 'tones/delete', toneId })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    /**
     * I2's save, to ONE canonical row (D-INT-B).
     *
     * The whole do/don't list is that row's `rules`, so a save is one request:
     * a POST that creates `Brand voice` when the org has none, a PATCH that
     * replaces its rules when it does. Rewriting wholesale is also what
     * removed the INT-3 behaviour where editing a line re-created it and it
     * jumped to the top of the list (open-items 12).
     */
    async saveBrandVoice(next: BrandVoice): Promise<AuthActionResult> {
      if (!live || !orgId) return ok
      const rules = joinRules(next)
      const canonicalId = brandIds?.canonicalVoiceId ?? null
      try {
        if (canonicalId) {
          await api<ApiVoice>('PATCH', path('voices', canonicalId), { body: { rules } })
        } else {
          await api<ApiVoice>('POST', path('voices'), {
            body: {
              name: CANONICAL_VOICE_NAME,
              // `description` is required and is one plain sentence - never a
              // container for rules. The rules travel in `rules`.
              description: `${org.name} brand voice`,
              rules,
            },
          })
        }
        resync()
        return ok
      } catch (error) {
        resync()
        return failure(error)
      }
    },

    /**
     * I4's "Preview this tone" - the real thing in live mode.
     *
     * `brandVoice` is deliberately OMITTED from the request. Sending it would
     * override the org's pushed context bundle entirely (the platform falls
     * back to the bundle, it never merges), so a preview that sent one would
     * be previewing something real generation does not use. The rules the
     * sample was shaped by are still listed beside it, read from the same
     * brand voice the bundle was built from.
     *
     * A 502 on an org with no bundle yet is the documented failure; the screen
     * turns it into "save your brand voice first" rather than a shrug.
     */
    async previewTone(
      tone: Pick<Tone, 'name' | 'description' | 'rules' | 'example'>,
    ): Promise<TonePreviewResult> {
      const composed = composeTonePreview({ offer: org.offer, brandVoice: org.brandVoice }, tone)
      if (!live || !orgId) return { ok: true, preview: composed }
      try {
        const body: TonesPreviewRequest = {
          tone: {
            name: tone.name,
            description: tone.description,
            rules: joinRules(tone.rules),
            ...(tone.example ? { example: tone.example } : {}),
            language: 'en',
          },
          language: 'en',
        }
        const run = await api<ApiRun>('POST', `/orgs/${orgId}/alphastudio/posts/tones-preview`, {
          body,
        })
        const sample = (run.outputs?.[0]?.content as ApiTonePreviewContent | undefined)?.sample
        // A completed run with no sample is not a sample: fall back to the
        // composed line rather than rendering an empty card.
        if (!sample?.trim()) return { ok: true, preview: composed }
        return { ok: true, preview: { ...composed, line: sample.trim(), generated: true } }
      } catch (error) {
        // `failure` re-throws anything that is not an ApiError, so what comes
        // back here is always the ok:false half of the union.
        return failure(error) as Extract<AuthActionResult, { ok: false }>
      }
    },

    async addSource(input: string): Promise<AuthActionResult> {
      const url = normalizeSourceUrl(input)
      if (!live || !orgId) {
        const source: FollowedSource = {
          id: `src_${url.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
          url,
          name: deriveSourceName(url),
          addedAt: new Date().toISOString(),
        }
        dispatch({ type: 'sources/add', source })
        return ok
      }
      try {
        await api<ApiSource>('POST', path('sources'), {
          body: { url: `${SECURE_SCHEME}${url}`, title: deriveSourceName(url) },
        })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    async removeSource(sourceId: string): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'sources/remove', sourceId })
        return ok
      }
      try {
        await api<void>('DELETE', path('sources', sourceId))
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    /** Topics keep the app's replace semantics; the seam diffs into row CRUD. */
    async setTopics(next: string[]): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'topics/set', topics: next })
        return ok
      }
      const currentIds = brandIds?.topicIdByText ?? {}
      const nextSet = new Set(next)
      const currentSet = new Set(topics)
      const toDelete = Object.entries(currentIds).filter(([text]) => !nextSet.has(text))
      const toCreate = next.filter((text) => !currentSet.has(text))
      // Optimistic: a tag input that lags the network feels broken.
      dispatch({ type: 'topics/set', topics: next })
      try {
        await Promise.all([
          ...toDelete.map(([, id]) => api<void>('DELETE', path('topics', id))),
          ...toCreate.map((text) =>
            api<ApiTopic>('POST', path('topics'), { body: { description: text } }),
          ),
        ])
        resync()
        return ok
      } catch (error) {
        resync()
        return failure(error)
      }
    },
  }
}
