import { api } from '@/lib/api'
import { listaNotificacoesSchema } from '../schemas/notificacao'

export const notificacoesApi = {
  listar: () => api.get('/notificacoes', { schema: listaNotificacoesSchema }),
  marcarLida: (id: string) =>
    api.post(`/notificacoes/${id}/lida`, undefined, { schema: listaNotificacoesSchema }),
  marcarTodasLidas: () =>
    api.post('/notificacoes/lidas', undefined, { schema: listaNotificacoesSchema }),
}
