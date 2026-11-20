/** Botões no padrão do sistema. */
export const classeBotao = {
  primario:
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-strong focus-visible:ring-4 focus-visible:ring-brand/25 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4',
  escuro:
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4',
  secundario:
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4',
  perigo:
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-danger px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-danger/25 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4',
} as const
