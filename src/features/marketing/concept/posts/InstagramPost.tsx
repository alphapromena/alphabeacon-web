import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { BrandMedia } from '../BrandMedia'
import { CustomerLogo, isWordmark } from '../CustomerLogo'
import { BookmarkIcon, CommentIcon, HeartIcon, ShareIcon } from '../icons'
import { PlatformBar, PostShell, formatCount, pieceCustomer, postStyles as s } from './shared'

export function InstagramPost({ piece }: { piece: MarketingPiece }) {
  const customer = pieceCustomer(piece)
  const rtl = piece.dir === 'rtl'
  /* A wordmark lockup already carries the name; printing it again beside
     itself reads as a duplication rather than as branding. */
  const named = isWordmark(customer)
  return (
    <PostShell dir={piece.dir}>
      <PlatformBar platform="instagram" label={piece.label} />
      <div className={s.account}>
        <CustomerLogo customer={customer} size={26} />
        <div className={s.accountText}>
          {/* A company's name is not translated. None of these customers has
              given us an official Arabic name, so the Latin one stands in both
              directions rather than one being invented for the RTL card. */}
          {!named && <span className={s.accountName}>{customer.name}</span>}
          {/* A handle we have not seen is a handle we do not print. */}
          {customer.handle && (
            <span className={s.accountMeta} dir="ltr">
              @{customer.handle}
            </span>
          )}
        </div>
      </div>
      {piece.media && <BrandMedia {...piece.media} />}
      <div className={s.igActions}>
        <HeartIcon size={16} />
        <CommentIcon size={16} />
        <ShareIcon size={16} />
        <span className={s.igActionsEnd}>
          <BookmarkIcon size={16} />
        </span>
      </div>
      {piece.engagement?.likes != null && (
        <p className={s.igLikes} dir="ltr">
          {formatCount(piece.engagement.likes)} likes
        </p>
      )}
      <p
        className={`${s.caption} ${rtl ? s.arabic : ''}`}
        style={piece.postedAt ? undefined : { paddingBottom: '0.75rem' }}
      >
        <span className={s.captionName}>{customer.handle ?? customer.name}</span> {piece.copy.body}
      </p>

      {piece.postedAt && (
        <>
          {piece.engagement?.comments != null && (
            <p className={s.igComments}>View all {piece.engagement.comments} comments</p>
          )}
          <p className={s.igTime} dir="ltr">
            {piece.postedAt}
          </p>
        </>
      )}
    </PostShell>
  )
}
