import {
  BedDouble, CalendarDays, CalendarRange, Ellipsis, FileText, House, Lightbulb, ListChecks,
  Luggage, MapPin, Plane, Settings, ShoppingBag, UtensilsCrossed, Wallet, type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  short?: string
  icon: LucideIcon
  group: 'main' | 'plan' | 'lists' | 'system'
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', short: 'Início', icon: House, group: 'main' },
  { path: '/roteiro', label: 'Roteiro', icon: CalendarRange, group: 'main' },
  { path: '/calendario', label: 'Calendário', icon: CalendarDays, group: 'main' },
  { path: '/voos', label: 'Voos', icon: Plane, group: 'plan' },
  { path: '/hospedagem', label: 'Hospedagem', icon: BedDouble, group: 'plan' },
  { path: '/orcamento', label: 'Orçamento', icon: Wallet, group: 'plan' },
  { path: '/checklist', label: 'Checklist', icon: ListChecks, group: 'plan' },
  { path: '/documentos', label: 'Documentos', icon: FileText, group: 'plan' },
  { path: '/lugares', label: 'Lugares', short: 'Mapa', icon: MapPin, group: 'lists' },
  { path: '/restaurantes', label: 'Restaurantes', icon: UtensilsCrossed, group: 'lists' },
  { path: '/compras', label: 'Compras', icon: ShoppingBag, group: 'lists' },
  { path: '/mala', label: 'Mala', icon: Luggage, group: 'lists' },
  { path: '/informacoes', label: 'Informações úteis', short: 'Informações', icon: Lightbulb, group: 'system' },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, group: 'system' },
]

export const NAV_GROUP_LABELS: Record<NavItem['group'], string> = {
  main: '',
  plan: 'Planejamento',
  lists: 'Listas',
  system: 'Geral',
}

/** Itens fixos da navegação inferior no celular (o 5º é "Mais"). */
export const BOTTOM_NAV = ['/dashboard', '/roteiro', '/lugares', '/checklist']
export const MoreIcon = Ellipsis
