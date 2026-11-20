import { useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { classeInput } from './campo'

/**
 * Seletor com busca (combobox) no visual do sistema. Usado para escolher
 * cliente e serviço na emissão. Navegável por teclado (↑ ↓ Enter Esc).
 */
export function SeletorBusca<T extends { id: string }>({
  id,
  itens,
  valor,
  onChange,
  textoBusca,
  renderItem,
  renderSelecionado,
  placeholder,
  placeholderBusca = 'Buscar…',
  vazio = 'Nada encontrado.',
  rodape,
  carregando,
  invalido,
  descricao,
}: {
  id?: string
  itens: T[]
  valor: string | undefined
  onChange: (id: string) => void
  /** Texto usado na busca de cada item. */
  textoBusca: (item: T) => string
  renderItem: (item: T) => ReactNode
  renderSelecionado: (item: T) => ReactNode
  placeholder: string
  placeholderBusca?: string
  vazio?: string
  rodape?: ReactNode
  carregando?: boolean
  invalido?: boolean
  descricao?: string
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [ativo, setAtivo] = useState(0)
  const selecionado = itens.find((i) => i.id === valor)

  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!b) return itens
    return itens.filter((i) =>
      textoBusca(i).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(b),
    )
  }, [busca, itens, textoBusca])

  const escolher = (item: T) => {
    onChange(item.id)
    setAberto(false)
    setBusca('')
  }

  return (
    <Popover
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v)
        if (!v) setBusca('')
        setAtivo(0)
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={aberto}
          aria-invalid={invalido}
          aria-describedby={descricao}
          disabled={carregando}
          className={cn(
            classeInput,
            'flex h-auto min-h-11 items-center gap-3 py-2 text-left',
            !selecionado && 'text-muted-foreground/80',
          )}
        >
          <span className="min-w-0 flex-1">
            {selecionado
              ? renderSelecionado(selecionado)
              : carregando
                ? 'Carregando…'
                : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) gap-0 overflow-hidden rounded-lg border border-border/80 p-0 shadow-pop ring-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setAtivo(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setAtivo((a) => Math.min(a + 1, filtrados.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setAtivo((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter' && filtrados[ativo]) {
                e.preventDefault()
                escolher(filtrados[ativo])
              }
            }}
            placeholder={placeholderBusca}
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul role="listbox" className="max-h-72 overflow-y-auto p-1.5">
          {filtrados.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">{vazio}</li>
          )}
          {filtrados.map((item, i) => (
            <li key={item.id} role="option" aria-selected={item.id === valor}>
              <button
                type="button"
                onMouseEnter={() => setAtivo(i)}
                onClick={() => escolher(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
                  i === ativo && 'bg-muted',
                )}
              >
                <span className="min-w-0 flex-1">{renderItem(item)}</span>
                {item.id === valor && <Check className="size-4 shrink-0 text-brand" />}
              </button>
            </li>
          ))}
        </ul>
        {rodape && <div className="border-t border-border p-1.5">{rodape}</div>}
      </PopoverContent>
    </Popover>
  )
}
