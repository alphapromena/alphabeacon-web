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
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { configureApi } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { loadSession, purgeSession } from '@/api/session'
import type { AuthSession, OrgRole } from '@/api/types'
import { toastError } from '@/components/ab/toast'
import { clearAuthSession, graftAuthSession } from '@/data/adapters/auth-adapter'
import type { BrandGraft } from '@/data/adapters/brand-adapter'
import type { TeamGraft } from '@/data/adapters/org-adapter'
import type { SchedulingGraft } from '@/data/adapters/scheduling-adapter'
import {
  fetchBrand,
  fetchInbox,
  fetchScheduling,
  fetchTeam,
  fetchOrgRoot,
  refreshAuthSnapshot,
} from '@/data/live-sync'
import { buildDataset, DATASETS, resolveInitialDatasetId } from '@/data/datasets'
import type {
  AppNotification,
  Asset,
  CalendarSource,
  Dataset,
  DatasetId,
  Draft,
  FollowedSource,
  KnowledgeDoc,
  KnowledgeStatus,
  Org,
  Platform,
  PlanTier,
  Schedule,
  StudioJob,
  TeamInvite,
  Tone,
  User,
} from '@/data/types'
import { MAX_SIGN_IN_ATTEMPTS, SIGN_IN_LOCKOUT_MS } from '@/data/types'
import { canTransition, type DraftStatus } from '@/lib/draft-status'
import { MESSAGES } from '@/lib/messages'

/** A5 runs five steps; N3 resumes at whichever one is unfinished. */
export type OnboardingStep = Org['onboarding']['resumeStep']

/** /dev/states override: force the loading or error presentation anywhere. */
export type DevForce = 'none' | 'loading' | 'error'

/**
 * N4's condition. `auto` means "believe the browser" — the offline banner then
 * follows the real `navigator.onLine`. The other two exist because a static app
 * has no request that can fail, so degraded service has no honest signal to
 * read; forcing it from `/dev/states` is how that designed state stays
 * reachable without inventing a fake one in the product.
 */
export type Connectivity = 'auto' | 'offline' | 'degraded'

export interface DataState {
  datasetId: DatasetId
  world: Dataset
  devForce: DevForce
  connectivity: Connectivity
  /**
   * The live AlphaStudio session, when one exists (live mode only; absent ≡
   * null in static mode and in older test fixtures). Kept in state so a
   * dataset switch can re-graft it onto the fresh world.
   */
  liveSession?: AuthSession | null
  /** The live sync's real phase — what useScreenPhase reports in live mode. */
  liveSyncPhase?: 'idle' | 'syncing' | 'error' | 'ready'
  /** Bumped to re-run the sync (the error state's Try again path). */
  liveResyncNonce?: number
  /** userId → membership id, for the member/invite management endpoints. */
  liveMemberIds?: Record<string, string>
  /** Brand mutation plumbing: the canonical voice row, topic text → row id. */
  liveBrandIds?: {
    /** The `Brand voice` row writes target; null until one exists (D-INT-B). */
    canonicalVoiceId: string | null
    topicIdByText: Record<string, string>
  }
  /** The working schedule's API id (INT-4); null until one is created. */
  liveScheduleId?: string | null
  /** The unread-count ENDPOINT's number (INT-5) — the badge's truth. */
  liveUnreadCount?: number
  /**
   * The viewer's OWN role in the working org, from the workspace root
   * (`GET /orgs/:orgId` → membership.role). Review item: permissions derive
   * from this, never inferred from the members list.
   */
  liveViewerRole?: OrgRole | null
}

export type DataAction =
  | { type: 'dataset/switch'; id: DatasetId }
  | { type: 'dev/force'; mode: DevForce }
  | { type: 'dev/connectivity'; mode: Connectivity }
  | { type: 'draft/transition'; draftId: string; to: DraftStatus }
  | { type: 'notifications/markAllRead' }
  | { type: 'session/signOut' }
  | { type: 'session/signIn' }
  // --- live mode (INT-1): the AlphaStudio session entering/leaving the world -
  | { type: 'live/sessionEstablished'; session: AuthSession }
  | { type: 'live/sessionCleared' }
  | { type: 'live/pendingVerification'; email: string }
  // --- live mode (INT-2/3): the sync grafting covered entities onto the world
  | { type: 'live/syncStarted' }
  | { type: 'live/syncFailed' }
  | { type: 'live/resync' }
  | {
      type: 'live/orgSynced'
      team: TeamGraft
      brand: BrandGraft | null
      scheduling: SchedulingGraft | null
      inbox: { notifications: AppNotification[]; unread: number } | null
      viewerRole: OrgRole | null
      /** The org's country (live only); null when unset or unknown. */
      country?: string | null
    }
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
  /** `draftId` empty means a standalone Studio run with nothing to attach to. */
  | {
      type: 'media/start'
      draftId: string
      jobId: string
      modelId: string
      prompt: string
      params?: Record<string, string | number | boolean>
    }
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
  // --- studio + billing (E1-E4, H1-H4) --------------------------------------
  | { type: 'asset/delete'; assetId: string }
  | { type: 'asset/attach'; assetId: string; draftId: string }
  | { type: 'billing/changePlan'; planId: PlanTier }
  | { type: 'billing/resolvePastDue' }
  // --- on-demand generate (F1) ----------------------------------------------
  /** A finished run becomes an ordinary draft, in the ordinary queue. */
  | { type: 'draft/create'; draft: Draft }
  // --- settings (I1-I7) -----------------------------------------------------
  | { type: 'org/update'; patch: Partial<Org> }
  | { type: 'tones/update'; tone: Tone }
  | { type: 'tones/delete'; toneId: string }
  | { type: 'sources/add'; source: FollowedSource }
  | { type: 'sources/remove'; sourceId: string }
  | { type: 'topics/set'; topics: string[] }
  | { type: 'knowledge/add'; doc: KnowledgeDoc }
  | { type: 'knowledge/status'; docId: string; status: KnowledgeStatus; failureReason?: string }
  | { type: 'knowledge/progress'; docId: string; progress: number }
  | { type: 'knowledge/remove'; docId: string }
  | { type: 'team/invite'; invite: TeamInvite }
  | { type: 'team/revokeInvite'; inviteId: string }
  | { type: 'team/removeMember'; userId: string }
  | { type: 'team/setRole'; userId: string; role: User['role'] }

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'dataset/switch': {
      // A fresh world, but the LIVE session survives the switch: covered
      // entities stay real while the dataset supplies everything else.
      const world = buildDataset(action.id)
      const withSession = state.liveSession
        ? graftAuthSession(world, state.liveSession)
        : isLiveMode()
          ? clearAuthSession(world)
          : world
      return { ...state, datasetId: action.id, world: withSession }
    }
    case 'live/sessionEstablished':
      return {
        ...state,
        liveSession: action.session,
        world: graftAuthSession(state.world, action.session),
      }
    case 'live/sessionCleared':
      return {
        ...state,
        liveSession: null,
        liveSyncPhase: 'idle',
        liveMemberIds: undefined,
        world: clearAuthSession(state.world),
      }
    case 'live/syncStarted':
      return { ...state, liveSyncPhase: 'syncing' }
    case 'live/syncFailed':
      return { ...state, liveSyncPhase: 'error' }
    case 'live/resync':
      return { ...state, liveResyncNonce: (state.liveResyncNonce ?? 0) + 1 }
    case 'live/orgSynced':
      return {
        ...state,
        liveSyncPhase: 'ready',
        liveMemberIds: action.team.memberIdByUserId,
        liveBrandIds: action.brand
          ? {
              canonicalVoiceId: action.brand.canonicalVoiceId,
              topicIdByText: action.brand.topicIdByText,
            }
          : undefined,
        liveScheduleId: action.scheduling ? action.scheduling.scheduleId : undefined,
        liveUnreadCount: action.inbox?.unread,
        liveViewerRole: action.viewerRole,
        world: {
          ...state.world,
          users: action.team.users,
          invites: action.team.invites,
          ...(action.brand
            ? {
                tones: action.brand.tones,
                followedSources: action.brand.sources,
                topics: action.brand.topics,
              }
            : {}),
          // ONE org patch, built from both halves. Nesting `org` inside the
          // brand branch worked only because brand and country happen to
          // arrive together, and a second `org:` key elsewhere in this literal
          // would silently clobber the first.
          org: {
            ...state.world.org,
            // Every voice row's rules, flattened in creation order — the same
            // order the backend builds the context bundle in, so this IS what
            // the next generation is grounded on (D-INT-B). `examples` still
            // has no wire home.
            ...(action.brand ? { brandVoice: action.brand.brandVoice } : {}),
            country: action.country ?? null,
          },
          ...(action.scheduling
            ? {
                eventSources: action.scheduling.eventSources,
                events: action.scheduling.events,
                slots: action.scheduling.slots,
                ...(action.scheduling.schedule ? { schedule: action.scheduling.schedule } : {}),
              }
            : {}),
          ...(action.inbox ? { notifications: action.inbox.notifications } : {}),
        },
      }
    case 'live/pendingVerification':
      // Signed up, not yet verified: the verify screen needs the address, and
      // nothing may pretend to be signed in yet.
      return {
        ...state,
        world: {
          ...state.world,
          session: {
            ...state.world.session,
            signedIn: false,
            emailVerified: false,
            pendingEmail: action.email,
          },
        },
      }
    case 'dev/force':
      // Every error screen's Try again dispatches this with 'none'; in live
      // mode the honest retry is a resync, so the same press re-runs it.
      return {
        ...state,
        devForce: action.mode,
        ...(action.mode === 'none' && state.liveSyncPhase === 'error'
          ? { liveResyncNonce: (state.liveResyncNonce ?? 0) + 1 }
          : {}),
      }
    case 'dev/connectivity':
      return { ...state, connectivity: action.mode }
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
        // The endpoint-backed badge follows the optimistic dim (INT-5).
        liveUnreadCount: state.liveUnreadCount !== undefined ? 0 : undefined,
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
      // Draft-scoped runs move the draft; standalone runs have nothing to move,
      // and must not be refused just because there is no draft.
      const next = action.draftId ? transitionDraft(state, action.draftId, 'media_pending') : state
      if (action.draftId && next === state) return state
      const job: StudioJob = {
        id: action.jobId,
        modelId: model.id,
        kind: model.kind,
        prompt: action.prompt,
        params: action.params,
        credits: model.credits,
        status: 'running',
        origin: action.draftId
          ? { type: 'draft', draftId: action.draftId }
          : { type: 'standalone' },
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
      if (!job) return state
      const at = new Date().toISOString()
      const asset: Asset = {
        id: action.assetId,
        jobId: job.id,
        kind: job.kind,
        label: job.prompt.slice(0, 60),
        createdAt: at,
      }
      const withMedia =
        job.origin.type === 'draft'
          ? transitionDraft(state, job.origin.draftId, 'media_ready', (draft) => ({
              ...draft,
              assetId: asset.id,
            }))
          : state
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
      if (!job) return state
      const at = new Date().toISOString()
      // A failed generation costs nothing: the hold is released and the draft
      // goes back to `approved`, where the media entry point still exists.
      const reverted =
        job.origin.type === 'draft' ? transitionDraft(state, job.origin.draftId, 'approved') : state
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

    case 'asset/delete':
      return {
        ...state,
        world: {
          ...state.world,
          assets: state.world.assets.filter((asset) => asset.id !== action.assetId),
          // A draft pointing at a deleted asset would render a ghost.
          drafts: state.world.drafts.map((draft) =>
            draft.assetId === action.assetId ? { ...draft, assetId: undefined } : draft,
          ),
        },
      }

    /** E4: attaching a standalone asset to a draft that has earned media. */
    case 'asset/attach': {
      const draft = state.world.drafts.find((d) => d.id === action.draftId)
      if (!draft) return state
      const attached = {
        ...state,
        world: {
          ...state.world,
          drafts: state.world.drafts.map((d) =>
            d.id === action.draftId ? { ...d, assetId: action.assetId } : d,
          ),
          jobs: state.world.jobs.map((job) =>
            job.assetId === action.assetId
              ? { ...job, origin: { type: 'draft' as const, draftId: action.draftId } }
              : job,
          ),
        },
      }
      // An approved draft becomes media_ready; one already further along keeps
      // its status, because attaching art does not un-schedule a post.
      return canTransition(draft.status, 'media_ready')
        ? transitionDraft(attached, action.draftId, 'media_ready')
        : attached
    }

    case 'billing/changePlan': {
      const plan = state.world.plans.find((p) => p.id === action.planId)
      if (!plan) return state
      const at = new Date().toISOString()
      return {
        ...state,
        world: {
          ...state.world,
          billing: { ...state.world.billing, planId: plan.id, status: 'active' },
          // A plan change grants its credits, and the grant is a ledger row
          // like any other — the balance is never written directly.
          ledger: [
            ...state.world.ledger,
            {
              id: `led_plan_${plan.id}_${at}`,
              at,
              type: 'grant',
              amount: plan.credits,
              ref: { kind: 'subscription', id: plan.id },
            },
          ],
        },
      }
    }

    case 'billing/resolvePastDue':
      return {
        ...state,
        world: { ...state.world, billing: { ...state.world.billing, status: 'active' } },
      }

    /**
     * F1's finished run. It enters at `pending_review` like anything the
     * pipeline produced, which is the point: an on-demand post is reviewed,
     * approved and scheduled through exactly the same machine.
     */
    case 'draft/create':
      return { ...state, world: { ...state.world, drafts: [action.draft, ...state.world.drafts] } }

    case 'org/update':
      return { ...state, world: { ...state.world, org: { ...state.world.org, ...action.patch } } }

    case 'tones/update':
      return {
        ...state,
        world: {
          ...state.world,
          tones: state.world.tones.map((tone) => (tone.id === action.tone.id ? action.tone : tone)),
        },
      }
    /**
     * Deleting a tone takes it out of the library and out of the schedule, so
     * nothing new can be drafted in it. Drafts that already used it keep their
     * copy — that text was written, and unwriting it would be a lie about what
     * was published. Presets are never deletable, so a schedule can never be
     * left with nothing to speak in.
     */
    case 'tones/delete':
      return {
        ...state,
        world: {
          ...state.world,
          tones: state.world.tones.filter(
            (tone) => tone.id !== action.toneId || tone.kind === 'preset',
          ),
          schedule: {
            ...state.world.schedule,
            toneIds: state.world.schedule.toneIds.filter((id) => id !== action.toneId),
          },
        },
      }

    case 'sources/add':
      return {
        ...state,
        world: { ...state.world, followedSources: [...state.world.followedSources, action.source] },
      }
    case 'sources/remove':
      return {
        ...state,
        world: {
          ...state.world,
          followedSources: state.world.followedSources.filter((s) => s.id !== action.sourceId),
        },
      }
    case 'topics/set':
      return { ...state, world: { ...state.world, topics: action.topics } }

    case 'knowledge/add':
      return {
        ...state,
        world: { ...state.world, knowledgeDocs: [action.doc, ...state.world.knowledgeDocs] },
      }
    /** The ingestion lifecycle: Uploading → Processing → Ready | Failed. */
    case 'knowledge/status':
      return {
        ...state,
        world: {
          ...state.world,
          knowledgeDocs: state.world.knowledgeDocs.map((doc) =>
            doc.id === action.docId
              ? {
                  ...doc,
                  status: action.status,
                  // Progress belongs to the upload; past it, it would be a lie.
                  progress: action.status === 'uploading' ? doc.progress : undefined,
                  failureReason: action.status === 'failed' ? action.failureReason : undefined,
                }
              : doc,
          ),
        },
      }
    case 'knowledge/progress':
      return {
        ...state,
        world: {
          ...state.world,
          knowledgeDocs: state.world.knowledgeDocs.map((doc) =>
            doc.id === action.docId ? { ...doc, progress: action.progress } : doc,
          ),
        },
      }
    case 'knowledge/remove':
      return {
        ...state,
        world: {
          ...state.world,
          knowledgeDocs: state.world.knowledgeDocs.filter((doc) => doc.id !== action.docId),
        },
      }

    case 'team/invite':
      return {
        ...state,
        world: { ...state.world, invites: [...state.world.invites, action.invite] },
      }
    case 'team/revokeInvite':
      return {
        ...state,
        world: {
          ...state.world,
          invites: state.world.invites.filter((invite) => invite.id !== action.inviteId),
        },
      }
    /**
     * Promote or demote in place.
     *
     * The last admin cannot be demoted: a workspace with no admin can never
     * change its own billing, team or connections again, and nothing in a
     * static app — or a real one — offers a way back from that. The UI confirms
     * the demotion; this refuses the unrecoverable one outright.
     */
    case 'team/setRole': {
      const admins = state.world.users.filter((user) => user.role === 'admin')
      const target = state.world.users.find((user) => user.id === action.userId)
      if (!target) return state
      if (action.role !== 'admin' && target.role === 'admin' && admins.length <= 1) return state
      return {
        ...state,
        world: {
          ...state.world,
          users: state.world.users.map((user) =>
            user.id === action.userId ? { ...user, role: action.role } : user,
          ),
        },
      }
    }

    case 'team/removeMember':
      return {
        ...state,
        world: {
          ...state.world,
          // Never the signed-in user: I7 does not render the control for
          // yourself, and the reducer refuses it too rather than trusting that.
          users:
            action.userId === state.world.session.userId
              ? state.world.users
              : state.world.users.filter((user) => user.id !== action.userId),
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
  // Deploy-selectable boot world (STEP 0): a preview can pin its dataset via
  // VITE_DEFAULT_DATASET; anything unknown falls back to the default.
  initialDatasetId = resolveInitialDatasetId(
    import.meta.env.VITE_DEFAULT_DATASET as string | undefined,
  ),
}: {
  children: ReactNode
  initialDatasetId?: DatasetId
}) {
  const [state, dispatch] = useReducer(
    dataReducer,
    initialDatasetId,
    (id: DatasetId): DataState => {
      const base: DataState = {
        datasetId: id,
        world: buildDataset(id),
        devForce: 'none' as DevForce,
        connectivity: 'auto' as Connectivity,
      }
      if (!isLiveMode()) return base
      // Live boot: a persisted session signs the world in as the real user; no
      // session means genuinely signed out — never the dataset's fake sign-in.
      const saved = loadSession()
      return saved
        ? { ...base, liveSession: saved, world: graftAuthSession(base.world, saved) }
        : { ...base, liveSession: null, world: clearAuthSession(base.world) }
    },
  )

  // The client's hooks read through refs so configureApi runs once: the token
  // always reflects current state, and a dead session (any Bearer-carrying
  // 401) purges, clears, explains, and lands on the login screen. Navigation
  // uses history + popstate so react-router follows without a reload — the
  // same pattern the OAuth-return deep links use.
  const liveSessionRef = useRef<AuthSession | null>(state.liveSession ?? null)
  liveSessionRef.current = state.liveSession ?? null
  useEffect(() => {
    if (!isLiveMode()) return
    configureApi({
      getToken: () => liveSessionRef.current?.token ?? null,
      onUnauthorized: () => {
        // A deliberate sign-out revokes the token while a sync may still be
        // in flight; its 401 is an echo, not a breach — nobody to evict.
        if (!liveSessionRef.current) return
        purgeSession()
        dispatch({ type: 'live/sessionCleared' })
        toastError(MESSAGES.errors.sessionExpired)
        window.history.pushState({}, '', '/login')
        window.dispatchEvent(new PopStateEvent('popstate'))
      },
    })
  }, [])

  // The live sync (INT-2): when a session stands, refresh /me + /me/orgs
  // (the stored record is a warm start, not the truth — open-items 6), then
  // pull the working org's covered entities. Re-runs on a fresh token, a new
  // working org, or an explicit live/resync (the error state's Try again).
  const syncedForRef = useRef<string | null>(null)
  const sessionToken = state.liveSession?.token ?? null
  const workingOrgId = state.liveSession?.orgs[0]?.id ?? null
  const resyncNonce = state.liveResyncNonce ?? 0
  useEffect(() => {
    if (!isLiveMode() || !sessionToken) return
    const syncKey = `${sessionToken}:${workingOrgId}:${resyncNonce}`
    if (syncedForRef.current === syncKey) return
    syncedForRef.current = syncKey

    let cancelled = false
    let completed = false
    const run = async () => {
      dispatch({ type: 'live/syncStarted' })
      try {
        const current = liveSessionRef.current
        if (!current) return
        const refreshed = await refreshAuthSnapshot(current)
        if (cancelled) return
        // Re-establish only when the snapshot moved — the syncKey guard keeps
        // the same-token re-dispatch from looping.
        if (JSON.stringify(refreshed) !== JSON.stringify(current)) {
          dispatch({ type: 'live/sessionEstablished', session: refreshed })
        }
        const orgId = refreshed.orgs[0]?.id
        if (orgId) {
          const [team, brand, scheduling, inbox, root] = await Promise.all([
            fetchTeam(orgId),
            fetchBrand(orgId),
            fetchScheduling(orgId),
            fetchInbox(orgId),
            fetchOrgRoot(orgId),
          ])
          if (cancelled) return
          dispatch({
            type: 'live/orgSynced',
            team,
            brand,
            scheduling,
            inbox,
            viewerRole: root.role,
            country: root.country,
          })
        } else {
          dispatch({
            type: 'live/orgSynced',
            team: { users: [], invites: [], memberIdByUserId: {} },
            brand: null,
            scheduling: null,
            inbox: null,
            viewerRole: null,
          })
        }
        completed = true
      } catch {
        completed = true
        if (!cancelled) dispatch({ type: 'live/syncFailed' })
      }
    }
    void run()
    return () => {
      cancelled = true
      // A cancelled, unfinished run releases its claim — otherwise
      // StrictMode's mount-cleanup-mount would cancel the first run and the
      // second would find the key taken: a sync that never completes.
      if (!completed && syncedForRef.current === syncKey) syncedForRef.current = null
    }
  }, [sessionToken, workingOrgId, resyncNonce])

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

/**
 * Whether covered entities resolve against the live API. Screens may ask this
 * to choose an AFFORDANCE (a real code entry vs the demo's stand-in button) —
 * never to special-case where data came from; reads stay identical in both
 * modes. Exposed as a hook so features keep importing only the provider.
 */
export function useLiveMode(): boolean {
  return isLiveMode()
}

/** Data-layer plumbing for the mutation seams (team.ts, account.ts) — the
 * working org and the userId → membership-id map. Not for features. */
export function useLiveWorkingOrgId(): string | null {
  return useData().state.liveSession?.orgs[0]?.id ?? null
}

export function useLiveMemberIds(): Record<string, string> | undefined {
  return useData().state.liveMemberIds
}

export function useLiveBrandIds(): DataState['liveBrandIds'] {
  return useData().state.liveBrandIds
}

export function useLiveScheduleId(): string | null {
  return useData().state.liveScheduleId ?? null
}

/** The viewer's own org role from the workspace root (live mode only). */
export function useLiveViewerRole(): OrgRole | null {
  return useData().state.liveViewerRole ?? null
}

/** The bell's badge: the unread-count endpoint's number in live mode (the
 *  list is one page; the count is the whole inbox), derived locally in the
 *  static demo. */
export function useUnreadNotificationCount(): number {
  const { state } = useData()
  return (
    state.liveUnreadCount ??
    state.world.notifications.filter((notification) => !notification.read).length
  )
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

export function useInvites() {
  return useData().state.world.invites
}

export function useFollowedSources() {
  return useData().state.world.followedSources
}

export function useTopics() {
  return useData().state.world.topics
}

export function useKnowledgeDocs() {
  return useData().state.world.knowledgeDocs
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

export function useConnectivity() {
  return useData().state.connectivity
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
  const { state } = useData()
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), delayMs)
    return () => window.clearTimeout(t)
  }, [delayMs])

  const syncPhase = state.liveSyncPhase
  if (devForce === 'loading') return 'loading'
  if (devForce === 'error') return 'error'
  // Live mode: the four states are REAL network states. Loading while the
  // sync runs, error when it failed, populated/empty from the synced world.
  if (state.liveSession) {
    if (syncPhase === 'syncing' || syncPhase === 'idle') return 'loading'
    if (syncPhase === 'error') return 'error'
    return 'ready'
  }
  return settled ? 'ready' : 'loading'
}
