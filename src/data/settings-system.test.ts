/**
 * W6's data laws — the ones a screenshot cannot show.
 *
 * Settings is where a product quietly grows two sources of truth (a timezone
 * here and a timezone there), or a delete that leaves a dangling reference
 * behind. These are the tests that catch that.
 */
import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/data/datasets'
import { dataReducer, type DataState } from '@/data/provider'
import type { DatasetId, Draft } from '@/data/types'

function world(id: DatasetId = 'active'): DataState {
  return { datasetId: id, world: buildDataset(id), devForce: 'none', connectivity: 'auto' }
}

describe('one timezone, not two', () => {
  it('keeps the org from carrying a second copy of the schedule timezone', () => {
    const org = buildDataset('active').org as unknown as Record<string, unknown>
    // screens4.md I1: "timezone (mirrors C1, single source)". If this field ever
    // comes back, two screens can disagree about when a post goes out.
    expect(org.timezone).toBeUndefined()
  })

  it('routes the I1 timezone control through the schedule', () => {
    const next = dataReducer(world(), {
      type: 'schedule/update',
      patch: { timezone: 'Europe/Berlin' },
    })
    expect(next.world.schedule.timezone).toBe('Europe/Berlin')
  })
})

describe('the tones library', () => {
  it('edits a tone in place, keeping its id so drafts keep pointing at it', () => {
    const start = world()
    const tone = start.world.tones.find((t) => t.kind === 'custom')
    expect(tone).toBeDefined()
    if (!tone) return

    const next = dataReducer(start, {
      type: 'tones/update',
      tone: { ...tone, description: 'Rewritten.' },
    })
    expect(next.world.tones.filter((t) => t.id === tone.id)).toHaveLength(1)
    expect(next.world.tones.find((t) => t.id === tone.id)?.description).toBe('Rewritten.')
  })

  it('deleting a custom tone also removes it from the schedule', () => {
    const start = world()
    const tone = start.world.tones.find((t) => t.kind === 'custom')
    if (!tone) throw new Error('the active world should own a custom tone')
    expect(start.world.schedule.toneIds).toContain(tone.id)

    const next = dataReducer(start, { type: 'tones/delete', toneId: tone.id })
    expect(next.world.tones.some((t) => t.id === tone.id)).toBe(false)
    // A schedule pointing at a tone that no longer exists would generate
    // against nothing.
    expect(next.world.schedule.toneIds).not.toContain(tone.id)
    expect(next.world.schedule.toneIds.length).toBeGreaterThan(0)
  })

  it('refuses to delete a preset, so a workspace always has something to speak in', () => {
    const start = world()
    const preset = start.world.tones.find((t) => t.kind === 'preset')
    if (!preset) throw new Error('presets are always present')
    const next = dataReducer(start, { type: 'tones/delete', toneId: preset.id })
    expect(next.world.tones.some((t) => t.id === preset.id)).toBe(true)
  })

  it('leaves drafts that already used a deleted tone with their copy intact', () => {
    const start = world()
    const tone = start.world.tones.find((t) => t.kind === 'custom')
    if (!tone) throw new Error('the active world should own a custom tone')
    const before = start.world.drafts.map((d) => d.copy)
    const next = dataReducer(start, { type: 'tones/delete', toneId: tone.id })
    expect(next.world.drafts.map((d) => d.copy)).toEqual(before)
  })
})

describe('one tone record, read by every screen', () => {
  it('is referenced by id from the schedule, the drafts, and the analytics posts', () => {
    const world = buildDataset('active')
    const custom = world.tones.filter((tone) => tone.kind === 'custom')
    expect(custom).toHaveLength(1)
    const tone = custom[0]

    // C1 reads it through the schedule; D2/D3/F1 through a
    // draft; G2 through a published post. All four are the SAME record —
    // nothing copies a tone's name into another entity.
    expect(world.schedule.toneIds).toContain(tone.id)
    expect(world.drafts.some((draft) => draft.toneId === tone.id)).toBe(true)
    expect(
      world.analytics.some((series) => series.posts.some((post) => post.toneId === tone.id)),
    ).toBe(true)
    expect(world.tones.filter((t) => t.name === tone.name)).toHaveLength(1)
  })
})

describe('knowledge ingestion', () => {
  const doc = {
    id: 'kd_test',
    filename: 'notes.txt',
    sizeBytes: 12,
    status: 'uploading' as const,
    progress: 0,
    addedAt: new Date().toISOString(),
  }

  it('plays Uploading → Processing → Ready, dropping progress once uploaded', () => {
    let state = dataReducer(world(), { type: 'knowledge/add', doc })
    state = dataReducer(state, { type: 'knowledge/progress', docId: doc.id, progress: 60 })
    expect(state.world.knowledgeDocs.find((d) => d.id === doc.id)?.progress).toBe(60)

    state = dataReducer(state, { type: 'knowledge/status', docId: doc.id, status: 'processing' })
    const processing = state.world.knowledgeDocs.find((d) => d.id === doc.id)
    // A progress bar on a file that finished uploading is a lie about what is
    // happening now.
    expect(processing?.progress).toBeUndefined()

    state = dataReducer(state, { type: 'knowledge/status', docId: doc.id, status: 'ready' })
    expect(state.world.knowledgeDocs.find((d) => d.id === doc.id)?.status).toBe('ready')
  })

  it('carries a reason on failure, and drops it again on a successful retry', () => {
    let state = dataReducer(world(), { type: 'knowledge/add', doc })
    state = dataReducer(state, {
      type: 'knowledge/status',
      docId: doc.id,
      status: 'failed',
      failureReason: 'Could not read it.',
    })
    expect(state.world.knowledgeDocs.find((d) => d.id === doc.id)?.failureReason).toBe(
      'Could not read it.',
    )

    state = dataReducer(state, { type: 'knowledge/status', docId: doc.id, status: 'ready' })
    expect(state.world.knowledgeDocs.find((d) => d.id === doc.id)?.failureReason).toBeUndefined()
  })

  it('leaves the other files in the batch alone', () => {
    const start = world()
    const others = start.world.knowledgeDocs.map((d) => d.status)
    const next = dataReducer(start, { type: 'knowledge/add', doc })
    expect(next.world.knowledgeDocs.slice(1).map((d) => d.status)).toEqual(others)
  })
})

describe('the team', () => {
  it('invites, then revokes', () => {
    const invite = {
      id: 'inv_new',
      email: 'sam@atlasroasters.example',
      role: 'member' as const,
      invitedAt: new Date().toISOString(),
    }
    const invited = dataReducer(world(), { type: 'team/invite', invite })
    expect(invited.world.invites.some((i) => i.id === invite.id)).toBe(true)

    const revoked = dataReducer(invited, { type: 'team/revokeInvite', inviteId: invite.id })
    expect(revoked.world.invites.some((i) => i.id === invite.id)).toBe(false)
  })

  it('removes another member but never the signed-in user', () => {
    const start = world()
    const other = start.world.users.find((u) => u.id !== start.world.session.userId)
    if (!other) throw new Error('the active world should have two members')

    expect(
      dataReducer(start, { type: 'team/removeMember', userId: other.id }).world.users,
    ).toHaveLength(start.world.users.length - 1)

    // The UI hides the control for yourself; the reducer refuses it as well,
    // because a workspace with nobody in it cannot be recovered from.
    const self = dataReducer(start, {
      type: 'team/removeMember',
      userId: start.world.session.userId,
    })
    expect(self.world.users).toHaveLength(start.world.users.length)
  })
})

describe('an on-demand run joins the ordinary queue', () => {
  it('enters at pending_review, ahead of the rest, with its own timeline', () => {
    const start = world()
    const at = new Date().toISOString()
    const draft: Draft = {
      id: 'draft_gen_test',
      status: 'pending_review',
      copy: 'Something we wrote on demand.',
      rationale: 'Because you asked for it.',
      toneId: start.world.tones[0].id,
      claims: [],
      createdAt: at,
      timeline: [{ status: 'pending_review', at }],
    }
    const next = dataReducer(start, { type: 'draft/create', draft })

    expect(next.world.drafts[0].id).toBe(draft.id)
    // It is reviewed by the same machine as everything else — no shortcut into
    // approved, no separate list.
    expect(next.world.drafts[0].status).toBe('pending_review')
    expect(next.world.drafts).toHaveLength(start.world.drafts.length + 1)
  })
})

describe('sources and topics', () => {
  it('adds and removes a followed source', () => {
    const source = {
      id: 'src_test',
      url: 'example.coffee/feed',
      name: 'Example',
      addedAt: new Date().toISOString(),
    }
    const added = dataReducer(world(), { type: 'sources/add', source })
    expect(added.world.followedSources.some((s) => s.id === source.id)).toBe(true)

    const removed = dataReducer(added, { type: 'sources/remove', sourceId: source.id })
    expect(removed.world.followedSources.some((s) => s.id === source.id)).toBe(false)
  })

  it('replaces the topic list wholesale, which is how a tag input works', () => {
    const next = dataReducer(world(), { type: 'topics/set', topics: ['espresso'] })
    expect(next.world.topics).toEqual(['espresso'])
  })
})

describe('the org profile', () => {
  it('patches only what it was given', () => {
    const start = world()
    const next = dataReducer(start, { type: 'org/update', patch: { ctaText: 'Buy the roast' } })
    expect(next.world.org.ctaText).toBe('Buy the roast')
    expect(next.world.org.name).toBe(start.world.org.name)
    expect(next.world.org.brandVoice).toEqual(start.world.org.brandVoice)
  })
})

describe('N4 connectivity', () => {
  it('is an override on top of the browser, defaulting to believing it', () => {
    expect(world().connectivity).toBe('auto')
    expect(dataReducer(world(), { type: 'dev/connectivity', mode: 'degraded' }).connectivity).toBe(
      'degraded',
    )
  })
})

describe('roles can be changed without destroying a member', () => {
  it('promotes and demotes in place, keeping the account', () => {
    const start = world()
    const member = start.world.users.find((u) => u.role === 'member')
    if (!member) throw new Error('the active world should have a member')

    const promoted = dataReducer(start, {
      type: 'team/setRole',
      userId: member.id,
      role: 'admin',
    })
    expect(promoted.world.users.find((u) => u.id === member.id)?.role).toBe('admin')
    // The whole point: nothing else about them changed.
    expect(promoted.world.users).toHaveLength(start.world.users.length)
    expect(promoted.world.users.find((u) => u.id === member.id)?.joinedAt).toBe(member.joinedAt)
  })

  it('refuses to demote the last admin, because there is no way back', () => {
    const start = world()
    const admins = start.world.users.filter((u) => u.role === 'admin')
    expect(admins).toHaveLength(1)

    const attempted = dataReducer(start, {
      type: 'team/setRole',
      userId: admins[0].id,
      role: 'member',
    })
    expect(attempted.world.users.find((u) => u.id === admins[0].id)?.role).toBe('admin')
  })

  it('allows the demotion once someone else can administer', () => {
    const start = world()
    const member = start.world.users.find((u) => u.role === 'member')
    const admin = start.world.users.find((u) => u.role === 'admin')
    if (!member || !admin) throw new Error('the active world should have both')

    const promoted = dataReducer(start, { type: 'team/setRole', userId: member.id, role: 'admin' })
    const demoted = dataReducer(promoted, {
      type: 'team/setRole',
      userId: admin.id,
      role: 'member',
    })
    expect(demoted.world.users.find((u) => u.id === admin.id)?.role).toBe('member')
    expect(demoted.world.users.filter((u) => u.role === 'admin')).toHaveLength(1)
  })
})
