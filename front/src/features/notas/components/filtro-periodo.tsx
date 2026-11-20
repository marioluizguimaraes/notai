import { useState } from 'react'
import { CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  ATALHOS_PERIODO,
  descreverPeriodo,
  mesAtual,
  mesmoPeriodo,
  modoDoPeriodo,
  rotuloPeriodo,
  type ModoPeriodo,
  type Periodo,
} from '../periodo'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const MODOS: { valor: ModoPeriodo; rotulo: string; ajuda: string }[] = [
  { valor: 'entre', rotulo: 'Entre', ajuda: 'Escolha o mês inicial e depois o final.' },
  {
    valor: 'a_partir',
    rotulo: 'A partir de',
    ajuda: 'Escolha o primeiro mês. Entra tudo dali em diante.',
  },
  { valor: 'ate', rotulo: 'Até', ajuda: 'Escolha o último mês. Entra tudo até ele.' },
]

const mesDe = (ano: number, i: number) => `${ano}-${String(i + 1).padStart(2, '0')}`

/**
 * Filtro de período por mês: atalhos prontos + intervalo livre ("entre",
 * "a partir de" ou "até"), escolhido numa grade de meses com navegação de ano.
 */
export function FiltroPeriodo({
  valor,
  onChange,
}: {
  valor: Periodo
  onChange: (p: Periodo) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [rascunho, setRascunho] = useState<Periodo>(valor)
  const [modo, setModo] = useState<ModoPeriodo>(modoDoPeriodo(valor))
  // no modo "entre", o próximo clique define o início (true) ou o fim (false)
  const [escolhendoInicio, setEscolhendoInicio] = useState(true)
  const [ano, setAno] = useState(() => Number((valor.ate ?? valor.de ?? mesAtual()).slice(0, 4)))

  const hoje = mesAtual()
  const anoAtual = Number(hoje.slice(0, 4))

  const abrir = (v: boolean) => {
    if (v) {
      setRascunho(valor)
      setModo(modoDoPeriodo(valor))
      setEscolhendoInicio(true)
      setAno(Number((valor.ate ?? valor.de ?? hoje).slice(0, 4)))
    }
    setAberto(v)
  }

  const trocarModo = (m: ModoPeriodo) => {
    setModo(m)
    setEscolhendoInicio(true)
    setRascunho((r) => {
      const base = r.de ?? r.ate ?? hoje
      if (m === 'a_partir') return { de: r.de ?? base }
      if (m === 'ate') return { ate: r.ate ?? base }
      return { de: r.de ?? base, ate: r.ate ?? r.de ?? base }
    })
  }

  const clicarMes = (mes: string) => {
    if (modo === 'a_partir') return setRascunho({ de: mes })
    if (modo === 'ate') return setRascunho({ ate: mes })
    if (escolhendoInicio || !rascunho.de) {
      setRascunho({ de: mes, ate: mes })
      setEscolhendoInicio(false)
    } else {
      setRascunho(mes < rascunho.de ? { de: mes, ate: rascunho.de } : { de: rascunho.de, ate: mes })
      setEscolhendoInicio(true)
    }
  }

  const aplicar = (p: Periodo) => {
    onChange(p)
    setAberto(false)
  }

  const noIntervalo = (mes: string) =>
    (!rascunho.de || mes >= rascunho.de) &&
    (!rascunho.ate || mes <= rascunho.ate) &&
    (rascunho.de || rascunho.ate)
  const ajuda = MODOS.find((m) => m.valor === modo)!.ajuda

  return (
    <Popover open={aberto} onOpenChange={abrir}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Período: ${rotuloPeriodo(valor)}`}
          className="inline-flex h-9 min-w-44 items-center gap-2 rounded-md border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted data-[state=open]:border-brand data-[state=open]:ring-4 data-[state=open]:ring-brand/12"
        >
          <CalendarRange className="size-4 text-muted-foreground" />
          <span className="flex-1 truncate text-left first-letter:uppercase">
            {rotuloPeriodo(valor)}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(560px,calc(100vw-24px))] gap-0 overflow-hidden rounded-lg border border-border/80 p-0 shadow-pop ring-0"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Atalhos */}
          <ul className="flex gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:flex-col sm:border-r sm:border-b-0">
            {ATALHOS_PERIODO.map((a) => {
              const ativo = mesmoPeriodo(a.periodo(), rascunho)
              return (
                <li key={a.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => aplicar(a.periodo())}
                    className={cn(
                      'flex h-8 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-[13px] whitespace-nowrap transition-colors',
                      ativo
                        ? 'bg-brand-soft font-semibold text-brand-strong'
                        : 'text-foreground/80 hover:bg-muted',
                    )}
                  >
                    {a.rotulo}
                    {ativo && <Check className="hidden size-3.5 sm:block" />}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Intervalo personalizado */}
          <div className="flex-1 p-4">
            <div
              role="radiogroup"
              aria-label="Tipo de intervalo"
              className="grid grid-cols-3 gap-1 rounded-md bg-surface p-1"
            >
              {MODOS.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  role="radio"
                  aria-checked={modo === m.valor}
                  onClick={() => trocarModo(m.valor)}
                  className={cn(
                    'h-8 rounded-[7px] text-xs font-medium transition-all',
                    modo === m.valor
                      ? 'bg-card text-foreground shadow-card'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m.rotulo}
                </button>
              ))}
            </div>
            <p className="mt-2 min-h-4 text-xs text-muted-foreground">
              {modo === 'entre' && !escolhendoInicio ? 'Agora escolha o mês final.' : ajuda}
            </p>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="Ano anterior"
                onClick={() => setAno((a) => a - 1)}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="tabular text-sm font-semibold">{ano}</span>
              <button
                type="button"
                aria-label="Próximo ano"
                disabled={ano >= anoAtual}
                onClick={() => setAno((a) => a + 1)}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-y-1">
              {MESES.map((nome, i) => {
                const mes = mesDe(ano, i)
                const futuro = mes > hoje
                const ehInicio = mes === rascunho.de
                const ehFim = mes === rascunho.ate
                const dentro = !!noIntervalo(mes)
                const borda = ehInicio || ehFim
                // faixa contínua entre início e fim (como um calendário)
                const faixaEsq = dentro && !ehInicio && i % 4 !== 0
                const faixaDir = dentro && !ehFim && i % 4 !== 3
                return (
                  <div key={mes} className="relative h-9">
                    {dentro && (
                      <span
                        className={cn(
                          'absolute inset-y-0.5 bg-brand-soft',
                          faixaEsq ? 'left-0' : 'left-1 rounded-l-md',
                          faixaDir ? 'right-0' : 'right-1 rounded-r-md',
                        )}
                      />
                    )}
                    <button
                      type="button"
                      disabled={futuro}
                      onClick={() => clicarMes(mes)}
                      aria-pressed={borda}
                      className={cn(
                        'relative mx-1 grid h-full w-[calc(100%-8px)] place-items-center rounded-md text-[13px] transition-colors disabled:cursor-not-allowed disabled:text-muted-foreground/40',
                        borda
                          ? 'bg-brand font-semibold text-brand-foreground'
                          : dentro
                            ? 'font-medium text-brand-strong hover:bg-brand/15'
                            : 'hover:bg-muted',
                        mes === hoje && !borda && 'ring-1 ring-border ring-inset',
                      )}
                    >
                      {nome}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-[13px] font-medium first-letter:uppercase">
            {descreverPeriodo(rascunho)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => aplicar(ATALHOS_PERIODO[0].periodo())}
              className="h-8 rounded-md px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => aplicar(rascunho)}
              disabled={modo === 'entre' && !escolhendoInicio}
              className="h-8 rounded-md bg-ink px-4 text-[13px] font-semibold text-ink-foreground hover:opacity-90 disabled:opacity-40"
            >
              Aplicar
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
