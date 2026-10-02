import { useState } from 'react'
import { ArrowDownUp, Pencil, Plus } from 'lucide-react'
import type { Draft } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { useNow } from '@/hooks/useNow'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { useToast } from '@/components/ui/Toast'
import { INFO_SECTIONS, INFO_SECTION_OPTIONS } from '@/data/constants'
import { fmtDate, todayISO } from '@/utils/dates'
import { money, yen, yenRate } from '@/utils/format'

function Clock({ zone, label, now }: { zone: string; label: string; now: number }) {
  const time = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(now)
  const day = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, weekday: 'short', day: '2-digit', month: 'short' }).format(now)
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="tabular text-[28px] leading-tight font-semibold tracking-tight">{time}</p>
      <p className="text-xs text-faint">{day}</p>
    </div>
  )
}

export default function Info() {
  const { data, actions } = useStore()
  const toast = useToast()
  const s = data.settings
  const now = useNow(15000)
  const [dir, setDir] = useState<'brl' | 'jpy'>('brl')
  const [amount, setAmount] = useState('100')
  const [rateOpen, setRateOpen] = useState(false)
  const [rateInput, setRateInput] = useState('')

  const rate = s.exchangeRate
  const value = Number(amount.replace(',', '.')) || 0
  const converted = dir === 'brl' ? value * rate : rate > 0 ? value / rate : 0

  const editor = useEntityEditor('info', {
    noun: 'informação',
    gender: 'f',
    empty: (): Draft<'info'> => ({ section: 'outros', title: '', content: '' }),
  })
  const fields: FieldDef<Draft<'info'>>[] = [
    { name: 'section', label: 'Seção', type: 'select', required: true, options: INFO_SECTION_OPTIONS },
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'content', label: 'Conteúdo', type: 'textarea', required: true },
  ]

  const saveRate = () => {
    const n = Number(rateInput.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0 || n > 10000) return toast('Informe uma taxa válida (ex.: 27,5)', { tone: 'error' })
    actions.updateSettings({ exchangeRate: n, exchangeRateUpdatedAt: todayISO() })
    setRateOpen(false)
    toast('Taxa de câmbio atualizada')
  }

  const sections = INFO_SECTION_OPTIONS.map((o) => ({ ...o, items: data.info.filter((i) => i.section === o.value) })).filter((g) => g.items.length)

  return (
    <div>
      <PageHeader title="Informações úteis" kanji="情報" subtitle="Câmbio, horário e dicas — edite com dados confirmados" action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Nova informação</Button>} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="💴 Conversor de moeda"
            subtitle={rate > 0 ? `R$ 1 = ${yenRate(rate)} · taxa definida por você${s.exchangeRateUpdatedAt ? ` em ${fmtDate(s.exchangeRateUpdatedAt)}` : ''}` : 'Defina a taxa de câmbio para usar o conversor'}
            action={<Button size="sm" icon={<Pencil size={14} />} onClick={() => (setRateInput(rate ? String(rate) : ''), setRateOpen(true))}>Taxa</Button>}
          />
          <div className="p-5">
            {rate > 0 ? (
              <>
                <Field label={dir === 'brl' ? 'Valor em reais (R$)' : 'Valor em ienes (¥)'}>
                  <Input type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} prefix={dir === 'brl' ? 'R$' : '¥'} className="text-lg font-semibold" />
                </Field>
                <div className="my-3 flex justify-center">
                  <IconButton label="Inverter conversão" icon={<ArrowDownUp size={18} />} className="border border-line" onClick={() => (setDir(dir === 'brl' ? 'jpy' : 'brl'), setAmount(String(Math.round(converted * 100) / 100 || '')))} />
                </div>
                <div className="rounded-2xl bg-surface-2 p-4 text-center">
                  <p className="text-xs text-muted">{dir === 'brl' ? 'Em ienes' : 'Em reais'}</p>
                  <p className="tabular text-[30px] font-semibold tracking-tight">{dir === 'brl' ? yen(converted) : money(converted)}</p>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(dir === 'brl' ? [50, 100, 500, 1000] : [1000, 5000, 10000, 50000]).map((n) => (
                    <button key={n} onClick={() => setAmount(String(n))} className="tabular h-10 rounded-xl border border-line text-sm font-medium hover:bg-surface-2">
                      {dir === 'brl' ? n : `${n / 1000}k`}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState compact icon="💱" title="Taxa de câmbio não definida" description="Consulte a cotação do dia (banco, casa de câmbio) e informe quantos ienes vale R$ 1." actionLabel="Definir taxa" onAction={() => (setRateInput(''), setRateOpen(true))} />
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[15px] font-semibold">🕘 Fuso horário</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Clock zone="Asia/Tokyo" label="🇯🇵 Japão (JST)" now={now} />
            <Clock zone="America/Sao_Paulo" label="🇧🇷 Brasília" now={now} />
          </div>
          <p className="mt-4 text-xs text-muted">Horários calculados pelo relógio do seu aparelho.</p>
        </Card>
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-[0.14em] uppercase">Guia rápido</h2>
        <p className="text-xs text-faint">Confirme dados antes da viagem</p>
      </div>
      {sections.length === 0 ? (
        <EmptyState icon="💡" title="Nenhuma informação salva" description="Adicione endereços, telefones e dicas que quer ter à mão." actionLabel="Nova informação" onAction={() => editor.openNew()} />
      ) : (
        <div className="columns-1 gap-4 md:columns-2 [&>*]:mb-4">
          {sections.map((g) => (
            <Card key={g.value} className="break-inside-avoid p-5">
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold tracking-wide text-muted uppercase">{INFO_SECTIONS[g.value].emoji} {g.label}</p>
              <div className="space-y-3">
                {g.items.map((i) => (
                  <button key={i.id} onClick={() => editor.openEdit(i)} className="-m-2 block w-[calc(100%+16px)] rounded-xl p-2 text-left hover:bg-surface-2">
                    <p className="text-[15px] font-medium">{i.title}</p>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted">{i.content}</p>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <EntityFormModal {...editor.formProps} fields={fields} />
      <Modal
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        title="Taxa de câmbio"
        subtitle="Use a cotação real do dia. O app não busca cotações na internet."
        footer={<div className="flex gap-2"><Button full onClick={() => setRateOpen(false)}>Cancelar</Button><Button full variant="primary" onClick={saveRate}>Salvar</Button></div>}
      >
        <form onSubmit={(e) => (e.preventDefault(), saveRate())}>
          <Field label="Quantos ienes vale R$ 1?">
            <Input type="number" inputMode="decimal" min={0} step={0.01} prefix="¥" value={rateInput} onChange={(e) => setRateInput(e.target.value)} placeholder="Ex.: 27,5" />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
