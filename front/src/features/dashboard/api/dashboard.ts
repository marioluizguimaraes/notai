import { api } from '@/lib/api'
import { atividadeSchema, resumoDashboardSchema } from '../schemas/dashboard'

export const dashboardApi = {
  resumo: () => api.get('/dashboard/resumo', { schema: resumoDashboardSchema }),
  atividade: () => api.get('/dashboard/atividade', { schema: atividadeSchema }),
}
