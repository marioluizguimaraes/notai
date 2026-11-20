import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificacoesApi } from '../api/notificacoes'
import type { ListaNotificacoes } from '../schemas/notificacao'

export const notificacoesKeys = { lista: ['notificacoes'] as const }

export function useNotificacoes() {
  return useQuery({
    queryKey: notificacoesKeys.lista,
    queryFn: notificacoesApi.listar,
    refetchInterval: 60_000,
  })
}

/** Marca como lida já na tela (otimista) e confirma com o servidor. */
function useMarcar<T>(
  fn: (arg: T) => Promise<ListaNotificacoes>,
  local: (l: ListaNotificacoes, arg: T) => ListaNotificacoes,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onMutate: async (arg) => {
      await qc.cancelQueries({ queryKey: notificacoesKeys.lista })
      const antes = qc.getQueryData<ListaNotificacoes>(notificacoesKeys.lista)
      if (antes) qc.setQueryData(notificacoesKeys.lista, local(antes, arg))
      return { antes }
    },
    onError: (_e, _a, ctx) => ctx?.antes && qc.setQueryData(notificacoesKeys.lista, ctx.antes),
    onSuccess: (lista) => qc.setQueryData(notificacoesKeys.lista, lista),
  })
}

export function useMarcarLida() {
  return useMarcar(notificacoesApi.marcarLida, (l, id: string) => {
    const itens = l.itens.filter((n) => n.id !== id)
    return { itens, nao_lidas: itens.length }
  })
}

export function useMarcarTodasLidas() {
  return useMarcar(
    () => notificacoesApi.marcarTodasLidas(),
    () => ({ itens: [], nao_lidas: 0 }),
  )
}
