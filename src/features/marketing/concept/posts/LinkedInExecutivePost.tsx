import { EXECUTIVES } from '@/features/marketing/concept/lib/customers'
import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { BrandMedia } from '../BrandMedia'
import { ExecutiveAvatar } from '../CustomerLogo'
import { EngagementRow, PlatformBar, PostShell, pieceCustomer, postStyles as s } from './shared'

/**
 * A post written in a person's voice — or waiting for the person.
 *
 * Two cases, and the difference matters. Where a customer has a named
 * executive who publicly identifies themselves in that role, the draft carries
 * their name and the card says it is a draft. Where no executive has been
 * assigned, the draft is shown unattributed rather than having a real person's
 * name put on copy they have never seen.
 */
export function LinkedInExecutivePost({ piece }: { piece: MarketingPiece }) {
  const customer = pieceCustomer(piece)
  const exec = piece.executive ?? (piece.executiveId ? EXECUTIVES[piece.executiveId] : undefined)

  return (
    <PostShell>
      <PlatformBar platform="linkedin-executive" label={piece.label} />
      <div className={s.account}>
        {exec ? (
          <ExecutiveAvatar executive={exec} size={32} />
        ) : (
          <span className={s.pendingAvatar} aria-hidden="true" />
        )}
        <div className={s.accountText}>
          <span className={s.accountName}>{exec ? exec.name : 'Executive voice'}</span>
          <span className={s.accountMeta}>
            {exec ? exec.role : `${customer.name} · voice not yet assigned`}
            {piece.timestamp ? ` · ${piece.timestamp}` : ''}
          </span>
        </div>
      </div>
      <p className={`${s.body} ${s.bodyStrong}`}>{piece.copy.body}</p>
      {piece.media && <BrandMedia {...piece.media} />}
      <EngagementRow {...piece.engagement} style="linkedin" />
    </PostShell>
  )
}
