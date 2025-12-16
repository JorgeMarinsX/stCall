
<template>
    <aside class="w-22 h-screen flex flex-col items-center justify-between py-4 px-2 border-r">
        <nav class="flex flex-col gap-3 items-center">
            <NuxtLink
                v-for="item in navItems"
                :key="item.key"
                :to="item.route"
                custom
                v-slot="{ href, navigate, isActive }"
            >
                <a :href="href" @click="navigate" :title="item.label" class="flex flex-col items-center no-underline text-primary-700">
                    <Button
                        :icon="item.icon"
                        class="w-12 h-12 flex items-center justify-center rounded-lg text-primary-500"
                        :class="isActive ? 'bg-primary-300 text-primary-50' : 'hover:bg-primary-100'"
                        text
                    />
                    <span class="text-xs text-primary-400 mt-1">{{ item.label }}</span>
                </a>
            </NuxtLink>
        </nav>

        <footer class="pb-2">
            <button @click="logout" class="text-primary-600 hover:text-primary-800 cursor-pointer bg-transparent border-0" title="Sair">
                <i class="pi pi-sign-out text-xl"></i>
            </button>
        </footer>
    </aside>
</template>

<script setup>
import { computed } from 'vue'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const logout = async () => {
    try {
        await authStore.logout()

        toast.add({
            severity: 'info',
            summary: 'Logout realizado',
            detail: 'Você saiu do sistema com sucesso',
            life: 3000
        })

        router.push('/login')
    } catch (error) {
        console.error('Logout error:', error)
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao fazer logout',
            life: 3000
        })
    }
}

const allNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'pi pi-gauge', route: '/', roles: ['agent', 'admin', 'supervisor'] },
    { key: 'admin-dashboard', label: 'Admin', icon: 'pi pi-chart-line', route: '/admin', roles: ['admin', 'supervisor'] },
    { key: 'analytics', label: 'Analytics', icon: 'pi pi-chart-bar', route: '/admin/analytics', roles: ['admin', 'supervisor'] },
    { key: 'agents', label: 'Agentes', icon: 'pi pi-users', route: '/agents', roles: ['admin', 'supervisor'] },
    { key: 'call', label: 'Chamadas', icon: 'pi pi-phone', route: '/call', roles: ['agent', 'admin', 'supervisor'] },
    { key: 'history', label: 'Histórico', icon: 'pi pi-history', route: '/history', roles: ['agent', 'admin', 'supervisor'] },
    { key: 'profile', label: 'Perfil', icon: 'pi pi-user', route: '/profile', roles: ['agent', 'admin', 'supervisor'] },
    { key: 'settings', label: 'Config', icon: 'pi pi-cog', route: '/settings', roles: ['agent', 'admin', 'supervisor'] }
]

// Filter nav items based on user role
const navItems = computed(() => {
    const userRole = authStore.user?.role || 'agent'
    return allNavItems.filter(item => item.roles.includes(userRole))
})
</script>



