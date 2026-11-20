import { z } from 'zod'

/** Enums de domínio compartilhados com o backend (espelham o modelo de dados da especificação). */

export const regimeSchema = z.enum([
  'MEI',
  'SIMPLES_ME_EPP',
  'REGULAR_PRESUMIDO',
  'REGULAR_REAL',
  'DESCONHECIDO',
])
export type Regime = z.infer<typeof regimeSchema>

export const ibsCbsModoSchema = z.enum(['DENTRO_DAS', 'POR_FORA'])
export type IbsCbsModo = z.infer<typeof ibsCbsModoSchema>

export const ambienteSchema = z.enum(['TESTES', 'PRODUCAO'])
export type Ambiente = z.infer<typeof ambienteSchema>

export const statusNotaSchema = z.enum([
  'RASCUNHO',
  'PREVIA',
  'ENVIANDO',
  'AUTORIZADA',
  'REJEITADA',
  'CANCELADA',
])
export type StatusNota = z.infer<typeof statusNotaSchema>

/** Motivo de cancelamento da NFS-e (cMotivo). */
export type MotivoCancelamento = 1 | 2 | 9

/** Paginação padrão das listas da API. */
export const paginaSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    itens: z.array(item),
    total: z.number().int(),
    pagina: z.number().int(),
    por_pagina: z.number().int(),
  })

export const REGIME_ROTULO: Record<Regime, string> = {
  MEI: 'MEI',
  SIMPLES_ME_EPP: 'Simples Nacional',
  REGULAR_PRESUMIDO: 'Lucro Presumido',
  REGULAR_REAL: 'Lucro Real',
  DESCONHECIDO: 'A confirmar',
}

export const STATUS_NOTA_ROTULO: Record<StatusNota, string> = {
  RASCUNHO: 'Rascunho',
  PREVIA: 'Prévia',
  ENVIANDO: 'Enviando',
  AUTORIZADA: 'Autorizada',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada',
}
