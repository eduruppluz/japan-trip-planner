import { useEffect, type ComponentType } from 'react'
import { StoreProvider, useStore } from '@/services/store'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { useHashRoute } from '@/hooks/useHashRoute'
import { useApplyTheme } from '@/hooks/useTheme'
import { LogoMark } from '@/components/decor/Decor'
import { NAV_ITEMS } from '@/data/navigation'
import Dashboard from '@/pages/Dashboard'
import Itinerary from '@/pages/Itinerary'
import Flights from '@/pages/Flights'
import Hotels from '@/pages/Hotels'
import Budget from '@/pages/Budget'
import Checklist from '@/pages/Checklist'
import Packing from '@/pages/Packing'
import Places from '@/pages/Places'
import Restaurants from '@/pages/Restaurants'
import Shopping from '@/pages/Shopping'
import Documents from '@/pages/Documents'
import Info from '@/pages/Info'
import CalendarPage from '@/pages/CalendarPage'
import SettingsPage from '@/pages/Settings'

const ROUTES: Record<string, ComponentType> = {
  '/dashboard': Dashboard,
  '/roteiro': Itinerary,
  '/voos': Flights,
  '/hospedagem': Hotels,
  '/orcamento': Budget,
  '/checklist': Checklist,
  '/mala': Packing,
  '/lugares': Places,
  '/restaurantes': Restaurants,
  '/compras': Shopping,
  '/documentos': Documents,
  '/informacoes': Info,
  '/calendario': CalendarPage,
  '/configuracoes': SettingsPage,
}

function Shell() {
  const { ready, data, saveError } = useStore()
  const route = useHashRoute()
  const toast = useToast()
  useApplyTheme(data.settings.theme)

  useEffect(() => {
    if (saveError) toast('Não foi possível salvar neste navegador. Exporte um backup em Configurações.', { tone: 'error' })
  }, [saveError, toast])

  useEffect(() => {
    const item = NAV_ITEMS.find((n) => n.path === route.path)
    document.title = item && item.path !== '/dashboard' ? `${item.label} · Japan Trip Planner` : 'Japan Trip Planner'
    window.scrollTo({ top: 0 })
  }, [route.path])

  if (!ready)
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="animate-pulse"><LogoMark size={44} /></div>
      </div>
    )

  const Page = ROUTES[route.path] ?? Dashboard
  const current = ROUTES[route.path] ? route.path : '/dashboard'
  return (
    <AppLayout current={current}>
      <Page />
    </AppLayout>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  )
}
