import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { money, money0 } from '@/utils/format'
import { fmtDate } from '@/utils/dates'

// Série única → uma cor, sem legenda (o título do card nomeia a série).
const axisTick = { fill: 'var(--muted)', fontSize: 12 }

function TooltipBox({ title, lines }: { title: string; lines: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-float">
      <p className="font-medium">{title}</p>
      {lines.map((l) => (
        <p key={l.label} className="tabular text-muted">
          {l.label}: <span className="text-ink">{l.value}</span>
        </p>
      ))}
    </div>
  )
}

export interface BudgetBarDatum {
  label: string
  planned: number
  spent: number
}

/** Gasto por categoria (barras horizontais, ordenadas da maior para a menor). */
export function BudgetChart({ data }: { data: BudgetBarDatum[] }) {
  const rows = data.filter((d) => d.spent > 0).sort((a, b) => b.spent - a.spent)
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted">Nenhum gasto registrado ainda.</p>
  return (
    <div style={{ height: Math.max(140, rows.length * 40 + 30) }} role="img" aria-label="Gasto por categoria">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="0" />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => money0(v).replace('R$', '').trim()} />
          <YAxis type="category" dataKey="label" width={104} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as BudgetBarDatum | undefined
              if (!active || !p) return null
              return <TooltipBox title={p.label} lines={[{ label: 'Gasto', value: money(p.spent) }, { label: 'Planejado', value: money(p.planned) }]} />
            }}
          />
          <Bar dataKey="spent" fill="var(--ink)" radius={[0, 4, 4, 0]} maxBarSize={18} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Evolução acumulada do dinheiro guardado. */
export function SavingsChart({ points, goal }: { points: { date: string; total: number }[]; goal: number }) {
  if (points.length < 2) return null
  return (
    <div className="h-44" role="img" aria-label="Evolução do dinheiro guardado">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--success)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(d) => fmtDate(d, 'dd/MM')} minTickGap={24} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))} domain={[0, Math.max(goal, ...points.map((p) => p.total))]} />
          <Tooltip
            cursor={{ stroke: 'var(--faint)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as { date: string; total: number } | undefined
              if (!active || !p) return null
              return <TooltipBox title={fmtDate(p.date)} lines={[{ label: 'Acumulado', value: money(p.total) }]} />
            }}
          />
          <Area type="monotone" dataKey="total" stroke="var(--success)" strokeWidth={2} fill="url(#savingsFill)" animationDuration={600} dot={{ r: 3, fill: 'var(--success)', stroke: 'var(--surface)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
