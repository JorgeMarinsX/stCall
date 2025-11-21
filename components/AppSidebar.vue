
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
            <NuxtLink to="/login" class="text-primary-600 hover:text-primary-800">
                <i class="pi pi-sign-out text-xl"></i>
            </NuxtLink>
        </footer>
    </aside>
</template>

<script setup>
import { ref } from 'vue';

const navItems = ref([
    { key: 'dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/' },
    { key: 'profile', label: 'Perfil', icon: 'pi pi-user', route: '/profile' },
    { key: 'call', label: 'Chamadas', icon: 'pi pi-phone', route: '/call' },
    { key: 'history', label: 'Histórico', icon: 'pi pi-history', route: '/history' },
    { key: 'settings', label: 'Configurações', icon: 'pi pi-cog', route: '/settings' }

]);
</script>



