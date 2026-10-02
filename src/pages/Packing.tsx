import { useMemo, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import type { Draft, PackingItem } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Segmented } from '@/components/ui/Field'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { Modal } from '@/components/ui/Modal'
import { Fab } from '@/components/ui/Fab'
import { useToast } from '@/components/ui/Toast'
import { PACKING_CATEGORY_OPTIONS } from '@/data/constants'
import { packingSummary } from '@/utils/calc'
import { kg, pct, safeNum } from '@/utils/format'
import { cn } from '@/utils/cn'

type Filter = 'todos' | 'faltam' | 'na-mala'

export default function Packing() {
  const { data, actions } = useStore()
  const toast = useToast()
  const p = packingSummary(data)
  const [filter, setFilter] = useState<Filter>('todos')
  const [limitOpen, setLimitOpen] = useState(false)
  const [limit, setLimit] = useState('')

  const editor = useEntityEditor('packing', {
    noun: 'item',
    empty: (): Draft<'packing'> => ({ name: '', quantity: 1, weightKg: 0, category: 'roupas', packed: false }),
  })
  const fields: FieldDef<Draft<'packing'>>[] = [
    { name: 'name', label: 'Item', type: 'text', required: true, full: true, placeholder: 'Ex.: Camisetas' },
    { name: 'quantity', label: 'Quantidade', type: 'number', required: true, min: 1, max: 99, step: 1, validate: (v) => (!Number.isInteger(Number(v)) ? 'Use um número inteiro' : undefined) },
    { name: 'weightKg', label: 'Peso por unidade (kg)', type: 'number', min: 0, max: 40, step: 0.05, placeholder: '0,2', computed: (v) => `Total: ${kg(safeNum(v.weightKg) * safeNum(v.quantity))}` },
    { name: 'category', label: 'Categoria', type: 'select', required: true, options: PACKING_CATEGORY_OPTIONS },
    { name: 'packed', label: 'Na mala', type: 'checkbox', placeholder: 'Já está na mala' },
  ]

  const groups = useMemo(
    () =>
      PACKING_CATEGORY_OPTIONS.map((o) => ({
        ...o,
        items: data.packing.filter((i) => i.category === o.value && (filter === 'todos' || (filter === 'faltam' ? !i.packed : i.packed))).sort((a, b) => Number(a.packed) - Number(b.packed) || a.name.localeCompare(b.name)),
        total: data.packing.filter((i) => i.category === o.value).length,
      })).filter((g) => g.items.length),
    [data.packing, filter],
  )

  const toggle = (i: PackingItem, packed: boolean) => actions.update('packing', i.id, { packed })
  const tone = p.over ? 'accent' : p.weightPct >= 85 ? 'warning' : 'ink'

  return (
    <div>
      <PageHeader title="Mala" kanji="荷物" subtitle={`${p.packed} de ${p.count} itens na mala`} action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Adicionar item</Button>} />

      <Card className="mb-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Peso estimado da mala</p>
            <p className="tabular mt-1 text-[28px] font-semibold tracking-tight">
              <span className={cn(p.over && 'text-accent')}>{kg(p.totalWeight)}</span>
              <span className="text-lg font-normal text-muted"> / {kg(p.limit)}</span>
            </p>
          </div>
          <Button size="sm" icon={<Pencil size={14} />} onClick={() => (setLimit(String(p.limit)), setLimitOpen(true))}>Limite</Button>
        </div>
        <ProgressBar value={p.weightPct} tone={tone} size="lg" className="mt-3" label="Peso da mala sobre o limite" />
        <p className="mt-2 text-sm text-muted">
          {p.over ? `Passou ${kg(p.totalWeight - p.limit)} do limite.` : `Sobram ${kg(Math.max(0, p.limit - p.totalWeight))} — espaço para compras no Japão!`}
          <span className="ml-1 text-faint">(já na mala: {kg(p.packedWeight)})</span>
        </p>
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex justify-between text-sm"><span className="text-muted">Itens arrumados</span><span className="tabular font-semibold">{p.packed}/{p.count}</span></div>
          <ProgressBar value={pct(p.packed, p.count)} tone="success" size="sm" className="mt-2" />
        </div>
      </Card>

      {data.packing.length > 0 && <Segmented className="mb-4" value={filter} onChange={setFilter} options={[{ value: 'todos', label: 'Todos' }, { value: 'faltam', label: `Faltam ${p.count - p.packed}` }, { value: 'na-mala', label: `Na mala ${p.packed}` }]} />}

      {data.packing.length === 0 ? (
        <EmptyState icon="🧳" title="Mala vazia" description="Liste roupas, eletrônicos e documentos para calcular o peso automaticamente." actionLabel="Adicionar item" onAction={() => editor.openNew()} />
      ) : groups.length === 0 ? (
        <EmptyState icon="✅" title={filter === 'faltam' ? 'Tudo na mala!' : 'Nada por aqui'} description="Troque o filtro para ver os outros itens." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.value} className="h-fit overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-semibold">{g.emoji}  {g.label}</p>
                <button className="text-xs font-medium text-muted hover:text-ink" onClick={() => editor.openNew({ category: g.value })}>+ item</button>
              </div>
              <div className="divide-y divide-line">
                {g.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Checkbox checked={i.packed} onChange={(v) => toggle(i, v)} label={`${i.name} na mala`} />
                    <button onClick={() => editor.openEdit(i)} className="min-w-0 flex-1 text-left">
                      <span className={cn('block truncate text-[15px]', i.packed && 'text-faint line-through')}>
                        <span className="tabular font-medium">{i.quantity}×</span> {i.name}
                      </span>
                    </button>
                    <span className="tabular shrink-0 text-xs text-muted">{i.weightKg > 0 ? kg(i.weightKg * i.quantity) : '—'}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Fab label="Adicionar item" onClick={() => editor.openNew()} />
      <EntityFormModal {...editor.formProps} fields={fields} />
      <Modal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        title="Limite de bagagem"
        footer={
          <div className="flex gap-2">
            <Button full onClick={() => setLimitOpen(false)}>Cancelar</Button>
            <Button
              full
              variant="primary"
              onClick={() => {
                const n = Number(limit.replace(',', '.'))
                if (!Number.isFinite(n) || n <= 0 || n > 200) return toast('Informe um limite entre 1 e 200 kg', { tone: 'error' })
                actions.updateSettings({ baggageLimitKg: n })
                setLimitOpen(false)
                toast('Limite atualizado')
              }}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <Field label="Peso máximo permitido (kg)" hint="confira na sua passagem">
          <Input type="number" inputMode="decimal" min={1} max={200} step={0.5} value={limit} onChange={(e) => setLimit(e.target.value)} />
        </Field>
      </Modal>
    </div>
  )
}
