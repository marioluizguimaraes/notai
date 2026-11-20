import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, HelpCircle, LogOut, Menu, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { IconCircleButton } from '@/components/shared/panel'
import { Logo } from '@/components/shared/logo'
import { useLogout } from '@/features/auth/hooks/use-login'
import { useSessao } from '@/features/auth/session'
import { formatarCNPJ, iniciais } from '@/lib/format'
import { PainelNotificacoes } from '@/features/notificacoes/components/painel-notificacoes'
import { SidebarConteudo } from './app-sidebar'
import { BuscaComando } from './busca-comando'

function MenuUsuario() {
  const s = useSessao()
  const sair = useLogout()
  if (!s) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu da conta"
        className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <Avatar className="size-9 border-2 border-card shadow-card">
          <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand-strong">
            {iniciais(s.usuario.nome)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground">{s.usuario.nome}</p>
          <p className="tabular truncate text-xs text-muted-foreground">
            CNPJ {formatarCNPJ(s.usuario.cnpj)}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast.info('Configurações em construção.')}>
          <Settings /> Configurações
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={sair}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Barra superior: busca, competência, ajuda, notificações, conta e CTA. */
export function AppTopbar() {
  const [competencia] = useState(() =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
      .format(new Date())
      .replace(/^./, (c) => c.toUpperCase()),
  )
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <IconCircleButton label="Abrir menu" className="lg:hidden">
            <Menu />
          </IconCircleButton>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-5">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarConteudo />
        </SheetContent>
      </Sheet>
      <Logo compacto className="lg:hidden" />

      <div className="flex flex-1 justify-end md:justify-start">
        <BuscaComando />
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium xl:inline-flex">
          <CalendarDays className="size-4 text-muted-foreground" />
          {competencia}
        </span>
        <IconCircleButton label="Ajuda" className="hidden size-10 sm:grid">
          <HelpCircle />
        </IconCircleButton>
        <PainelNotificacoes />
        <MenuUsuario />
        <Link
          to="/notas/nova"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Nova nota</span>
        </Link>
      </div>
    </div>
  )
}
