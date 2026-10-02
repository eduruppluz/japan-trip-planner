// ============================================================
// Cálculos derivados (funções puras). Nenhum valor derivado é
// salvo — tudo é recalculado a partir dos dados, então qualquer
// alteração se propaga automaticamente por todo o app.
// ============================================================
import type { AppData, BudgetCategory, Flight, Hotel, ISODate, ShoppingItem } from '@/types'
import { BUDGET_CATEGORY_KEYS, AUTO_BUDGET_SOURCES } from '@/data/constants'
import { combineDateTime, daysBetween, dateRange, tripLengthDays } from './dates'
import { norm, pct, safeNum } from './format'

// ---------- Hospedagem ----------
export const hotelNights = (h: Pick<Hotel, 'checkIn' | 'checkOut'>) => Math.max(0, daysBetween(h.checkIn, h.checkOut))
export const hotelTotal = (h: Pick<Hotel, 'checkIn' | 'checkOut' | 'pricePerNight'>) =>
  hotelNights(h) * safeNum(h.pricePerNight)

/** Noites da viagem (start..end-1) sem nenhuma hospedagem cobrindo. */
export function nightsWithoutHotel(data: Pick<AppData, 'hotels' | 'settings'>): ISODate[] {
  const { startDate, endDate } = data.settings
  const nights = dateRange(startDate, endDate).slice(0, -1)
  return nights.filter((n) => !data.hotels.some((h) => h.checkIn <= n && n < h.checkOut))
}

// ---------- Voos ----------
export const flightDeparture = (f: Flight) => combineDateTime(f.date, f.departureTime)
export const flightsTotal = (flights: Flight[]) => flights.reduce((s, f) => s + safeNum(f.price), 0)

// ---------- Compras ----------
export const shoppingValue = (i: ShoppingItem) => safeNum(i.foundPrice) || safeNum(i.estimatedPrice)
export function shoppingSummary(items: ShoppingItem[]) {
  const active = items.filter((i) => i.status !== 'desistido')
  return {
    count: items.length,
    estimated: active.reduce((s, i) => s + safeNum(i.estimatedPrice), 0),
    expected: active.reduce((s, i) => s + shoppingValue(i), 0),
    bought: items.filter((i) => i.status === 'comprado').reduce((s, i) => s + shoppingValue(i), 0),
    boughtCount: items.filter((i) => i.status === 'comprado').length,
  }
}

// ---------- Roteiro ----------
export function itineraryCostByDate(data: Pick<AppData, 'itinerary'>): Record<ISODate, number> {
  const out: Record<ISODate, number> = {}
  for (const a of data.itinerary) {
    if (a.status === 'cancelado') continue
    out[a.date] = (out[a.date] ?? 0) + safeNum(a.cost)
  }
  return out
}
export const itineraryTotal = (data: Pick<AppData, 'itinerary'>) =>
  data.itinerary.filter((a) => a.status !== 'cancelado').reduce((s, a) => s + safeNum(a.cost), 0)

/** Número do dia da viagem (1 = data de ida). */
export const tripDayNumber = (tripStart: ISODate, date: ISODate) => daysBetween(tripStart, date) + 1

// ---------- Orçamento ----------
export interface CategoryBudget {
  category: BudgetCategory
  planned: number
  manual: number
  autoValue: number | null
  auto: boolean
  spent: number
  remaining: number
}

/** Valor calculado automaticamente para as categorias com fonte (ou null). */
export function autoPlannedValue(data: AppData, cat: BudgetCategory): number | null {
  switch (cat) {
    case 'passagens':
      return flightsTotal(data.flights)
    case 'hospedagem':
      return data.hotels.reduce((s, h) => s + hotelTotal(h), 0)
    case 'passeios':
      return itineraryTotal(data)
    case 'compras':
      return shoppingSummary(data.shopping).expected
    default:
      return null
  }
}

/** Gasto automático vindo de voos/hotéis pagos e compras marcadas como compradas. */
function autoSpent(data: AppData, cat: BudgetCategory): number {
  switch (cat) {
    case 'passagens':
      return data.flights.filter((f) => f.paymentStatus === 'pago').reduce((s, f) => s + safeNum(f.price), 0)
    case 'hospedagem':
      return data.hotels.filter((h) => h.paymentStatus === 'pago').reduce((s, h) => s + hotelTotal(h), 0)
    case 'compras':
      return shoppingSummary(data.shopping).bought
    default:
      return 0
  }
}

export function budgetSummary(data: AppData) {
  const categories: CategoryBudget[] = BUDGET_CATEGORY_KEYS.map((category) => {
    const entry = data.budgetPlan[category] ?? { planned: 0, auto: false }
    const autoValue = category in AUTO_BUDGET_SOURCES ? autoPlannedValue(data, category) : null
    const useAuto = entry.auto && autoValue !== null
    const planned = useAuto ? autoValue : safeNum(entry.planned)
    const manualSpent = data.expenses.filter((e) => e.category === category).reduce((s, e) => s + safeNum(e.amount), 0)
    const spent = manualSpent + autoSpent(data, category)
    return { category, planned, manual: safeNum(entry.planned), autoValue, auto: useAuto, spent, remaining: planned - spent }
  })
  const total = safeNum(data.settings.totalBudget)
  const planned = categories.reduce((s, c) => s + c.planned, 0)
  const spent = categories.reduce((s, c) => s + c.spent, 0)
  return {
    categories,
    total,
    planned,
    spent,
    /** Quanto ainda pode gastar dentro do orçamento total. */
    available: total - spent,
    /** Parte do orçamento total ainda não distribuída entre categorias. */
    unallocated: total - planned,
    spentPct: pct(spent, total),
    overBudget: spent > total && total > 0,
    overCategories: categories.filter((c) => c.planned > 0 && c.spent > c.planned),
  }
}

// ---------- Meta de dinheiro ----------
export function savingsSummary(data: Pick<AppData, 'savings' | 'settings'>) {
  const goal = safeNum(data.settings.savingsGoal)
  const saved = data.savings.reduce((s, e) => s + safeNum(e.amount), 0)
  const missing = Math.max(0, goal - saved)
  return { goal, saved, missing, pct: Math.min(100, pct(saved, goal)), reached: goal > 0 && saved >= goal }
}

// ---------- Tarefas ----------
export function taskSummary(data: Pick<AppData, 'tasks'>) {
  const total = data.tasks.length
  const done = data.tasks.filter((t) => t.done).length
  return { total, done, pending: total - done, pct: pct(done, total) }
}

// ---------- Mala ----------
export function packingSummary(data: Pick<AppData, 'packing' | 'settings'>) {
  const weight = (list: AppData['packing']) =>
    list.reduce((s, i) => s + safeNum(i.weightKg) * Math.max(0, safeNum(i.quantity)), 0)
  const totalWeight = weight(data.packing)
  const packedWeight = weight(data.packing.filter((i) => i.packed))
  const limit = safeNum(data.settings.baggageLimitKg)
  return {
    count: data.packing.length,
    packed: data.packing.filter((i) => i.packed).length,
    totalWeight,
    packedWeight,
    limit,
    weightPct: pct(totalWeight, limit),
    over: limit > 0 && totalWeight > limit,
  }
}

// ---------- Lugares / cidades ----------
export function placesSummary(data: Pick<AppData, 'places'>) {
  const total = data.places.length
  const visited = data.places.filter((p) => p.visited).length
  return { total, visited, pct: pct(visited, total) }
}

/** Cidades do roteiro/hospedagens/lugares, sem duplicatas (ignora acentos/maiúsculas). */
export function tripCities(data: Pick<AppData, 'itinerary' | 'hotels' | 'places'>): string[] {
  const seen = new Map<string, string>()
  const add = (c: string) => {
    const k = norm(c)
    if (k && !seen.has(k)) seen.set(k, c.trim())
  }
  data.itinerary.forEach((a) => add(a.city))
  data.hotels.forEach((h) => add(h.city))
  data.places.forEach((p) => add(p.city))
  return [...seen.values()]
}

export function tripInfo(data: Pick<AppData, 'settings'>) {
  const { startDate, endDate } = data.settings
  return { days: tripLengthDays(startDate, endDate), nights: Math.max(0, daysBetween(startDate, endDate)) }
}

// ---------- Mensagem dinâmica ----------
export function readinessMessage(p: number, form: AppData['settings']['addressForm']): string {
  const word = form === 'preparado' ? 'preparado' : form === 'neutro' ? 'pronto(a)' : 'preparada'
  if (p >= 100) return `Tudo pronto! Você está 100% ${word} para o Japão. 🎌`
  if (p >= 80) return `Reta final: você está ${p}% ${word} para a viagem.`
  if (p >= 50) return `Bom ritmo — você está ${p}% ${word} para a viagem.`
  if (p > 0) return `Você está ${p}% ${word}. Cada tarefa concluída te aproxima do Japão.`
  return 'Comece concluindo sua primeira tarefa do checklist.'
}
