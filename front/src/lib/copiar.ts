import { toast } from 'sonner'

/**
 * Copia texto para a área de transferência com aviso. Usa a API moderna e,
 * se o navegador negar (página sem HTTPS, permissão), tenta o método antigo.
 */
export async function copiarTexto(texto: string, rotulo = 'Texto') {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    if (!ok) {
      toast.error(`Não foi possível copiar`, {
        description: 'Selecione o texto e copie manualmente.',
      })
      return false
    }
  }
  toast.success(`${rotulo} copiada`)
  return true
}
