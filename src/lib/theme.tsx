/**
 * Theming: there is ONE theme (D-THEME-0913-B). Dark is the product — it is
 * not a preference, a mode, or a toggle, and the light palette is retired
 * rather than kept behind a switch. A light theme is a separate decision.
 *
 * next-themes still mounts, for one reason: it stamps `class="dark"` on
 * `<html>`, and the shadcn primitives under `components/ui/` carry
 * dark-specific classes (`dark:bg-input/30`, `dark:border-input`,
 * `dark:bg-destructive/20`, …) that are gated on that class. Dropping the
 * provider would silently disable all of them. `forcedTheme` makes the
 * preference unreachable — nothing is persisted and nothing reads the system
 * setting — while the class stays where the primitives expect it.
 *
 * The tokens themselves live on `:root` (tokens.css), so the palette is
 * correct even before the class lands and there is no first-paint flash.
 */
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" forcedTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  )
}

export { useTheme }
