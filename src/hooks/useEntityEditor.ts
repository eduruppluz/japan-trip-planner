import { useCallback, useMemo, useState } from 'react'
import type { BaseEntity, CollectionKey, Draft, EntityOf } from '@/types'
import { useCollection, type LogInput } from '@/services/store'
import { useToast } from '@/components/ui/Toast'

interface Options<K extends CollectionKey> {
  /** Valores padrão de um item novo. */
  empty: () => Draft<K>
  /** Substantivo para títulos e mensagens ("voo", "tarefa"). */
  noun: string
  gender?: 'm' | 'f'
  addLog?: (d: Draft<K>) => LogInput | undefined
  updateLog?: (d: Draft<K>, prev: EntityOf<K>) => LogInput | undefined
  /** Chamado após criar um item (ex.: reposicionar na ordem). */
  afterAdd?: (id: string, d: Draft<K>) => void
}

function stripSystem<T extends BaseEntity>(item: T): Omit<T, keyof BaseEntity> {
  const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = item
  void _i; void _c; void _u
  return rest
}

/**
 * Gerencia o ciclo criar/editar/excluir de uma coleção:
 * estado do modal, valores iniciais, toasts e "Desfazer" na exclusão.
 */
export function useEntityEditor<K extends CollectionKey>(key: K, opts: Options<K>) {
  const { add, update, remove, restore, items } = useCollection(key)
  const toast = useToast()
  const [state, setState] = useState<{ open: boolean; editing: EntityOf<K> | null; preset?: Partial<Draft<K>> }>({ open: false, editing: null })
  const f = opts.gender === 'f'

  const openNew = useCallback((preset?: Partial<Draft<K>>) => setState({ open: true, editing: null, preset }), [])
  const openEdit = useCallback((item: EntityOf<K>) => setState({ open: true, editing: item }), [])
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), [])

  const initial = useMemo(
    () => (state.editing ? (stripSystem(state.editing as BaseEntity) as Draft<K>) : ({ ...opts.empty(), ...state.preset } as Draft<K>)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  )

  const del = useCallback(
    (item: EntityOf<K>) => {
      const removed = remove(item.id)
      toast(`${cap(opts.noun)} excluíd${f ? 'a' : 'o'}`, {
        tone: 'neutral',
        action: removed ? { label: 'Desfazer', onClick: () => restore(removed) } : undefined,
      })
    },
    [remove, restore, toast, opts.noun, f],
  )

  const submit = useCallback(
    (values: Draft<K>) => {
      if (state.editing) {
        update(state.editing.id, values, opts.updateLog?.(values, state.editing))
        toast('Alterações salvas')
      } else {
        const id = add(values, opts.addLog?.(values))
        opts.afterAdd?.(id, values)
        toast(`${cap(opts.noun)} adicionad${f ? 'a' : 'o'}`)
      }
    },
    [state.editing, update, add, toast, opts, f],
  )

  const formProps = {
    open: state.open,
    onClose: close,
    initial,
    onSubmit: submit,
    onDelete: state.editing
      ? () => {
          del(state.editing!)
          close()
        }
      : undefined,
    title: state.editing ? `Editar ${opts.noun}` : `${f ? 'Nova' : 'Novo'} ${opts.noun}`,
  }

  return { items, openNew, openEdit, close, del, update, formProps, editing: state.editing }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
