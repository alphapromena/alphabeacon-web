/**
 * N1 — the top bar's notification panel.
 *
 * This is the QUICK GLANCE. The full, persistent list lives on the Dashboard
 * (D1), so this deliberately shows only the most recent few and links there
 * rather than growing into a second inbox.
 *
 * Each row leads with an icon chosen by TYPE, because the five kinds of thing
 * that interrupt you are not equivalent — a failed payment and a batch of
 * drafts should be told apart before the sentence is read. Unread is carried by
 * weight and a dot, never by colour alone, and the bell's count is spoken in
 * its accessible name rather than left to the badge.
 */
import {
  Bell,
  Coins,
  CreditCard,
  Inbox,
  Plug,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications, useUnreadNotificationCount } from '@/data/provider'
import { useNotificationActions } from '@/data/notifications'
import type { NotificationType } from '@/data/types'
import { relativeTime } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  reauth_needed: Plug,
  low_credits: Coins,
  generation_failed: TriangleAlert,
  payment_failed: CreditCard,
  wallet_credited: Wallet,
  drafts_ready: Inbox,
  generic: Bell,
}

export function NotificationBell() {
  const notifications = useNotifications()
  const actions = useNotificationActions()
  // The badge is the unread-count ENDPOINT's number in live mode (the list
  // holds a page; the count is the whole inbox), derived locally otherwise.
  const unread = useUnreadNotificationCount()
  const recent = notifications.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-medium text-primary-foreground ring-2 ring-background"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-1.5 py-0.5 text-xs font-normal"
              onClick={() => void actions.markAllRead()}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {MESSAGES.empty.noNotifications}
          </p>
        ) : (
          recent.map((notification) => {
            // A kind minted after this build still renders — generically.
            const Icon = TYPE_ICON[notification.type] ?? Bell
            return (
              <DropdownMenuItem key={notification.id} asChild>
                <Link to={notification.href} className="flex items-start gap-2">
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className={cn('text-sm', !notification.read && 'font-medium')}>
                      {notification.message}
                    </span>
                    <MonoNumber
                      value={relativeTime(notification.at)}
                      className="text-xs text-muted-foreground"
                    />
                  </span>
                  {!notification.read && (
                    <>
                      <span
                        aria-hidden
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      />
                      <span className="sr-only">Unread</span>
                    </>
                  )}
                </Link>
              </DropdownMenuItem>
            )
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/">View everything on the Dashboard</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
