import { z } from 'zod'

export const municipioSchema = z.object({
  codigo_ibge: z.string().length(7),
  nome: z.string(),
  uf: z.string().length(2),
})
export type Municipio = z.infer<typeof municipioSchema>

export const enderecoSchema = z.object({
  cep: z.string().length(8),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().nullable(),
  bairro: z.string(),
  municipio: municipioSchema,
})
export type Endereco = z.infer<typeof enderecoSchema>
