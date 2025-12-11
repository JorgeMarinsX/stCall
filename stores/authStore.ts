import { defineStore } from 'pinia'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    token: null as string | null,
    lastError: null as string | null,
    isHydrating: true, 
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'supervisor',
    isAgent: (state) => state.user?.role === 'agent',
    userName: (state) => state.user?.name || 'Guest',
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      const authAPI = useAuthAPI()
      const tokenStorage = useTokenStorage()
      const asteriskStore = useAsteriskStore()
      const { execute } = useCommandExecutor()

      this.lastError = null

      const result = await execute({
        action: async () => {
          const response = await authAPI.login(email, password)

          this.token = response.token
          this.user = response.user
          this.isAuthenticated = true

          tokenStorage.saveAuthData(response.token, response.user)

          asteriskStore.connect(response.token)

          this.isHydrating = false

          return response
        },
        successMessage: {
          title: 'Login realizado',
          detail: `Bem-vindo, ${email}!`,
        },
        errorMessage: 'Falha ao fazer login',
        logPrefix: 'Auth:Login',
        showSuccessToast: true,
        showErrorToast: true,
        rethrow: false,
        errorMessageExtractor: (error) => {
          if (error.message) return error.message
          if (error.data?.error) return error.data.error
          return 'Erro ao conectar ao servidor'
        },
        onError: (error: any) => {
          this.lastError = error.message || 'Erro ao fazer login'
        },
      })

      return !!result
    },


    async logout() {
      const sessionManager = useSessionManager()

      sessionManager.clearSession()

      this.$reset()

      console.log('✅ Logout complete')
    },

    async checkAuth() {
      const sessionManager = useSessionManager()

      const restored = await sessionManager.restoreSession()

      this.isHydrating = false

      return restored
    },

    setUser(user: User) {
      this.user = user
      this.isAuthenticated = true
    },
  },
})