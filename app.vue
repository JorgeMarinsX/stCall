<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toast position="bottom-right"/>
</template>

<script setup>
// Register toast service immediately when app.vue sets up
const { globalToast } = useGlobalToast()
const toast = useToast()

if (toast) {
  globalToast.register(toast)
}

// Cleanup on unmount
onUnmounted(() => {
  globalToast.unregister()
})
</script>