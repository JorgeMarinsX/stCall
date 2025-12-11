import type { LoginResponse, User } from '~/types'
import { useCommandExecutor } from '~/composables/utils/useCommandExecutor'

export interface AuthAPIError {
  message: string
  statusCode?: number
  originalError?: any
}

export function useAuthAPI() {
  const config = useRuntimeConfig()
  const { execute } = useCommandExecutor()

  function getServerUrl(): string {
    return config.public.wsUrl
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
  }

  function parseError(error: any): string {
    if (error.data?.error) return error.data.error
    if (error.statusMessage) return error.statusMessage
    if (error.message) return error.message
    return 'Erro ao conectar ao servidor'
  }

  async function login(email: string, password: string): Promise<LoginResponse> {
    const loginUrl = `${getServerUrl()}/auth/login`
    console.log('Authenticating with WebSocket server:', loginUrl)

    return await execute({
      action: async () => {
        const response = await $fetch<LoginResponse>(loginUrl, {
          method: 'POST',
          body: { email, password },
        })
        if (!response.success || !response.token) {
          throw new Error('Resposta de autenticação inválida')
        }
        return response
      },
      errorMessageExtractor: parseError,
      logPrefix: 'Login',
      rethrow: true
    }) as LoginResponse
  }

  async function logout(): Promise<void> {
    console.log('Logout completed (client-side only)')
  }

  async function refreshToken(token: string): Promise<string> {
    const refreshUrl = `${getServerUrl()}/auth/refresh`

    return await execute({
      action: async () => {
        const response = await $fetch<{ token: string }>(refreshUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        return response.token
      },
      errorMessageExtractor: parseError,
      logPrefix: 'Token Refresh',
      rethrow: true
    }) as string
  }

  async function verifyToken(token: string): Promise<boolean> {
    const verifyUrl = `${getServerUrl()}/auth/verify`

    return await execute({
      action: async () => {
        await $fetch(verifyUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        return true
      },
      errorMessageExtractor: parseError,
      logPrefix: 'Token Verification',
      showErrorToast: false,
      rethrow: false
    }) || false
  }

  return {
    login,
    logout,
    refreshToken,
    verifyToken,
    parseError,
  }
}