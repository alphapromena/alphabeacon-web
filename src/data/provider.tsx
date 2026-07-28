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
  CalendarSource,
  Dataset,
  DatasetId,
  Org,
  Platform,
  Schedule,
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
  }
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
