import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Ban,
  Copy,
  Eye,
  FileCode2,
  FileDown,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { copiarTexto } from '@/lib/copiar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useBaixarArquivo, useConsultarNota, useExcluirRascunho } from '../hooks/use-notas'
import type { NotaResumo } from '../schemas/nota'
import { CancelarNotaDialog } from './cancelar-nota-dialog'

/** Menu "⋯" com as ações possíveis para cada status da nota. */
export function AcoesNota({
  nota,
  incluirVer = true,
  className,
}: {
  nota: NotaResumo
  incluirVer?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  const baixar = useBaixarArquivo()
  const consultar = useConsultarNota(nota.id)
  const excluir = useExcluirRascunho()
  const [cancelando, setCancelando] = useState(false)

  const temArquivos = !!nota.chave_acesso
  const s = nota.status

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Ações da nota ${nota.numero_dps ?? 'rascunho'}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none data-[state=open]:bg-muted',
            className,
          )}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          {incluirVer && (
            <DropdownMenuItem onSelect={() => navigate(`/notas/${nota.id}`)}>
              <Eye /> Ver detalhes
            </DropdownMenuItem>
          )}
          {s === 'RASCUNHO' && (
            <DropdownMenuItem onSelect={() => navigate(`/notas/nova?rascunho=${nota.id}`)}>
              <Pencil /> Continuar emissão
            </DropdownMenuItem>
          )}
          {s === 'REJEITADA' && (
            <DropdownMenuItem onSelect={() => navigate(`/notas/nova?de=${nota.id}`)}>
              <RotateCcw /> Corrigir e emitir de novo
            </DropdownMenuItem>
          )}
          {temArquivos && (
            <>
              <DropdownMenuItem onSelect={() => baixar.mutate({ nota, tipo: 'pdf' })}>
                <FileDown /> Baixar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => baixar.mutate({ nota, tipo: 'xml' })}>
                <FileCode2 /> Baixar XML
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => copiarTexto(nota.chave_acesso!, 'Chave de acesso')}>
                <Copy /> Copiar chave de acesso
              </DropdownMenuItem>
            </>
          )}
          {(s === 'ENVIANDO' || s === 'AUTORIZADA') && (
            <DropdownMenuItem
              onSelect={() =>
                consultar.mutate(undefined, {
                  onSuccess: (n) =>
                    toast.success(
                      n.status === 'AUTORIZADA' && s === 'ENVIANDO'
                        ? `Nota nº ${n.numero_dps} autorizada`
                        : 'Situação conferida no governo',
                      { description: s === 'ENVIANDO' ? undefined : 'Nenhuma mudança encontrada.' },
                    ),
                  onError: (e) =>
                    toast.error('Não foi possível consultar', { description: e.message }),
                })
              }
            >
              <RefreshCw /> Consultar situação
            </DropdownMenuItem>
          )}
          {s === 'AUTORIZADA' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setCancelando(true)}>
                <Ban /> Cancelar nota
              </DropdownMenuItem>
            </>
          )}
          {s === 'RASCUNHO' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() =>
                  excluir.mutate(nota.id, {
                    onSuccess: () => toast.success('Rascunho excluído'),
                    onError: (e) =>
                      toast.error('Não foi possível excluir', { description: e.message }),
                  })
                }
              >
                <Trash2 /> Excluir rascunho
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {s === 'AUTORIZADA' && (
        <CancelarNotaDialog nota={nota} aberto={cancelando} onAbertoChange={setCancelando} />
      )}
    </>
  )
}
