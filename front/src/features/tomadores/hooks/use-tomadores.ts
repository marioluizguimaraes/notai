import { useQuery } from '@tanstack/react-query'
import { tomadoresApi } from '../api/tomadores'

export function useTomadores() {
  return useQuery({ queryKey: ['tomadores'], queryFn: () => tomadoresApi.listar() })
}
