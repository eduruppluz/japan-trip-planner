import { useRef, useState, type ReactNode } from 'react'
import { Download, Monitor, Moon, RotateCcw, Sun, Upload, Eraser, Database } from 'lucide-react'
import type { Settings as SettingsType } from '@/types'
import { useStore } from '@/services/store'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input, Segmented, Select, Toggle } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { buildExport, validateImport } from '@/services/schema'
import { daysBetween, todayISO, tripLengthDays } from '@/utils/dates'
import { plural } from '@/utils/format'
import type { AppData } from '@/types'
import { createEmptyData, createSampleData } from '@/data/seed'

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

/** Campo numérico que só grava valores válidos. */
function NumberSetting({ label, value, onCommit, prefix, min = 0, max, step = 1, hint }: { label: string; value: number; onCommit: (n: number) => void; prefix?: string; min?: number; max?: number; step?: number; hint?: string }) {
  const [v, setV] = useState(String(value))
  const [err, setErr] = useState('')
  const commit = (raw: string) => {
    const n = Number(raw.replace(',', '.'))
    if (raw === '' || !Number.isFinite(n) || n < min || (max !== undefined && n > max)) return setErr(`Valor entre ${min} e ${max ?? '∞'}`)
    setErr('')
    onCommit(n)
  }
  return (
    <Field label={label} error={err} hint={hint}>
      <Input type="number" inputMode="decimal" prefix={prefix} min={min} max={max} step={step} value={v} onChange={(e) => (setV(e.target.value), commit(e.target.value))} />
    </Field>
  )
}

export default function SettingsPage() {
  const { data, actions, storageName } = useStore()
  const toast = useToast()
  const s = data.settings
  const set = (patch: Partial<SettingsType>) => actions.updateSettings(patch)
  const [start, setStart] = useState(s.startDate)
  const [end, setEnd] = useState(s.endDate)
  const [dateErr, setDateErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<AppData | null>(null)
  const [confirm, setConfirm] = useState<null | 'empty' | 'sample'>(null)
  // Incrementado após reset/import para recriar os campos com os novos valores
  const [rev, setRev] = useState(0)
  const remount = (d: AppData) => {
    setStart(d.settings.startDate)
    setEnd(d.settings.endDate)
    setDateErr('')
    setRev((r) => r + 1)
  }

  const commitDates = (a: string, b: string) => {
    setStart(a)
    setEnd(b)
    if (!a || !b) return setDateErr('Informe as duas datas')
    if (daysBetween(a, b) < 0) return setDateErr('A volta precisa ser depois da ida')
    if (daysBetween(a, b) > 119) return setDateErr('Viagem limitada a 120 dias')
    setDateErr('')
    set({ startDate: a, endDate: b })
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(buildExport(data), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `japan-trip-planner-${todayISO()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast('Backup exportado')
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast('Arquivo muito grande (máx. 5 MB)', { tone: 'error' })
    try {
      const res = validateImport(JSON.parse(await file.text()))
      if (!res.ok) return toast(res.error, { tone: 'error' })
      setPendingImport(res.data)
    } catch {
      toast('Não foi possível ler o arquivo. Verifique se é um JSON válido.', { tone: 'error' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const counts = (d: AppData) =>
    [plural(d.itinerary.length, 'atividade', 'atividades'), plural(d.tasks.length, 'tarefa', 'tarefas'), plural(d.expenses.length, 'gasto', 'gastos'), plural(d.places.length, 'lugar', 'lugares')].join(', ')

  return (
    <div>
      <PageHeader title="Configurações" kanji="設定" subtitle="Viagem, orçamento, aparência e dados" />
      <div key={rev} className="stagger space-y-5">
        <Section title="Viagem" description={dateErr ? undefined : `${plural(tripLengthDays(s.startDate, s.endDate), 'dia', 'dias')} de viagem`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome da viagem" className="sm:col-span-2">
              <Input value={s.tripName} maxLength={60} onChange={(e) => set({ tripName: e.target.value })} />
            </Field>
            <Field label="Subtítulo" className="sm:col-span-2">
              <Input value={s.subtitle} maxLength={60} onChange={(e) => set({ subtitle: e.target.value })} />
            </Field>
            <Field label="Data de ida" error={dateErr}>
              <Input type="date" value={start} onChange={(e) => commitDates(e.target.value, end)} />
            </Field>
            <Field label="Data de retorno">
              <Input type="date" value={end} onChange={(e) => commitDates(start, e.target.value)} />
            </Field>
            <Field label="Horário da partida" hint="usado na contagem regressiva">
              <Input type="time" value={s.departureTime} onChange={(e) => set({ departureTime: e.target.value || '00:00' })} />
            </Field>
          </div>
        </Section>

        <Section title="Dinheiro" description="Esses valores alimentam o orçamento e a meta.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberSetting label="Orçamento total" prefix="R$" value={s.totalBudget} onCommit={(n) => set({ totalBudget: n })} max={10_000_000} />
            <NumberSetting label="Meta financeira" prefix="R$" value={s.savingsGoal} onCommit={(n) => set({ savingsGoal: n })} max={10_000_000} />
            <Field label="Moeda" hint="valores do app em reais">
              <Select value={s.currency} disabled options={[{ value: 'BRL', label: 'Real brasileiro (R$)' }]} />
            </Field>
            <NumberSetting label="Taxa de câmbio (¥ por R$ 1)" prefix="¥" value={s.exchangeRate} step={0.01} onCommit={(n) => set({ exchangeRate: n, exchangeRateUpdatedAt: todayISO() })} max={10000} hint="informe a cotação real" />
          </div>
        </Section>

        <Section title="Mala">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberSetting label="Limite de bagagem (kg)" value={s.baggageLimitKg} min={1} max={200} step={0.5} onCommit={(n) => set({ baggageLimitKg: n })} />
          </div>
        </Section>

        <Section title="Aparência e preferências">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[13px] font-medium text-muted">Tema</p>
              <Segmented
                value={s.theme}
                onChange={(theme) => set({ theme })}
                options={[
                  { value: 'light', label: <span className="inline-flex items-center gap-1.5"><Sun size={15} />Claro</span> },
                  { value: 'dark', label: <span className="inline-flex items-center gap-1.5"><Moon size={15} />Escuro</span> },
                  { value: 'system', label: <span className="inline-flex items-center gap-1.5"><Monitor size={15} />Sistema</span> },
                ]}
              />
            </div>
            <Field label="Mensagem de progresso" hint="“Você está 68% …”">
              <Select value={s.addressForm} onChange={(e) => set({ addressForm: e.target.value as SettingsType['addressForm'] })} options={[{ value: 'preparada', label: 'preparada' }, { value: 'preparado', label: 'preparado' }, { value: 'neutro', label: 'pronto(a)' }]} />
            </Field>
            <Toggle checked={s.hideSensitive} onChange={(v) => set({ hideSensitive: v })} label="Ocultar números sensíveis" description="Mascara números de documentos e códigos de reserva na tela." />
          </div>
        </Section>

        <Section title="Dados" description={`Salvos automaticamente no ${storageName === 'localStorage' ? 'armazenamento local deste navegador' : storageName}. Exporte backups com frequência.`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button icon={<Download size={17} />} onClick={exportData}>Exportar dados (JSON)</Button>
            <Button icon={<Upload size={17} />} onClick={() => fileRef.current?.click()}>Importar dados</Button>
            <Button icon={<RotateCcw size={17} />} onClick={() => setConfirm('sample')}>Carregar dados de exemplo</Button>
            <Button variant="danger" icon={<Eraser size={17} />} onClick={() => setConfirm('empty')}>Começar do zero</Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <p className="mt-4 flex items-center gap-2 text-xs text-faint"><Database size={13} /> Atualmente: {counts(data)}.</p>
        </Section>

        <p className="pb-4 text-center text-xs text-faint">Japan Trip Planner · seus dados não saem deste aparelho</p>
      </div>

      <ConfirmDialog
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        title="Importar backup?"
        message={pendingImport ? `Os dados atuais serão substituídos por: ${counts(pendingImport)}. Exporte um backup antes se quiser guardar os atuais.` : ''}
        confirmLabel="Substituir"
        onConfirm={() => {
          if (pendingImport) {
            actions.replaceAll(pendingImport)
            remount(pendingImport)
            toast('Dados importados')
          }
        }}
      />
      <ConfirmDialog
        open={confirm === 'empty'}
        onClose={() => setConfirm(null)}
        title="Começar do zero?"
        message="Todos os itens (roteiro, gastos, tarefas, listas…) serão apagados. As configurações voltam ao padrão. Essa ação não pode ser desfeita."
        confirmLabel="Apagar tudo"
        onConfirm={() => {
          actions.startEmpty()
          remount(createEmptyData())
          toast('Tudo limpo. Boa organização!')
        }}
      />
      <ConfirmDialog
        open={confirm === 'sample'}
        onClose={() => setConfirm(null)}
        title="Carregar dados de exemplo?"
        message="Seus dados atuais serão substituídos pelos dados fictícios de demonstração."
        confirmLabel="Carregar exemplo"
        onConfirm={() => {
          actions.loadSample()
          remount(createSampleData())
          toast('Dados de exemplo carregados')
        }}
      />
    </div>
  )
}
