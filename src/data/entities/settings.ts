/**
 * Records behind Settings (I5, I6, I7).
 *
 * Source URLs are stored scheme-less, the same way ClaimChip renders them: the
 * static law bans http(s):// literals under `src/`, and a demo world has no
 * business implying a link it could never follow.
 */
import { dayFromNow, timestampAt } from '@/data/dates'
import type { FollowedSource, KnowledgeDoc, TeamInvite } from '@/data/types'

export function atlasFollowedSources(): FollowedSource[] {
  return [
    {
      id: 'src_perfectdaily',
      url: 'perfectdailygrind.com/feed',
      name: 'Perfect Daily Grind',
      addedAt: dayFromNow(-88),
    },
    {
      id: 'src_sca',
      url: 'sca.coffee/sca-news?format=rss',
      name: 'Specialty Coffee Association',
      addedAt: dayFromNow(-88),
    },
    {
      id: 'src_ico',
      url: 'ico.org/documents/rss',
      name: 'International Coffee Organization',
      addedAt: dayFromNow(-31),
    },
  ]
}

export const ATLAS_TOPICS: string[] = [
  'single origin',
  'roast profiles',
  'direct trade',
  'brewing at home',
  'coffee futures',
]

/**
 * The four per-file states side by side, because I6's whole design problem is a
 * batch where they are mixed — one still uploading, one processing, one ready,
 * one failed with a reason and a retry.
 */
export function atlasKnowledgeDocs(): KnowledgeDoc[] {
  return [
    {
      id: 'kd_origins',
      filename: 'atlas-origin-notes-2026.pdf',
      sizeBytes: 2_318_704,
      status: 'ready',
      addedAt: timestampAt(-9, '11:20'),
    },
    {
      id: 'kd_wholesale',
      filename: 'wholesale-price-list.csv',
      sizeBytes: 48_112,
      status: 'ready',
      addedAt: timestampAt(-9, '11:22'),
    },
    {
      id: 'kd_brewguide',
      filename: 'brew-guide-v4.docx',
      sizeBytes: 884_310,
      status: 'processing',
      addedAt: timestampAt(0, '08:04'),
    },
    {
      id: 'kd_scan',
      filename: 'cupping-scores-scan.pdf',
      sizeBytes: 14_902_338,
      status: 'failed',
      // A transient failure, so I6's Retry has something real to do. The other
      // failure — a file we cannot read at all — offers no Retry, because a
      // button that can never succeed is worse than none.
      failureReason: 'Processing timed out before the file finished. Nothing was lost.',
      addedAt: timestampAt(-2, '16:41'),
    },
  ]
}

export function atlasInvites(): TeamInvite[] {
  return [
    {
      id: 'inv_rana',
      email: 'rana@atlasroasters.example',
      role: 'member',
      invitedAt: timestampAt(-3, '10:15'),
    },
  ]
}
