import type { Expense } from '@/types'
import { BUDGET_CATEGORIES } from '@/data/constants'
import { fmtDate } from '@/utils/dates'
import { money } from '@/utils/format'

export function ExpenseCard({ expense, onEdit }: { expense: Expense; onEdit: () => void }) {
  const cat = BUDGET_CATEGORIES[expense.category]
  return (
    <button onClick={onEdit} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/60">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg" aria-hidden>{cat.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{expense.description}</span>
        <span className="block truncate text-xs text-muted">{cat.label} · {fmtDate(expense.date)}{expense.paymentMethod ? ` · ${expense.paymentMethod}` : ''}</span>
      </span>
      <span className="tabular shrink-0 font-semibold">{money(expense.amount)}</span>
    </button>
  )
}
