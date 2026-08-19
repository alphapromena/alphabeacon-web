/**
 * The proposals ledger, and Today derived from it (INT-12, D-INT-J/K/L).
 *
 * A proposal row carries NO content — `{ proposalId, runId, state, decidedAt,
 * publishedId }`. The draft lives on the run output the id is stamped on. So
 * the review queue is a JOIN, not a list: ledger → unique runIds → run reads →
 * outputs matched back by `proposalId`. That is also why this indexes runs the
 * frontend never started (scheduled ones, when they land), which is the point
 * — and why INT-10's localStorage run ledger is retired.
 *
 * PAGING IS NOT TRUSTED FOR COMPLETENESS. The server's keyset compares on the
 * timestamp alone, so rows sharing a creation instant are skipped — and every
 * proposal from one run shares one (Docs/api/alphastudio-shapes.md, "BACKEND
 * BUG"). Proposals from one run would therefore vanish from the queue with no
 * error to notice. The fix here: page only to DISCOVER runIds, then re-query
 * `?runId=` per run, which returns that run's whole set and carries no cursor
 * at these sizes. Correctness comes from the per-run read, never from the walk.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type {
  ApiProposal,
  ApiProposalState,
  ApiRun,
  ProposalsPage,
  ProposalsQuery,
} from '@/api/types'
import type { AuthActionResult } from '@/data/auth'
import { draftsFromRun, type LiveDraft } from '@/data/generate'
import { useLiveWorkingOrgId } from '@/data/provider'

export type { ApiProposal as Proposal, ApiProposalState as ProposalState } from '@/api/types'

/** The max the contract allows; asking for fewer only invites boundaries. */
const PAGE_LIMIT = 200
/** Stop after this many pages and offer "load more" rather than walking forever. */
export const MAX_PAGES = 5

/**
 * The published id the app records on approve (D-INT-K).
 *
 * DETERMINISTIC on purpose: re-approving with the same id is a documented safe
 * retry, so a double click, a flaky connection and a page reload all converge
 * instead of racing. A random id would turn the second attempt into a 409.
 */
export function publishedIdFor(proposalId: string): string {
  return `mlk_${proposalId}`
}

/** One reviewable item: the ledger's decision joined to the run's draft. */
export interface ReviewItem {
  proposal: ApiProposal
  /** Absent only if the run could not be read — the row still renders. */
  draft?: LiveDraft
}

type Failure = Extract<AuthActionResult, { ok: false }>

function toFailure(error: unknown): Failure {
  if (isApiError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldDetails,
      retryAfterSeconds: error.retryAfterSeconds,
    }
  }
  throw error
}

/**
 * Terminal runs are immutable, so their reads are cached for the session:
 * memory for this page, sessionStorage so a reload does not re-fetch every run
 * behind the queue. A non-terminal run is never cached — it is still changing.
 */
const runMemo = new Map<string, ApiRun>()
const RUN_CACHE_PREFIX = 'ab-run-'

function cachedRun(runId: string): ApiRun | undefined {
  const inMemory = runMemo.get(runId)
  if (inMemory) return inMemory
  try {
    const raw = window.sessionStorage.getItem(RUN_CACHE_PREFIX + runId)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as ApiRun
    runMemo.set(runId, parsed)
    return parsed
  } catch {
    return undefined
  }
}

function cacheRun(run: ApiRun): void {
  if (run.status !== 'completed') return
  runMemo.set(run.runId, run)
  try {
    window.sessionStorage.setItem(RUN_CACHE_PREFIX + run.runId, JSON.stringify(run))
  } catch {
    // A full or blocked store costs a refetch, nothing more.
  }
}

/** Test seam: the cache is process-wide, so tests must be able to clear it. */
export function clearRunCache(): void {
  runMemo.clear()
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(RUN_CACHE_PREFIX)) window.sessionStorage.removeItem(key)
    }
  } catch {
    // Nothing to clear.
  }
}

export function useProposalActions() {
  const orgId = useLiveWorkingOrgId()
  const live = isLiveMode()
  const path = (query: ProposalsQuery = {}) => {
    const search = new URLSearchParams()
    if (query.state) search.set('state', query.state)
    if (query.runId) search.set('runId', query.runId)
    if (query.limit) search.set('limit', String(query.limit))
    if (query.cursor) search.set('cursor', query.cursor)
    const suffix = search.toString()
    return `/orgs/${orgId}/alphastudio/proposals${suffix ? `?${suffix}` : ''}`
  }

  return {
    orgId,

    async page(query: ProposalsQuery): Promise<ProposalsPage | null> {
      if (!live || !orgId) return null
      try {
        return await api<ProposalsPage>('GET', path(query))
      } catch {
        return null
      }
    },

    /**
     * Every proposal of one run — the AUTHORITATIVE read.
     *
     * No cursor is involved at these sizes (a run yields at most six), so this
     * is immune to the timestamp tie-break bug that makes the paged walk lose
     * rows. Everything the queue renders comes from here.
     */
    async forRun(runId: string): Promise<ApiProposal[]> {
      if (!live || !orgId) return []
      try {
        return (await api<ProposalsPage>('GET', path({ runId }))).proposals
      } catch {
        return []
      }
    },

    /**
     * The review queue for one state, joined to its drafts.
     *
     * Two steps, and the split is deliberate: the walk DISCOVERS which runs
     * are involved, and the per-run read decides what is true about them.
     */
    async review(
      state: ApiProposalState,
      pages = MAX_PAGES,
    ): Promise<{ items: ReviewItem[]; more: boolean }> {
      if (!live || !orgId) return { items: [], more: false }

      // 1. Walk, only to learn the runIds.
      const runIds: string[] = []
      let cursor: string | undefined
      let walked = 0
      let more = false
      do {
        const page = await this.page({ state, limit: PAGE_LIMIT, cursor })
        if (!page) break
        for (const proposal of page.proposals) {
          if (!runIds.includes(proposal.runId)) runIds.push(proposal.runId)
        }
        cursor = page.nextCursor
        walked += 1
        // The END is the ABSENCE of a cursor, never a short page: rows can be
        // missing from a page without the list being finished.
        if (cursor && walked >= pages) {
          more = true
          break
        }
      } while (cursor)

      // 2. Per run: the authoritative proposals, and the draft content.
      const items: ReviewItem[] = []
      for (const runId of runIds) {
        const [proposals, run] = await Promise.all([this.forRun(runId), this.run(runId)])
        const drafts = run ? draftsFromRun(run) : []
        for (const proposal of proposals) {
          if (proposal.state !== state) continue
          items.push({
            proposal,
            draft: drafts.find((entry) => entry.proposalId === proposal.proposalId),
          })
        }
      }
      // Newest run first, matching the ledger's own order.
      return { items, more }
    },

    /** A run read, cached when terminal (they are immutable once completed). */
    async run(runId: string): Promise<ApiRun | null> {
      if (!live || !orgId) return null
      const cached = cachedRun(runId)
      if (cached) return cached
      try {
        const run = await api<ApiRun>('GET', `/orgs/${orgId}/alphastudio/posts/runs/${runId}`)
        cacheRun(run)
        return run
      } catch {
        return null
      }
    },

    /**
     * Approve, and record it as posted (D-INT-K).
     *
     * There is no publishing on the wire, so this IS the whole act: the
     * platform marks the proposal approved AND creates the published entry
     * dated now. The contract advises calling it when a post actually goes
     * live; with no publish path to wait for, the app is honest about doing
     * both at once instead of pretending to hold one back.
     */
    async approve(proposalId: string): Promise<{ ok: true; proposal: ApiProposal } | Failure> {
      try {
        const proposal = await api<ApiProposal>(
          'POST',
          `/orgs/${orgId}/alphastudio/proposals/${proposalId}/approve`,
          { body: { publishedId: publishedIdFor(proposalId) } },
        )
        return { ok: true, proposal }
      } catch (error) {
        return toFailure(error)
      }
    },

    /**
     * Decline, with an optional reason. The row STAYS: it is the instruction
     * the next run is scored against, which is why this is not a delete and
     * why the reason is worth asking for.
     */
    async decline(
      proposalId: string,
      reason?: string,
    ): Promise<{ ok: true; proposal: ApiProposal } | Failure> {
      const trimmed = reason?.trim()
      try {
        const proposal = await api<ApiProposal>(
          'POST',
          `/orgs/${orgId}/alphastudio/proposals/${proposalId}/decline`,
          { body: trimmed ? { reason: trimmed.slice(0, 500) } : {} },
        )
        return { ok: true, proposal }
      } catch (error) {
        return toFailure(error)
      }
    },
  }
}
