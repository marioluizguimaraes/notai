import { forwardRef, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { classeInput } from './campo'

const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Valor em reais digitado como em app de banco: os dígitos entram pela
 * direita (1 → 0,01 → 0,12 → 1,23). `value` e `onChange` trabalham em número.
 */
export const CampoMoeda = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
    value: number | undefined
    onChange: (valor: number | undefined) => void
  }
>(function CampoMoeda({ value, onChange, className, ...props }, ref) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        R$
      </span>
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0,00"
        value={value ? fmt.format(value) : ''}
        onChange={(e) => {
          const centavos = Number(e.target.value.replace(/\D/g, '').slice(0, 11))
          onChange(centavos ? centavos / 100 : undefined)
        }}
        className={cn(classeInput, 'tabular pl-10 text-right text-[15px] font-semibold', className)}
        {...props}
      />
    </div>
  )
})
