/**
 * The no-production guard (ORDER HSN-0910/D): a LIVE run must declare
 * `E2E_API_ENV=dev`, and a base equal to `PROD_API_BASE_URL` is refused
 * whatever is declared. Static runs are never asked for anything. Both rules
 * read the environment — no URL literal lives in source.
 */
import { describe, expect, it } from 'vitest'
import { assertNotProduction } from './global-setup'

const DEV = 'https://dev.example.invalid/api'
const PROD = 'https://prod.example.invalid/api'

describe('assertNotProduction', () => {
  it('asks nothing of a static run', () => {
    expect(() => assertNotProduction({})).not.toThrow()
    expect(() => assertNotProduction({ E2E_API_ENV: 'production' })).not.toThrow()
  })

  it('refuses a live run that does not declare dev', () => {
    expect(() => assertNotProduction({ VITE_API_BASE_URL: DEV })).toThrow(
      /E2E_API_ENV must be "dev"/,
    )
    expect(() => assertNotProduction({ VITE_API_BASE_URL: DEV, E2E_API_ENV: 'staging' })).toThrow(
      /E2E_API_ENV must be "dev"/,
    )
    expect(() => assertNotProduction({ VITE_API_BASE_URL: DEV, E2E_API_ENV: 'prod' })).toThrow()
  })

  it('lets a declared dev run through', () => {
    expect(() => assertNotProduction({ VITE_API_BASE_URL: DEV, E2E_API_ENV: 'dev' })).not.toThrow()
    expect(() =>
      assertNotProduction({ VITE_API_BASE_URL: DEV, E2E_API_ENV: 'dev', PROD_API_BASE_URL: PROD }),
    ).not.toThrow()
  })

  it('refuses the production base by value, whatever the run declares — trailing slashes included', () => {
    expect(() =>
      assertNotProduction({ VITE_API_BASE_URL: PROD, E2E_API_ENV: 'dev', PROD_API_BASE_URL: PROD }),
    ).toThrow(/PRODUCTION/)
    expect(() =>
      assertNotProduction({
        VITE_API_BASE_URL: `${PROD}/`,
        E2E_API_ENV: 'dev',
        PROD_API_BASE_URL: PROD,
      }),
    ).toThrow(/PRODUCTION/)
  })
})
