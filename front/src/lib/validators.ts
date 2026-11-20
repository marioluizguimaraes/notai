import { z } from 'zod'
import { somenteDigitos } from './format'

export function cnpjValido(valor: string) {
  const c = somenteDigitos(valor)
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false
  const calc = (base: string, pesos: number[]) => {
    const soma = base.split('').reduce((s, n, i) => s + Number(n) * pesos[i], 0)
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = calc(c.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calc(c.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return d1 === Number(c[12]) && d2 === Number(c[13])
}

export function cpfValido(valor: string) {
  const c = somenteDigitos(valor)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const calc = (len: number) => {
    let soma = 0
    for (let i = 0; i < len; i++) soma += Number(c[i]) * (len + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10])
}

/** Schemas reutilizáveis. Mensagens em português, apontando o problema. */
export const cnpjSchema = z
  .string()
  .transform(somenteDigitos)
  .refine((v) => v.length > 0, { error: 'Informe o CNPJ.', abort: true })
  .refine((v) => v.length === 14, { error: 'O CNPJ tem 14 dígitos.', abort: true })
  .refine(cnpjValido, 'CNPJ inválido. Confira os números.')

export const cpfSchema = z
  .string()
  .transform(somenteDigitos)
  .refine((v) => v.length === 11, 'O CPF tem 11 dígitos.')
  .refine(cpfValido, 'CPF inválido. Confira os números.')

export const documentoSchema = z
  .string()
  .transform(somenteDigitos)
  .refine(
    (v) => (v.length === 11 ? cpfValido(v) : v.length === 14 ? cnpjValido(v) : false),
    'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.',
  )

export const cepSchema = z
  .string()
  .transform(somenteDigitos)
  .refine((v) => v.length === 8, 'O CEP tem 8 dígitos.')

/** Valor em reais com no máximo 2 casas decimais, maior que zero. */
export const valorServicoSchema = z
  .number({ error: 'Informe o valor do serviço.' })
  .positive('O valor precisa ser maior que zero.')
  .refine((v) => Math.round(v * 100) === v * 100, 'Use no máximo 2 casas decimais.')
