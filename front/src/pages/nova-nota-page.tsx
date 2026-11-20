import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, Loader2, RotateCcw, Save, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { CabecalhoPagina } from '@/components/shared/cabecalho-pagina'
import { AreaComLateral } from '@/components/shared/area-com-lateral'
import { Chip } from '@/components/shared/status-chip'
import { Skeleton } from '@/components/ui/skeleton'
import { useEmpresaAtual } from '@/features/empresas/hooks/use-empresa'
import { EtapasEmissao, SeloAmbiente } from '@/features/notas/components/etapas-emissao'
import { ChatEmissao, type Reabertura } from '@/features/notas/components/chat-emissao'
import { ORDEM, type CampoChat } from '@/features/notas/components/chat-roteiro'
import { PreviaNota } from '@/features/notas/components/previa-nota'
import { ResultadoEmissao } from '@/features/notas/components/resultado-emissao'
import {
  useEmitirNota,
  useNota,
  usePrevia,
  useSalvarRascunho,
} from '@/features/notas/hooks/use-notas'
import {
  formularioNotaSchema,
  hojeIso,
  type FormularioNota as Form,
  type FormularioNotaEntrada,
} from '@/features/notas/schemas/formulario'
import type { Nota, Previa } from '@/features/notas/schemas/nota'
import { useServicos } from '@/features/servicos/hooks/use-servicos'
import { useTomadores } from '@/features/tomadores/hooks/use-tomadores'
import { ApiError } from '@/lib/api'
import { classeBotao } from '@/lib/estilos'
import { formatarData, formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'

const vazio: FormularioNotaEntrada = {
  tomador_id: '',
  servico_id: '',
  descricao: '',
  valor: undefined as unknown as number,
  competencia: '',
}

function LinhaResumo({
  rotulo,
  valor,
  depois,
}: {
  rotulo: string
  valor?: string
  depois?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-[13px] mbaixa:py-1.5">
      <dt className="shrink-0 text-muted-foreground">{rotulo}</dt>
      <dd
        className={cn(
          'truncate text-right font-medium',
          !valor && 'font-normal text-muted-foreground/50',
        )}
      >
        {valor ?? (depois ? <Chip tom="atencao">Depois</Chip> : '—')}
      </dd>
    </div>
  )
}

/** Resumo em forma de recibo, fixo ao lado do formulário (etapa 1). */
function ResumoLateral({
  form,
  ambiente,
  municipio,
  gerando,
  salvando,
  onSalvar,
  puladas,
}: {
  form: FormularioNotaEntrada
  ambiente: 'TESTES' | 'PRODUCAO'
  municipio?: string
  gerando: boolean
  salvando: boolean
  onSalvar: () => void
  puladas: CampoChat[]
}) {
  const tomadores = useTomadores()
  const servicos = useServicos()
  const t = tomadores.data?.itens.find((x) => x.id === form.tomador_id)
  const s = servicos.data?.itens.find((x) => x.id === form.servico_id)
  const completos = [t, s, form.valor, form.competencia].filter(Boolean).length

  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-card">
      <div className="px-5 pt-5 mbaixa:pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Resumo da nota</p>
          <Chip tom={ambiente === 'TESTES' ? 'atencao' : 'erro'}>
            {ambiente === 'TESTES' ? 'Testes' : 'Produção'}
          </Chip>
        </div>
        <p className="tabular mt-0.5 text-xs text-muted-foreground mbaixa:hidden">
          {completos} de 4 informações preenchidas
        </p>
        <dl className="mt-3 divide-y divide-border/60 mbaixa:mt-1.5">
          <LinhaResumo rotulo="Cliente" valor={t?.nome} depois={puladas.includes('tomador_id')} />
          <LinhaResumo
            rotulo="Serviço"
            valor={s?.apelido}
            depois={puladas.includes('servico_id')}
          />
          <LinhaResumo
            rotulo="Competência"
            valor={form.competencia ? formatarData(form.competencia) : undefined}
            depois={puladas.includes('competencia')}
          />
          <LinhaResumo rotulo="Local" valor={municipio} />
        </dl>
      </div>

      <div className="relative mt-3 border-t border-dashed border-border px-5 py-4 mbaixa:mt-1.5 mbaixa:py-3">
        <span className="absolute -top-2 -left-2 size-4 rounded-full bg-canvas" aria-hidden />
        <span className="absolute -top-2 -right-2 size-4 rounded-full bg-canvas" aria-hidden />
        <p className="text-xs text-muted-foreground">Valor da nota</p>
        <p className="tabular text-[28px] leading-tight font-semibold tracking-tight">
          {form.valor ? formatarMoeda(form.valor) : 'R$ 0,00'}
        </p>
        {puladas.includes('valor') && (
          <p className="mt-1">
            <Chip tom="atencao">Valor ficou para depois</Chip>
          </p>
        )}
        <p className="sr-only"></p>
      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-surface/60 p-5 mbaixa:p-4">
        <button
          type="submit"
          disabled={gerando}
          className={cn(classeBotao.primario, 'h-11 w-full')}
        >
          {gerando ? (
            <>
              <Loader2 className="animate-spin" /> Gerando prévia…
            </>
          ) : (
            <>
              Conferir prévia <ArrowRight />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando}
          className={cn(classeBotao.secundario, 'w-full')}
        >
          {salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar rascunho
        </button>
        <p className="mt-1 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground mbaixa:hidden">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
          Nada é enviado ao governo agora. Você confere tudo antes de emitir.
        </p>
      </div>
    </div>
  )
}

export function NovaNotaPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const rascunhoId = params.get('rascunho') ?? undefined
  const origemId = rascunhoId ?? params.get('de') ?? undefined
  const origem = useNota(origemId)
  const { data: empresa } = useEmpresaAtual()

  const [etapa, setEtapa] = useState<0 | 1 | 2>(0)
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [emitida, setEmitida] = useState<Nota | null>(null)
  const [erroEmissao, setErroEmissao] = useState<string | null>(null)

  const gerarPrevia = usePrevia()
  const emitir = useEmitirNota()
  const salvar = useSalvarRascunho()

  const { control, handleSubmit, setValue, reset, getValues } = useForm<
    FormularioNotaEntrada,
    unknown,
    Form
  >({
    resolver: zodResolver(formularioNotaSchema),
    defaultValues: vazio,
  })
  const valores = useWatch({ control }) as FormularioNotaEntrada

  // Rascunho ou nota rejeitada: preenche o formulário com os dados de origem.
  const preenchido = useRef<string | null>(null)
  const [prefillPronto, setPrefillPronto] = useState(!origemId)
  const [reabrir, setReabrir] = useState<Reabertura | null>(null)
  const [puladas, setPuladas] = useState<CampoChat[]>([])
  const onPendentes = useCallback((p: CampoChat[]) => setPuladas(p), [])
  const reabrirCampo = (campo: CampoChat, mensagem: string) =>
    setReabrir((r) => ({ campo, mensagem, n: (r?.n ?? 0) + 1 }))
  const [colunaRolagem, setColunaRolagem] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    const n = origem.data
    if (!n || preenchido.current === n.id) return
    preenchido.current = n.id
    reset({
      tomador_id: n.tomador.id,
      servico_id: n.servico.id,
      descricao: n.descricao,
      valor: n.valor || (undefined as unknown as number),
      competencia: n.competencia <= hojeIso() ? n.competencia : hojeIso(),
    })
    setPrefillPronto(true)
  }, [origem.data, reset])

  const irPara = (e: 0 | 1 | 2) => {
    setEtapa(e)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    colunaRolagem?.scrollTo({ top: 0 })
  }

  const aplicarErroApi = (e: unknown) => {
    if (e instanceof ApiError && e.campo && (ORDEM as readonly string[]).includes(e.campo)) {
      reabrirCampo(e.campo as CampoChat, e.message)
    } else {
      toast.error('Não foi possível gerar a prévia', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const onPrevia = handleSubmit(
    (dados) => {
      gerarPrevia.mutate(
        { entrada: { ...dados, municipio_prestacao_ibge: null }, rascunhoId },
        {
          onSuccess: (p) => {
            setPrevia(p)
            setErroEmissao(null)
            irPara(1)
          },
          onError: aplicarErroApi,
        },
      )
    },
    // Faltou algo: o chat volta na primeira pergunta com problema.
    (erros) => {
      const campo = ORDEM.find((c) => erros[c])
      if (campo) reabrirCampo(campo, erros[campo]?.message ?? 'Falta responder esta pergunta.')
    },
  )

  const onEmitir = () => {
    if (!previa) return
    setErroEmissao(null)
    emitir.mutate(previa.previa_id, {
      onSuccess: (n) => {
        setEmitida(n)
        irPara(2)
      },
      onError: (e) =>
        setErroEmissao(
          e instanceof ApiError ? e.message : 'Não foi possível emitir agora. Tente de novo.',
        ),
    })
  }

  const onSalvar = () => {
    const v = getValues()
    salvar.mutate(
      {
        entrada: {
          tomador_id: v.tomador_id || undefined,
          servico_id: v.servico_id || undefined,
          descricao: v.descricao,
          valor: v.valor,
          competencia: v.competencia,
        },
        rascunhoId,
      },
      {
        onSuccess: (n) => {
          toast.success('Rascunho salvo', {
            description: 'Você encontra ele em Notas › Rascunhos.',
          })
          if (!rascunhoId) setParams({ rascunho: n.id }, { replace: true })
        },
        onError: aplicarErroApi,
      },
    )
  }

  const recomecar = () => {
    preenchido.current = null
    reset(vazio)
    setReabrir(null)
    setPrevia(null)
    setEmitida(null)
    setParams({}, { replace: true })
    irPara(0)
  }

  const titulo =
    etapa === 2
      ? 'Nota emitida'
      : rascunhoId
        ? 'Continuar rascunho'
        : params.get('de')
          ? 'Corrigir e emitir de novo'
          : 'Nova nota'

  return (
    <div className="flex flex-col gap-5">
      <CabecalhoPagina
        voltar={{ para: '/notas', rotulo: 'Notas' }}
        compacto
        titulo={titulo}
        selo={empresa && <SeloAmbiente ambiente={empresa.ambiente} />}
        subtitulo={
          etapa === 2
            ? 'Tudo certo com o governo. Baixe os arquivos ou emita a próxima nota.'
            : 'Responda às perguntas, confira a prévia e confirme. A nota só é enviada depois da sua confirmação.'
        }
      />
      <EtapasEmissao atual={etapa} />

      {origem.data?.status === 'REJEITADA' && etapa === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-soft/70 px-4 py-3 text-[13px]">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-danger" />
          <p>
            <span className="font-semibold">A nota nº {origem.data.numero_dps} foi recusada</span>{' '}
            {origem.data.erro && (
              <span className="text-muted-foreground">
                ({origem.data.erro.codigo}: {origem.data.erro.mensagem})
              </span>
            )}
            . Corrija o que for preciso e gere uma nova prévia.
          </p>
        </div>
      )}

      {etapa === 0 &&
        ((origemId && origem.isPending) || !prefillPronto ? (
          <Skeleton className="h-96 rounded-lg" />
        ) : (
          <form onSubmit={onPrevia} noValidate>
            <AreaComLateral
              rolagemRef={setColunaRolagem}
              lateral={
                <ResumoLateral
                  form={valores}
                  ambiente={empresa?.ambiente ?? 'TESTES'}
                  municipio={
                    empresa ? `${empresa.municipio.nome}/${empresa.municipio.uf}` : undefined
                  }
                  gerando={gerarPrevia.isPending}
                  salvando={salvar.isPending}
                  onSalvar={onSalvar}
                  puladas={puladas}
                />
              }
            >
              <ChatEmissao
                key={`${origem.data?.id ?? 'nova'}-${emitida?.id ?? ''}`}
                control={control}
                setValue={setValue}
                getValues={getValues}
                reabrir={reabrir}
                gerando={gerarPrevia.isPending}
                salvando={salvar.isPending}
                onSalvarRascunho={onSalvar}
                onPendentes={onPendentes}
              />
            </AreaComLateral>
          </form>
        ))}

      {etapa === 1 && previa && (
        <PreviaNota
          previa={previa}
          emitindo={emitir.isPending}
          erro={erroEmissao}
          onEmitir={onEmitir}
          onVoltar={() => irPara(0)}
          rolagemRef={setColunaRolagem}
        />
      )}

      {etapa === 2 && emitida && (
        <ResultadoEmissao
          nota={emitida}
          onOutra={() => {
            recomecar()
            navigate('/notas/nova', { replace: true })
          }}
        />
      )}
    </div>
  )
}
