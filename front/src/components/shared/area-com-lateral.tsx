import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Espaço entre o fim da área e o fim da janela (padding do AppLayout no desktop). */
const RESPIRO_INFERIOR = 32
const ALTURA_MINIMA = 340

/**
 * Conteúdo principal + coluna lateral fixa (ex.: resumo da nota).
 * No desktop, a área ocupa a altura restante da janela: só a coluna principal
 * rola e a lateral não se mexe. Em telas pequenas (ou muito baixas) volta ao
 * fluxo normal da página.
 */
export function AreaComLateral({
  children,
  lateral,
  larguraLateral = 340,
  rolagemRef,
}: {
  children: ReactNode
  lateral: ReactNode
  larguraLateral?: number
  /** Recebe o elemento que rola (para voltar ao topo ao trocar de etapa). */
  rolagemRef?: (el: HTMLDivElement | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [altura, setAltura] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const calcular = () => {
      if (!window.matchMedia('(min-width: 1024px)').matches) return setAltura(null)
      const topo = el.getBoundingClientRect().top + window.scrollY
      const h = Math.floor(window.innerHeight - topo - RESPIRO_INFERIOR)
      setAltura(h >= ALTURA_MINIMA ? h : null)
    }
    calcular()
    // recalcula se algo acima mudar de tamanho (ex.: um aviso que aparece)
    const obs = new ResizeObserver(calcular)
    if (el.parentElement) obs.observe(el.parentElement)
    window.addEventListener('resize', calcular)
    return () => {
      obs.disconnect()
      window.removeEventListener('resize', calcular)
    }
  }, [])

  const fixo = altura !== null
  return (
    <div
      ref={ref}
      style={{
        height: fixo ? altura : undefined,
        gridTemplateColumns: fixo ? `minmax(0,1fr) ${larguraLateral}px` : undefined,
      }}
      className={cn('grid grid-cols-1 gap-4', !fixo && 'lg:grid-cols-[minmax(0,1fr)_340px]')}
    >
      <div
        ref={rolagemRef}
        className={cn(
          'min-w-0',
          fixo &&
            '-mr-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] overflow-y-auto overscroll-contain pr-2 pb-1',
        )}
      >
        {children}
      </div>
      <aside
        className={cn(
          'min-w-0',
          fixo
            ? '[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] overflow-y-auto'
            : 'lg:sticky lg:top-4 lg:self-start',
        )}
      >
        {lateral}
      </aside>
    </div>
  )
}
