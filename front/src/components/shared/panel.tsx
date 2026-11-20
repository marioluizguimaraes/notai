import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Card padrão do design: branco, cantos 16px, borda sutil. */
export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-lg border border-border/70 bg-card p-4 text-card-foreground shadow-card sm:p-5',
        className,
      )}
      {...props}
    />
  )
}

/** Cabeçalho do card: ícone em quadradinho cinza + título + ações à direita. */
export function PanelHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-surface text-foreground/80">
            <Icon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm leading-7 font-semibold">{title}</h2>
          {description && <p className="-mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )
}

/** Botão redondo só com ícone, com borda (ex.: "+", "↗"). */
export function IconCircleButton({
  className,
  label,
  children,
  ...props
}: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'grid size-8 place-items-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** Contador em pill cinza (ex.: "14 itens"). */
export function CountPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'tabular inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}
