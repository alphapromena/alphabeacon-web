import { RouterProvider } from 'react-router'
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
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  )
}
