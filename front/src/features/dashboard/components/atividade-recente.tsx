import { Ban, CheckCircle2, ChevronRight, Send, XCircle, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ErroCarregar, LinhasSkeleton } from '@/components/shared/estado'
import { Panel, PanelHeader } from '@/components/shared/panel'
import { StatusNotaChip } from '@/components/shared/status-chip'
import { formatarHora, formatarMoeda, grupoRelativo, formatarDiaSemana } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Activity } from 'lucide-react'
import { useAtividade } from '../hooks/use-dashboard'
import type { Evento } from '../schemas/dashboard'

const ICONE: Partial<Record<Evento['tipo'], { icone: LucideIcon; classe: string }>> = {
  NOTA_ENVIADA: { icone: Send, classe: 'bg-warning-soft text-warning' },
  NOTA_AUTORIZADA: { icone: CheckCircle2, classe: 'bg-success-soft text-success' },
  NOTA_REJEITADA: { icone: XCircle, classe: 'bg-danger-soft text-danger' },
  NOTA_CANCELADA: { icone: Ban, classe: 'bg-muted text-muted-foreground' },
}

export function AtividadeRecente() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAtividade()

  const grupos = new Map<string, Evento[]>()
  for (const e of data?.itens ?? []) {
    const g = grupoRelativo(e.ocorrido_em)
    grupos.set(g, [...(grupos.get(g) ?? []), e])
  }

  return (
    <Panel className="flex-1">
      <PanelHeader icon={Activity} title="Atividade recente" />
      {isPending ? (
        <LinhasSkeleton linhas={4} />
      ) : isError ? (
        <ErroCarregar onTentar={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          {[...grupos].map(([grupo, eventos]) => (
            <div key={grupo}>
              <div className="mb-1 flex items-center justify-between rounded-sm bg-surface px-2.5 py-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium">{grupo}</span>
                <span>
                  {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>
              <ul>
                {eventos.map((e) => {
                  const vis = ICONE[e.tipo] ?? {
                    icone: Activity,
                    classe: 'bg-muted text-muted-foreground',
                  }
                  const Icone = vis.icone
                  return (
                    <li
                      key={e.id}
                      tabIndex={e.nota_id ? 0 : undefined}
                      role={e.nota_id ? 'link' : undefined}
                      onClick={e.nota_id ? () => navigate(`/notas/${e.nota_id}`) : undefined}
                      onKeyDown={(k) =>
                        e.nota_id && k.key === 'Enter' && navigate(`/notas/${e.nota_id}`)
                      }
                      className={cn(
                        'flex items-center gap-3 py-2',
                        e.nota_id &&
                          '-mx-1.5 cursor-pointer rounded-md px-1.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-full',
                          vis.classe,
                        )}
                      >
                        <Icone className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{e.titulo}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {e.descricao} ·{' '}
                          {grupo === 'Hoje' || grupo === 'Ontem'
                            ? formatarHora(e.ocorrido_em)
                            : formatarDiaSemana(e.ocorrido_em)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {e.valor !== null && (
                          <span className="tabular text-[13px] font-semibold">
                            {formatarMoeda(e.valor)}
                          </span>
                        )}
                        {e.status && <StatusNotaChip status={e.status} />}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate('/notas?periodo=todos')}
            className="mt-1 inline-flex h-9 items-center justify-center gap-1 rounded-full border border-border text-[13px] font-medium transition-colors hover:bg-muted"
          >
            Ver histórico de notas <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </Panel>
  )
}
