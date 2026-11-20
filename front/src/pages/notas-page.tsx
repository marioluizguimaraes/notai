import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react'
import { CabecalhoPagina } from '@/components/shared/cabecalho-pagina'
import { ErroCarregar, LinhasSkeleton } from '@/components/shared/estado'
import { Sigla } from '@/components/shared/sigla'
import { Skeleton } from '@/components/ui/skeleton'
import { NotasVazio, TabelaNotas } from '@/features/notas/components/tabela-notas'
import { useContagemNotas, useNotas } from '@/features/notas/hooks/use-notas'
import {
  filtroStatusSchema,
  type ContagemNotas,
  type FiltroStatus,
} from '@/features/notas/schemas/nota'
import { FiltroPeriodo } from '@/features/notas/components/filtro-periodo'
import { lerPeriodoUrl, periodoParaUrl, rotuloPeriodo } from '@/features/notas/periodo'
import { classeBotao } from '@/lib/estilos'
import { formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'

const ABAS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'autorizadas', rotulo: 'Autorizadas' },
  { valor: 'enviando', rotulo: 'Enviando' },
  { valor: 'rejeitadas', rotulo: 'Rejeitadas' },
  { valor: 'canceladas', rotulo: 'Canceladas' },
  { valor: 'rascunhos', rotulo: 'Rascunhos' },
]

const POR_PAGINA = 10

function useFiltrosUrl() {
  const [params, setParams] = useSearchParams()
  const status = filtroStatusSchema.catch('todas').parse(params.get('status') ?? undefined)
  const periodo = lerPeriodoUrl(params.get('periodo'))
  const busca = params.get('busca') ?? ''
  const pagina = Math.max(Number(params.get('pagina')) || 1, 1)

  const atualizar = (mudancas: Record<string, string | number | undefined>) =>
    setParams(
      (atual) => {
        const p = new URLSearchParams(atual)
        for (const [k, v] of Object.entries(mudancas)) {
          const padrao = { status: 'todas', pagina: 1, busca: '' }[
            k as 'status' | 'pagina' | 'busca'
          ]
          if (v === undefined || v === '' || v === padrao) p.delete(k)
          else p.set(k, String(v))
        }
        if (!('pagina' in mudancas)) p.delete('pagina')
        return p
      },
      { replace: true },
    )

  return { status, periodo, busca, pagina, atualizar }
}

/* ------------------------------------------------------------------ */
/* Resumo do período                                                   */
/* ------------------------------------------------------------------ */

function Indicador({
  rotulo,
  valor,
  detalhe,
  ponto,
  ativo,
  alerta,
  onClick,
}: {
  rotulo: string
  valor: ReactNode
  detalhe: ReactNode
  ponto?: string
  ativo: boolean
  alerta?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        'group relative flex flex-col gap-1 bg-card px-5 py-4 text-left transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none',
        ativo && 'bg-surface',
      )}
    >
      <span
        className={cn(
          'absolute inset-x-5 top-0 h-0.5 rounded-b-full transition-colors',
          ativo ? 'bg-foreground' : 'bg-transparent',
        )}
      />
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {ponto && <span className={cn('size-1.5 rounded-full', ponto)} />}
        {rotulo}
      </span>
      <span className={cn('tabular text-xl font-semibold tracking-tight', alerta && 'text-danger')}>
        {valor}
      </span>
      <span className="text-xs text-muted-foreground">{detalhe}</span>
    </button>
  )
}

function ResumoPeriodo({
  contagem,
  status,
  onStatus,
}: {
  contagem?: ContagemNotas
  status: FiltroStatus
  onStatus: (s: FiltroStatus) => void
}) {
  if (!contagem) return <Skeleton className="h-[98px] rounded-lg" />
  const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 shadow-card lg:grid-cols-4">
      <Indicador
        rotulo="Emitido no período"
        valor={formatarMoeda(contagem.valores.todas)}
        detalhe={plural(contagem.todas, 'nota', 'notas')}
        ativo={status === 'todas'}
        onClick={() => onStatus('todas')}
      />
      <Indicador
        rotulo="Autorizadas"
        ponto="bg-success"
        valor={formatarMoeda(contagem.valores.autorizadas)}
        detalhe={`${plural(contagem.autorizadas, 'nota válida', 'notas válidas')}`}
        ativo={status === 'autorizadas'}
        onClick={() => onStatus('autorizadas')}
      />
      <Indicador
        rotulo="Aguardando o governo"
        ponto="bg-warning"
        valor={contagem.enviando}
        detalhe={contagem.enviando ? formatarMoeda(contagem.valores.enviando) : 'Nada pendente'}
        ativo={status === 'enviando'}
        onClick={() => onStatus('enviando')}
      />
      <Indicador
        rotulo="Recusadas"
        ponto="bg-danger"
        valor={contagem.rejeitadas}
        alerta={contagem.rejeitadas > 0}
        detalhe={contagem.rejeitadas ? 'Corrija e emita de novo' : 'Nenhuma recusa'}
        ativo={status === 'rejeitadas'}
        onClick={() => onStatus('rejeitadas')}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Filtros                                                              */
/* ------------------------------------------------------------------ */

function Abas({
  status,
  contagem,
  onChange,
}: {
  status: FiltroStatus
  contagem?: ContagemNotas
  onChange: (s: FiltroStatus) => void
}) {
  return (
    <div role="tablist" aria-label="Situação das notas" className="flex gap-5 overflow-x-auto px-5">
      {ABAS.map((a) => {
        const ativo = a.valor === status
        const qtd = contagem?.[a.valor]
        return (
          <button
            key={a.valor}
            role="tab"
            type="button"
            aria-selected={ativo}
            onClick={() => onChange(a.valor)}
            className={cn(
              'relative inline-flex h-12 shrink-0 items-center gap-1.5 text-[13px] font-medium transition-colors',
              ativo ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {a.rotulo}
            {qtd !== undefined && (
              <span
                className={cn(
                  'tabular text-xs',
                  ativo ? 'text-foreground/60' : 'text-muted-foreground/70',
                )}
              >
                {qtd}
              </span>
            )}
            <span
              className={cn(
                'absolute inset-x-0 -bottom-px h-0.5 rounded-t-full transition-colors',
                ativo ? 'bg-brand' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

function ChipFiltro({ children, onRemover }: { children: ReactNode; onRemover: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card pr-1 pl-2.5 text-xs">
      {children}
      <button
        type="button"
        onClick={onRemover}
        aria-label="Remover filtro"
        className="grid size-5 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

/* ------------------------------------------------------------------ */

export function NotasPage() {
  const { status, periodo, busca, pagina, atualizar } = useFiltrosUrl()
  const [textoBusca, setTextoBusca] = useState(busca)
  const campoBusca = useRef<HTMLInputElement>(null)

  // busca com pequeno atraso para não consultar a cada tecla
  useEffect(() => {
    const t = setTimeout(() => {
      if (textoBusca.trim() !== busca) atualizar({ busca: textoBusca.trim() })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoBusca])

  // atalho "/" para buscar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      if (
        e.key === '/' &&
        !/input|textarea|select/i.test(alvo.tagName) &&
        !alvo.isContentEditable
      ) {
        e.preventDefault()
        campoBusca.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { data: contagem } = useContagemNotas({ ...periodo, busca })
  const { data, isPending, isError, isFetching, refetch } = useNotas({
    status,
    ...periodo,
    busca,
    pagina,
    por_pagina: POR_PAGINA,
  })

  const limpar = () => {
    setTextoBusca('')
    atualizar({ status: 'todas', busca: '', periodo: undefined })
  }
  const periodoPadrao = periodoParaUrl(periodo) === undefined
  const temFiltro = !!busca || !periodoPadrao
  const totalPaginas = data ? Math.max(Math.ceil(data.total / POR_PAGINA), 1) : 1
  const inicio = data && data.total > 0 ? (pagina - 1) * POR_PAGINA + 1 : 0
  const fim = data ? Math.min(pagina * POR_PAGINA, data.total) : 0

  return (
    <div className="flex flex-col gap-5">
      <CabecalhoPagina
        titulo="Notas"
        subtitulo={
          <>
            <Sigla termo="NFS-e" /> emitidas pela sua empresa ·{' '}
            {rotuloPeriodo(periodo).toLowerCase()}
          </>
        }
        acoes={
          <Link to="/notas/nova" className={classeBotao.primario}>
            <Plus /> Emitir nota
          </Link>
        }
      />

      <ResumoPeriodo
        contagem={contagem}
        status={status}
        onStatus={(s) => atualizar({ status: s })}
      />

      <section className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-card">
        <div className="border-b border-border">
          <Abas status={status} contagem={contagem} onChange={(s) => atualizar({ status: s })} />
        </div>

        {/* Barra de busca e período */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar notas</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={campoBusca}
              type="search"
              value={textoBusca}
              onChange={(e) => setTextoBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setTextoBusca('')}
              placeholder="Cliente, CPF/CNPJ, número ou serviço"
              className="h-9 w-full rounded-md border border-transparent bg-surface pr-9 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-brand focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-brand/12 [&::-webkit-search-cancel-button]:hidden"
            />
            {textoBusca ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setTextoBusca('')}
                className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:bg-muted"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 text-[10px] text-muted-foreground sm:block">
                /
              </kbd>
            )}
          </label>

          <div className="flex items-center gap-3">
            {data && (
              <p className="tabular hidden text-xs whitespace-nowrap text-muted-foreground lg:block">
                {data.total} {data.total === 1 ? 'resultado' : 'resultados'}
                {data.total > 0 && (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-semibold text-foreground">
                      {formatarMoeda(data.valor_total)}
                    </span>
                  </>
                )}
              </p>
            )}
            <FiltroPeriodo
              valor={periodo}
              onChange={(p) => atualizar({ periodo: periodoParaUrl(p) })}
            />
          </div>
        </div>

        {/* Filtros ativos */}
        {temFiltro && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/50 px-5 py-2">
            <span className="text-xs text-muted-foreground">Filtrando por</span>
            {busca && <ChipFiltro onRemover={() => setTextoBusca('')}>Busca: “{busca}”</ChipFiltro>}
            {!periodoPadrao && (
              <ChipFiltro onRemover={() => atualizar({ periodo: undefined })}>
                <span className="first-letter:uppercase">{rotuloPeriodo(periodo)}</span>
              </ChipFiltro>
            )}
            <button
              type="button"
              onClick={limpar}
              className="text-xs font-medium text-brand-strong hover:underline"
            >
              Limpar tudo
            </button>
          </div>
        )}

        <div className={cn('transition-opacity', isFetching && !isPending && 'opacity-60')}>
          {isPending ? (
            <LinhasSkeleton linhas={6} className="p-5" />
          ) : isError ? (
            <ErroCarregar className="m-5 min-h-48" onTentar={() => refetch()} />
          ) : data.itens.length === 0 ? (
            <NotasVazio filtrado={status !== 'todas' || temFiltro} onLimpar={limpar} />
          ) : (
            <TabelaNotas notas={data.itens} />
          )}
        </div>

        {data && data.total > POR_PAGINA && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span className="tabular">
              Mostrando {inicio}–{fim} de {data.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => atualizar({ pagina: pagina - 1 })}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" /> Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => atualizar({ pagina: pagina + 1 })}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                Próxima <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
