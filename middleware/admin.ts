export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client-side after hydration
  if (import.meta.server) return

  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    console.warn('⚠️ Admin middleware: User not authenticated, redirecting to login')
    return navigateTo('/login')
  }

  if (!authStore.isAdmin) {
    console.warn('⚠️ Admin middleware: User lacks admin privileges, redirecting to dashboard')

    const toast = useToast()
    toast.add({
      severity: 'error',
      summary: 'Acesso Negado',
      detail: 'Você não tem permissão para acessar esta página',
      life: 5000,
    })

    return navigateTo('/')
  }

})
