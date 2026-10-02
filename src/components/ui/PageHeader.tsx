import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, action, kanji }: { title: string; subtitle?: ReactNode; action?: ReactNode; kanji?: string }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {kanji && <p className="font-display mb-1 text-xs tracking-[0.3em] text-accent">{kanji}</p>}
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="hidden shrink-0 md:block">{action}</div>}
    </header>
  )
}
