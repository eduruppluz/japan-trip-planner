import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TimelineItem {
  id: string
  marker?: ReactNode
  title: ReactNode
  meta?: ReactNode
  aside?: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'muted'
  onClick?: () => void
}

/** Linha do tempo vertical genérica (hospedagens, voos, histórico). */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative">
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-4 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute top-6 bottom-0 left-[11px] w-px bg-line" aria-hidden />}
          <span
            className={cn(
              'relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 bg-surface text-[10px] font-bold',
              it.tone === 'accent' ? 'border-accent text-accent' : it.tone === 'success' ? 'border-success text-success' : it.tone === 'muted' ? 'border-line text-faint' : 'border-ink text-ink',
            )}
          >
            {it.marker}
          </span>
          <div
            role={it.onClick ? 'button' : undefined}
            tabIndex={it.onClick ? 0 : undefined}
            onClick={it.onClick}
            onKeyDown={(e) => it.onClick && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), it.onClick())}
            className={cn('-mt-1 flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl p-1', it.onClick && 'cursor-pointer hover:bg-surface-2')}
          >
            <div className="min-w-0">
              <div className="truncate text-[15px] font-medium">{it.title}</div>
              {it.meta && <div className="mt-0.5 text-sm text-muted">{it.meta}</div>}
            </div>
            {it.aside && <div className="shrink-0 text-right">{it.aside}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
