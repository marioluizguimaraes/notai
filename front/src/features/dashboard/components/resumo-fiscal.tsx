import { ArrowUpRight, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { IconCircleButton, Panel, PanelHeader } from '@/components/shared/panel'
import { Chip, VariacaoChip } from '@/components/shared/status-chip'
import { Sigla } from '@/components/shared/sigla'
import { formatarData, formatarMoeda } from '@/lib/format'
import type { ResumoDashboard } from '../schemas/dashboard'
import type { ReactNode } from 'react'

function Linha({ valor, rotulo, lado }: { valor: string; rotulo: ReactNode; lado: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-surface px-3.5 py-3">
      <div className="min-w-0">
        <p className="tabular text-[17px] font-semibold">{valor}</p>
        <p className="truncate text-xs text-muted-foreground">{rotulo}</p>
      </div>
      <div className="shrink-0 text-right">{lado}</div>
    </div>
  )
}

const STATUS_DAS = {
  A_PAGAR: { tom: 'atencao', texto: 'A pagar' },
  PAGO: { tom: 'sucesso', texto: 'Pago' },
  VENCIDO: { tom: 'erro', texto: 'Vencido' },
} as const

export function ResumoFiscal({ resumo }: { resumo: ResumoDashboard['resumo_fiscal'] }) {
  const { das_mes, faturado_ano, limite_restante } = resumo
  return (
    <Panel>
      <PanelHeader
        icon={Receipt}
        title="Resumo fiscal"
        actions={
          <IconCircleButton
            label="Ver tributos"
            onClick={() => toast.info('Tributos em construção.')}
          >
            <ArrowUpRight />
          </IconCircleButton>
        }
      />
      <div className="flex flex-1 flex-col gap-2.5">
        {das_mes && (
          <Linha
            valor={formatarMoeda(das_mes.valor)}
            rotulo={
              <>
                <Sigla termo="DAS" /> do mês · vence {formatarData(das_mes.vencimento)}
              </>
            }
            lado={
              <Chip tom={STATUS_DAS[das_mes.status].tom}>{STATUS_DAS[das_mes.status].texto}</Chip>
            }
          />
        )}
        <Linha
          valor={formatarMoeda(faturado_ano.valor)}
          rotulo="Faturado no ano"
          lado={
            <>
              <VariacaoChip valor={faturado_ano.variacao_pct} />
              <p className="mt-0.5 text-[10px] text-muted-foreground">vs. ano passado</p>
            </>
          }
        />
        {limite_restante && (
          <Linha
            valor={formatarMoeda(limite_restante.valor)}
            rotulo={
              <>
                Ainda cabe no limite do <Sigla termo="MEI" />
              </>
            }
            lado={
              <>
                <VariacaoChip valor={limite_restante.variacao_pct} />
                <p className="mt-0.5 text-[10px] text-muted-foreground">vs. mês passado</p>
              </>
            }
          />
        )}
      </div>
    </Panel>
  )
}
