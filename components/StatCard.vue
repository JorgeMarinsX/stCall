<template>
  <Card>
    <template #content>
      <div class="flex items-center justify-between mb-2">
        <span class="text-muted-color text-sm font-medium">
          {{ title }}
        </span>
        <i v-if="icon" :class="['pi', icon, 'text-xl', iconColor]"></i>
      </div>
      <div class="text-3xl font-bold">
        {{ value }}
      </div>
      <p v-if="subtitle" class="text-xs text-muted-color mt-2">
        {{ subtitle }}
      </p>
    </template>
  </Card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  iconColor?: string
}>()
</script>
