import {
  Ban,
  CheckCircle2,
  FileSearch,
  RefreshCw,
  Save,
  Send,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { formatarDataHora } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EventoNota } from '../schemas/nota'

const VISUAL: Record<EventoNota['tipo'], { icone: LucideIcon; classe: string }> = {
  RASCUNHO_SALVO: { icone: Save, classe: 'bg-muted text-muted-foreground' },
  PREVIA_GERADA: { icone: FileSearch, classe: 'bg-brand-soft text-brand-strong' },
  NOTA_ENVIADA: { icone: Send, classe: 'bg-warning-soft text-warning' },
  NOTA_AUTORIZADA: { icone: CheckCircle2, classe: 'bg-success-soft text-success' },
  NOTA_REJEITADA: { icone: XCircle, classe: 'bg-danger-soft text-danger' },
  NOTA_CANCELADA: { icone: Ban, classe: 'bg-muted text-muted-foreground' },
  SITUACAO_CONSULTADA: { icone: RefreshCw, classe: 'bg-muted text-muted-foreground' },
}

/** Histórico da nota, do mais recente para o mais antigo. */
export function LinhaDoTempo({ eventos }: { eventos: EventoNota[] }) {
  return (
    <ol className="relative flex flex-col">
      {eventos.map((e, i) => {
        const v = VISUAL[e.tipo]
        const Icone = v.icone
        return (
          <li
            key={`${e.tipo}-${e.ocorrido_em}-${i}`}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {i < eventos.length - 1 && (
              <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                'relative grid size-8 shrink-0 place-items-center rounded-full',
                v.classe,
              )}
            >
              <Icone className="size-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[13px] font-medium">{e.descricao}</p>
              <p className="tabular text-xs text-muted-foreground">
                {formatarDataHora(e.ocorrido_em)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
