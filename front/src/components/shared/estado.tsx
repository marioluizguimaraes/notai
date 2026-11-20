import { AlertCircle, RotateCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ErroCarregar({
  mensagem = 'Não foi possível carregar estes dados.',
  onTentar,
  className,
}: {
  mensagem?: string
  onTentar?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-2 rounded-md bg-surface p-4 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      <AlertCircle className="size-5 text-danger" />
      <p>{mensagem}</p>
      {onTentar && (
        <button
          type="button"
          onClick={onTentar}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
        >
          <RotateCw className="size-3.5" /> Tentar de novo
        </button>
      )}
    </div>
  )
}

export function LinhasSkeleton({ linhas = 3, className }: { linhas?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
