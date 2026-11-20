import { authApi } from '@/features/auth/api/auth'
import { sessao } from '@/features/auth/session'
import { notasApi } from '@/features/notas/api/notas'

const entrada = {
  tomador_id: 'tom_02',
  servico_id: 'srv_01',
  descricao: 'Criação de identidade visual completa.',
  valor: 1500,
  competencia: '2026-11-10',
  municipio_prestacao_ibge: null,
}

describe('fluxo de notas no mock (mesmas regras da API)', () => {
  beforeAll(async () => {
    const login = await authApi.login('11222333000181', 'notai123')
    sessao.iniciar({ token: login.access_token, usuario: login.usuario }, false)
  })
  afterAll(() => sessao.encerrar())

  it('prévia valida campos e aponta o campo com erro (422)', async () => {
    await expect(notasApi.previa({ ...entrada, valor: 0 })).rejects.toMatchObject({
      status: 422,
      campo: 'valor',
    })
    await expect(notasApi.previa({ ...entrada, tomador_id: 'x' })).rejects.toMatchObject({
      campo: 'tomador_id',
    })
  })

  it('emite só com prévia válida e a nota entra na lista e na contagem', async () => {
    const antes = await notasApi.contagem()
    const previa = await notasApi.previa(entrada)
    expect(previa.dps.numero_dps).toBe(26)
    expect(previa.valores_fixos.map((v) => v.campo)).toContain('tpRetISSQN')

    const nota = await notasApi.emitir(previa.previa_id)
    expect(nota).toMatchObject({ status: 'AUTORIZADA', numero_dps: 26 })
    expect(nota.chave_acesso).toHaveLength(50)

    // a mesma prévia não pode ser usada duas vezes
    await expect(notasApi.emitir(previa.previa_id)).rejects.toMatchObject({ status: 409 })

    const depois = await notasApi.contagem()
    expect(depois.autorizadas).toBe(antes.autorizadas + 1)
    const lista = await notasApi.listar({ status: 'autorizadas', por_pagina: 1 })
    expect(lista.itens[0].id).toBe(nota.id)

    const xml = await notasApi.baixarXml(nota.id)
    expect(await xml.text()).toContain('<nDPS>26</nDPS>')
  }, 15000)

  it('filtra por intervalo de meses (entre, a partir de, até)', async () => {
    const set = await notasApi.listar({ de: '2026-09', ate: '2026-09' })
    expect(set.total).toBe(4)
    const ateOut = await notasApi.listar({ ate: '2026-10' })
    expect(ateOut.total).toBe(10)
    const aPartirOut = await notasApi.contagem({ de: '2026-10' })
    expect(aPartirOut.rascunhos).toBe(2)
    expect(aPartirOut.todas).toBeGreaterThanOrEqual(21)
  })

  it('cancelamento exige motivo e justificativa de 15 a 255 caracteres', async () => {
    await expect(
      notasApi.cancelar('nfs_023', { motivo: 2, justificativa: 'curta' }),
    ).rejects.toMatchObject({
      campo: 'justificativa',
    })
    const n = await notasApi.cancelar('nfs_023', {
      motivo: 2,
      justificativa: 'Cliente desistiu do serviço.',
    })
    expect(n.status).toBe('CANCELADA')
    expect(n.eventos[0].tipo).toBe('NOTA_CANCELADA')
    await expect(
      notasApi.cancelar('nfs_023', { motivo: 2, justificativa: 'Cliente desistiu do serviço.' }),
    ).rejects.toMatchObject({
      status: 409,
    })
  }, 15000)

  it('rascunho pode ser excluído; nota emitida não', async () => {
    await notasApi.excluirRascunho('rsc_002')
    await expect(notasApi.obter('rsc_002')).rejects.toMatchObject({ status: 404 })
    await expect(notasApi.excluirRascunho('nfs_001')).rejects.toMatchObject({ status: 409 })
  })

  it('consultar nota "enviando" traz a autorização', async () => {
    const n = await notasApi.consultar('nfs_024')
    expect(n.status).toBe('AUTORIZADA')
  })
})
