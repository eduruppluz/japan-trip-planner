import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { FujiArt, SakuraPetal } from '@/components/decor/Decor'
import { cn } from '@/utils/cn'

/** Número que "rola" suavemente quando muda. */
function Unit({ value, label, big }: { value: number; label: string; big?: boolean }) {
  const [flash, setFlash] = useState(false)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 250)
      return () => clearTimeout(t)
    }
  }, [value])
  return (
    <div className="min-w-0 text-center">
      <p
        className={cn(
          'tabular leading-none font-semibold tracking-tight transition-all duration-300',
          big ? 'text-[56px] sm:text-[72px]' : 'text-[28px] sm:text-[36px]',
          flash ? '-translate-y-0.5 opacity-70' : 'opacity-100',
        )}
      >
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">{label}</p>
    </div>
  )
}

export function CountdownHero({ startDate, endDate, departureTime, flag, title, subtitle }: { startDate: string; endDate: string; departureTime: string; flag: string; title: string; subtitle: string }) {
  const c = useCountdown(startDate, endDate, departureTime)
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-line bg-surface p-6 shadow-soft sm:p-8">
      <FujiArt className="pointer-events-none absolute -right-6 -bottom-2 hidden w-[340px] text-ink/15 md:block" />
      {/* No celular: apenas o sol nascente discreto, sem competir com os números */}
      <span className="pointer-events-none absolute top-6 right-6 h-10 w-10 rounded-full bg-accent/90 md:hidden" aria-hidden />
      <SakuraPetal className="pointer-events-none absolute top-6 right-8 hidden text-sakura-ink/40 md:block" size={16} />
      <div className="relative pr-12 md:pr-0">
        <p className="text-sm font-medium text-muted">
          <span className="mr-1.5">{flag}</span>
          {subtitle}
        </p>
        <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-tight sm:text-[34px]">{title}</h1>

        {c.phase === 'before' && (
          <div className="mt-7">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-accent uppercase">Faltam</p>
            <div className="mt-3 flex items-end gap-5 sm:gap-8">
              <Unit value={c.days} label={c.days === 1 ? 'dia' : 'dias'} big />
              <div className="grid grid-cols-3 gap-3 pb-1 sm:gap-6">
                <Unit value={c.hours} label="horas" />
                <Unit value={c.minutes} label="min" />
                <Unit value={c.seconds} label="seg" />
              </div>
            </div>
          </div>
        )}
        {c.phase === 'during' && (
          <div className="mt-7">
            <p className="text-[40px] leading-none font-semibold tracking-tight sm:text-[56px]">Boa viagem! 🇯🇵</p>
            <p className="mt-3 text-muted">Hoje é o dia {c.tripDay} da viagem. Aproveite cada momento.</p>
          </div>
        )}
        {c.phase === 'after' && (
          <div className="mt-7">
            <p className="text-[34px] leading-none font-semibold tracking-tight sm:text-[48px]">おかえり — bem-vindo(a) de volta!</p>
            <p className="mt-3 text-muted">A viagem terminou. Seus dados continuam salvos aqui.</p>
          </div>
        )}
        {c.phase === 'invalid' && (
          <p className="mt-6 text-muted">
            Defina a data da viagem em <a className="font-medium text-ink underline" href="#/configuracoes">Configurações</a> para iniciar a contagem.
          </p>
        )}
      </div>
    </section>
  )
}
