import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, CircleAlert } from 'lucide-react'

interface ToastItem {
  id: number
  text: string
  tone: 'success' | 'error' | 'neutral'
  action?: { label: string; onClick: () => void }
}
type ShowToast = (text: string, opts?: { tone?: ToastItem['tone']; action?: ToastItem['action'] }) => void

const ToastContext = createContext<ShowToast>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const show = useCallback<ShowToast>((text, opts) => {
    const id = ++seq.current
    setItems((l) => [...l.slice(-2), { id, text, tone: opts?.tone ?? 'success', action: opts?.action }])
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), opts?.action ? 5000 : 2600)
  }, [])
  const dismiss = (id: number) => setItems((l) => l.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className="animate-sheet-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-bg shadow-float">
              {t.tone === 'error' ? <CircleAlert size={18} className="shrink-0 text-accent" /> : <CircleCheck size={18} className="shrink-0 opacity-70" />}
              <span className="flex-1">{t.text}</span>
              {t.action && (
                <button
                  className="-my-1 rounded-lg px-2 py-1 font-semibold underline-offset-2 hover:underline"
                  onClick={() => {
                    t.action!.onClick()
                    dismiss(t.id)
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
