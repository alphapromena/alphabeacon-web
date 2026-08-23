/* eslint-disable ab/no-raw-color -- DEPICTED PLATFORM CHROME (see
   posts/shared.tsx): the newsletter bar's tone is the depicted product's, not
   ours. verify:w02 asserts the exemption list. */
import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { BrandMedia } from '../BrandMedia'
import { CustomerLogo, isWordmark } from '../CustomerLogo'
import { ArrowRight } from '../icons'
import { PlatformBar, PostShell, pieceCustomer, postStyles as s } from './shared'

/** Renders as paper rather than app chrome — an email is a different object. */
export function NewsletterPreview({ piece }: { piece: MarketingPiece }) {
  const customer = pieceCustomer(piece)
  return (
    <PostShell variant="paper">
      <PlatformBar platform="newsletter" label={piece.label} onLight tone="#3f7d63" />
      <div className={s.mailHead}>
        <span className={s.mailFrom}>
          <CustomerLogo customer={customer} size={16} />
          {isWordmark(customer) ? '' : `${customer.name} · `}
          {piece.timestamp ?? 'Draft'}
        </span>
        <h4 className={s.mailSubject}>{piece.copy.headline}</h4>
        {piece.copy.subhead && <span className={s.mailPreheader}>{piece.copy.subhead}</span>}
      </div>
      {piece.media && <BrandMedia {...piece.media} />}
      <p className={s.mailBody}>{piece.copy.body}</p>
      {piece.copy.cta && (
        <span className={s.mailCta}>
          {piece.copy.cta}
          <ArrowRight size={12} />
        </span>
      )}
    </PostShell>
  )
}
