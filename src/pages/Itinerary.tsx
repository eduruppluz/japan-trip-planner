import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, MapPin, Plus } from 'lucide-react'
import type { Activity, Draft, ISODate } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Checkbox, Segmented } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { Calendar } from '@/components/ui/Calendar'
import { Fab } from '@/components/ui/Fab'
import { ACTIVITY_STATUS_OPTIONS } from '@/data/constants'
import { itineraryCostByDate, itineraryTotal, tripCities, tripDayNumber } from '@/utils/calc'
import { buildEvents } from '@/utils/events'
import { dateRange, fmtWeekday, fmtDate, todayISO } from '@/utils/dates'
import { money, money0, norm, plural, mapsSearchUrl } from '@/utils/format'
import { cn } from '@/utils/cn'

type View = 'dia' | 'cidade' | 'calendario'

const byOrder = (a: Activity, b: Activity) => a.order - b.order || (a.time || '99').localeCompare(b.time || '99')

export default function Itinerary() {
  const { data, actions } = useStore()
  const s = data.settings
  const [view, setView] = useState<View>('dia')
  const cities = tripCities(data)
  const costByDate = useMemo(() => itineraryCostByDate(data), [data])
  const total = itineraryTotal(data)

  const editor = useEntityEditor('itinerary', {
    noun: 'atividade',
    gender: 'f',
    empty: (): Draft<'itinerary'> => ({ date: s.startDate, time: '', city: '', area: '', title: '', address: '', notes: '', cost: 0, status: 'planejado', order: 0 }),
    // Posiciona a nova atividade pelo horário dentro do dia
    afterAdd: (id, d) => {
      const day = data.itinerary.filter((a) => a.date === d.date).sort(byOrder)
      let idx = day.length
      if (d.time) {
        const i = day.findIndex((a) => a.time && a.time > d.time)
        if (i !== -1) idx = i
      }
      const ids = day.map((a) => a.id)
      ids.splice(idx, 0, id)
      actions.reorderItinerary(ids)
    },
  })

  const byDate = useMemo(() => {
    const m: Record<ISODate, Activity[]> = {}
    for (const a of data.itinerary) (m[a.date] ??= []).push(a)
    for (const k in m) m[k].sort(byOrder)
    return m
  }, [data.itinerary])

  // Todos os dias da viagem + eventuais datas fora do período
  const days = useMemo(() => {
    const set = new Set(dateRange(s.startDate, s.endDate))
    Object.keys(byDate).forEach((d) => set.add(d))
    return [...set].sort()
  }, [byDate, s.startDate, s.endDate])

  const move = (date: ISODate, id: string, dir: -1 | 1) => {
    const list = byDate[date].map((a) => a.id)
    const i = list.indexOf(id)
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    actions.reorderItinerary(list)
  }
  const sortByTime = (date: ISODate) => {
    const list = [...byDate[date]].sort((a, b) => (a.time || '99').localeCompare(b.time || '99')).map((a) => a.id)
    actions.reorderItinerary(list)
  }

  const fields: FieldDef<Draft<'itinerary'>>[] = [
    { name: 'title', label: 'Atividade', type: 'text', required: true, full: true, placeholder: 'Ex.: Visitar Shibuya' },
    { name: 'date', label: 'Data', type: 'date', required: true, computed: (v) => (v.date ? `Dia ${String(tripDayNumber(s.startDate, v.date)).padStart(2, '0')} da viagem` : '') },
    { name: 'time', label: 'Horário', type: 'time' },
    { name: 'city', label: 'Cidade', type: 'text', suggestions: cities, placeholder: 'Tóquio' },
    { name: 'area', label: 'Bairro / região', type: 'text', placeholder: 'Shibuya' },
    { name: 'address', label: 'Endereço', type: 'text', full: true },
    { name: 'cost', label: 'Custo estimado', type: 'money', min: 0 },
    { name: 'status', label: 'Status', type: 'select', required: true, options: ACTIVITY_STATUS_OPTIONS },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ]

  const toggleDone = (a: Activity, done: boolean) => actions.update('itinerary', a.id, { status: done ? 'concluido' : 'planejado' })

  const renderRow = (a: Activity, list?: Activity[], showDate?: boolean) => {
    const i = list ? list.indexOf(a) : -1
    return (
      <div key={a.id} className={cn('group flex items-start gap-3 px-4 py-3', a.status === 'cancelado' && 'opacity-50')}>
        <Checkbox checked={a.status === 'concluido'} onChange={(d) => toggleDone(a, d)} label={`Marcar ${a.title} como feito`} />
        <button className="min-w-0 flex-1 text-left" onClick={() => editor.openEdit(a)}>
          <span className="flex items-baseline gap-2">
            <span className="tabular w-11 shrink-0 text-sm font-semibold text-muted">{a.time || '--:--'}</span>
            <span className={cn('min-w-0 text-[15px] font-medium', a.status === 'concluido' && 'text-faint line-through', a.status === 'cancelado' && 'line-through')}>{a.title}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-2 pl-13 text-xs text-muted">
            {showDate && <span>{fmtDate(a.date, 'dd/MM')}</span>}
            {(a.area || a.city) && <span>{[a.area, showDate ? a.city : ''].filter(Boolean).join(' · ') || a.city}</span>}
            {a.cost > 0 && <span className="tabular">{money0(a.cost)}</span>}
            {a.status === 'confirmado' && <span className="font-medium text-success">Confirmado</span>}
            {a.status === 'cancelado' && <span>Cancelado</span>}
          </span>
          {a.notes && <span className="mt-1 block truncate pl-13 text-xs text-faint">{a.notes}</span>}
        </button>
        {a.address && (
          <a href={mapsSearchUrl(a.address, a.city)} target="_blank" rel="noopener noreferrer" aria-label="Abrir no mapa" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2">
            <MapPin size={16} />
          </a>
        )}
        {list && list.length > 1 && (
          <div className="-my-1 flex flex-col">
            <IconButton label="Mover para cima" className="h-8 w-8" disabled={i === 0} onClick={() => move(a.date, a.id, -1)} icon={<ArrowUp size={15} />} />
            <IconButton label="Mover para baixo" className="h-8 w-8" disabled={i === list.length - 1} onClick={() => move(a.date, a.id, 1)} icon={<ArrowDown size={15} />} />
          </div>
        )}
      </div>
    )
  }

  const today = todayISO()

  return (
    <div>
      <PageHeader title="Roteiro" kanji="旅程" subtitle={`${plural(data.itinerary.length, 'atividade', 'atividades')} · ${plural(cities.length, 'cidade', 'cidades')}`} action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Nova atividade</Button>} />

      <Card className="mb-5 flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Custo planejado da viagem</p>
          <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{money(total)}</p>
          <p className="text-xs text-muted">Soma automática dos custos das atividades (exceto canceladas)</p>
        </div>
      </Card>

      <Segmented className="mb-5" value={view} onChange={setView} options={[{ value: 'dia', label: 'Por dia' }, { value: 'cidade', label: 'Por cidade' }, { value: 'calendario', label: 'Calendário' }]} />

      {view === 'calendario' && <Calendar events={buildEvents(data, ['atividade', 'voo', 'checkin', 'checkout'])} tripStart={s.startDate} tripEnd={s.endDate} initialMonth={s.startDate} />}

      {view === 'dia' && (
        <div className="space-y-4">
          {days.length === 0 && <EmptyState icon="🗓️" title="Defina as datas da viagem" description="Configure a data de ida e volta para montar o roteiro dia a dia." actionLabel="Adicionar atividade" onAction={() => editor.openNew()} />}
          {days.map((date) => {
            const list = byDate[date] ?? []
            const n = tripDayNumber(s.startDate, date)
            const inTrip = date >= s.startDate && date <= s.endDate
            const dayCities = [...new Set(list.map((a) => a.city).filter(Boolean))]
            const outOfOrder = list.some((a, i) => i > 0 && a.time && list[i - 1].time && a.time < list[i - 1].time)
            return (
              <Card key={date} className={cn('overflow-hidden', date === today && 'ring-2 ring-accent/40')}>
                <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-bg">
                    <div className="text-center leading-none">
                      <p className="text-[9px] font-semibold tracking-wider opacity-70">{inTrip ? 'DIA' : '—'}</p>
                      <p className="tabular text-lg font-semibold">{inTrip ? String(n).padStart(2, '0') : '·'}</p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{fmtWeekday(date)}</p>
                    <p className="truncate text-sm text-muted">{dayCities.join(' → ') || (inTrip ? 'Dia livre' : 'Fora do período da viagem')}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-semibold">{money0(costByDate[date] ?? 0)}</p>
                    <p className="text-[11px] text-muted">estimado</p>
                  </div>
                </div>
                {list.map((a) => renderRow(a, list))}
                <div className="flex items-center gap-1 px-2 py-2">
                  <Button size="sm" variant="ghost" icon={<Plus size={16} />} onClick={() => editor.openNew({ date, city: dayCities[dayCities.length - 1] ?? '' })}>Adicionar</Button>
                  {outOfOrder && <Button size="sm" variant="ghost" icon={<ArrowUpDown size={15} />} onClick={() => sortByTime(date)}>Ordenar por horário</Button>}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {view === 'cidade' && (
        <div className="space-y-4">
          {data.itinerary.length === 0 && <EmptyState icon="🗺️" title="Nenhuma atividade ainda" description="Adicione atividades para ver o roteiro agrupado por cidade." actionLabel="Adicionar atividade" onAction={() => editor.openNew()} />}
          {groupByCity(data.itinerary).map(([city, list]) => {
            const cost = list.filter((a) => a.status !== 'cancelado').reduce((acc, a) => acc + a.cost, 0)
            const dates = [...new Set(list.map((a) => a.date))].sort()
            return (
              <Card key={city} className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                  <div>
                    <p className="text-lg font-semibold tracking-tight">{city}</p>
                    <p className="text-sm text-muted">{plural(dates.length, 'dia', 'dias')} · {plural(list.length, 'atividade', 'atividades')}</p>
                  </div>
                  <Badge tone="neutral"><span className="tabular">{money0(cost)}</span></Badge>
                </div>
                {list.sort((a, b) => a.date.localeCompare(b.date) || byOrder(a, b)).map((a) => renderRow(a, undefined, true))}
              </Card>
            )
          })}
        </div>
      )}

      <Fab label="Nova atividade" onClick={() => editor.openNew()} />
      <EntityFormModal {...editor.formProps} fields={fields} />
    </div>
  )
}

function groupByCity(list: Activity[]): [string, Activity[]][] {
  const m = new Map<string, { name: string; items: Activity[] }>()
  for (const a of list) {
    const k = norm(a.city) || '__sem'
    if (!m.has(k)) m.set(k, { name: a.city.trim() || 'Sem cidade', items: [] })
    m.get(k)!.items.push(a)
  }
  return [...m.values()].map((g) => [g.name, g.items] as [string, Activity[]])
}
