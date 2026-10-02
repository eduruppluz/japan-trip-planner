// ============================================================
// Normalização/validação de dados. Usado ao carregar do storage
// e ao importar JSON: preenche campos ausentes, descarta lixo e
// garante que o app nunca quebre com dados incompletos.
// ============================================================
import type { AppData, BudgetPlan, CollectionKey, Settings } from '@/types'
import { BUDGET_CATEGORY_KEYS } from '@/data/constants'
import { DEFAULT_SETTINGS, SCHEMA_VERSION, createEmptyData, defaultBudgetPlan } from '@/data/seed'
import { uid } from '@/utils/id'

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Mantém o tipo do valor padrão; se o valor recebido tiver outro tipo, usa o padrão. */
function coerce<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null) return fallback
  if (typeof fallback === 'number') {
    const n = Number(value)
    return (Number.isFinite(n) ? n : fallback) as T
  }
  if (typeof fallback === 'string') return (typeof value === 'string' ? value.slice(0, 5000) : fallback) as T
  if (typeof fallback === 'boolean') return (typeof value === 'boolean' ? value : fallback) as T
  return value as T
}

const COLLECTION_KEYS: CollectionKey[] = [
  'itinerary', 'flights', 'hotels', 'expenses', 'savings', 'tasks',
  'packing', 'places', 'restaurants', 'shopping', 'documents', 'info',
]

/** Campos obrigatórios mínimos por coleção (item sem eles é descartado). */
const REQUIRED: Record<CollectionKey, string> = {
  itinerary: 'title', flights: 'direction', hotels: 'name', expenses: 'amount', savings: 'amount',
  tasks: 'name', packing: 'name', places: 'name', restaurants: 'name', shopping: 'product',
  documents: 'type', info: 'title',
}

function normalizeCollection(key: CollectionKey, raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return []
  const now = new Date().toISOString()
  const ids = new Set<string>()
  return raw
    .filter((r): r is Obj => isObj(r) && r[REQUIRED[key]] !== undefined && r[REQUIRED[key]] !== '')
    .map((r) => {
      let id = typeof r.id === 'string' && r.id ? r.id : uid()
      if (ids.has(id)) id = uid()
      ids.add(id)
      return {
        ...r,
        id,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
        updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now,
      }
    })
    .slice(0, 5000)
}

export function normalizeSettings(raw: unknown): Settings {
  const r = isObj(raw) ? raw : {}
  const s = {} as Record<string, unknown>
  for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
    s[k] = def === null ? (typeof r[k] === 'string' ? r[k] : null) : coerce(r[k], def)
  }
  const out = s as unknown as Settings
  if (!['light', 'dark', 'system'].includes(out.theme)) out.theme = 'system'
  if (!['preparada', 'preparado', 'neutro'].includes(out.addressForm)) out.addressForm = 'preparada'
  return out
}

function normalizeBudgetPlan(raw: unknown): BudgetPlan {
  const plan = defaultBudgetPlan()
  if (!isObj(raw)) return plan
  for (const k of BUDGET_CATEGORY_KEYS) {
    const e = raw[k]
    if (isObj(e)) plan[k] = { planned: Math.max(0, coerce(e.planned, 0)), auto: coerce(e.auto, plan[k].auto) }
  }
  return plan
}

/** Converte qualquer entrada em um AppData válido (nunca lança). */
export function normalizeData(raw: unknown): AppData {
  const base = createEmptyData()
  if (!isObj(raw)) return base
  const data = { ...base } as AppData
  data.schemaVersion = SCHEMA_VERSION
  data.settings = normalizeSettings(raw.settings)
  data.budgetPlan = normalizeBudgetPlan(raw.budgetPlan)
  for (const k of COLLECTION_KEYS) {
    // `info` ausente => mantém as informações úteis padrão
    if (k === 'info' && !Array.isArray(raw.info)) continue
    ;(data as unknown as Record<string, unknown>)[k] = normalizeCollection(k, raw[k])
  }
  data.log = Array.isArray(raw.log)
    ? raw.log.filter((l): l is AppData['log'][number] => isObj(l) && typeof l.text === 'string').slice(0, 50)
    : []
  return data
}

/** Validação de arquivo importado: exige ao menos a assinatura do app. */
export function validateImport(raw: unknown): { ok: true; data: AppData } | { ok: false; error: string } {
  if (!isObj(raw)) return { ok: false, error: 'O arquivo não contém um objeto JSON válido.' }
  const payload = isObj(raw.data) && raw.app === 'japan-trip-planner' ? raw.data : raw
  if (!isObj(payload) || (!isObj(payload.settings) && !COLLECTION_KEYS.some((k) => Array.isArray(payload[k]))))
    return { ok: false, error: 'Este arquivo não parece ser um backup do Japan Trip Planner.' }
  return { ok: true, data: normalizeData(payload) }
}

export function buildExport(data: AppData) {
  return { app: 'japan-trip-planner', exportedAt: new Date().toISOString(), schemaVersion: SCHEMA_VERSION, data }
}
