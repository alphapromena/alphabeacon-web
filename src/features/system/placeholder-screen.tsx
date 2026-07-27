import { AppShell } from '@/components/ab/app-shell'

/** Temporary stand-in for screens that arrive in later phases. */
export function PlaceholderScreen({ title, phase }: { title: string; phase: string }) {
  return (
    <AppShell title={title}>
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {title} is built in phase {phase}.
      </div>
    </AppShell>
  )
}
