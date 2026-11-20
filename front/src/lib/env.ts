export const env = {
  /** Base da API FastAPI. Em dev o Vite faz proxy de /api para localhost:8000. */
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  /**
   * Usa os JSONs de `src/mocks/data` no lugar da API real.
   * Ligado por padrão enquanto o backend não existe; defina VITE_USE_MOCKS=false para desligar.
   */
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false',
} as const
