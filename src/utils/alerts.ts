import type { AppData } from '@/types'
import { daysFromToday, fmtDate, fmtShort } from './dates'
import { budgetSummary, nightsWithoutHotel, packingSummary, savingsSummary } from './calc'
import { money0, kg, plural } from './format'
import { BUDGET_CATEGORIES } from '@/data/constants'

export type AlertLevel = 'danger' | 'warning' | 'info'
export interface Alert {
  id: string
  level: AlertLevel
  text: string
  /** Rota (hash) para resolver o alerta. */
  to: string
}

/** Gera os alertas automaticamente a partir do estado atual. */
export function buildAlerts(data: AppData): Alert[] {
  const out: Alert[] = []
  const tripStartIn = daysFromToday(data.settings.startDate)
  const tripOver = (daysFromToday(data.settings.endDate) ?? 0) < 0

  if (tripOver) return out

  // Documentos com validade
  for (const d of data.documents) {
    if (!d.expiryDate) continue
    const n = daysFromToday(d.expiryDate)
    if (n === null) continue
    if (n < 0) out.push({ id: `doc-exp-${d.id}`, level: 'danger', text: `${d.type} vencido desde ${fmtDate(d.expiryDate)}`, to: '/documentos' })
    else if (d.expiryDate <= data.settings.endDate)
      out.push({ id: `doc-trip-${d.id}`, level: 'danger', text: `${d.type} vence antes do fim da viagem (${fmtDate(d.expiryDate)})`, to: '/documentos' })
    else if (n <= 180)
      out.push({ id: `doc-soon-${d.id}`, level: 'warning', text: `${d.type} vence em ${n} dias — confira as exigências de validade`, to: '/documentos' })
  }

  // Voos
  if (!data.flights.some((f) => f.direction === 'ida'))
    out.push({ id: 'no-flight-out', level: 'warning', text: 'Voo de ida ainda não cadastrado', to: '/voos' })
  if (!data.flights.some((f) => f.direction === 'volta'))
    out.push({ id: 'no-flight-back', level: 'warning', text: 'Voo de volta ainda não cadastrado', to: '/voos' })
  const unpaidFlights = data.flights.filter((f) => f.paymentStatus !== 'pago').length
  if (unpaidFlights) out.push({ id: 'flights-unpaid', level: 'info', text: `${plural(unpaidFlights, 'voo', 'voos')} com pagamento pendente`, to: '/voos' })

  // Hospedagem
  const gaps = nightsWithoutHotel(data)
  if (gaps.length) {
    const first = gaps[0]
    out.push({
      id: 'hotel-gaps',
      level: 'warning',
      text: `${plural(gaps.length, 'noite', 'noites')} sem hospedagem (a partir de ${fmtShort(first)})`,
      to: '/hospedagem',
    })
  }
  const notBooked = data.hotels.filter((h) => !h.booked)
  if (notBooked.length)
    out.push({ id: 'hotel-not-booked', level: 'warning', text: `Hotel em ${notBooked[0].city || 'destino'} ainda não reservado${notBooked.length > 1 ? ` (+${notBooked.length - 1})` : ''}`, to: '/hospedagem' })
  const unpaidHotels = data.hotels.filter((h) => h.booked && h.paymentStatus !== 'pago').length
  if (unpaidHotels) out.push({ id: 'hotel-unpaid', level: 'info', text: `${plural(unpaidHotels, 'hospedagem', 'hospedagens')} com pagamento pendente`, to: '/hospedagem' })

  // Meta de dinheiro
  const s = savingsSummary(data)
  if (s.goal > 0 && s.missing > 0)
    out.push({ id: 'savings', level: tripStartIn !== null && tripStartIn < 30 ? 'warning' : 'info', text: `Faltam ${money0(s.missing)} para atingir a meta`, to: '/orcamento?tab=meta' })

  // Orçamento
  const b = budgetSummary(data)
  if (b.overBudget) out.push({ id: 'over-budget', level: 'danger', text: `Gastos passaram o orçamento em ${money0(b.spent - b.total)}`, to: '/orcamento' })
  else if (b.total > 0 && b.planned > b.total)
    out.push({ id: 'over-planned', level: 'warning', text: `Planejado (${money0(b.planned)}) é maior que o orçamento total`, to: '/orcamento?tab=categorias' })
  for (const c of b.overCategories.slice(0, 2))
    out.push({ id: `cat-over-${c.category}`, level: 'warning', text: `${BUDGET_CATEGORIES[c.category].label} acima do planejado`, to: '/orcamento?tab=categorias' })

  // Tarefas
  const pending = data.tasks.filter((t) => !t.done && t.dueDate)
  const overdue = pending.filter((t) => (daysFromToday(t.dueDate) ?? 0) < 0).length
  const week = pending.filter((t) => {
    const n = daysFromToday(t.dueDate)
    return n !== null && n >= 0 && n <= 7
  }).length
  if (overdue) out.push({ id: 'tasks-overdue', level: 'danger', text: `${plural(overdue, 'tarefa atrasada', 'tarefas atrasadas')}`, to: '/checklist' })
  if (week) out.push({ id: 'tasks-week', level: 'warning', text: `${plural(week, 'tarefa vence', 'tarefas vencem')} nos próximos 7 dias`, to: '/checklist' })

  // Mala
  const p = packingSummary(data)
  if (p.over) out.push({ id: 'bag-over', level: 'danger', text: `Mala acima do limite: ${kg(p.totalWeight)} de ${kg(p.limit)}`, to: '/mala' })
  else if (p.limit > 0 && p.weightPct >= 85)
    out.push({ id: 'bag-near', level: 'warning', text: `Mala está com ${kg(p.totalWeight)} de ${kg(p.limit)}`, to: '/mala' })

  const order: Record<AlertLevel, number> = { danger: 0, warning: 1, info: 2 }
  return out.sort((a, b) => order[a.level] - order[b.level])
}
