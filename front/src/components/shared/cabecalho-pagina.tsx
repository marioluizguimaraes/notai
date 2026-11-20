import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Título + subtítulo da página, com "voltar" opcional e ações à direita. */
export function CabecalhoPagina({
  titulo,
  subtitulo,
  voltar,
  acoes,
  selo,
  compacto,
}: {
  titulo: ReactNode
  subtitulo?: ReactNode
  voltar?: { para: string; rotulo: string }
  acoes?: ReactNode
  selo?: ReactNode
  /** Em telas baixas esconde o subtítulo (páginas com área fixa, como a emissão). */
  compacto?: boolean
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {voltar && (
          <Link
            to={voltar.para}
            className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> {voltar.rotulo}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{titulo}</h1>
          {selo}
        </div>
        {subtitulo && (
          <p className={cn('mt-1 text-[13px] text-muted-foreground', compacto && 'baixa:hidden')}>
            {subtitulo}
          </p>
        )}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}
