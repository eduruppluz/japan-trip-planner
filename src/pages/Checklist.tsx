import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Draft, Task, TaskCategory } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Chips, Input, Segmented } from '@/components/ui/Field'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { TaskCard } from '@/components/cards/TaskCard'
import { Fab } from '@/components/ui/Fab'
import { useToast } from '@/components/ui/Toast'
import { PRIORITY_OPTIONS, PRIORITY_WEIGHT, TASK_CATEGORIES, TASK_CATEGORY_OPTIONS } from '@/data/constants'
import { taskSummary } from '@/utils/calc'
import { SUGGESTED_TASKS } from '@/data/seed'
import { norm, pct } from '@/utils/format'

type Status = 'todas' | 'pendentes' | 'concluidas'
type Sort = 'categoria' | 'prazo'

export default function Checklist() {
  const { data, actions } = useStore()
  const toast = useToast()
  const [status, setStatus] = useState<Status>('pendentes')
  const [cat, setCat] = useState<TaskCategory | 'todas'>('todas')
  const [sort, setSort] = useState<Sort>('categoria')
  const [q, setQ] = useState('')
  const summary = taskSummary(data)

  const editor = useEntityEditor('tasks', {
    noun: 'tarefa',
    gender: 'f',
    empty: (): Draft<'tasks'> => ({ name: '', category: cat === 'todas' ? 'viagem' : cat, dueDate: '', priority: 'media', done: false, completedAt: null, notes: '' }),
    updateLog: (d, prev) => (d.done && !prev.done ? { text: `Concluiu tarefa “${d.name}”`, kind: 'task' } : undefined),
  })

  const fields: FieldDef<Draft<'tasks'>>[] = [
    { name: 'name', label: 'Tarefa', type: 'text', required: true, full: true, placeholder: 'Ex.: Comprar ingresso do museu' },
    { name: 'category', label: 'Categoria', type: 'select', required: true, options: TASK_CATEGORY_OPTIONS },
    { name: 'priority', label: 'Prioridade', type: 'select', required: true, options: PRIORITY_OPTIONS },
    { name: 'dueDate', label: 'Prazo', type: 'date' },
    { name: 'done', label: 'Concluída', type: 'checkbox', placeholder: 'Tarefa concluída' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ]

  const toggle = (t: Task, done: boolean) => {
    actions.update('tasks', t.id, { done, completedAt: done ? new Date().toISOString() : null }, done ? { text: `Concluiu tarefa “${t.name}”`, kind: 'task' } : undefined)
    if (done) toast('Tarefa concluída')
  }

  const addSuggested = () => {
    SUGGESTED_TASKS.forEach((t) => actions.add('tasks', { ...t, dueDate: '', done: false, completedAt: null, notes: '' }))
    toast('Checklist sugerido adicionado')
  }

  const filtered = useMemo(() => {
    const nq = norm(q)
    return data.tasks.filter(
      (t) => (status === 'todas' || (status === 'pendentes' ? !t.done : t.done)) && (cat === 'todas' || t.category === cat) && (!nq || norm(t.name + ' ' + t.notes).includes(nq)),
    )
  }, [data.tasks, status, cat, q])

  const sortTasks = (list: Task[]) =>
    [...list].sort((a, b) => Number(a.done) - Number(b.done) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])

  const groups = useMemo(() => {
    if (sort === 'prazo') return [{ key: 'all', title: '', items: sortTasks(filtered) }]
    return TASK_CATEGORY_OPTIONS.map((o) => ({ key: o.value, title: `${o.emoji}  ${o.label}`, items: sortTasks(filtered.filter((t) => t.category === o.value)) })).filter((g) => g.items.length)
  }, [filtered, sort])

  const catCounts = useMemo(() => {
    const m: Record<string, { total: number; done: number }> = {}
    data.tasks.forEach((t) => {
      m[t.category] ??= { total: 0, done: 0 }
      m[t.category].total++
      if (t.done) m[t.category].done++
    })
    return m
  }, [data.tasks])

  return (
    <div>
      <PageHeader title="Checklist" kanji="準備" subtitle={`${summary.done} de ${summary.total} tarefas concluídas`} action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Nova tarefa</Button>} />

      <Card className="mb-5 p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">Progresso geral</p>
          <p className="tabular text-2xl font-semibold tracking-tight">{summary.pct}%</p>
        </div>
        <ProgressBar value={summary.pct} tone="success" size="lg" className="mt-3" label="Tarefas concluídas" />
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
          {TASK_CATEGORY_OPTIONS.filter((o) => catCounts[o.value]).map((o) => {
            const c = catCounts[o.value]
            return (
              <button key={o.value} onClick={() => setCat(cat === o.value ? 'todas' : o.value)} className={`min-w-[108px] shrink-0 rounded-2xl border p-3 text-left transition-colors ${cat === o.value ? 'border-ink bg-surface-2' : 'border-line hover:bg-surface-2/50'}`}>
                <p className="text-sm">{o.emoji} {o.label}</p>
                <p className="tabular mt-1 text-xs text-muted">{c.done}/{c.total}</p>
                <ProgressBar value={pct(c.done, c.total)} size="sm" tone="success" className="mt-2" />
              </button>
            )
          })}
        </div>
      </Card>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented value={status} onChange={setStatus} options={[{ value: 'pendentes', label: `Pendentes ${summary.pending}` }, { value: 'concluidas', label: `Concluídas ${summary.done}` }, { value: 'todas', label: 'Todas' }]} />
        <div className="relative sm:ml-auto sm:w-64">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tarefa" className="pl-10" aria-label="Buscar tarefa" />
        </div>
      </div>
      <div className="mb-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Chips value={cat} onChange={setCat} options={[{ value: 'todas' as const, label: 'Todas' }, ...TASK_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: `${o.emoji} ${o.label}` }))]} />
        </div>
      </div>
      <div className="mb-4 flex justify-end">
        <Segmented size="sm" value={sort} onChange={setSort} options={[{ value: 'categoria', label: 'Por categoria' }, { value: 'prazo', label: 'Por prazo' }]} />
      </div>

      {data.tasks.length === 0 ? (
        <div>
          <EmptyState icon="📋" title="Nenhuma tarefa ainda" description="Comece com o checklist sugerido (25 tarefas) ou crie as suas." actionLabel="Usar checklist sugerido" onAction={addSuggested} />
          <div className="mt-3 text-center"><Button variant="ghost" onClick={() => editor.openNew()}>Criar tarefa manualmente</Button></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="✨" title={status === 'pendentes' ? 'Nada pendente aqui' : 'Nenhuma tarefa encontrada'} description="Tente outro filtro ou adicione uma nova tarefa." />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.key} className="overflow-hidden">
              {g.title && (
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold tracking-wide uppercase">{g.title}</p>
                  <p className="tabular text-xs text-muted">{catCounts[g.key]?.done ?? 0}/{catCounts[g.key]?.total ?? 0}</p>
                </div>
              )}
              <div className="divide-y divide-line">
                {g.items.map((t) => (
                  <TaskCard key={t.id} task={t} onToggle={(d) => toggle(t, d)} onEdit={() => editor.openEdit(t)} showCategory={sort === 'prazo'} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Fab label="Nova tarefa" onClick={() => editor.openNew()} />
      <EntityFormModal
        {...editor.formProps}
        fields={fields}
        onSubmit={(v) => editor.formProps.onSubmit({ ...v, completedAt: v.done ? (editor.editing?.completedAt ?? new Date().toISOString()) : null })}
        subtitle={editor.editing ? TASK_CATEGORIES[editor.editing.category].label : undefined}
      />
    </div>
  )
}
