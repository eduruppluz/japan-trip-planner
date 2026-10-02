import { useMemo, useState } from 'react'
import { Pencil, PiggyBank, Plus, Wallet, Receipt, Info as InfoIcon, TriangleAlert, ArrowRight } from 'lucide-react'
import type { BudgetCategory, Draft } from '@/types'
import { useStore } from '@/services/store'
import { useHashRoute, setQueryParam, navigate } from '@/hooks/useHashRoute'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chips, Field, Input, Segmented, Toggle } from '@/components/ui/Field'
import { ProgressBar, ProgressRing } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Stat } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { BudgetChart, SavingsChart } from '@/components/ui/BudgetChart'
import { ExpenseCard } from '@/components/cards/ExpenseCard'
import { Fab } from '@/components/ui/Fab'
import { useToast } from '@/components/ui/Toast'
import { AUTO_BUDGET_SOURCES, BUDGET_CATEGORIES, BUDGET_CATEGORY_OPTIONS, PAYMENT_METHOD_SUGGESTIONS } from '@/data/constants'
import { budgetSummary, hotelTotal, savingsSummary, shoppingValue, type CategoryBudget } from '@/utils/calc'
import { fmtDate, todayISO } from '@/utils/dates'
import { money, money0, pct, safeNum } from '@/utils/format'
import { cn } from '@/utils/cn'

type Tab = 'geral' | 'categorias' | 'gastos' | 'meta'
const TABS: { value: Tab; label: string }[] = [
  { value: 'geral', label: 'Resumo' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'meta', label: 'Meta' },
]

/** Modal simples para editar um único valor numérico. */
function NumberModal({ open, onClose, title, label, value, onSave, hint }: { open: boolean; onClose: () => void; title: string; label: string; value: number; onSave: (n: number) => void; hint?: string }) {
  const [v, setV] = useState(String(value || ''))
  const [err, setErr] = useState('')
  const save = () => {
    const n = Number(v.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0) return setErr('Informe um valor válido (0 ou maior).')
    onSave(n)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<div className="flex gap-2"><Button full onClick={onClose}>Cancelar</Button><Button full variant="primary" onClick={save}>Salvar</Button></div>}>
      <form onSubmit={(e) => (e.preventDefault(), save())}>
        <Field label={label} error={err} hint={hint}>
          <Input autoFocus prefix="R$" type="number" inputMode="decimal" min={0} step={0.01} value={v} onChange={(e) => (setV(e.target.value), setErr(''))} />
        </Field>
      </form>
    </Modal>
  )
}

export default function Budget() {
  const { data, actions } = useStore()
  const toast = useToast()
  const route = useHashRoute()
  const tab = (TABS.some((t) => t.value === route.query.get('tab')) ? route.query.get('tab') : 'geral') as Tab
  const setTab = (t: Tab) => setQueryParam('tab', t === 'geral' ? null : t)

  const b = useMemo(() => budgetSummary(data), [data])
  const sv = savingsSummary(data)
  const [editTotal, setEditTotal] = useState(false)
  const [editGoal, setEditGoal] = useState(false)
  const [editCat, setEditCat] = useState<CategoryBudget | null>(null)
  const [catFilter, setCatFilter] = useState<BudgetCategory | 'todas'>('todas')

  const expenseEditor = useEntityEditor('expenses', {
    noun: 'gasto',
    empty: (): Draft<'expenses'> => ({ date: todayISO(), category: catFilter === 'todas' ? 'alimentacao' : catFilter, description: '', amount: 0, paymentMethod: '', notes: '' }),
    addLog: (d) => ({ text: `Registrou gasto de ${money(d.amount)} (${d.description})`, kind: 'expense' }),
  })
  const savingsEditor = useEntityEditor('savings', {
    noun: 'depósito',
    empty: (): Draft<'savings'> => ({ date: todayISO(), amount: 0, note: '' }),
    addLog: (d) => ({ text: d.amount >= 0 ? `Adicionou ${money(d.amount)} à meta` : `Retirou ${money(Math.abs(d.amount))} da meta`, kind: 'money' }),
  })

  const expenseFields: FieldDef<Draft<'expenses'>>[] = [
    { name: 'description', label: 'Descrição', type: 'text', required: true, full: true, placeholder: 'Ex.: Seguro viagem' },
    { name: 'amount', label: 'Valor', type: 'money', required: true, min: 0.01, validate: (v) => (safeNum(v) <= 0 ? 'Informe um valor maior que zero' : undefined) },
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'category', label: 'Categoria', type: 'select', required: true, options: BUDGET_CATEGORY_OPTIONS },
    { name: 'paymentMethod', label: 'Forma de pagamento', type: 'text', suggestions: PAYMENT_METHOD_SUGGESTIONS },
    { name: 'notes', label: 'Observação', type: 'textarea' },
  ]
  const savingsFields: FieldDef<Draft<'savings'>>[] = [
    { name: 'amount', label: 'Valor', type: 'money', required: true, hint: 'Use valor negativo para retirada', validate: (v) => (safeNum(v) === 0 ? 'Informe um valor diferente de zero' : undefined) },
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'note', label: 'Observação', type: 'text', full: true, placeholder: 'Ex.: 13º salário' },
  ]

  const expenses = useMemo(
    () => data.expenses.filter((e) => catFilter === 'todas' || e.category === catFilter).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [data.expenses, catFilter],
  )
  const autoEntries = useMemo(() => {
    const out: { id: string; label: string; meta: string; amount: number; to: string; category: BudgetCategory }[] = []
    data.flights.filter((f) => f.paymentStatus === 'pago').forEach((f) => out.push({ id: f.id, label: `Voo ${f.fromAirport || f.fromCity} → ${f.toAirport || f.toCity}`, meta: 'Passagens · voo pago', amount: f.price, to: '/voos', category: 'passagens' }))
    data.hotels.filter((h) => h.paymentStatus === 'pago').forEach((h) => out.push({ id: h.id, label: h.name, meta: 'Hospedagem · paga', amount: hotelTotal(h), to: '/hospedagem', category: 'hospedagem' }))
    data.shopping.filter((i) => i.status === 'comprado').forEach((i) => out.push({ id: i.id, label: i.product, meta: 'Compras · comprado', amount: shoppingValue(i), to: '/compras', category: 'compras' }))
    return out.filter((e) => catFilter === 'todas' || e.category === catFilter)
  }, [data, catFilter])

  const history = useMemo(() => {
    const sorted = [...data.savings].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    let acc = 0
    return sorted.map((e) => ({ ...e, total: (acc += safeNum(e.amount)) }))
  }, [data.savings])

  const filteredTotal = expenses.reduce((s, e) => s + e.amount, 0) + autoEntries.reduce((s, e) => s + e.amount, 0)
  const counts = useMemo(() => {
    const c: Partial<Record<BudgetCategory, number>> = {}
    data.expenses.forEach((e) => (c[e.category] = (c[e.category] ?? 0) + 1))
    return c
  }, [data.expenses])

  return (
    <div>
      <PageHeader
        title="Orçamento"
        kanji="予算"
        subtitle="Planejado, gasto e restante — sempre separados"
        action={tab === 'meta' ? <Button variant="primary" icon={<Plus size={18} />} onClick={() => savingsEditor.openNew()}>Adicionar dinheiro</Button> : <Button variant="primary" icon={<Plus size={18} />} onClick={() => expenseEditor.openNew()}>Registrar gasto</Button>}
      />
      <Segmented className="mb-5" value={tab} onChange={setTab} options={TABS} />

      {tab === 'geral' && (
        <div className="stagger space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Orçamento total</p>
                <p className="tabular mt-1 text-[34px] leading-tight font-semibold tracking-tight">{money0(b.total)}</p>
              </div>
              <Button size="sm" icon={<Pencil size={14} />} onClick={() => setEditTotal(true)}>Editar</Button>
            </div>
            <ProgressBar value={b.spentPct} tone={b.overBudget ? 'accent' : 'ink'} size="lg" className="mt-4" label="Parte do orçamento já gasta" />
            <p className="tabular mt-2 text-sm text-muted">{b.spentPct}% do orçamento já foi gasto</p>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5">
              <Stat label="Planejado" value={money0(b.planned)} hint="nas categorias" />
              <Stat label="Gasto" value={money0(b.spent)} hint="já pago" />
              <Stat label="Restante" value={money0(b.available)} hint="para gastar" tone={b.available < 0 ? 'accent' : 'success'} />
            </div>
            {b.total > 0 && b.unallocated !== 0 && (
              <p className={cn('mt-4 flex items-start gap-2 rounded-xl p-3 text-sm', b.unallocated < 0 ? 'bg-accent/8 text-accent' : 'bg-surface-2 text-muted')}>
                {b.unallocated < 0 ? <TriangleAlert size={16} className="mt-0.5 shrink-0" /> : <InfoIcon size={16} className="mt-0.5 shrink-0" />}
                {b.unallocated < 0
                  ? `O planejado passou o orçamento total em ${money0(-b.unallocated)}. Ajuste as categorias ou aumente o orçamento.`
                  : `${money0(b.unallocated)} do orçamento ainda não foram distribuídos entre as categorias.`}
              </p>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Gasto por categoria" icon={<Receipt size={16} />} />
              <div className="p-4 pt-3">
                <BudgetChart data={b.categories.map((c) => ({ label: BUDGET_CATEGORIES[c.category].label, planned: c.planned, spent: c.spent }))} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Categorias com maior planejamento" icon={<Wallet size={16} />} action={<Button size="sm" variant="ghost" onClick={() => setTab('categorias')}>Todas <ArrowRight size={14} /></Button>} />
              <div className="space-y-4 p-5 pt-4">
                {[...b.categories].filter((c) => c.planned > 0).sort((x, y) => y.planned - x.planned).slice(0, 5).map((c) => (
                  <CategoryLine key={c.category} c={c} />
                ))}
                {b.categories.every((c) => c.planned === 0) && <p className="py-6 text-center text-sm text-muted">Defina valores planejados em Categorias.</p>}
              </div>
            </Card>
          </div>

          <Card className="p-5 text-sm text-muted">
            <p className="font-medium text-ink">Como os valores são calculados</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong className="text-ink">Planejado</strong>: o que você pretende gastar em cada categoria. Passagens, Hospedagem, Passeios e Compras podem ser calculados automaticamente dos seus cadastros.</li>
              <li><strong className="text-ink">Gasto</strong>: gastos registrados + voos e hospedagens marcados como pagos + compras marcadas como compradas.</li>
              <li><strong className="text-ink">Restante</strong>: orçamento total menos o que já foi gasto.</li>
            </ul>
          </Card>
        </div>
      )}

      {tab === 'categorias' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4"><Stat label="Planejado" value={money0(b.planned)} /></Card>
            <Card className="p-4"><Stat label="Gasto" value={money0(b.spent)} /></Card>
            <Card className="p-4"><Stat label="Não distribuído" value={money0(b.unallocated)} tone={b.unallocated < 0 ? 'accent' : undefined} /></Card>
          </div>
          <Card className="divide-y divide-line overflow-hidden">
            {b.categories.map((c) => (
              <button key={c.category} onClick={() => setEditCat(c)} className="block w-full px-4 py-4 text-left transition-colors hover:bg-surface-2/60 sm:px-5">
                <CategoryLine c={c} detailed />
              </button>
            ))}
          </Card>
        </div>
      )}

      {tab === 'gastos' && (
        <div className="space-y-4">
          <Chips
            value={catFilter}
            onChange={setCatFilter}
            options={[{ value: 'todas' as const, label: 'Todas', count: data.expenses.length }, ...BUDGET_CATEGORY_OPTIONS.filter((o) => counts[o.value] || AUTO_BUDGET_SOURCES[o.value]).map((o) => ({ value: o.value, label: `${o.emoji} ${o.label}`, count: counts[o.value] ?? 0 }))]}
          />
          <Card className="flex items-center justify-between p-4">
            <span className="text-sm text-muted">Total {catFilter === 'todas' ? 'gasto' : `em ${BUDGET_CATEGORIES[catFilter].label}`}</span>
            <span className="tabular text-lg font-semibold">{money(filteredTotal)}</span>
          </Card>
          {expenses.length === 0 && autoEntries.length === 0 ? (
            <EmptyState icon="🧾" title="Nenhum gasto registrado" description="Registre cada gasto para acompanhar o orçamento em tempo real." actionLabel="Registrar gasto" onAction={() => expenseEditor.openNew()} />
          ) : (
            <>
              {expenses.length > 0 && (
                <Card className="divide-y divide-line overflow-hidden">
                  {expenses.map((e) => (
                    <ExpenseCard key={e.id} expense={e} onEdit={() => expenseEditor.openEdit(e)} />
                  ))}
                </Card>
              )}
              {autoEntries.length > 0 && (
                <div>
                  <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-faint uppercase">Lançados automaticamente</p>
                  <Card className="divide-y divide-line overflow-hidden">
                    {autoEntries.map((e) => (
                      <button key={e.id} onClick={() => navigate(e.to)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2/60">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg">{BUDGET_CATEGORIES[e.category].emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">{e.label}</span>
                          <span className="block text-xs text-muted">{e.meta}</span>
                        </span>
                        <span className="tabular font-semibold">{money(e.amount)}</span>
                      </button>
                    ))}
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'meta' && (
        <div className="stagger space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-5">
              <ProgressRing value={sv.pct} size={96} stroke={8} tone="success">
                <span className="tabular text-xl font-semibold">{sv.pct}%</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Meta da viagem</p>
                <p className="mt-1 text-[15px] font-medium">{sv.reached ? 'Meta alcançada! 🎉' : `${sv.pct}% da meta alcançada`}</p>
                <Button size="sm" className="mt-3" icon={<Pencil size={14} />} onClick={() => setEditGoal(true)}>Editar meta</Button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5">
              <Stat label="Meta total" value={money0(sv.goal)} />
              <Stat label="Já tenho" value={money0(sv.saved)} tone="success" />
              <Stat label="Falta" value={money0(sv.missing)} tone={sv.missing > 0 ? 'warning' : undefined} />
            </div>
            {history.length >= 2 && (
              <div className="mt-5 border-t border-line pt-4">
                <SavingsChart points={history.map((h) => ({ date: h.date, total: h.total }))} goal={sv.goal} />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Histórico" icon={<PiggyBank size={16} />} action={<Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => savingsEditor.openNew()}>Adicionar</Button>} />
            <div className="p-2">
              {history.length === 0 ? (
                <EmptyState compact icon="🐷" title="Nenhum valor guardado ainda" description="Registre cada valor que separar para a viagem." actionLabel="Adicionar dinheiro" onAction={() => savingsEditor.openNew()} />
              ) : (
                [...history].reverse().map((h) => (
                  <button key={h.id} onClick={() => savingsEditor.openEdit(h)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface-2/60">
                    <span className="tabular w-14 shrink-0 text-sm text-muted">{fmtDate(h.date, 'dd/MM')}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{h.note || (h.amount >= 0 ? 'Depósito' : 'Retirada')}</span>
                    <span className="text-right">
                      <span className={cn('tabular block font-semibold', h.amount >= 0 ? 'text-success' : 'text-accent')}>{h.amount >= 0 ? '+ ' : '− '}{money(Math.abs(h.amount))}</span>
                      <span className="tabular block text-xs text-faint">total {money0(h.total)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      <Fab label={tab === 'meta' ? 'Adicionar dinheiro' : 'Registrar gasto'} onClick={() => (tab === 'meta' ? savingsEditor.openNew() : expenseEditor.openNew())} />
      <EntityFormModal {...expenseEditor.formProps} fields={expenseFields} />
      <EntityFormModal {...savingsEditor.formProps} title={savingsEditor.editing ? 'Editar valor guardado' : 'Adicionar dinheiro à meta'} fields={savingsFields} />
      {editTotal && <NumberModal open onClose={() => setEditTotal(false)} title="Orçamento total" label="Quanto pretende gastar na viagem inteira" value={b.total} onSave={(n) => (actions.updateSettings({ totalBudget: n }), toast('Orçamento atualizado'))} />}
      {editGoal && <NumberModal open onClose={() => setEditGoal(false)} title="Meta financeira" label="Quanto quer juntar para a viagem" value={sv.goal} onSave={(n) => (actions.updateSettings({ savingsGoal: n }), toast('Meta atualizada'))} />}
      {editCat && <CategoryModal c={editCat} onClose={() => setEditCat(null)} onSave={(planned, auto) => (actions.setBudgetEntry(editCat.category, { planned, auto }), toast('Categoria atualizada'))} />}
    </div>
  )
}

function CategoryLine({ c, detailed }: { c: CategoryBudget; detailed?: boolean }) {
  const cat = BUDGET_CATEGORIES[c.category]
  const over = c.planned > 0 && c.spent > c.planned
  const p = c.planned > 0 ? pct(c.spent, c.planned) : c.spent > 0 ? 100 : 0
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2" aria-hidden>{cat.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[15px] font-medium">
            <span className="truncate">{cat.label}</span>
            {c.auto && <Badge tone="info">auto</Badge>}
            {over && <Badge tone="accent"><TriangleAlert size={11} /> acima</Badge>}
          </p>
          {detailed ? (
            <p className="tabular mt-0.5 text-xs text-muted">
              Planejado {money0(c.planned)} · Gasto {money0(c.spent)} · <span className={c.remaining < 0 ? 'font-medium text-accent' : ''}>Restante {money0(c.remaining)}</span>
            </p>
          ) : (
            <p className="tabular text-xs text-muted">{money0(c.spent)} de {money0(c.planned)}</p>
          )}
        </div>
        {detailed && <Pencil size={14} className="text-faint" />}
      </div>
      <ProgressBar value={p} tone={over ? 'accent' : 'ink'} size="sm" className="mt-2.5" label={`${cat.label}: gasto sobre planejado`} />
    </div>
  )
}

function CategoryModal({ c, onClose, onSave }: { c: CategoryBudget; onClose: () => void; onSave: (planned: number, auto: boolean) => void }) {
  const cat = BUDGET_CATEGORIES[c.category]
  const source = AUTO_BUDGET_SOURCES[c.category]
  const [auto, setAuto] = useState(c.auto)
  const [v, setV] = useState(String(c.manual || ''))
  const [err, setErr] = useState('')
  const save = () => {
    const n = v === '' ? 0 : Number(v.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0) return setErr('Informe um valor válido.')
    onSave(n, auto)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={`${cat.emoji}  ${cat.label}`} subtitle={`Gasto até agora: ${money(c.spent)}`} footer={<div className="flex gap-2"><Button full onClick={onClose}>Cancelar</Button><Button full variant="primary" onClick={save}>Salvar</Button></div>}>
      <form className="space-y-4" onSubmit={(e) => (e.preventDefault(), save())}>
        {source && (
          <div className="rounded-2xl border border-line p-4">
            <Toggle checked={auto} onChange={setAuto} label="Calcular automaticamente" description={`Usa a ${source}: ${money(c.autoValue ?? 0)}`} />
          </div>
        )}
        {!auto && (
          <Field label="Valor planejado" error={err}>
            <Input autoFocus prefix="R$" type="number" inputMode="decimal" min={0} step={0.01} value={v} onChange={(e) => (setV(e.target.value), setErr(''))} />
          </Field>
        )}
      </form>
    </Modal>
  )
}
