import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Stat({ label, value, hint, tone, className }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'accent' | 'success' | 'warning'; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[11px] font-medium tracking-wide text-muted uppercase sm:text-xs">{label}</p>
      <p className={cn('tabular mt-1 text-[17px] leading-tight font-semibold tracking-tight break-words sm:text-xl', tone === 'accent' && 'text-accent', tone === 'success' && 'text-success', tone === 'warning' && 'text-warning')}>{value}</p>
      {hint && <p className="mt-0.5 text-xs leading-snug text-faint">{hint}</p>}
    </div>
  )
}
