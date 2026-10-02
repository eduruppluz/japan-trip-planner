import { useMemo, useState } from 'react'
import { addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import type { ISODate } from '@/types'
import { EVENT_KINDS, groupByDate, type CalendarEvent } from '@/utils/events'
import { fmtLong, parseISODate, toISODate, todayISO } from '@/utils/dates'
import { cn } from '@/utils/cn'
import { navigate } from '@/hooks/useHashRoute'
import { Button, IconButton } from './Button'
import { Card } from './Card'
import { Modal } from './Modal'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const SECTION_NAME: Record<CalendarEvent['kind'], string> = { atividade: 'roteiro', voo: 'voos', checkin: 'hospedagem', checkout: 'hospedagem', reserva: 'restaurantes', tarefa: 'checklist' }

export function Calendar({ events, tripStart, tripEnd, initialMonth }: { events: CalendarEvent[]; tripStart?: ISODate; tripEnd?: ISODate; initialMonth?: ISODate }) {
  const [month, setMonth] = useState(() => startOfMonth(parseISODate(initialMonth ?? todayISO()) ?? new Date()))
  const [selected, setSelected] = useState<ISODate>(() => initialMonth ?? todayISO())
  const [detail, setDetail] = useState<CalendarEvent | null>(null)
  const byDate = useMemo(() => groupByDate(events), [events])
  const today = todayISO()

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    const out: Date[] = []
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d)
    return out
  }, [month])

  const selectedEvents = byDate[selected] ?? []
  const goTo = (iso: ISODate) => {
    const d = parseISODate(iso)
    if (!d) return
    setMonth(startOfMonth(d))
    setSelected(iso)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-3 sm:p-5">
        <div className="mb-3 flex items-center gap-1">
          <h2 className="flex-1 pl-2 text-lg font-semibold tracking-tight capitalize">{format(month, 'MMMM yyyy', { locale: ptBR })}</h2>
          {tripStart && <Button size="sm" variant="ghost" onClick={() => goTo(tripStart)}>Viagem</Button>}
          <Button size="sm" variant="ghost" onClick={() => goTo(today)}>Hoje</Button>
          <IconButton label="Mês anterior" icon={<ChevronLeft size={20} />} onClick={() => setMonth((m) => addMonths(m, -1))} />
          <IconButton label="Próximo mês" icon={<ChevronRight size={20} />} onClick={() => setMonth((m) => addMonths(m, 1))} />
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-faint">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="pb-2">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const iso = toISODate(d)
            const evs = byDate[iso] ?? []
            const inTrip = tripStart && tripEnd && iso >= tripStart && iso <= tripEnd
            const kinds = [...new Set(evs.map((e) => e.kind))].slice(0, 4)
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                aria-label={`${fmtLong(iso)}${evs.length ? `, ${evs.length} eventos` : ''}`}
                aria-pressed={selected === iso}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-start rounded-xl pt-1.5 text-sm transition-colors sm:aspect-[1.15] sm:pt-2',
                  !isSameMonth(d, month) && 'opacity-35',
                  inTrip && 'bg-sakura/70',
                  selected === iso ? 'bg-ink! text-bg' : 'hover:bg-surface-2',
                )}
              >
                <span className={cn('tabular grid h-6 w-6 place-items-center rounded-full font-medium', iso === today && selected !== iso && 'ring-2 ring-accent text-accent')}>
                  {d.getDate()}
                </span>
                {kinds.length > 0 && (
                  <span className="mt-auto mb-1.5 flex gap-0.5 sm:mb-2">
                    {kinds.map((k) => (
                      <span key={k} className={cn('h-1.5 w-1.5 rounded-full', EVENT_KINDS[k].dot, selected === iso && 'ring-1 ring-bg')} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-muted">
          {Object.entries(EVENT_KINDS).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', v.dot)} />{v.label}</span>
          ))}
          {tripStart && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-sakura" />Dias da viagem</span>}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Dia selecionado</p>
        <h3 className="mt-1 font-semibold">{fmtLong(selected)}</h3>
        <div className="mt-4 space-y-2">
          {selectedEvents.length === 0 && <p className="py-6 text-center text-sm text-muted">Nada marcado para este dia.</p>}
          {selectedEvents.map((e) => (
            <button key={e.id} onClick={() => setDetail(e)} className="flex w-full items-start gap-3 rounded-2xl border border-line p-3 text-left transition-colors hover:bg-surface-2">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', EVENT_KINDS[e.kind].dot)} />
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-[15px] font-medium', e.done && 'text-muted line-through')}>{e.title}</span>
                <span className="text-xs text-muted">{EVENT_KINDS[e.kind].label}{e.time ? ` · ${e.time}` : ''}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ''}
        subtitle={detail ? `${EVENT_KINDS[detail.kind].label} · ${fmtLong(detail.date)}${detail.time ? ' às ' + detail.time : ''}` : ''}
        footer={
          detail && (
            <Button full variant="primary" icon={<ExternalLink size={16} />} onClick={() => navigate(detail.to)}>
              Abrir {SECTION_NAME[detail.kind]}
            </Button>
          )
        }
      >
        {detail && (
          <dl className="space-y-3">
            {detail.details.length === 0 && <p className="text-sm text-muted">Sem detalhes adicionais.</p>}
            {detail.details.map((d) => (
              <div key={d.label}>
                <dt className="text-xs text-muted">{d.label}</dt>
                <dd className="text-[15px] whitespace-pre-line">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  )
}
