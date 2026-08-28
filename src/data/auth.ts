/**
 * The auth seam (INT-1). Auth screens call THESE, never `src/api/` — the
 * ESLint restriction makes that structural. One signature, two
 * implementations:
 *
 * - **Static mode** reproduces the demo exactly: the dispatches, the fake
 *   duplicate email, any-password sign-in. The golden walk depends on it.
 * - **Live mode** speaks to AlphaStudio: real codes (000000 in dev), real
 *   409s, real rate limits — and every outcome comes back as an
 *   `AuthActionResult` the screen renders, switched on `code`, never thrown
 *   into a component.
 *
 * The session lifecycle rules live here too: verify-email and accept-invite
 * LOG THE USER IN (their responses are auth sessions); reset-password revokes
 * every session server-side, so the local record is purged to match; sign-out
 * calls the API best-effort — a dead token must still sign out locally.
 */
import { useCallback } from 'react'
import { api, resetUnauthorizedGuard, withDeliberateLogout } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError, type ApiErrorCode, type ApiFieldDetail } from '@/api/errors'
import { purgeSession, saveSession } from '@/api/session'
import type { AuthSession, SignupReceipt } from '@/api/types'
import { useDataDispatch, useUsers } from '@/data/provider'

/** The one address the static demo treats as already registered. */
const STATIC_TAKEN_EMAIL = 'maya@atlasroasters.example'

export type AuthActionResult =
  | { ok: true; revoked?: number }
  | {
      ok: false
      code: ApiErrorCode
      message: string
      /** Per-field validation entries, for form.setError. */
      fieldErrors: ApiFieldDetail[]
      /** The 403 discriminator (`email_not_verified`). */
      reason?: string
      /** Seconds to wait, present on rate limits. */
      retryAfterSeconds?: number
      /**
       * The server's own id for this failure, from the error envelope's
       * `requestId` — the one handle a bug report can carry (open-items 3:
       * CORS still exposes no `x-request-id` response header, so the envelope
       * is the only source). Absent on a client-side network failure.
       */
      requestId?: string
    }

const ok = (revoked?: number): AuthActionResult => ({ ok: true, revoked })

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

export interface AuthActions {
  signUp(input: {
    name: string
    email: string
    password: string
    orgName: string
  }): Promise<AuthActionResult>
  verifyEmail(input: { email: string; code: string; rememberMe?: boolean }): Promise<AuthActionResult>
  resendVerification(email: string): Promise<AuthActionResult>
  signIn(input: {
    email: string
    password: string
    rememberMe?: boolean
  }): Promise<AuthActionResult>
  signOut(): Promise<void>
  signOutEverywhere(): Promise<AuthActionResult>
  forgotPassword(email: string): Promise<AuthActionResult>
  resetPassword(input: {
    email: string
    code: string
    newPassword: string
  }): Promise<AuthActionResult>
  acceptInvite(input: {
    email: string
    code: string
    password: string
    name?: string
    rememberMe?: boolean
  }): Promise<AuthActionResult>
}

export function useAuthActions(): AuthActions {
  const dispatch = useDataDispatch()
  const users = useUsers()
  const live = isLiveMode()

  /** A fresh session enters the world and the storage together. */
  const establish = useCallback(
    (session: AuthSession, rememberMe: boolean) => {
      saveSession(session, rememberMe)
      resetUnauthorizedGuard()
      dispatch({ type: 'live/sessionEstablished', session })
    },
    [dispatch],
  )

  return {
    async signUp({ name, email, orgName, password }) {
      if (!live) {
        if (email.trim().toLowerCase() === STATIC_TAKEN_EMAIL) {
          return { ok: false, code: 'conflict', message: 'Email taken', fieldErrors: [] }
        }
        dispatch({ type: 'auth/signUp', name, email, orgName })
        return ok()
      }
      try {
        // The API has no org-at-signup, so `orgName` cannot go on this call.
        // It is HELD in the world instead: verifying is what creates the org
        // (ORDER ONB-0827, D-ONB-C), and this is the only place the name is
        // ever typed. It is in-memory, like every other static-mode fact — if
        // the tab is closed between here and verifying, the name is gone and
        // N3 asks for it again rather than guessing.
        await api<SignupReceipt>('POST', '/auth/signup', {
          body: { name, email, password },
          anonymous: true,
        })
        dispatch({ type: 'live/pendingVerification', email, orgName })
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async verifyEmail({ email, code, rememberMe = false }) {
      if (!live) {
        dispatch({ type: 'auth/verifyEmail' })
        return ok()
      }
      try {
        const session = await api<AuthSession>('POST', '/auth/verify-email', {
          body: { email, code, rememberMe },
          anonymous: true,
        })
        establish(session, rememberMe)
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async resendVerification(email) {
      if (!live) return ok()
      try {
        await api<void>('POST', '/auth/resend-verification', {
          body: { email },
          anonymous: true,
        })
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async signIn({ email, password, rememberMe = false }) {
      if (!live) {
        const known = users.some(
          (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
        )
        if (!known) {
          dispatch({ type: 'auth/signInFailed' })
          return { ok: false, code: 'unauthorized', message: 'Unknown email', fieldErrors: [] }
        }
        dispatch({ type: 'auth/signInSucceeded' })
        return ok()
      }
      try {
        const session = await api<AuthSession>('POST', '/auth/login', {
          body: { email, password, rememberMe },
          anonymous: true,
        })
        establish(session, rememberMe)
        return ok()
      } catch (error) {
        const result = failure(error)
        // Correct password, unverified email: the verify screen owns the rest.
        if (!result.ok && result.reason === 'email_not_verified') {
          dispatch({ type: 'live/pendingVerification', email })
        }
        return result
      }
    },

    async signOut() {
      if (!live) {
        dispatch({ type: 'session/signOut' })
        return
      }
      try {
        // Scoped so an in-flight sync's 401 reads as the echo it is.
        await withDeliberateLogout(() => api<void>('POST', '/auth/logout'))
      } catch {
        // Best-effort: a dead or unreachable session must still sign out here.
      }
      purgeSession()
      dispatch({ type: 'live/sessionCleared' })
    },

    async signOutEverywhere() {
      if (!live) {
        dispatch({ type: 'session/signOut' })
        return ok(1)
      }
      try {
        const { revoked } = await withDeliberateLogout(() =>
          api<{ revoked: number }>('POST', '/auth/logout-all'),
        )
        purgeSession()
        dispatch({ type: 'live/sessionCleared' })
        return ok(revoked)
      } catch (error) {
        const result = failure(error)
        // A dead token cannot revoke anything server-side, but the user asked
        // to be signed out — locally, they are.
        if (!result.ok && result.code === 'unauthorized') {
          purgeSession()
          dispatch({ type: 'live/sessionCleared' })
          return ok(0)
        }
        return result
      }
    },

    async forgotPassword(email) {
      if (!live) return ok()
      try {
        // Always 204 — silent for unknown emails. Calling again IS the resend.
        await api<void>('POST', '/auth/forgot-password', { body: { email }, anonymous: true })
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async resetPassword({ email, code, newPassword }) {
      if (!live) {
        dispatch({ type: 'auth/clearLockout' })
        return ok()
      }
      try {
        await api<void>('POST', '/auth/reset-password', {
          body: { email, code, newPassword },
          anonymous: true,
        })
        // Every session is revoked server-side; the local record follows.
        purgeSession()
        dispatch({ type: 'live/sessionCleared' })
        return ok()
      } catch (error) {
        return failure(error)
      }
    },

    async acceptInvite({ email, code, password, name, rememberMe = false }) {
      if (!live) {
        dispatch({ type: 'auth/signInSucceeded' })
        return ok()
      }
      try {
        const session = await api<AuthSession>('POST', '/auth/accept-invite', {
          body: { email, code, password, ...(name ? { name } : {}), rememberMe },
          anonymous: true,
        })
        establish(session, rememberMe)
        return ok()
      } catch (error) {
        return failure(error)
      }
    },
  }
}
