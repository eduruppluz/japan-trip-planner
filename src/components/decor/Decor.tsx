/** Elementos gráficos discretos inspirados no Japão (SVG puro, sem imagens externas). */

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <circle cx="16" cy="16" r="6.5" fill="var(--accent)" />
    </svg>
  )
}

/** Monte Fuji em traço fino + sol nascente. Usado no herói do dashboard. */
export function FujiArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 140" className={className} aria-hidden fill="none">
      <circle cx="232" cy="50" r="30" fill="var(--accent)" opacity="0.9" />
      <path d="M0 132 L96 132 L138 64 Q148 50 160 50 Q172 50 182 64 L224 132 L320 132" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M138 64 L148 74 L156 66 L164 76 L172 66 L182 64" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 132 L60 104 L84 118" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M236 132 L268 110 L300 132" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

export function SakuraPetal({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 2c1.8 2.2 2.6 4.2 2.4 6 2-.9 4.2-.9 6.6.2-1 2.6-2.6 4-4.6 4.6 1.6 1.4 2.4 3.4 2.4 6-2.6.2-4.6-.6-6-2.4-.2 1.6-1 3-2.8 4.6-1.4-1.6-2.2-3.2-2.2-5-1.6 1.2-3.6 1.6-6 1.2.4-2.6 1.6-4.4 3.6-5.2C3.6 11 2.4 9.2 2 6.6c2.4-.6 4.6-.2 6.4 1C8.4 5.6 9.6 3.8 12 2z"
      />
    </svg>
  )
}

/** Torii minimalista para estados vazios/cabeçalhos. */
export function ToriiIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 5.5c3 .8 15 .8 18 0" />
      <path d="M5 9h14" />
      <path d="M7 6.2V21M17 6.2V21M12 6.5V9" />
    </svg>
  )
}
