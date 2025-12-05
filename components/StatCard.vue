<template>
  <Card class="m-5 w-100 flex flex-grow">
    <template #content>
      <div class="flex items-center justify-between">
        <span class="text-muted-color text-sm font-medium">
          {{ title }}
        </span>
        <i v-if="icon" :class="['pi', icon, 'text-xl', iconColor, 'ml-5']"></i>
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
interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  iconColor?: string
}

defineProps<Props>()
</script>
