/**
 * The auth and first-run transitions, tested on the reducer rather than
 * through screens — these are the rules the guards depend on, and they should
 * hold regardless of which control happens to dispatch them.
 */
import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/data/datasets'
import { dataReducer, type DataState } from '@/data/provider'
import { MAX_SIGN_IN_ATTEMPTS } from '@/data/types'

function visitor(): DataState {
  return {
    datasetId: 'visitor',
    world: buildDataset('visitor'),
    devForce: 'none',
    connectivity: 'auto',
  }
}

describe('signup (A1)', () => {
  it('creates the account and the organization in one step, pending verification', () => {
    const next = dataReducer(visitor(), {
      type: 'auth/signUp',
      name: 'Lena Park',
      email: 'lena@nova.example',
      orgName: 'Nova Skincare',
    })

    expect(next.world.org.name).toBe('Nova Skincare')
    expect(next.world.users[0].name).toBe('Lena Park')
    expect(next.world.session.signedIn).toBe(true)
    // Signed in but not through the door — A3 is a real gate.
    expect(next.world.session.emailVerified).toBe(false)
    expect(next.world.session.pendingEmail).toBe('lena@nova.example')
  })

  it('clears the pending email once verified', () => {
    const signedUp = dataReducer(visitor(), {
      type: 'auth/signUp',
      name: 'Lena Park',
      email: 'lena@nova.example',
      orgName: 'Nova Skincare',
    })
    const verified = dataReducer(signedUp, { type: 'auth/verifyEmail' })
    expect(verified.world.session.emailVerified).toBe(true)
    expect(verified.world.session.pendingEmail).toBeUndefined()
  })
})

describe('sign-in lockout (A2)', () => {
  it('locks out only after the limit, and says when it ends', () => {
    let state = visitor()
    for (let attempt = 1; attempt < MAX_SIGN_IN_ATTEMPTS; attempt += 1) {
      state = dataReducer(state, { type: 'auth/signInFailed' })
      expect(state.world.session.lockedUntil).toBeUndefined()
    }
    state = dataReducer(state, { type: 'auth/signInFailed' })
    expect(state.world.session.failedSignIns).toBe(MAX_SIGN_IN_ATTEMPTS)
    expect(state.world.session.lockedUntil).toBeGreaterThan(Date.now())
  })

  it('a successful sign-in clears the counter, so past failures do not accumulate forever', () => {
    let state = dataReducer(visitor(), { type: 'auth/signInFailed' })
    state = dataReducer(state, { type: 'auth/signInSucceeded' })
    expect(state.world.session.failedSignIns).toBe(0)
    expect(state.world.session.lockedUntil).toBeUndefined()
    expect(state.world.session.signedIn).toBe(true)
  })
})

describe('first run (A5 retired — ORDER ONB-0827)', () => {
  it('creating the workspace is what opens the product', () => {
    const before = visitor()
    expect(before.world.org.exists).toBe(false)

    const done = dataReducer(before, { type: 'workspace/created', name: 'Nova Skincare' })
    expect(done.world.org.exists).toBe(true)
    expect(done.world.org.name).toBe('Nova Skincare')
  })

  it('"Start pipeline" activates scheduling rather than soft-saving', () => {
    expect(visitor().world.schedule.started).toBe(false)
    const next = dataReducer(visitor(), { type: 'schedule/start' })
    expect(next.world.schedule.started).toBe(true)
  })

  it('a tone created mid-flow joins the library and can be selected', () => {
    const created = dataReducer(visitor(), {
      type: 'tones/create',
      tone: {
        id: 'tone_desk',
        name: 'Desk note',
        kind: 'custom',
        description: 'How this desk writes.',
        rules: { do: ['Name the source'], dont: [] },
      },
    })
    expect(created.world.tones.some((t) => t.id === 'tone_desk')).toBe(true)

    const selected = dataReducer(created, {
      type: 'schedule/update',
      patch: { toneIds: ['tone_desk'] },
    })
    expect(selected.world.schedule.toneIds).toEqual(['tone_desk'])
  })

  it('connecting a platform makes it publishable, and disconnecting takes it back', () => {
    const connected = dataReducer(visitor(), { type: 'connections/connect', platform: 'instagram' })
    const instagram = connected.world.connections.find((c) => c.platform === 'instagram')
    expect(instagram?.status).toBe('active')
    expect(instagram?.permissions.posting).toBe(true)

    const off = dataReducer(connected, { type: 'connections/disconnect', platform: 'instagram' })
    expect(off.world.connections.find((c) => c.platform === 'instagram')?.status).toBe(
      'not_connected',
    )
  })
})
