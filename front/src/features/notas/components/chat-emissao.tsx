import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import {
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form'
import {
  ArrowRight,
  ArrowUp,
  Building,
  Check,
  Clock,
  Loader2,
  Package,
  Pencil,
  Save,
  User,
} from 'lucide-react'
import { CampoMoeda } from '@/components/shared/campo-moeda'
import { classeInput } from '@/components/shared/campo'
import { Logo } from '@/components/shared/logo'
import { SeletorBusca } from '@/components/shared/seletor-busca'
import { useSessao } from '@/features/auth/session'
import { useServicos } from '@/features/servicos/hooks/use-servicos'
import type { Servico } from '@/features/servicos/schemas/servico'
import { useTomadores } from '@/features/tomadores/hooks/use-tomadores'
import type { Tomador } from '@/features/tomadores/schemas/tomador'
import { classeBotao } from '@/lib/estilos'
import { formatarData, formatarDocumento, formatarMoeda, primeiroNome } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formularioNotaSchema, hojeIso, type FormularioNotaEntrada } from '../schemas/formulario'
import {
  avancar,
  ORDEM,
  push,
  reducer,
  type CampoChat,
  type Estado,
  type Msg,
} from './chat-roteiro'

/* ------------------------------------------------------------------ */
/* Bolhas                                                              */
/* ------------------------------------------------------------------ */

const entrada = 'animate-in fade-in-0 slide-in-from-bottom-2 duration-300'

function BolhaSistema({
  children,
  ajuda,
  primeira,
}: {
  children: ReactNode
  ajuda?: ReactNode
  primeira?: boolean
}) {
  return (
    <div className={cn('flex max-w-[92%] items-end gap-2.5 sm:max-w-[80%]', entrada)}>
      <span className={cn('shrink-0', !primeira && 'invisible')}>
        <Logo compacto className="[&_svg]:size-3.5 [&>span]:size-7 [&>span]:rounded-full" />
      </span>
      <div className="rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-2.5 shadow-card">
        <div className="text-sm leading-relaxed">{children}</div>
        {ajuda && <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{ajuda}</div>}
      </div>
    </div>
  )
}

function BolhaPessoa({
  texto,
  pulou,
  onEditar,
}: {
  texto: string
  pulou?: boolean
  onEditar?: () => void
}) {
  return (
    <div className={cn('flex justify-end', entrada)}>
      <button
        type="button"
        onClick={onEditar}
        disabled={!onEditar}
        title={onEditar ? 'Alterar esta resposta' : undefined}
        className={cn(
          'group relative max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-left text-sm leading-relaxed whitespace-pre-line transition-colors sm:max-w-[75%]',
          pulou
            ? 'border border-dashed border-warning/50 bg-warning-soft/60 text-foreground/70'
            : 'bg-brand text-brand-foreground',
          onEditar && !pulou && 'hover:bg-brand-strong',
        )}
      >
        {pulou && <Clock className="mr-1.5 inline size-3.5 -translate-y-px text-warning" />}
        {texto}
        {onEditar && (
          <span
            className={cn(
              'absolute top-1/2 -left-8 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-card text-muted-foreground opacity-0 shadow-card ring-1 ring-border transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
            )}
          >
            <Pencil className="size-3" />
          </span>
        )}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Caixa de resposta (muda conforme a pergunta)                          */
/* ------------------------------------------------------------------ */

function ItemTomador({ t }: { t: Tomador }) {
  const Icone = t.tipo_documento === 'CNPJ' ? Building : User
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-foreground/70">
        <Icone className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{t.nome}</span>
        <span className="tabular block truncate text-xs text-muted-foreground">
          {t.tipo_documento} {formatarDocumento(t.documento)}
        </span>
      </span>
    </span>
  )
}

function ItemServico({ s }: { s: Servico }) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-foreground/70">
        <Package className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{s.apelido}</span>
        <span className="tabular block truncate text-xs text-muted-foreground">
          Código {s.codigo_servico}
        </span>
      </span>
    </span>
  )
}

function BotaoEnviar({ desabilitado, onClick }: { desabilitado?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label="Enviar resposta"
      className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-strong disabled:opacity-40"
    >
      <ArrowUp className="size-5" />
    </button>
  )
}

function Atalho({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 rounded-full border border-border bg-card px-3.5 text-[13px] font-medium transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong"
    >
      {children}
    </button>
  )
}

/** Caixa de resposta: Enter envia a resposta (sem enviar o formulário da nota). */
function FormResposta({ onEnviar, children }: { onEnviar: () => void; children: ReactNode }) {
  return (
    <div
      role="form"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !(e.target instanceof HTMLButtonElement)) {
          e.preventDefault()
          onEnviar()
        }
      }}
    >
      {children}
    </div>
  )
}

const ontemIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Composer({
  campo,
  valores,
  tomadores,
  servicos,
  erro,
  onResponder,
}: {
  campo: CampoChat
  valores: FormularioNotaEntrada
  tomadores: Tomador[]
  servicos: Servico[]
  erro: string | null
  onResponder: (valor: unknown) => void
}) {
  const servico = servicos.find((s) => s.id === valores.servico_id)
  const [texto, setTexto] = useState(() => valores.descricao || servico?.descricao_padrao || '')
  const [valor, setValor] = useState<number | undefined>(valores.valor || undefined)
  const [data, setData] = useState(valores.competencia || hojeIso())
  const foco = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => foco.current?.focus(), 320)
    return () => clearTimeout(t)
  }, [campo])

  if (campo === 'tomador_id')
    return (
      <SeletorBusca
        itens={tomadores}
        valor={valores.tomador_id || undefined}
        onChange={(v) => onResponder(v)}
        textoBusca={(t) => `${t.nome} ${t.documento} ${formatarDocumento(t.documento)}`}
        renderItem={(t) => <ItemTomador t={t} />}
        renderSelecionado={(t) => <ItemTomador t={t} />}
        placeholder="Toque para escolher o cliente"
        placeholderBusca="Buscar por nome, CPF ou CNPJ"
        vazio="Nenhum cliente encontrado."
        invalido={!!erro}
      />
    )

  if (campo === 'servico_id')
    return (
      <SeletorBusca
        itens={servicos}
        valor={valores.servico_id || undefined}
        onChange={(v) => onResponder(v)}
        textoBusca={(s) => `${s.apelido} ${s.codigo_servico}`}
        renderItem={(s) => <ItemServico s={s} />}
        renderSelecionado={(s) => <ItemServico s={s} />}
        placeholder="Toque para escolher o serviço"
        placeholderBusca="Buscar serviço ou código"
        vazio="Nenhum serviço encontrado."
        invalido={!!erro}
      />
    )

  if (campo === 'descricao')
    return (
      <FormResposta onEnviar={() => onResponder(texto)}>
        {servico && texto !== servico.descricao_padrao && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Atalho onClick={() => setTexto(servico.descricao_padrao)}>
              Usar texto padrão do serviço
            </Atalho>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={(el) => {
                foco.current = el
              }}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={2}
              aria-invalid={!!erro}
              placeholder="Ex.: Criação de 12 artes para redes sociais em novembro."
              className={cn(
                classeInput,
                'h-auto max-h-40 min-h-11 resize-none py-2.5 pr-16 leading-relaxed',
              )}
            />
            <span className="tabular pointer-events-none absolute right-3 bottom-2 text-[11px] text-muted-foreground">
              {texto.length}/1000
            </span>
          </div>
          <BotaoEnviar desabilitado={!texto.trim()} onClick={() => onResponder(texto)} />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Enter envia · Shift + Enter quebra a linha
        </p>
      </FormResposta>
    )

  if (campo === 'valor')
    return (
      <FormResposta onEnviar={() => onResponder(valor)}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <CampoMoeda
              ref={(el) => {
                foco.current = el
              }}
              value={valor}
              onChange={setValor}
              aria-invalid={!!erro}
              className="text-base"
            />
          </div>
          <BotaoEnviar desabilitado={!valor} onClick={() => onResponder(valor)} />
        </div>
      </FormResposta>
    )

  // competência
  return (
    <FormResposta onEnviar={() => onResponder(data)}>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Atalho onClick={() => onResponder(hojeIso())}>Hoje</Atalho>
        <Atalho onClick={() => onResponder(ontemIso())}>Ontem</Atalho>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={(el) => {
            foco.current = el
          }}
          type="date"
          value={data}
          max={hojeIso()}
          onChange={(e) => setData(e.target.value)}
          aria-invalid={!!erro}
          aria-label="Data do serviço"
          className={cn(classeInput, 'tabular flex-1')}
        />
        <BotaoEnviar desabilitado={!data} onClick={() => onResponder(data)} />
      </div>
    </FormResposta>
  )
}

/* ------------------------------------------------------------------ */
/* Chat                                                                 */
/* ------------------------------------------------------------------ */

export interface Reabertura {
  campo: CampoChat
  mensagem: string
  /** Muda a cada pedido, para reabrir de novo a mesma pergunta. */
  n: number
}

/**
 * Emissão em formato de conversa: cada pergunta é um campo da nota e cada
 * resposta já entra formatada. Dá para responder depois (a pergunta volta no
 * fim) e alterar qualquer resposta tocando nela.
 */
export function ChatEmissao({
  control,
  setValue,
  getValues,
  reabrir,
  gerando,
  salvando,
  onSalvarRascunho,
  onPendentes,
}: {
  control: Control<FormularioNotaEntrada>
  setValue: UseFormSetValue<FormularioNotaEntrada>
  getValues: UseFormGetValues<FormularioNotaEntrada>
  reabrir: Reabertura | null
  gerando: boolean
  salvando: boolean
  onSalvarRascunho: () => void
  onPendentes: (puladas: CampoChat[]) => void
}) {
  const sessao = useSessao()
  const tomadores = useTomadores().data?.itens ?? []
  const servicos = useServicos().data?.itens ?? []
  const valores = useWatch({ control }) as FormularioNotaEntrada
  const [erroDe, setErroDe] = useState<{ campo: CampoChat; mensagem: string } | null>(null)
  const fim = useRef<HTMLDivElement>(null)

  const exibir = (campo: CampoChat, v: unknown): string => {
    switch (campo) {
      case 'tomador_id': {
        const t = tomadores.find((x) => x.id === v)
        return t ? `${t.nome}\n${t.tipo_documento} ${formatarDocumento(t.documento)}` : String(v)
      }
      case 'servico_id':
        return servicos.find((x) => x.id === v)?.apelido ?? String(v)
      case 'valor':
        return formatarMoeda(Number(v))
      case 'competencia': {
        const d = String(v)
        return d === hojeIso()
          ? `Hoje, ${formatarData(d)}`
          : d === ontemIso()
            ? `Ontem, ${formatarData(d)}`
            : formatarData(d)
      }
      default:
        return String(v).trim()
    }
  }

  const [continuando] = useState(() => ORDEM.filter((c) => !!getValues()[c]).length >= 2)
  const [estado, dispatch] = useReducer(reducer, null, () => {
    // Rascunho ou nota recusada: o que já veio preenchido conta como respondido.
    const v = getValues()
    const ok = (c: CampoChat) => formularioNotaSchema.shape[c].safeParse(v[c]).success && !!v[c]
    let e: Estado = { msgs: [], respondidas: [], puladas: [], atual: null, revisita: false, seq: 1 }
    e = push(e, { de: 'sistema', tipo: 'boas_vindas' })
    for (const c of ORDEM.filter(ok)) {
      e = push(e, { de: 'sistema', tipo: 'pergunta', campo: c })
      e = push(
        { ...e, respondidas: [...e.respondidas, c] },
        { de: 'pessoa', tipo: 'resposta', campo: c, texto: '' },
      )
    }
    return avancar(e)
  })

  const erro = erroDe && erroDe.campo === estado.atual ? erroDe.mensagem : null

  // textos das respostas pré-preenchidas (precisam das listas carregadas)
  const textoResposta = (m: Extract<Msg, { de: 'pessoa' }>) =>
    m.texto || (m.tipo === 'resposta' ? exibir(m.campo, valores[m.campo]) : '')

  useEffect(() => {
    onPendentes(estado.puladas)
  }, [estado.puladas, onPendentes])

  useEffect(() => {
    if (reabrir) {
      dispatch({ tipo: 'reabrir', campo: reabrir.campo, mensagem: reabrir.mensagem })
    }
  }, [reabrir])

  useEffect(() => {
    const t = setTimeout(
      () => fim.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }),
      60,
    )
    return () => clearTimeout(t)
  }, [estado.msgs.length])

  const responder = (campo: CampoChat, v: unknown) => {
    const r = formularioNotaSchema.shape[campo].safeParse(v)
    if (!r.success)
      return setErroDe({ campo, mensagem: r.error.issues[0]?.message ?? 'Resposta inválida.' })
    setErroDe(null)
    setValue(campo, r.data as never, { shouldValidate: true, shouldDirty: true })
    dispatch({ tipo: 'responder', campo, texto: exibir(campo, r.data) })
  }

  const tomador = tomadores.find((t) => t.id === valores.tomador_id)
  const pergunta = (campo: CampoChat): { texto: ReactNode; ajuda?: ReactNode } => {
    switch (campo) {
      case 'tomador_id':
        return {
          texto: 'Para quem é esta nota?',
          ajuda: 'Escolha o cliente que contratou o serviço.',
        }
      case 'servico_id':
        return {
          texto: tomador ? (
            <>
              Qual serviço você prestou para <strong>{tomador.nome}</strong>?
            </>
          ) : (
            'Qual serviço você prestou?'
          ),
          ajuda: 'Os serviços vêm do seu catálogo.',
        }
      case 'descricao':
        return {
          texto: 'Como o serviço deve aparecer escrito na nota?',
          ajuda: servicos.some((x) => x.id === valores.servico_id)
            ? 'Já deixei o texto padrão do serviço. Ajuste se quiser.'
            : 'Escreva com suas palavras o que foi feito.',
        }
      case 'valor':
        return {
          texto: 'Qual foi o valor cobrado?',
          ajuda: 'Digite só os números: os centavos entram sozinhos.',
        }
      case 'competencia':
        return {
          texto: 'E quando o serviço foi prestado?',
          ajuda: 'Essa é a competência: define em que mês a nota conta.',
        }
    }
  }

  const nome = sessao ? primeiroNome(sessao.usuario.nome) : ''
  const ultimoSistema = (i: number) => estado.msgs[i + 1]?.de !== 'sistema'

  return (
    <div className="flex min-h-full flex-col rounded-lg border border-border/70 bg-card/60 shadow-card">
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversa de emissão da nota"
        className="flex flex-1 flex-col gap-3 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] p-4 sm:p-6"
      >
        {estado.msgs.map((m, i) => {
          if (m.de === 'pessoa') {
            const editavel =
              m.tipo === 'resposta' &&
              estado.atual !== m.campo &&
              i === lastIndexDoCampo(estado.msgs, m.campo)
            return (
              <BolhaPessoa
                key={m.id}
                texto={textoResposta(m)}
                pulou={m.tipo === 'pulou'}
                onEditar={editavel ? () => dispatch({ tipo: 'editar', campo: m.campo }) : undefined}
              />
            )
          }
          const primeira = ultimoSistema(i)
          if (m.tipo === 'boas_vindas')
            return (
              <BolhaSistema key={m.id} primeira={primeira}>
                {continuando ? (
                  <>
                    Vamos continuar de onde você parou{nome && `, ${nome}`}. Já trouxe as respostas
                    salvas.
                  </>
                ) : (
                  <>
                    Oi{nome && `, ${nome}`}! Vou te ajudar a emitir a nota com 5 perguntas rápidas.
                    Se não souber alguma, toque em <strong>Responder depois</strong>.
                  </>
                )}
              </BolhaSistema>
            )
          if (m.tipo === 'aviso')
            return (
              <BolhaSistema key={m.id} primeira={primeira}>
                {m.texto}
              </BolhaSistema>
            )
          if (m.tipo === 'fim')
            return (
              <BolhaSistema
                key={m.id}
                primeira={primeira}
                ajuda="Nada é enviado ao governo antes da sua confirmação na prévia."
              >
                Pronto! Confira o resumo ao lado. Para mudar algo, toque na resposta.
              </BolhaSistema>
            )
          const p = pergunta(m.campo!)
          return (
            <BolhaSistema
              key={m.id}
              primeira={primeira}
              ajuda={estado.atual === m.campo && i === estado.msgs.length - 1 ? p.ajuda : undefined}
            >
              {p.texto}
            </BolhaSistema>
          )
        })}
        <div ref={fim} className="h-px" />
      </div>

      {/* Caixa de resposta */}
      <div className="sticky bottom-0 rounded-b-lg border-t border-border bg-card/95 p-3 backdrop-blur-sm sm:p-4">
        {estado.atual ? (
          <div key={`${estado.atual}-${estado.seq}`} className="animate-in duration-200 fade-in-0">
            <Composer
              campo={estado.atual}
              valores={valores}
              tomadores={tomadores}
              servicos={servicos}
              erro={erro}
              onResponder={(v) => responder(estado.atual!, v)}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {erro ? (
                <p role="alert" className="text-xs font-medium text-danger">
                  {erro}
                </p>
              ) : (
                <p className="tabular text-xs text-muted-foreground">
                  Pergunta {ORDEM.indexOf(estado.atual) + 1} de {ORDEM.length}
                  {estado.puladas.length > 0 && ` · ${estado.puladas.length} para depois`}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setErroDe(null)
                  dispatch({ tipo: 'pular', campo: estado.atual! })
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Clock className="size-3.5" /> Não sei ainda · responder depois
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={gerando}
              className={cn(classeBotao.primario, 'h-11 flex-1')}
            >
              {gerando ? (
                <>
                  <Loader2 className="animate-spin" /> Gerando prévia…
                </>
              ) : (
                <>
                  <Check /> Conferir prévia <ArrowRight />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onSalvarRascunho}
              disabled={salvando}
              className={cn(classeBotao.secundario, 'h-11')}
            >
              {salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar rascunho
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function lastIndexDoCampo(msgs: Msg[], campo: CampoChat) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i]
    if (m.de === 'pessoa' && m.campo === campo) return i
  }
  return -1
}
