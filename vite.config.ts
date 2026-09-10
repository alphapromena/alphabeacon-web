import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // `e2e/*.test.ts` are unit tests of the harness itself (HSN-0910/D's
    // no-production guard); the Playwright specs are `*.spec.ts` and untouched.
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'e2e/**/*.test.ts'],
    css: false,
  },
})
