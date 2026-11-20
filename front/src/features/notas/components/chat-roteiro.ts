/**
 * Roteiro da emissão em formato de conversa: ordem das perguntas e a máquina
 * de estados (responder, deixar para depois, editar, reabrir com erro).
 */

export type CampoChat = 'tomador_id' | 'servico_id' | 'descricao' | 'valor' | 'competencia'

export const ORDEM: CampoChat[] = ['tomador_id', 'servico_id', 'descricao', 'valor', 'competencia']

export const ROTULO_CAMPO: Record<CampoChat, string> = {
  tomador_id: 'o cliente',
  servico_id: 'o serviço',
  descricao: 'a descrição',
  valor: 'o valor',
  competencia: 'a data do serviço',
}

export type Msg =
  | { id: number; de: 'sistema'; tipo: 'boas_vindas' | 'fim' | 'pergunta'; campo?: CampoChat }
  | { id: number; de: 'sistema'; tipo: 'aviso'; texto: string }
  | { id: number; de: 'pessoa'; tipo: 'resposta' | 'pulou'; campo: CampoChat; texto: string }

export interface Estado {
  msgs: Msg[]
  respondidas: CampoChat[]
  /** Perguntas deixadas para depois, na ordem em que foram puladas. */
  puladas: CampoChat[]
  atual: CampoChat | null
  /** A pergunta atual é uma volta a uma pulada? */
  revisita: boolean
  seq: number
}

export type Acao =
  | { tipo: 'responder'; campo: CampoChat; texto: string }
  | { tipo: 'pular'; campo: CampoChat }
  | { tipo: 'editar'; campo: CampoChat }
  | { tipo: 'reabrir'; campo: CampoChat; mensagem: string }

type SemId<T> = T extends unknown ? Omit<T, 'id'> : never

export function push(e: Estado, m: SemId<Msg>): Estado {
  return { ...e, msgs: [...e.msgs, { ...m, id: e.seq } as Msg], seq: e.seq + 1 }
}

/** Escolhe a próxima pergunta: primeiro as não respondidas, depois volta às puladas. */
export function avancar(e: Estado): Estado {
  const proxima = ORDEM.find((c) => !e.respondidas.includes(c) && !e.puladas.includes(c))
  if (proxima)
    return push(
      { ...e, atual: proxima, revisita: false },
      { de: 'sistema', tipo: 'pergunta', campo: proxima },
    )
  const [volta, ...resto] = e.puladas
  if (volta) {
    const comAviso = push(
      { ...e, puladas: resto },
      {
        de: 'sistema',
        tipo: 'aviso',
        texto: `Ficou faltando ${ROTULO_CAMPO[volta]}. Vamos resolver agora?`,
      },
    )
    return push(
      { ...comAviso, atual: volta, revisita: true },
      { de: 'sistema', tipo: 'pergunta', campo: volta },
    )
  }
  return push({ ...e, atual: null, revisita: false }, { de: 'sistema', tipo: 'fim' })
}

export function reducer(e: Estado, a: Acao): Estado {
  switch (a.tipo) {
    case 'responder': {
      const r = push(
        {
          ...e,
          respondidas: e.respondidas.includes(a.campo)
            ? e.respondidas
            : [...e.respondidas, a.campo],
          puladas: e.puladas.filter((c) => c !== a.campo),
        },
        { de: 'pessoa', tipo: 'resposta', campo: a.campo, texto: a.texto },
      )
      return avancar(r)
    }
    case 'pular': {
      const r = push(
        { ...e, puladas: [...e.puladas.filter((c) => c !== a.campo), a.campo] },
        { de: 'pessoa', tipo: 'pulou', campo: a.campo, texto: 'Respondo depois' },
      )
      // Era a última pendência e foi pulada de novo: explica e pergunta outra vez.
      const unica =
        r.puladas.length === 1 && ORDEM.every((c) => c === a.campo || r.respondidas.includes(c))
      if (e.revisita && unica) {
        const comAviso = push(r, {
          de: 'sistema',
          tipo: 'aviso',
          texto: `Sem ${ROTULO_CAMPO[a.campo]} não dá para emitir a nota. Se ainda não souber, salve como rascunho e continue depois.`,
        })
        return push(
          { ...comAviso, atual: a.campo, revisita: true },
          { de: 'sistema', tipo: 'pergunta', campo: a.campo },
        )
      }
      return avancar(r)
    }
    case 'editar':
      return push(
        { ...e, atual: a.campo, revisita: false },
        { de: 'sistema', tipo: 'pergunta', campo: a.campo },
      )
    case 'reabrir': {
      const r = push(
        { ...e, respondidas: e.respondidas.filter((c) => c !== a.campo) },
        { de: 'sistema', tipo: 'aviso', texto: a.mensagem },
      )
      return push(
        { ...r, atual: a.campo, revisita: false },
        { de: 'sistema', tipo: 'pergunta', campo: a.campo },
      )
    }
  }
}
