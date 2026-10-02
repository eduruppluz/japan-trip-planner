import { useMemo, useState } from 'react'
import { useStore } from '@/services/store'
import { PageHeader } from '@/components/ui/PageHeader'
import { Calendar } from '@/components/ui/Calendar'
import { buildEvents, EVENT_KINDS, type EventKind } from '@/utils/events'
import { daysFromToday } from '@/utils/dates'
import { cn } from '@/utils/cn'

const ALL = Object.keys(EVENT_KINDS) as EventKind[]

export default function CalendarPage() {
  const { data } = useStore()
  const [kinds, setKinds] = useState<EventKind[]>(ALL)
  const events = useMemo(() => buildEvents(data, kinds), [data, kinds])
  const s = data.settings
  const toggle = (k: EventKind) => setKinds((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]))
  // Abre no mês da viagem se ela estiver a menos de 45 dias ou em andamento
  const n = daysFromToday(s.startDate)
  const initial = n !== null && n <= 45 && (daysFromToday(s.endDate) ?? -1) >= 0 ? s.startDate : undefined

  return (
    <div>
      <PageHeader title="Calendário" kanji="暦" subtitle="Atividades, voos, hospedagens, reservas e tarefas" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {ALL.map((k) => (
          <button
            key={k}
            onClick={() => toggle(k)}
            aria-pressed={kinds.includes(k)}
            className={cn('inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all', kinds.includes(k) ? 'border-line bg-surface text-ink' : 'border-transparent bg-surface-2 text-faint line-through')}
          >
            <span className={cn('h-2 w-2 rounded-full', EVENT_KINDS[k].dot, !kinds.includes(k) && 'opacity-40')} />
            {EVENT_KINDS[k].label}
          </button>
        ))}
      </div>
      <Calendar events={events} tripStart={s.startDate} tripEnd={s.endDate} initialMonth={initial} />
    </div>
  )
}
