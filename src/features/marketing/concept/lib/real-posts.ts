/**
 * Brand-approved concept examples for real companies.
 *
 * Everything else in this concept is fictional demo content built out of the
 * `MarketingPiece` model, where a piece supplies its copy and a component
 * draws the platform chrome around it. These are the opposite: finished
 * screenshots of marketing for named, real companies, approved by them for
 * use here. The platform chrome, the caption, the engagement counts and the
 * creative are all inside the image.
 *
 * So nothing here feeds a post component. The only correct way to render one
 * of these is to place the image on the page at its own aspect ratio and get
 * out of the way — see <RealPostCard />. Wrapping one in InstagramPost,
 * FacebookPost, LinkedInPost or NewsletterPreview would draw a second set of
 * chrome around the first.
 *
 * Each record carries the WebP that is actually served and the untouched PNG
 * original it was encoded from, so the source of truth stays in the repo.
 */

export type RealPostId =
  | 'alpha-pro-ai-assessment'
  | 'inception-branding'
  | 'baker-tilly-ifrs18'
  | 'shrimp-joint-crispy-fish'
  | 'ataccama-newsletter'

/** Named for how the screenshot reads, not for a component that draws it. */
export type RealPlatform = 'Instagram' | 'Facebook' | 'LinkedIn' | 'Newsletter'

export interface RealPost {
  id: RealPostId
  company: string
  /** Short sector label. Paired with `platform` it states the range covered. */
  industry: string
  platform: RealPlatform

  /** Served asset. */
  src: string
  /** Untouched original the WebP was encoded from. Kept in the repo. */
  original: string
  /** Intrinsic pixels. Rendering must respect this ratio exactly. */
  width: number
  height: number
  alt: string
}

export const REAL_POSTS: RealPost[] = [
  {
    id: 'alpha-pro-ai-assessment',
    company: 'Alpha Pro MENA',
    industry: 'Enterprise AI',
    platform: 'LinkedIn',
    src: '/brand/real-posts/alpha-pro-mena/alpha-pro-linkedin-ai-assessment.webp',
    original: '/brand/real-posts/alpha-pro-mena/alpha-pro-linkedin-ai-assessment.png',
    width: 1122,
    height: 1402,
    alt:
      'A LinkedIn post from Alpha Pro MENA offering a free AI assessment for enterprise ' +
      'leaders, with a dark creative listing an AI roadmap, data readiness review, ' +
      'use-case identification and an AI opportunity report.',
  },
  {
    id: 'inception-branding',
    company: 'Inception DAP',
    industry: 'Branding & production',
    platform: 'Instagram',
    src: '/brand/real-posts/inception-dap/inception-instagram-branding.webp',
    original: '/brand/real-posts/inception-dap/inception-instagram-branding.png',
    width: 1122,
    height: 1402,
    alt:
      'An Instagram post from Inception DAP in Jeddah headlined “End-to-end branding & ' +
      'production solutions”, showing branded bags, boxes, a cup and printed collateral ' +
      'in black and gold.',
  },
  {
    id: 'baker-tilly-ifrs18',
    company: 'Baker Tilly Saudi Arabia',
    industry: 'Audit & advisory',
    platform: 'LinkedIn',
    src: '/brand/real-posts/baker-tilly-saudi/baker-tilly-linkedin-ifrs18.webp',
    original: '/brand/real-posts/baker-tilly-saudi/baker-tilly-linkedin-ifrs18.png',
    width: 1122,
    height: 1402,
    alt:
      'A LinkedIn post from Baker Tilly Saudi Arabia about IFRS 18 readiness, with a dark ' +
      'green creative showing the Riyadh skyline and the line “Now, for tomorrow.”',
  },
  {
    id: 'shrimp-joint-crispy-fish',
    company: 'Shrimp Joint',
    industry: 'Restaurant',
    platform: 'Facebook',
    src: '/brand/real-posts/shrimp-joint/shrimp-joint-facebook-crispy-fish.webp',
    original: '/brand/real-posts/shrimp-joint/shrimp-joint-facebook-crispy-fish.png',
    width: 1122,
    height: 1402,
    alt:
      'A Facebook post from Shrimp Joint reading “Crispy. Hot. Loaded.”, with a gloved chef ' +
      'holding a crispy fish sandwich against a dark background.',
  },
  {
    id: 'ataccama-newsletter',
    company: 'Ataccama',
    industry: 'Enterprise data',
    platform: 'Newsletter',
    src: '/brand/real-posts/ataccama/ataccama-newsletter.webp',
    original: '/brand/real-posts/ataccama/ataccama-newsletter.png',
    width: 1055,
    height: 1491,
    alt:
      'An Ataccama email newsletter headlined “Smarter Data. Stronger Decisions.”, with ' +
      'three update cards and an invitation to meet the team at Data Innovation Summit ' +
      '2025 in Riyadh.',
  },
]

const BY_ID = new Map(REAL_POSTS.map((p) => [p.id, p]))

export function getRealPost(id: RealPostId): RealPost {
  const post = BY_ID.get(id)
  if (!post) throw new Error(`Unknown real post: ${id}`)
  return post
}

/**
 * The gallery order. Deliberately alternates industry and channel so the rail
 * reads as range rather than as a list of similar B2B posts.
 */
export const GALLERY_ORDER: RealPostId[] = [
  'inception-branding',
  'alpha-pro-ai-assessment',
  'shrimp-joint-crispy-fish',
  'baker-tilly-ifrs18',
  'ataccama-newsletter',
]

export const GALLERY_POSTS: RealPost[] = GALLERY_ORDER.map(getRealPost)
