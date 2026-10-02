import type { AppData, ISODate } from '@/types'
import { fmtDate } from './dates'
import { money } from './format'

export type EventKind = 'atividade' | 'voo' | 'checkin' | 'checkout' | 'reserva' | 'tarefa'

export interface CalendarEvent {
  id: string
  date: ISODate
  time?: string
  kind: EventKind
  title: string
  details: { label: string; value: string }[]
  to: string
  done?: boolean
}

export const EVENT_KINDS: Record<EventKind, { label: string; dot: string; chip: string }> = {
  atividade: { label: 'Atividade', dot: 'bg-info', chip: 'bg-info/12 text-info' },
  voo: { label: 'Voo', dot: 'bg-accent', chip: 'bg-accent/10 text-accent' },
  checkin: { label: 'Check-in', dot: 'bg-success', chip: 'bg-success/12 text-success' },
  checkout: { label: 'Check-out', dot: 'bg-muted', chip: 'bg-surface-2 text-muted' },
  reserva: { label: 'Reserva', dot: 'bg-sakura-ink', chip: 'bg-sakura text-sakura-ink' },
  tarefa: { label: 'Tarefa', dot: 'bg-warning', chip: 'bg-warning/12 text-warning' },
}

const d = (label: string, value: string | undefined | null) => (value ? [{ label, value }] : [])

/** Reúne todos os eventos com data de todas as coleções. */
export function buildEvents(data: AppData, kinds?: EventKind[]): CalendarEvent[] {
  const out: CalendarEvent[] = []
  const want = (k: EventKind) => !kinds || kinds.includes(k)

  if (want('atividade'))
    for (const a of data.itinerary) {
      if (!a.date) continue
      out.push({
        id: 'a-' + a.id, date: a.date, time: a.time, kind: 'atividade', title: a.title, to: '/roteiro',
        done: a.status === 'concluido',
        details: [...d('Cidade', [a.city, a.area].filter(Boolean).join(' · ')), ...d('Endereço', a.address), ...d('Custo estimado', a.cost ? money(a.cost) : ''), ...d('Observações', a.notes)],
      })
    }
  if (want('voo'))
    for (const f of data.flights) {
      if (!f.date) continue
      out.push({
        id: 'f-' + f.id, date: f.date, time: f.departureTime, kind: 'voo', to: '/voos',
        title: `Voo ${f.fromAirport || f.fromCity} → ${f.toAirport || f.toCity}`,
        details: [...d('Companhia', [f.airline, f.flightNumber].filter(Boolean).join(' · ')), ...d('Chegada', f.arrivalDate ? `${fmtDate(f.arrivalDate)} ${f.arrivalTime}` : f.arrivalTime), ...d('Terminal', f.terminal), ...d('Assento', f.seat)],
      })
    }
  for (const h of data.hotels) {
    if (want('checkin') && h.checkIn)
      out.push({ id: 'ci-' + h.id, date: h.checkIn, kind: 'checkin', title: `Check-in · ${h.name}`, to: '/hospedagem', details: [...d('Cidade', h.city), ...d('Endereço', h.address), ...d('Check-out', fmtDate(h.checkOut))] })
    if (want('checkout') && h.checkOut)
      out.push({ id: 'co-' + h.id, date: h.checkOut, kind: 'checkout', title: `Check-out · ${h.name}`, to: '/hospedagem', details: [...d('Cidade', h.city)] })
  }
  if (want('reserva'))
    for (const r of data.restaurants) {
      if (!r.reservationDate) continue
      out.push({ id: 'r-' + r.id, date: r.reservationDate, time: r.reservationTime, kind: 'reserva', title: `Reserva · ${r.name}`, to: '/restaurantes', done: r.visited, details: [...d('Local', [r.city, r.area].filter(Boolean).join(' · ')), ...d('Endereço', r.address)] })
    }
  if (want('tarefa'))
    for (const t of data.tasks) {
      if (!t.dueDate) continue
      out.push({ id: 't-' + t.id, date: t.dueDate, kind: 'tarefa', title: t.name, to: '/checklist', done: t.done, details: [...d('Status', t.done ? 'Concluída' : 'Pendente'), ...d('Observações', t.notes)] })
    }

  return out.sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')))
}

export function groupByDate<T extends { date: ISODate }>(list: T[]): Record<ISODate, T[]> {
  const out: Record<ISODate, T[]> = {}
  for (const e of list) (out[e.date] ??= []).push(e)
  return out
}
