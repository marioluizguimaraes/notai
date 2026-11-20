import { api } from '@/lib/api'
import { listaTomadoresSchema } from '../schemas/tomador'

export const tomadoresApi = {
  listar: (busca?: string) =>
    api.get('/tomadores', { query: { busca }, schema: listaTomadoresSchema }),
}
