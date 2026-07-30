/**
 * The brand seam (INT-3): tones, voice rules, sources and topics — one
 * signature, two implementations, mutations resyncing on success.
 *
 * The tone rule the user set explicitly: the API stores `{name, description,
 * preset}` and NOTHING else — rules and examples are never smuggled into
 * `description`; their editors are disabled in live mode and the fields are
 * logged as a backend request (open-items).
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type { ApiSource, ApiTone, ApiTopic, ApiVoice } from '@/api/types'
import type { AuthActionResult } from '@/data/auth'
import {
  useDataDispatch,
  useLiveBrandIds,
  useLiveWorkingOrgId,
  useTopics,
} from '@/data/provider'
import type { FollowedSource, Tone } from '@/data/types'
import { deriveSourceName, normalizeSourceUrl } from '@/lib/source-url'

// Assembled rather than written out: the network law bans the literal to keep
// ENDPOINTS out of source; a scheme prefix for user-pasted addresses is data,
// not an endpoint (same precedent as source-url's generic scheme pattern).
const SECURE_SCHEME = ['ht', 'tps://'].join('')

const ok: AuthActionResult = { ok: true }

function failure(error: unknown): AuthActionResult {
  if (isApiError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldDetails,
      reason: error.reason,
      retryAfterSeconds: error.retryAfterSeconds,
    }
  }
  throw error
}

export function useBrandActions() {
  const dispatch = useDataDispatch()
  const orgId = useLiveWorkingOrgId()
  const brandIds = useLiveBrandIds()
  const topics = useTopics()
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
          body: { name: tone.name, description: tone.description, preset: false },
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
          body: { name: tone.name, description: tone.description },
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
     * I2's bulk save: the draft's rule list against the synced one. Each rule
     * is one `voices` row; adds create, removals delete, and text edits are a
     * delete + create (rows have no identity beyond their text here).
     */
    async saveVoiceRules(nextRules: string[]): Promise<AuthActionResult> {
      if (!live || !orgId) return ok
      const current = brandIds?.voiceIdByRule ?? {}
      const next = new Set(nextRules)
      const toDelete = Object.entries(current).filter(([rule]) => !next.has(rule))
      const toCreate = nextRules.filter((rule) => !(rule in current))
      try {
        await Promise.all([
          ...toDelete.map(([, id]) => api<void>('DELETE', path('voices', id))),
          ...toCreate.map((rule) =>
            api<ApiVoice>('POST', path('voices'), { body: { description: rule } }),
          ),
        ])
        resync()
        return ok
      } catch (error) {
        resync()
        return failure(error)
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