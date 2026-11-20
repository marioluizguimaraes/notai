import { z } from 'zod'
import { statusNotaSchema } from '@/types/fiscal'

const acaoSchema = z.object({ rotulo: z.string(), rota: z.string().optional() })

export const resumoDashboardSchema = z.object({
  competencia: z.string(),
  atualizado_em: z.string(),
  pendencias_total: z.number().int(),
  kpis: z.object({
    faturado_mes: z.object({
      valor: z.number(),
      variacao_pct: z.number(),
      comparado_com: z.string(),
    }),
    notas_emitidas: z.object({
      quantidade: z.number().int(),
      autorizadas: z.number().int(),
      variacao_pct: z.number(),
    }),
    limite_mei: z
      .object({
        usado_pct: z.number(),
        faturado_ano: z.number(),
        limite_anual: z.number(),
        mes_atual: z.number().int(),
        meses_no_ano: z.number().int(),
      })
      .nullable(),
    pendencias: z.object({ quantidade: z.number().int(), valor_em_aberto: z.number() }),
  }),
  faturamento_diario: z.array(z.object({ data: z.string(), valor: z.number() })),
  resumo_fiscal: z.object({
    das_mes: z
      .object({
        valor: z.number(),
        vencimento: z.string(),
        status: z.enum(['A_PAGAR', 'PAGO', 'VENCIDO']),
      })
      .nullable(),
    faturado_ano: z.object({ valor: z.number(), variacao_pct: z.number() }),
    limite_restante: z.object({ valor: z.number(), variacao_pct: z.number() }).nullable(),
  }),
  notas_por_status: z.object({
    valor_total: z.number(),
    itens: z.array(
      z.object({ status: statusNotaSchema, quantidade: z.number().int(), valor: z.number() }),
    ),
  }),
  proxima_acao: z
    .object({
      tipo: z.string(),
      /** Define a cor do alerta: INFO (verde), ATENCAO (laranja), CRITICO (vermelho). */
      severidade: z.enum(['INFO', 'ATENCAO', 'CRITICO']),
      titulo: z.string(),
      descricao: z.string(),
      destaque: z.object({ rotulo: z.string(), detalhe: z.string() }).nullable(),
      acao_primaria: acaoSchema,
      acao_secundaria: acaoSchema.nullable(),
    })
    .nullable(),
})
export type ResumoDashboard = z.infer<typeof resumoDashboardSchema>
export type ProximaAcao = NonNullable<ResumoDashboard['proxima_acao']>

export const eventoSchema = z.object({
  id: z.string(),
  tipo: z.enum([
    'NOTA_ENVIADA',
    'NOTA_AUTORIZADA',
    'NOTA_REJEITADA',
    'NOTA_CANCELADA',
    'CERTIFICADO',
    'EMPRESA',
  ]),
  titulo: z.string(),
  descricao: z.string(),
  valor: z.number().nullable(),
  status: statusNotaSchema.nullable(),
  ocorrido_em: z.string(),
  nota_id: z.string().nullable().optional(),
})
export type Evento = z.infer<typeof eventoSchema>

export const atividadeSchema = z.object({ itens: z.array(eventoSchema) })
