import { z } from 'zod'
import { enderecoSchema } from '@/types/endereco'

/** Tomador = cliente da nota (quem contratou o serviço). */
export const tomadorSchema = z.object({
  id: z.string(),
  nome: z.string(),
  documento: z.string(),
  tipo_documento: z.enum(['CPF', 'CNPJ']),
  email: z.string().nullable(),
  endereco: enderecoSchema,
})
export type Tomador = z.infer<typeof tomadorSchema>

export const listaTomadoresSchema = z.object({ itens: z.array(tomadorSchema) })
