// ============================================================
// Camada de armazenamento.
// O app conversa SOMENTE com a interface `StorageAdapter`.
// Para migrar para Supabase/Firebase, basta criar um novo adapter
// (ex.: SupabaseAdapter) com os mesmos métodos e trocar em
// `createStorage()` — nenhuma página precisa mudar.
// ============================================================
import type { AppData } from '@/types'

export interface StorageAdapter {
  readonly name: string
  load(): Promise<unknown | null>
  save(data: AppData): Promise<void>
  clear(): Promise<void>
}

const KEY = 'jtp:data:v1'
const BACKUP_KEY = 'jtp:data:backup'

/** Único lugar do projeto que acessa o localStorage. */
export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'localStorage'

  private get ls(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null
    } catch {
      return null // modo privado / bloqueado
    }
  }

  async load(): Promise<unknown | null> {
    const raw = this.ls?.getItem(KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      // Dado corrompido: guarda uma cópia para não perder nada e recomeça
      this.ls?.setItem(BACKUP_KEY, raw)
      return null
    }
  }

  async save(data: AppData): Promise<void> {
    try {
      this.ls?.setItem(KEY, JSON.stringify(data))
    } catch (err) {
      // Quota cheia ou storage bloqueado — o app continua funcionando em memória
      console.warn('[storage] não foi possível salvar', err)
      throw err
    }
  }

  async clear(): Promise<void> {
    this.ls?.removeItem(KEY)
  }
}

/** Adapter em memória (usado nos testes e como fallback). */
export class MemoryAdapter implements StorageAdapter {
  readonly name = 'memory'
  private data: string | null = null
  async load() {
    return this.data ? JSON.parse(this.data) : null
  }
  async save(d: AppData) {
    this.data = JSON.stringify(d)
  }
  async clear() {
    this.data = null
  }
}

export function createStorage(): StorageAdapter {
  return new LocalStorageAdapter()
}
