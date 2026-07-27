import { dayFromNow } from '@/data/dates'
import type { CalendarEvent, CalendarSource } from '@/data/types'

export function atlasEventSources(): CalendarSource[] {
  return [
    { id: 'src_jo_holidays', kind: 'holiday', label: 'Jordan public holidays', status: 'active' },
    {
      id: 'src_google_maya',
      kind: 'google',
      label: 'maya@atlasroasters.example',
      status: 'active',
      calendars: [
        { id: 'cal_marketing', name: 'Marketing', enabled: true },
        { id: 'cal_launches', name: 'Product launches', enabled: true },
        { id: 'cal_personal', name: 'Personal', enabled: false },
      ],
    },
  ]
}

export function atlasEvents(): CalendarEvent[] {
  return [
    {
      id: 'ev_tasting',
      sourceId: 'src_google_maya',
      name: 'Summer tasting night',
      date: dayFromNow(1),
    },
    {
      id: 'ev_holiday',
      sourceId: 'src_jo_holidays',
      name: 'National holiday',
      date: dayFromNow(5),
    },
  ]
}
