import { avancar, push, reducer, type Estado } from './chat-roteiro'

const inicio = (): Estado =>
  avancar(
    push(
      { msgs: [], respondidas: [], puladas: [], atual: null, revisita: false, seq: 1 },
      { de: 'sistema', tipo: 'boas_vindas' },
    ),
  )

const responder = (e: Estado) => reducer(e, { tipo: 'responder', campo: e.atual!, texto: 'ok' })
const pular = (e: Estado) => reducer(e, { tipo: 'pular', campo: e.atual! })

describe('roteiro do chat de emissão', () => {
  it('pergunta na ordem: cliente, serviço, descrição, valor, data', () => {
    let e = inicio()
    const ordem = []
    while (e.atual) {
      ordem.push(e.atual)
      e = responder(e)
    }
    expect(ordem).toEqual(['tomador_id', 'servico_id', 'descricao', 'valor', 'competencia'])
    expect(e.msgs.at(-1)).toMatchObject({ tipo: 'fim' })
  })

  it('pergunta pulada volta no fim, com aviso', () => {
    let e = inicio() // cliente
    e = responder(e) // serviço
    e = pular(e) // pula serviço -> descrição
    expect(e.atual).toBe('descricao')
    e = responder(e) // valor
    e = pular(e) // pula valor -> data
    e = responder(e) // acabou a ordem: volta ao serviço (primeiro pulado)
    expect(e.atual).toBe('servico_id')
    expect(e.revisita).toBe(true)
    expect(e.msgs.some((m) => m.de === 'sistema' && m.tipo === 'aviso')).toBe(true)
    e = responder(e) // depois volta ao valor
    expect(e.atual).toBe('valor')
    e = responder(e)
    expect(e.atual).toBeNull()
  })

  it('pular de novo na revisita avisa sobre o rascunho e continua perguntando', () => {
    let e = inicio()
    e = pular(e) // pula cliente
    while (e.atual && e.atual !== 'tomador_id') e = responder(e)
    expect(e.revisita).toBe(true)
    e = pular(e)
    const aviso = e.msgs.filter((m) => m.de === 'sistema' && m.tipo === 'aviso').at(-1)
    expect(aviso && 'texto' in aviso && aviso.texto).toMatch(/rascunho/)
    expect(e.atual).toBe('tomador_id')
  })

  it('editar reabre a pergunta e depois segue para o fim', () => {
    let e = inicio()
    while (e.atual) e = responder(e)
    e = reducer(e, { tipo: 'editar', campo: 'valor' })
    expect(e.atual).toBe('valor')
    e = responder(e)
    expect(e.atual).toBeNull()
  })

  it('reabrir por erro tira a resposta e pergunta de novo', () => {
    let e = inicio()
    while (e.atual) e = responder(e)
    e = reducer(e, {
      tipo: 'reabrir',
      campo: 'competencia',
      mensagem: 'A competência não pode ser depois de hoje.',
    })
    expect(e.respondidas).not.toContain('competencia')
    expect(e.atual).toBe('competencia')
  })
})
