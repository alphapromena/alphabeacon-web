import { describe, expect, it } from 'vitest'
import type { AuthSession } from '@/api/types'
import { buildDataset } from '@/data/datasets'
import {
  apiUserToUser,
  clearAuthSession,
  collapseOrgRole,
  graftAuthSession,
} from './auth-adapter'

const auth = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  token: 'tok',
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  user: {
    id: '901',
    name: 'Qa Person',
    email: 'qa@alphapromena.com',
    role: 'user',
    status: 'active',
    emailVerifiedAt: '2026-07-30T10:00:00.000Z',
    createdAt: '2026-07-30T09:00:00.000Z',
  },
  orgs: [
    {
      id: '31',
      name: 'QA Org',
      slug: 'qa-org',
      status: 'active',
      role: 'owner',
      joinedAt: '2026-07-30T09:00:00.000Z',
    },
  ],
  ...overrides,
})

describe('collapseOrgRole', () => {
  it('collapses owner to admin (the known two-tier gap, logged in open-items)', () => {
    expect(collapseOrgRole('owner')).toBe('admin')
    expect(collapseOrgRole('admin')).toBe('admin')
    expect(collapseOrgRole('member')).toBe('member')
  })
})

describe('apiUserToUser', () => {
  it('maps the wire user onto the app user, joinedAt from createdAt', () => {
    const user = apiUserToUser(auth().user, 'member')
    expect(user).toEqual({
      id: '901',
      name: 'Qa Person',
      email: 'qa@alphapromena.com',
      role: 'member',
      joinedAt: '2026-07-30T09:00:00.000Z',
    })
  })
})

describe('graftAuthSession', () => {
  it('signs the world in as the API user, org name and all', () => {
    const world = buildDataset('active')
    const next = graftAuthSession(world, auth())

    expect(next.session.signedIn).toBe(true)
    expect(next.session.userId).toBe('901')
    expect(next.session.emailVerified).toBe(true)
    expect(next.users.find((user) => user.id === '901')?.email).toBe('qa@alphapromena.com')
    expect(next.org.name).toBe('QA Org')
    expect(next.org.onboarding.completed).toBe(true)
    // The hybrid: uncovered entities remain the dataset's.
    expect(next.drafts).toBe(world.drafts)
    expect(next.plans).toBe(world.plans)
  })

  it('a user with no orgs lands in onboarding at step 1', () => {
    const next = graftAuthSession(buildDataset('active'), auth({ orgs: [] }))
    expect(next.org.onboarding).toEqual({ completed: false, resumeStep: 1 })
    expect(next.session.signedIn).toBe(true)
  })

  it('an unverified email stays visibly unverified', () => {
    const record = auth()
    const next = graftAuthSession(buildDataset('active'), {
      ...record,
      user: { ...record.user, emailVerifiedAt: null },
    })
    expect(next.session.emailVerified).toBe(false)
  })
})

describe('clearAuthSession', () => {
  it('returns to a signed-out world without touching the dataset entities', () => {
    const world = graftAuthSession(buildDataset('active'), auth())
    const next = clearAuthSession(world)
    expect(next.session.signedIn).toBe(false)
    expect(next.drafts).toBe(world.drafts)
  })
})
