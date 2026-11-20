import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Command } from 'cmdk'
import {
  ArrowRight,
  Building,
  Calculator,
  Clock,
  CornerDownLeft,
  FilePlus2,
  FileText,
  FileX2,
  HelpCircle,
  LayoutGrid,
  Landmark,
  Loader2,
  Package,
  PencilLine,
  Search,
  Settings,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { notasApi } from '@/features/notas/api/notas'
import { StatusPonto } from '@/features/notas/components/tabela-notas'
import { useNotasRecentes } from '@/features/notas/hooks/use-notas'
import { useTomadores } from '@/features/tomadores/hooks/use-tomadores'
import { formatarDocumento, formatarMoeda } from '@/lib/format'
import { comModificadora, teclaModificadora } from '@/lib/plataforma'
import { cn } from '@/lib/utils'

interface Opcao {
  id: string
  rotulo: string
  detalhe?: string
  icone: LucideIcon
  palavras?: string
  rota?: string
  emBreve?: boolean
}

const ACOES: Opcao[] = [
  {
    id: 'nova',
    rotulo: 'Emitir nova nota',
    icone: FilePlus2,
    rota: '/notas/nova',
    palavras: 'criar nfse emitir',
  },
  {
    id: 'rascunhos',
    rotulo: 'Continuar um rascunho',
    icone: PencilLine,
    rota: '/notas?status=rascunhos&periodo=todos',
    palavras: 'rascunho salvo',
  },
  {
    id: 'rejeitadas',
    rotulo: 'Ver notas recusadas',
    icone: FileX2,
    rota: '/notas?status=rejeitadas&periodo=todos',
    palavras: 'rejeitada erro corrigir',
  },
  {
    id: 'enviando',
    rotulo: 'Ver notas aguardando o governo',
    icone: Clock,
    rota: '/notas?status=enviando&periodo=todos',
    palavras: 'enviando pendente',
  },
]

const PAGINAS: Opcao[] = [
  {
    id: 'painel',
    rotulo: 'Painel',
    icone: LayoutGrid,
    rota: '/',
    palavras: 'inicio dashboard resumo',
  },
  { id: 'notas', rotulo: 'Notas', icone: FileText, rota: '/notas', palavras: 'nfse lista fiscais' },
  { id: 'clientes', rotulo: 'Clientes', icone: Users, emBreve: true, palavras: 'tomadores' },
  { id: 'servicos', rotulo: 'Serviços', icone: Package, emBreve: true, palavras: 'catalogo nbs' },
  {
    id: 'tributos',
    rotulo: 'Tributos',
    icone: Landmark,
    emBreve: true,
    palavras: 'das cbs ibs impostos',
  },
  {
    id: 'simulador',
    rotulo: 'Simulador',
    icone: Calculator,
    emBreve: true,
    palavras: 'simples das',
  },
  {
    id: 'config',
    rotulo: 'Configurações',
    icone: Settings,
    emBreve: true,
    palavras: 'certificado empresa ambiente',
  },
  { id: 'ajuda', rotulo: 'Ajuda', icone: HelpCircle, emBreve: true, palavras: 'suporte duvida' },
]

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const casa = (o: Opcao, q: string) =>
  !q || normalizar(`${o.rotulo} ${o.palavras ?? ''}`).includes(q)

function useAtraso<T>(valor: T, ms = 200) {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

const classeItem =
  'flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-muted [&_[data-seta]]:data-[selected=true]:opacity-100'

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={titulo}
      className="px-2 pb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  )
}

function IconeItem({ icone: Icone, className }: { icone: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground/70',
        className,
      )}
    >
      <Icone className="size-4" />
    </span>
  )
}

function Seta() {
  return (
    <ArrowRight
      data-seta
      className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity"
    />
  )
}

/**
 * Busca rápida do topo. Abre com ⌘K (Mac) ou Ctrl+K (Windows/Linux):
 * páginas, ações, notas (busca na API) e clientes.
 */
export function BuscaComando() {
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [tecla] = useState(teclaModificadora)
  const q = normalizar(texto.trim())
  const qApi = useAtraso(texto.trim())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && comModificadora(e)) {
        e.preventDefault()
        setAberto((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const recentes = useNotasRecentes(4)
  const notas = useQuery({
    queryKey: ['notas', 'busca-rapida', qApi],
    queryFn: () => notasApi.listar({ busca: qApi, por_pagina: 5 }),
    enabled: aberto && qApi.length >= 2,
    staleTime: 10_000,
  })
  const tomadores = useTomadores()
  const clientes = useMemo(
    () =>
      q.length >= 2
        ? (tomadores.data?.itens ?? [])
            .filter(
              (t) =>
                normalizar(t.nome).includes(q) || t.documento.includes(q.replace(/\D/g, '') || '§'),
            )
            .slice(0, 4)
        : [],
    [q, tomadores.data],
  )

  const acoes = ACOES.filter((o) => casa(o, q))
  const paginas = PAGINAS.filter((o) => casa(o, q))
  const listaNotas = q.length >= 2 ? (notas.data?.itens ?? []) : (recentes.data?.itens ?? [])
  const buscandoNotas = q.length >= 2 && (notas.isFetching || qApi !== texto.trim())
  const nada =
    !buscandoNotas && acoes.length + paginas.length + listaNotas.length + clientes.length === 0

  const ir = (rota: string) => {
    setAberto(false)
    navigate(rota)
  }
  const escolher = (o: Opcao) => {
    if (o.rota) return ir(o.rota)
    setAberto(false)
    toast.info(`${o.rotulo} ainda está em construção.`, {
      description: 'Disponível nas próximas fases.',
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Buscar (${tecla} + K)`}
        className="group hidden h-10 w-full max-w-72 items-center gap-2 rounded-full border border-border bg-card pr-2 pl-3.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground md:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar notas, clientes…</span>
        <kbd className="inline-flex h-6 items-center gap-0.5 rounded-md border border-border bg-surface px-1.5 font-sans text-[11px] font-medium text-muted-foreground">
          {tecla === '⌘' ? <span className="text-[13px]">⌘</span> : 'Ctrl'}
          <span>K</span>
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Buscar"
        className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground/80 md:hidden"
      >
        <Search className="size-4" />
      </button>

      <Dialog
        open={aberto}
        onOpenChange={(v) => {
          setAberto(v)
          if (!v) setTexto('')
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="top-[12vh] translate-y-0 gap-0 overflow-hidden rounded-xl border border-border/80 p-0 shadow-pop ring-0 sm:max-w-[600px]"
        >
          <DialogTitle className="sr-only">Busca rápida</DialogTitle>
          <DialogDescription className="sr-only">
            Procure páginas, ações, notas e clientes. Use as setas para navegar e Enter para abrir.
          </DialogDescription>
          <Command shouldFilter={false} loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              {buscandoNotas ? (
                <Loader2 className="size-[18px] shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="size-[18px] shrink-0 text-muted-foreground" />
              )}
              <Command.Input
                value={texto}
                onValueChange={setTexto}
                placeholder="O que você procura? Cliente, nº da nota, página…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] text-muted-foreground">
                esc
              </kbd>
            </div>

            <Command.List className="max-h-[min(440px,60svh)] overflow-y-auto overscroll-contain pb-2">
              {nada && (
                <div className="flex flex-col items-center gap-1.5 px-6 py-12 text-center">
                  <Search className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Nada encontrado para “{texto}”</p>
                  <p className="text-xs text-muted-foreground">
                    Tente o nome do cliente, o número da nota ou um CPF/CNPJ.
                  </p>
                </div>
              )}

              {acoes.length > 0 && (
                <Grupo titulo="Ações">
                  {acoes.map((o) => (
                    <Command.Item
                      key={o.id}
                      value={`acao-${o.id}`}
                      onSelect={() => escolher(o)}
                      className={classeItem}
                    >
                      <IconeItem
                        icone={o.icone}
                        className="border-brand/20 bg-brand-soft text-brand-strong"
                      />
                      <span className="flex-1 font-medium">{o.rotulo}</span>
                      <Seta />
                    </Command.Item>
                  ))}
                </Grupo>
              )}

              {clientes.length > 0 && (
                <Grupo titulo="Emitir nota para">
                  {clientes.map((t) => {
                    const Icone = t.tipo_documento === 'CNPJ' ? Building : User
                    return (
                      <Command.Item
                        key={t.id}
                        value={`cliente-${t.id}`}
                        onSelect={() => ir(`/notas/nova?cliente=${t.id}`)}
                        className={classeItem}
                      >
                        <IconeItem icone={Icone} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{t.nome}</span>
                          <span className="tabular block truncate text-xs text-muted-foreground">
                            {t.tipo_documento} {formatarDocumento(t.documento)}
                          </span>
                        </span>
                        <Seta />
                      </Command.Item>
                    )
                  })}
                </Grupo>
              )}

              {listaNotas.length > 0 && (
                <Grupo titulo={q.length >= 2 ? 'Notas' : 'Notas recentes'}>
                  {listaNotas.map((n) => (
                    <Command.Item
                      key={n.id}
                      value={`nota-${n.id}`}
                      onSelect={() => ir(`/notas/${n.id}`)}
                      className={classeItem}
                    >
                      <IconeItem icone={FileText} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {n.numero_dps ? `Nº ${n.numero_dps}` : 'Rascunho'} · {n.tomador.nome}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {n.servico.apelido}
                        </span>
                      </span>
                      <span className="hidden sm:block">
                        <StatusPonto nota={n} />
                      </span>
                      <span className="tabular w-24 shrink-0 text-right text-[13px] font-semibold">
                        {formatarMoeda(n.valor)}
                      </span>
                    </Command.Item>
                  ))}
                </Grupo>
              )}

              {paginas.length > 0 && (
                <Grupo titulo="Ir para">
                  {paginas.map((o) => (
                    <Command.Item
                      key={o.id}
                      value={`pagina-${o.id}`}
                      onSelect={() => escolher(o)}
                      className={classeItem}
                    >
                      <IconeItem icone={o.icone} />
                      <span className="flex-1 font-medium">{o.rotulo}</span>
                      {o.emBreve ? (
                        <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                          em breve
                        </span>
                      ) : (
                        <Seta />
                      )}
                    </Command.Item>
                  ))}
                </Grupo>
              )}
            </Command.List>

            <footer className="flex items-center gap-4 border-t border-border bg-surface/60 px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-card px-1">↑</kbd>
                <kbd className="rounded border border-border bg-card px-1">↓</kbd> navegar
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="grid place-items-center rounded border border-border bg-card px-1 py-px">
                  <CornerDownLeft className="size-2.5" />
                </kbd>
                abrir
              </span>
              <span className="ml-auto hidden sm:block">
                {tecla === '⌘' ? '⌘' : 'Ctrl'} + K abre de qualquer tela
              </span>
            </footer>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
