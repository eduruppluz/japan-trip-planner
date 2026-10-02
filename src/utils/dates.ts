import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parse,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ISODate, Time } from '@/types'

const ISO = 'yyyy-MM-dd'

/** Converte "YYYY-MM-DD" em Date local (meia-noite). Retorna null se inválida. */
export function parseISODate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = parse(value, ISO, new Date())
  return isValid(d) ? d : null
}

export function toISODate(date: Date): ISODate {
  return format(date, ISO)
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

/** Combina data + horário em um Date local. */
export function combineDateTime(date: ISODate, time?: Time): Date | null {
  const d = parseISODate(date)
  if (!d) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? '')
  if (m) d.setHours(Number(m[1]), Number(m[2]), 0, 0)
  return d
}

export function fmtDate(value: string | null | undefined, pattern = 'dd/MM/yyyy'): string {
  const d = parseISODate(value)
  return d ? format(d, pattern, { locale: ptBR }) : '—'
}

/** "28 nov" */
export const fmtShort = (v: string | null | undefined) => fmtDate(v, "d MMM")
/** "sáb, 28 nov" */
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const fmtWeekday = (v: string | null | undefined) => capFirst(fmtDate(v, "EEEE, d 'de' MMM"))
/** "sábado, 28 de novembro de 2026" */
export const fmtLong = (v: string | null | undefined) => capFirst(fmtDate(v, "EEEE, d 'de' MMMM 'de' yyyy"))

export function daysBetween(from: ISODate, to: ISODate): number {
  const a = parseISODate(from)
  const b = parseISODate(to)
  if (!a || !b) return 0
  return differenceInCalendarDays(b, a)
}

/** Dias corridos incluindo o primeiro e o último (28/11 → 10/12 = 13 dias). */
export function tripLengthDays(start: ISODate, end: ISODate): number {
  const n = daysBetween(start, end)
  return n >= 0 ? n + 1 : 0
}

/** Diferença em dias entre hoje e a data (negativo = passado). */
export function daysFromToday(date: ISODate): number | null {
  const d = parseISODate(date)
  if (!d) return null
  return differenceInCalendarDays(d, startOfDay(new Date()))
}

/** Lista de datas ISO entre start e end (inclusive). Limite de segurança de 120 dias. */
export function dateRange(start: ISODate, end: ISODate): ISODate[] {
  const a = parseISODate(start)
  const b = parseISODate(end)
  if (!a || !b || b < a) return []
  const out: ISODate[] = []
  for (let d = a, i = 0; d <= b && i < 120; d = addDays(d, 1), i++) out.push(toISODate(d))
  return out
}

/** "Hoje", "Amanhã", "Em 3 dias", "Ontem", "Há 2 dias" */
export function relativeDayLabel(date: ISODate): string {
  const n = daysFromToday(date)
  if (n === null) return 'Sem prazo'
  if (n === 0) return 'Hoje'
  if (n === 1) return 'Amanhã'
  if (n === -1) return 'Ontem'
  if (n > 1) return `Em ${n} dias`
  return `Atrasada há ${Math.abs(n)} dias`
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.max(0, Date.now() - then)
  const min = Math.round(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `há ${d} d`
  return format(new Date(iso), 'dd/MM/yyyy')
}
