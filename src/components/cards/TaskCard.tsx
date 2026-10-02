import type { Task } from '@/types'
import { Checkbox } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { TASK_CATEGORIES, PRIORITIES } from '@/data/constants'
import { daysFromToday, relativeDayLabel } from '@/utils/dates'
import { cn } from '@/utils/cn'

export function TaskCard({ task, onToggle, onEdit, showCategory }: { task: Task; onToggle: (done: boolean) => void; onEdit: () => void; showCategory?: boolean }) {
  const n = task.dueDate ? daysFromToday(task.dueDate) : null
  const overdue = !task.done && n !== null && n < 0
  const soon = !task.done && n !== null && n >= 0 && n <= 3
  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50">
      <Checkbox checked={task.done} onChange={onToggle} label={`Concluir ${task.name}`} />
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className={cn('block text-[15px] transition-colors', task.done && 'text-faint line-through')}>{task.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {showCategory && <span>{TASK_CATEGORIES[task.category].emoji} {TASK_CATEGORIES[task.category].label}</span>}
          {task.dueDate && !task.done && <span className={cn(overdue && 'font-medium text-accent', soon && 'font-medium text-warning')}>{relativeDayLabel(task.dueDate)}</span>}
          {task.notes && <span className="truncate text-faint">{task.notes}</span>}
        </span>
      </button>
      {task.priority === 'alta' && !task.done && <Badge tone="accent">{PRIORITIES.alta.label}</Badge>}
    </div>
  )
}
