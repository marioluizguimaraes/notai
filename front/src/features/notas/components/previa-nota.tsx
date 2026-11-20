import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Building2,
  Clock,
  FileSearch,
  Info,
  Landmark,
  Loader2,
  Lock,
  Settings2,
  UserRound,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { AreaComLateral } from '@/components/shared/area-com-lateral'
import { Panel, PanelHeader } from '@/components/shared/panel'
import { Sigla } from '@/components/shared/sigla'
import { classeBotao } from '@/lib/estilos'
import {
  formatarCEP,
  formatarCNPJ,
  formatarData,
  formatarDocumento,
  formatarMoeda,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Previa, TributosNota } from '../schemas/nota'

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
    <div className="grid gap-0.5 py-2 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-[13px] text-muted-foreground">{rotulo}</dt>
      <dd className={cn('text-[13px] font-medium break-words', mono && 'tabular')}>{children}</dd>
    </div>
  )
}

function Secao({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Building2
  titulo: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icone className="size-3.5" /> {titulo}
      </p>
      <dl className="divide-y divide-border/60">{children}</dl>
    </div>
  )
}

/** Situação de CBS/IBS explicada em linguagem simples. */
export function BlocoTributos({ tributos }: { tributos: TributosNota }) {
  if (tributos.situacao === 'NAO_DESTACADO_MEI')
    return (
      <div className="flex items-start gap-3 rounded-md bg-surface p-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-brand-strong shadow-card">
          <Info className="size-4" />
        </span>
        <div className="text-[13px] leading-relaxed">
          <p className="font-semibold">
            <Sigla termo="CBS" /> e <Sigla termo="IBS" /> não são destacados nesta nota
          </p>
          <p className="text-muted-foreground">
            Empresas <Sigla termo="MEI" /> ficam dispensadas de destacar os novos impostos da
            Reforma Tributária. Os tributos continuam sendo pagos no <Sigla termo="DAS" /> mensal.
          </p>
        </div>
      </div>
    )
  return (
    <div className="grid grid-cols-2 gap-2">
      {(['cbs', 'ibs'] as const).map((k) => {
        const t = tributos[k]
        return (
          <div key={k} className="rounded-md bg-surface px-3.5 py-3">
            <p className="text-xs text-muted-foreground">
              <Sigla termo={k.toUpperCase() as 'CBS' | 'IBS'} /> ·{' '}
              {t ? `${(t.aliquota * 100).toFixed(2)}%` : '—'}
            </p>
            <p className="tabular text-[17px] font-semibold">{t ? formatarMoeda(t.valor) : '—'}</p>
          </div>
        )
      })}
      {tributos.calculadora && (
        <p className="col-span-2 text-xs text-muted-foreground">
          Calculado por {tributos.calculadora.nome} (versão {tributos.calculadora.versao}).
        </p>
      )}
    </div>
  )
}

function useMinutosRestantes(expiraEm: string) {
  const calc = () => Math.max(Math.ceil((new Date(expiraEm).getTime() - Date.now()) / 60_000), 0)
  const [min, setMin] = useState(calc)
  useEffect(() => {
    const t = setInterval(() => setMin(calc()), 15_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiraEm])
  return min
}

/** Etapa 2: tudo que vai para o governo + confirmação explícita em botão separado. */
export function PreviaNota({
  previa,
  emitindo,
  erro,
  onEmitir,
  onVoltar,
  rolagemRef,
}: {
  previa: Previa
  emitindo: boolean
  erro: string | null
  onEmitir: () => void
  onVoltar: () => void
  rolagemRef?: (el: HTMLDivElement | null) => void
}) {
  const [confirmado, setConfirmado] = useState(false)
  const minutos = useMinutosRestantes(previa.expira_em)
  const expirou = minutos === 0
  const { dps } = previa
  const t = dps.tomador

  return (
    <AreaComLateral
      rolagemRef={rolagemRef}
      lateral={
        <>
          <Panel>
            <p className="text-[13px] text-muted-foreground">Valor da nota</p>
            <p className="tabular text-[30px] leading-tight font-semibold tracking-tight">
              {formatarMoeda(dps.valor)}
            </p>
            <p className="tabular mt-1 text-xs text-muted-foreground">
              Série {dps.serie} · nº {dps.numero_dps} · {t.nome}
            </p>

            {previa.avisos.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {previa.avisos.map((a) => (
                  <li
                    key={a}
                    className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-foreground/80"
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" /> {a}
                  </li>
                ))}
              </ul>
            )}

            {erro && (
              <p
                role="alert"
                className="mt-4 rounded-md bg-danger-soft px-3 py-2.5 text-[13px] text-danger"
              >
                {erro}
              </p>
            )}

            <label
              className={cn(
                'mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-border p-3.5 text-[13px] leading-relaxed transition-colors select-none',
                confirmado && 'border-brand bg-brand-soft/50',
              )}
            >
              <Checkbox
                checked={confirmado}
                onCheckedChange={(v) => setConfirmado(v === true)}
                disabled={emitindo || expirou}
                className="mt-0.5 size-[18px] rounded-[5px] data-[state=checked]:border-brand data-[state=checked]:bg-brand"
              />
              <span>
                Conferi os dados acima e quero{' '}
                <span className="font-semibold">emitir esta nota</span>.
              </span>
            </label>

            <button
              type="button"
              onClick={onEmitir}
              disabled={!confirmado || emitindo || expirou}
              className={cn(classeBotao.primario, 'mt-3 h-11 w-full')}
            >
              {emitindo ? (
                <>
                  <Loader2 className="animate-spin" /> Enviando ao governo…
                </>
              ) : (
                <>
                  <Lock /> Assinar e emitir nota
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onVoltar}
              disabled={emitindo}
              className={cn(classeBotao.secundario, 'mt-2 w-full')}
            >
              Voltar e editar
            </button>

            <p
              className={cn(
                'mt-3 flex items-center justify-center gap-1.5 text-xs',
                expirou ? 'font-medium text-danger' : 'text-muted-foreground',
              )}
            >
              <Clock className="size-3.5" />
              {expirou
                ? 'Prévia expirada. Volte e gere de novo.'
                : `Prévia válida por mais ${minutos} min`}
            </p>
          </Panel>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        <Panel>
          <PanelHeader
            icon={FileSearch}
            title="O que será enviado ao governo"
            description={
              <>
                Confira com calma. Estes são os dados da <Sigla termo="DPS" />.
              </>
            }
          />
          <div className="flex flex-col gap-5">
            <Secao icone={Building2} titulo="Prestador (sua empresa)">
              <Linha rotulo="Razão social">{dps.prestador.razao_social}</Linha>
              <Linha rotulo={<Sigla termo="CNPJ" />} mono>
                {formatarCNPJ(dps.prestador.cnpj)}
              </Linha>
              <Linha rotulo="Inscrição municipal" mono>
                {dps.prestador.inscricao_municipal ?? '—'}
              </Linha>
              <Linha rotulo="Regime">{dps.prestador.regime_rotulo}</Linha>
            </Secao>
            <Secao icone={UserRound} titulo="Cliente (tomador)">
              <Linha rotulo="Nome">{t.nome}</Linha>
              <Linha rotulo={t.tipo_documento} mono>
                {formatarDocumento(t.documento)}
              </Linha>
              <Linha rotulo="Endereço">
                {t.endereco.logradouro}, {t.endereco.numero}
                {t.endereco.complemento && ` · ${t.endereco.complemento}`} · {t.endereco.bairro} ·{' '}
                {t.endereco.municipio.nome}/{t.endereco.municipio.uf} · CEP{' '}
                {formatarCEP(t.endereco.cep)}
              </Linha>
              <Linha rotulo="E-mail">{t.email ?? '—'}</Linha>
            </Secao>
            <Secao icone={Landmark} titulo="Serviço">
              <Linha rotulo="Serviço">{dps.servico.apelido}</Linha>
              <Linha rotulo="Código nacional" mono>
                {dps.servico.codigo_servico}
              </Linha>
              <Linha rotulo={<Sigla termo="NBS" />} mono>
                {dps.servico.nbs ?? '—'}
              </Linha>
              <Linha rotulo="Descrição">{dps.servico.descricao}</Linha>
              <Linha rotulo="Local da prestação">
                {dps.servico.municipio.nome}/{dps.servico.municipio.uf}
              </Linha>
              <Linha rotulo={<Sigla termo="Competência" />} mono>
                {formatarData(dps.competencia)}
              </Linha>
            </Secao>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            icon={Settings2}
            title="Preenchido automaticamente"
            description="Valores que o sistema coloca na nota sem você precisar informar"
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {previa.valores_fixos.map((v) => (
              <li key={v.campo} className="rounded-md bg-surface px-3.5 py-3">
                <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  {v.rotulo}
                  <code className="rounded-sm bg-card px-1.5 py-0.5 text-[10px]">{v.campo}</code>
                </p>
                <p className="mt-0.5 text-[13px] font-semibold">{v.valor}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {v.explicacao}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader icon={Landmark} title="Tributos da Reforma (CBS e IBS)" />
          <BlocoTributos tributos={previa.tributos} />
        </Panel>
      </div>
    </AreaComLateral>
  )
}
