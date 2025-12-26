<template>
  <div class="p-4 hover:surface-hover transition-colors cursor-pointer">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4 flex-1">
        <!-- Call Direction Avatar -->
        <Avatar
          :icon="direction === 'inbound' ? 'pi pi-phone' : 'pi pi-arrow-up-right'"
          :style="{
            backgroundColor: direction === 'inbound' ? 'var(--p-green-100)' : 'var(--p-blue-100)',
            color: direction === 'inbound' ? 'var(--p-green-600)' : 'var(--p-blue-600)'
          }"
          size="large"
          shape="circle"
        />

        <!-- Call Info -->
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium">
              {{ callerName || 'Desconhecido' }}
            </span>
            <Tag
              :value="statusLabel"
              :severity="statusSeverity"
              size="small"
            />
          </div>
          <div class="text-sm text-muted-color">
            {{ number }}
          </div>
        </div>

        <!-- Duration & Time -->
        <div class="text-right">
          <div class="text-sm font-medium">
            {{ duration > 0 ? formattedDuration : '-' }}
          </div>
          <div class="text-xs text-muted-color mt-1">
            {{ formattedTime }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CallDirection } from '~/types'

const props = defineProps<{
  direction: CallDirection
  callerName?: string
  number: string
  status: 'completed' | 'missed' | 'rejected' | 'abandoned' | 'queued'
  duration: number
  timestamp: Date
}>()

// Computed properties
const statusLabel = computed(() => {
  switch (props.status) {
    case 'completed': return 'Completada'
    case 'missed': return 'Perdida'
    case 'rejected': return 'Rejeitada'
    case 'abandoned': return 'Abandonada'
    case 'queued': return 'Na fila'
    default: return props.status
  }
})

const statusSeverity = computed(() => {
  switch (props.status) {
    case 'completed': return 'success'
    case 'missed': return 'danger'
    case 'rejected': return 'secondary'
    case 'abandoned': return 'warn'
    case 'queued': return 'secondary'
    default: return 'info'
  }
})

const formattedDuration = computed(() => {
  if (props.duration === 0) return '0:00'
  const mins = Math.floor(props.duration / 60)
  const secs = props.duration % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

const formattedTime = computed(() => {
  const now = new Date()
  const diffMs = now.getTime() - props.timestamp.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`

  return props.timestamp.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<style scoped>
.hover\:surface-hover:hover {
  background-color: var(--p-content-hover-background);
}
</style>
