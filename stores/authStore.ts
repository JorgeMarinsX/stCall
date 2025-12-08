import { defineStore } from 'pinia'
import type { User, LoginResponse } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    token: null as string | null,
    lastError: null as string | null,
    isHydrating: true, // Track hydration state to prevent SSR mismatch
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'supervisor',
    isAgent: (state) => state.user?.role === 'agent',
    userName: (state) => state.user?.name || 'Guest',
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      try {
        this.lastError = null

        // Get WebSocket server URL from runtime config
        const config = useRuntimeConfig()
        const wsServerUrl = config.public.wsUrl.replace('ws://', 'http://').replace('wss://', 'https://')
        const loginUrl = `${wsServerUrl}/auth/login`

        console.log('Authenticating with WebSocket server:', loginUrl)

        // Call authentication endpoint on WebSocket server
        const response = await $fetch<LoginResponse>(loginUrl, {
          method: 'POST',
          body: { email, password }
        })

        if (!response.success || !response.token) {
          this.lastError = 'Resposta de autenticação inválida'
          return false
        }

        // Store JWT token
        this.token = response.token
        this.user = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          extension: response.user.extension
        }
        this.isAuthenticated = true

        // Persist to both localStorage AND cookies
        if (import.meta.client) {
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('auth_user', JSON.stringify(this.user))

          // Also set cookies for SSR checks
          const tokenCookie = useCookie('auth_token', {
            maxAge: 8 * 60 * 60,
            secure: import.meta.env.PROD,
            sameSite: 'lax'
          })
          const userCookie = useCookie('auth_user', {
            maxAge: 8 * 60 * 60,
            secure: import.meta.env.PROD,
            sameSite: 'lax'
          })
          tokenCookie.value = response.token
          userCookie.value = JSON.stringify(this.user)
        }

        // Initialize WebSocket connection with JWT token
        const asteriskStore = useAsteriskStore()
        asteriskStore.connect(response.token)

        // Mark hydration as complete on successful login
        this.isHydrating = false

        return true

      } catch (error: any) {
        console.error('Login failed:', error)

        // Extract error message
        if (error.data?.error) {
          this.lastError = error.data.error
        } else if (error.statusMessage) {
          this.lastError = error.statusMessage
        } else if (error.message) {
          this.lastError = error.message
        } else {
          this.lastError = 'Erro ao conectar ao servidor'
        }

        return false
      }
    },

    async logout() {
      // Disconnect WebSocket before clearing state
      const asteriskStore = useAsteriskStore()
      asteriskStore.disconnect()

      // Clear user state
      this.user = null
      this.isAuthenticated = false
      this.token = null
      this.lastError = null
      this.isHydrating = false

      // Clear localStorage and cookies
      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')

        // Clear cookies too
        const tokenCookie = useCookie('auth_token')
        const userCookie = useCookie('auth_user')
        tokenCookie.value = null
        userCookie.value = null
      }
    },

    async checkAuth() {
      // Only run on client side
      if (!import.meta.client) {
        console.log('checkAuth: Skipping - running on server')
        return
      }

      // Read from localStorage (primary storage)
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('auth_user')

      console.log('checkAuth: token exists?', !!token, 'user exists?', !!userStr)

      if (!token || !userStr) {
        console.log('checkAuth: No stored auth data, setting isAuthenticated = false')
        this.isAuthenticated = false
        this.isHydrating = false
        return
      }

      try {
        // Decode JWT to check expiration (basic validation)
        const payload = this.decodeJWT(token)

        if (!payload || !payload.exp) {
          // Invalid token format
          this.logout()
          return
        }

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp < now) {
          // Token expired
          console.log('checkAuth: Token expired, logging out')
          this.logout()
          return
        }

        // Token is valid, restore session
        console.log('checkAuth: Token valid, restoring session')
        this.token = token
        this.isAuthenticated = true

        // Restore full user data
        this.user = JSON.parse(userStr as string)
        console.log('checkAuth: User restored:', this.user?.name, this.user?.email)

        // Reconnect WebSocket (only on client side)
        if (import.meta.client) {
          console.log('checkAuth: Reconnecting WebSocket...')
          const asteriskStore = useAsteriskStore()
          asteriskStore.connect(token)
        }

        // Mark hydration as complete
        this.isHydrating = false

      } catch (error) {
        console.error('Token validation failed:', error)
        this.logout()
        this.isHydrating = false
      }
    },

    decodeJWT(token: string): any {
      try {
        // Decode JWT payload (basic decode, no signature verification)
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const payload = JSON.parse(atob(parts[1]))
        return payload
      } catch (error) {
        console.error('Failed to decode JWT:', error)
        return null
      }
    },

    setUser(user: User) {
      this.user = user
      this.isAuthenticated = true
    },
  },
})
