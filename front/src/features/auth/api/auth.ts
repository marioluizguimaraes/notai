import { api } from '@/lib/api'
import { loginRespostaSchema, usuarioSchema } from '../schemas/auth'

export const authApi = {
  /** `cnpj` só com dígitos (14). */
  login: (cnpj: string, senha: string) =>
    api.post('/auth/login', { cnpj, senha }, { schema: loginRespostaSchema }),
  me: () => api.get('/auth/me', { schema: usuarioSchema }),
}
