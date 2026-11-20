import { useState, type ReactElement } from 'react'
import { Link, useMatch } from 'react-router'
import { ChevronRight, ChevronsLeft, ChevronsRight, FlaskConical, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/shared/logo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLogout } from '@/features/auth/hooks/use-login'
import { useEmpresaAtual } from '@/features/empresas/hooks/use-empresa'
import { cn } from '@/lib/utils'
import { NAV, type NavItem } from './nav-items'

const emBreve = (rotulo: string) =>
  toast.info(`${rotulo} ainda está em construção.`, {
    description: 'Disponível nas próximas fases.',
  })

const classeItem =
  'group relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium baixa:h-9 mbaixa:h-8 text-sidebar-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none'
const classeItemRecolhido = 'mx-auto size-10 justify-center px-0 baixa:size-9 mbaixa:size-8'
const classeItemAtivo = 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'

/**
 * Com o menu recolhido, mostra o rótulo num tooltip à direita.
 * Importante: o filho do TooltipTrigger (asChild) precisa receber `className`
 * em string. Classe em função (como a do NavLink) é corrompida pelo Slot do
 * Radix e o item perde o alinhamento.
 */
function ComTooltip({
  rotulo,
  ativo,
  children,
}: {
  rotulo: string
  ativo: boolean
  children: ReactElement
}) {
  if (!ativo) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{rotulo}</TooltipContent>
    </Tooltip>
  )
}

function ItemLink({ item, recolhida }: { item: NavItem; recolhida: boolean }) {
  const Icone = item.icone
  const casou = useMatch({
    path: item.incluiSubrotas ? `${item.rota}/*` : item.rota,
    end: !item.incluiSubrotas,
  })
  const ativo = !!casou && !!item.pronta
  const classe = cn(classeItem, ativo && classeItemAtivo, recolhida && classeItemRecolhido)

  const conteudo = (
    <>
      {ativo && !recolhida && (
        <span className="absolute top-1/2 -left-2 size-1.5 -translate-y-1/2 rounded-full bg-brand" />
      )}
      <Icone
        className={cn('size-[18px] shrink-0', ativo ? 'text-brand-strong' : 'text-foreground/60')}
      />
      {!recolhida && <span className="truncate">{item.rotulo}</span>}
    </>
  )

  return (
    <ComTooltip rotulo={item.rotulo} ativo={recolhida}>
      {item.pronta ? (
        <Link to={item.rota} aria-current={ativo ? 'page' : undefined} className={classe}>
          {conteudo}
        </Link>
      ) : (
        <button type="button" className={classe} onClick={() => emBreve(item.rotulo)}>
          {conteudo}
        </button>
      )}
    </ComTooltip>
  )
}

function CardAmbiente() {
  const { data: empresa } = useEmpresaAtual()
  if (!empresa || empresa.ambiente !== 'TESTES') return null
  return (
    <button
      type="button"
      onClick={() => emBreve('Configurações')}
      title="Suas notas ainda não têm valor fiscal. Emita uma nota de teste para liberar a produção."
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-lg bg-gradient-to-br from-brand to-brand-strong p-3 text-left text-brand-foreground transition-shadow hover:shadow-pop"
    >
      <span className="pointer-events-none absolute -top-6 -right-6 size-16 rounded-full bg-white/10" />
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15">
        <FlaskConical className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold">Ambiente de testes</span>
        <span className="block truncate text-[11px] text-white/80">Sem valor fiscal ainda</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

export function SidebarConteudo({
  recolhida = false,
  onAlternar,
}: {
  recolhida?: boolean
  onAlternar?: () => void
}) {
  const sair = useLogout()
  return (
    <div className="flex h-full flex-col gap-6 baixa:gap-4">
      <div
        className={cn(
          'flex items-center justify-between',
          recolhida && 'flex-col justify-start gap-3',
        )}
      >
        <Logo compacto={recolhida} />
        {onAlternar && (
          <button
            type="button"
            onClick={onAlternar}
            aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
            className="grid size-7 place-items-center rounded-sm bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            {recolhida ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        )}
      </div>

      <nav aria-label="Menu principal" className="-mx-1 flex flex-1 flex-col overflow-y-auto px-1">
        {NAV.map((grupo, i) => (
          <div
            key={grupo.titulo}
            className={cn(
              i > 0 && 'mt-4 border-t border-sidebar-border pt-4 baixa:mt-3 baixa:pt-3',
            )}
          >
            {!recolhida && (
              <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase baixa:hidden">
                {grupo.titulo}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {grupo.itens.map((item) => (
                <li key={item.rota}>
                  <ItemLink item={item} recolhida={recolhida} />
                </li>
              ))}
              {grupo.titulo === 'Geral' && (
                <li>
                  <ComTooltip rotulo="Sair" ativo={recolhida}>
                    <button
                      type="button"
                      onClick={sair}
                      className={cn(classeItem, recolhida && classeItemRecolhido)}
                    >
                      <LogOut className="size-[18px] shrink-0 text-foreground/60" />
                      {!recolhida && 'Sair'}
                    </button>
                  </ComTooltip>
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      {!recolhida && <CardAmbiente />}
    </div>
  )
}

export function AppSidebar() {
  const [recolhida, setRecolhida] = useState(() => {
    try {
      return localStorage.getItem('notai.sidebar') === 'recolhida'
    } catch {
      return false
    }
  })
  const alternar = () =>
    setRecolhida((v) => {
      try {
        localStorage.setItem('notai.sidebar', v ? 'aberta' : 'recolhida')
      } catch {
        /* ignorar */
      }
      return !v
    })

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh shrink-0 flex-col bg-sidebar py-5 transition-[width] duration-200 lg:flex baixa:py-4',
        recolhida ? 'w-[76px] px-3' : 'w-64 px-4',
      )}
    >
      <SidebarConteudo recolhida={recolhida} onAlternar={alternar} />
    </aside>
  )
}
