import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Building,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FileCode2,
  FileDown,
  FlaskConical,
  Loader2,
  Mail,
  Plus,
  User,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { copiarTexto } from '@/lib/copiar'
import { Sigla } from '@/components/shared/sigla'
import { classeBotao } from '@/lib/estilos'
import { formatarData, formatarDataHora, formatarDocumento, formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBaixarArquivo } from '../hooks/use-notas'
import type { Nota } from '../schemas/nota'

/** Chave de 50 dígitos em blocos de 4, para ler e conferir com facilidade. */
const emBlocos = (chave: string) => chave.match(/.{1,4}/g)?.join(' ') ?? chave

/** Check desenhado com animação (traço). */
function CheckAnimado() {
  return (
    <span className="relative grid size-14 place-items-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-white/25 [animation-iteration-count:1]" />
      <span className="relative grid size-14 animate-in place-items-center rounded-full bg-white text-brand shadow-[0_10px_30px_-8px_rgb(0_0_0/0.35)] duration-500 zoom-in-50">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden>
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[animation:desenhar_0.45s_0.35s_ease-out_forwards] [stroke-dasharray:24] [stroke-dashoffset:24]"
          />
        </svg>
      </span>
      <style>{'@keyframes desenhar{to{stroke-dashoffset:0}}'}</style>
    </span>
  )
}

function Linha({
  rotulo,
  children,
  mono,
}: {
  rotulo: ReactNode
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <dt className="shrink-0 text-[13px] text-muted-foreground">{rotulo}</dt>
      <dd className={cn('min-w-0 text-right text-[13px] font-medium', mono && 'tabular')}>
        {children}
      </dd>
    </div>
  )
}

function Acao({
  icone: Icone,
  titulo,
  descricao,
  onClick,
  carregando,
  emBreve,
}: {
  icone: LucideIcon
  titulo: ReactNode
  descricao: string
  onClick: () => void
  carregando?: boolean
  emBreve?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className="group flex w-full items-center gap-3.5 rounded-md px-3 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground/70 transition-colors group-hover:border-brand/30 group-hover:text-brand-strong">
        {carregando ? (
          <Loader2 className="size-[18px] animate-spin" />
        ) : (
          <Icone className="size-[18px]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {titulo}
          {emBreve && (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] font-medium whitespace-nowrap text-muted-foreground">
              em breve
            </span>
          )}
        </span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{descricao}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

/** Etapa 3: comprovante da nota autorizada + próximos passos. */
export function ResultadoEmissao({ nota, onOutra }: { nota: Nota; onOutra: () => void }) {
  const baixar = useBaixarArquivo()
  const [baixando, setBaixando] = useState<'pdf' | 'xml' | null>(null)
  const [copiado, setCopiado] = useState(false)
  const t = nota.tomador
  const IconeCliente = t.tipo_documento === 'CNPJ' ? Building : User

  const baixarArquivo = (tipo: 'pdf' | 'xml') => {
    setBaixando(tipo)
    baixar.mutate({ nota, tipo }, { onSettled: () => setBaixando(null) })
  }

  const copiar = () =>
    nota.chave_acesso &&
    copiarTexto(nota.chave_acesso, 'Chave de acesso').then((ok) => {
      if (!ok) return
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Comprovante */}
      <section className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-card">
        <header className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-strong px-6 py-6 text-brand-foreground sm:px-8">
          <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-black/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <CheckAnimado />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
                Autorizada pelo governo
              </p>
              <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">
                Nota nº {nota.numero_dps} emitida
              </h2>
              <p className="tabular mt-0.5 text-[13px] text-white/80">
                Série {nota.serie}
                {nota.emitida_em && <> · {formatarDataHora(nota.emitida_em)}</>}
              </p>
            </div>
            <div className="border-t border-white/15 pt-3 sm:border-0 sm:pt-0 sm:text-right">
              <p className="text-xs text-white/75">Valor</p>
              <p className="tabular text-2xl font-semibold tracking-tight">
                {formatarMoeda(nota.valor)}
              </p>
            </div>
          </div>
        </header>

        {nota.ambiente === 'TESTES' && (
          <p className="flex items-center gap-2 border-b border-warning/20 bg-warning-soft/70 px-6 py-2.5 text-xs text-foreground/80 sm:px-8">
            <FlaskConical className="size-3.5 shrink-0 text-warning" />
            Emitida no ambiente de testes: serve para conferir o processo e não tem valor fiscal.
          </p>
        )}

        <div className="px-6 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-foreground/70">
              <IconeCliente className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t.nome}</p>
              <p className="tabular truncate text-xs text-muted-foreground">
                {t.tipo_documento} {formatarDocumento(t.documento)}
                {t.email && ` · ${t.email}`}
              </p>
            </div>
          </div>
          <dl className="mt-2 divide-y divide-border/60">
            <Linha rotulo="Serviço">{nota.servico.apelido}</Linha>
            <Linha rotulo="Descrição">
              <span className="line-clamp-2 font-normal text-foreground/80">{nota.descricao}</span>
            </Linha>
            <Linha rotulo={<Sigla termo="Competência" />} mono>
              {formatarData(nota.competencia)}
            </Linha>
            <Linha rotulo="Local da prestação">
              {nota.municipio_prestacao.nome}/{nota.municipio_prestacao.uf}
            </Linha>
          </dl>
        </div>

        {nota.chave_acesso && (
          <div className="relative mt-3 border-t border-dashed border-border px-6 py-5 sm:px-8">
            <span className="absolute -top-2 -left-2 size-4 rounded-full bg-canvas" aria-hidden />
            <span className="absolute -top-2 -right-2 size-4 rounded-full bg-canvas" aria-hidden />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                <Sigla termo="Chave de acesso" />
              </p>
              <button
                type="button"
                onClick={copiar}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
                  copiado
                    ? 'text-success'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiado ? 'Copiada' : 'Copiar'}
              </button>
            </div>
            <p className="tabular mt-1.5 font-mono text-[13px] leading-relaxed font-medium tracking-wide break-words text-foreground/90">
              {emBlocos(nota.chave_acesso)}
            </p>
          </div>
        )}
      </section>

      {/* Próximos passos */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <section className="rounded-lg border border-border/70 bg-card p-2 shadow-card">
          <p className="px-3 pt-3 pb-1 text-sm font-semibold">E agora?</p>
          <Acao
            icone={FileDown}
            titulo={
              <span>
                Baixar PDF (<Sigla termo="DANFSe" />)
              </span>
            }
            descricao="A versão para leitura. É ela que você manda para o cliente."
            carregando={baixando === 'pdf'}
            onClick={() => baixarArquivo('pdf')}
          />
          <Acao
            icone={FileCode2}
            titulo="Baixar XML"
            descricao="O documento fiscal oficial. Guarde ou envie ao seu contador."
            carregando={baixando === 'xml'}
            onClick={() => baixarArquivo('xml')}
          />
          <Acao
            icone={Mail}
            titulo="Enviar por e-mail"
            descricao={t.email ? `Para ${t.email}` : 'O cliente não tem e-mail cadastrado.'}
            emBreve
            onClick={() =>
              toast.info('Envio por e-mail em construção.', {
                description: 'Disponível nas próximas fases.',
              })
            }
          />
        </section>

        <div className="grid gap-2">
          <button type="button" onClick={onOutra} className={cn(classeBotao.primario, 'h-11')}>
            <Plus /> Emitir outra nota
          </button>
          <Link to={`/notas/${nota.id}`} className={cn(classeBotao.secundario, 'h-11')}>
            <Eye /> Ver detalhes da nota
          </Link>
        </div>
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          A nota também já aparece na sua lista de{' '}
          <Link to="/notas" className="font-medium text-brand-strong hover:underline">
            notas
          </Link>{' '}
          e no painel.
        </p>
      </aside>
    </div>
  )
}
