import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest runs without `globals`, so Testing Library cannot register its own
// auto-cleanup — without this the DOM accumulates across tests in a file and
// role queries start finding duplicates from earlier cases.
afterEach(cleanup)
