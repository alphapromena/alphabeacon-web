import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { RealPostCard } from '../RealPost'
import { InstagramPost } from './InstagramPost'
import { LinkedInCompanyPost } from './LinkedInCompanyPost'
import { LinkedInExecutivePost } from './LinkedInExecutivePost'
import { NewsletterPreview } from './NewsletterPreview'
import { ReelPreview } from './ReelPreview'
import { XPost } from './XPost'

export {
  InstagramPost,
  LinkedInCompanyPost,
  LinkedInExecutivePost,
  NewsletterPreview,
  ReelPreview,
  XPost,
}

/**
 * Renders whichever component a piece's platform calls for. Every surface on
 * the concept — orbit, mobile stack, fan-out, brand demo — goes through here,
 * so a piece looks identical wherever it appears.
 *
 * A real screenshot is the one case that draws no chrome: it already has its
 * own, so it short-circuits straight to the image.
 */
export function PostCard({ piece }: { piece: MarketingPiece }) {
  switch (piece.platform) {
    case 'real-screenshot':
      return <RealPostCard id={piece.realPostId} eager />
    case 'instagram':
      return <InstagramPost piece={piece} />
    case 'linkedin-company':
      return <LinkedInCompanyPost piece={piece} />
    case 'linkedin-executive':
      return <LinkedInExecutivePost piece={piece} />
    case 'x':
      return <XPost piece={piece} />
    case 'newsletter':
      return <NewsletterPreview piece={piece} />
    case 'reel':
      return <ReelPreview piece={piece} />
  }
}
