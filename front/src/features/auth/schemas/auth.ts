import { z } from 'zod'
import { cnpjSchema } from '@/lib/validators'

/** Acesso por CNPJ + senha. O CNPJ chega mascarado e sai só com dígitos. */
export const loginFormSchema = z.object({
  cnpj: cnpjSchema,
  senha: z.string().min(1, 'Informe sua senha.'),
  lembrar: z.boolean(),
})
export type LoginFormInput = z.input<typeof loginFormSchema>
export type LoginForm = z.output<typeof loginFormSchema>

export const usuarioSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cnpj: z.string().length(14),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
})
export type Usuario = z.infer<typeof usuarioSchema>

export const loginRespostaSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('bearer'),
  expira_em: z.number(),
  usuario: usuarioSchema,
})
export type LoginResposta = z.infer<typeof loginRespostaSchema>
