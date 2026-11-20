import { useQuery } from '@tanstack/react-query'
import { servicosApi } from '../api/servicos'

export function useServicos() {
  return useQuery({ queryKey: ['servicos'], queryFn: servicosApi.listar })
}
