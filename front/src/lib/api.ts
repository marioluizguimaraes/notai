import type { z } from 'zod'
import { env } from './env'

/** Erro padronizado da API. `campo` aponta o campo do formulário, quando houver. */
export class ApiError extends Error {
  readonly status: number
  readonly codigo?: string
  readonly campo?: string

  constructor(status: number, message: string, codigo?: string, campo?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
    this.campo = campo
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions<S extends z.ZodType = z.ZodType> {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  headers?: Record<string, string>
  /** Schema zod da resposta. Garante que os dados seguem o contrato da API. */
  schema?: S
}

let tokenProvider: () => string | null = () => null
let onUnauthorized: () => void = () => {}

/** Registrado pelo módulo de auth para anexar o JWT às requisições. */
export function setTokenProvider(fn: () => string | null) {
  tokenProvider = fn
}

/** Chamado quando a API responde 401 em rota autenticada (sessão expirada). */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

async function enviar(
  metodo: Metodo,
  caminho: string,
  headers: Record<string, string>,
  body: BodyInit | undefined,
  rawBody: unknown,
  query: URLSearchParams,
  signal?: AbortSignal,
): Promise<Response> {
  if (env.useMocks) {
    const { mockFetch } = await import('@/mocks/server')
    return mockFetch({ method: metodo, path: caminho, query, headers, body: rawBody })
  }
  const qs = query.toString()
  return fetch(`${env.apiUrl}${caminho}${qs ? `?${qs}` : ''}`, {
    method: metodo,
    headers,
    body,
    signal,
  })
}

async function request<T>(metodo: Metodo, caminho: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers }
  const token = tokenProvider()
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (opts.body instanceof FormData) {
    body = opts.body
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined) query.set(k, String(v))
  }

  const res = await enviar(metodo, caminho, headers, body, opts.body, query, opts.signal)

  if (!res.ok) {
    let detalhe: { mensagem?: string; detail?: string; codigo?: string; campo?: string } = {}
    try {
      detalhe = await res.json()
    } catch {
      /* resposta sem corpo JSON */
    }
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(
      res.status,
      detalhe.mensagem ?? detalhe.detail ?? 'Não foi possível concluir a operação.',
      detalhe.codigo,
      detalhe.campo,
    )
  }

  if (res.status === 204) return undefined as T
  const tipo = res.headers.get('content-type') ?? ''
  if (!tipo.includes('application/json')) return (await res.blob()) as T

  const dados: unknown = await res.json()
  if (!opts.schema) return dados as T

  const parsed = opts.schema.safeParse(dados)
  if (!parsed.success) {
    console.error(`[api] Resposta fora do contrato em ${metodo} ${caminho}`, parsed.error.issues)
    throw new ApiError(500, 'A resposta do servidor veio num formato inesperado.', 'CONTRATO')
  }
  return parsed.data as T
}

export const api = {
  get: <S extends z.ZodType>(caminho: string, opts?: RequestOptions<S>) =>
    request<z.output<S>>('GET', caminho, opts),
  post: <S extends z.ZodType>(caminho: string, body?: unknown, opts?: RequestOptions<S>) =>
    request<z.output<S>>('POST', caminho, { ...opts, body }),
  put: <S extends z.ZodType>(caminho: string, body?: unknown, opts?: RequestOptions<S>) =>
    request<z.output<S>>('PUT', caminho, { ...opts, body }),
  patch: <S extends z.ZodType>(caminho: string, body?: unknown, opts?: RequestOptions<S>) =>
    request<z.output<S>>('PATCH', caminho, { ...opts, body }),
  delete: <S extends z.ZodType>(caminho: string, opts?: RequestOptions<S>) =>
    request<z.output<S>>('DELETE', caminho, opts),
  /** Baixa um arquivo (XML, PDF) como Blob. */
  arquivo: (caminho: string, opts?: Omit<RequestOptions, 'schema'>) =>
    request<Blob>('GET', caminho, { ...opts, headers: { Accept: '*/*', ...opts?.headers } }),
}
