import type { ReactNode } from 'react'
import { AlertTriangle, CircleDollarSign, FileCheck2, Gauge } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Chip, VariacaoChip } from '@/components/shared/status-chip'
import { Sigla } from '@/components/shared/sigla'
import { formatarMoeda, formatarMoedaInteira, formatarPercentual } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ResumoDashboard } from '../schemas/dashboard'

function KpiCard({
  rotulo,
  icone: Icone,
  valor,
  rodape,
  className,
}: {
  rotulo: ReactNode
  icone: LucideIcon
  valor: ReactNode
  rodape: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-card',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{rotulo}</span>
        <span className="grid size-7 place-items-center rounded-full border border-border text-foreground/70">
          <Icone className="size-3.5" />
        </span>
      </div>
      <div className="tabular text-[26px] leading-none font-semibold tracking-tight">{valor}</div>
      <div className="flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {rodape}
      </div>
    </div>
  )
}

/** Barra segmentada (como "82% verified" da referência). */
function BarraSegmentada({ valor, segmentos = 6 }: { valor: number; segmentos?: number }) {
  const cheios = Math.round(valor * segmentos)
  const alerta = valor >= 0.8
  return (
    <div className="flex flex-1 gap-1" aria-hidden>
      {Array.from({ length: segmentos }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            i < cheios ? (alerta ? 'bg-warning' : 'bg-brand') : 'bg-muted',
          )}
        />
      ))}
    </div>
  )
}

export function KpiCards({ kpis }: { kpis: ResumoDashboard['kpis'] }) {
  const { faturado_mes, notas_emitidas, limite_mei, pendencias } = kpis
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <KpiCard
        rotulo="Faturado no mês"
        icone={CircleDollarSign}
        valor={formatarMoeda(faturado_mes.valor)}
        rodape={
          <>
            <VariacaoChip valor={faturado_mes.variacao_pct} />
            vs. {faturado_mes.comparado_com}
          </>
        }
      />
      <KpiCard
        rotulo="Notas emitidas"
        icone={FileCheck2}
        valor={
          <>
            {notas_emitidas.quantidade}
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">no mês</span>
          </>
        }
        rodape={
          <>
            <Chip tom="sucesso">{notas_emitidas.autorizadas} autorizadas</Chip>
            <VariacaoChip valor={notas_emitidas.variacao_pct} />
          </>
        }
      />
      {limite_mei ? (
        <KpiCard
          rotulo={
            <>
              Limite do <Sigla termo="MEI" /> usado
            </>
          }
          icone={Gauge}
          valor={formatarPercentual(limite_mei.usado_pct)}
          rodape={
            <>
              <BarraSegmentada valor={limite_mei.usado_pct} />
              <Chip tom="lima">
                {formatarMoedaInteira(limite_mei.faturado_ano)} de{' '}
                {formatarMoedaInteira(limite_mei.limite_anual)}
              </Chip>
            </>
          }
        />
      ) : null}
      <KpiCard
        rotulo="Precisam de atenção"
        icone={AlertTriangle}
        valor={
          <>
            {pendencias.quantidade}
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">itens</span>
          </>
        }
        rodape={
          <>
            <Chip tom="atencao">{formatarMoedaInteira(pendencias.valor_em_aberto)}</Chip>
            em notas pendentes
          </>
        }
      />
    </div>
  )
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border/70 bg-card p-4">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
