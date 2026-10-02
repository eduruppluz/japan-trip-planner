const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const int = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const dec2 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export const safeNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/** R$ 1.234,56 */
export const money = (v: number) => brl.format(safeNum(v))
/** R$ 1.235 (sem centavos, para cards) */
export const money0 = (v: number) => brl0.format(safeNum(v))
/** ¥ 10.000 */
export const yen = (v: number) => '¥ ' + int.format(safeNum(v))
/** Taxa de câmbio com até 2 casas: ¥ 27,5 */
export const yenRate = (v: number) => '¥ ' + dec2.format(safeNum(v))
export const kg = (v: number) => `${num.format(safeNum(v))} kg`
export const fmtNum = (v: number) => num.format(safeNum(v))

export const pct = (part: number, total: number) => (total > 0 ? Math.round((safeNum(part) / total) * 100) : 0)
export const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v))

/** Pluralização simples em português. */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Oculta a maior parte de um número de documento: "•••• 1234". */
export function maskSensitive(value: string): string {
  const v = value.trim()
  if (!v) return '—'
  if (v.length <= 4) return '••••'
  return '•••• ' + v.slice(-4)
}

/** Normaliza texto para busca (sem acentos, minúsculo). */
export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function isSafeUrl(url: string): boolean {
  if (!url) return true
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** Link de busca no Google Maps (apenas uma URL — nenhuma API é chamada). */
export function mapsSearchUrl(...parts: string[]): string {
  const q = parts.filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}
