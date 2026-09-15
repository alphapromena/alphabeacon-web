import { RouterProvider } from 'react-router'
import { FirstLightGate } from '@/components/ab/first-light-gate'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataProvider } from '@/data/provider'
import { ThemeProvider } from '@/lib/theme'
import { router } from '@/routes'

export function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        {/* Sidebar rail tooltips and ClaimChip both need this context at the
            root — shadcn's SidebarProvider does not supply it. */}
        <TooltipProvider delayDuration={200}>
          <RouterProvider router={router} />
          {/*
           * MOMENT 2 (ORDER MOTION-0914/B) — above the router, not inside a
           * route. It plays over whatever the app has already routed to and
           * dismisses to reveal it, which is what makes "skipping lands in the
           * same place" structural: the overlay never navigates, so there is
           * no second destination for it to disagree with.
           */}
          <FirstLightGate />
          {/*
           * `theme="dark"` because there IS only dark (D-THEME-0913-B: one
           * theme, no toggle, no light palette). The primitive passes
           * next-themes' value straight through, which resolves to "system" —
           * so on a machine set to light, sonner picked its LIGHT internal
           * palette and painted a toast description in dark grey on our
           * graphite popover. Measured by this order's axe probe at
           * **1.46:1** (#373839 on #141c23), on the description of the
           * Approve toast — the daily action. Pre-existing, found by looking,
           * and fixed at the call site because `components/ui/` is never
           * hand-edited (CLAUDE.md rule 3).
           */}
          <Toaster theme="dark" position="bottom-right" />
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  )
}
