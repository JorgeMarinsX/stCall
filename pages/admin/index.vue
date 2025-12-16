<template>
  <div class="p-6 w-full">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Dashboard Administrativo
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Monitoramento em tempo real dos agentes
        </p>
      </div>

      <Button
        icon="pi pi-refresh"
        label="Atualizar"
        outlined
        @click="refreshData"
        :loading="isRefreshing"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Agentes</p>
              <p class="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {{ agentStore.totalAgents }}
              </p>
            </div>
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <i class="pi pi-users text-2xl text-blue-600 dark:text-blue-300"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Disponíveis</p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                {{ agentStore.availableAgents.length }}
              </p>
            </div>
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <i class="pi pi-check-circle text-2xl text-green-600 dark:text-green-300"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Em Chamada</p>
              <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {{ agentStore.onCallAgents.length }}
              </p>
            </div>
            <div class="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
              <i class="pi pi-phone text-2xl text-orange-600 dark:text-orange-300"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Indisponíveis</p>
              <p class="text-3xl font-bold text-red-600 dark:text-red-400">
                {{ agentStore.unavailableAgents.length }}
              </p>
            </div>
            <div class="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <i class="pi pi-times-circle text-2xl text-red-600 dark:text-red-300"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="mb-6 shadow-sm">
      <template #header>
        <div class="p-4 border-b dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <i class="pi pi-chart-line mr-2 text-orange-600"></i>
            Estatísticas de Hoje
          </h2>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Total de Chamadas</p>
            <p class="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {{ callStore.todaysCalls }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">desde 00:00</p>
          </div>

          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Duração Média</p>
            <p class="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {{ formatDuration(callStore.averageCallDuration) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">minutos</p>
          </div>

          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Chamadas Ativas</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">
              {{ activeCallsCount }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">neste momento</p>
          </div>
        </div>
      </template>
    </Card>

    <Card class="shadow-sm">
      <template #header>
        <div class="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <i class="pi pi-users mr-2 text-orange-600"></i>
            Status dos Agentes
          </h2>

          <SelectButton
            v-model="statusFilter"
            :options="statusFilterOptions"
            optionLabel="label"
            optionValue="value"
            multiple
          />
        </div>
      </template>
      <template #content>
        <div v-if="filteredAgents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="agent in filteredAgents"
            :key="agent.id"
            class="shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <template #content>
              <div class="flex items-start gap-4">
                <div class="relative">
                  <Avatar
                    :image="agent.avatar"
                    :label="agent.name.charAt(0).toUpperCase()"
                    shape="circle"
                    size="large"
                    class="bg-orange-600 text-white"
                  />
                  <span
                    class="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
                    :class="getStatusDotColor(agent.status)"
                  ></span>
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1 truncate">
                    {{ agent.name }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Ramal {{ agent.extension }}
                  </p>

                  <Tag
                    :value="getStatusLabel(agent.status)"
                    :severity="getStatusSeverity(agent.status)"
                    class="mb-2"
                  />

                  <div v-if="agent.activeCall" class="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-700 dark:text-gray-300">
                        <i class="pi pi-phone text-orange-600 mr-1"></i>
                        {{ agent.activeCall.number }}
                      </span>
                      <span class="font-mono text-orange-600 dark:text-orange-400 font-semibold">
                        {{ formatCallDuration(agent.activeCall.startTime) }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 mt-2">
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="agent.isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"
                    ></span>
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                      {{ agent.isConnected ? 'Conectado' : 'Desconectado' }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <div v-else class="text-center py-12">
          <i class="pi pi-users text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p class="text-gray-600 dark:text-gray-400 mb-2">Nenhum agente encontrado</p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            Ajuste os filtros ou aguarde agentes se conectarem
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Agent } from '~/types/agent'

// Page metadata
definePageMeta({
  middleware: ['admin'],
  layout: 'default',
})

// Page title
useHead({
  title: 'Dashboard Admin - stCall',
})

// Composables
const agentStore = useAgentStore()
const callStore = useCallStore()
const { execute } = useCommandExecutor()
const { formatDuration } = useCallFormatters()

// State
const isRefreshing = ref(false)
const statusFilter = ref<string[]>(['available', 'on-call', 'unavailable', 'offline'])
const updateInterval = ref<NodeJS.Timeout | null>(null)

// Status filter options
const statusFilterOptions = [
  { label: 'Disponível', value: 'available' },
  { label: 'Em Chamada', value: 'on-call' },
  { label: 'Indisponível', value: 'unavailable' },
  { label: 'Offline', value: 'offline' },
]

// Computed
const filteredAgents = computed(() => {
  return agentStore.agents.filter(agent => {
    return statusFilter.value.includes(agent.status)
  })
})

const activeCallsCount = computed(() => {
  return agentStore.agents.filter(agent => agent.activeCall).length
})

// Methods
async function refreshData() {
  isRefreshing.value = true

  await execute({
    action: () => agentStore.fetchAllAgents(),
    successMessage: 'Dados atualizados com sucesso',
    errorMessage: 'Falha ao atualizar dados',
    logPrefix: 'AdminDashboard:Refresh',
    onSuccess: () => {
      isRefreshing.value = false
    },
    onError: () => {
      isRefreshing.value = false
    },
    rethrow: false,
  })
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponível',
    'on-call': 'Em Chamada',
    unavailable: 'Indisponível',
    offline: 'Offline',
  }
  return labels[status] || status
}

function getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
  const severities: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
    available: 'success',
    'on-call': 'warn',
    unavailable: 'danger',
    offline: 'secondary',
  }
  return severities[status] || 'secondary'
}

function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-green-500',
    'on-call': 'bg-orange-500',
    unavailable: 'bg-red-500',
    offline: 'bg-gray-400',
  }
  return colors[status] || 'bg-gray-400'
}

function formatCallDuration(startTime: Date): string {
  const now = new Date()
  const duration = Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000)
  return formatDuration(duration)
}

// Lifecycle
onMounted(async () => {
  // Initial data load
  await execute({
    action: () => agentStore.fetchAllAgents(),
    errorMessage: 'Falha ao carregar dados iniciais',
    logPrefix: 'AdminDashboard:Mount',
    showSuccessToast: false,
    rethrow: false,
  })

  // Auto-refresh every 10 seconds
  updateInterval.value = setInterval(() => {
    agentStore.fetchAllAgents()
  }, 10000)
})

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
