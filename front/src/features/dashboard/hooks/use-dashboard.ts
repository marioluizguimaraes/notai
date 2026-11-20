import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'

export const dashboardKeys = {
  resumo: ['dashboard', 'resumo'] as const,
  atividade: ['dashboard', 'atividade'] as const,
}

export function useResumoDashboard() {
  return useQuery({ queryKey: dashboardKeys.resumo, queryFn: dashboardApi.resumo })
}

export function useAtividade() {
  return useQuery({ queryKey: dashboardKeys.atividade, queryFn: dashboardApi.atividade })
}
