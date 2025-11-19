
<template>
    <aside class="w-22 h-screen flex flex-col items-center justify-between py-4 px-2 bg-white border-r">
        <div class="flex flex-col items-center gap-2" role="navigation" aria-label="Main navigation">
            <Avatar image="/avatar.png" alt="User avatar" class="w-14 h-14" size="large">
                <template #label>JS</template>
            </Avatar>
            <div class="text-sm text-gray-700">João Silva</div>
        </div>

        <nav class="flex flex-col gap-3 items-center">
            <NuxtLink
                v-for="item in navItems"
                :key="item.key"
                :to="item.route"
                custom
                v-slot="{ href, navigate, isActive }"
            >
                <a :href="href" @click="navigate" :title="item.label" class="flex flex-col items-center no-underline text-gray-700">
                    <Button
                        :icon="item.icon"
                        class="w-12 h-12 flex items-center justify-center rounded-lg"
                        :class="isActive ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'"
                        text
                    />
                    <span class="text-xs text-gray-500 mt-1">{{ item.label }}</span>
                </a>
            </NuxtLink>
        </nav>

        <footer class="pb-2">
            <NuxtLink to="/login" class="text-gray-600 hover:text-gray-800">
                <i class="pi pi-sign-out text-xl"></i>
            </NuxtLink>
        </footer>
    </aside>
</template>

<script setup>
import { ref } from 'vue';

const navItems = ref([
    { key: 'profile', label: 'Profile', icon: 'pi pi-user', route: '/profile' },
    { key: 'call', label: 'Call', icon: 'pi pi-phone', route: '/call' },
    { key: 'history', label: 'History', icon: 'pi pi-history', route: '/history' }
]);
</script>



