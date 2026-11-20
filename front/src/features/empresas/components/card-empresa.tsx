import {
  Building2,
  Download,
  FilePlus2,
  MoreHorizontal,
  Package,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ErroCarregar } from '@/components/shared/estado'
import { CountPill, Panel, PanelHeader } from '@/components/shared/panel'
import { Sigla } from '@/components/shared/sigla'
import { formatarCNPJ } from '@/lib/format'
import { REGIME_ROTULO } from '@/types/fiscal'
import { useEmpresaAtual } from '../hooks/use-empresa'

const ATALHOS: { rotulo: string; icone: LucideIcon; rota?: string }[] = [
  { rotulo: 'Emitir', icone: FilePlus2, rota: '/notas/nova' },
  { rotulo: 'Clientes', icone: Users },
  { rotulo: 'Serviços', icone: Package },
  { rotulo: 'Notas', icone: Download, rota: '/notas' },
  { rotulo: 'Mais', icone: MoreHorizontal },
]

/** Cartão da empresa (equivale ao cartão de conta da referência). */
export function CardEmpresa() {
  const navigate = useNavigate()
  const { data: empresa, isPending, isError, refetch } = useEmpresaAtual()

  return (
    <Panel>
      <PanelHeader
        icon={Building2}
        title="Empresa"
        actions={
          empresa && (
            <CountPill>
              {empresa.municipio.nome}/{empresa.municipio.uf}
            </CountPill>
          )
        }
      />
      {isPending ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : isError ? (
        <ErroCarregar onTentar={() => refetch()} />
      ) : (
        <>
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-brand to-brand-strong p-4 text-brand-foreground">
            <div className="pointer-events-none absolute -right-10 -bottom-16 size-44 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute top-4 right-4 grid size-9 place-items-center rounded-md bg-white/15">
              <Building2 className="size-4" />
            </div>
            <span className="inline-flex h-5 items-center rounded-full bg-white/20 px-2 text-[10px] font-semibold tracking-wide uppercase">
              {empresa.ambiente === 'TESTES' ? 'Ambiente de testes' : 'Produção'}
            </span>
            <p className="tabular mt-5 text-lg font-semibold tracking-wide">
              {formatarCNPJ(empresa.cnpj)}
            </p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] text-white/75">
                  {empresa.nome_fantasia ?? 'Razão social'}
                </p>
                <p className="truncate text-[13px] font-semibold">{empresa.razao_social}</p>
              </div>
              <span className="shrink-0 rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold text-lime-foreground">
                {empresa.regime === 'MEI' ? <Sigla termo="MEI" /> : REGIME_ROTULO[empresa.regime]}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {ATALHOS.map(({ rotulo, icone: Icone, rota }) => (
              <button
                key={rotulo}
                type="button"
                onClick={() => (rota ? navigate(rota) : toast.info(`${rotulo}: em construção.`))}
                className="flex flex-col items-center gap-1 rounded-md py-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="grid size-8 place-items-center rounded-full bg-surface text-foreground/80">
                  <Icone className="size-4" />
                </span>
                {rotulo}
              </button>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}
