import { useState } from 'react'
import { ArrowRight, Info, ShieldAlert, ShieldX, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Sigla } from '@/components/shared/sigla'
import { cn } from '@/lib/utils'
import type { ProximaAcao } from '../schemas/dashboard'

const ESTILO: Record<
  ProximaAcao['severidade'],
  { icone: LucideIcon; faixa: string; iconeClasse: string; botao: string }
> = {
  INFO: {
    icone: Info,
    faixa: 'border-brand/20 bg-brand-soft/70',
    iconeClasse: 'text-brand-strong',
    botao: 'bg-brand text-brand-foreground hover:bg-brand-strong',
  },
  ATENCAO: {
    icone: ShieldAlert,
    faixa: 'border-warning/25 bg-warning-soft/80',
    iconeClasse: 'text-warning',
    botao: 'bg-ink text-ink-foreground hover:opacity-90',
  },
  CRITICO: {
    icone: ShieldX,
    faixa: 'border-danger/25 bg-danger-soft/80',
    iconeClasse: 'text-danger',
    botao: 'bg-danger text-white hover:opacity-90',
  },
}

const chaveDispensa = (tipo: string) => `notai.alerta.${tipo}`

function foiDispensado(tipo: string) {
  try {
    return sessionStorage.getItem(chaveDispensa(tipo)) === '1'
  } catch {
    return false
  }
}

/** Destaca "Certificado A1" com tooltip quando aparece no texto. */
function comSigla(texto: string) {
  const partes = texto.split('certificado A1')
  if (partes.length === 1) return texto
  return partes.flatMap((p, i) =>
    i === 0
      ? [p]
      : [
          <Sigla key={i} termo="Certificado A1">
            certificado A1
          </Sigla>,
          p,
        ],
  )
}

/**
 * Faixa compacta logo abaixo da saudação do painel. Mostra a ação mais
 * importante do momento (ex.: certificado vencendo). "Depois" esconde até a
 * próxima sessão; alertas CRITICO não podem ser dispensados.
 */
export function AlertaAcao({ acao }: { acao: ProximaAcao }) {
  const [oculto, setOculto] = useState(() => foiDispensado(acao.tipo))
  if (oculto) return null

  const estilo = ESTILO[acao.severidade]
  const Icone = estilo.icone
  const podeDispensar = acao.severidade !== 'CRITICO' && !!acao.acao_secundaria

  const dispensar = () => {
    try {
      sessionStorage.setItem(chaveDispensa(acao.tipo), '1')
    } catch {
      /* ignorar */
    }
    setOculto(true)
  }

  return (
    <div
      role={acao.severidade === 'CRITICO' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border px-4 py-3 sm:flex-nowrap',
        estilo.faixa,
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full bg-card shadow-card',
          estilo.iconeClasse,
        )}
      >
        <Icone className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{comSigla(acao.titulo)}</p>
        <p className="text-[13px] text-muted-foreground">
          {acao.destaque && (
            <span className="font-medium text-foreground/80">
              {acao.destaque.rotulo} · {acao.destaque.detalhe}.{' '}
            </span>
          )}
          <span className="hidden md:inline">{acao.descricao}</span>
        </p>
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => toast.info('Envio de certificado em construção.')}
          className={cn(
            'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-all sm:flex-none',
            estilo.botao,
          )}
        >
          {acao.acao_primaria.rotulo}
          <ArrowRight className="size-3.5" />
        </button>
        {podeDispensar && (
          <button
            type="button"
            onClick={dispensar}
            aria-label={`${acao.acao_secundaria?.rotulo}: esconder este aviso por agora`}
            title="Esconder até a próxima vez que entrar"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
