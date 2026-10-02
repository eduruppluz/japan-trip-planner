import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button, IconButton } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

let openCount = 0

/** Modal: bottom-sheet no celular, diálogo centralizado no desktop. */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    openCount++
    document.body.style.overflow = 'hidden'
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    // foca o primeiro campo apenas em telas grandes (no celular, abriria o teclado)
    const t = setTimeout(() => {
      if (window.matchMedia('(min-width: 768px)').matches)
        panel.current?.querySelector<HTMLElement>('input:not([type=checkbox]), select, textarea')?.focus()
      else panel.current?.focus()
    }, 60)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      openCount--
      if (openCount === 0) document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        className={cn(
          'animate-sheet-up relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-surface shadow-float outline-none md:rounded-[28px]',
          size === 'lg' ? 'md:max-w-2xl' : 'md:max-w-lg',
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line md:hidden" />
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 md:px-6 md:pt-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <IconButton label="Fechar" onClick={onClose} icon={<X size={20} />} className="-mr-2" />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6">{children}</div>
        {footer && <div className="pb-safe border-t border-line px-5 pt-3 md:px-6 md:pb-5"><div className="pb-3 md:pb-0">{footer}</div></div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Excluir', tone = 'danger' }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message?: ReactNode; confirmLabel?: string; tone?: 'danger' | 'primary' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button full onClick={onClose}>Cancelar</Button>
          <Button
            full
            variant={tone === 'danger' ? 'accent' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {message && <p className="text-[15px] text-muted">{message}</p>}
    </Modal>
  )
}
