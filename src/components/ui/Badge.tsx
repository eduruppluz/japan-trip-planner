import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'info' | 'sakura' | 'ink'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  info: 'bg-info/12 text-info',
  sakura: 'bg-sakura text-sakura-ink',
  ink: 'bg-ink text-bg',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  )
}
