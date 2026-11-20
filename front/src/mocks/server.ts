/**
 * Servidor de mock: responde às mesmas rotas que a API FastAPI vai expor,
 * usando os JSONs de `./data` (carregados em `./db`, com estado em memória).
 * O `lib/api.ts` usa este módulo quando `env.useMocks` está ligado. Ao
 * conectar a API real, basta definir VITE_USE_MOCKS=false; nenhuma tela muda.
 */
import atividade from './data/atividade.json'
import authLogin from './data/auth-login.json'
import dashboardResumo from './data/dashboard-resumo.json'
import { db, salvarDb } from './db'
import { rotasNotas } from './rotas/notas'
import { erro, ok, type Handler, type MockRequest, type MockResponse } from './tipos'

export type { MockRequest, MockResponse }

const naoAutorizado = erro(401, 'Sessão expirada. Entre novamente.', 'NAO_AUTENTICADO')

/** Rotas públicas (sem token). As demais exigem `Authorization: Bearer`. */
const publicas = new Set(['POST /auth/login'])

const rotas: Record<string, Handler> = {
  'POST /auth/login': ({ body }) => {
    const { cnpj, senha } = (body ?? {}) as { cnpj?: string; senha?: string }
    const demo = authLogin.credenciais_demo
    if (cnpj?.replace(/\D/g, '') === demo.cnpj && senha === demo.senha)
      return ok(authLogin.resposta)
    return { status: 401, body: authLogin.erro }
  },
  'GET /auth/me': () => ok(authLogin.resposta.usuario),
  'GET /empresas/atual': () => ok(db.empresa),
  'GET /dashboard/resumo': () => ok(dashboardResumo),
  'GET /dashboard/atividade': () => ok(atividade),
  'GET /tomadores': ({ query }) => {
    const b = (query.get('busca') ?? '').toLowerCase()
    return ok({
      itens: db.tomadores.filter(
        (t) => !b || t.nome.toLowerCase().includes(b) || t.documento.includes(b),
      ),
    })
  },
  'GET /servicos': () => ok({ itens: db.servicos }),
  ...rotasNotas,
}

/** Casa "GET /notas/:id" com "GET /notas/nfs_013". Rotas exatas têm prioridade. */
function encontrar(
  method: string,
  path: string,
): { chave: string; handler: Handler; params: Record<string, string> } | null {
  const exata = `${method} ${path}`
  if (rotas[exata]) return { chave: exata, handler: rotas[exata], params: {} }
  const partes = path.split('/')
  for (const [chave, handler] of Object.entries(rotas)) {
    const [m, p] = chave.split(' ')
    if (m !== method || !p.includes(':')) continue
    const modelo = p.split('/')
    if (modelo.length !== partes.length) continue
    const params: Record<string, string> = {}
    if (
      modelo.every((seg, i) =>
        seg.startsWith(':')
          ? ((params[seg.slice(1)] = decodeURIComponent(partes[i])), true)
          : seg === partes[i],
      )
    )
      return { chave, handler, params }
  }
  return null
}

const atraso = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function mockFetch(req: Omit<MockRequest, 'params'>): Promise<Response> {
  await atraso(250 + Math.random() * 350)

  const rota = encontrar(req.method, req.path)
  let res: MockResponse
  if (!rota) res = erro(404, `Rota de mock não encontrada: ${req.method} ${req.path}`)
  else if (!publicas.has(rota.chave) && !req.headers.Authorization?.startsWith('Bearer '))
    res = naoAutorizado
  else res = rota.handler({ ...req, params: rota.params })

  if (res.atrasoExtra) await atraso(res.atrasoExtra)
  if (req.method !== 'GET' && res.status < 400) salvarDb()

  if (res.arquivo) {
    return new Response(res.arquivo.conteudo, {
      status: res.status,
      headers: { 'Content-Type': res.arquivo.tipo },
    })
  }
  if (res.status === 204 || res.body === undefined)
    return new Response(null, { status: res.status })
  // structuredClone garante que ninguém altere o "banco" por referência.
  return new Response(JSON.stringify(structuredClone(res.body)), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
