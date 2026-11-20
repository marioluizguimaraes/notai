import { useQuery } from '@tanstack/react-query'
import { empresasApi } from '../api/empresas'

export const empresaKeys = { atual: ['empresas', 'atual'] as const }

export function useEmpresaAtual() {
  return useQuery({ queryKey: empresaKeys.atual, queryFn: empresasApi.atual })
}
