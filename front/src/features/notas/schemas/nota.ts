import { z } from 'zod'
import { tomadorSchema } from '@/features/tomadores/schemas/tomador'
import { municipioSchema } from '@/types/endereco'
import { ambienteSchema, paginaSchema, statusNotaSchema } from '@/types/fiscal'

/* ---------------------------------------------------------------- */
/* Peças                                                             */
/* ---------------------------------------------------------------- */

const servicoNotaSchema = z.object({
  id: z.string(),
  apelido: z.string(),
  codigo_servico: z.string(),
  nbs: z.string().nullable(),
})

const tributoSchema = z.object({ aliquota: z.number(), valor: z.number() })

/**
 * CBS e IBS da nota. MEI fica dispensado de destacar (NAO_DESTACADO_MEI);
 * demais regimes trazem o cálculo da calculadora oficial (CALCULADO).
 */
export const tributosNotaSchema = z.object({
  situacao: z.enum(['NAO_DESTACADO_MEI', 'CALCULADO']),
  cbs: tributoSchema.nullable(),
  ibs: tributoSchema.nullable(),
  calculadora: z.object({ nome: z.string(), versao: z.string() }).nullable(),
})
export type TributosNota = z.infer<typeof tributosNotaSchema>

export const tipoEventoNotaSchema = z.enum([
  'RASCUNHO_SALVO',
  'PREVIA_GERADA',
  'NOTA_ENVIADA',
  'NOTA_AUTORIZADA',
  'NOTA_REJEITADA',
  'NOTA_CANCELADA',
  'SITUACAO_CONSULTADA',
])

export const eventoNotaSchema = z.object({
  tipo: tipoEventoNotaSchema,
  descricao: z.string(),
  ocorrido_em: z.string(),
})
export type EventoNota = z.infer<typeof eventoNotaSchema>

/** cMotivo da NFS-e: 1 erro na emissão, 2 serviço não prestado, 9 outros. */
export const motivoCancelamentoSchema = z.union([z.literal(1), z.literal(2), z.literal(9)])

export const MOTIVO_CANCELAMENTO_ROTULO = {
  1: 'Erro na emissão',
  2: 'Serviço não prestado',
  9: 'Outros',
} as const

/* ---------------------------------------------------------------- */
/* Nota                                                              */
/* ---------------------------------------------------------------- */

export const notaSchema = z.object({
  id: z.string(),
  serie: z.string(),
  numero_dps: z.number().int().nullable(),
  chave_acesso: z.string().nullable(),
  status: statusNotaSchema,
  ambiente: ambienteSchema,
  valor: z.number(),
  competencia: z.string(),
  emitida_em: z.string().nullable(),
  criada_em: z.string(),
  tomador: tomadorSchema,
  servico: servicoNotaSchema,
  descricao: z.string(),
  municipio_prestacao: municipioSchema,
  tributos: tributosNotaSchema.nullable(),
  erro: z.object({ codigo: z.string(), mensagem: z.string() }).optional(),
  cancelamento: z
    .object({
      motivo: motivoCancelamentoSchema,
      justificativa: z.string(),
      cancelada_em: z.string(),
    })
    .optional(),
  eventos: z.array(eventoNotaSchema),
})
export type Nota = z.infer<typeof notaSchema>

/** Item de lista: mesma forma da nota, sem o histórico. */
export const notaResumoSchema = notaSchema.omit({ eventos: true })
export type NotaResumo = z.infer<typeof notaResumoSchema>

export const listaNotasSchema = paginaSchema(notaResumoSchema).extend({ valor_total: z.number() })

const porStatus = <T extends z.ZodType>(t: T) =>
  z.object({ todas: t, autorizadas: t, enviando: t, rejeitadas: t, canceladas: t, rascunhos: t })

/** Quantidade por status (e soma dos valores em `valores`), no período e busca pedidos. */
export const contagemNotasSchema = porStatus(z.number().int()).extend({
  valores: porStatus(z.number()),
})
export type ContagemNotas = z.infer<typeof contagemNotasSchema>

export const filtroStatusSchema = z.enum([
  'todas',
  'autorizadas',
  'enviando',
  'rejeitadas',
  'canceladas',
  'rascunhos',
])
export type FiltroStatus = z.infer<typeof filtroStatusSchema>

export interface FiltrosNotas {
  status?: FiltroStatus
  /** Mês inicial (AAAA-MM), inclusive. Ausente = desde a primeira nota. */
  de?: string
  /** Mês final (AAAA-MM), inclusive. Ausente = até hoje. */
  ate?: string
  busca?: string
  pagina?: number
  por_pagina?: number
}

/* ---------------------------------------------------------------- */
/* Emissão                                                           */
/* ---------------------------------------------------------------- */

/** Entrada do formulário de emissão (o que a pessoa informa). */
export const entradaNotaSchema = z.object({
  tomador_id: z.string(),
  servico_id: z.string(),
  descricao: z.string(),
  valor: z.number(),
  competencia: z.string(),
  municipio_prestacao_ibge: z.string().nullable(),
})
export type EntradaNota = z.infer<typeof entradaNotaSchema>

/** Valor que o código aplica sem a pessoa informar (mostrado na prévia). */
const valorFixoSchema = z.object({
  campo: z.string(),
  rotulo: z.string(),
  valor: z.string(),
  explicacao: z.string(),
})

/** Resposta de POST /notas/previa: tudo que será enviado ao governo, sem enviar. */
export const previaSchema = z.object({
  previa_id: z.string(),
  expira_em: z.string(),
  ambiente: ambienteSchema,
  dps: z.object({
    serie: z.string(),
    numero_dps: z.number().int(),
    competencia: z.string(),
    prestador: z.object({
      cnpj: z.string(),
      razao_social: z.string(),
      inscricao_municipal: z.string().nullable(),
      regime_rotulo: z.string(),
      municipio: municipioSchema,
    }),
    tomador: tomadorSchema,
    servico: servicoNotaSchema.extend({ descricao: z.string(), municipio: municipioSchema }),
    valor: z.number(),
  }),
  valores_fixos: z.array(valorFixoSchema),
  tributos: tributosNotaSchema,
  avisos: z.array(z.string()),
})
export type Previa = z.infer<typeof previaSchema>

export const cancelamentoEntradaSchema = z.object({
  motivo: motivoCancelamentoSchema,
  justificativa: z.string(),
})
export type CancelamentoEntrada = z.infer<typeof cancelamentoEntradaSchema>
