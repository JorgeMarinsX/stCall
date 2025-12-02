<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toast position="bottom-right"/>
</template>

<script setup>
// Store initialization is now handled by middleware/auth.global.ts
// This keeps app.vue clean and moves auth logic to route guards
</script>