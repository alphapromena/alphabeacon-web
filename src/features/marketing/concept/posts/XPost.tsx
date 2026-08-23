import { PREPARED_LABEL, type MarketingPiece } from '@/features/marketing/concept/lib/content'
import { BookmarkIcon, CommentIcon, HeartIcon, RepostIcon, ShareIcon, XIcon } from '../icons'
import { PostShell, pieceCustomer, postStyles as s } from './shared'

/**
 * A post on X, built to X's own shape rather than to this concept's default
 * card.
 *
 * The other cards here are portrait, because the channels they depict are
 * image-first and a feed image wants the height. X is the opposite: the
 * sentence is the post. So this card is wide and short, the type leads, and
 * there is no media well at all — on X that is the format, not a gap.
 *
 * It also drops the platform bar every other card carries. A labelled header
 * strip is what made this read as a panel in a product UI; a real post
 * identifies itself by the account at the top and the mark in the corner.
 *
 * Two things it will not do. It shows no handle, because no customer here has
 * published one to this repository and an @name we made up is an invented
 * identity. And it says the post is prepared, because Baker Tilly has not
 * published it — the copy is Malaky's, written around what the firm states
 * publicly about its own services and offices.
 */
export function XPost({ piece }: { piece: MarketingPiece }) {
  const customer = pieceCustomer(piece)
  const paragraphs = piece.copy.body.split(/\n{2,}/)
  const { likes, comments, reposts } = piece.engagement ?? {}

  return (
    <PostShell className={s.xCard}>
      <div className={s.xHead}>
        {/* The avatar is the supplied lockup, contained on its own plate —
            never cropped to a circle, which would cut their mark in half.

            The plate follows the artwork rather than the other way round:
            Baker Tilly's mark is a white knockout on transparency, so a white
            plate would render it invisible. Only a lockup that arrived with a
            light background baked in gets a light plate. */}
        <span
          className={`${s.xAvatar} ${customer.logo?.background === 'light' ? s.xAvatarLight : ''}`}
        >
          {customer.logo && (
            <img
              src={customer.logo.src}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          )}
        </span>
        <span className={s.xIdentity}>
          <span className={s.xName}>{customer.name}</span>
          <span className={s.xHandleRow}>
            {customer.shortCategory} · {piece.timestamp}
          </span>
        </span>
        <XIcon size={15} className={s.xMark} />
      </div>

      {paragraphs.map((line) => (
        <p key={line} className={s.xBody}>
          {line}
        </p>
      ))}

      <p className={s.xPrepared}>{PREPARED_LABEL}</p>

      {/* X's own action row. The three counts are illustrative, which the
          hero says once beneath the stack rather than on every card. */}
      <div className={s.xActions} dir="ltr">
        <span className={s.xAction}>
          <CommentIcon size={14} /> {comments}
        </span>
        <span className={s.xAction}>
          <RepostIcon size={14} /> {reposts}
        </span>
        <span className={s.xAction}>
          <HeartIcon size={14} /> {likes}
        </span>
        <span className={s.xAction}>
          <BookmarkIcon size={14} />
        </span>
        <span className={s.xAction}>
          <ShareIcon size={14} />
        </span>
      </div>
    </PostShell>
  )
}
