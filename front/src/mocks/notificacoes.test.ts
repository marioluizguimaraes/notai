import { authApi } from '@/features/auth/api/auth'
import { sessao } from '@/features/auth/session'
import { notasApi } from '@/features/notas/api/notas'
import { notificacoesApi } from '@/features/notificacoes/api/notificacoes'

describe('notificações no mock', () => {
  beforeAll(async () => {
    const login = await authApi.login('11222333000181', 'notai123')
    sessao.iniciar({ token: login.access_token, usuario: login.usuario }, false)
  })
  afterAll(() => sessao.encerrar())

  it('lista só as não lidas, da mais recente para a mais antiga', async () => {
    const l = await notificacoesApi.listar()
    expect(l.nao_lidas).toBe(10)
    expect(l.itens).toHaveLength(10)
    expect(l.itens.every((n) => !n.lida)).toBe(true)
    expect(l.itens[0].criada_em >= l.itens[1].criada_em).toBe(true)
  })

  it('marca uma e depois todas como lidas', async () => {
    const um = await notificacoesApi.marcarLida('ntf_07')
    expect(um.nao_lidas).toBe(9)
    expect(um.itens.map((n) => n.id)).not.toContain('ntf_07')
    const todas = await notificacoesApi.marcarTodasLidas()
    expect(todas.itens).toHaveLength(0)
    await expect(notificacoesApi.marcarLida('nao-existe')).rejects.toMatchObject({ status: 404 })
  })

  it('emitir uma nota gera uma notificação nova', async () => {
    const previa = await notasApi.previa({
      tomador_id: 'tom_01',
      servico_id: 'srv_02',
      descricao: 'Artes de novembro.',
      valor: 300,
      competencia: '2026-11-10',
      municipio_prestacao_ibge: null,
    })
    const nota = await notasApi.emitir(previa.previa_id)
    const l = await notificacoesApi.listar()
    expect(l.itens).toHaveLength(1)
    expect(l.itens[0]).toMatchObject({
      tipo: 'NOTA_AUTORIZADA',
      link: `/notas/${nota.id}`,
      lida: false,
    })
  }, 15000)
})
