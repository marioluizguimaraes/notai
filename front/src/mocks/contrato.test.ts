import { authApi } from '@/features/auth/api/auth'
import { sessao } from '@/features/auth/session'
import { dashboardApi } from '@/features/dashboard/api/dashboard'
import { empresasApi } from '@/features/empresas/api/empresas'
import { notasApi } from '@/features/notas/api/notas'
import { ApiError } from '@/lib/api'

/** Todo JSON de mock precisa passar pelo mesmo schema que a API real vai usar. */
describe('mocks seguem o contrato da API', () => {
  it('recusa login com senha errada (401)', async () => {
    await expect(authApi.login('11222333000181', 'errada')).rejects.toMatchObject({
      status: 401,
      codigo: 'CREDENCIAIS_INVALIDAS',
    })
  })

  it('exige token nas rotas autenticadas', async () => {
    sessao.encerrar()
    await expect(dashboardApi.resumo()).rejects.toBeInstanceOf(ApiError)
  })

  it('valida todas as respostas com sessão ativa', async () => {
    const login = await authApi.login('11222333000181', 'notai123')
    sessao.iniciar({ token: login.access_token, usuario: login.usuario }, false)

    await expect(authApi.me()).resolves.toMatchObject({ cnpj: '11222333000181' })
    await expect(empresasApi.atual()).resolves.toMatchObject({ regime: 'MEI' })
    await expect(dashboardApi.resumo()).resolves.toHaveProperty('kpis')
    await expect(dashboardApi.atividade()).resolves.toHaveProperty('itens')
    await expect(notasApi.contagem({ de: '2026-11', ate: '2026-11' })).resolves.toMatchObject({
      todas: 15,
      autorizadas: 12,
      rascunhos: 2,
    })
    const notas = await notasApi.listar({ de: '2026-11', ate: '2026-11', por_pagina: 2 })
    expect(notas.itens).toHaveLength(2)
    expect(notas.total).toBe(15)
    await expect(notasApi.obter('nfs_023')).resolves.toHaveProperty('eventos')

    sessao.encerrar()
  })
})
