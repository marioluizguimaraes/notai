import { isRouteErrorResponse, useRouteError } from 'react-router'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { sessao } from '@/features/auth/session'

/** Tela de erro das rotas: substitui a tela padrão do React Router. */
export function ErroPage() {
  const erro = useRouteError()
  const detalhe = isRouteErrorResponse(erro)
    ? `${erro.status} ${erro.statusText}`
    : erro instanceof Error
      ? erro.message
      : null

  return (
    <div className="flex min-h-svh flex-col bg-canvas p-6">
      <Logo />
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
        <span className="grid size-14 place-items-center rounded-lg bg-danger-soft text-danger">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não conseguimos abrir esta tela. Recarregue a página; se continuar, entre novamente.
        </p>
        {import.meta.env.DEV && detalhe && (
          <code className="mt-4 max-w-full rounded-md bg-card px-3 py-2 text-left text-xs break-words text-muted-foreground">
            {detalhe}
          </code>
        )}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand-strong"
          >
            <RotateCw className="size-4" /> Recarregar
          </button>
          <button
            type="button"
            onClick={() => {
              sessao.encerrar()
              window.location.assign('/entrar')
            }}
            className="h-10 rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-muted"
          >
            Entrar novamente
          </button>
        </div>
      </div>
    </div>
  )
}
