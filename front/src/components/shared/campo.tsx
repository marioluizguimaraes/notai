import { useId, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Classe base dos inputs internos (mesma linguagem do login, um pouco mais baixa). */
export const classeInput =
  'h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/12 aria-invalid:border-danger aria-invalid:ring-danger/12 disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Rótulo + controle + ajuda + erro. O controle recebe `id` e `aria-*` via
 * render-prop para manter a acessibilidade ligada ao rótulo e à mensagem.
 */
export function Campo({
  rotulo,
  ajuda,
  erro,
  opcional,
  extra,
  className,
  children,
}: {
  rotulo: ReactNode
  ajuda?: ReactNode
  erro?: string
  opcional?: boolean
  /** Elemento à direita do rótulo (ex.: link, contador). */
  extra?: ReactNode
  className?: string
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby'?: string
  }) => ReactNode
}) {
  const id = useId()
  const idAjuda = `${id}-ajuda`
  const idErro = `${id}-erro`
  const descritos =
    [erro ? idErro : null, ajuda ? idAjuda : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold">
          {rotulo}
          {opcional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
        </label>
        {extra}
      </div>
      {children({ id, 'aria-invalid': !!erro, 'aria-describedby': descritos })}
      {erro ? (
        <p id={idErro} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="size-3.5 shrink-0" /> {erro}
        </p>
      ) : ajuda ? (
        <p id={idAjuda} className="mt-1.5 text-xs text-muted-foreground">
          {ajuda}
        </p>
      ) : null}
    </div>
  )
}
