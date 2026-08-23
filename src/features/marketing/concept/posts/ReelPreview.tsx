import { isVideo } from '@/features/marketing/concept/lib/media'
import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { BrandMedia } from '../BrandMedia'
import { CustomerLogo } from '../CustomerLogo'
import { PlayIcon } from '../icons'
import { PostShell, pieceCustomer, postStyles as s } from './shared'

/**
 * Static poster frame with a play affordance — nothing autoplays, so a page
 * full of these costs nothing at runtime.
 */
export function ReelPreview({ piece }: { piece: MarketingPiece }) {
  const customer = pieceCustomer(piece)
  // Once a real video is attached its own duration wins; the piece-level
  // value is the placeholder until then.
  const duration =
    (piece.media && isVideo(piece.media) ? piece.media.durationLabel : undefined) ?? piece.duration
  return (
    <PostShell>
      <div className={s.reelWrap}>
        {piece.media && <BrandMedia {...piece.media} />}
        <div className={s.reelOverlay}>
          <div className={s.reelTop}>
            <CustomerLogo customer={customer} size={18} />
            {piece.label}
            {duration && <span className={s.reelDuration}>{duration}</span>}
          </div>
          <div className={s.reelFoot}>
            {piece.copy.headline && <p className={s.reelTitle}>{piece.copy.headline}</p>}
            <p className={s.reelSub}>{piece.copy.body}</p>
          </div>
        </div>
        <span className={s.reelPlay} aria-hidden="true">
          <PlayIcon size={16} />
        </span>
      </div>
    </PostShell>
  )
}
