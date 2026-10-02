import { Plane, Plus } from 'lucide-react'
import type { Draft, FlightDirection } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { FlightCard } from '@/components/cards/FlightCard'
import { Fab } from '@/components/ui/Fab'
import { FLIGHT_DIRECTIONS, FLIGHT_DIRECTION_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/data/constants'
import { flightsTotal } from '@/utils/calc'
import { fmtShort } from '@/utils/dates'
import { money } from '@/utils/format'

export default function Flights() {
  const { data } = useStore()
  const s = data.settings
  const editor = useEntityEditor('flights', {
    noun: 'voo',
    empty: (): Draft<'flights'> => ({
      direction: 'ida', airline: '', flightNumber: '', fromAirport: '', fromCity: '', toAirport: '', toCity: '',
      date: s.startDate, departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', terminal: '', bookingCode: '',
      seat: '', baggage: '', price: 0, paymentStatus: 'pendente', notes: '',
    }),
    addLog: (d) => ({ text: `Adicionou ${FLIGHT_DIRECTIONS[d.direction].label.toLowerCase()} (${d.fromAirport || d.fromCity} → ${d.toAirport || d.toCity})`, kind: 'flight' }),
  })

  const up = (v: unknown) => String(v ?? '').toUpperCase()
  const fields: FieldDef<Draft<'flights'>>[] = [
    { name: 'direction', label: 'Tipo', type: 'select', required: true, options: FLIGHT_DIRECTION_OPTIONS },
    { name: 'airline', label: 'Companhia aérea', type: 'text' },
    { name: 'flightNumber', label: 'Número do voo', type: 'text', placeholder: 'Ex.: XX 1234' },
    { name: 'fromAirport', label: 'Aeroporto de saída', type: 'text', placeholder: 'GRU', required: true, validate: (v) => (up(v).length > 40 ? 'Muito longo' : undefined) },
    { name: 'fromCity', label: 'Cidade de saída', type: 'text', placeholder: 'São Paulo' },
    { name: 'toAirport', label: 'Aeroporto de chegada', type: 'text', placeholder: 'HND / NRT', required: true },
    { name: 'toCity', label: 'Cidade de chegada', type: 'text', placeholder: 'Tóquio' },
    { name: 'date', label: 'Data de saída', type: 'date', required: true },
    { name: 'departureTime', label: 'Horário de saída', type: 'time' },
    { name: 'arrivalDate', label: 'Data de chegada', type: 'date', validate: (v, vals) => (v && vals.date && String(v) < vals.date ? 'A chegada não pode ser antes da saída' : undefined) },
    { name: 'arrivalTime', label: 'Horário de chegada', type: 'time' },
    { name: 'duration', label: 'Duração', type: 'text', placeholder: 'Ex.: 24h30 (com conexão)' },
    { name: 'terminal', label: 'Terminal', type: 'text' },
    { name: 'bookingCode', label: 'Código da reserva', type: 'text', hint: 'fica oculto na tela' },
    { name: 'seat', label: 'Assento', type: 'text' },
    { name: 'baggage', label: 'Bagagem', type: 'text', placeholder: 'Ex.: 2 × 23 kg' },
    { name: 'price', label: 'Valor', type: 'money', min: 0, hint: 'entra em Passagens' },
    { name: 'paymentStatus', label: 'Pagamento', type: 'select', required: true, options: PAYMENT_STATUS_OPTIONS, hint: 'pago = conta como gasto' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ]

  const sections: FlightDirection[] = ['ida', 'volta', 'interno']
  const out = data.flights.filter((f) => f.direction === 'ida').sort((a, b) => a.date.localeCompare(b.date))
  const back = data.flights.filter((f) => f.direction === 'volta').sort((a, b) => a.date.localeCompare(b.date))
  const origin = out[0]?.fromCity || out[0]?.fromAirport || 'Brasil'
  const dest = out[out.length - 1]?.toCity || out[out.length - 1]?.toAirport || 'Japão'

  return (
    <div>
      <PageHeader title="Voos" kanji="航空" subtitle={data.flights.length ? `${data.flights.length} voo(s) · ${money(flightsTotal(data.flights))}` : 'Ida, volta e voos internos'} action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Adicionar voo</Button>} />

      <Card className="mb-6 p-6">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Rota da viagem</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="h-3 w-3 rounded-full border-2 border-ink" />
            <span className="h-10 w-px bg-line" />
            <Plane size={18} className="rotate-90 text-accent" />
            <span className="h-10 w-px bg-line" />
            <span className="h-3 w-3 rounded-full bg-accent" />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-12">
            <div>
              <p className="text-lg font-semibold">🇧🇷 {origin}</p>
              <p className="text-sm text-muted">{out[0] ? `Partida ${fmtShort(out[0].date)} ${out[0].departureTime}` : `Partida prevista ${fmtShort(s.startDate)}`}</p>
            </div>
            <div>
              <p className="text-lg font-semibold">🇯🇵 {dest}</p>
              <p className="text-sm text-muted">{back[0] ? `Volta ${fmtShort(back[0].date)} ${back[0].departureTime}` : `Retorno previsto ${fmtShort(s.endDate)}`}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-8">
        {sections.map((dir) => {
          const list = data.flights.filter((f) => f.direction === dir).sort((a, b) => (a.date + a.departureTime).localeCompare(b.date + b.departureTime))
          if (dir === 'interno' && list.length === 0) return null
          return (
            <section key={dir}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-[0.14em] uppercase">{FLIGHT_DIRECTIONS[dir].label}</h2>
                {list.length > 0 && <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => editor.openNew({ direction: dir })}>Adicionar</Button>}
              </div>
              {list.length === 0 ? (
                <EmptyState
                  icon="✈️"
                  title={`Nenhum ${FLIGHT_DIRECTIONS[dir].label.toLowerCase()} cadastrado ainda.`}
                  description="Adicione seu voo para começar a organizar sua viagem."
                  actionLabel={`Adicionar ${FLIGHT_DIRECTIONS[dir].label.toLowerCase()}`}
                  onAction={() =>
                    editor.openNew(
                      dir === 'volta'
                        ? { direction: 'volta', date: s.endDate, fromCity: dest !== 'Japão' ? dest : '', fromAirport: out[out.length - 1]?.toAirport ?? '', toCity: out[0]?.fromCity ?? '', toAirport: out[0]?.fromAirport ?? '' }
                        : { direction: dir },
                    )
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {list.map((f) => (
                    <FlightCard key={f.id} flight={f} onEdit={() => editor.openEdit(f)} hideSensitive={s.hideSensitive} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <Fab label="Adicionar voo" onClick={() => editor.openNew()} />
      <EntityFormModal
        {...editor.formProps}
        fields={fields}
        onSubmit={(v) => editor.formProps.onSubmit({ ...v, fromAirport: v.fromAirport.toUpperCase(), toAirport: v.toAirport.toUpperCase() })}
      />
    </div>
  )
}
