/**
 * The notifications seam (INT-5). One mutation exists on the wire — read-all
 * (idempotent; a second call reports `{ updated: 0 }`) — and there is no
 * per-item mark-as-read, which is why the bell's affordance is "Mark all as
 * read" and nothing subtler. Clicking a row navigates; it does not (cannot)
 * mark that row read.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { useDataDispatch, useLiveWorkingOrgId } from '@/data/provider'

export function useNotificationActions() {
  const dispatch = useDataDispatch()
  const orgId = useLiveWorkingOrgId()
  const live = isLiveMode()

  return {
    async markAllRead(): Promise<void> {
      // Optimistic in both modes: the rows dim at once, and the server call
      // is idempotent so a retry costs nothing.
      dispatch({ type: 'notifications/markAllRead' })
      if (!live || !orgId) return
      try {
        await api<{ updated: number }>('POST', `/orgs/${orgId}/notifications/read-all`)
        dispatch({ type: 'live/resync' })
      } catch {
        // The resync (or the next boot) reconciles; the optimistic dim was
        // never a lie the server contradicts — read-all is the only writer.
      }
    },
  }
}
