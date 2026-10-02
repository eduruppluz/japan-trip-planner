import { Plus } from 'lucide-react'

/** Botão flutuante de adicionar — só no celular, acima da navegação inferior. */
export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="animate-pop fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-bg shadow-float transition-transform active:scale-95 md:hidden"
    >
      <Plus size={24} />
    </button>
  )
}
