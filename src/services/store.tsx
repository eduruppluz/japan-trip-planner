// ============================================================
// Store global: estado + ações. Toda escrita passa por aqui,
// e a persistência é feita via StorageAdapter (debounce).
// ============================================================
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppData, BudgetCategory, BudgetPlanEntry, CollectionKey, Draft, EntityOf, ID, LogEntry, Settings } from '@/types'
import { createStorage, type StorageAdapter } from './storage'
import { normalizeData } from './schema'
import { createEmptyData, createSampleData } from '@/data/seed'
import { uid } from '@/utils/id'

export interface StoreActions {
  add<K extends CollectionKey>(key: K, draft: Draft<K>, log?: LogInput): ID
  update<K extends CollectionKey>(key: K, id: ID, patch: Partial<Draft<K>>, log?: LogInput): void
  remove<K extends CollectionKey>(key: K, id: ID, log?: LogInput): EntityOf<K> | undefined
  restore<K extends CollectionKey>(key: K, item: EntityOf<K>): void
  /** Define a ordem das atividades de um dia (lista de ids na nova ordem). */
  reorderItinerary(orderedIds: ID[]): void
  updateSettings(patch: Partial<Settings>): void
  setBudgetEntry(cat: BudgetCategory, patch: Partial<BudgetPlanEntry>): void
  replaceAll(data: AppData): void
  loadSample(): void
  startEmpty(): void
  log(text: string, kind?: LogEntry['kind']): void
}

export type LogInput = string | { text: string; kind: LogEntry['kind'] }

interface StoreValue {
  data: AppData
  ready: boolean
  saveError: boolean
  storageName: string
  actions: StoreActions
}

const StoreContext = createContext<StoreValue | null>(null)

const nowISO = () => new Date().toISOString()

function appendLog(data: AppData, input?: LogInput): LogEntry[] {
  if (!input) return data.log
  const entry: LogEntry =
    typeof input === 'string'
      ? { id: uid(), at: nowISO(), text: input, kind: 'general' }
      : { id: uid(), at: nowISO(), text: input.text, kind: input.kind }
  return [entry, ...data.log].slice(0, 50)
}

export function StoreProvider({ children, adapter }: { children: ReactNode; adapter?: StorageAdapter }) {
  const storage = useMemo(() => adapter ?? createStorage(), [adapter])
  const [data, setData] = useState<AppData>(() => createEmptyData())
  const [ready, setReady] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const skipNextSave = useRef(true)
  const dataRef = useRef(data)
  dataRef.current = data

  // Carregamento inicial: dados salvos ou exemplo na primeira visita
  useEffect(() => {
    let alive = true
    storage
      .load()
      .then((raw) => {
        if (!alive) return
        setData(raw ? normalizeData(raw) : createSampleData())
        skipNextSave.current = !raw ? false : true
      })
      .catch(() => alive && setData(createSampleData()))
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [storage])

  // Persistência com debounce
  useEffect(() => {
    if (!ready) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    const t = setTimeout(() => {
      storage.save(data).then(
        () => setSaveError(false),
        () => setSaveError(true),
      )
    }, 250)
    return () => clearTimeout(t)
  }, [data, ready, storage])

  const actions = useMemo<StoreActions>(() => {
    const touch = <T extends object>(o: T) => ({ ...o, updatedAt: nowISO() })
    return {
      add(key, draft, log) {
        const id = uid()
        const now = nowISO()
        setData((d) => ({
          ...d,
          [key]: [...d[key], { ...draft, id, createdAt: now, updatedAt: now }],
          log: appendLog(d, log),
        }))
        return id
      },
      update(key, id, patch, log) {
        setData((d) => ({
          ...d,
          [key]: (d[key] as EntityOf<typeof key>[]).map((it) => (it.id === id ? touch({ ...it, ...patch }) : it)),
          log: appendLog(d, log),
        }))
      },
      remove(key, id, log) {
        const removed = (dataRef.current[key] as EntityOf<typeof key>[]).find((it) => it.id === id)
        setData((d) => {
          const list = d[key] as EntityOf<typeof key>[]
          return { ...d, [key]: list.filter((it) => it.id !== id), log: appendLog(d, log) }
        })
        return removed as never
      },
      restore(key, item) {
        setData((d) => {
          const list = d[key] as EntityOf<typeof key>[]
          if (list.some((it) => it.id === item.id)) return d
          return { ...d, [key]: [...list, item] }
        })
      },
      reorderItinerary(orderedIds) {
        setData((d) => ({
          ...d,
          itinerary: d.itinerary.map((a) => {
            const idx = orderedIds.indexOf(a.id)
            return idx === -1 || a.order === idx ? a : { ...a, order: idx, updatedAt: nowISO() }
          }),
        }))
      },
      updateSettings(patch) {
        setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
      },
      setBudgetEntry(cat, patch) {
        setData((d) => ({ ...d, budgetPlan: { ...d.budgetPlan, [cat]: { ...d.budgetPlan[cat], ...patch } } }))
      },
      replaceAll(next) {
        setData(normalizeData(next))
      },
      loadSample() {
        setData(createSampleData())
      },
      startEmpty() {
        setData(createEmptyData())
      },
      log(text, kind = 'general') {
        setData((d) => ({ ...d, log: appendLog(d, { text, kind }) }))
      },
    }
  }, [])

  const value = useMemo(
    () => ({ data, ready, saveError, storageName: storage.name, actions }),
    [data, ready, saveError, storage.name, actions],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>')
  return ctx
}

/** Atalho: dados + ações. */
export function useTrip() {
  const { data, actions } = useStore()
  return { data, actions, settings: data.settings }
}

/** Hook de conveniência para uma coleção. */
export function useCollection<K extends CollectionKey>(key: K) {
  const { data, actions } = useStore()
  const items = data[key] as EntityOf<K>[]
  const add = useCallback((d: Draft<K>, log?: LogInput) => actions.add(key, d, log), [actions, key])
  const update = useCallback((id: ID, p: Partial<Draft<K>>, log?: LogInput) => actions.update(key, id, p, log), [actions, key])
  const remove = useCallback((id: ID, log?: LogInput) => actions.remove(key, id, log), [actions, key])
  const restore = useCallback((item: EntityOf<K>) => actions.restore(key, item), [actions, key])
  return { items, add, update, remove, restore }
}
