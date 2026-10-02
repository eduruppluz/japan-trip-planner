import { useMemo, useState } from 'react'
import { CalendarClock, ExternalLink, Plus } from 'lucide-react'
import type { Draft, FoodCategory, Restaurant } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chips, Segmented } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { Fab } from '@/components/ui/Fab'
import { useToast } from '@/components/ui/Toast'
import { FOOD_CATEGORIES, FOOD_CATEGORY_OPTIONS, PRICE_RANGE_OPTIONS } from '@/data/constants'
import { tripCities } from '@/utils/calc'
import { fmtShort } from '@/utils/dates'
import { mapsSearchUrl, norm } from '@/utils/format'
import { cn } from '@/utils/cn'

type Status = 'todos' | 'quero' | 'fui'

export default function Restaurants() {
  const { data, actions } = useStore()
  const toast = useToast()
  const [status, setStatus] = useState<Status>('todos')
  const [cat, setCat] = useState<FoodCategory | 'todas'>('todas')

  const editor = useEntityEditor('restaurants', {
    noun: 'restaurante',
    empty: (): Draft<'restaurants'> => ({ name: '', city: '', area: '', category: cat === 'todas' ? 'ramen' : cat, priceRange: '¥¥', address: '', link: '', rating: 0, reservationDate: '', reservationTime: '', notes: '', visited: false }),
  })
  const fields: FieldDef<Draft<'restaurants'>>[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true, full: true },
    { name: 'city', label: 'Cidade', type: 'text', suggestions: tripCities(data) },
    { name: 'area', label: 'Bairro', type: 'text' },
    { name: 'category', label: 'Tipo de comida', type: 'select', required: true, options: FOOD_CATEGORY_OPTIONS },
    { name: 'priceRange', label: 'Faixa de preço', type: 'select', required: true, options: PRICE_RANGE_OPTIONS },
    { name: 'address', label: 'Endereço', type: 'text', full: true },
    { name: 'link', label: 'Link', type: 'url', full: true, placeholder: 'https://' },
    { name: 'reservationDate', label: 'Data da reserva', type: 'date', hint: 'aparece no calendário' },
    { name: 'reservationTime', label: 'Horário da reserva', type: 'time' },
    { name: 'visited', label: 'Status', type: 'checkbox', placeholder: 'Já fui' },
    { name: 'rating', label: 'Nota pessoal', type: 'rating' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ]

  const list = useMemo(
    () =>
      data.restaurants
        .filter((r) => (status === 'todos' || (status === 'fui' ? r.visited : !r.visited)) && (cat === 'todas' || r.category === cat))
        .sort((a, b) => Number(a.visited) - Number(b.visited) || norm(a.city).localeCompare(norm(b.city)) || a.name.localeCompare(b.name)),
    [data.restaurants, status, cat],
  )
  const visited = data.restaurants.filter((r) => r.visited).length
  const toggle = (r: Restaurant) => {
    actions.update('restaurants', r.id, { visited: !r.visited })
    if (!r.visited) toast(`${r.name}: marcado como “Já fui”`)
  }

  return (
    <div>
      <PageHeader title="Restaurantes" kanji="食事" subtitle={`${visited} de ${data.restaurants.length} visitados`} action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Adicionar restaurante</Button>} />
      {data.restaurants.length > 0 && (
        <div className="mb-5 space-y-3">
          <Segmented value={status} onChange={setStatus} options={[{ value: 'todos', label: 'Todos' }, { value: 'quero', label: 'Quero conhecer' }, { value: 'fui', label: 'Já fui' }]} />
          <Chips value={cat} onChange={setCat} options={[{ value: 'todas' as const, label: 'Todos os tipos' }, ...FOOD_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: `${o.emoji} ${o.label}`, count: data.restaurants.filter((r) => r.category === o.value).length })).filter((o) => o.count)]} />
        </div>
      )}
      {data.restaurants.length === 0 ? (
        <EmptyState icon="🍜" title="Nenhum restaurante ainda" description="Guarde ramens, izakayas e cafés que quer provar." actionLabel="Adicionar restaurante" onAction={() => editor.openNew()} />
      ) : list.length === 0 ? (
        <EmptyState icon="🥢" title="Nenhum restaurante com esse filtro" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const c = FOOD_CATEGORIES[r.category]
            return (
              <Card key={r.id} className={cn('flex flex-col p-4', r.visited && 'opacity-75')}>
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl">{c.emoji}</span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => editor.openEdit(r)}>
                    <p className="truncate text-[15px] font-semibold">{r.name}</p>
                    <p className="truncate text-sm text-muted">{[r.area, r.city].filter(Boolean).join(', ') || 'Local a definir'} · {c.label}</p>
                  </button>
                  <span className="shrink-0 text-sm font-medium text-muted">{r.priceRange}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <button onClick={() => toggle(r)} className={cn('h-8 rounded-full px-3 font-medium transition-colors', r.visited ? 'bg-success/12 text-success' : 'bg-surface-2 text-muted hover:text-ink')}>
                    {r.visited ? '✓ Já fui' : 'Quero conhecer'}
                  </button>
                  {r.rating > 0 && <span className="text-warning">{'★'.repeat(r.rating)}<span className="text-faint">{'★'.repeat(5 - r.rating)}</span></span>}
                  {r.reservationDate && <span className="inline-flex items-center gap-1 text-muted"><CalendarClock size={12} />{fmtShort(r.reservationDate)} {r.reservationTime}</span>}
                  <a href={r.link || mapsSearchUrl(r.name, r.address, r.area, r.city, 'Japão')} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium hover:bg-surface-2">
                    {r.link ? 'Link' : 'Mapa'} <ExternalLink size={12} />
                  </a>
                </div>
                {r.notes && <p className="mt-2 line-clamp-2 text-sm text-muted">{r.notes}</p>}
              </Card>
            )
          })}
        </div>
      )}
      <Fab label="Adicionar restaurante" onClick={() => editor.openNew()} />
      <EntityFormModal {...editor.formProps} fields={fields} />
    </div>
  )
}
