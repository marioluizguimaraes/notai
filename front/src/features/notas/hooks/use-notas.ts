import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { notasApi } from '../api/notas'
import type { CancelamentoEntrada, EntradaNota, FiltrosNotas, Nota } from '../schemas/nota'

export const notasKeys = {
  todas: ['notas'] as const,
  lista: (filtros: FiltrosNotas) => ['notas', 'lista', filtros] as const,
  contagem: (filtros: Pick<FiltrosNotas, 'de' | 'ate' | 'busca'>) =>
    ['notas', 'contagem', filtros] as const,
  detalhe: (id: string) => ['notas', 'detalhe', id] as const,
}

export function useNotas(filtros: FiltrosNotas) {
  return useQuery({
    queryKey: notasKeys.lista(filtros),
    queryFn: () => notasApi.listar(filtros),
    placeholderData: keepPreviousData,
  })
}

export function useNotasRecentes(limite = 4) {
  return useNotas({ por_pagina: limite })
}

export function useContagemNotas(filtros: Pick<FiltrosNotas, 'de' | 'ate' | 'busca'> = {}) {
  return useQuery({
    queryKey: notasKeys.contagem(filtros),
    queryFn: () => notasApi.contagem(filtros),
    placeholderData: keepPreviousData,
  })
}

export function useNota(id: string | undefined) {
  return useQuery({
    queryKey: notasKeys.detalhe(id ?? ''),
    queryFn: () => notasApi.obter(id!),
    enabled: !!id,
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 1,
  })
}

/** Depois de qualquer mudança, tudo que mostra notas é recarregado (lista, contagem, painel). */
function useAtualizarNotas() {
  const qc = useQueryClient()
  return (nota?: Nota) => {
    if (nota) qc.setQueryData(notasKeys.detalhe(nota.id), nota)
    qc.invalidateQueries({ queryKey: notasKeys.todas })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function usePrevia() {
  return useMutation({
    mutationFn: ({ entrada, rascunhoId }: { entrada: EntradaNota; rascunhoId?: string }) =>
      notasApi.previa(entrada, rascunhoId),
  })
}

export function useEmitirNota() {
  const atualizar = useAtualizarNotas()
  return useMutation({ mutationFn: notasApi.emitir, onSuccess: (n) => atualizar(n) })
}

export function useSalvarRascunho() {
  const atualizar = useAtualizarNotas()
  return useMutation({
    mutationFn: ({ entrada, rascunhoId }: { entrada: Partial<EntradaNota>; rascunhoId?: string }) =>
      notasApi.salvarRascunho(entrada, rascunhoId),
    onSuccess: (n) => atualizar(n),
  })
}

export function useExcluirRascunho() {
  const atualizar = useAtualizarNotas()
  return useMutation({ mutationFn: notasApi.excluirRascunho, onSuccess: () => atualizar() })
}

export function useCancelarNota(id: string) {
  const atualizar = useAtualizarNotas()
  return useMutation({
    mutationFn: (dados: CancelamentoEntrada) => notasApi.cancelar(id, dados),
    onSuccess: (n) => atualizar(n),
  })
}

export function useConsultarNota(id: string) {
  const atualizar = useAtualizarNotas()
  return useMutation({ mutationFn: () => notasApi.consultar(id), onSuccess: (n) => atualizar(n) })
}

function salvarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Baixa o XML ou o PDF (DANFSe) da nota, com aviso de sucesso ou erro. */
export function useBaixarArquivo() {
  return useMutation({
    mutationFn: async ({
      nota,
      tipo,
    }: {
      nota: Pick<Nota, 'id' | 'numero_dps' | 'serie'>
      tipo: 'xml' | 'pdf'
    }) => {
      const blob =
        tipo === 'xml' ? await notasApi.baixarXml(nota.id) : await notasApi.baixarPdf(nota.id)
      salvarArquivo(blob, `nfse-${nota.serie}-${nota.numero_dps ?? nota.id}.${tipo}`)
      return tipo
    },
    onSuccess: (tipo) => toast.success(tipo === 'xml' ? 'XML baixado' : 'PDF da nota baixado'),
    onError: (e) => toast.error('Não foi possível baixar o arquivo', { description: e.message }),
  })
}
