import { hojeIso } from './schemas/formulario'

/**
 * Período por mês (AAAA-MM). Sem `de` = desde sempre; sem `ate` = até hoje.
 * Na URL vira um único parâmetro: `periodo=2026-09..2026-11`, `2026-09..`,
 * `..2026-11` ou `todos`. Sem parâmetro = este mês.
 */
export interface Periodo {
  de?: string
  ate?: string
}

export type ModoPeriodo = 'entre' | 'a_partir' | 'ate'

export const mesAtual = () => hojeIso().slice(0, 7)

export function somarMeses(mes: string, n: number) {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(a, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const ATALHOS_PERIODO: { id: string; rotulo: string; periodo: () => Periodo }[] = [
  { id: 'este_mes', rotulo: 'Este mês', periodo: () => ({ de: mesAtual(), ate: mesAtual() }) },
  {
    id: 'mes_passado',
    rotulo: 'Mês passado',
    periodo: () => ({ de: somarMeses(mesAtual(), -1), ate: somarMeses(mesAtual(), -1) }),
  },
  {
    id: 'ultimos_3',
    rotulo: 'Últimos 3 meses',
    periodo: () => ({ de: somarMeses(mesAtual(), -2), ate: mesAtual() }),
  },
  {
    id: 'este_ano',
    rotulo: 'Este ano',
    periodo: () => ({ de: `${mesAtual().slice(0, 4)}-01`, ate: mesAtual() }),
  },
  { id: 'todos', rotulo: 'Todo o período', periodo: () => ({}) },
]

const MES = /^\d{4}-(0[1-9]|1[0-2])$/

export function lerPeriodoUrl(valor: string | null): Periodo {
  if (!valor) return ATALHOS_PERIODO[0].periodo()
  if (valor === 'todos') return {}
  const [de, ate] = valor.split('..')
  const p: Periodo = {}
  if (de && MES.test(de)) p.de = de
  if (ate && MES.test(ate)) p.ate = ate
  if (p.de && p.ate && p.de > p.ate) return { de: p.ate, ate: p.de }
  return p
}

export function periodoParaUrl(p: Periodo): string | undefined {
  const m = mesAtual()
  if (p.de === m && p.ate === m) return undefined
  if (!p.de && !p.ate) return 'todos'
  return `${p.de ?? ''}..${p.ate ?? ''}`
}

export const mesmoPeriodo = (a: Periodo, b: Periodo) => a.de === b.de && a.ate === b.ate

export function modoDoPeriodo(p: Periodo): ModoPeriodo {
  if (p.de && !p.ate) return 'a_partir'
  if (!p.de && p.ate) return 'ate'
  return 'entre'
}

const curto = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const longo = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const nomeMes = (mes: string, fmt = curto) =>
  fmt.format(new Date(`${mes}-15T12:00:00`)).replace('.', '')
export const mesCurto = (mes: string) => `${nomeMes(mes)}/${mes.slice(0, 4)}`
const mesLongo = (mes: string) => `${nomeMes(mes, longo)} de ${mes.slice(0, 4)}`

/** Texto curto para o botão: "Este mês", "set – nov/2026", "A partir de set/2026"… */
export function rotuloPeriodo(p: Periodo) {
  const atalho = ATALHOS_PERIODO.find((a) => mesmoPeriodo(a.periodo(), p))
  if (atalho) return atalho.rotulo
  if (p.de && p.ate) {
    if (p.de === p.ate) return mesCurto(p.de)
    return p.de.slice(0, 4) === p.ate.slice(0, 4)
      ? `${nomeMes(p.de)} – ${mesCurto(p.ate)}`
      : `${mesCurto(p.de)} – ${mesCurto(p.ate)}`
  }
  if (p.de) return `A partir de ${mesCurto(p.de)}`
  if (p.ate) return `Até ${mesCurto(p.ate)}`
  return 'Todo o período'
}

/** Texto completo para o resumo do filtro. */
export function descreverPeriodo(p: Periodo) {
  if (p.de && p.ate)
    return p.de === p.ate
      ? `Somente ${mesLongo(p.de)}`
      : `De ${mesLongo(p.de)} até ${mesLongo(p.ate)}`
  if (p.de) return `De ${mesLongo(p.de)} em diante`
  if (p.ate) return `Tudo até ${mesLongo(p.ate)}`
  return 'Todas as notas, sem limite de data'
}
