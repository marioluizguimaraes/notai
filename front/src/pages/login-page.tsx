import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  FlaskConical,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Logo } from '@/components/shared/logo'
import { Sigla } from '@/components/shared/sigla'
import { Chip } from '@/components/shared/status-chip'
import { useLogin } from '@/features/auth/hooks/use-login'
import { loginFormSchema, type LoginForm, type LoginFormInput } from '@/features/auth/schemas/auth'
import { ApiError } from '@/lib/api'
import { env } from '@/lib/env'
import { formatarCNPJ } from '@/lib/format'
import { cn } from '@/lib/utils'
import { cnpjValido } from '@/lib/validators'

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

const campo =
  'peer h-12 baixa:h-11 w-full rounded-md border border-input bg-card pl-11 pr-11 text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/12 aria-invalid:border-danger aria-invalid:ring-danger/12'

const iconeCampo =
  'pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground transition-colors peer-focus-visible:text-brand'

/** Credenciais de demonstração, lidas do JSON de mock (só quando os mocks estão ligados). */
function useCredenciaisDemo() {
  const [demo, setDemo] = useState<{ cnpj: string; senha: string } | null>(null)
  useEffect(() => {
    if (!env.useMocks) return
    import('@/mocks/data/auth-login.json').then((m) => setDemo(m.default.credenciais_demo))
  }, [])
  return demo
}

function MensagemCampo({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
      <AlertCircle className="size-3.5" /> {children}
    </p>
  )
}

function FormularioLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const demo = useCredenciaisDemo()
  const [verSenha, setVerSenha] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInput, unknown, LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { cnpj: '', senha: '', lembrar: true },
  })

  const cnpjOk = cnpjValido(useWatch({ control, name: 'cnpj' }))

  const onSubmit = handleSubmit((dados) =>
    login.mutate(dados, {
      onSuccess: () => {
        const destino = (location.state as { de?: string } | null)?.de ?? '/'
        navigate(destino, { replace: true })
      },
    }),
  )

  const erroApi =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'Não foi possível entrar agora. Tente de novo em instantes.'
        : null

  return (
    <div className="w-full max-w-[400px]">
      <span className="mb-6 grid size-12 place-items-center rounded-lg bg-brand-soft text-brand-strong baixa:hidden">
        <Building2 className="size-6" />
      </span>
      <h1 className="text-[30px] leading-tight font-semibold tracking-tight mbaixa:text-[26px]">
        Entrar na sua empresa
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground mbaixa:mt-1 mbaixa:text-sm">
        Use o <Sigla termo="CNPJ" /> da empresa e a senha que você cadastrou.
      </p>

      {erroApi && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger baixa:mt-4 baixa:py-2.5"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Não foi possível entrar</p>
            <p className="text-danger/90">{erroApi}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-7 flex flex-col gap-5 baixa:mt-5 baixa:gap-4"
      >
        <div>
          <label htmlFor="cnpj" className="mb-2 block text-[13px] font-semibold">
            CNPJ
          </label>
          <div className="relative">
            <Controller
              control={control}
              name="cnpj"
              render={({ field }) => (
                <input
                  id="cnpj"
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(formatarCNPJ(e.target.value))}
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="00.000.000/0000-00"
                  aria-invalid={!!errors.cnpj}
                  aria-describedby={errors.cnpj ? 'cnpj-erro' : undefined}
                  className={cn(campo, 'tabular tracking-wide')}
                />
              )}
            />
            <Building2 className={iconeCampo} />
            {cnpjOk && (
              <CheckCircle2
                aria-label="CNPJ válido"
                className="absolute top-1/2 right-4 size-[18px] -translate-y-1/2 text-success"
              />
            )}
          </div>
          <MensagemCampo id="cnpj-erro">{errors.cnpj?.message}</MensagemCampo>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="senha" className="text-[13px] font-semibold">
              Senha
            </label>
            <button
              type="button"
              onClick={() => toast.info('Recuperação de senha em construção.')}
              className="text-[13px] font-medium text-brand-strong hover:underline"
            >
              Esqueci a senha
            </button>
          </div>
          <div className="relative">
            <input
              id="senha"
              type={verSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              aria-invalid={!!errors.senha}
              aria-describedby={errors.senha ? 'senha-erro' : undefined}
              className={campo}
              {...register('senha')}
            />
            <Lock className={iconeCampo} />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}
              className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {verSenha ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
          <MensagemCampo id="senha-erro">{errors.senha?.message}</MensagemCampo>
        </div>

        <label className="-mt-1 flex w-fit cursor-pointer items-center gap-2.5 text-[13px] text-muted-foreground select-none">
          <Controller
            control={control}
            name="lembrar"
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                className="size-[18px] rounded-[5px] data-[state=checked]:border-brand data-[state=checked]:bg-brand"
              />
            )}
          />
          Manter conectado neste computador
        </label>

        <button
          type="submit"
          disabled={login.isPending}
          className="group mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-foreground shadow-[0_8px_20px_-8px] shadow-brand/60 transition-all hover:bg-brand-strong focus-visible:ring-4 focus-visible:ring-brand/25 focus-visible:outline-none active:translate-y-px disabled:opacity-70 baixa:h-11"
        >
          {login.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 rounded-md bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground baixa:mt-4 baixa:py-2.5 mbaixa:hidden">
        <ShieldCheck className="size-5 shrink-0 text-brand" />
        Acesso protegido. O certificado digital da sua empresa nunca sai do seu computador.
      </div>

      {demo && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground baixa:py-2 mbaixa:mt-4">
          <span>
            <span className="font-semibold text-foreground">Demonstração:</span>{' '}
            <span className="tabular">{formatarCNPJ(demo.cnpj)}</span> · senha{' '}
            <span className="tabular">{demo.senha}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setValue('cnpj', formatarCNPJ(demo.cnpj), { shouldValidate: true })
              setValue('senha', demo.senha, { shouldValidate: true })
            }}
            className="font-semibold text-brand-strong hover:underline"
          >
            Preencher
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vitrine (ilustração do produto, sem dados reais)                     */
/* ------------------------------------------------------------------ */

/** Valores ilustrativos fixos: só compõem o desenho da vitrine, não são dados da API. */
const EXEMPLO = {
  faturado: 'R$ 6.840,00',
  variacao: '12,4%',
  nota: { cliente: 'Estúdio Lume', numero: 13, valor: 'R$ 950,00' },
  serie: [12, 18, 15, 26, 22, 34, 30, 44, 38, 52, 47, 60],
}

function Sparkline({ valores }: { valores: number[] }) {
  const w = 240
  const h = 64
  const max = Math.max(...valores)
  const pts = valores.map((v, i) => [(i / (valores.length - 1)) * w, h - (v / max) * (h - 6) - 3])
  const linha = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="vitrine-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linha} L${w},${h} L0,${h} Z`} fill="url(#vitrine-grad)" />
      <path d={linha} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

function Vitrine() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand to-brand-strong p-10 text-brand-foreground xl:p-14 baixa:p-9 baixa:xl:p-10 mbaixa:p-8">
      {/* textura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_75%)] [background-size:40px_40px] opacity-[0.07]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-black/10"
      />

      <div className="relative">
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-white/15 px-3.5 text-xs font-medium ring-1 ring-white/20 backdrop-blur-sm">
          <Sparkles className="size-3.5" /> Pronto para a Reforma Tributária
        </span>
        <h2 className="mt-6 max-w-md text-[40px] leading-[1.08] font-semibold tracking-tight baixa:mt-5 baixa:text-[34px] mbaixa:mt-4 mbaixa:text-[30px]">
          Sua nota de serviço emitida em minutos.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80 baixa:mt-3 baixa:text-sm mbaixa:hidden">
          Informe o CNPJ, confirme o regime e emita a NFS-e com CBS e IBS calculados pelas
          calculadoras oficiais da Receita.
        </p>
      </div>

      {/* composição de cards */}
      <div
        className="relative mx-auto my-10 min-h-[19rem] w-full max-w-md flex-1 origin-top baixa:my-6 mbaixa:my-5 mbaixa:min-h-[17rem] mbaixa:scale-90"
        aria-hidden
      >
        <div className="absolute top-6 right-0 left-6 rounded-lg bg-card p-5 text-card-foreground shadow-[0_24px_48px_-16px_rgb(0_0_0/0.35)]">
          <span className="text-[13px] text-muted-foreground">Faturado no mês</span>
          <p className="tabular mt-2 text-[28px] leading-none font-semibold tracking-tight">
            {EXEMPLO.faturado}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Chip tom="sucesso">↗ {EXEMPLO.variacao}</Chip> vs. mês passado
          </div>
          <div className="mt-3">
            <Sparkline valores={EXEMPLO.serie} />
          </div>
        </div>

        <div className="absolute top-0 -right-4 flex items-center gap-2.5 rounded-full bg-card py-2 pr-4 pl-2 text-card-foreground shadow-[0_16px_32px_-12px_rgb(0_0_0/0.35)] xl:-right-10">
          <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand-strong">
            <Calculator className="size-4" />
          </span>
          <span className="text-xs leading-tight">
            <span className="block font-semibold">CBS + IBS calculados</span>
            <span className="text-muted-foreground">pela calculadora oficial</span>
          </span>
        </div>

        <div className="absolute top-[15.5rem] -left-2 w-[82%] rounded-lg bg-card p-3.5 text-card-foreground shadow-[0_24px_48px_-16px_rgb(0_0_0/0.4)] xl:-left-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">
                {EXEMPLO.nota.cliente}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Nota nº {EXEMPLO.nota.numero} autorizada pelo governo
              </span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="tabular text-[13px] font-semibold">{EXEMPLO.nota.valor}</span>
              <Chip tom="sucesso">Autorizada</Chip>
            </span>
          </div>
        </div>
      </div>

      <ul className="relative grid grid-cols-3 gap-3 text-[13px] baixa:hidden">
        {[
          { icone: FileCheck2, texto: 'Prévia antes de enviar ao governo' },
          { icone: ShieldCheck, texto: 'Certificado A1 fica com você' },
          { icone: FlaskConical, texto: 'Começa no ambiente de testes' },
        ].map(({ icone: Icone, texto }) => (
          <li
            key={texto}
            className="flex flex-col gap-2 rounded-md bg-white/10 p-3.5 ring-1 ring-white/15"
          >
            <Icone className="size-[18px]" />
            <span className="leading-snug text-white/90">{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const ANO = new Date().getFullYear()

export function LoginPage() {
  return (
    <div className="flex min-h-svh bg-background lg:h-svh">
      <div className="flex flex-1 flex-col px-6 py-6 sm:px-12 lg:max-w-[600px] lg:flex-none lg:basis-[46%] lg:overflow-y-auto xl:px-16 baixa:py-5 mbaixa:py-4">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <p className="text-[13px] text-muted-foreground">
            <span className="hidden sm:inline">Ainda não tem conta? </span>
            <Link
              to="/entrar"
              onClick={(e) => {
                e.preventDefault()
                toast.info('Cadastro em construção.')
              }}
              className="font-semibold text-brand-strong hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <main className="flex flex-1 items-center justify-center py-12 baixa:py-6 mbaixa:py-4">
          <FormularioLogin />
        </main>

        <p className="text-center text-xs text-muted-foreground sm:text-left">
          © {ANO} NotAI · O NotAI não substitui o seu contador.
        </p>
      </div>

      <div className="hidden flex-1 p-3 lg:block">
        <Vitrine />
      </div>
    </div>
  )
}
