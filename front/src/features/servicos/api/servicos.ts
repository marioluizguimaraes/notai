import { api } from '@/lib/api'
import { listaServicosSchema } from '../schemas/servico'

export const servicosApi = {
  listar: () => api.get('/servicos', { schema: listaServicosSchema }),
}
