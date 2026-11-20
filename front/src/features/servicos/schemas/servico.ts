import { z } from 'zod'

/** Serviço do catálogo da empresa (código da lista nacional + NBS). */
export const servicoSchema = z.object({
  id: z.string(),
  apelido: z.string(),
  codigo_servico: z.string().length(6),
  nbs: z.string().length(9).nullable(),
  descricao_padrao: z.string(),
})
export type Servico = z.infer<typeof servicoSchema>

export const listaServicosSchema = z.object({ itens: z.array(servicoSchema) })
