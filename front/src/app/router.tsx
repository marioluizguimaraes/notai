import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { RedirectIfAuth, RequireAuth } from '@/features/auth/components/require-auth'
import { DashboardPage } from '@/pages/dashboard-page'
import { ErroPage } from '@/pages/erro-page'
import { LoginPage } from '@/pages/login-page'
import { NotaDetalhePage } from '@/pages/nota-detalhe-page'
import { NotasPage } from '@/pages/notas-page'
import { NovaNotaPage } from '@/pages/nova-nota-page'

/**
 * Rotas. Telas novas entram como filhas do AppLayout (sidebar + topo).
 * Previstas: /clientes, /servicos, /tributos,
 * /simulador, /configuracoes, /cadastro, /onboarding.
 */
export const router = createBrowserRouter([
  {
    errorElement: <ErroPage />,
    children: [
      {
        element: <RedirectIfAuth />,
        children: [{ path: '/entrar', element: <LoginPage /> }],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/notas', element: <NotasPage /> },
              { path: '/notas/nova', element: <NovaNotaPage /> },
              { path: '/notas/:id', element: <NotaDetalhePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
