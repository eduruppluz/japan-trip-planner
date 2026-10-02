import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Trash } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Checkbox, Field, Input, Select, Textarea, type SelectOption } from './Field'
import { cn } from '@/utils/cn'
import { isSafeUrl } from '@/utils/format'

// ============================================================
// Formulário genérico guiado por schema. Cada página descreve seus
// campos e recebe um objeto validado — sem repetir JSX de formulário.
// ============================================================

type Values = Record<string, unknown>

export interface FieldDef<V extends Values = Values> {
  name: keyof V & string
  label: string
  type: 'text' | 'number' | 'money' | 'date' | 'time' | 'select' | 'textarea' | 'url' | 'checkbox' | 'rating'
  required?: boolean
  options?: SelectOption[]
  placeholder?: string
  hint?: ReactNode
  min?: number
  max?: number
  step?: number
  /** Ocupa a linha inteira no grid de 2 colunas. */
  full?: boolean
  /** Sugestões (datalist) para campos de texto. */
  suggestions?: string[]
  /** Oculta o campo com base nos valores atuais. */
  hidden?: (values: V) => boolean
  validate?: (value: unknown, values: V) => string | undefined
  /** Texto informativo calculado (ex.: "4 noites · R$ 1.680"). */
  computed?: (values: V) => ReactNode
}

export interface EntityFormProps<V extends Values> {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  fields: FieldDef<V>[]
  initial: V
  onSubmit: (values: V) => void
  onDelete?: () => void
  submitLabel?: string
  /** Conteúdo extra acima dos campos (ex.: aviso). */
  intro?: ReactNode
}

function validateField<V extends Values>(f: FieldDef<V>, values: V): string | undefined {
  const v = values[f.name]
  const empty = v === '' || v === null || v === undefined
  if (f.required && empty) return 'Campo obrigatório'
  if (!empty && (f.type === 'number' || f.type === 'money')) {
    const n = Number(v)
    if (!Number.isFinite(n)) return 'Número inválido'
    if (f.min !== undefined && n < f.min) return `Mínimo ${f.min}`
    if (f.max !== undefined && n > f.max) return `Máximo ${f.max}`
  }
  if (!empty && f.type === 'url' && !isSafeUrl(String(v))) return 'Use um link completo começando com https://'
  if (!empty && typeof v === 'string' && v.length > 2000) return 'Texto muito longo'
  return f.validate?.(v, values)
}

export function EntityFormModal<V extends Values>({ open, onClose, title, subtitle, fields, initial, onSubmit, onDelete, submitLabel = 'Salvar', intro }: EntityFormProps<V>) {
  const [values, setValues] = useState<V>(initial)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [touched, setTouched] = useState(false)

  // Reinicia o formulário sempre que abrir
  useEffect(() => {
    if (open) {
      setValues(initial)
      setErrors({})
      setTouched(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const visible = useMemo(() => fields.filter((f) => !f.hidden?.(values)), [fields, values])

  const set = (name: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value } as V
      if (touched) {
        const f = fields.find((x) => x.name === name)
        if (f) setErrors((e) => ({ ...e, [name]: validateField(f, next) }))
      }
      return next
    })
  }

  const submit = () => {
    const errs: Record<string, string | undefined> = {}
    for (const f of visible) errs[f.name] = validateField(f, values)
    setErrors(errs)
    setTouched(true)
    if (Object.values(errs).some(Boolean)) return
    const out = { ...values } as Values
    for (const f of fields) {
      if (f.type === 'number' || f.type === 'money') out[f.name] = out[f.name] === '' || out[f.name] === undefined ? 0 : Number(out[f.name])
      if (typeof out[f.name] === 'string' && f.type !== 'textarea') out[f.name] = (out[f.name] as string).trim()
    }
    onSubmit(out as V)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="lg"
      footer={
        <div className="flex gap-2">
          {onDelete && (
            <Button variant="danger" onClick={onDelete} icon={<Trash size={17} />} aria-label="Excluir">
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          )}
          <Button className="ml-auto" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit} className="min-w-28">{submitLabel}</Button>
        </div>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {intro && <div className="sm:col-span-2">{intro}</div>}
        {visible.map((f) => {
          const id = `f-${f.name}`
          const err = errors[f.name]
          const v = values[f.name]
          const full = f.full || f.type === 'textarea' || f.type === 'rating'
          const common = { id, 'aria-invalid': !!err || undefined }
          let control: ReactNode
          switch (f.type) {
            case 'textarea':
              control = <Textarea {...common} value={String(v ?? '')} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
              break
            case 'select':
              control = <Select {...common} value={String(v ?? '')} options={f.options ?? []} placeholder={f.required ? undefined : f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
              break
            case 'checkbox':
              control = (
                <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5">
                  <Checkbox checked={!!v} onChange={(c) => set(f.name, c)} label={f.label} />
                  <span className="text-[15px]">{f.placeholder ?? f.label}</span>
                </label>
              )
              break
            case 'rating':
              control = (
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} de 5`}
                      onClick={() => set(f.name, v === n ? 0 : n)}
                      className={cn('h-11 w-11 rounded-xl border text-lg transition-colors', Number(v) >= n ? 'border-warning/40 bg-warning/10' : 'border-line text-faint')}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )
              break
            default: {
              const type = f.type === 'money' ? 'number' : f.type
              control = (
                <>
                  <Input
                    {...common}
                    type={type}
                    inputMode={f.type === 'money' ? 'decimal' : f.type === 'number' ? 'decimal' : undefined}
                    prefix={f.type === 'money' ? 'R$' : undefined}
                    step={f.step ?? (f.type === 'money' ? 0.01 : undefined)}
                    min={f.min}
                    max={f.max}
                    value={v === undefined || v === null ? '' : String(v)}
                    placeholder={f.placeholder}
                    invalid={!!err}
                    list={f.suggestions ? `${id}-list` : undefined}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                  {f.suggestions && (
                    <datalist id={`${id}-list`}>
                      {f.suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </>
              )
            }
          }
          return (
            <Field key={f.name} label={f.type === 'checkbox' ? undefined : f.label} hint={f.hint} error={err} htmlFor={id} className={full ? 'sm:col-span-2' : undefined}>
              {control}
              {f.computed && <div className="mt-1.5 text-xs text-muted">{f.computed(values)}</div>}
            </Field>
          )
        })}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}

/** Estado padrão para um formulário de edição/criação. */
export interface FormState<T> {
  open: boolean
  editing: T | null
}
