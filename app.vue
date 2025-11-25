<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '~/stores/authStore';

const authStore = useAuthStore();

// Initialize auth on app startup
onMounted(() => {
  authStore.checkAuth();
});
</script>