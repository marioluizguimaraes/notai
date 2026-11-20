import { cnpjValido, cpfValido, cnpjSchema } from './validators'
import { formatarCNPJ, formatarCEP, formatarCPF, mascararCNPJ } from './format'

describe('validadores', () => {
  it('aceita CNPJ válido e recusa inválido', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
    expect(cnpjValido('11.222.333/0001-80')).toBe(false)
    expect(cnpjValido('00000000000000')).toBe(false)
  })

  it('aceita CPF válido e recusa inválido', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('529.982.247-24')).toBe(false)
  })

  it('schema de CNPJ devolve só dígitos', () => {
    expect(cnpjSchema.parse('11.222.333/0001-81')).toBe('11222333000181')
    expect(cnpjSchema.safeParse('123').success).toBe(false)
  })
})

describe('formatadores', () => {
  it('aplica máscaras', () => {
    expect(formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatarCPF('52998224725')).toBe('529.982.247-25')
    expect(formatarCEP('01310100')).toBe('01310-100')
    expect(mascararCNPJ('11222333000181')).toBe('11.***.***/0001-81')
  })
})
