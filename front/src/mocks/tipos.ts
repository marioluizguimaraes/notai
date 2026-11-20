export interface MockRequest {
  method: string
  path: string
  query: URLSearchParams
  headers: Record<string, string>
  body: unknown
  params: Record<string, string>
}

export interface MockResponse {
  status: number
  body?: unknown
  /** Resposta não-JSON (XML, PDF). */
  arquivo?: { conteudo: string; tipo: string }
  /** Atraso extra para simular operações demoradas (ex.: envio ao governo). */
  atrasoExtra?: number
}

export type Handler = (req: MockRequest) => MockResponse

export const ok = (body: unknown): MockResponse => ({ status: 200, body })
export const erro = (
  status: number,
  detail: string,
  codigo?: string,
  campo?: string,
): MockResponse => ({
  status,
  body: { detail, codigo, campo },
})
