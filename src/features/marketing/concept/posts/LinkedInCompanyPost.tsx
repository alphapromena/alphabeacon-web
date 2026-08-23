import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { BrandMedia } from '../BrandMedia'
import { CustomerLogo, isWordmark } from '../CustomerLogo'
import { EngagementRow, PlatformBar, PostShell, pieceCustomer, postStyles as s } from './shared'

/**
 * The company post — in either direction.
 *
 * An Arabic company post is not a different product surface, it is the same
 * LinkedIn card read right to left. So the chrome is identical and only the
 * direction and the type change; the copy itself is composed in Arabic in the
 * data layer rather than translated into it.
 */
export function LinkedInCompanyPost({ piece }: { piece: MarketingPiece }) {
  const customer = pieceCustomer(piece)
  const rtl = piece.dir === 'rtl'
  return (
    <PostShell dir={piece.dir}>
      <PlatformBar platform="linkedin-company" label={piece.label} />
      <div className={s.account}>
        <CustomerLogo customer={customer} size={30} />
        <div className={s.accountText}>
          {!isWordmark(customer) && <span className={s.accountName}>{customer.name}</span>}
          {/* The account line stays LTR: the company's sector and Malaky's own
              state are English strings, and mirroring them would only make
              them harder to read. */}
          <span className={s.accountMeta} dir="ltr">
            {customer.shortCategory}
            {piece.timestamp ? ` · ${piece.timestamp}` : ''}
          </span>
        </div>
      </div>
      <p className={`${s.body} ${rtl ? s.bodyAr : ''}`}>{piece.copy.body}</p>
      {piece.media && <BrandMedia {...piece.media} />}
      <EngagementRow {...piece.engagement} style="linkedin" />
    </PostShell>
  )
}
