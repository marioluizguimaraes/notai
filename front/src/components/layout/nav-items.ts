import {
  Calculator,
  FileText,
  HelpCircle,
  LayoutGrid,
  Landmark,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  rotulo: string
  rota: string
  icone: LucideIcon
  /** Tela já existe? As demais mostram "em breve". */
  pronta?: boolean
  /** Fica ativo também nas sub-rotas (ex.: /notas/nova, /notas/:id). */
  incluiSubrotas?: boolean
}

export interface NavGrupo {
  titulo: string
  itens: NavItem[]
}

export const NAV: NavGrupo[] = [
  {
    titulo: 'Menu',
    itens: [
      { rotulo: 'Painel', rota: '/', icone: LayoutGrid, pronta: true },
      // Status, criação e detalhes ficam dentro da tela de notas.
      { rotulo: 'Notas', rota: '/notas', icone: FileText, pronta: true, incluiSubrotas: true },
      { rotulo: 'Clientes', rota: '/clientes', icone: Users },
      { rotulo: 'Serviços', rota: '/servicos', icone: Package },
    ],
  },
  {
    titulo: 'Fiscal',
    itens: [
      { rotulo: 'Tributos', rota: '/tributos', icone: Landmark },
      { rotulo: 'Simulador', rota: '/simulador', icone: Calculator },
    ],
  },
  {
    titulo: 'Geral',
    itens: [
      { rotulo: 'Configurações', rota: '/configuracoes', icone: Settings },
      { rotulo: 'Ajuda', rota: '/ajuda', icone: HelpCircle },
    ],
  },
]
