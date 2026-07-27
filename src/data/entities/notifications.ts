import { timestampAt } from '@/data/dates'
import type { ActivityItem, AppNotification } from '@/data/types'

export function atlasNotifications(): AppNotification[] {
  return [
    {
      id: 'notif_001',
      type: 'drafts_ready',
      message: '5 drafts are ready for review across 3 slots.',
      at: timestampAt(0, '06:02'),
      read: false,
      href: '/today',
    },
    {
      id: 'notif_002',
      type: 'reauth_needed',
      message: 'LinkedIn needs to be reconnected — one post is waiting on it.',
      at: timestampAt(-1, '17:01'),
      read: false,
      href: '/connections',
    },
    {
      id: 'notif_003',
      type: 'generation_failed',
      message: 'A Studio video run failed. Your credits were released.',
      at: timestampAt(-2, '15:24'),
      read: true,
      href: '/studio/jobs',
    },
  ]
}

export function atlasActivity(): ActivityItem[] {
  return [
    {
      id: 'act_001',
      type: 'media_generated',
      message: 'Image generated for the washed-process explainer.',
      at: timestampAt(0, '08:51'),
    },
    {
      id: 'act_002',
      type: 'draft_approved',
      message: 'Maya approved the futures-price post.',
      at: timestampAt(0, '08:41'),
    },
    {
      id: 'act_003',
      type: 'post_published',
      message: 'Kirinyaga AA launch went out to Facebook and Instagram.',
      at: timestampAt(-1, '09:00'),
    },
  ]
}
