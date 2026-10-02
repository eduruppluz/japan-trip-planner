import { useMemo } from 'react'
import { ArrowRight, BedDouble, CalendarRange, ChevronRight, CircleCheck, ListChecks, Plane, TriangleAlert, Wallet, Info as InfoIcon, Sparkles, PiggyBank, MapPin } from 'lucide-react'
import { useStore } from '@/services/store'
import { CountdownHero } from '@/components/Countdown'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressBar, ProgressRing } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { TaskCard } from '@/components/cards/TaskCard'
import { useToast } from '@/components/ui/Toast'
import { navigate } from '@/hooks/useHashRoute'
import { budgetSummary, hotelNights, placesSummary, readinessMessage, savingsSummary, taskSummary, tripCities, tripInfo, itineraryTotal } from '@/utils/calc'
import { buildAlerts, type AlertLevel } from '@/utils/alerts'
import { daysFromToday, fmtShort, relativeDayLabel, timeAgo, todayISO } from '@/utils/dates'
import { money0, plural } from '@/utils/format'
import { cn } from '@/utils/cn'
import { PRIORITY_WEIGHT } from '@/data/constants'
import type { Task } from '@/types'

function SummaryCard({ icon, title, to, rows, footer }: { icon: React.ReactNode; title: string; to: string; rows: [string, React.ReactNode][]; footer?: React.ReactNode }) {
  return (
    <Card interactive onClick={() => navigate(to)} className="flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-muted uppercase">
          {icon}
          {title}
        </span>
        <ChevronRight size={16} className="text-faint" />
      </div>
      <dl className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-2 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="tabular truncate font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="mt-auto pt-4">{footer}</div>}
    </Card>
  )
}

const alertStyle: Record<AlertLevel, string> = {
  danger: 'text-accent',
  warning: 'text-warning',
  info: 'text-info',
}

export default function Dashboard() {
  const { data, actions } = useStore()
  const toast = useToast()
  const s = data.settings
  const trip = tripInfo(data)
  const budget = useMemo(() => budgetSummary(data), [data])
  const savings = savingsSummary(data)
  const tasks = taskSummary(data)
  const places = placesSummary(data)
  const cities = tripCities(data)
  const alerts = useMemo(() => buildAlerts(data), [data])

  const upcoming = useMemo(() => {
    return data.tasks
      .filter((t) => !t.done)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
      })
      .slice(0, 6)
  }, [data.tasks])

  const groups = useMemo(() => {
    const out: { label: string; items: Task[] }[] = []
    for (const t of upcoming) {
      const n = t.dueDate ? daysFromToday(t.dueDate) : null
      const label = n === null ? 'Sem prazo' : n < 0 ? 'Atrasadas' : relativeDayLabel(t.dueDate)
      const g = out.find((x) => x.label === label)
      if (g) g.items.push(t)
      else out.push({ label, items: [t] })
    }
    return out
  }, [upcoming])

  const nextHotel = useMemo(() => {
    const today = todayISO()
    return [...data.hotels].sort((a, b) => a.checkIn.localeCompare(b.checkIn)).find((h) => h.checkOut >= today)
  }, [data.hotels])

  const toggleTask = (t: Task, done: boolean) => {
    actions.update('tasks', t.id, { done, completedAt: done ? new Date().toISOString() : null }, done ? { text: `Concluiu tarefa “${t.name}”`, kind: 'task' } : undefined)
    if (done) toast('Tarefa concluída')
  }

  return (
    <div className="stagger space-y-5">
      {s.isSampleData && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-sakura/50 p-4 sm:flex-row sm:items-center">
          <Sparkles size={18} className="hidden shrink-0 text-sakura-ink sm:block" />
          <p className="flex-1 text-sm">
            <strong className="font-semibold">Você está vendo dados de exemplo.</strong> Nada aqui é uma reserva real — edite à vontade ou comece do zero.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => actions.updateSettings({ isSampleData: false })}>Manter e editar</Button>
            <Button size="sm" variant="primary" onClick={() => navigate('/configuracoes')}>Começar do zero</Button>
          </div>
        </div>
      )}

      <CountdownHero startDate={s.startDate} endDate={s.endDate} departureTime={s.departureTime} flag={s.destinationFlag} title={s.tripName} subtitle={s.subtitle} />

      {/* Preparação */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-5">
          <ProgressRing value={tasks.pct} size={72} stroke={7}>
            <span className="tabular text-base font-semibold">{tasks.pct}%</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Preparação da viagem</p>
            <p className="mt-1 text-[15px] leading-snug font-medium">{readinessMessage(tasks.pct, s.addressForm)}</p>
            <ProgressBar value={tasks.pct} tone="accent" className="mt-3" label="Preparação da viagem" />
            <p className="tabular mt-1.5 text-xs text-muted">{tasks.done} de {tasks.total} tarefas concluídas</p>
          </div>
        </div>
      </Card>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryCard icon={<Plane size={15} />} title="Viagem" to="/voos" rows={[['Ida', fmtShort(s.startDate)], ['Volta', fmtShort(s.endDate)], ['Duração', plural(trip.days, 'dia', 'dias')]]} />
        <SummaryCard
          icon={<Wallet size={15} />}
          title="Orçamento"
          to="/orcamento"
          rows={[['Orçamento total', money0(budget.total)], ['Já guardado', money0(savings.saved)], ['Gasto', money0(budget.spent)], ['Pode gastar', <span className={budget.available < 0 ? 'text-accent' : ''}>{money0(budget.available)}</span>]]}
          footer={<ProgressBar value={budget.spentPct} tone={budget.overBudget ? 'accent' : 'ink'} size="sm" label="Orçamento gasto" />}
        />
        <SummaryCard icon={<ListChecks size={15} />} title="Organização" to="/checklist" rows={[['Concluídas', tasks.done], ['Pendentes', tasks.pending], ['Preparação', `${tasks.pct}%`]]} footer={<ProgressBar value={tasks.pct} size="sm" tone="success" label="Tarefas" />} />
        <SummaryCard icon={<CalendarRange size={15} />} title="Roteiro" to="/roteiro" rows={[['Cidades', cities.length], ['Lugares planejados', places.total], ['Atividades', data.itinerary.length]]} footer={<p className="tabular text-xs text-muted">{places.visited} de {places.total} lugares visitados</p>} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Próximas tarefas */}
        <Card className="lg:col-span-3">
          <CardHeader title="Próximas tarefas" subtitle="O que resolver agora" action={<Button size="sm" variant="ghost" onClick={() => navigate('/checklist')}>Ver todas <ArrowRight size={14} /></Button>} />
          <div className="pt-2 pb-2">
            {groups.length === 0 && (
              <div className="flex flex-col items-center px-5 py-8 text-center">
                {tasks.total === 0 ? (
                  <>
                    <p className="font-medium">Nenhuma tarefa criada</p>
                    <p className="text-sm text-muted">Monte seu checklist de preparação.</p>
                    <Button size="sm" variant="primary" className="mt-3" onClick={() => navigate('/checklist')}>Abrir checklist</Button>
                  </>
                ) : (
                  <>
                    <CircleCheck size={28} className="text-success" />
                    <p className="mt-2 font-medium">Nenhuma tarefa pendente</p>
                    <p className="text-sm text-muted">Tudo sob controle por aqui.</p>
                  </>
                )}
              </div>
            )}
            {groups.map((g) => (
              <div key={g.label}>
                <p className={cn('px-5 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase', g.label === 'Atrasadas' ? 'text-accent' : 'text-faint')}>{g.label}</p>
                {g.items.map((t) => (
                  <TaskCard key={t.id} task={t} onToggle={(d) => toggleTask(t, d)} onEdit={() => navigate('/checklist')} showCategory />
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* Alertas */}
        <Card className="lg:col-span-2">
          <CardHeader title="Alertas" icon={<TriangleAlert size={16} />} subtitle={alerts.length ? plural(alerts.length, 'ponto de atenção', 'pontos de atenção') : undefined} />
          <div className="p-3">
            {alerts.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">Nenhum alerta. Tudo em ordem ✨</p>
            ) : (
              <ul className="space-y-1">
                {alerts.slice(0, 7).map((a) => (
                  <li key={a.id}>
                    <a href={'#' + a.to} className="flex items-start gap-3 rounded-xl px-2 py-2.5 text-sm transition-colors hover:bg-surface-2">
                      {a.level === 'info' ? <InfoIcon size={16} className={cn('mt-0.5 shrink-0', alertStyle[a.level])} /> : <TriangleAlert size={16} className={cn('mt-0.5 shrink-0', alertStyle[a.level])} />}
                      <span className="flex-1">{a.text}</span>
                      <ChevronRight size={16} className="mt-0.5 shrink-0 text-faint" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Resumo da viagem */}
        <Card className="p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Resumo da viagem</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{s.destinationFlag} {s.tripName.replace(/^minha viagem para o\s*/i, '') || 'Japão'}</p>
          <p className="tabular text-muted">{fmtShort(s.startDate)} → {fmtShort(s.endDate)}</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            {[
              [plural(trip.days, 'dia', 'dias'), 'de viagem'],
              [plural(cities.length, 'cidade', 'cidades'), cities.slice(0, 3).join(', ') || 'a definir'],
              [plural(places.total, 'lugar', 'lugares'), 'planejados'],
              [money0(budget.planned), 'planejados'],
              [money0(budget.spent), 'já gastos'],
              [`${tasks.pct}%`, 'da preparação'],
            ].map(([a, b]) => (
              <div key={a + b}>
                <dt className="tabular text-lg font-semibold tracking-tight">{a}</dt>
                <dd className="truncate text-xs text-muted">{b}</dd>
              </div>
            ))}
          </dl>
          {itineraryTotal(data) > 0 && <p className="mt-4 text-xs text-muted">Custo estimado do roteiro: <span className="tabular font-medium text-ink">{money0(itineraryTotal(data))}</span></p>}
        </Card>

        <div className="grid grid-cols-1 gap-5">
          {/* Meta */}
          <Card interactive onClick={() => navigate('/orcamento?tab=meta')} className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing value={savings.pct} tone="success" size={64}>
                <PiggyBank size={20} className="text-success" />
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Meta da viagem</p>
                <p className="tabular mt-0.5 text-lg font-semibold">{money0(savings.saved)} <span className="text-sm font-normal text-muted">de {money0(savings.goal)}</span></p>
                <p className="text-sm text-muted">{savings.reached ? 'Meta alcançada! 🎉' : `${savings.pct}% alcançado · faltam ${money0(savings.missing)}`}</p>
              </div>
            </div>
          </Card>
          {/* Onde vou ficar */}
          <Card interactive onClick={() => navigate('/hospedagem')} className="p-5">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase"><BedDouble size={14} /> Próxima hospedagem</p>
            {nextHotel ? (
              <>
                <p className="mt-2 truncate font-semibold">{nextHotel.name}</p>
                <p className="tabular text-sm text-muted">{nextHotel.city} · {fmtShort(nextHotel.checkIn)} → {fmtShort(nextHotel.checkOut)} · {plural(hotelNights(nextHotel), 'noite', 'noites')}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Nenhuma hospedagem cadastrada.</p>
            )}
            {cities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cities.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs"><MapPin size={11} />{c}</span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Últimas atividades */}
      <Card>
        <CardHeader title="Últimas atividades" />
        <ul className="px-5 pt-3 pb-4">
          {data.log.length === 0 && <li className="py-4 text-center text-sm text-muted">Suas ações recentes aparecerão aqui.</li>}
          {data.log.slice(0, 6).map((l) => (
            <li key={l.id} className="flex items-center gap-3 border-b border-line py-2.5 text-sm last:border-0">
              <CircleCheck size={16} className="shrink-0 text-success" />
              <span className="flex-1">{l.text}</span>
              <span className="shrink-0 text-xs text-faint">{timeAgo(l.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
