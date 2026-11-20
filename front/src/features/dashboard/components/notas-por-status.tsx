import { PieChart as PieIcon } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { CountPill, Panel, PanelHeader } from '@/components/shared/panel'
import { formatarMoedaCompacta, formatarMoedaInteira } from '@/lib/format'
import { STATUS_NOTA_ROTULO, type StatusNota } from '@/types/fiscal'
import type { ResumoDashboard } from '../schemas/dashboard'

const COR: Partial<Record<StatusNota, string>> = {
  AUTORIZADA: 'var(--brand)',
  ENVIANDO: 'var(--warning)',
  REJEITADA: 'var(--danger)',
  CANCELADA: 'var(--muted-foreground)',
  RASCUNHO: 'var(--border)',
  PREVIA: 'var(--chart-2)',
}

export function NotasPorStatus({ dados }: { dados: ResumoDashboard['notas_por_status'] }) {
  const quantidade = dados.itens.reduce((s, i) => s + i.quantidade, 0)
  const config = Object.fromEntries(
    dados.itens.map((i) => [
      i.status,
      { label: STATUS_NOTA_ROTULO[i.status], color: COR[i.status] },
    ]),
  ) satisfies ChartConfig

  return (
    <Panel>
      <PanelHeader
        icon={PieIcon}
        title="Notas por status"
        actions={<CountPill>{quantidade} notas</CountPill>}
      />
      <div className="relative mx-auto my-1 size-40">
        <ChartContainer config={config} className="size-40">
          <PieChart>
            <Pie
              data={dados.itens}
              dataKey="valor"
              nameKey="status"
              innerRadius={54}
              outerRadius={78}
              paddingAngle={2}
              cornerRadius={4}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {dados.itens.map((i) => (
                <Cell key={i.status} fill={COR[i.status]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="tabular text-lg font-semibold">
            {formatarMoedaCompacta(dados.valor_total)}
          </span>
          <span className="text-[11px] text-muted-foreground">no mês</span>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {dados.itens.map((i) => (
          <li key={i.status} className="rounded-md bg-surface px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: COR[i.status] }} />
              {STATUS_NOTA_ROTULO[i.status]}
            </p>
            <p className="tabular mt-0.5 text-sm font-semibold">
              {formatarMoedaInteira(i.valor)}
              <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                · {i.quantidade}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
