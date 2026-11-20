describe('sessão salva', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.resetModules()
  })

  it('descarta sessão de versão antiga (usuário sem cnpj)', async () => {
    localStorage.setItem(
      'notai.sessao',
      JSON.stringify({
        token: 'abc',
        usuario: { id: 'u', nome: 'Ana', email: 'a@b.com', avatar_url: null },
      }),
    )
    const { sessao } = await import('./session')
    expect(sessao.get()).toBeNull()
    expect(localStorage.getItem('notai.sessao')).toBeNull()
  })

  it('mantém sessão válida', async () => {
    const valida = {
      token: 'abc',
      usuario: { id: 'u', nome: 'Ana', cnpj: '11222333000181', email: null, avatar_url: null },
    }
    localStorage.setItem('notai.sessao', JSON.stringify(valida))
    const { sessao } = await import('./session')
    expect(sessao.get()).toEqual(valida)
  })
})
