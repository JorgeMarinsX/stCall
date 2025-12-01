<template>
  <div class="p-6 h-full overflow-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-semibold">
        Bem-vindo, {{ authStore.userName }}
      </h1>
      <p class="text-muted-color mt-1">
        Seu painel de controle e estatísticas
      </p>
    </div>

    <!-- Statistics Cards -->
    <div class="grid mb-6">
      <div class="col-12 md:col-6 lg:col-3">
        <StatCard
          title="Chamadas Hoje"
          :value="callStore.todaysCalls"
          :subtitle="formatDate(new Date())"
          icon="pi-phone"
          icon-color="text-primary"
        />
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <StatCard
          title="Chamadas Atendidas"
          :value="callStore.totalCompletedCalls"
          subtitle="Total histórico"
          icon="pi-check-circle"
          icon-color="text-green-500"
        />
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <StatCard
          title="Chamadas Perdidas"
          :value="callStore.totalMissedCalls"
          subtitle="Total histórico"
          icon="pi-times-circle"
          icon-color="text-red-500"
        />
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <StatCard
          title="Duração Média"
          :value="formatDuration(callStore.averageCallDuration)"
          subtitle="Por chamada"
          icon="pi-clock"
          icon-color="text-blue-500"
        />
      </div>
    </div>

    <!-- Recent Calls Section -->
    <Card>
      <template #title>
        <div class="flex align-items-center justify-content-between">
          <span>Chamadas Recentes</span>
          <NuxtLink
            to="/history"
            class="text-primary text-sm font-medium flex align-items-center gap-1 no-underline"
          >
            Ver todas
            <i class="pi pi-arrow-right text-xs"></i>
          </NuxtLink>
        </div>
      </template>

      <template #content>
        <Divider class="mt-0" />

        <div v-if="callStore.recentCalls.length > 0" class="flex flex-column">
          <RecentCallItem
            v-for="call in callStore.recentCalls"
            :key="call.id"
            :direction="call.direction"
            :caller-name="call.callerName"
            :number="call.number"
            :status="call.status"
            :duration="call.duration"
            :timestamp="call.timestamp"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <i class="pi pi-phone text-6xl text-muted-color mb-3"></i>
          <p class="text-muted-color">
            Nenhuma chamada registrada ainda
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import { useCallStore } from '~/stores/callStore'

useHead({
  title: 'stCall - Dashboard',
})

const authStore = useAuthStore()
const callStore = useCallStore()

// Helper function to format duration in seconds to MM:SS
const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Helper function to format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}
</script>
