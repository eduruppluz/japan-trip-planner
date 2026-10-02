import { Plane } from 'lucide-react'
import type { Flight } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FLIGHT_DIRECTIONS, PAYMENT_STATUS } from '@/data/constants'
import { fmtDate, fmtWeekday } from '@/utils/dates'
import { maskSensitive, money } from '@/utils/format'

const flagFor = (city: string, airport: string) => {
  const s = (city + ' ' + airport).toLowerCase()
  if (/(t[oó]quio|tokyo|osaka|kyoto|quioto|nagoya|sapporo|fukuoka|hnd|nrt|kix|itm|ngo|cts|fuk|jap)/.test(s)) return '🇯🇵'
  if (/(s[aã]o paulo|rio|gru|gig|vcp|bras[ií]lia|bsb|cnf|poa|cwb|rec|ssa|for)/.test(s)) return '🇧🇷'
  return '📍'
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-[11px] text-muted uppercase">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

export function FlightCard({ flight, onEdit, hideSensitive }: { flight: Flight; onEdit: () => void; hideSensitive: boolean }) {
  const tone = flight.paymentStatus === 'pago' ? 'success' : flight.paymentStatus === 'parcial' ? 'info' : 'warning'
  return (
    <Card interactive onClick={onEdit} className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
        <span className="text-xs font-semibold tracking-[0.14em] uppercase">{FLIGHT_DIRECTIONS[flight.direction].label}</span>
        <div className="flex gap-1.5">
          <Badge tone={tone}>{PAYMENT_STATUS[flight.paymentStatus].label}</Badge>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-2xl">{flagFor(flight.fromCity, flight.fromAirport)}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{flight.fromAirport || '—'}</p>
            <p className="truncate text-sm text-muted">{flight.fromCity}</p>
            <p className="tabular mt-1 text-sm font-medium">{flight.departureTime || '--:--'}</p>
          </div>
          <div className="flex flex-1 flex-col items-center text-faint">
            <div className="flex w-full items-center gap-1">
              <span className="h-px flex-1 border-t border-dashed border-faint/60" />
              <Plane size={20} className="text-accent" />
              <span className="h-px flex-1 border-t border-dashed border-faint/60" />
            </div>
            {flight.duration && <span className="mt-1 text-xs">{flight.duration}</span>}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-2xl">{flagFor(flight.toCity, flight.toAirport)}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{flight.toAirport || '—'}</p>
            <p className="truncate text-sm text-muted">{flight.toCity}</p>
            <p className="tabular mt-1 text-sm font-medium">{flight.arrivalTime || '--:--'}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          {fmtWeekday(flight.date)}
          {flight.arrivalDate && flight.arrivalDate !== flight.date && <span> → chega {fmtDate(flight.arrivalDate, "EEE, d 'de' MMM")}</span>}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-surface-2 p-3 sm:grid-cols-4">
          <Detail label="Voo" value={[flight.airline, flight.flightNumber].filter(Boolean).join(' · ')} />
          <Detail label="Terminal" value={flight.terminal} />
          <Detail label="Assento" value={flight.seat} />
          <Detail label="Bagagem" value={flight.baggage} />
          <Detail label="Reserva" value={flight.bookingCode ? (hideSensitive ? maskSensitive(flight.bookingCode) : flight.bookingCode) : ''} />
          <Detail label="Valor" value={flight.price ? money(flight.price) : ''} />
        </dl>
        {flight.notes && <p className="mt-3 text-sm text-muted">{flight.notes}</p>}
      </div>
    </Card>
  )
}
