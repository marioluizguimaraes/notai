import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRight,
  Ban,
  Bell,
  BellOff,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldAlert,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ErroCarregar, LinhasSkeleton } from '@/components/shared/estado'
import { grupoRelativo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useMarcarLida, useMarcarTodasLidas, useNotificacoes } from '../hooks/use-notificacoes'
import type { Notificacao } from '../schemas/notificacao'

/* ------------------------------------------------------------------ */
/* Aparência e ação de cada tipo                                        */
/* ------------------------------------------------------------------ */

interface Visual {
  icone: LucideIcon
  acao: string
  /** Rota da ação. Sem rota = recurso ainda em construção. */
  rota?: (n: Notificacao) => string | undefined
}

const idDaNota = (n: Notificacao) => n.link?.split('/').pop()

const VISUAL: Record<Notificacao['tipo'], Visual> = {
  NOTA_REJEITADA: {
    icone: XCircle,
    acao: 'Corrigir e emitir',
    rota: (n) => `/notas/nova?de=${idDaNota(n)}`,
  },
  NOTA_ENVIANDO: { icone: Clock, acao: 'Ver situação', rota: (n) => n.link ?? undefined },
  CERTIFICADO_VENCENDO: { icone: ShieldAlert, acao: 'Renovar certificado' },
  NOTA_AUTORIZADA: { icone: CheckCircle2, acao: 'Ver nota', rota: (n) => n.link ?? undefined },
  NOTA_CANCELADA: { icone: Ban, acao: 'Ver nota', rota: (n) => n.link ?? undefined },
  LIMITE_MEI: { icone: Gauge, acao: 'Ver no painel', rota: () => '/' },
  DAS_VENCIMENTO: { icone: CalendarClock, acao: 'Ver tributos' },
}

/** Mesmo tom dos ícones da "Atividade recente" do painel. */
const TOM: Record<Notificacao['severidade'], string> = {
  ERRO: 'bg-danger-soft text-danger',
  ATENCAO: 'bg-warning-soft text-warning',
  SUCESSO: 'bg-success-soft text-success',
  INFO: 'bg-muted text-muted-foreground',
}

const precisaAtencao = (n: Notificacao) => n.severidade === 'ERRO' || n.severidade === 'ATENCAO'

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const diaMes = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

function quando(iso: string) {
  const d = new Date(iso)
  const min = Math.floor((Date.now() - d.getTime()) / 60_000)
  const g = grupoRelativo(iso)
  if (g === 'Hoje')
    return min < 1 ? 'agora' : min < 60 ? `há ${min} min` : `hoje, ${hora.format(d)}`
  if (g === 'Ontem') return `ontem, ${hora.format(d)}`
  return diaMes.format(d).replace('.', '')
}

/* ------------------------------------------------------------------ */
/* Cartão                                                               */
/* ------------------------------------------------------------------ */

function Cartao({
  n,
  saindo,
  onAcao,
  onDispensar,
}: {
  n: Notificacao
  saindo: boolean
  onAcao: () => void
  onDispensar: () => void
}) {
  const v = VISUAL[n.tipo]
  const Icone = v.icone
  return (
    // a grade recolhe a altura até zero para a linha sumir suavemente
    <li
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
        saindo ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]',
      )}
    >
      <div className="overflow-hidden">
        <div className="group flex gap-3 border-t border-border/60 py-3.5">
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-full',
              TOM[n.severidade],
            )}
          >
            <Icone className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] leading-snug font-medium">{n.titulo}</p>
              <span className="tabular shrink-0 pt-px text-[11px] whitespace-nowrap text-muted-foreground">
                {quando(n.criada_em)}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.descricao}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onAcao}
                className="inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-brand-strong hover:underline"
              >
                {v.acao}
                <ArrowRight className="size-3.5" />
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onDispensar}
                    aria-label={`Marcar “${n.titulo}” como lida`}
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-success/30 hover:bg-success-soft hover:text-success"
                  >
                    <Check className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Marcar como lida</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

/** Card branco do sistema com o cabeçalho de grupo em faixa cinza (como "Hoje · 2 eventos"). */
function Bloco({ titulo, qtd, children }: { titulo: string; qtd: number; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border/70 bg-card px-4 pt-4 pb-1 shadow-card">
      <header className="mb-1 flex items-center justify-between rounded-sm bg-surface px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-medium">{titulo}</span>
        <span className="tabular">
          {qtd} {qtd === 1 ? 'aviso' : 'avisos'}
        </span>
      </header>
      <ul className="[&>li:first-child_.group]:border-t-0">{children}</ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Gaveta                                                               */
/* ------------------------------------------------------------------ */

/**
 * Sino do topo + gaveta lateral de notificações. Só aparecem as não lidas:
 * ao marcar como lida (ou agir), o cartão sai da lista.
 */
export function PainelNotificacoes() {
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [saindo, setSaindo] = useState<Set<string>>(new Set())
  const { data, isPending, isError, refetch } = useNotificacoes()
  const marcarLida = useMarcarLida()
  const marcarTodas = useMarcarTodasLidas()

  const itens = data?.itens ?? []
  const qtd = itens.length
  const atencao = itens.filter(precisaAtencao)
  const saber = itens.filter((n) => !precisaAtencao(n))

  /** Anima a saída e depois remove (otimista) e confirma com o servidor. */
  const remover = (id: string) => {
    setSaindo((s) => new Set(s).add(id))
    setTimeout(() => {
      marcarLida.mutate(id)
      setSaindo((s) => {
        const novo = new Set(s)
        novo.delete(id)
        return novo
      })
    }, 200)
  }

  const agir = (n: Notificacao) => {
    const rota = VISUAL[n.tipo].rota?.(n)
    remover(n.id)
    if (rota) {
      setAberto(false)
      navigate(rota)
    } else {
      toast.info(`${VISUAL[n.tipo].acao}: em construção.`, {
        description: 'Disponível nas próximas fases.',
      })
    }
  }

  const cartoes = (lista: Notificacao[]) =>
    lista.map((n) => (
      <Cartao
        key={n.id}
        n={n}
        saindo={saindo.has(n.id)}
        onAcao={() => agir(n)}
        onDispensar={() => remover(n.id)}
      />
    ))

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={qtd ? `Notificações: ${qtd} para ver` : 'Notificações'}
          className="relative grid size-10 place-items-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <Bell className="size-4" />
          {qtd > 0 && (
            <span className="tabular absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-card bg-danger px-1 text-[10px] leading-none font-bold text-white">
              {qtd > 9 ? '9+' : qtd}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 border-l border-border bg-canvas p-0 data-[side=right]:w-full sm:data-[side=right]:max-w-[420px]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <div>
            <SheetTitle className="text-base font-semibold">Notificações</SheetTitle>
            <SheetDescription className="text-xs">
              {qtd ? `${qtd} ${qtd === 1 ? 'aviso para ver' : 'avisos para ver'}` : 'Nada pendente'}
            </SheetDescription>
          </div>
          <div className="flex items-center gap-1">
            {qtd > 0 && (
              <button
                type="button"
                onClick={() => marcarTodas.mutate(undefined)}
                className="h-8 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Limpar tudo
              </button>
            )}
            <SheetClose
              aria-label="Fechar"
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </SheetClose>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {isPending ? (
            <LinhasSkeleton linhas={4} />
          ) : isError ? (
            <ErroCarregar className="min-h-40" onTentar={() => refetch()} />
          ) : qtd === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 pb-16 text-center">
              <span className="relative grid size-16 place-items-center rounded-full bg-card shadow-card">
                <BellOff className="size-6 text-muted-foreground" />
                <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border-2 border-canvas bg-success text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </span>
              <div>
                <p className="text-sm font-semibold">Tudo em dia</p>
                <p className="mt-1 max-w-60 text-xs leading-relaxed text-muted-foreground">
                  Quando algo precisar de você (uma nota recusada, o certificado vencendo), aparece
                  aqui.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {atencao.length > 0 && (
                <Bloco titulo="Precisa da sua atenção" qtd={atencao.length}>
                  {cartoes(atencao)}
                </Bloco>
              )}
              {saber.length > 0 && (
                <Bloco titulo="Para você saber" qtd={saber.length}>
                  {cartoes(saber)}
                </Bloco>
              )}
            </div>
          )}
        </div>

        {qtd > 0 && (
          <p className="border-t border-border bg-card px-5 py-3 text-center text-[11px] text-muted-foreground">
            Marque com ✓ o que já viu. Avisos lidos saem da lista.
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
