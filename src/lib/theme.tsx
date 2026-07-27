/**
 * Theming: next-themes drives the class-based light/dark switch (the shadcn
 * convention — ui/sonner.tsx reads it too). The only thing this app ever
 * persists is the theme preference, under the "ab-theme" key
 * (architecture.md — Persistence). Marketing routes are forced light in W2.
 */
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="ab-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

export { useTheme }
