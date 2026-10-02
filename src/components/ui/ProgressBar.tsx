import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'
import { clamp } from '@/utils/format'

type Tone = 'ink' | 'accent' | 'success' | 'warning' | 'sakura'
const fills: Record<Tone, string> = {
  ink: 'bg-ink',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  sakura: 'bg-sakura-ink',
}

/** Barra de progresso com animação de preenchimento. */
export function ProgressBar({ value, tone = 'ink', size = 'md', className, label }: { value: number; tone?: Tone; size?: 'sm' | 'md' | 'lg'; className?: string; label?: string }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const r = requestAnimationFrame(() => setW(clamp(value)))
    return () => cancelAnimationFrame(r)
  }, [value])
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamp(value))}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-surface-2', size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', fills[tone])} style={{ width: `${w}%` }} />
    </div>
  )
}

/** Anel de progresso (SVG). */
export function ProgressRing({ value, size = 64, stroke = 6, tone = 'accent', children }: { value: number; size?: number; stroke?: number; tone?: 'accent' | 'ink' | 'success'; children?: React.ReactNode }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const r = requestAnimationFrame(() => setV(clamp(value)))
    return () => cancelAnimationFrame(r)
  }, [value])
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = tone === 'accent' ? 'var(--accent)' : tone === 'success' ? 'var(--success)' : 'var(--ink)'
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
