import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Draft, ShoppingCategory, ShoppingItem, ShoppingStatus } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox, Chips, Segmented } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Stat } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { Fab } from '@/components/ui/Fab'
import { PRIORITY_OPTIONS, PRIORITY_WEIGHT, SHOPPING_CATEGORIES, SHOPPING_CATEGORY_OPTIONS, SHOPPING_STATUS, SHOPPING_STATUS_OPTIONS } from '@/data/constants'
import { shoppingSummary } from '@/utils/calc'
import { money, money0, yen } from '@/utils/format'
import { cn } from '@/utils/cn'

type Filter = 'ativos' | ShoppingStatus | 'todos'

export default function Shopping() {
  const { data, actions } = useStore()
  const rate = data.settings.exchangeRate
  const sum = shoppingSummary(data.shopping)
  const [filter, setFilter] = useState<Filter>('ativos')
  const [cat, setCat] = useState<ShoppingCategory | 'todas'>('todas')

  const editor = useEntityEditor('shopping', {
    noun: 'item',
    empty: (): Draft<'shopping'> => ({ product: '', category: cat === 'todas' ? 'presentes' : cat, estimatedPrice: 0, foundPrice: 0, store: '', priority: 'media', status: 'desejado', notes: '' }),
  })
  const fields: FieldDef<Draft<'shopping'>>[] = [
    { name: 'product', label: 'Produto', type: 'text', required: true, full: true },
    { name: 'category', label: 'Categoria', type: 'select', required: true, options: SHOPPING_CATEGORY_OPTIONS },
    { name: 'priority', label: 'Prioridade', type: 'select', required: true, options: PRIORITY_OPTIONS },
    { name: 'estimatedPrice', label: 'Preço estimado', type: 'money', min: 0 },
    { name: 'foundPrice', label: 'Preço encontrado', type: 'money', min: 0, computed: (v) => (rate > 0 && Number(v.foundPrice) > 0 ? `≈ ${yen(Number(v.foundPrice) * rate)}` : '') },
    { name: 'store', label: 'Loja', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: SHOPPING_STATUS_OPTIONS, hint: 'comprado = conta como gasto' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ]

  const list = useMemo(
    () =>
      data.shopping
        .filter((i) => (filter === 'todos' || (filter === 'ativos' ? i.status !== 'desistido' && i.status !== 'comprado' : i.status === filter)) && (cat === 'todas' || i.category === cat))
        .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || a.product.localeCompare(b.product)),
    [data.shopping, filter, cat],
  )

  const toggleBought = (i: ShoppingItem, bought: boolean) =>
    actions.update('shopping', i.id, { status: bought ? 'comprado' : 'desejado' }, bought ? { text: `Comprou ${i.product}`, kind: 'expense' } : undefined)

  return (
    <div>
      <PageHeader title="Compras" kanji="買物" subtitle="Wishlist da viagem" action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Adicionar item</Button>} />
      <Card className="mb-5 grid grid-cols-3 gap-4 p-5">
        <Stat label="Total estimado" value={money0(sum.estimated)} hint={`${sum.count} itens`} />
        <Stat label="Previsto" value={money0(sum.expected)} hint="com preços encontrados" />
        <Stat label="Comprado" value={money0(sum.bought)} hint={`${sum.boughtCount} itens`} tone="success" />
      </Card>

      {data.shopping.length > 0 && (
        <div className="mb-5 space-y-3">
          <Segmented value={filter} onChange={setFilter} options={[{ value: 'ativos', label: 'A comprar' }, { value: 'comprado', label: 'Comprados' }, { value: 'desistido', label: 'Desisti' }, { value: 'todos', label: 'Todos' }]} />
          <Chips value={cat} onChange={setCat} options={[{ value: 'todas' as const, label: 'Todas' }, ...SHOPPING_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: `${o.emoji} ${o.label}`, count: data.shopping.filter((i) => i.category === o.value).length })).filter((o) => o.count)]} />
        </div>
      )}

      {data.shopping.length === 0 ? (
        <EmptyState icon="🛍️" title="Wishlist vazia" description="Games, figures, cosméticos, presentes… anote o que quer trazer." actionLabel="Adicionar item" onAction={() => editor.openNew()} />
      ) : list.length === 0 ? (
        <EmptyState icon="🎁" title="Nada nesse filtro" />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {list.map((i) => {
            const c = SHOPPING_CATEGORIES[i.category]
            const price = i.foundPrice || i.estimatedPrice
            return (
              <div key={i.id} className={cn('flex items-center gap-3 px-4 py-3', i.status === 'desistido' && 'opacity-50')}>
                <Checkbox checked={i.status === 'comprado'} onChange={(v) => toggleBought(i, v)} label={`Marcar ${i.product} como comprado`} />
                <button className="min-w-0 flex-1 text-left" onClick={() => editor.openEdit(i)}>
                  <span className={cn('block truncate text-[15px] font-medium', i.status === 'comprado' && 'text-faint line-through')}>{i.product}</span>
                  <span className="block truncate text-xs text-muted">{c.emoji} {c.label}{i.store ? ` · ${i.store}` : ''} · {SHOPPING_STATUS[i.status].label}</span>
                </button>
                {i.priority === 'alta' && i.status !== 'comprado' && <Badge tone="accent">Alta</Badge>}
                <span className="text-right">
                  <span className="tabular block text-sm font-semibold">{price ? money(price) : '—'}</span>
                  {i.foundPrice > 0 && i.estimatedPrice > 0 && i.foundPrice !== i.estimatedPrice && <span className="tabular block text-[11px] text-faint line-through">{money0(i.estimatedPrice)}</span>}
                </span>
              </div>
            )
          })}
        </Card>
      )}
      <Fab label="Adicionar item" onClick={() => editor.openNew()} />
      <EntityFormModal {...editor.formProps} fields={fields} />
    </div>
  )
}
