import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { setTokenProvider, setUnauthorizedHandler } from '@/lib/api'
import { usuarioSchema, type Usuario } from './schemas/auth'

/**
 * Sessão do usuário. Com "lembrar de mim" fica no localStorage; sem, no
 * sessionStorage (some ao fechar o navegador).
 */
export interface Sessao {
  token: string
  usuario: Usuario
}

const CHAVE = 'notai.sessao'
const ouvintes = new Set<() => void>()

const sessaoSchema = z.object({ token: z.string().min(1), usuario: usuarioSchema })

function limparArmazenamento() {
  try {
    localStorage.removeItem(CHAVE)
    sessionStorage.removeItem(CHAVE)
  } catch {
    /* ignorar */
  }
}

/**
 * Lê a sessão salva e valida contra o schema atual. Sessão de uma versão
 * anterior do app (ex.: usuário sem `cnpj`) é descartada e pede novo login.
 */
function ler(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE) ?? sessionStorage.getItem(CHAVE)
    if (!bruto) return null
    const parsed = sessaoSchema.safeParse(JSON.parse(bruto))
    if (parsed.success) return parsed.data
  } catch {
    /* JSON inválido */
  }
  limparArmazenamento()
  return null
}

let atual: Sessao | null = ler()

function emitir() {
  ouvintes.forEach((fn) => fn())
}

export const sessao = {
  get: () => atual,
  iniciar(s: Sessao, lembrar: boolean) {
    atual = s
    try {
      const destino = lembrar ? localStorage : sessionStorage
      ;(lembrar ? sessionStorage : localStorage).removeItem(CHAVE)
      destino.setItem(CHAVE, JSON.stringify(s))
    } catch {
      /* armazenamento indisponível: sessão só em memória */
    }
    emitir()
  },
  encerrar() {
    atual = null
    limparArmazenamento()
    emitir()
  },
  subscribe(fn: () => void) {
    ouvintes.add(fn)
    return () => ouvintes.delete(fn)
  },
}

setTokenProvider(() => atual?.token ?? null)
setUnauthorizedHandler(() => sessao.encerrar())

export function useSessao() {
  return useSyncExternalStore(sessao.subscribe, sessao.get, sessao.get)
}
