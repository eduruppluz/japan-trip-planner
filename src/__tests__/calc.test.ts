import { describe, expect, it } from 'vitest'
import { createEmptyData, createSampleData } from '@/data/seed'
import { budgetSummary, hotelNights, hotelTotal, nightsWithoutHotel, packingSummary, savingsSummary, taskSummary, tripCities } from '@/utils/calc'
import { tripLengthDays } from '@/utils/dates'
import { computeCountdown } from '@/hooks/useCountdown'
import { normalizeData, validateImport, buildExport } from '@/services/schema'
import { buildAlerts } from '@/utils/alerts'
import type { AppData, Hotel } from '@/types'

const stamp = { id: 'x', createdAt: '', updatedAt: '' }
const hotel = (p: Partial<Hotel>): Hotel => ({ ...stamp, name: 'H', city: 'Tóquio', address: '', checkIn: '2026-11-28', checkOut: '2026-12-02', pricePerNight: 400, bookingCode: '', bookingLink: '', paymentMethod: '', paymentStatus: 'pendente', booked: true, notes: '', ...p })

describe('datas', () => {
  it('conta dias da viagem incluindo ida e volta', () => {
    expect(tripLengthDays('2026-11-28', '2026-12-10')).toBe(13)
  })
  it('contagem regressiva e fases', () => {
    const before = computeCountdown(new Date(2026, 10, 27, 0, 0, 0).getTime(), '2026-11-28', '2026-12-10')
    expect(before).toMatchObject({ phase: 'before', days: 1, hours: 0 })
    expect(computeCountdown(new Date(2026, 10, 30, 12).getTime(), '2026-11-28', '2026-12-10')).toMatchObject({ phase: 'during', tripDay: 3 })
    expect(computeCountdown(new Date(2026, 11, 12).getTime(), '2026-11-28', '2026-12-10').phase).toBe('after')
    expect(computeCountdown(0, '', '').phase).toBe('invalid')
  })
})

describe('hospedagem', () => {
  it('noites × diária', () => {
    const h = hotel({})
    expect(hotelNights(h)).toBe(4)
    expect(hotelTotal(h)).toBe(1600)
    expect(hotelNights(hotel({ checkOut: '2026-11-27' }))).toBe(0)
  })
  it('detecta noites sem hospedagem', () => {
    const d = createEmptyData()
    d.hotels = [hotel({ checkIn: '2026-11-28', checkOut: '2026-12-02' })]
    const gaps = nightsWithoutHotel(d)
    expect(gaps[0]).toBe('2026-12-02')
    expect(gaps.length).toBe(12 - 4)
  })
})

describe('orçamento', () => {
  it('hospedagem entra no planejado (auto) e no gasto só quando paga', () => {
    const d = createEmptyData()
    d.settings.totalBudget = 10000
    d.hotels = [hotel({})]
    let b = budgetSummary(d)
    const cat = () => b.categories.find((c) => c.category === 'hospedagem')!
    expect(cat().planned).toBe(1600)
    expect(cat().spent).toBe(0)
    d.hotels = [hotel({ paymentStatus: 'pago' })]
    b = budgetSummary(d)
    expect(cat().spent).toBe(1600)
    expect(b.available).toBe(8400)
  })
  it('gasto registrado atualiza categoria e restante', () => {
    const d = createEmptyData()
    d.settings.totalBudget = 5000
    d.budgetPlan.alimentacao = { planned: 1000, auto: false }
    d.expenses = [{ ...stamp, date: '2026-11-29', category: 'alimentacao', description: 'Ramen', amount: 1200, paymentMethod: '', notes: '' }]
    const b = budgetSummary(d)
    const c = b.categories.find((x) => x.category === 'alimentacao')!
    expect(c).toMatchObject({ planned: 1000, spent: 1200, remaining: -200 })
    expect(b.overCategories.map((x) => x.category)).toContain('alimentacao')
    expect(b.spent).toBe(1200)
    expect(b.available).toBe(3800)
  })
  it('categoria manual ignora valor automático', () => {
    const d = createEmptyData()
    d.hotels = [hotel({})]
    d.budgetPlan.hospedagem = { planned: 3000, auto: false }
    expect(budgetSummary(d).categories.find((c) => c.category === 'hospedagem')!.planned).toBe(3000)
  })
})

describe('meta, tarefas, mala', () => {
  it('meta de dinheiro', () => {
    const d = createEmptyData()
    d.settings.savingsGoal = 1000
    d.savings = [{ ...stamp, date: '2026-01-01', amount: 500, note: '' }, { ...stamp, id: 'y', date: '2026-02-01', amount: 170, note: '' }]
    expect(savingsSummary(d)).toMatchObject({ saved: 670, missing: 330, pct: 67, reached: false })
  })
  it('progresso das tarefas', () => {
    const d = createSampleData()
    const t = taskSummary(d)
    expect(t.total).toBe(d.tasks.length)
    expect(t.done + t.pending).toBe(t.total)
  })
  it('peso da mala', () => {
    const d = createEmptyData()
    d.settings.baggageLimitKg = 23
    d.packing = [{ ...stamp, name: 'Camiseta', quantity: 5, weightKg: 0.2, category: 'roupas', packed: true }, { ...stamp, id: 'z', name: 'Casaco', quantity: 1, weightKg: 1.2, category: 'frio', packed: false }]
    const p = packingSummary(d)
    expect(p.totalWeight).toBeCloseTo(2.2)
    expect(p.packedWeight).toBeCloseTo(1)
    expect(p.over).toBe(false)
  })
  it('cidades sem duplicatas por acento/caixa', () => {
    const d = createEmptyData()
    d.places = [{ ...stamp, name: 'a', city: 'Tóquio', category: 'cultura', priority: 'imperdivel', address: '', mapsLink: '', cost: 0, duration: '', notes: '', visited: false }]
    d.hotels = [hotel({ city: 'toquio' })]
    expect(tripCities(d)).toEqual(['toquio'])
  })
})

describe('persistência / importação', () => {
  it('normaliza dados incompletos sem quebrar', () => {
    const d = normalizeData({ settings: { tripName: 'X', totalBudget: 'abc' }, tasks: [{ name: 'ok' }, { foo: 1 }], hotels: 'nope' })
    expect(d.settings.tripName).toBe('X')
    expect(d.settings.totalBudget).toBe(15000)
    expect(d.tasks.length).toBe(1)
    expect(d.tasks[0].id).toBeTruthy()
    expect(d.hotels).toEqual([])
    expect(d.info.length).toBeGreaterThan(0)
  })
  it('exporta e importa ida e volta', () => {
    const d = createSampleData()
    const round = validateImport(JSON.parse(JSON.stringify(buildExport(d))))
    expect(round.ok).toBe(true)
    if (round.ok) expect(round.data.tasks.length).toBe(d.tasks.length)
    expect(validateImport({ random: true }).ok).toBe(false)
    expect(validateImport('texto').ok).toBe(false)
  })
  it('gera alertas sem erros em dados vazios e de exemplo', () => {
    const empty: AppData = createEmptyData()
    expect(() => buildAlerts(empty)).not.toThrow()
    const alerts = buildAlerts(createSampleData())
    expect(alerts.some((a) => a.id === 'hotel-gaps' || a.id === 'hotel-not-booked')).toBe(true)
  })
})
