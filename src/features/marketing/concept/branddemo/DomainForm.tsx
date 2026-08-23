import { forwardRef, useState } from 'react'
import { DEMO_DOMAINS, normalizeDomain } from '@/features/marketing/concept/lib/analysis'
import { Button } from '../ui'
import styles from './brandDemo.module.css'

/**
 * The entry point. Deliberately not a signup form — one large field, one
 * action, and a line making clear nothing leaves the page.
 */
export const DomainForm = forwardRef<HTMLInputElement, { onSubmit: (domain: string) => void }>(
  function DomainForm({ onSubmit }, ref) {
    const [value, setValue] = useState('')
    const [error, setError] = useState<string | null>(null)

    const submit = (e: React.FormEvent) => {
      e.preventDefault()
      const raw = value.trim()

      if (!raw) {
        setError('Enter your company website to continue.')
        return
      }
      const domain = normalizeDomain(raw)
      if (!domain) {
        setError("That doesn't look like a website address. Try yourcompany.com")
        return
      }
      setError(null)
      onSubmit(domain)
    }

    return (
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.field} data-invalid={error ? true : undefined}>
          <label className="visually-hidden" htmlFor="company-url">
            Your company website
          </label>
          <input
            id="company-url"
            ref={ref}
            className={styles.input}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="yourcompany.com"
            value={value}
            aria-invalid={error ? true : undefined}
            /* The section-level concept-preview notice is what this field needs
             described; it says more, and says it before anything runs. */
            aria-describedby={error ? 'company-url-error' : 'demo-notice'}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
          />
          <Button type="submit" tone="primary" size="lg" className={styles.submit}>
            Show me →
          </Button>
        </div>

        <p className={styles.error} id="company-url-error" role="alert">
          {error}
        </p>

        <p className={styles.tryList}>
          <span>Try a worked example</span>
          {DEMO_DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              className={styles.tryChip}
              onClick={() => {
                setValue(d)
                setError(null)
                onSubmit(d)
              }}
            >
              {d}
            </button>
          ))}
        </p>
      </form>
    )
  },
)
