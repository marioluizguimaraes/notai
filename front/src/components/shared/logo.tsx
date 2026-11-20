import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-8 place-items-center rounded-md bg-brand text-brand-foreground shadow-card">
        <Check className="size-4.5" strokeWidth={3} />
      </span>
      {!compacto && <span className="text-[17px] font-semibold tracking-tight">NotAI</span>}
    </div>
  )
}
