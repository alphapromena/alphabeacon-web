/**
 * C4 for an OCCASION rather than a slot (INT-8).
 *
 * A live-mode holiday has no slot behind it: the org's country loads the
 * calendar, the backend feeds it into scheduling itself, and there is no
 * keep-or-skip on the wire (decisions.md D-INT-F, confirmed by the backend
 * 2026-08-17). So this panel is deliberately read-only — it answers the one
 * question the day actually raises, which is what generation will DO about it.
 *
 * The rules are the point. They come from an external capability and outrank
 * both tone and brand rules on that day, so showing them is not decoration:
 * it is the only place a user can see why a draft on 25 December will read
 * differently. `kind` is `do` or `dont` today, but an unknown kind renders as
 * generic guidance rather than being dropped or guessed into the wrong half —
 * a rule filed under the wrong heading would say the opposite of what it means.
 */
import { CalendarDays, Check, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { CalendarEvent } from '@/data/types'
import { shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'

export function OccasionSheet({
  occasion,
  open,
  onOpenChange,
}: {
  occasion: CalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!occasion) return null

  const dos = occasion.rules?.filter((rule) => rule.kind === 'do') ?? []
  const donts = occasion.rules?.filter((rule) => rule.kind === 'dont') ?? []
  const other = occasion.rules?.filter((rule) => rule.kind !== 'do' && rule.kind !== 'dont') ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{occasion.name}</SheetTitle>
          <SheetDescription>{shortDate(occasion.date)}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <CalendarDays aria-hidden className="size-4 shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground">
              A public holiday in your country. Drafts for this day are written around it
              automatically.
            </span>
          </div>

          {(occasion.rules?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No specific guidance came with this day — drafts follow your usual brand voice and
              tones.
            </p>
          ) : (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">{MESSAGES.notices.holidayGuidance}</h3>

              {dos.length > 0 && (
                <RuleGroup icon={Check} tone="text-success" label="Do" rules={dos} />
              )}
              {donts.length > 0 && (
                <RuleGroup icon={X} tone="text-destructive" label="Don't" rules={donts} />
              )}
              {other.length > 0 && (
                <RuleGroup
                  icon={CalendarDays}
                  tone="text-muted-foreground"
                  label={MESSAGES.notices.holidayGenericRule}
                  rules={other}
                />
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function RuleGroup({
  icon: Icon,
  tone,
  label,
  rules,
}: {
  icon: typeof Check
  tone: string
  label: string
  rules: { kind: string; text: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="flex flex-col gap-1.5">
        {rules.map((rule, index) => (
          <li key={index} className="flex gap-2 text-sm">
            <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${tone}`} />
            <span>{rule.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
