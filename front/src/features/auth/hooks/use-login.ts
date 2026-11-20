import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import type { LoginForm } from '../schemas/auth'
import { sessao } from '../session'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cnpj, senha }: LoginForm) => authApi.login(cnpj, senha),
    onSuccess: (resposta, { lembrar }) => {
      queryClient.clear()
      sessao.iniciar({ token: resposta.access_token, usuario: resposta.usuario }, lembrar)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    sessao.encerrar()
    queryClient.clear()
  }
}
