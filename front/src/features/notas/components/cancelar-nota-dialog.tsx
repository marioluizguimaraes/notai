import { useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Campo, classeInput } from '@/components/shared/campo'
import { ApiError } from '@/lib/api'
import { classeBotao } from '@/lib/estilos'
import { formatarMoeda } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCancelarNota } from '../hooks/use-notas'
import { MOTIVO_CANCELAMENTO_ROTULO, type NotaResumo } from '../schemas/nota'

const formSchema = z.object({
  motivo: z.custom<1 | 2 | 9>(
    (v) => v === 1 || v === 2 || v === 9,
    'Escolha o motivo do cancelamento.',
  ),
  justificativa: z
    .string()
    .trim()
    .min(15, 'Escreva pelo menos 15 caracteres.')
    .max(255, 'Use no máximo 255 caracteres.'),
})
type Form = z.infer<typeof formSchema>

const MOTIVOS = [
  { valor: 1, ajuda: 'Algum dado da nota saiu errado.' },
  { valor: 2, ajuda: 'O serviço não chegou a ser feito.' },
  { valor: 9, ajuda: 'Outra razão, explicada abaixo.' },
] as const

/** Cancelamento da NFS-e: motivo (cMotivo 1, 2 ou 9) + justificativa de 15 a 255 caracteres. */
export function CancelarNotaDialog({
  nota,
  aberto,
  onAbertoChange,
}: {
  nota: Pick<NotaResumo, 'id' | 'numero_dps' | 'valor' | 'tomador'>
  aberto: boolean
  onAbertoChange: (v: boolean) => void
}) {
  const cancelar = useCancelarNota(nota.id)
  const [erroApi, setErroApi] = useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(formSchema),
    defaultValues: { justificativa: '' },
  })
  const texto = useWatch({ control, name: 'justificativa' }) ?? ''

  const fechar = (v: boolean) => {
    if (cancelar.isPending) return
    if (!v) {
      reset()
      setErroApi(null)
    }
    onAbertoChange(v)
  }

  const onSubmit = handleSubmit((dados) => {
    setErroApi(null)
    cancelar.mutate(dados, {
      onSuccess: () => {
        toast.success(`Nota nº ${nota.numero_dps} cancelada`, {
          description: 'O cancelamento foi registrado no governo.',
        })
        fechar(false)
      },
      onError: (e) =>
        setErroApi(e instanceof ApiError ? e.message : 'Não foi possível cancelar agora.'),
    })
  })

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className="gap-0 rounded-xl p-0 sm:max-w-[480px]">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader className="gap-1 p-5 pb-4">
            <span className="mb-2 grid size-10 place-items-center rounded-full bg-danger-soft text-danger">
              <AlertTriangle className="size-5" />
            </span>
            <DialogTitle className="text-lg font-semibold">
              Cancelar nota nº {nota.numero_dps}
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              {nota.tomador.nome} · {formatarMoeda(nota.valor)}. O cancelamento é enviado ao governo
              e não pode ser desfeito.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            {erroApi && (
              <p
                role="alert"
                className="rounded-md bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger"
              >
                {erroApi}
              </p>
            )}
            <Campo rotulo="Motivo" erro={errors.motivo?.message}>
              {({ id, ...aria }) => (
                <Controller
                  control={control}
                  name="motivo"
                  render={({ field }) => (
                    <div id={id} role="radiogroup" {...aria} className="grid gap-2">
                      {MOTIVOS.map((m) => (
                        <label
                          key={m.valor}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-md border border-border px-3.5 py-2.5 transition-colors hover:bg-muted/60',
                            field.value === m.valor &&
                              'border-brand bg-brand-soft/50 hover:bg-brand-soft/50',
                          )}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === m.valor}
                            onChange={() => field.onChange(m.valor)}
                            className="mt-0.5 size-4 accent-[var(--brand)]"
                          />
                          <span>
                            <span className="block text-sm font-medium">
                              {MOTIVO_CANCELAMENTO_ROTULO[m.valor]}
                            </span>
                            <span className="block text-xs text-muted-foreground">{m.ajuda}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                />
              )}
            </Campo>
            <Campo
              rotulo="Justificativa"
              erro={errors.justificativa?.message}
              extra={
                <span
                  className={cn(
                    'tabular text-xs',
                    texto.length > 255 ? 'text-danger' : 'text-muted-foreground',
                  )}
                >
                  {texto.length}/255
                </span>
              }
            >
              {(p) => (
                <textarea
                  {...p}
                  rows={3}
                  placeholder="Explique em poucas palavras por que a nota está sendo cancelada."
                  className={cn(classeInput, 'h-auto resize-none py-2.5')}
                  {...register('justificativa')}
                />
              )}
            </Campo>
          </div>

          <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-xl border-t border-border bg-surface px-5 py-3.5">
            <button type="button" onClick={() => fechar(false)} className={classeBotao.secundario}>
              Voltar
            </button>
            <button type="submit" disabled={cancelar.isPending} className={classeBotao.perigo}>
              {cancelar.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Cancelando…
                </>
              ) : (
                'Cancelar nota'
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
