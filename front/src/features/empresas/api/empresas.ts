import { api } from '@/lib/api'
import { empresaSchema } from '../schemas/empresa'

export const empresasApi = {
  atual: () => api.get('/empresas/atual', { schema: empresaSchema }),
}
