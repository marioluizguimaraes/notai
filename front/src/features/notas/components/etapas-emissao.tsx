import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const ETAPAS = [
  { titulo: 'Dados da nota', descricao: 'Cliente, serviço e valor' },
  { titulo: 'Conferir e confirmar', descricao: 'O que vai para o governo' },
  { titulo: 'Nota emitida', descricao: 'Baixe o PDF e o XML' },
]

/** Progresso da emissão: três segmentos com barra, título e descrição. */
export function EtapasEmissao({ atual }: { atual: 0 | 1 | 2 }) {
  return (
    <ol className="grid grid-cols-3 gap-3" aria-label="Etapas da emissão">
      {ETAPAS.map((e, i) => {
        // a última etapa, quando alcançada, já é uma conclusão
        const feita = i < atual || (i === atual && i === ETAPAS.length - 1)
        const ativa = i === atual
        return (
          <li key={e.titulo} aria-current={ativa ? 'step' : undefined} className="min-w-0">
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  'h-full rounded-full bg-brand transition-[width] duration-500',
                  feita || (ativa && i === ETAPAS.length - 1) ? 'w-full' : ativa ? 'w-1/2' : 'w-0',
                )}
              />
            </div>
            <div className="mt-2.5 flex items-start gap-2 baixa:mt-2">
              <span
                className={cn(
                  'mt-px grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                  feita && 'bg-brand text-brand-foreground',
                  ativa && 'bg-ink text-ink-foreground',
                  !feita && !ativa && 'border border-border bg-card text-muted-foreground',
                )}
              >
                {feita ? <Check className="size-3" strokeWidth={3.5} /> : i + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'truncate text-[13px] font-semibold',
                    !ativa && !feita && 'text-muted-foreground',
                  )}
                >
                  {e.titulo}
                </p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block baixa:hidden">
                  {e.descricao}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Selo do ambiente (regra da spec: deixar claro se é teste ou produção). */
export function SeloAmbiente({ ambiente }: { ambiente: 'TESTES' | 'PRODUCAO' }) {
  return ambiente === 'TESTES' ? (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-warning-soft px-3 text-xs font-bold tracking-wide text-warning uppercase ring-1 ring-warning/25">
      <span className="size-1.5 rounded-full bg-warning" /> Ambiente de testes
    </span>
  ) : (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-danger-soft px-3 text-xs font-bold tracking-wide text-danger uppercase ring-1 ring-danger/25">
      <span className="size-1.5 rounded-full bg-danger" /> Produção · vale como nota real
    </span>
  )
}
