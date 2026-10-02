import { useEffect } from 'react'
import type { Theme } from '@/types'

/** Aplica a classe .dark no <html> conforme a preferência (e acompanha o sistema). */
export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0E0E10' : '#FAF9F6')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
