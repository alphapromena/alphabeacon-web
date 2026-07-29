/**
 * B2 — Connection permission sheet, slid over B1.
 *
 * The longer version of what the hub shows in one line: what each permission
 * actually unlocks, the exact scopes granted (mono, because they are
 * identifiers), when analytics last synced, and the disconnect.
 *
 * Disconnect names its consequence rather than asking "are you sure?" — that
 * is the whole reason `ConfirmDialog` requires the sentence.
 */
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { MonoNumber } from '@/components/ab/mono-number'
import { ConnectionStatusBadge } from '@/components/ab/status-badge'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useDataDispatch } from '@/data/provider'
import type { Connection } from '@/data/types'
import { relativeTime } from '@/lib/format'

export function ConnectionSheet({
  connection,
  open,
  onOpenChange,
}: {
  connection: Connection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const dispatch = useDataDispatch()
  const [scopesOpen, setScopesOpen] = useState(false)

  if (!connection) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>{connection.accountName ?? connection.platform}</SheetTitle>
          <SheetDescription>
            {connection.handle ? `@${connection.handle}` : 'Manage what this connection may do.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          <ConnectionStatusBadge status={connection.status} className="self-start" />

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <label htmlFor="sheet-analytics" className="text-sm font-medium">
                  Analytics
                </label>
                <p className="text-xs text-muted-foreground">
                  Lets us read reach, engagement and follower counts for this account. Turning it
                  off leaves existing history in place but stops new numbers arriving.
                </p>
              </div>
              <Switch
                id="sheet-analytics"
                checked={connection.permissions.analytics}
                onCheckedChange={(value) =>
                  dispatch({
                    type: 'connection/setPermission',
                    platform: connection.platform,
                    key: 'analytics',
                    value,
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <label htmlFor="sheet-posting" className="text-sm font-medium">
                  Posting
                </label>
                <p className="text-xs text-muted-foreground">
                  Lets approved posts publish here. With it off, this channel stops appearing when
                  you schedule — nothing already scheduled is cancelled.
                </p>
              </div>
              <Switch
                id="sheet-posting"
                checked={connection.permissions.posting}
                onCheckedChange={(value) =>
                  dispatch({
                    type: 'connection/setPermission',
                    platform: connection.platform,
                    key: 'posting',
                    value,
                  })
                }
              />
            </div>
          </div>

          <Separator />

          {connection.scopes.length > 0 && (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-auto w-fit px-2 py-1"
                aria-expanded={scopesOpen}
                onClick={() => setScopesOpen((value) => !value)}
              >
                <ChevronDown
                  aria-hidden
                  className={
                    scopesOpen
                      ? 'size-3 rotate-180 transition-transform'
                      : 'size-3 transition-transform'
                  }
                />
                Granted scopes
              </Button>
              {scopesOpen && (
                <ul className="flex flex-col gap-1 rounded-lg bg-muted p-3">
                  {connection.scopes.map((scope) => (
                    <li key={scope}>
                      {/* Scopes are identifiers, so they render mono. */}
                      <MonoNumber value={scope} className="text-xs" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {connection.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Analytics last synced <MonoNumber value={relativeTime(connection.lastSyncAt)} />.
            </p>
          )}

          <Separator />

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-destructive">Danger zone</h3>
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="sm" className="w-fit">
                  Disconnect this account
                </Button>
              }
              title={`Disconnect ${connection.accountName ?? connection.platform}?`}
              consequence="Scheduled posts for this channel will stop publishing, and new analytics will stop arriving. Posts already published stay where they are, and you can reconnect at any time."
              confirmLabel="Disconnect"
              onConfirm={() => {
                dispatch({ type: 'connections/disconnect', platform: connection.platform })
                toastSuccess('Disconnected', {
                  description: 'Reconnect whenever you want it back.',
                })
                onOpenChange(false)
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
