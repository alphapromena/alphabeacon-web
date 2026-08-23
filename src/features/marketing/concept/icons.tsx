import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* --- Platform marks (filled, brand-accurate silhouettes) ---------- */

export function InstagramIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" />
    </svg>
  )
}

export function LinkedInIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d="M20.4 3H3.6A.6.6 0 0 0 3 3.6v16.8a.6.6 0 0 0 .6.6h16.8a.6.6 0 0 0 .6-.6V3.6a.6.6 0 0 0-.6-.6ZM8.3 18.3H5.6V9.8h2.7v8.5ZM6.9 8.6a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12Zm11.4 9.7h-2.7v-4.14c0-.99-.02-2.26-1.38-2.26-1.38 0-1.59 1.08-1.59 2.19v4.21H9.94V9.8h2.59v1.16h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.13v4.61Z" />
    </svg>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3.5 7 7.62 5.4a1.5 1.5 0 0 0 1.76 0L20.5 7" />
    </Icon>
  )
}

export function ReelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="19" height="17" rx="3" />
      <path d="M2.8 8.5h18.4M8 3.6 10.8 8.5M15 3.6 17.8 8.5" />
      <path d="m10.6 12.3 4.2 2.4-4.2 2.4v-4.8Z" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function ArabicIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="12"
        y="16.2"
        textAnchor="middle"
        fill="currentColor"
        style={{ font: '600 10px var(--f-arabic)' }}
      >
        ع
      </text>
    </svg>
  )
}

export function XIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d="M17.53 3h3.02l-6.6 7.54L21.7 21h-6.07l-4.76-6.22L5.42 21H2.4l7.06-8.07L2.6 3h6.23l4.3 5.69L17.53 3Zm-1.06 16.17h1.67L7.6 4.74H5.81l10.66 14.43Z" />
    </svg>
  )
}

/* --- Engagement + UI --------------------------------------------- */

export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20s-7.5-4.4-7.5-9.3A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.5C19.5 15.6 12 20 12 20Z" />
    </Icon>
  )
}

export function CommentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.6A8.5 8.5 0 1 1 20.5 12Z" />
    </Icon>
  )
}

export function RepostIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5V8a3 3 0 0 1 3-3h10M4 9.5 6.5 7M4 9.5 1.6 7M20 14.5V16a3 3 0 0 1-3 3H7M20 14.5 17.5 17M20 14.5l2.4 2.5" />
    </Icon>
  )
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 4.5h11v15l-5.5-4-5.5 4v-15Z" />
    </Icon>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4 12 16-7.5-5 16-3-6.5L4 12Z" />
    </Icon>
  )
}

export function PlayIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d="M8.5 5.4a.9.9 0 0 1 1.37-.77l8.2 6.6a.9.9 0 0 1 0 1.54l-8.2 6.6a.9.9 0 0 1-1.37-.77V5.4Z" />
    </svg>
  )
}

export function MoreIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <circle cx="5.5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18.5" cy="12" r="1.5" />
    </svg>
  )
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M7.5 16.5 16.5 7.5M9 7.5h7.5V15" />
    </Icon>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="m5 12.5 4.6 4.5L19 6.5" />
    </Icon>
  )
}

export function CheckCircleIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <circle cx="12" cy="12" r="9.2" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m7.8 12.3 2.9 2.9 5.5-5.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 19.5h4l10-10a2.12 2.12 0 0 0-3-3l-10 10v3Z" />
      <path d="m14.5 6.5 3 3" />
    </Icon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.9} {...props}>
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.8 9.8h16.4M8 3.5v3M16 3.5v3" />
    </Icon>
  )
}

export function MemoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.2c-2 0-3.4 1.2-3.7 2.7-1.7.3-2.9 1.7-2.9 3.4 0 .8.3 1.6.8 2.2-.5.6-.8 1.3-.8 2.1 0 1.9 1.6 3.4 3.6 3.4.8 1.1 2 1.8 3 1.8V4.2Z" />
      <path d="M12 4.2c2 0 3.4 1.2 3.7 2.7 1.7.3 2.9 1.7 2.9 3.4 0 .8-.3 1.6-.8 2.2.5.6.8 1.3.8 2.1 0 1.9-1.6 3.4-3.6 3.4-.8 1.1-2 1.8-3 1.8" />
    </Icon>
  )
}

export function VoiceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.4a8.5 8.5 0 0 1-12.4 7.6l-4.6.9 1-4.5A8.5 8.5 0 1 1 20.5 11.4Z" />
      <path d="M8.6 10.6v1.8M11.5 8.6v5.8M14.4 10.2v2.6" />
    </Icon>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.4 4.8 6.1v5.6c0 4.3 3 7.5 7.2 8.9 4.2-1.4 7.2-4.6 7.2-8.9V6.1L12 3.4Z" />
      <path d="m9.2 12 2 2 3.6-3.9" />
    </Icon>
  )
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.6 13.8 9l5.4 1.8-5.4 1.8L12 18l-1.8-5.4L4.8 10.8 10.2 9 12 3.6Z" />
      <path d="M18.6 15.6 19.4 18l2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z" />
    </Icon>
  )
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.6 12h16.8M12 3.4c2.2 2.3 3.4 5.3 3.4 8.6S14.2 18.3 12 20.6C9.8 18.3 8.6 15.3 8.6 12S9.8 5.7 12 3.4Z" />
    </Icon>
  )
}

export function LayersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3.6 8.4 4.2-8.4 4.2L3.6 7.8 12 3.6Z" />
      <path d="m3.6 12.4 8.4 4.2 8.4-4.2M3.6 16.6l8.4 4.2 8.4-4.2" />
    </Icon>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.2 2" />
    </Icon>
  )
}

export function TargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </Icon>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5" />
      <path d="M12 7.9v.1" strokeWidth={2.2} />
    </Icon>
  )
}

export function ChevronDown(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
    </Icon>
  )
}
