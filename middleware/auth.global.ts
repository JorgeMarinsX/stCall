export default defineNuxtRouteMiddleware(async (to, from) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(to.path)

  // Get auth token from cookie (works on both server and client)
  const tokenCookie = useCookie('auth_token')
  const hasToken = !!tokenCookie.value

  // SERVER-SIDE: Check cookie and block immediately if no token
  if (import.meta.server) {
    if (!isPublicRoute && !hasToken) {
      // No token found - redirect to login before SSR
      return navigateTo('/login')
    }
    // Token found or public route - allow SSR to proceed
    return
  }

  // CLIENT-SIDE: Full authentication check
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  // Load basic UI preferences
  uiStore.loadBasicPreferences()

  if (isPublicRoute) {
    // If already authenticated and trying to access login, redirect to dashboard
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  // Protected routes - check authentication (validates token expiration)
  // Only check if not already authenticated (avoids re-checking on every navigation)
  if (!authStore.isAuthenticated) {
    await authStore.checkAuth()
  }

  if (!authStore.isAuthenticated) {
    // Not authenticated - redirect to login
    console.log('Middleware: Not authenticated, redirecting to login')
    return navigateTo('/login')
  }

  // Authenticated - allow access and load user preferences
  if (!uiStore.isInitialized) {
    uiStore.initializeAuthenticated()
  }
})
