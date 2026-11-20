import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { GLOSSARIO, type Termo } from '@/lib/glossario'

/** Sigla fiscal com tooltip explicativo (regra de UX obrigatória). */
export function Sigla({
  termo,
  children,
  className,
}: {
  termo: Termo
  children?: ReactNode
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <abbr
          tabIndex={0}
          className={cn(
            'cursor-help no-underline decoration-dotted underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none',
            className,
          )}
        >
          {children ?? termo}
        </abbr>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">
        {GLOSSARIO[termo]}
      </TooltipContent>
    </Tooltip>
  )
}
