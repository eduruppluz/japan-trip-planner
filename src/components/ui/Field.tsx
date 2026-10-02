import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-ink placeholder:text-faint transition-colors focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5 disabled:opacity-50'

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-medium text-muted">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-faint">{hint}</span>}
    </label>
  )
}

export function Field({ label, hint, error, children, className, htmlFor }: { label?: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor} hint={hint}>{label}</Label>}
      {children}
      {error && <p className="mt-1 text-xs font-medium text-accent">{error}</p>}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; prefix?: string }>(function Input(
  { className, invalid, prefix, ...rest },
  ref,
) {
  if (prefix)
    return (
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-faint">{prefix}</span>
        <input ref={ref} className={cn(control, 'h-11 pl-10', invalid && 'border-accent', className)} {...rest} />
      </div>
    )
  return <input ref={ref} className={cn(control, 'h-11', invalid && 'border-accent', className)} {...rest} />
})

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-[88px] resize-y py-2.5', className)} {...rest} />
}

export interface SelectOption {
  value: string
  label: string
  emoji?: string
}

export function Select({ options, className, placeholder, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-11 appearance-none pr-9', className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.emoji ? `${o.emoji}  ${o.label}` : o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-faint" />
    </div>
  )
}

/** Checkbox redondo com animação — usado em tarefas, mala etc. */
export function Checkbox({ checked, onChange, label, size = 'md', className }: { checked: boolean; onChange: (v: boolean) => void; label: string; size?: 'md' | 'lg'; className?: string }) {
  const dim = size === 'lg' ? 'h-7 w-7' : 'h-6 w-6'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn('grid shrink-0 place-items-center rounded-full p-2 -m-2', className)}
    >
      <span
        className={cn(
          'grid place-items-center rounded-full border-[1.5px] transition-all duration-200',
          dim,
          checked ? 'border-success bg-success text-white' : 'border-faint/70 hover:border-ink',
        )}
      >
        {checked && <Check size={size === 'lg' ? 16 : 14} strokeWidth={3} className="animate-pop" />}
      </span>
    </button>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[15px] font-medium">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-ink' : 'bg-line')}
      >
        <span className={cn('absolute top-1 left-1 h-5 w-5 rounded-full bg-bg shadow transition-transform duration-200', checked && 'translate-x-5')} />
      </button>
    </div>
  )
}

/** Controle segmentado (abas compactas). Rolagem horizontal no celular. */
export function Segmented<T extends string>({ value, onChange, options, className, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div role="tablist" className={cn('no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1', className)}>
      <div className="flex gap-1 rounded-2xl bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-xl font-medium whitespace-nowrap transition-all',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-sm',
              value === o.value ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Chips de filtro roláveis. */
export function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
            value === o.value ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:text-ink',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cn('tabular text-xs', value === o.value ? 'opacity-70' : 'text-faint')}>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
