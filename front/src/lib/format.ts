/** Formatação pt-BR. Valores monetários sempre em reais, 2 casas. */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })

export const somenteDigitos = (v: string) => v.replace(/\D/g, '')

export const formatarMoeda = (v: number) => brl.format(v)
export const formatarMoedaCompacta = (v: number) => brlCompacto.format(v)
/** Recebe fração (0.848 → "84,8%"). */
export const formatarPercentual = (v: number) => pct.format(v)

export function formatarCNPJ(v: string) {
  const d = somenteDigitos(v).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatarCPF(v: string) {
  const d = somenteDigitos(v).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatarDocumento(v: string) {
  return somenteDigitos(v).length > 11 ? formatarCNPJ(v) : formatarCPF(v)
}

export function formatarCEP(v: string) {
  return somenteDigitos(v)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

/** CNPJ mascarado para exibir em logs/listas: 12.***.***\/0001-90 */
export function mascararCNPJ(v: string) {
  const d = somenteDigitos(v)
  if (d.length !== 14) return v
  return `${d.slice(0, 2)}.***.***/${d.slice(8, 12)}-${d.slice(12)}`
}

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const dataLonga = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

export const formatarDataCurta = (d: Date | string) => dataCurta.format(new Date(d))
export const formatarDataHora = (d: Date | string) => dataLonga.format(new Date(d))

const mesLongo = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dataNumerica = new Intl.DateTimeFormat('pt-BR')

/** "2026-11" → "novembro" */
export const formatarMesCompetencia = (competencia: string) =>
  mesLongo.format(new Date(`${competencia}-01T12:00:00`))

/** Data ISO só com dia (AAAA-MM-DD) tratada como data local, sem fuso. */
export const dataLocal = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)

export const formatarData = (iso: string) => dataNumerica.format(dataLocal(iso))
export const formatarHora = (iso: string) => hora.format(new Date(iso))
export const formatarDiaSemana = (iso: string) => diaSemana.format(dataLocal(iso)).replace('.', '')

/** Moeda sem centavos para eixos e KPIs grandes: R$ 6.840 */
const brlInteiro = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
export const formatarMoedaInteira = (v: number) => brlInteiro.format(v)

export function saudacao(agora = new Date()) {
  const h = agora.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome

export const iniciais = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÀ-Ú]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

/** Agrupa datas em "Hoje", "Ontem", "Esta semana" e "Anteriores". */
export function grupoRelativo(iso: string, hoje = new Date()): string {
  const d = new Date(iso)
  const inicio = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dias = Math.round((inicio(hoje) - inicio(d)) / 86_400_000)
  if (dias <= 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 7) return 'Esta semana'
  return 'Anteriores'
}
