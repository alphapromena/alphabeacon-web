import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { DataProvider } from '@/data/provider'
import { ThemeProvider } from '@/lib/theme'
import { router } from '@/routes'

export function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </DataProvider>
    </ThemeProvider>
  )
}
