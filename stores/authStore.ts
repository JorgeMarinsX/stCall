import { defineStore } from 'pinia'

export interface User {
  id: string
  name: string
  email: string
  role: 'agent' | 'admin'
  avatar?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    token: null as string | null,
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isAgent: (state) => state.user?.role === 'agent',
    userName: (state) => state.user?.name || 'Guest',
  },

  actions: {
    async login(email: string, password: string) {
      // TODO: Implement Asterisk authentication
      // For now, mock authentication
      console.log('Login attempt:', email)

      // Mock user data - replace with real Asterisk auth
      this.user = {
        id: '1',
        name: 'Fulano da Silva',
        email,
        role: 'agent',
      }
      this.isAuthenticated = true
      this.token = 'mock-jwt-token'

      // Store token in localStorage
      if (import.meta.client) {
        localStorage.setItem('auth_token', this.token)
      }
    },

    async logout() {
      this.user = null
      this.isAuthenticated = false
      this.token = null

      if (import.meta.client) {
        localStorage.removeItem('auth_token')
      }
    },

    async checkAuth() {
      // Check if user is already authenticated
      if (import.meta.client) {
        const token = localStorage.getItem('auth_token')
        if (token) {
          // TODO: Validate token with Asterisk
          this.token = token
          this.isAuthenticated = true
          // TODO: Fetch user data from Asterisk
          this.user = {
            id: '1',
            name: 'Fulano da Silva',
            email: 'user@example.com',
            role: 'agent',
          }
        }
      }
    },

    setUser(user: User) {
      this.user = user
      this.isAuthenticated = true
    },
  },
})
