/**
 * N4 — the offline / degraded-service banner.
 *
 * Thin, non-blocking, non-modal, and gone the moment the condition clears —
 * the design brief is "tell them, do not trap them". It sits under the top bar
 * on every authenticated screen, so there is one place this is said.
 *
 * Offline is read from the browser's real `online`/`offline` events, which is
 * genuine signal and costs nothing. "Degraded service" has no honest signal in
 * an app that never makes a request, so it comes from the `/dev/states`
 * override instead of being faked from a timer — a banner that invents an
 * outage would be the first lie in the product.
 */
import { CloudOff, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useConnectivity } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'

export function OfflineBanner() {
  const override = useConnectivity()
  const [browserOffline, setBrowserOffline] = useState(false)

  useEffect(() => {
    // Read on mount as well as on change: a tab restored while offline never
    // fires the event, and would otherwise show nothing.
    setBrowserOffline(!window.navigator.onLine)
    const goOffline = () => setBrowserOffline(true)
    const goOnline = () => setBrowserOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  const offline = override === 'offline' || (override === 'auto' && browserOffline)
  const degraded = override === 'degraded'
  if (!offline && !degraded) return null

  const Icon = offline ? WifiOff : CloudOff

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-1.5 text-sm text-warning md:px-6"
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <p>{offline ? MESSAGES.notices.offline : MESSAGES.notices.degraded}</p>
    </div>
  )
}
