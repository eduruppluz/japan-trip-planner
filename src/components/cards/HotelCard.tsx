import { ExternalLink, MapPin } from 'lucide-react'
import type { Hotel } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PAYMENT_STATUS } from '@/data/constants'
import { hotelNights, hotelTotal } from '@/utils/calc'
import { fmtShort } from '@/utils/dates'
import { mapsSearchUrl, money, money0, plural, maskSensitive } from '@/utils/format'

export function HotelCard({ hotel, onEdit, hideSensitive }: { hotel: Hotel; onEdit: () => void; hideSensitive: boolean }) {
  const nights = hotelNights(hotel)
  const tone = hotel.paymentStatus === 'pago' ? 'success' : hotel.paymentStatus === 'parcial' ? 'info' : 'warning'
  return (
    <Card interactive onClick={onEdit} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">{hotel.city || 'Cidade'}</p>
          <h3 className="mt-0.5 line-clamp-2 text-[17px] leading-snug font-semibold tracking-tight">{hotel.name}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {!hotel.booked && <Badge tone="accent">Não reservado</Badge>}
          <Badge tone={tone}>{PAYMENT_STATUS[hotel.paymentStatus].label}</Badge>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-surface-2 p-3 text-center">
        <div><p className="text-[11px] text-muted uppercase">Check-in</p><p className="tabular text-sm font-semibold">{fmtShort(hotel.checkIn)}</p></div>
        <div><p className="text-[11px] text-muted uppercase">Noites</p><p className="tabular text-sm font-semibold">{nights}</p></div>
        <div><p className="text-[11px] text-muted uppercase">Check-out</p><p className="tabular text-sm font-semibold">{fmtShort(hotel.checkOut)}</p></div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-sm text-muted">
          <p className="tabular">{plural(nights, 'noite', 'noites')} × {money0(hotel.pricePerNight)}</p>
          {hotel.bookingCode && <p className="text-xs">Reserva: {hideSensitive ? maskSensitive(hotel.bookingCode) : hotel.bookingCode}</p>}
        </div>
        <p className="tabular text-xl font-semibold tracking-tight">{money(hotelTotal(hotel))}</p>
      </div>
      {(hotel.address || hotel.bookingLink) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3" onClick={(e) => e.stopPropagation()}>
          {hotel.address && (
            <a href={mapsSearchUrl(hotel.address, hotel.city)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-surface-2">
              <MapPin size={14} /> Endereço
            </a>
          )}
          {hotel.bookingLink && (
            <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-surface-2">
              <ExternalLink size={14} /> Reserva
            </a>
          )}
        </div>
      )}
    </Card>
  )
}
