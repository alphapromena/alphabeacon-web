import { useEffect, useRef, useState } from 'react'
import {
  APPROVAL_NOTE,
  APPROVAL_PIECE,
  APPROVAL_STAGES,
  TRUST_PILLARS,
} from '@/features/marketing/concept/lib/content'
import { getCustomer } from '@/features/marketing/concept/lib/customers'
import { usePrefersReducedMotion } from '@/features/marketing/concept/useConceptHooks'
import { PostCard } from '../posts'
import { RealPostCard } from '../RealPost'
import { CustomerLogo } from '../CustomerLogo'
import { SectionHead, Stop } from '../ui'
import { CheckIcon, CheckCircleIcon, CloseIcon, ClockIcon, MemoryIcon, PencilIcon } from '../icons'
import styles from './approval.module.css'

type Outcome = 'idle' | 'running' | 'done' | 'editing' | 'declined'

/**
 * The approval moment, made real. Approving advances the piece through its
 * actual states and ends with Malaky recording the preference — calm and
 * immediate, no celebration animation.
 *
 * The control guarantees used to live in their own section further down,
 * restating in a list what this interaction had already proved. They now sit
 * underneath it as a quiet strip: the demonstration is the argument, and the
 * strip only records which of the four are demonstrated and which are still
 * planned.
 */
export function Approval() {
  /* The remembered-preference line names the customer this piece was
     prepared for, rather than hardcoding one. */
  const customer = getCustomer(APPROVAL_PIECE.customerId!)
  const [outcome, setOutcome] = useState<Outcome>('idle')
  const [stage, setStage] = useState(0)
  const [remembered, setRemembered] = useState(false)
  const timers = useRef<number[]>([])
  const reducedMotion = usePrefersReducedMotion()

  const clear = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }

  useEffect(() => clear, [])

  const approve = () => {
    clear()
    setOutcome('running')
    if (reducedMotion) {
      setStage(2)
      setRemembered(true)
      setOutcome('done')
      return
    }
    timers.current.push(
      window.setTimeout(() => setStage(1), 320),
      window.setTimeout(() => setStage(2), 1150),
      window.setTimeout(() => {
        setRemembered(true)
        setOutcome('done')
      }, 1750),
    )
  }

  const reset = () => {
    clear()
    setStage(0)
    setRemembered(false)
    setOutcome('idle')
  }

  const busy = outcome === 'running'

  return (
    <section className={styles.section} id="control" aria-labelledby="approval-title">
      <div className="shell">
        <SectionHead
          id="approval-title"
          title={
            <>
              You stay in control.
              <br />
              Approval takes seconds
              <Stop />
            </>
          }
          lead="Nothing is published behind your back. Malaky brings finished work to a decision, and every decision teaches it something."
        />

        <div className={styles.panel}>
          <div className={styles.postCol}>
            {/* The review item is the customer's own finished creative, shown
                whole at its own aspect ratio with no chrome drawn around it.
                The header names who it belongs to and what state it is in —
                which is what a reviewer needs before deciding. */}
            <div className={styles.post}>
              <div className={styles.reviewHead}>
                <CustomerLogo customer={customer} size={30} />
                <span className={styles.reviewMeta}>
                  <span className={styles.reviewChannel}>{APPROVAL_PIECE.label}</span>
                  <span className={styles.reviewState}>{APPROVAL_PIECE.timestamp}</span>
                </span>
              </div>
              {APPROVAL_PIECE.realPostId ? (
                <RealPostCard
                  id={APPROVAL_PIECE.realPostId}
                  sizes="(max-width: 900px) 92vw, 420px"
                />
              ) : (
                <PostCard piece={APPROVAL_PIECE} />
              )}
            </div>

            <p className={styles.provenance}>{APPROVAL_NOTE}</p>

            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.action} ${styles.approve}`}
                onClick={approve}
                disabled={busy || outcome === 'done'}
              >
                <CheckCircleIcon size={17} />
                {outcome === 'done' ? 'Approved' : 'Approve'}
              </button>
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  clear()
                  setOutcome('editing')
                }}
                disabled={busy}
              >
                <PencilIcon size={16} />
                Edit
              </button>
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  clear()
                  setStage(0)
                  setRemembered(false)
                  setOutcome('declined')
                }}
                disabled={busy}
              >
                <CloseIcon size={16} />
                Decline
              </button>
            </div>

            {(outcome === 'editing' || outcome === 'declined' || outcome === 'done') && (
              <p className={styles.note}>
                {outcome === 'editing' &&
                  'The draft opens with your brand rules attached. Whatever you change becomes a preference.'}
                {outcome === 'declined' &&
                  'Declined. Malaky asks once why, then stops preparing this kind of post.'}
                {outcome === 'done' && "Nothing else to do. You'll see it go out on Monday."}
              </p>
            )}

            {outcome !== 'idle' && (
              <button type="button" className={styles.reset} onClick={reset}>
                Run it again
              </button>
            )}
          </div>

          <div className={styles.stateCol}>
            <ol className={styles.track} aria-label="Approval status">
              {APPROVAL_STAGES.map((label, i) => (
                <li
                  key={label}
                  className={styles.step}
                  data-state={i < stage ? 'done' : i === stage ? 'current' : 'todo'}
                >
                  <span className={styles.stepMark}>
                    {i < stage ? <CheckIcon size={12} /> : <span className={styles.stepDot} />}
                  </span>
                  <span className={styles.stepLabel}>{label}</span>
                </li>
              ))}
            </ol>

            <div className={styles.detail} data-on={stage === 2 || undefined}>
              <span className={styles.detailIcon}>
                <ClockIcon size={16} />
              </span>
              <div>
                <p className={styles.detailTitle}>Scheduled</p>
                <p className={styles.detailBody}>Monday, 11:00 — the slot this audience reads.</p>
              </div>
            </div>

            <div className={styles.detail} data-on={remembered || undefined}>
              <span className={styles.detailIcon}>
                <MemoryIcon size={16} />
              </span>
              <div>
                <p className={styles.detailTitle}>
                  Preference remembered
                  <CheckIcon size={12} className={styles.detailCheck} />
                </p>
                <p className={styles.detailBody}>
                  Approved without edits. Malaky will keep this length and register for{' '}
                  {customer.name}.
                </p>
              </div>
            </div>

            <p className={styles.live} aria-live="polite">
              {outcome === 'idle'
                ? 'Waiting for your decision'
                : outcome === 'declined'
                  ? 'Declined'
                  : outcome === 'editing'
                    ? 'Opening the draft for editing'
                    : `${APPROVAL_STAGES[stage]}${remembered ? ' — preference remembered' : ''}`}
            </p>
          </div>
        </div>

        <ul className={styles.pillars} aria-label="What stays under your control">
          {TRUST_PILLARS.map((pillar) => (
            <li
              key={pillar.id}
              className={styles.pillar}
              data-planned={pillar.state === 'planned' || undefined}
            >
              <p className={styles.pillarTitle}>{pillar.title}</p>
              <p className={styles.pillarState}>
                {pillar.state === 'planned' ? 'Planned' : 'Demonstrated'}
              </p>
            </li>
          ))}
        </ul>

        <p className={styles.disclosure}>
          &ldquo;Demonstrated&rdquo; means you can exercise the behaviour on this page.
          &ldquo;Planned&rdquo; means it is described here and still to be built.
        </p>
      </div>
    </section>
  )
}
