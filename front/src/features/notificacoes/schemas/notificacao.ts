import { z } from 'zod'

export const tipoNotificacaoSchema = z.enum([
  'NOTA_AUTORIZADA',
  'NOTA_ENVIANDO',
  'NOTA_REJEITADA',
  'NOTA_CANCELADA',
  'CERTIFICADO_VENCENDO',
  'LIMITE_MEI',
  'DAS_VENCIMENTO',
])

export const notificacaoSchema = z.object({
  id: z.string(),
  tipo: tipoNotificacaoSchema,
  /** Define a cor: SUCESSO verde, INFO neutro, ATENCAO laranja, ERRO vermelho. */
  severidade: z.enum(['SUCESSO', 'INFO', 'ATENCAO', 'ERRO']),
  titulo: z.string(),
  descricao: z.string(),
  criada_em: z.string(),
  lida: z.boolean(),
  /** Rota do app para onde a notificação leva (null = só informativa). */
  link: z.string().nullable(),
})
export type Notificacao = z.infer<typeof notificacaoSchema>

/** GET /notificacoes devolve só as não lidas (lidas somem). */
export const listaNotificacoesSchema = z.object({
  itens: z.array(notificacaoSchema),
  nao_lidas: z.number().int(),
})
export type ListaNotificacoes = z.infer<typeof listaNotificacoesSchema>
