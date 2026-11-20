import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Ban,
  Building,
  Clock,
  Copy,
  FileCode2,
  FileDown,
  FileText,
  Fingerprint,
  History,
  Landmark,
  Loader2,
  Package,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { copiarTexto } from '@/lib/copiar'
import { Skeleton } from '@/components/ui/skeleton'
import { CabecalhoPagina } from '@/components/shared/cabecalho-pagina'
import { ErroCarregar } from '@/components/shared/estado'
import { Panel, PanelHeader } from '@/components/shared/panel'
import { Sigla } from '@/components/shared/sigla'
import { StatusNotaChip } from '@/components/shared/status-chip'
import { AcoesNota } from '@/features/notas/components/acoes-nota'
import { SeloAmbiente } from '@/features/notas/components/etapas-emissao'
import { LinhaDoTempo } from '@/features/notas/components/linha-do-tempo'
import { BlocoTributos } from '@/features/notas/components/previa-nota'
import { useBaixarArquivo, useConsultarNota, useNota } from '@/features/notas/hooks/use-notas'
import { MOTIVO_CANCELAMENTO_ROTULO, type Nota } from '@/features/notas/schemas/nota'
import { ApiError } from '@/lib/api'
import { classeBotao } from '@/lib/estilos'
import {
  formatarCEP,
  formatarData,
  formatarDataHora,
  formatarDocumento,
  formatarMoeda,
} from '@/lib/format'
import { cn } from '@/lib/utils'

function Dado({
  rotulo,
  children,
  mono,
}: {
  rotulo: ReactNode
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-[13px] text-muted-foreground">{rotulo}</dt>
      <dd className={cn('text-[13px] font-medium break-words sm:text-right', mono && 'tabular')}>
        {children}
      </dd>
    </div>
  )
}

/** Faixa de situação no topo (mesmo padrão do alerta do painel). */
function FaixaSituacao({ nota }: { nota: Nota }) {
  const consultar = useConsultarNota(nota.id)
  const base =
    'flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border px-4 py-3 sm:flex-nowrap'
  const icone = (Icone: typeof Clock, classe: string) => (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-card shadow-card',
        classe,
      )}
    >
      <Icone className="size-[18px]" />
    </span>
  )

  switch (nota.status) {
    case 'REJEITADA':
      return (
        <div role="alert" className={cn(base, 'border-danger/25 bg-danger-soft/80')}>
          {icone(XCircle, 'text-danger')}
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="text-sm font-semibold">
              Recusada pelo governo{nota.erro && ` · ${nota.erro.codigo}`}
            </p>
            <p className="text-muted-foreground">
              {nota.erro?.mensagem ?? 'Confira os dados e emita de novo.'}
            </p>
          </div>
        </div>
      )
    case 'ENVIANDO':
      return (
        <div role="status" className={cn(base, 'border-warning/25 bg-warning-soft/80')}>
          {icone(Clock, 'text-warning')}
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="text-sm font-semibold">Aguardando resposta do governo</p>
            <p className="text-muted-foreground">
              A nota foi enviada. Consulte a situação em alguns instantes.
            </p>
          </div>
          <button
            type="button"
            disabled={consultar.isPending}
            onClick={() =>
              consultar.mutate(undefined, {
                onSuccess: (n) =>
                  toast.success(
                    n.status === 'AUTORIZADA'
                      ? `Nota nº ${n.numero_dps} autorizada`
                      : 'Situação atualizada',
                  ),
                onError: (e) =>
                  toast.error('Não foi possível consultar', { description: e.message }),
              })
            }
            className={cn(classeBotao.escuro, 'h-9 w-full text-[13px] sm:w-auto')}
          >
            {consultar.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Consultar
            agora
          </button>
        </div>
      )
    case 'CANCELADA':
      return (
        <div role="status" className={cn(base, 'border-border bg-muted/70')}>
          {icone(Ban, 'text-muted-foreground')}
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="text-sm font-semibold">
              Cancelada
              {nota.cancelamento &&
                ` em ${formatarData(nota.cancelamento.cancelada_em)} · ${MOTIVO_CANCELAMENTO_ROTULO[nota.cancelamento.motivo]}`}
            </p>
            {nota.cancelamento && (
              <p className="text-muted-foreground">“{nota.cancelamento.justificativa}”</p>
            )}
          </div>
        </div>
      )
    case 'RASCUNHO':
      return (
        <div role="status" className={cn(base, 'border-brand/20 bg-brand-soft/70')}>
          {icone(Save, 'text-brand-strong')}
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="text-sm font-semibold">
              Rascunho salvo em {formatarDataHora(nota.criada_em)}
            </p>
            <p className="text-muted-foreground">
              Ainda não foi enviado ao governo. Continue para gerar a prévia e emitir.
            </p>
          </div>
        </div>
      )
    default:
      return null
  }
}

function AcoesTopo({ nota }: { nota: Nota }) {
  const navigate = useNavigate()
  const baixar = useBaixarArquivo()
  const menu = (
    <AcoesNota nota={nota} incluirVer={false} className="size-10 border border-border bg-card" />
  )
  if (nota.status === 'RASCUNHO')
    return (
      <>
        <button
          type="button"
          onClick={() => navigate(`/notas/nova?rascunho=${nota.id}`)}
          className={classeBotao.primario}
        >
          <Pencil /> Continuar emissão
        </button>
        {menu}
      </>
    )
  if (nota.status === 'REJEITADA')
    return (
      <>
        <button
          type="button"
          onClick={() => navigate(`/notas/nova?de=${nota.id}`)}
          className={classeBotao.primario}
        >
          <RotateCcw /> Corrigir e emitir de novo
        </button>
        {menu}
      </>
    )
  return (
    <>
      {nota.chave_acesso && (
        <>
          <button
            type="button"
            disabled={baixar.isPending}
            onClick={() => baixar.mutate({ nota, tipo: 'pdf' })}
            className={classeBotao.secundario}
          >
            <FileDown /> PDF
          </button>
          <button
            type="button"
            disabled={baixar.isPending}
            onClick={() => baixar.mutate({ nota, tipo: 'xml' })}
            className={classeBotao.secundario}
          >
            <FileCode2 /> XML
          </button>
        </>
      )}
      {menu}
    </>
  )
}

export function NotaDetalhePage() {
  const { id } = useParams()
  const { data: nota, isPending, isError, error, refetch } = useNota(id)

  if (isPending)
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-72 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    )

  if (isError || !nota) {
    const naoExiste = error instanceof ApiError && error.status === 404
    return (
      <div className="flex flex-col gap-5">
        <CabecalhoPagina voltar={{ para: '/notas', rotulo: 'Notas' }} titulo="Nota" />
        <ErroCarregar
          className="min-h-64"
          mensagem={
            naoExiste
              ? 'Esta nota não existe ou foi excluída.'
              : 'Não foi possível carregar a nota.'
          }
          onTentar={naoExiste ? undefined : () => refetch()}
        />
      </div>
    )
  }

  const t = nota.tomador
  const IconeCliente = t.tipo_documento === 'CNPJ' ? Building : User

  return (
    <div className="flex flex-col gap-5">
      <CabecalhoPagina
        voltar={{ para: '/notas', rotulo: 'Notas' }}
        titulo={nota.numero_dps ? `Nota nº ${nota.numero_dps}` : 'Rascunho de nota'}
        selo={<StatusNotaChip status={nota.status} className="h-6 px-2.5 text-xs" />}
        subtitulo={
          <>
            {t.nome} · {nota.servico.apelido} ·{' '}
            <span className="tabular font-medium text-foreground">{formatarMoeda(nota.valor)}</span>
          </>
        }
        acoes={<AcoesTopo nota={nota} />}
      />

      <FaixaSituacao nota={nota} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel>
            <PanelHeader icon={Package} title="Serviço prestado" />
            <p className="rounded-md bg-surface px-4 py-3 text-sm leading-relaxed">
              {nota.descricao || '—'}
            </p>
            <dl className="mt-2 divide-y divide-border/60">
              <Dado rotulo="Serviço">{nota.servico.apelido}</Dado>
              <Dado rotulo="Código nacional" mono>
                {nota.servico.codigo_servico}
              </Dado>
              <Dado rotulo={<Sigla termo="NBS" />} mono>
                {nota.servico.nbs ?? '—'}
              </Dado>
              <Dado rotulo={<Sigla termo="Competência" />} mono>
                {formatarData(nota.competencia)}
              </Dado>
              <Dado rotulo="Local da prestação">
                {nota.municipio_prestacao.nome}/{nota.municipio_prestacao.uf}
              </Dado>
            </dl>
          </Panel>

          <Panel>
            <PanelHeader icon={Landmark} title="Valores e tributos" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-surface px-4 py-3">
                <p className="text-xs text-muted-foreground">Valor do serviço</p>
                <p className="tabular text-[22px] font-semibold">{formatarMoeda(nota.valor)}</p>
              </div>
              <div className="rounded-md bg-surface px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  <Sigla termo="ISS" />
                </p>
                <p className="text-sm font-semibold">Não retido pelo cliente</p>
                <p className="text-xs text-muted-foreground">
                  Pago por você no <Sigla termo="DAS" /> mensal
                </p>
              </div>
            </div>
            <div className="mt-3">
              {nota.tributos ? (
                <BlocoTributos tributos={nota.tributos} />
              ) : (
                <p className="rounded-md bg-surface px-4 py-3 text-[13px] text-muted-foreground">
                  Os tributos são calculados na prévia, antes de emitir.
                </p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader icon={History} title="Histórico" />
            <LinhaDoTempo eventos={nota.eventos} />
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Panel>
            <PanelHeader icon={Fingerprint} title="Identificação" />
            <dl className="divide-y divide-border/60">
              <Dado rotulo="Número" mono>
                {nota.numero_dps ?? 'Ainda não numerada'}
              </Dado>
              <Dado rotulo="Série" mono>
                {nota.serie}
              </Dado>
              <Dado rotulo="Emitida em" mono>
                {nota.emitida_em ? formatarDataHora(nota.emitida_em) : '—'}
              </Dado>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[13px] text-muted-foreground">Ambiente</dt>
                <dd>
                  <SeloAmbiente ambiente={nota.ambiente} />
                </dd>
              </div>
            </dl>
            {nota.chave_acesso && (
              <div className="mt-2 rounded-md bg-surface px-3.5 py-3">
                <p className="text-xs text-muted-foreground">
                  <Sigla termo="Chave de acesso" />
                </p>
                <div className="mt-0.5 flex items-start gap-2">
                  <code className="tabular min-w-0 flex-1 text-xs leading-relaxed font-medium break-all">
                    {nota.chave_acesso}
                  </code>
                  <button
                    type="button"
                    aria-label="Copiar chave de acesso"
                    onClick={() => copiarTexto(nota.chave_acesso!, 'Chave de acesso')}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader icon={FileText} title="Cliente" />
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-foreground/70">
                <IconeCliente className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.nome}</p>
                <p className="tabular text-xs text-muted-foreground">
                  {t.tipo_documento} {formatarDocumento(t.documento)}
                </p>
              </div>
            </div>
            <dl className="mt-2 divide-y divide-border/60">
              <Dado rotulo="E-mail">{t.email ?? '—'}</Dado>
              <Dado rotulo="Endereço">
                {t.endereco.logradouro}, {t.endereco.numero}
                {t.endereco.complemento && ` · ${t.endereco.complemento}`}
                <br />
                {t.endereco.bairro} · {t.endereco.municipio.nome}/{t.endereco.municipio.uf}
                <br />
                CEP {formatarCEP(t.endereco.cep)}
              </Dado>
            </dl>
          </Panel>

          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Precisa de ajuda com esta nota?{' '}
            <Link to="/notas" className="font-medium text-brand-strong hover:underline">
              Voltar para a lista
            </Link>{' '}
            ou fale com o seu contador.
          </p>
        </aside>
      </div>
    </div>
  )
}
