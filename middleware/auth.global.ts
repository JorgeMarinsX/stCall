export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side where localStorage is available
  if (!import.meta.client) {
    return
  }

  const authStore = useAuthStore()
  const uiStore = useUiStore()


  uiStore.loadBasicPreferences()

  // Public routes that don't require authentication
  const publicRoutes = ['/login']

  if (publicRoutes.includes(to.path)) {
    // If already authenticated, redirect to dashboard
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  // Protected routes - check authentication
  await authStore.checkAuth()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Load full user-specific preferences for authenticated users
  if (!uiStore.isInitialized) {
    uiStore.initializeAuthenticated()
  }
})
