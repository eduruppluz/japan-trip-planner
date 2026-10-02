import { useState, type ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { NAV_ITEMS, NAV_GROUP_LABELS, BOTTOM_NAV, MoreIcon, type NavItem } from '@/data/navigation'
import { navigate } from '@/hooks/useHashRoute'
import { useTrip } from '@/services/store'
import { daysFromToday } from '@/utils/dates'
import { cn } from '@/utils/cn'
import { LogoMark } from '@/components/decor/Decor'
import { Modal } from '@/components/ui/Modal'

function useDaysLabel() {
  const { settings } = useTrip()
  const n = daysFromToday(settings.startDate)
  const end = daysFromToday(settings.endDate)
  if (n === null) return 'Defina a data'
  if (n > 1) return `Faltam ${n} dias`
  if (n === 1) return 'É amanhã!'
  if (end !== null && end >= 0) return 'Em viagem 🇯🇵'
  return 'Viagem concluída'
}

const isActive = (current: string, path: string) => current === path || current.startsWith(path + '/')

function Sidebar({ current }: { current: string }) {
  const { settings } = useTrip()
  const days = useDaysLabel()
  const groups = (['main', 'plan', 'lists', 'system'] as const).map((g) => ({ g, items: NAV_ITEMS.filter((i) => i.group === g) }))
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-surface/70 backdrop-blur-xl lg:flex">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-6 pt-7 pb-6 text-left">
        <LogoMark size={36} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight">{settings.tripName || 'Japão'}</p>
          <p className="text-xs text-muted">{days}</p>
        </div>
      </button>
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-6" aria-label="Principal">
        {groups.map(({ g, items }) => (
          <div key={g} className="mb-4">
            {NAV_GROUP_LABELS[g] && <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-faint uppercase">{NAV_GROUP_LABELS[g]}</p>}
            {items.map((item) => (
              <SideLink key={item.path} item={item} active={isActive(current, item.path)} />
            ))}
          </div>
        ))}
      </nav>
      <p className="font-display px-6 pb-6 text-xs tracking-[0.35em] text-faint">日本への旅</p>
    </aside>
  )
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <a
      href={'#' + item.path}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors',
        active ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2/60 hover:text-ink',
      )}
    >
      {active && <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-accent" />}
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
    </a>
  )
}

function MobileTopBar() {
  const { settings } = useTrip()
  const days = useDaysLabel()
  return (
    <div className="pt-safe sticky top-0 z-20 border-b border-line/60 bg-bg/80 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <button onClick={() => navigate('/dashboard')} className="flex min-w-0 items-center gap-2.5" aria-label="Ir para o início">
          <LogoMark size={28} />
          <span className="truncate text-[15px] font-semibold tracking-tight">{settings.tripName || 'Japão'}</span>
        </button>
        <span className="tabular ml-auto shrink-0 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">{days}</span>
        <a href="#/configuracoes" aria-label="Configurações" className="-mr-2 grid h-10 w-10 place-items-center rounded-xl text-muted">
          <Settings size={20} />
        </a>
      </div>
    </div>
  )
}

function BottomNav({ current }: { current: string }) {
  const [more, setMore] = useState(false)
  const items = BOTTOM_NAV.map((p) => NAV_ITEMS.find((i) => i.path === p)!)
  const moreActive = !BOTTOM_NAV.some((p) => isActive(current, p))
  const rest = NAV_ITEMS.filter((i) => !BOTTOM_NAV.includes(i.path))
  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/85 backdrop-blur-xl lg:hidden" aria-label="Navegação inferior">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(current, item.path)
            return (
              <a key={item.path} href={'#' + item.path} aria-current={active ? 'page' : undefined} className={cn('flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', active ? 'text-ink' : 'text-faint')}>
                <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', active && 'bg-surface-2')}>
                  <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                {item.short ?? item.label}
              </a>
            )
          })}
          <button onClick={() => setMore(true)} className={cn('flex flex-col items-center justify-center gap-1 text-[11px] font-medium', moreActive ? 'text-ink' : 'text-faint')} aria-haspopup="dialog">
            <span className={cn('grid h-7 w-12 place-items-center rounded-full', moreActive && 'bg-surface-2')}>
              <MoreIcon size={21} />
            </span>
            Mais
          </button>
        </div>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title="Todas as seções">
        <div className="grid grid-cols-3 gap-2 pb-2">
          {rest.map((item) => {
            const Icon = item.icon
            const active = isActive(current, item.path)
            return (
              <a
                key={item.path}
                href={'#' + item.path}
                onClick={() => setMore(false)}
                className={cn('flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border text-center text-[13px] font-medium transition-colors', active ? 'border-ink bg-surface-2' : 'border-line hover:bg-surface-2')}
              >
                <Icon size={22} strokeWidth={1.8} className={active ? 'text-accent' : 'text-muted'} />
                <span className="px-1 leading-tight">{item.short ?? item.label}</span>
              </a>
            )
          })}
        </div>
      </Modal>
    </>
  )
}

export function AppLayout({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Sidebar current={current} />
      <MobileTopBar />
      <main className="lg:pl-[264px]">
        <div key={current} className="animate-fade-up mx-auto max-w-5xl px-4 pt-6 pb-[calc(112px+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          {children}
        </div>
      </main>
      <BottomNav current={current} />
    </div>
  )
}
