
import { isTokenValid, decodeJWT } from '~/utils/jwt'
import type { User } from '~/types'

export interface SessionRestorationResult {
  success: boolean
  token?: string
  user?: User
  error?: string
}

export function useSessionManager() {
  const tokenStorage = useTokenStorage()

  async function restoreSession(): Promise<boolean> {
    if (!import.meta.client) {
      console.log('restoreSession: Skipping - running on server')
      return false
    }

    const token = tokenStorage.getStoredToken()
    const user = await tokenStorage.getStoredUser()

    console.log('restoreSession: token exists?', !!token, 'user exists?', !!user)

    if (!token || !user) {
      console.log('restoreSession: No stored auth data')
      return false
    }

    if (!await isTokenValid(token)) {
      console.log('restoreSession: Token invalid or expired, clearing data')
      tokenStorage.clearAuthData()
      return false
    }

    console.log('restoreSession: Token valid, restoring session')

    const authStore = useAuthStore()
    authStore.token = token
    authStore.user = user
    authStore.isAuthenticated = true

    console.log('restoreSession: Reconnecting WebSocket...')
    const asteriskStore = useAsteriskStore()
    asteriskStore.connect(token)

    console.log('✅ Session restored successfully')
    return true
  }

  async function validateSession(): Promise<boolean> {
    if (!import.meta.client) return false

    const token = tokenStorage.getStoredToken()

    if (!token) return false

    return await isTokenValid(token)
  }

  async function isSessionValid(): Promise<boolean> {
    if (!import.meta.client) return false

    if (!tokenStorage.hasStoredAuth()) return false

    const token = tokenStorage.getStoredToken()
    if (!token) return false

    return await isTokenValid(token)
  }

  async function getSessionInfo(): Promise<{ user: User; tokenPayload: any } | null> {
    if (!import.meta.client) return null

    const token = tokenStorage.getStoredToken()
    const user = await tokenStorage.getStoredUser()

    if (!token || !user) return null

    const payload = await decodeJWT(token)
    if (!payload) return null

    return {
      user,
      tokenPayload: payload,
    }
  }


  function clearSession(): void {
    if (!import.meta.client) return
  
    const asteriskStore = useAsteriskStore()
    asteriskStore.disconnect()
    tokenStorage.clearAuthData()
    const authStore = useAuthStore()
    authStore.$reset()
    console.log('✅ Session cleared')
  }

  return {
    restoreSession,
    validateSession,
    isSessionValid,
    getSessionInfo,
    clearSession,
  }
}