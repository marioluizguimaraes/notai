import { z } from 'zod'

export const hojeIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Validação do formulário de emissão: as mesmas regras que o backend aplica. */
export const formularioNotaSchema = z.object({
  tomador_id: z
    .string({ error: 'Escolha o cliente da nota.' })
    .min(1, 'Escolha o cliente da nota.'),
  servico_id: z
    .string({ error: 'Escolha o serviço prestado.' })
    .min(1, 'Escolha o serviço prestado.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Descreva o serviço prestado.')
    .max(1000, 'Use no máximo 1.000 caracteres.'),
  valor: z
    .number({ error: 'Informe o valor do serviço.' })
    .positive('O valor precisa ser maior que zero.'),
  competencia: z
    .string()
    .min(1, 'Informe a data em que o serviço foi prestado.')
    .refine((v) => v <= hojeIso(), 'A competência não pode ser depois de hoje.'),
})
export type FormularioNota = z.infer<typeof formularioNotaSchema>
export type FormularioNotaEntrada = z.input<typeof formularioNotaSchema>
