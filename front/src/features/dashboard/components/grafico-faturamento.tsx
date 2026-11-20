import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Panel, PanelHeader } from '@/components/shared/panel'
import { dataLocal, formatarData, formatarMoeda, formatarMoedaCompacta } from '@/lib/format'
import type { ResumoDashboard } from '../schemas/dashboard'

const config = {
  valor: { label: 'Faturamento', color: 'var(--chart-1)' },
} satisfies ChartConfig

type Periodo = '7' | 'mes'

const rotuloDia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

export function GraficoFaturamento({ dados }: { dados: ResumoDashboard['faturamento_diario'] }) {
  const [periodo, setPeriodo] = useState<Periodo>('7')

  const serie = useMemo(() => {
    const base = periodo === '7' ? dados.slice(-7) : dados
    return base.map((d) => ({
      ...d,
      rotulo: rotuloDia.format(dataLocal(d.data)).replace('.', '').replace(' de ', ' '),
    }))
  }, [dados, periodo])

  const total = serie.reduce((s, d) => s + d.valor, 0)
  const ultimo = serie.at(-1)

  return (
    <Panel className="min-h-80">
      <PanelHeader
        icon={TrendingUp}
        title="Faturamento"
        description="Valor das notas autorizadas por dia"
        actions={
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger
              size="sm"
              className="h-8 rounded-full bg-card text-xs"
              aria-label="Período"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="mes">Mês atual</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <div className="mb-2 flex items-baseline gap-2">
        <span className="tabular text-xl font-semibold">{formatarMoeda(total)}</span>
        <span className="text-xs text-muted-foreground">no período</span>
        {ultimo && (
          <span className="tabular ml-auto rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-brand-foreground">
            {formatarMoedaCompacta(ultimo.valor)} hoje
          </span>
        )}
      </div>
      <ChartContainer config={config} className="aspect-auto h-52 w-full flex-1">
        <AreaChart data={serie} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-faturamento" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-valor)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-valor)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="rotulo"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => formatarMoedaCompacta(v)}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--color-valor)', strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof serie)[number] | undefined
              if (!active || !p) return null
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-pop">
                  <p className="text-muted-foreground">{formatarData(p.data)}</p>
                  <p className="tabular mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="h-3 w-1 rounded-full bg-brand" />
                    {formatarMoeda(p.valor)}
                  </p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="var(--color-valor)"
            strokeWidth={2.5}
            fill="url(#grad-faturamento)"
            activeDot={{ r: 5, strokeWidth: 3, stroke: 'var(--card)' }}
          />
        </AreaChart>
      </ChartContainer>
    </Panel>
  )
}
