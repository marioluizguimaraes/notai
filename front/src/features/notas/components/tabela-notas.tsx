import { useNavigate } from 'react-router'
import { Building, FileText, SearchX, User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { dataLocal, formatarDocumento, formatarHora, formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'
import { STATUS_NOTA_ROTULO, type StatusNota } from '@/types/fiscal'
import type { NotaResumo } from '../schemas/nota'
import { AcoesNota } from './acoes-nota'

const COR_STATUS: Record<StatusNota, { ponto: string; texto: string }> = {
  AUTORIZADA: { ponto: 'bg-success', texto: 'text-success' },
  ENVIANDO: { ponto: 'bg-warning animate-pulse', texto: 'text-warning' },
  REJEITADA: { ponto: 'bg-danger', texto: 'text-danger' },
  CANCELADA: { ponto: 'bg-muted-foreground/50', texto: 'text-muted-foreground' },
  RASCUNHO: {
    ponto: 'border border-muted-foreground/60 bg-transparent',
    texto: 'text-muted-foreground',
  },
  PREVIA: { ponto: 'bg-brand', texto: 'text-brand-strong' },
}

/** Status discreto: ponto colorido + texto. Rejeitada mostra o motivo no tooltip. */
export function StatusPonto({ nota }: { nota: Pick<NotaResumo, 'status' | 'erro'> }) {
  const c = COR_STATUS[nota.status]
  const conteudo = (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[13px] font-medium whitespace-nowrap',
        c.texto,
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', c.ponto)} />
      {STATUS_NOTA_ROTULO[nota.status]}
      {nota.erro && (
        <span className="tabular text-xs font-normal text-danger/80">{nota.erro.codigo}</span>
      )}
    </span>
  )
  if (!nota.erro) return conteudo
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{conteudo}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs">{nota.erro.mensagem}</TooltipContent>
    </Tooltip>
  )
}

function Avatar({ nota }: { nota: NotaResumo }) {
  const Icone = nota.tomador.tipo_documento === 'CNPJ' ? Building : User
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border/80 bg-card text-foreground/60">
      <Icone className="size-4" />
    </span>
  )
}

const dataDa = (n: NotaResumo) => n.emitida_em ?? n.criada_em
const diaDa = (n: NotaResumo) => dataDa(n).slice(0, 10)

const fmtDia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

function rotuloDia(dia: string) {
  const hoje = new Date()
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const ontem = new Date(hoje)
  ontem.setDate(hoje.getDate() - 1)
  const extenso = fmtDia.format(dataLocal(dia))
  if (dia === iso(hoje)) return { titulo: 'Hoje', detalhe: extenso }
  if (dia === iso(ontem)) return { titulo: 'Ontem', detalhe: extenso }
  const [semana, ...resto] = extenso.split(', ')
  return { titulo: resto.join(', '), detalhe: semana }
}

function agrupar(notas: NotaResumo[]) {
  const grupos: { dia: string; notas: NotaResumo[] }[] = []
  for (const n of notas) {
    const dia = diaDa(n)
    const g = grupos.at(-1)
    if (g?.dia === dia) g.notas.push(n)
    else grupos.push({ dia, notas: [n] })
  }
  return grupos
}

const COLUNAS =
  'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_64px_150px_minmax(110px,auto)_36px] md:items-center md:gap-4'

/** Lista estilo extrato: notas agrupadas por dia, com total do dia. */
export function TabelaNotas({ notas }: { notas: NotaResumo[] }) {
  const navigate = useNavigate()
  const abrir = (n: NotaResumo) => navigate(`/notas/${n.id}`)

  return (
    <div>
      <div
        className={cn(
          'hidden border-b border-border px-5 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase',
          COLUNAS,
        )}
      >
        <span>Cliente</span>
        <span>Serviço</span>
        <span>Hora</span>
        <span>Situação</span>
        <span className="text-right">Valor</span>
        <span className="sr-only">Ações</span>
      </div>

      {agrupar(notas).map(({ dia, notas: doDia }) => {
        const r = rotuloDia(dia)
        const total = doDia.filter((n) => n.status !== 'CANCELADA').reduce((s, n) => s + n.valor, 0)
        return (
          <section key={dia} aria-label={r.titulo}>
            <header className="sticky top-0 z-[1] flex items-baseline justify-between gap-3 border-b border-border/70 bg-surface/95 px-5 py-2 backdrop-blur-sm">
              <p className="text-[13px] font-semibold first-letter:uppercase">
                {r.titulo}
                <span className="ml-2 font-normal text-muted-foreground first-letter:uppercase">
                  {r.detalhe}
                </span>
              </p>
              <p className="tabular text-xs text-muted-foreground">
                {doDia.length} {doDia.length === 1 ? 'nota' : 'notas'} ·{' '}
                <span className="font-semibold text-foreground">{formatarMoeda(total)}</span>
              </p>
            </header>
            <ul>
              {doDia.map((n) => (
                <li
                  key={n.id}
                  tabIndex={0}
                  onClick={() => abrir(n)}
                  onKeyDown={(e) => e.key === 'Enter' && abrir(n)}
                  className={cn(
                    'group relative flex cursor-pointer items-start gap-3 border-b border-border/60 px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none',
                    COLUNAS,
                    n.status === 'CANCELADA' && 'opacity-70',
                  )}
                >
                  {/* Cliente */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar nota={n} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{n.tomador.nome}</p>
                      <p className="tabular truncate text-xs text-muted-foreground">
                        <span className="md:hidden">
                          {n.numero_dps ? `Nº ${n.numero_dps}` : 'Rascunho'} · {n.servico.apelido}
                        </span>
                        <span className="hidden md:inline">
                          {n.tomador.tipo_documento} {formatarDocumento(n.tomador.documento)}
                        </span>
                      </p>
                      <div className="mt-1.5 md:hidden">
                        <StatusPonto nota={n} />
                      </div>
                    </div>
                  </div>

                  {/* Serviço */}
                  <div className="hidden min-w-0 md:block">
                    <p className="truncate text-[13px]">{n.servico.apelido}</p>
                    <p className="tabular text-xs text-muted-foreground">
                      {n.numero_dps ? `Nota nº ${n.numero_dps}` : 'Sem número'}
                    </p>
                  </div>

                  <span className="tabular hidden text-[13px] text-muted-foreground md:block">
                    {formatarHora(dataDa(n))}
                  </span>

                  <div className="hidden md:block">
                    <StatusPonto nota={n} />
                  </div>

                  <p
                    className={cn(
                      'tabular shrink-0 pt-0.5 text-right text-sm font-semibold md:pt-0',
                      n.status === 'CANCELADA' && 'text-muted-foreground line-through decoration-1',
                    )}
                  >
                    {formatarMoeda(n.valor)}
                  </p>

                  <div className="-mr-2 shrink-0 md:mr-0">
                    <AcoesNota nota={n} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export function NotasVazio({ filtrado, onLimpar }: { filtrado: boolean; onLimpar: () => void }) {
  const Icone = filtrado ? SearchX : FileText
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-lg border border-border bg-surface text-muted-foreground">
        <Icone className="size-5" />
      </span>
      <p className="mt-2 text-sm font-semibold">
        {filtrado ? 'Nenhuma nota encontrada' : 'Nenhuma nota neste período'}
      </p>
      <p className="max-w-xs text-[13px] text-muted-foreground">
        {filtrado
          ? 'Confira o termo buscado ou troque o status e o período.'
          : 'As notas que você emitir aparecem aqui, agrupadas por dia.'}
      </p>
      {filtrado && (
        <button
          type="button"
          onClick={onLimpar}
          className="mt-3 h-9 rounded-md border border-border bg-card px-4 text-[13px] font-medium transition-colors hover:bg-muted"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
