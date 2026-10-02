import { useMemo, useSyncExternalStore } from 'react'

/**
 * Roteador mínimo baseado em hash (#/rota?x=y).
 * Funciona abrindo o HTML direto do disco (file://) e em qualquer
 * hospedagem estática, sem configuração de servidor.
 */
export interface Route {
  path: string
  query: URLSearchParams
}

function read(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/dashboard'
  const [path, qs = ''] = raw.split('?')
  return { path: path === '/' || !path ? '/dashboard' : path, query: new URLSearchParams(qs) }
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const snapshot = () => window.location.hash

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, snapshot, () => '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(read, [hash])
}

export function navigate(to: string) {
  const target = to.startsWith('#') ? to : '#' + to
  if (window.location.hash !== target) window.location.hash = target
}

/** Atualiza um parâmetro da query sem criar nova rota. */
export function setQueryParam(key: string, value: string | null) {
  const { path, query } = read()
  if (value === null) query.delete(key)
  else query.set(key, value)
  const qs = query.toString()
  const next = '#' + path + (qs ? '?' + qs : '')
  history.replaceState(null, '', next)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
