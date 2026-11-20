import { Building, FileText, Plus, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { ErroCarregar, LinhasSkeleton } from '@/components/shared/estado'
import { IconCircleButton, Panel, PanelHeader } from '@/components/shared/panel'
import { StatusNotaChip } from '@/components/shared/status-chip'
import { formatarDataCurta, formatarMoeda, formatarMoedaInteira } from '@/lib/format'
import { useNotasRecentes } from '../hooks/use-notas'

export function NotasRecentes() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useNotasRecentes(4)
  const total = data?.itens.reduce((s, n) => s + n.valor, 0) ?? 0
  const autorizadas = data?.itens.filter((n) => n.status === 'AUTORIZADA').length ?? 0

  return (
    <Panel>
      <PanelHeader
        icon={FileText}
        title="Notas recentes"
        actions={
          <IconCircleButton label="Nova nota" onClick={() => navigate('/notas/nova')}>
            <Plus />
          </IconCircleButton>
        }
      />
      {isPending ? (
        <LinhasSkeleton linhas={4} />
      ) : isError ? (
        <ErroCarregar onTentar={() => refetch()} />
      ) : (
        <>
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">
              Últimas {data.itens.length} de {data.total} notas
            </p>
            <div className="flex items-baseline justify-between">
              <p className="tabular text-[22px] font-semibold">{formatarMoedaInteira(total)}</p>
              <span className="text-xs text-muted-foreground">{autorizadas} autorizadas</span>
            </div>
            <div className="mt-2 flex h-1.5 gap-1 overflow-hidden rounded-full" aria-hidden>
              {data.itens.map((n) => (
                <span
                  key={n.id}
                  style={{ flexGrow: n.valor }}
                  className={
                    n.status === 'AUTORIZADA'
                      ? 'bg-brand'
                      : n.status === 'REJEITADA'
                        ? 'bg-danger'
                        : n.status === 'ENVIANDO'
                          ? 'bg-warning'
                          : 'bg-muted-foreground/40'
                  }
                />
              ))}
            </div>
          </div>
          <ul className="-mx-1 flex flex-col">
            {data.itens.map((n) => {
              const Icone = n.tomador.tipo_documento === 'CNPJ' ? Building : User
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/notas/${n.id}`)}
                    title={n.erro ? `${n.erro.codigo}: ${n.erro.mensagem}` : undefined}
                    className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left transition-colors hover:bg-muted/60"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-foreground/70">
                      <Icone className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {n.tomador.nome}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        Nº {n.numero_dps} · {n.servico.apelido} ·{' '}
                        {formatarDataCurta(n.emitida_em ?? n.criada_em).replace('.', '')}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tabular text-[13px] font-semibold">
                        {formatarMoeda(n.valor)}
                      </span>
                      <StatusNotaChip status={n.status} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <Link
            to="/notas"
            className="mt-2 inline-flex h-9 items-center justify-center rounded-full border border-border text-[13px] font-medium transition-colors hover:bg-muted"
          >
            Ver todas as notas
          </Link>
        </>
      )}
    </Panel>
  )
}
