import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './Button'

export function EmptyState({ icon, title, description, actionLabel, onAction, compact }: { icon?: ReactNode; title: string; description?: string; actionLabel?: string; onAction?: () => void; compact?: boolean }) {
  return (
    <div className={`animate-fade-up flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'rounded-3xl border border-dashed border-line px-6 py-14'}`}>
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-2xl">{icon}</div>}
      <p className="text-[15px] font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" className="mt-5" onClick={onAction} icon={<Plus size={18} />}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
