/**
 * DataProvider — the one shared-state seam in the app.
 *
 * Holds the active dataset (a whole-tenant world), the fake session, and an
 * in-memory reducer for session-scoped mutations. Features read ONLY through
 * the hooks exported here — never by importing `src/data/entities/*` — which
 * is the discipline that lets a future backend resolve behind this same seam
 * instead of forcing a rewrite (web-plan.md §13).
 *
 * Nothing persists: a refresh rebuilds the active dataset from its factory.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { buildDataset, DATASETS, DEFAULT_DATASET_ID } from '@/data/datasets'
import type {
  Asset,
  CalendarSource,
  Dataset,
  DatasetId,
  Draft,
  Org,
  Platform,
  Schedule,
  StudioJob,
  Tone,
} from '@/data/types'
import { MAX_SIGN_IN_ATTEMPTS, SIGN_IN_LOCKOUT_MS } from '@/data/types'
import { canTransition, type DraftStatus } from '@/lib/draft-status'

/** A5 runs five steps; N3 resumes at whichever one is unfinished. */
export type OnboardingStep = Org['onboarding']['resumeStep']

/** /dev/states override: force the loading or error presentation anywhere. */
export type DevForce = 'none' | 'loading' | 'error'

export interface DataState {
  datasetId: DatasetId
  world: Dataset
  devForce: DevForce
}

export type DataAction =
  | { type: 'dataset/switch'; id: DatasetId }
  | { type: 'dev/force'; mode: DevForce }
  | { type: 'draft/transition'; draftId: string; to: DraftStatus }
  | { type: 'notifications/markAllRead' }
  | { type: 'session/signOut' }
  | { type: 'session/signIn' }
  // --- auth (A1–A4) ---------------------------------------------------------
  | { type: 'auth/signUp'; name: string; email: string; orgName: string }
  | { type: 'auth/verifyEmail' }
  | { type: 'auth/signInSucceeded' }
  | { type: 'auth/signInFailed' }
  | { type: 'auth/clearLockout' }
  // --- onboarding (A5) ------------------------------------------------------
  | { type: 'onboarding/goToStep'; step: OnboardingStep }
  | { type: 'onboarding/saveBrand'; offer: string; differentiators: string[]; name: string }
  | { type: 'onboarding/complete' }
  | { type: 'schedule/update'; patch: Partial<Schedule> }
  | { type: 'schedule/start' }
  | { type: 'tones/create'; tone: Tone }
  | { type: 'connections/connect'; platform: Platform }
  | { type: 'connections/disconnect'; platform: Platform }
  | { type: 'eventSources/add'; source: CalendarSource }
  | { type: 'eventSources/remove'; sourceId: string }
  // --- review queue (D2–D5) -------------------------------------------------
  | { type: 'draft/approve'; draftId: string }
  | { type: 'draft/reject'; draftId: string; reason: string }
  | { type: 'draft/edit'; draftId: string; copy: string }
  /** Reserves credits and puts the draft in media_pending until the job lands. */
  | { type: 'media/start'; draftId: string; jobId: string; modelId: string; prompt: string }
  | { type: 'media/succeed'; jobId: string; assetId: string }
  | { type: 'media/fail'; jobId: string; reason: string }
  | { type: 'draft/schedule'; draftId: string; scheduledFor: string; platforms: Platform[] }
  | { type: 'draft/publish'; draftId: string }
  // --- calendar + connections (C1-C4, B1-B3) --------------------------------
  | { type: 'slot/skip'; slotId: string }
  | { type: 'slot/unskip'; slotId: string }
  | {
      type: 'connection/setPermission'
      platform: Platform
      key: 'analytics' | 'posting'
      value: boolean
    }
  | { type: 'connection/reconnect'; platform: Platform }
  | { type: 'connection/setPages'; platform: Platform; pageIds: string[] }
  | { type: 'eventSources/toggleCalendar'; sourceId: string; calendarId: string; enabled: boolean }
  | { type: 'eventSources/retry'; sourceId: string }

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'dataset/switch':
      return { ...state, datasetId: action.id, world: buildDataset(action.id) }
    case 'dev/force':
      return { ...state, devForce: action.mode }
    case 'draft/transition': {
      const draft = state.world.drafts.find((d) => d.id === action.draftId)
      // Illegal transitions are a no-op by design: buttons render from
      // canTransition, so this branch only guards programmer error.
      if (!draft || !canTransition(draft.status, action.to)) return state
      const at = new Date().toISOString()
      const drafts = state.world.drafts.map((d) =>
        d.id === action.draftId
          ? { ...d, status: action.to, timeline: [...d.timeline, { status: action.to, at }] }
          : d,
      )
      return { ...state, world: { ...state.world, drafts } }
    }
    case 'notifications/markAllRead':
      return {
        ...state,
        world: {
          ...state.world,
          notifications: state.world.notifications.map((n) => ({ ...n, read: true })),
        },
      }
    // The session is local and fake, but signing out must really sign out:
    // the route guards read this flag, so the shell's Sign out exercises the
    // same redirect a real one would.
    case 'session/signOut':
      return {
        ...state,
        world: { ...state.world, session: { ...state.world.session, signedIn: false } },
      }
    case 'session/signIn':
      return {
        ...state,
        world: { ...state.world, session: { ...state.world.session, signedIn: true } },
      }

    /**
     * Signup creates the account AND the organization in one step (A1), then
     * parks on A3 until the email is verified — signed in, but not yet through
     * the door, which is what makes the verify gate real rather than cosmetic.
     */
    case 'auth/signUp': {
      const userId = state.world.session.userId
      const users = state.world.users.map((u) =>
        u.id === userId ? { ...u, name: action.name, email: action.email } : u,
      )
      return {
        ...state,
        world: {
          ...state.world,
          users,
          org: { ...state.world.org, name: action.orgName },
          session: {
            ...state.world.session,
            signedIn: true,
            pendingEmail: action.email,
            emailVerified: false,
          },
        },
      }
    }
    case 'auth/verifyEmail':
      return {
        ...state,
        world: {
          ...state.world,
          session: { ...state.world.session, emailVerified: true, pendingEmail: undefined },
        },
      }
    case 'auth/signInSucceeded':
      return {
        ...state,
        world: {
          ...state.world,
          session: {
            ...state.world.session,
            signedIn: true,
            emailVerified: true,
            failedSignIns: 0,
            lockedUntil: undefined,
          },
        },
      }
    case 'auth/signInFailed': {
      const failedSignIns = state.world.session.failedSignIns + 1
      // The lockout is a real gate, not a scolding message: past the limit the
      // form itself is disabled until the countdown clears.
      const lockedUntil =
        failedSignIns >= MAX_SIGN_IN_ATTEMPTS ? Date.now() + SIGN_IN_LOCKOUT_MS : undefined
      return {
        ...state,
        world: { ...state.world, session: { ...state.world.session, failedSignIns, lockedUntil } },
      }
    }
    case 'auth/clearLockout':
      return {
        ...state,
        world: {
          ...state.world,
          session: { ...state.world.session, failedSignIns: 0, lockedUntil: undefined },
        },
      }

    case 'onboarding/goToStep':
      return {
        ...state,
        world: {
          ...state.world,
          org: { ...state.world.org, onboarding: { completed: false, resumeStep: action.step } },
        },
      }
    case 'onboarding/saveBrand':
      return {
        ...state,
        world: {
          ...state.world,
          org: {
            ...state.world.org,
            name: action.name,
            offer: action.offer,
            differentiators: action.differentiators,
          },
        },
      }
    case 'onboarding/complete':
      return {
        ...state,
        world: {
          ...state.world,
          org: { ...state.world.org, onboarding: { completed: true, resumeStep: 5 } },
        },
      }

    case 'schedule/update':
      return {
        ...state,
        world: { ...state.world, schedule: { ...state.world.schedule, ...action.patch } },
      }
    /** "Start pipeline" activates scheduling for the org — not a soft save. */
    case 'schedule/start':
      return {
        ...state,
        world: { ...state.world, schedule: { ...state.world.schedule, started: true } },
      }

    case 'tones/create':
      return { ...state, world: { ...state.world, tones: [...state.world.tones, action.tone] } }

    case 'connections/connect':
      return {
        ...state,
        world: {
          ...state.world,
          connections: state.world.connections.map((c) =>
            c.platform === action.platform
              ? {
                  ...c,
                  status: 'active',
                  accountName: state.world.org.name,
                  handle: state.world.org.name.toLowerCase().replace(/\s+/g, ''),
                  connectedSince: new Date().toISOString().slice(0, 10),
                  permissions: { analytics: true, posting: true },
                }
              : c,
          ),
        },
      }
    case 'connections/disconnect':
      return {
        ...state,
        world: {
          ...state.world,
          connections: state.world.connections.map((c) =>
            c.platform === action.platform
              ? {
                  ...c,
                  status: 'not_connected',
                  accountName: undefined,
                  handle: undefined,
                  connectedSince: undefined,
                  permissions: { analytics: false, posting: false },
                  scopes: [],
                }
              : c,
          ),
        },
      }

    case 'eventSources/add':
      return {
        ...state,
        world: { ...state.world, eventSources: [...state.world.eventSources, action.source] },
      }
    case 'eventSources/remove':
      return {
        ...state,
        world: {
          ...state.world,
          eventSources: state.world.eventSources.filter((s) => s.id !== action.sourceId),
        },
      }

    // -----------------------------------------------------------------------
    // The review queue. Every status change routes through `transitionDraft`,
    // so the state machine is enforced once rather than per action.
    // -----------------------------------------------------------------------
    case 'draft/approve':
      return transitionDraft(state, action.draftId, 'approved')
    case 'draft/reject':
      return transitionDraft(state, action.draftId, 'rejected', (draft) => ({
        ...draft,
        failureReason: action.reason,
      }))
    case 'draft/edit':
      return {
        ...state,
        world: {
          ...state.world,
          drafts: state.world.drafts.map((d) =>
            d.id === action.draftId ? { ...d, copy: action.copy } : d,
          ),
        },
      }

    case 'media/start': {
      const model = state.world.studioModels.find((m) => m.id === action.modelId)
      if (!model) return state
      const next = transitionDraft(state, action.draftId, 'media_pending')
      if (next === state) return state
      const job: StudioJob = {
        id: action.jobId,
        modelId: model.id,
        kind: model.kind,
        prompt: action.prompt,
        credits: model.credits,
        status: 'running',
        origin: { type: 'draft', draftId: action.draftId },
        createdAt: new Date().toISOString(),
      }
      return {
        ...next,
        world: {
          ...next.world,
          jobs: [job, ...next.world.jobs],
          // Held, not spent: a hold that never commits is released in full.
          ledger: [
            ...next.world.ledger,
            {
              id: `led_${action.jobId}_reserve`,
              at: job.createdAt,
              type: 'reserved',
              amount: -model.credits,
              ref: { kind: 'job', id: job.id },
            },
          ],
        },
      }
    }

    case 'media/succeed': {
      const job = state.world.jobs.find((j) => j.id === action.jobId)
      if (!job || job.origin.type !== 'draft') return state
      const at = new Date().toISOString()
      const asset: Asset = {
        id: action.assetId,
        jobId: job.id,
        kind: job.kind,
        label: job.prompt.slice(0, 60),
        createdAt: at,
      }
      const withMedia = transitionDraft(state, job.origin.draftId, 'media_ready', (draft) => ({
        ...draft,
        assetId: asset.id,
      }))
      return {
        ...withMedia,
        world: {
          ...withMedia.world,
          jobs: withMedia.world.jobs.map((j) =>
            j.id === job.id ? { ...j, status: 'succeeded', assetId: asset.id } : j,
          ),
          assets: [asset, ...withMedia.world.assets],
          ledger: [
            ...withMedia.world.ledger,
            {
              id: `led_${job.id}_release`,
              at,
              type: 'released',
              amount: job.credits,
              ref: { kind: 'job', id: job.id },
            },
            {
              id: `led_${job.id}_commit`,
              at,
              type: 'committed',
              amount: -job.credits,
              ref: { kind: 'job', id: job.id },
            },
          ],
        },
      }
    }

    case 'media/fail': {
      const job = state.world.jobs.find((j) => j.id === action.jobId)
      if (!job || job.origin.type !== 'draft') return state
      const at = new Date().toISOString()
      // A failed generation costs nothing: the hold is released and the draft
      // goes back to `approved`, where the media entry point still exists.
      const reverted = transitionDraft(state, job.origin.draftId, 'approved')
      return {
        ...reverted,
        world: {
          ...reverted.world,
          jobs: reverted.world.jobs.map((j) =>
            j.id === job.id ? { ...j, status: 'failed', failureReason: action.reason } : j,
          ),
          ledger: [
            ...reverted.world.ledger,
            {
              id: `led_${job.id}_release`,
              at,
              type: 'released',
              amount: job.credits,
              ref: { kind: 'job', id: job.id },
            },
          ],
        },
      }
    }

    case 'draft/schedule':
      return transitionDraft(state, action.draftId, 'scheduled', (draft) => ({
        ...draft,
        scheduledFor: action.scheduledFor,
        publishResults: action.platforms.map((platform) => ({ platform, ok: true })),
      }))

    case 'slot/skip':
      return {
        ...state,
        world: {
          ...state.world,
          slots: state.world.slots.map((slot) =>
            slot.id === action.slotId
              ? { ...slot, status: 'skipped', skippedAt: new Date().toISOString() }
              : slot,
          ),
        },
      }
    case 'slot/unskip':
      return {
        ...state,
        world: {
          ...state.world,
          slots: state.world.slots.map((slot) =>
            slot.id === action.slotId ? { ...slot, status: 'pending', skippedAt: undefined } : slot,
          ),
        },
      }

    case 'connection/setPermission':
      return {
        ...state,
        world: {
          ...state.world,
          connections: state.world.connections.map((c) =>
            c.platform === action.platform
              ? { ...c, permissions: { ...c.permissions, [action.key]: action.value } }
              : c,
          ),
        },
      }
    case 'connection/reconnect':
      return {
        ...state,
        world: {
          ...state.world,
          connections: state.world.connections.map((c) =>
            c.platform === action.platform
              ? { ...c, status: 'active', lastSyncAt: new Date().toISOString() }
              : c,
          ),
        },
      }
    case 'connection/setPages':
      return {
        ...state,
        world: {
          ...state.world,
          connections: state.world.connections.map((c) =>
            c.platform === action.platform && c.pages
              ? {
                  ...c,
                  pages: c.pages.map((page) => ({
                    ...page,
                    selected: action.pageIds.includes(page.id),
                  })),
                }
              : c,
          ),
        },
      }

    case 'eventSources/toggleCalendar':
      return {
        ...state,
        world: {
          ...state.world,
          eventSources: state.world.eventSources.map((source) =>
            source.id === action.sourceId && source.calendars
              ? {
                  ...source,
                  calendars: source.calendars.map((calendar) =>
                    calendar.id === action.calendarId
                      ? { ...calendar, enabled: action.enabled }
                      : calendar,
                  ),
                }
              : source,
          ),
        },
      }
    case 'eventSources/retry':
      return {
        ...state,
        world: {
          ...state.world,
          eventSources: state.world.eventSources.map((source) =>
            source.id === action.sourceId ? { ...source, status: 'active' } : source,
          ),
        },
      }

    case 'draft/publish': {
      const draft = state.world.drafts.find((d) => d.id === action.draftId)
      if (!draft) return state
      // A channel that needs re-auth fails on its own; the others still go out,
      // which is why D5 reports per-channel results rather than one verdict.
      const results = (draft.publishResults ?? []).map((result) => {
        const connection = state.world.connections.find((c) => c.platform === result.platform)
        return connection?.status === 'active'
          ? { ...result, ok: true }
          : { ...result, ok: false, reason: 'Connection needs re-auth' }
      })
      const anyFailed = results.some((r) => !r.ok)
      return transitionDraft(
        state,
        action.draftId,
        anyFailed ? 'publish_failed' : 'published',
        (d) => ({
          ...d,
          publishResults: results,
          failureReason: anyFailed
            ? 'Some channels could not publish. Reconnect them and retry.'
            : undefined,
        }),
      )
    }
  }
}

/**
 * The one place a draft's status changes. Illegal transitions are a no-op:
 * buttons render from `canTransition`, so reaching one means programmer error,
 * not user error — and silently refusing beats corrupting the queue.
 */
function transitionDraft(
  state: DataState,
  draftId: string,
  to: DraftStatus,
  patch?: (draft: Draft) => Draft,
): DataState {
  const draft = state.world.drafts.find((d) => d.id === draftId)
  if (!draft || !canTransition(draft.status, to)) return state
  const at = new Date().toISOString()
  const drafts = state.world.drafts.map((d) => {
    if (d.id !== draftId) return d
    const moved: Draft = { ...d, status: to, timeline: [...d.timeline, { status: to, at }] }
    return patch ? patch(moved) : moved
  })
  return { ...state, world: { ...state.world, drafts } }
}

interface DataContextValue {
  state: DataState
  dispatch: Dispatch<DataAction>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({
  children,
  initialDatasetId = DEFAULT_DATASET_ID,
}: {
  children: ReactNode
  initialDatasetId?: DatasetId
}) {
  const [state, dispatch] = useReducer(dataReducer, initialDatasetId, (id: DatasetId) => ({
    datasetId: id,
    world: buildDataset(id),
    devForce: 'none' as DevForce,
  }))
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// Read hooks — the only data surface features may touch
// ---------------------------------------------------------------------------

export function useDataDispatch() {
  return useData().dispatch
}

export function useDatasetInfo() {
  const { state } = useData()
  return {
    id: state.datasetId,
    label: state.world.label,
    description: state.world.description,
    all: DATASETS.map((d) => {
      const built = d.build()
      return { id: d.id, label: built.label, description: built.description }
    }),
  }
}

export function useOrg() {
  return useData().state.world.org
}

export function useSession() {
  const { world } = useData().state
  const user = world.users.find((u) => u.id === world.session.userId)
  return { ...world.session, user }
}

export function useUsers() {
  return useData().state.world.users
}

export function useDrafts() {
  return useData().state.world.drafts
}

export function useSlots() {
  return useData().state.world.slots
}

export function useConnections() {
  return useData().state.world.connections
}

export function useTones() {
  return useData().state.world.tones
}

export function useGenerationModels() {
  return useData().state.world.generationModels
}

export function useStudioModels() {
  return useData().state.world.studioModels
}

export function useJobs() {
  return useData().state.world.jobs
}

export function useAssets() {
  return useData().state.world.assets
}

export function usePlans() {
  return useData().state.world.plans
}

export function useBilling() {
  return useData().state.world.billing
}

export function useLedger() {
  return useData().state.world.ledger
}

/** The credit balance is always computed from the ledger, never stored. */
export function useCreditBalance() {
  const ledger = useLedger()
  return ledger.reduce((sum, entry) => sum + entry.amount, 0)
}

export function useSchedule() {
  return useData().state.world.schedule
}

export function useEventSources() {
  return useData().state.world.eventSources
}

export function useCalendarEvents() {
  return useData().state.world.events
}

export function useAnalytics() {
  return useData().state.world.analytics
}

export function useNotifications() {
  return useData().state.world.notifications
}

export function useActivity() {
  return useData().state.world.activity
}

export function useDevForce() {
  return useData().state.devForce
}

// ---------------------------------------------------------------------------
// Presentation phase — the four data states, selected rather than awaited
// ---------------------------------------------------------------------------

export type ScreenPhase = 'loading' | 'error' | 'ready'

/**
 * Drives a screen's loading/error presentation. The dataset supplies empty
 * and populated; /dev/states forces loading or error; otherwise a short
 * artificial delay on first mount makes the skeleton design real.
 */
export function useScreenPhase(delayMs = 400): ScreenPhase {
  const devForce = useDevForce()
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), delayMs)
    return () => window.clearTimeout(t)
  }, [delayMs])
  if (devForce === 'loading') return 'loading'
  if (devForce === 'error') return 'error'
  return settled ? 'ready' : 'loading'
}
