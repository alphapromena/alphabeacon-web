import { Link } from 'react-router'
import { useEffect, useId, useRef, useState } from 'react'
import {
  DEPLOYMENT_CLOSE,
  DEPLOYMENT_PHASES,
  EMPTY_REQUEST,
  INTEREST_OPTIONS,
  WHAT_HAPPENS_NEXT,
  isFreeEmailHost,
  submitDemoRequest,
  validateDemoRequest,
  type DemoRequest,
  type FieldErrors,
  type InterestId,
  type RequiredField,
} from '@/features/marketing/concept/lib/demo-request'
import { track } from '@/features/marketing/concept/lib/analytics'
import { HOME_HREF, PRICING_HREF, PRIVACY_HREF } from '@/features/marketing/concept/site'
import { Button, Stop } from '../ui'
import { CheckIcon } from '../icons'
import { CONTACT_EMAIL } from '@/features/marketing/concept/site'
import styles from './requestDemo.module.css'

type Phase = 'form' | 'sending' | 'done'

interface Field {
  name: RequiredField
  label: string
  hint?: string
  type?: string
  inputMode?: 'text' | 'email' | 'url'
  autoComplete?: string
  placeholder?: string
}

/** Six fields. Revenue, budget, headcount and timelines can wait. */
const FIELDS: Field[] = [
  { name: 'name', label: 'Name', autoComplete: 'name' },
  {
    name: 'email',
    label: 'Work email',
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
  },
  { name: 'company', label: 'Company', autoComplete: 'organization' },
  {
    name: 'website',
    label: 'Company website',
    inputMode: 'url',
    autoComplete: 'url',
    placeholder: 'yourcompany.com',
  },
  { name: 'role', label: 'Role', autoComplete: 'organization-title' },
  {
    name: 'market',
    label: 'Country / primary market',
    autoComplete: 'country-name',
  },
]

/**
 * The private-demo request.
 *
 * Nothing here is a signup: no account, no password, no trial. The form asks
 * for the six things that make a first conversation specific and stops. What
 * it does with them is one awaited call — see concept/lib/demo-request.ts,
 * which is also the file that explains why nothing is transmitted yet.
 */
export function RequestDemo() {
  const [values, setValues] = useState<DemoRequest>(EMPTY_REQUEST)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [phase, setPhase] = useState<Phase>('form')
  const [failure, setFailure] = useState<string | null>(null)
  const started = useRef(false)
  const successRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const formId = useId()

  useEffect(() => {
    track('demo_request_view')
  }, [])

  /** Fired once, on the first sign of intent rather than on page load. */
  const markStarted = () => {
    if (started.current) return
    started.current = true
    track('demo_request_started')
  }

  const setField = (name: keyof DemoRequest, value: string) => {
    markStarted()
    setValues((v) => ({ ...v, [name]: value }))
    // Clear the message the moment the visitor addresses it, not on blur.
    setErrors((e) => (name in e ? { ...e, [name]: undefined } : e))
    setFailure(null)
  }

  const toggleInterest = (id: InterestId) => {
    markStarted()
    setValues((v) => {
      const on = v.interests.includes(id)
      const interests = on ? v.interests.filter((i) => i !== id) : [...v.interests, id]
      track('demo_request_interest_selected', {
        interest: id,
        selected: !on,
        count: interests.length,
      })
      return { ...v, interests }
    })
  }

  const allSelected = values.interests.length === INTEREST_OPTIONS.length

  const toggleAll = () => {
    markStarted()
    setValues((v) => {
      const interests = allSelected ? [] : INTEREST_OPTIONS.map((o) => o.id)
      track('demo_request_interest_selected', {
        interest: 'all',
        selected: !allSelected,
        count: interests.length,
      })
      return { ...v, interests }
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phase === 'sending') return

    const found = validateDemoRequest(values)
    setErrors(found)

    const firstBad = FIELDS.find((f) => found[f.name])
    if (firstBad) {
      track('demo_request_error', { reason: 'validation', field: firstBad.name })
      // Send focus to the first problem rather than announcing six at once.
      document.getElementById(`${formId}-${firstBad.name}`)?.focus()
      return
    }

    setPhase('sending')
    setFailure(null)
    track('demo_request_submitted', {
      interests: values.interests,
      hasNotes: values.notes.trim().length > 0,
    })

    const result = await submitDemoRequest(values)

    if (!result.ok) {
      setPhase('form')
      setFailure(result.message)
      track('demo_request_error', { reason: 'submission' })
      window.requestAnimationFrame(() => errorRef.current?.focus())
      return
    }

    setPhase('done')
    track('demo_request_success')
  }

  /* --- success ---------------------------------------------------- */

  useEffect(() => {
    if (phase !== 'done') return
    // The whole page changed under them; move focus to the new heading.
    window.requestAnimationFrame(() => successRef.current?.focus())
  }, [phase])

  if (phase === 'done') {
    return (
      <div className={styles.successWrap}>
        <div className={`shell ${styles.success}`} ref={successRef} tabIndex={-1}>
          <span className={styles.successMark} aria-hidden="true">
            <CheckIcon size={22} />
          </span>
          <h1 className={styles.successTitle}>
            You&rsquo;re on the list
            <Stop />
          </h1>
          <p className={styles.successBody}>
            We&rsquo;ll use the company information you shared to make the first conversation
            useful.
          </p>
          {/* PORT ADDITION (M2). Nothing is transmitted yet — see
              concept/lib/demo-request.ts — so the one honest thing this state
              can offer is a way to reach a person directly. Stated here as
              well as on the form because this is where a visitor who has just
              sent something wonders whether anyone received it. */}
          <p className={styles.contact}>
            Would rather talk to someone now?{' '}
            <a className={styles.contactLink} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          {/* A scheduling action would sit here, once there is real availability
              to offer. Nothing is faked in the meantime. */}
          <div className={styles.successActions}>
            <Button href={HOME_HREF} tone="primary" size="lg" arrow>
              Back to Malaky
            </Button>
            <Button href={PRICING_HREF} tone="secondary" size="lg">
              View pricing
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* --- form ------------------------------------------------------- */

  const sending = phase === 'sending'
  const nudgeFreeEmail =
    values.email.includes('@') && !errors.email && isFreeEmailHost(values.email)

  return (
    <>
      <section className={styles.top}>
        <span className={styles.topGlow} aria-hidden="true" />
        <div className={`shell ${styles.topInner}`}>
          <p className={styles.eyebrow}>Request a private demo</p>
          <h1 className={styles.title}>
            Let&rsquo;s see what Malaky could run for your business
            <Stop />
          </h1>
          <p className={styles.lead}>
            Tell us a little about your company. We&rsquo;ll use it to make the conversation
            specific to your brand, markets and marketing operation.
          </p>
        </div>
      </section>

      <section className={styles.body} aria-labelledby="form-title">
        <div className={`shell ${styles.grid}`}>
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <h2 className="visually-hidden" id="form-title">
              Your details
            </h2>

            <div className={styles.fields}>
              {FIELDS.map((field) => {
                const id = `${formId}-${field.name}`
                const bad = errors[field.name]
                return (
                  <p
                    key={field.name}
                    className={styles.field}
                    data-invalid={bad ? true : undefined}
                  >
                    <label className={styles.label} htmlFor={id}>
                      {field.label}
                    </label>
                    <input
                      id={id}
                      className={styles.input}
                      type={field.type ?? 'text'}
                      inputMode={field.inputMode}
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder}
                      spellCheck={false}
                      value={values[field.name]}
                      disabled={sending}
                      aria-invalid={bad ? true : undefined}
                      aria-describedby={bad ? `${id}-error` : undefined}
                      onChange={(e) => setField(field.name, e.target.value)}
                    />
                    {bad && (
                      <span className={styles.fieldError} id={`${id}-error`}>
                        {bad}
                      </span>
                    )}
                    {field.name === 'email' && nudgeFreeEmail && (
                      <span className={styles.fieldHint}>
                        A work address helps us look at the right company.
                      </span>
                    )}
                  </p>
                )
              })}
            </div>

            <fieldset className={styles.interests}>
              <legend className={styles.legend}>
                What would you most like Malaky to help with?
              </legend>
              <p className={styles.legendHint}>Choose as many as apply.</p>

              <div className={styles.chips}>
                {INTEREST_OPTIONS.map((option) => {
                  const on = values.interests.includes(option.id)
                  return (
                    <label key={option.id} className={styles.chip} data-on={on || undefined}>
                      <input
                        type="checkbox"
                        className={styles.chipInput}
                        checked={on}
                        disabled={sending}
                        onChange={() => toggleInterest(option.id)}
                      />
                      <CheckIcon size={12} className={styles.chipCheck} aria-hidden="true" />
                      {option.label}
                    </label>
                  )
                })}

                <label
                  className={`${styles.chip} ${styles.chipAll}`}
                  data-on={allSelected || undefined}
                >
                  <input
                    type="checkbox"
                    className={styles.chipInput}
                    checked={allSelected}
                    disabled={sending}
                    onChange={toggleAll}
                  />
                  <CheckIcon size={12} className={styles.chipCheck} aria-hidden="true" />
                  All of the above
                </label>
              </div>
            </fieldset>

            <p className={styles.field}>
              <span className={styles.labelRow}>
                <label className={styles.label} htmlFor={`${formId}-notes`}>
                  Anything we should know?
                </label>
                <span className={styles.optional}>Optional</span>
              </span>
              <textarea
                id={`${formId}-notes`}
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                value={values.notes}
                disabled={sending}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </p>

            <p
              className={styles.submitError}
              role="alert"
              tabIndex={-1}
              ref={errorRef}
              hidden={!failure}
            >
              {failure}
            </p>

            <div className={styles.submitRow}>
              <Button type="submit" tone="primary" size="lg" arrow disabled={sending}>
                {sending ? 'Sending…' : 'Send request'}
              </Button>
              {/* The sentence stays as it was; the link is added so a visitor
                  can read the detail without being asked to accept anything —
                  requesting a demo is not agreeing to customer terms. */}
              <p className={styles.privacy}>
                We&rsquo;ll use the information you provide to respond to this request.{' '}
                <Link to={PRIVACY_HREF} className={styles.privacyLink}>
                  Privacy Policy
                </Link>
                <br />
                {/* PORT ADDITION (M2): the direct route, offered before the
                    form rather than only after it. */}
                Or email us directly at{' '}
                <a className={styles.privacyLink} href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </form>

          <aside className={styles.aside}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>What happens next</h2>
              <ol className={styles.next}>
                {WHAT_HAPPENS_NEXT.map((step, i) => (
                  <li key={step}>
                    <span className={styles.nextNum}>{String(i + 1).padStart(2, '0')}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>What a Malaky deployment starts with</h2>
              <ul className={styles.phases}>
                {DEPLOYMENT_PHASES.map((p) => (
                  <li key={p.id}>
                    <span className={styles.phaseTitle}>{p.title}</span>
                    <span className={styles.phaseBody}>{p.body}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.phaseClose}>{DEPLOYMENT_CLOSE}</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
