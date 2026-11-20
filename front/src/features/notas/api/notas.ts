import { api } from '@/lib/api'
import {
  contagemNotasSchema,
  listaNotasSchema,
  notaSchema,
  previaSchema,
  type CancelamentoEntrada,
  type EntradaNota,
  type FiltrosNotas,
} from '../schemas/nota'

export const notasApi = {
  listar: (filtros: FiltrosNotas = {}) =>
    api.get('/notas', { query: { ...filtros }, schema: listaNotasSchema }),
  contagem: (filtros: Pick<FiltrosNotas, 'de' | 'ate' | 'busca'> = {}) =>
    api.get('/notas/contagem', { query: { ...filtros }, schema: contagemNotasSchema }),
  obter: (id: string) => api.get(`/notas/${id}`, { schema: notaSchema }),

  /** Monta a DPS, valida e devolve o resumo, sem enviar ao governo. */
  previa: (entrada: EntradaNota, rascunhoId?: string) =>
    api.post('/notas/previa', { ...entrada, rascunho_id: rascunhoId }, { schema: previaSchema }),
  /** Emite de fato. Exige o id de uma prévia recente e a confirmação explícita. */
  emitir: (previaId: string) =>
    api.post('/notas', { previa_id: previaId, confirmacao: true }, { schema: notaSchema }),

  salvarRascunho: (entrada: Partial<EntradaNota>, rascunhoId?: string) =>
    api.post('/notas/rascunhos', { ...entrada, rascunho_id: rascunhoId }, { schema: notaSchema }),
  excluirRascunho: (id: string) => api.delete(`/notas/${id}`),

  cancelar: (id: string, dados: CancelamentoEntrada) =>
    api.post(`/notas/${id}/cancelar`, dados, { schema: notaSchema }),
  consultar: (id: string) => api.post(`/notas/${id}/consultar`, undefined, { schema: notaSchema }),

  baixarXml: (id: string) => api.arquivo(`/notas/${id}/xml`),
  baixarPdf: (id: string) => api.arquivo(`/notas/${id}/pdf`),
}
