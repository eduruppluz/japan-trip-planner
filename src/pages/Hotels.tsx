import { useMemo } from 'react'
import { Plus, TriangleAlert } from 'lucide-react'
import type { Draft } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { HotelCard } from '@/components/cards/HotelCard'
import { Timeline } from '@/components/ui/Timeline'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Stat } from '@/components/ui/StatCard'
import { Fab } from '@/components/ui/Fab'
import { PAYMENT_METHOD_SUGGESTIONS, PAYMENT_STATUS_OPTIONS } from '@/data/constants'
import { hotelNights, hotelTotal, nightsWithoutHotel, tripCities, tripInfo } from '@/utils/calc'
import { daysBetween, fmtShort } from '@/utils/dates'
import { money, money0, pct, plural, safeNum } from '@/utils/format'

export default function Hotels() {
  const { data } = useStore()
  const s = data.settings
  const trip = tripInfo(data)
  const gaps = nightsWithoutHotel(data)
  const hotels = useMemo(() => [...data.hotels].sort((a, b) => a.checkIn.localeCompare(b.checkIn)), [data.hotels])
  const totalCost = hotels.reduce((acc, h) => acc + hotelTotal(h), 0)
  const paid = hotels.filter((h) => h.paymentStatus === 'pago').reduce((acc, h) => acc + hotelTotal(h), 0)
  const covered = Math.max(0, trip.nights - gaps.length)

  const editor = useEntityEditor('hotels', {
    noun: 'hospedagem',
    gender: 'f',
    empty: (): Draft<'hotels'> => {
      const lastOut = hotels[hotels.length - 1]?.checkOut
      const start = lastOut && lastOut < s.endDate ? lastOut : s.startDate
      return { name: '', city: '', address: '', checkIn: start, checkOut: '', pricePerNight: 0, bookingCode: '', bookingLink: '', paymentMethod: '', paymentStatus: 'pendente', booked: true, notes: '' }
    },
    addLog: (d) => ({ text: d.booked ? `Reservou hospedagem em ${d.city || d.name}` : `Adicionou opção de hospedagem em ${d.city || d.name}`, kind: 'hotel' }),
    updateLog: (d, prev) => (d.paymentStatus === 'pago' && prev.paymentStatus !== 'pago' ? { text: `Pagou hospedagem ${d.name}`, kind: 'hotel' } : undefined),
  })

  const fields: FieldDef<Draft<'hotels'>>[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true, full: true, placeholder: 'Hotel / Airbnb / Ryokan' },
    { name: 'city', label: 'Cidade', type: 'text', required: true, suggestions: tripCities(data) },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'checkIn', label: 'Check-in', type: 'date', required: true },
    {
      name: 'checkOut',
      label: 'Check-out',
      type: 'date',
      required: true,
      validate: (v, vals) => (v && vals.checkIn && daysBetween(vals.checkIn, String(v)) <= 0 ? 'O check-out deve ser depois do check-in' : undefined),
    },
    {
      name: 'pricePerNight',
      label: 'Valor por noite',
      type: 'money',
      min: 0,
      computed: (v) => {
        const n = v.checkIn && v.checkOut ? Math.max(0, daysBetween(v.checkIn, v.checkOut)) : 0
        return n > 0 ? <span className="tabular">{plural(n, 'noite', 'noites')} × {money(safeNum(v.pricePerNight))} = <strong className="text-ink">{money(n * safeNum(v.pricePerNight))}</strong></span> : 'Informe as datas para calcular o total'
      },
    },
    { name: 'paymentStatus', label: 'Status do pagamento', type: 'select', required: true, options: PAYMENT_STATUS_OPTIONS, hint: 'pago = conta como gasto' },
    { name: 'paymentMethod', label: 'Forma de pagamento', type: 'text', suggestions: PAYMENT_METHOD_SUGGESTIONS },
    { name: 'bookingCode', label: 'Código da reserva', type: 'text', hint: 'fica oculto na tela' },
    { name: 'bookingLink', label: 'Link da reserva', type: 'url', placeholder: 'https://', full: true },
    { name: 'booked', label: 'Reservado', type: 'checkbox', placeholder: 'Já está reservado' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ]

  return (
    <div>
      <PageHeader title="Hospedagem" kanji="宿泊" subtitle="Hotéis, ryokans e Airbnb" action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Adicionar hospedagem</Button>} />

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Custo total" value={money0(totalCost)} hint="entra em Hospedagem" />
          <Stat label="Já pago" value={money0(paid)} tone="success" />
          <Stat label="A pagar" value={money0(totalCost - paid)} tone={totalCost - paid > 0 ? 'warning' : undefined} />
        </div>
        {trip.nights > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted">Noites cobertas</span>
              <span className="tabular font-semibold">{covered} de {trip.nights}</span>
            </div>
            <ProgressBar value={pct(covered, trip.nights)} tone={gaps.length ? 'warning' : 'success'} className="mt-2" label="Noites com hospedagem" />
            {gaps.length > 0 && (
              <p className="mt-3 flex items-start gap-2 text-sm text-warning">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>Sem hospedagem: {gaps.slice(0, 6).map((g) => fmtShort(g)).join(', ')}{gaps.length > 6 ? '…' : ''}</span>
              </p>
            )}
          </div>
        )}
      </Card>

      {hotels.length === 0 ? (
        <EmptyState icon="🏨" title="Nenhuma hospedagem cadastrada ainda." description="Adicione onde vai ficar em cada cidade — o custo entra automaticamente no orçamento." actionLabel="Adicionar hospedagem" onAction={() => editor.openNew()} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {hotels.map((h) => (
              <HotelCard key={h.id} hotel={h} onEdit={() => editor.openEdit(h)} hideSensitive={s.hideSensitive} />
            ))}
          </div>
          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader title="Linha do tempo" />
            <div className="p-5">
              <Timeline
                items={hotels.map((h, i) => ({
                  id: h.id,
                  marker: i + 1,
                  tone: h.booked ? (h.paymentStatus === 'pago' ? 'success' : 'default') : 'accent',
                  title: h.city || h.name,
                  meta: <span className="tabular">{fmtShort(h.checkIn)} → {fmtShort(h.checkOut)} · {plural(hotelNights(h), 'noite', 'noites')}</span>,
                  onClick: () => editor.openEdit(h),
                }))}
              />
            </div>
          </Card>
        </div>
      )}

      <Fab label="Adicionar hospedagem" onClick={() => editor.openNew()} />
      <EntityFormModal {...editor.formProps} fields={fields} />
    </div>
  )
}
