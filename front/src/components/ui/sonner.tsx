import type { ReactNode } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, Info, Loader2, TriangleAlert, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Toasts no visual do NotAI: card branco (como `Panel`), borda sutil,
 * cantos 16px, sombra `shadow-pop` e ícone em círculo com os mesmos tons
 * dos chips de status (sucesso, marca, atenção, erro).
 *
 * Uso: toast.success | toast.info | toast.warning | toast.error | toast.loading
 * (título curto + `description` opcional + `action` opcional).
 */

function IconeToast({ classe, children }: { classe: string; children: ReactNode }) {
  return (
    <span className={cn("grid size-8 place-items-center rounded-full [&_svg]:size-4", classe)}>
      {children}
    </span>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      gap={10}
      offset={20}
      mobileOffset={12}
      icons={{
        success: (
          <IconeToast classe="bg-success-soft text-success">
            <CheckCircle2 />
          </IconeToast>
        ),
        info: (
          <IconeToast classe="bg-brand-soft text-brand-strong">
            <Info />
          </IconeToast>
        ),
        warning: (
          <IconeToast classe="bg-warning-soft text-warning">
            <TriangleAlert />
          </IconeToast>
        ),
        error: (
          <IconeToast classe="bg-danger-soft text-danger">
            <XCircle />
          </IconeToast>
        ),
        loading: (
          <IconeToast classe="bg-muted text-muted-foreground">
            <Loader2 className="animate-spin" />
          </IconeToast>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group/toast relative flex w-[var(--width)] items-start gap-3 rounded-lg border border-border/80 bg-card p-3.5 pr-10 font-sans text-card-foreground shadow-pop",
          icon: "m-0 size-8 shrink-0 [&>*]:shrink-0",
          content: "flex min-w-0 flex-1 flex-col gap-0.5 pt-1",
          title: "text-sm leading-snug font-semibold text-foreground",
          description: "text-[13px] leading-relaxed text-muted-foreground",
          actionButton:
            "ml-1 mt-0.5 inline-flex h-8 shrink-0 items-center rounded-full bg-brand px-3.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-strong",
          cancelButton:
            "ml-1 mt-0.5 inline-flex h-8 shrink-0 items-center rounded-full border border-border bg-card px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-muted",
          closeButton:
            "absolute top-3 right-3 left-auto grid size-6 translate-x-0 translate-y-0 place-items-center rounded-full border-0 bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
