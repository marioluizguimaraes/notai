/**
 * "Banco" do mock. Começa com os JSONs de ./data e muda com as ações
 * (emitir, cancelar, salvar rascunho…). O estado fica no sessionStorage:
 * sobrevive ao F5 e volta ao inicial ao fechar a aba (ou com `resetarDb()`).
 */
import dashboardResumo from './data/dashboard-resumo.json'
import empresaAtual from './data/empresa-atual.json'
import notasJson from './data/notas.json'
import servicosJson from './data/servicos.json'
import tomadoresJson from './data/tomadores.json'

type NotaMock = (typeof notasJson.itens)[number] & {
  erro?: { codigo: string; mensagem: string }
  cancelamento?: { motivo: number; justificativa: string; cancelada_em: string }
}

export interface PreviaMock {
  previa_id: string
  expira_em: number
  entrada: {
    tomador_id: string
    servico_id: string
    descricao: string
    valor: number
    competencia: string
    municipio_prestacao_ibge: string | null
  }
  rascunho_id?: string
  resposta: unknown
}

/** Assinatura dos JSONs: se os dados de demonstração mudarem, o estado salvo antigo é ignorado. */
const ASSINATURA = [notasJson, tomadoresJson, servicosJson, empresaAtual]
  .map((j) => JSON.stringify(j).length.toString(36))
  .join('.')
const CHAVE = `notai.mock.db.${ASSINATURA}`

function inicial() {
  return {
    empresa: structuredClone(empresaAtual),
    tomadores: structuredClone(tomadoresJson.itens),
    servicos: structuredClone(servicosJson.itens),
    notas: structuredClone(notasJson.itens) as NotaMock[],
    proximoNumero: notasJson.proximo_numero_dps,
  }
}
type Persistido = ReturnType<typeof inicial>

function carregar(): Persistido {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i)
      if (k?.startsWith('notai.mock.db') && k !== CHAVE) sessionStorage.removeItem(k)
    }
    const bruto = sessionStorage.getItem(CHAVE)
    if (bruto) return JSON.parse(bruto) as Persistido
  } catch {
    /* sem armazenamento: começa do zero */
  }
  return inicial()
}

export const db = {
  ...carregar(),
  previas: new Map<string, PreviaMock>(),
  /** Mês de referência dos dados de demonstração (AAAA-MM). */
  competenciaReferencia: dashboardResumo.competencia,
}

/** Grava o estado após uma alteração (chamado pelo servidor em POST/PUT/PATCH/DELETE). */
export function salvarDb() {
  try {
    const { empresa, tomadores, servicos, notas, proximoNumero } = db
    sessionStorage.setItem(
      CHAVE,
      JSON.stringify({ empresa, tomadores, servicos, notas, proximoNumero }),
    )
  } catch {
    /* ignorar */
  }
}

/** Volta os dados de demonstração ao estado inicial. */
export function resetarDb() {
  Object.assign(db, inicial())
  db.previas.clear()
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    /* ignorar */
  }
}

export type { NotaMock }

let seq = 0
export const novoId = (prefixo: string) =>
  `${prefixo}_${Date.now().toString(36)}${(seq++).toString(36)}`

/** Agora no fuso de Brasília, no formato ISO usado pela API. */
export function agoraIso() {
  const d = new Date()
  const local = new Date(d.getTime() - 3 * 3600_000)
  return local.toISOString().slice(0, 19) + '-03:00'
}
