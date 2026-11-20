import { Clock } from 'lucide-react'
import { ErroCarregar } from '@/components/shared/estado'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertaAcao } from '@/features/dashboard/components/alerta-acao'
import { AtividadeRecente } from '@/features/dashboard/components/atividade-recente'
import { GraficoFaturamento } from '@/features/dashboard/components/grafico-faturamento'
import { KpiCards, KpiCardsSkeleton } from '@/features/dashboard/components/kpi-cards'
import { NotasPorStatus } from '@/features/dashboard/components/notas-por-status'
import { ResumoFiscal } from '@/features/dashboard/components/resumo-fiscal'
import { useResumoDashboard } from '@/features/dashboard/hooks/use-dashboard'
import { CardEmpresa } from '@/features/empresas/components/card-empresa'
import { NotasRecentes } from '@/features/notas/components/notas-recentes'
import { useSessao } from '@/features/auth/session'
import { formatarHora, formatarMesCompetencia, primeiroNome, saudacao } from '@/lib/format'

export function DashboardPage() {
  const s = useSessao()
  const { data: resumo, isPending, isError, refetch } = useResumoDashboard()

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {saudacao()}, {s ? primeiroNome(s.usuario.nome) : ''}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {resumo ? (
              <>
                Competência de {formatarMesCompetencia(resumo.competencia)} ·{' '}
                {resumo.pendencias_total > 0
                  ? `${resumo.pendencias_total} itens precisam da sua atenção.`
                  : 'Tudo em dia.'}
              </>
            ) : (
              'Carregando o resumo do mês…'
            )}
          </p>
        </div>
        {resumo && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> Atualizado às {formatarHora(resumo.atualizado_em)}
          </span>
        )}
      </header>

      {resumo?.proxima_acao && <AlertaAcao acao={resumo.proxima_acao} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Coluna principal */}
        <div className="flex min-w-0 flex-col gap-4">
          {isPending ? (
            <>
              <KpiCardsSkeleton />
              <Skeleton className="h-80 rounded-lg" />
            </>
          ) : isError ? (
            <ErroCarregar className="min-h-60" onTentar={() => refetch()} />
          ) : (
            <>
              <KpiCards kpis={resumo.kpis} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <GraficoFaturamento dados={resumo.faturamento_diario} />
                <ResumoFiscal resumo={resumo.resumo_fiscal} />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resumo && <NotasPorStatus dados={resumo.notas_por_status} />}
            <NotasRecentes />
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="flex min-w-0 flex-col gap-4">
          <CardEmpresa />
          <AtividadeRecente />
        </div>
      </div>
    </div>
  )
}
