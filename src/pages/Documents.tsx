import { useState } from 'react'
import { ExternalLink, Eye, EyeOff, Lock, Plus } from 'lucide-react'
import type { Draft, TravelDocument } from '@/types'
import { useStore } from '@/services/store'
import { useEntityEditor } from '@/hooks/useEntityEditor'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Badge, type Tone } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { EntityFormModal, type FieldDef } from '@/components/ui/EntityForm'
import { Fab } from '@/components/ui/Fab'
import { daysFromToday, fmtDate } from '@/utils/dates'
import { maskSensitive } from '@/utils/format'

const DOC_TYPES = ['Passaporte', 'Seguro viagem', 'RG', 'CNH / Permissão internacional', 'Cartão de vacina', 'Comprovante de hospedagem', 'Passagem aérea', 'Cartão de crédito (apenas final)', 'Outro']

function expiryStatus(doc: TravelDocument, tripEnd: string): { tone: Tone; label: string } | null {
  if (!doc.expiryDate) return null
  const n = daysFromToday(doc.expiryDate)
  if (n === null) return null
  if (n < 0) return { tone: 'accent', label: 'Vencido' }
  if (doc.expiryDate <= tripEnd) return { tone: 'accent', label: 'Vence antes do fim da viagem' }
  if (n <= 180) return { tone: 'warning', label: `Vence em ${n} dias` }
  return { tone: 'success', label: 'Válido' }
}

export default function Documents() {
  const { data } = useStore()
  const s = data.settings
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const editor = useEntityEditor('documents', {
    noun: 'documento',
    empty: (): Draft<'documents'> => ({ type: '', number: '', expiryDate: '', link: '', notes: '' }),
  })
  const fields: FieldDef<Draft<'documents'>>[] = [
    { name: 'type', label: 'Tipo de documento', type: 'text', required: true, full: true, suggestions: DOC_TYPES },
    { name: 'number', label: 'Número', type: 'text', hint: 'opcional · fica mascarado', placeholder: 'Evite dados que não precisa guardar' },
    { name: 'expiryDate', label: 'Validade', type: 'date', hint: 'gera alertas' },
    { name: 'link', label: 'Link para o arquivo', type: 'url', full: true, placeholder: 'https:// (ex.: pasta no seu drive)' },
    { name: 'notes', label: 'Observação', type: 'textarea' },
  ]

  const docs = [...data.documents].sort((a, b) => (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999'))

  return (
    <div>
      <PageHeader title="Documentos" kanji="書類" subtitle="Validades, números e links importantes" action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => editor.openNew()}>Adicionar documento</Button>} />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-surface-2/60 p-4 text-sm text-muted">
        <Lock size={16} className="mt-0.5 shrink-0" />
        <p>Os dados ficam salvos só neste navegador/aparelho. Números aparecem mascarados{s.hideSensitive ? '' : ' (desativado em Configurações)'}. Não guarde senhas, CVV ou números completos de cartão.</p>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon="📄" title="Nenhum documento cadastrado" description="Cadastre passaporte e seguro com a validade para receber alertas automáticos." actionLabel="Adicionar documento" onAction={() => editor.openNew()} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {docs.map((d) => {
            const st = expiryStatus(d, s.endDate)
            const show = !s.hideSensitive || revealed[d.id]
            return (
              <Card key={d.id} interactive onClick={() => editor.openEdit(d)} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[16px] font-semibold tracking-tight">{d.type}</p>
                  {st ? <Badge tone={st.tone}>{st.label}</Badge> : <Badge>Sem validade</Badge>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <p className="tabular flex-1 font-mono text-sm text-muted">{d.number ? (show ? d.number : maskSensitive(d.number)) : 'Número não informado'}</p>
                  {d.number && s.hideSensitive && (
                    <IconButton
                      label={show ? 'Ocultar número' : 'Mostrar número'}
                      className="h-8 w-8"
                      icon={show ? <EyeOff size={15} /> : <Eye size={15} />}
                      onClick={(e) => (e.stopPropagation(), setRevealed((r) => ({ ...r, [d.id]: !r[d.id] })))}
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted">Validade: <span className="tabular text-ink">{d.expiryDate ? fmtDate(d.expiryDate) : '—'}</span></span>
                  {d.link && (
                    <a href={d.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium hover:bg-surface-2">
                      Arquivo <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {d.notes && <p className="mt-2 text-sm text-muted">{d.notes}</p>}
              </Card>
            )
          })}
        </div>
      )}
      <Fab label="Adicionar documento" onClick={() => editor.openNew()} />
      <EntityFormModal {...editor.formProps} fields={fields} />
    </div>
  )
}
