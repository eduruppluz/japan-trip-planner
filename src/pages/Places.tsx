import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Draft, Place, PlaceCategory, PlacePriority } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chips, Input, Segmented, Select } from '@/components/ui/Field'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { PlaceCard } from '@/components/cards/PlaceCard'
import { Fab } from '@/components/ui/Fab'
import { useToast } from '@/components/ui/Toast'
import { PLACE_CATEGORY_OPTIONS, PLACE_PRIORITY_OPTIONS, PLACE_PRIORITY_WEIGHT } from '@/data/constants'
import { placesSummary, tripCities } from '@/utils/calc'
import { norm } from '@/utils/format'

type Status = 'todos' | 'pendentes' | 'conhecidos'

export default function Places() {
  const { data, actions } = useStore()
  const toast = useToast()
  const summary = placesSummary(data)
  const [city, setCity] = useState('todas')
  const [category, setCategory] = useState<PlaceCategory | ''>('')
  const [priority, setPriority] = useState<PlacePriority | ''>('')
  const [status, setStatus] = useState<Status>('todos')
  const [q, setQ] = useState('')

  const cities = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>()
    data.places.forEach((p) => {
      const k = norm(p.city) || '—'
      const e = m.get(k) ?? { name: p.city.trim() || 'Sem cidade', count: 0 }
      e.count++
      m.set(k, e)
    })
    return [...m.entries()]
  }, [data.places])

  const editor = useEntityEditor('places', {
    noun: 'lugar',
    empty: (): Draft<'places'> => ({ name: '', city: city !== 'todas' ? (cities.find(([k]) => k === city)?.[1].name ?? '') : '', category: category || 'cultura', priority: 'quero-muito', address: '', mapsLink: '', cost: 0, duration: '', notes: '', visited: false }),
    addLog: (d) => ({ text: `Adicionou “${d.name}” aos lugares`, kind: 'place' }),
  })

  const fields: FieldDef<Draft<'places'>>[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true, full: true, placeholder: 'Ex.: Templo Kiyomizu-dera' },
    { name: 'city', label: 'Cidade', type: 'text', suggestions: tripCities(data) },
    { name: 'category', label: 'Categoria', type: 'select', required: true, options: PLACE_CATEGORY_OPTIONS },
    { name: 'priority', label: 'Prioridade', type: 'select', required: true, options: PLACE_PRIORITY_OPTIONS },
    { name: 'duration', label: 'Tempo estimado', type: 'text', placeholder: 'Ex.: 2h' },
    { name: 'address', label: 'Endereço', type: 'text', full: true },
    { name: 'mapsLink', label: 'Link do Google Maps', type: 'url', full: true, placeholder: 'https://maps.app.goo.gl/…', hint: 'opcional — sem link, buscamos pelo nome' },
    { name: 'cost', label: 'Custo estimado', type: 'money', min: 0 },
    { name: 'visited', label: 'Conhecido', type: 'checkbox', placeholder: 'Já conheci' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ]

  const filtered = useMemo(() => {
    const nq = norm(q)
    return data.places
      .filter((p) => (city === 'todas' || (norm(p.city) || '—') === city) && (!category || p.category === category) && (!priority || p.priority === priority) && (status === 'todos' || (status === 'conhecidos' ? p.visited : !p.visited)) && (!nq || norm(`${p.name} ${p.address} ${p.notes}`).includes(nq)))
      .sort((a, b) => Number(a.visited) - Number(b.visited) || PLACE_PRIORITY_WEIGHT[a.priority] - PLACE_PRIORITY_WEIGHT[b.priority] || a.name.localeCompare(b.name))
  }, [data.places, city, category, priority, status, q])

  const toggle = (p: Place, visited: boolean) => {
    actions.update('places', p.id, { visited }, visited ? { text: `Conheceu ${p.name}`, kind: 'place' } : undefined)
    if (visited) toast(`${p.name} marcado como conhecido`)
  }

  return (
    <div>
      <PageHeader title="Lugares que quero conhecer" kanji="名所" subtitle="Sua lista de desejos no Japão" action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Adicionar lugar</Button>} />

      <Card className="mb-5 p-5">
        <div className="flex items-baseline justify-between">
          <p className="tabular text-[15px] font-medium"><span className="text-2xl font-semibold">{summary.visited}</span> de {summary.total} lugares visitados</p>
          <p className="tabular text-sm text-muted">{summary.pct}%</p>
        </div>
        <ProgressBar value={summary.pct} tone="accent" className="mt-3" label="Lugares visitados" />
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          {PLACE_PRIORITY_OPTIONS.map((o) => (
            <span key={o.value} className="rounded-full bg-surface-2 px-2.5 py-1">{o.emoji} {o.label}: <span className="tabular font-semibold text-ink">{data.places.filter((p) => p.priority === o.value && !p.visited).length}</span></span>
          ))}
        </div>
      </Card>

      {data.places.length > 0 && (
        <div className="mb-5 space-y-3">
          <Chips value={city} onChange={setCity} options={[{ value: 'todas', label: 'Todas as cidades', count: data.places.length }, ...cities.map(([k, v]) => ({ value: k, label: v.name, count: v.count }))]} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="relative col-span-2">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar lugar" className="pl-10" aria-label="Buscar lugar" />
            </div>
            <Select aria-label="Categoria" value={category} onChange={(e) => setCategory(e.target.value as PlaceCategory | '')} options={PLACE_CATEGORY_OPTIONS} placeholder="Todas categorias" />
            <Select aria-label="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value as PlacePriority | '')} options={PLACE_PRIORITY_OPTIONS} placeholder="Toda prioridade" />
          </div>
          <Segmented size="sm" value={status} onChange={setStatus} options={[{ value: 'todos', label: 'Todos' }, { value: 'pendentes', label: 'Quero conhecer' }, { value: 'conhecidos', label: 'Conhecidos' }]} />
        </div>
      )}

      {data.places.length === 0 ? (
        <EmptyState icon="⛩️" title="Nenhum lugar na lista ainda" description="Templos, bairros, museus, lojas de anime… adicione tudo o que quer ver." actionLabel="Adicionar lugar" onAction={() => editor.openNew()} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔎" title="Nenhum lugar com esses filtros" description="Ajuste a busca ou os filtros." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <PlaceCard key={p.id} place={p} onToggle={(v) => toggle(p, v)} onEdit={() => editor.openEdit(p)} />
          ))}
        </div>
      )}

      <Fab label="Adicionar lugar" onClick={() => editor.openNew()} />
      <EntityFormModal {...editor.formProps} fields={fields} />
    </div>
  )
}
