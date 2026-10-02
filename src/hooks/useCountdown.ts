import { combineDateTime } from '@/utils/dates'
import { useNow } from './useNow'

export type TripPhase = 'before' | 'during' | 'after' | 'invalid'

export interface Countdown {
  phase: TripPhase
  days: number
  hours: number
  minutes: number
  seconds: number
  /** Dia atual da viagem quando phase === 'during'. */
  tripDay: number
}

/** Contagem regressiva até a data/horário de ida configurados. */
export function useCountdown(startDate: string, endDate: string, departureTime = '00:00'): Countdown {
  const now = useNow(1000)
  return computeCountdown(now, startDate, endDate, departureTime)
}

export function computeCountdown(now: number, startDate: string, endDate: string, departureTime = '00:00'): Countdown {
  const start = combineDateTime(startDate, departureTime)
  const end = combineDateTime(endDate, '23:59')
  const zero = { days: 0, hours: 0, minutes: 0, seconds: 0, tripDay: 0 }
  if (!start || !end) return { phase: 'invalid', ...zero }
  const diff = start.getTime() - now
  if (diff > 0) {
    const s = Math.floor(diff / 1000)
    return {
      phase: 'before',
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
      tripDay: 0,
    }
  }
  if (now <= end.getTime() + 59_000) {
    const startDay = combineDateTime(startDate)!.getTime()
    return { phase: 'during', ...zero, tripDay: Math.floor((now - startDay) / 86400000) + 1 }
  }
  return { phase: 'after', ...zero }
}
