import type { User } from '~/types'
import { useCommandExecutor } from '~/composables/utils/useCommandExecutor'

const AUTH_COOKIE_OPTIONS = {
  maxAge: 8 * 60 * 60,
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
}

export function useTokenStorage() {
  const { execute } = useCommandExecutor()

  function saveAuthData(token: string, user: User): void {
    if (!import.meta.client) {
      console.warn('saveAuthData: Skipping - running on server')
      return
    }

    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))

    const tokenCookie = useCookie('auth_token', AUTH_COOKIE_OPTIONS)
    const userCookie = useCookie('auth_user', AUTH_COOKIE_OPTIONS)

    tokenCookie.value = token
    userCookie.value = JSON.stringify(user)

    console.log('✅ Auth data saved to localStorage and cookies')
  }

  function getStoredToken(): string | null {
    if (!import.meta.client) return null
    return localStorage.getItem('auth_token')
  }

  async function getStoredUser(): Promise<User | null> {
    if (!import.meta.client) return null

    const userStr = localStorage.getItem('auth_user')
    if (!userStr) return null

    return await execute({
      action: async () => JSON.parse(userStr) as User,
      showErrorToast: false,
      rethrow: false,
      logPrefix: 'Parse User'
    })
  }

  function clearAuthData(): void {
    if (!import.meta.client) {
      console.warn('clearAuthData: Skipping - running on server')
      return
    }

    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')

    const tokenCookie = useCookie('auth_token')
    const userCookie = useCookie('auth_user')
    tokenCookie.value = null
    userCookie.value = null

    console.log('✅ Auth data cleared from localStorage and cookies')
  }

  function hasStoredAuth(): boolean {
    if (!import.meta.client) return false

    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('auth_user')

    return !!token && !!user
  }

  async function syncToSession(): Promise<void> {
    if (!import.meta.client) return

    const token = getStoredToken()
    const user = await getStoredUser()

    if (token && user) {
      const tokenCookie = useCookie('auth_token', AUTH_COOKIE_OPTIONS)
      const userCookie = useCookie('auth_user', AUTH_COOKIE_OPTIONS)
      tokenCookie.value = token
      userCookie.value = JSON.stringify(user)
      console.log('✅ Auth data synced to session')
    }
  }

  return {
    saveAuthData,
    getStoredToken,
    getStoredUser,
    clearAuthData,
    hasStoredAuth,
    syncToSession,
  }
}