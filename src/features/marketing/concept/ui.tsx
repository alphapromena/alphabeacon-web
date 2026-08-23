import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from './icons'
import styles from './ui.module.css'

/* Shared primitives so buttons, eyebrows and section headings stay identical
   across the homepage and the pricing page. */

type Tone = 'primary' | 'secondary' | 'ghost' | 'gold'
type Size = 'md' | 'lg'

export function Button({
  children,
  href,
  tone = 'primary',
  size = 'md',
  arrow = false,
  full = false,
  type = 'button',
  onClick,
  className,
  ...rest
}: {
  children: ReactNode
  href?: string
  tone?: Tone
  size?: Size
  arrow?: boolean
  full?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  className?: string
} & Record<string, unknown>) {
  const cls = [
    styles.btn,
    styles[tone],
    size === 'lg' ? styles.lg : '',
    full ? styles.full : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <>
      <span>{children}</span>
      {arrow && <ArrowUpRight size={15} className={styles.btnArrow} />}
    </>
  )

  if (href) {
    return (
      <Link to={href} className={cls} {...rest}>
        {inner}
      </Link>
    )
  }
  return (
    <button type={type} className={cls} onClick={onClick} {...rest}>
      {inner}
    </button>
  )
}

export function Eyebrow({
  children,
  dot = false,
  className,
}: {
  children: ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <p className={[styles.eyebrow, className].filter(Boolean).join(' ')}>
      {dot && <span className={styles.eyebrowDot} aria-hidden="true" />}
      {children}
    </p>
  )
}

/**
 * The section head: a large display statement whose full stop carries the
 * accent, with supporting copy in the second column.
 */
export function SectionHead({
  title,
  lead,
  children,
  id,
}: {
  title: ReactNode
  lead?: ReactNode
  children?: ReactNode
  id?: string
}) {
  return (
    <div className={styles.head}>
      <h2 className={styles.headTitle} id={id}>
        {title}
      </h2>
      {(lead || children) && (
        <div className={styles.headLead}>
          {lead && <p>{lead}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

/** The orange full stop used to close editorial headlines. */
export function Stop() {
  return <span className={styles.stop}>.</span>
}

export function Rule() {
  return <hr className={styles.rule} />
}
