import { Outlet } from 'react-router'
import { AppTopbar } from './app-header'
import { AppSidebar } from './app-sidebar'

/** Moldura do app: sidebar branca + área de conteúdo cinza-claro arredondada. */
export function AppLayout() {
  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:py-3 lg:pr-3">
        <div className="flex flex-1 flex-col gap-5 bg-canvas px-4 py-4 sm:px-6 sm:py-5 lg:rounded-2xl">
          <AppTopbar />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
