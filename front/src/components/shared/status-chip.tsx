import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarPercentual } from '@/lib/format'
import { STATUS_NOTA_ROTULO, type StatusNota } from '@/types/fiscal'

export type Tom = 'sucesso' | 'lima' | 'atencao' | 'erro' | 'neutro' | 'marca'

const TOM_CLASSE: Record<Tom, string> = {
  sucesso: 'bg-success-soft text-success',
  lima: 'bg-lime text-lime-foreground',
  atencao: 'bg-warning-soft text-warning',
  erro: 'bg-danger-soft text-danger',
  neutro: 'bg-muted text-muted-foreground',
  marca: 'bg-brand-soft text-brand',
}

export function Chip({
  tom = 'neutro',
  children,
  className,
}: {
  tom?: Tom
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'tabular inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap [&_svg]:size-3',
        TOM_CLASSE[tom],
        className,
      )}
    >
      {children}
    </span>
  )
}

const TOM_STATUS_NOTA: Record<StatusNota, Tom> = {
  RASCUNHO: 'neutro',
  PREVIA: 'marca',
  ENVIANDO: 'atencao',
  AUTORIZADA: 'sucesso',
  REJEITADA: 'erro',
  CANCELADA: 'neutro',
}

export function StatusNotaChip({ status, className }: { status: StatusNota; className?: string }) {
  return (
    <Chip tom={TOM_STATUS_NOTA[status]} className={className}>
      {STATUS_NOTA_ROTULO[status]}
    </Chip>
  )
}

/** Variação percentual com seta: alta em verde, queda em laranja. `inverso` troca as cores. */
export function VariacaoChip({
  valor,
  inverso = false,
  className,
}: {
  valor: number
  inverso?: boolean
  className?: string
}) {
  const alta = valor >= 0
  const bom = inverso ? !alta : alta
  const Icone = alta ? ArrowUpRight : ArrowDownRight
  return (
    <Chip tom={bom ? 'sucesso' : 'atencao'} className={className}>
      <Icone strokeWidth={2.5} />
      {formatarPercentual(Math.abs(valor))}
    </Chip>
  )
}
