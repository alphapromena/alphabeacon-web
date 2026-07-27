import { dayFromNow, timestampAt } from '@/data/dates'
import type { Connection } from '@/data/types'

/** Active tenant: two healthy channels, one needing re-auth, X coming soon. */
export function atlasConnections(): Connection[] {
  return [
    {
      id: 'conn_fb',
      platform: 'facebook',
      status: 'active',
      accountName: 'Atlas Roasters',
      handle: 'atlasroasters',
      connectedSince: dayFromNow(-92),
      permissions: { analytics: true, posting: true },
      scopes: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'],
      lastSyncAt: timestampAt(0, '06:10'),
      pages: [
        { id: 'page_main', name: 'Atlas Roasters', selected: true },
        { id: 'page_events', name: 'Atlas Roasters Events', selected: false },
      ],
    },
    {
      id: 'conn_ig',
      platform: 'instagram',
      status: 'active',
      accountName: 'Atlas Roasters',
      handle: 'atlas.roasters',
      connectedSince: dayFromNow(-92),
      permissions: { analytics: true, posting: true },
      scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
      lastSyncAt: timestampAt(0, '06:10'),
    },
    {
      id: 'conn_li',
      platform: 'linkedin',
      status: 'needs_reauth',
      accountName: 'Atlas Roasters',
      handle: 'atlas-roasters',
      connectedSince: dayFromNow(-60),
      permissions: { analytics: false, posting: true },
      scopes: ['w_member_social'],
      lastSyncAt: timestampAt(-3, '06:10'),
    },
    {
      id: 'conn_x',
      platform: 'x',
      status: 'not_connected',
      permissions: { analytics: false, posting: false },
      scopes: [],
    },
  ]
}

/** Fresh tenant: nothing connected; X still shown as coming soon. */
export function novaConnections(): Connection[] {
  return (['facebook', 'instagram', 'linkedin', 'x'] as const).map((platform) => ({
    id: `conn_${platform}`,
    platform,
    status: 'not_connected' as const,
    permissions: { analytics: false, posting: false },
    scopes: [],
  }))
}
