/**
 * B1 — Connections hub · `/connections`.
 *
 * One card per platform, always all four, because a channel you *could* add is
 * as much a part of this screen as one you already have. X is permanently
 * "coming soon" — shown and explained rather than hidden, since hiding it
 * invites the question every week.
 *
 * Status is never colour alone (StatusBadge pairs icon and words), and the two
 * permissions are separate switches because analytics and posting are genuinely
 * different grants: plenty of teams want the numbers without handing over the
 * ability to post.
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { ConnectionStatusBadge } from '@/components/ab/status-badge'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SkeletonCardGrid } from '@/components/ab/skeletons'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConnections, useDataDispatch, useScreenPhase } from '@/data/provider'
import type { Connection, Platform } from '@/data/types'
import { relativeTime, shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { ConnectionSheet } from './connection-sheet'
import { ConnectReturn } from './connect-return'
import { PLATFORMS } from './platforms'

export function ConnectionsScreen() {
  const connections = useConnections()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()
  const [params, setParams] = useSearchParams()

  const [sheetFor, setSheetFor] = useState<Connection | null>(null)
  const [pagePickerFor, setPagePickerFor] = useState<Connection | null>(null)

  // B3 arrives as a routed step (`?connect=…`), not a redirect to a provider:
  // this app never leaves the browser, so the return states are reached the
  // same way a real OAuth callback would land — by URL.
  const connectState = params.get('connect')
  if (connectState) {
    return (
      <ConnectReturn
        state={connectState}
        platform={(params.get('platform') as Platform) ?? 'facebook'}
        onDone={() => setParams({})}
      />
    )
  }

  return (
    <AppShell title="Connections" context="Where your posts go, and what we may read">
      {phase === 'loading' ? (
        <SkeletonCardGrid cards={4} columns={2} label="Loading connections" />
      ) : phase === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((connection) => {
            const { label, icon: Icon } = PLATFORMS[connection.platform]
            const comingSoon = connection.platform === 'x'
            const connected = connection.status === 'active'
            const broken = connection.status === 'needs_reauth' || connection.status === 'revoked'

            return (
              <Card key={connection.id} className={comingSoon ? 'opacity-80' : undefined}>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{label}</span>
                        <ConnectionStatusBadge status={connection.status} />
                      </div>
                    </div>
                    {comingSoon && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="rounded-md text-xs text-muted-foreground">
                            Coming soon
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{MESSAGES.notices.xComingSoon}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {connection.accountName && (
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
                      <span>{connection.accountName}</span>
                      {connection.handle && <span>@{connection.handle}</span>}
                      {connection.connectedSince && (
                        <span>
                          · connected <MonoNumber value={shortDate(connection.connectedSince)} />
                        </span>
                      )}
                    </div>
                  )}

                  {connected && (
                    <div className="flex flex-col gap-3">
                      <PermissionSwitch
                        connection={connection}
                        permission="analytics"
                        title="Analytics"
                        description="Read reach and engagement for posts on this channel."
                      />
                      <PermissionSwitch
                        connection={connection}
                        permission="posting"
                        title="Posting"
                        description="Publish approved posts to this channel."
                      />
                    </div>
                  )}

                  {broken && (
                    <p className="text-sm text-muted-foreground">
                      {connection.status === 'revoked'
                        ? 'Access was revoked at the platform. Reconnecting restores it.'
                        : 'The token expired. Reconnecting takes a few seconds.'}
                      {connection.lastSyncAt && (
                        <>
                          {' '}
                          Last synced <MonoNumber value={relativeTime(connection.lastSyncAt)} />.
                        </>
                      )}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {comingSoon ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0}>
                            <Button size="sm" variant="outline" disabled>
                              Connect
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{MESSAGES.notices.xComingSoon}</TooltipContent>
                      </Tooltip>
                    ) : connected ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setSheetFor(connection)}>
                          Manage
                        </Button>
                        {connection.pages && connection.pages.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPagePickerFor(connection)}
                          >
                            Choose Pages
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          setParams({
                            connect: broken ? 'success' : 'success',
                            platform: connection.platform,
                          })
                        }
                      >
                        {broken ? 'Reconnect' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConnectionSheet
        connection={sheetFor}
        open={sheetFor !== null}
        onOpenChange={(next) => !next && setSheetFor(null)}
      />
      <PagePicker
        connection={pagePickerFor}
        open={pagePickerFor !== null}
        onOpenChange={(next) => !next && setPagePickerFor(null)}
        onSave={(pageIds) => {
          if (!pagePickerFor) return
          dispatch({
            type: 'connection/setPages',
            platform: pagePickerFor.platform,
            pageIds,
          })
          toastSuccess('Pages updated')
          setPagePickerFor(null)
        }}
      />
    </AppShell>
  )
}

function PermissionSwitch({
  connection,
  permission,
  title,
  description,
}: {
  connection: Connection
  permission: 'analytics' | 'posting'
  title: string
  description: string
}) {
  const dispatch = useDataDispatch()
  const id = `${connection.platform}-${permission}`
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {title}
        </label>
        {/* Each switch says what it unlocks — a permission nobody understands
            is a permission granted by accident. */}
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={connection.permissions[permission]}
        onCheckedChange={(value) =>
          dispatch({
            type: 'connection/setPermission',
            platform: connection.platform,
            key: permission,
            value,
          })
        }
      />
    </div>
  )
}

/** Facebook grants access to several Pages at once; the user picks which. */
function PagePicker({
  connection,
  open,
  onOpenChange,
  onSave,
}: {
  connection: Connection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pageIds: string[]) => void
}) {
  const [chosen, setChosen] = useState<string[]>([])
  const pages = connection?.pages ?? []

  if (!connection) return null

  const current = chosen.length > 0 ? chosen : pages.filter((p) => p.selected).map((p) => p.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Choose Pages</DialogTitle>
          <DialogDescription>
            We only publish to the Pages you pick here, even though the connection can see more.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {pages.map((page) => (
            <li
              key={page.id}
              className="flex items-center gap-2 rounded-lg border border-border p-3"
            >
              <Checkbox
                id={`page-${page.id}`}
                checked={current.includes(page.id)}
                onCheckedChange={(value) =>
                  setChosen(value ? [...current, page.id] : current.filter((id) => id !== page.id))
                }
              />
              <label htmlFor={`page-${page.id}`} className="text-sm">
                {page.name}
              </label>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(current)}>Connect selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
