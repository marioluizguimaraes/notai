import { Navigate, Outlet, useLocation } from 'react-router'
import { useSessao } from '../session'

/** Protege as rotas internas: sem sessão, manda para /entrar e volta depois. */
export function RequireAuth() {
  const s = useSessao()
  const location = useLocation()
  if (!s) return <Navigate to="/entrar" replace state={{ de: location.pathname }} />
  return <Outlet />
}

/** Rotas públicas (login): com sessão ativa, vai direto ao painel. */
export function RedirectIfAuth() {
  const s = useSessao()
  if (s) return <Navigate to="/" replace />
  return <Outlet />
}
