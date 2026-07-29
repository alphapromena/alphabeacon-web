/**
 * I6's ingestion lifecycle: Uploading → Processing → Ready | Failed.
 *
 * The timings are staged rather than real, but the VERDICT is real: whether a
 * file can be read is decided by looking at the file, so dropping a photo in
 * here genuinely fails and genuinely explains why. That is the difference
 * between a designed state and a decorative one.
 *
 * Every timer is tracked and cleared on unmount, because a batch left running
 * after the screen unmounts would dispatch into a world that has moved on.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useDataDispatch } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'

/** What the extractor can get text out of. Images and video cannot be read. */
const READABLE = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/json',
  'text/',
]

const READABLE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.json']

export function isReadable(file: { name: string; type: string }): boolean {
  if (file.type && READABLE.some((prefix) => file.type.startsWith(prefix))) return true
  if (file.type) return false
  // Some browsers report no type at all; fall back to the extension rather than
  // refusing a perfectly good text file.
  const name = file.name.toLowerCase()
  return READABLE_EXTENSIONS.some((extension) => name.endsWith(extension))
}

const UPLOAD_TICK_MS = 140
const PROCESS_MS = 1100

export function useKnowledgeUpload() {
  const dispatch = useDataDispatch()
  const timers = useRef<number[]>([])

  const after = useCallback((ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms))
  }, [])

  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id)
      timers.current = []
    },
    [],
  )

  /** Runs the processing half — used by both a fresh upload and a retry. */
  const process = useCallback(
    (docId: string, readable: boolean) => {
      dispatch({ type: 'knowledge/status', docId, status: 'processing' })
      after(PROCESS_MS, () => {
        dispatch(
          readable
            ? { type: 'knowledge/status', docId, status: 'ready' }
            : {
                type: 'knowledge/status',
                docId,
                status: 'failed',
                failureReason: MESSAGES.errors.knowledgeUnreadable,
              },
        )
      })
    },
    [after, dispatch],
  )

  const accept = useCallback(
    (files: File[]) => {
      files.forEach((file, index) => {
        const docId = `kd_${Date.now()}_${index}`
        const readable = isReadable(file)
        dispatch({
          type: 'knowledge/add',
          doc: {
            id: docId,
            filename: file.name,
            sizeBytes: file.size,
            status: 'uploading',
            progress: 0,
            addedAt: new Date().toISOString(),
          },
        })
        for (let step = 1; step <= 5; step += 1) {
          after(UPLOAD_TICK_MS * step, () =>
            dispatch({ type: 'knowledge/progress', docId, progress: step * 20 }),
          )
        }
        after(UPLOAD_TICK_MS * 6, () => process(docId, readable))
      })
    },
    [after, dispatch, process],
  )

  /** Re-runs processing for a file that failed for a reason that might pass. */
  const retry = useCallback((docId: string) => process(docId, true), [process])

  return { accept, retry }
}
