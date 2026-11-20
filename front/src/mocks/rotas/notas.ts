import { gerarPdf, gerarXml } from '../arquivos'
import { agoraIso, db, novoId, type NotaMock, type PreviaMock } from '../db'
import { erro, ok, type Handler } from '../tipos'

/* ---------------------------------------------------------------- */
/* Apoio                                                             */
/* ---------------------------------------------------------------- */

const STATUS_DO_FILTRO: Record<string, string | undefined> = {
  autorizadas: 'AUTORIZADA',
  enviando: 'ENVIANDO',
  rejeitadas: 'REJEITADA',
  canceladas: 'CANCELADA',
  rascunhos: 'RASCUNHO',
}

const dataDaNota = (n: NotaMock) => n.emitida_em ?? n.criada_em
const semHistorico = ({ eventos: _eventos, ...resto }: NotaMock) => resto

/** O mês de uma nota é o da emissão (ou da criação, para rascunhos). */
function noPeriodo(n: NotaMock, de: string | null, ate: string | null) {
  const mes = dataDaNota(n).slice(0, 7)
  return (!de || mes >= de) && (!ate || mes <= ate)
}

const digitos = (s: string) => s.replace(/\D/g, '')

function contem(n: NotaMock, busca: string) {
  const b = busca.trim().toLowerCase()
  if (!b) return true
  const d = digitos(b)
  return (
    n.tomador.nome.toLowerCase().includes(b) ||
    n.servico.apelido.toLowerCase().includes(b) ||
    (d.length > 0 && n.tomador.documento.includes(d)) ||
    (d.length > 0 && String(n.numero_dps ?? '') === d)
  )
}

function contagem(de: string | null, ate: string | null, busca: string) {
  const zero = () => ({
    todas: 0,
    autorizadas: 0,
    enviando: 0,
    rejeitadas: 0,
    canceladas: 0,
    rascunhos: 0,
  })
  const c = zero()
  const valores = zero()
  const chave: Record<string, keyof typeof c> = {
    AUTORIZADA: 'autorizadas',
    ENVIANDO: 'enviando',
    REJEITADA: 'rejeitadas',
    CANCELADA: 'canceladas',
    RASCUNHO: 'rascunhos',
  }
  for (const n of db.notas) {
    if (!noPeriodo(n, de, ate) || !contem(n, busca)) continue
    const k = chave[n.status]
    c[k]++
    valores[k] += n.valor
    if (n.status !== 'RASCUNHO') {
      c.todas++
      valores.todas += n.valor
    }
  }
  return { ...c, valores }
}

function acharNota(id: string) {
  return db.notas.find((n) => n.id === id)
}

function chaveAcesso(numero: number) {
  return `3550308211222333000181${String(numero).padStart(15, '0')}26110${String(numero).padStart(12, '0')}`.slice(
    0,
    50,
  )
}

interface Entrada {
  tomador_id?: string
  servico_id?: string
  descricao?: string
  valor?: number
  competencia?: string
  municipio_prestacao_ibge?: string | null
}

/** Mesmas regras que o backend (Pydantic) vai aplicar. Devolve erro 422 com o campo. */
function validarEntrada(e: Entrada) {
  if (!e.tomador_id || !db.tomadores.some((t) => t.id === e.tomador_id))
    return erro(422, 'Escolha o cliente da nota.', 'CAMPO_OBRIGATORIO', 'tomador_id')
  if (!e.servico_id || !db.servicos.some((s) => s.id === e.servico_id))
    return erro(422, 'Escolha o serviço prestado.', 'CAMPO_OBRIGATORIO', 'servico_id')
  if (!e.descricao?.trim() || e.descricao.length > 1000)
    return erro(422, 'Descreva o serviço (até 1.000 caracteres).', 'CAMPO_INVALIDO', 'descricao')
  if (!e.valor || e.valor <= 0)
    return erro(422, 'Informe um valor maior que zero.', 'CAMPO_INVALIDO', 'valor')
  if (!e.competencia || e.competencia > agoraIso().slice(0, 10))
    return erro(422, 'A competência não pode ser depois de hoje.', 'CAMPO_INVALIDO', 'competencia')
  return null
}

function montarNota(e: Required<Entrada>, base: Partial<NotaMock>): NotaMock {
  const tomador = db.tomadores.find((t) => t.id === e.tomador_id)!
  const servico = db.servicos.find((s) => s.id === e.servico_id)!
  return {
    id: base.id ?? novoId('nfs'),
    serie: '00001',
    numero_dps: null,
    chave_acesso: null,
    status: 'RASCUNHO',
    ambiente: db.empresa.ambiente,
    valor: e.valor,
    competencia: e.competencia,
    emitida_em: null,
    criada_em: agoraIso(),
    tomador: structuredClone(tomador),
    servico: {
      id: servico.id,
      apelido: servico.apelido,
      codigo_servico: servico.codigo_servico,
      nbs: servico.nbs,
    },
    descricao: e.descricao.trim(),
    municipio_prestacao: structuredClone(db.empresa.municipio),
    tributos: null,
    eventos: [],
    ...base,
  } as NotaMock
}

/* ---------------------------------------------------------------- */
/* Rotas                                                             */
/* ---------------------------------------------------------------- */

export const rotasNotas: Record<string, Handler> = {
  'GET /notas/contagem': ({ query }) =>
    ok(contagem(query.get('de'), query.get('ate'), query.get('busca') ?? '')),

  'GET /notas': ({ query }) => {
    const status = query.get('status') ?? 'todas'
    const de = query.get('de')
    const ate = query.get('ate')
    const busca = query.get('busca') ?? ''
    const porPagina = Math.min(Number(query.get('por_pagina') ?? query.get('limite') ?? 10), 100)
    const pagina = Math.max(Number(query.get('pagina') ?? 1), 1)

    const alvo = STATUS_DO_FILTRO[status]
    const filtradas = db.notas
      .filter((n) => (alvo ? n.status === alvo : n.status !== 'RASCUNHO'))
      .filter((n) => noPeriodo(n, de, ate))
      .filter((n) => contem(n, busca))
      .sort((a, b) => dataDaNota(b).localeCompare(dataDaNota(a)))

    return ok({
      itens: filtradas.slice((pagina - 1) * porPagina, pagina * porPagina).map(semHistorico),
      total: filtradas.length,
      valor_total: filtradas.reduce((s, n) => s + n.valor, 0),
      pagina,
      por_pagina: porPagina,
    })
  },

  'GET /notas/:id': ({ params }) => {
    const n = acharNota(params.id)
    return n ? ok(n) : erro(404, 'Nota não encontrada.', 'NAO_ENCONTRADA')
  },

  'POST /notas/previa': ({ body }) => {
    const { rascunho_id, ...e } = (body ?? {}) as Entrada & { rascunho_id?: string }
    const invalido = validarEntrada(e)
    if (invalido) return invalido

    const tomador = db.tomadores.find((t) => t.id === e.tomador_id)!
    const servico = db.servicos.find((s) => s.id === e.servico_id)!
    const emp = db.empresa
    const previa_id = novoId('prv')
    const avisos: string[] = []
    if (emp.ambiente === 'TESTES')
      avisos.push(
        'Ambiente de testes: esta nota não tem valor fiscal e serve só para conferir o processo.',
      )
    if (!tomador.email)
      avisos.push('O cliente não tem e-mail cadastrado: envie o PDF para ele por outro meio.')

    const resposta = {
      previa_id,
      expira_em: new Date(Date.now() + 10 * 60_000).toISOString(),
      ambiente: emp.ambiente,
      dps: {
        serie: '00001',
        numero_dps: db.proximoNumero,
        competencia: e.competencia,
        prestador: {
          cnpj: emp.cnpj,
          razao_social: emp.razao_social,
          inscricao_municipal: emp.inscricao_municipal,
          regime_rotulo:
            emp.regime === 'MEI'
              ? 'MEI (opSimpNac = 2)'
              : 'Simples Nacional ME/EPP (opSimpNac = 3)',
          municipio: emp.municipio,
        },
        tomador,
        servico: {
          id: servico.id,
          apelido: servico.apelido,
          codigo_servico: servico.codigo_servico,
          nbs: servico.nbs,
          descricao: e.descricao!.trim(),
          municipio: emp.municipio,
        },
        valor: e.valor,
      },
      valores_fixos: [
        {
          campo: 'tpEmit',
          rotulo: 'Quem emite',
          valor: '1 · Prestador',
          explicacao: 'A própria empresa emite a nota do serviço que prestou.',
        },
        {
          campo: 'tribISSQN',
          rotulo: 'ISS',
          valor: '1 · Operação tributável',
          explicacao: 'O serviço tem ISS. Para o MEI ele já está incluído no DAS mensal.',
        },
        {
          campo: 'tpRetISSQN',
          rotulo: 'Retenção do ISS',
          valor: '1 · Não retido',
          explicacao: 'O cliente não desconta o ISS do pagamento.',
        },
        {
          campo: 'regEspTrib',
          rotulo: 'Regime especial',
          valor: '0 · Nenhum',
          explicacao: 'A empresa não usa regime especial de tributação municipal.',
        },
      ],
      tributos: { situacao: 'NAO_DESTACADO_MEI', cbs: null, ibs: null, calculadora: null },
      avisos,
    }
    const previa: PreviaMock = {
      previa_id,
      expira_em: Date.now() + 10 * 60_000,
      entrada: {
        ...(e as Required<Entrada>),
        municipio_prestacao_ibge: e.municipio_prestacao_ibge ?? null,
      },
      rascunho_id,
      resposta,
    }
    db.previas.set(previa_id, previa)
    return ok(resposta)
  },

  'POST /notas': ({ body }) => {
    const { previa_id, confirmacao } = (body ?? {}) as { previa_id?: string; confirmacao?: boolean }
    if (confirmacao !== true)
      return erro(
        422,
        'Confirme que os dados da prévia estão corretos antes de emitir.',
        'CONFIRMACAO_AUSENTE',
        'confirmacao',
      )
    const previa = previa_id ? db.previas.get(previa_id) : undefined
    if (!previa)
      return erro(409, 'Prévia não encontrada. Gere a prévia de novo.', 'PREVIA_INVALIDA')
    if (previa.expira_em < Date.now())
      return erro(409, 'A prévia expirou. Gere uma nova para conferir os dados.', 'PREVIA_EXPIRADA')
    db.previas.delete(previa.previa_id)

    const numero = db.proximoNumero++
    const agora = agoraIso()
    const nota = montarNota(previa.entrada, {
      status: 'AUTORIZADA',
      numero_dps: numero,
      chave_acesso: chaveAcesso(numero),
      emitida_em: agora,
      tributos: { situacao: 'NAO_DESTACADO_MEI', cbs: null, ibs: null, calculadora: null },
      eventos: [
        { tipo: 'NOTA_AUTORIZADA', descricao: 'Nota autorizada pelo governo', ocorrido_em: agora },
        {
          tipo: 'NOTA_ENVIADA',
          descricao: 'DPS assinada e enviada ao Sistema Nacional NFS-e',
          ocorrido_em: agora,
        },
        {
          tipo: 'PREVIA_GERADA',
          descricao: 'Prévia conferida e emissão confirmada',
          ocorrido_em: agora,
        },
      ],
    } as Partial<NotaMock>)
    if (previa.rascunho_id) db.notas = db.notas.filter((n) => n.id !== previa.rascunho_id)
    db.notas.unshift(nota)
    return { status: 201, body: nota, atrasoExtra: 1400 }
  },

  'POST /notas/rascunhos': ({ body }) => {
    const { rascunho_id, ...e } = (body ?? {}) as Entrada & { rascunho_id?: string }
    if (!e.tomador_id || !e.servico_id)
      return erro(
        422,
        'Para salvar o rascunho, escolha pelo menos o cliente e o serviço.',
        'CAMPO_OBRIGATORIO',
        e.tomador_id ? 'servico_id' : 'tomador_id',
      )
    const agora = agoraIso()
    const existente = rascunho_id ? acharNota(rascunho_id) : undefined
    const nota = montarNota(
      {
        tomador_id: e.tomador_id,
        servico_id: e.servico_id,
        descricao: e.descricao ?? '',
        valor: e.valor ?? 0,
        competencia: e.competencia ?? agora.slice(0, 10),
        municipio_prestacao_ibge: null,
      },
      {
        id: existente?.id ?? novoId('rsc'),
        eventos: [
          { tipo: 'RASCUNHO_SALVO', descricao: 'Rascunho salvo', ocorrido_em: agora },
          ...(existente?.eventos ?? []),
        ],
      } as Partial<NotaMock>,
    )
    db.notas = [nota, ...db.notas.filter((n) => n.id !== nota.id)]
    return { status: existente ? 200 : 201, body: nota }
  },

  'DELETE /notas/:id': ({ params }) => {
    const n = acharNota(params.id)
    if (!n) return erro(404, 'Nota não encontrada.', 'NAO_ENCONTRADA')
    if (n.status !== 'RASCUNHO')
      return erro(
        409,
        'Só rascunhos podem ser excluídos. Notas emitidas são canceladas.',
        'OPERACAO_INVALIDA',
      )
    db.notas = db.notas.filter((x) => x.id !== n.id)
    return { status: 204 }
  },

  'POST /notas/:id/cancelar': ({ params, body }) => {
    const n = acharNota(params.id)
    if (!n) return erro(404, 'Nota não encontrada.', 'NAO_ENCONTRADA')
    if (n.status !== 'AUTORIZADA')
      return erro(409, 'Só notas autorizadas podem ser canceladas.', 'OPERACAO_INVALIDA')
    const { motivo, justificativa } = (body ?? {}) as { motivo?: number; justificativa?: string }
    if (![1, 2, 9].includes(motivo ?? 0))
      return erro(422, 'Escolha o motivo do cancelamento.', 'CAMPO_OBRIGATORIO', 'motivo')
    const texto = justificativa?.trim() ?? ''
    if (texto.length < 15 || texto.length > 255)
      return erro(
        422,
        'A justificativa precisa ter de 15 a 255 caracteres.',
        'CAMPO_INVALIDO',
        'justificativa',
      )
    const agora = agoraIso()
    const rotulo = { 1: 'erro na emissão', 2: 'serviço não prestado', 9: 'outros' }[
      motivo as 1 | 2 | 9
    ]
    n.status = 'CANCELADA'
    n.cancelamento = { motivo: motivo!, justificativa: texto, cancelada_em: agora }
    n.eventos.unshift({
      tipo: 'NOTA_CANCELADA',
      descricao: `Cancelada: ${rotulo}`,
      ocorrido_em: agora,
    })
    return { ...ok(n), atrasoExtra: 900 }
  },

  'POST /notas/:id/consultar': ({ params }) => {
    const n = acharNota(params.id)
    if (!n) return erro(404, 'Nota não encontrada.', 'NAO_ENCONTRADA')
    if (n.status === 'RASCUNHO')
      return erro(409, 'Rascunhos ainda não foram enviados ao governo.', 'OPERACAO_INVALIDA')
    const agora = agoraIso()
    if (n.status === 'ENVIANDO') {
      n.status = 'AUTORIZADA'
      n.chave_acesso = chaveAcesso(n.numero_dps ?? 0)
      n.eventos.unshift({
        tipo: 'NOTA_AUTORIZADA',
        descricao: 'Nota autorizada pelo governo',
        ocorrido_em: agora,
      })
    } else {
      n.eventos.unshift({
        tipo: 'SITUACAO_CONSULTADA',
        descricao: 'Situação conferida no governo: sem mudanças',
        ocorrido_em: agora,
      })
    }
    return { ...ok(n), atrasoExtra: 700 }
  },

  'GET /notas/:id/xml': ({ params }) => {
    const n = acharNota(params.id)
    if (!n?.chave_acesso)
      return erro(404, 'XML disponível só para notas autorizadas ou canceladas.', 'SEM_ARQUIVO')
    return { status: 200, arquivo: { conteudo: gerarXml(n), tipo: 'application/xml' } }
  },

  'GET /notas/:id/pdf': ({ params }) => {
    const n = acharNota(params.id)
    if (!n?.chave_acesso)
      return erro(404, 'PDF disponível só para notas autorizadas ou canceladas.', 'SEM_ARQUIVO')
    return { status: 200, arquivo: { conteudo: gerarPdf(n), tipo: 'application/pdf' } }
  },
}
