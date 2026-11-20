import { z } from 'zod'
import { ambienteSchema, ibsCbsModoSchema, regimeSchema } from '@/types/fiscal'

export const certificadoResumoSchema = z.object({
  titular: z.string(),
  valido_ate: z.string(),
  status: z.enum(['VALIDO', 'VENCE_EM_BREVE', 'VENCIDO', 'AUSENTE']),
  dias_para_vencer: z.number().int().nullable(),
})

export const empresaSchema = z.object({
  id: z.string(),
  cnpj: z.string().length(14),
  razao_social: z.string(),
  nome_fantasia: z.string().nullable(),
  regime: regimeSchema,
  opcao_simples: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ibs_cbs_modo: ibsCbsModoSchema.nullable(),
  ambiente: ambienteSchema,
  inscricao_municipal: z.string().nullable(),
  municipio: z.object({ codigo_ibge: z.string(), nome: z.string(), uf: z.string().length(2) }),
  certificado: certificadoResumoSchema.nullable(),
})
export type Empresa = z.infer<typeof empresaSchema>
