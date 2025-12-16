<template>
  <div class="p-6 w-full">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Análise de Desempenho
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Métricas detalhadas de desempenho por agente
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Select
          v-model="selectedPeriod"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Período"
          class="w-48"
        />
        <Button
          icon="pi pi-refresh"
          label="Atualizar"
          outlined
          @click="loadAnalytics"
          :loading="isLoading"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Chamadas</p>
              <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {{ summaryStats.totalCalls }}
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
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Tempo Médio</p>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {{ formatDuration(summaryStats.avgTalkTime) }}
              </p>
            </div>
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <i class="pi pi-clock text-2xl text-blue-600 dark:text-blue-300"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Taxa de Resposta</p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                {{ summaryStats.answerRate }}%
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
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Chamadas Perdidas</p>
              <p class="text-3xl font-bold text-red-600 dark:text-red-400">
                {{ summaryStats.missedCalls }}
              </p>
            </div>
            <div class="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <i class="pi pi-times-circle text-2xl text-red-600 dark:text-red-300"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="shadow-sm">
      <template #header>
        <div class="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
            <i class="pi pi-chart-bar mr-2 text-orange-600"></i>
            Desempenho por Agente
          </h2>

          <Button
            icon="pi pi-download"
            label="Exportar"
            outlined
            size="small"
            @click="exportData"
          />
        </div>
      </template>
      <template #content>
        <div class="mb-4">
          <IconField>
            <InputIcon>
              <i class="pi pi-search" />
            </InputIcon>
            <InputText
              v-model="searchQuery"
              placeholder="Buscar agente por nome ou ramal..."
              class="w-full"
            />
          </IconField>
        </div>

        <DataTable
          :value="filteredAnalytics"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          sortMode="multiple"
          removableSort
          :loading="isLoading"
          class="w-full"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} agentes"
        >
          <Column field="agent.name" header="Agente" sortable class="min-w-[200px]">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <Avatar
                  :image="data.agent.avatar"
                  :label="data.agent.name.charAt(0).toUpperCase()"
                  shape="circle"
                  class="bg-orange-600 text-white"
                />
                <div>
                  <div class="font-semibold text-gray-800 dark:text-gray-100">
                    {{ data.agent.name }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    Ramal {{ data.agent.extension }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="totalCalls" header="Total" sortable class="text-center">
            <template #body="{ data }">
              <span class="font-semibold text-gray-800 dark:text-gray-100">
                {{ data.totalCalls }}
              </span>
            </template>
          </Column>

          <Column field="answeredCalls" header="Atendidas" sortable class="text-center">
            <template #body="{ data }">
              <span class="text-green-600 dark:text-green-400 font-semibold">
                {{ data.answeredCalls }}
              </span>
            </template>
          </Column>

          <Column field="missedCalls" header="Perdidas" sortable class="text-center">
            <template #body="{ data }">
              <span class="text-red-600 dark:text-red-400 font-semibold">
                {{ data.missedCalls }}
              </span>
            </template>
          </Column>

          <Column field="answerRate" header="Taxa" sortable class="text-center">
            <template #body="{ data }">
              <Tag
                :value="`${data.answerRate}%`"
                :severity="getAnswerRateSeverity(data.answerRate)"
              />
            </template>
          </Column>

          <Column field="avgTalkTime" header="Tempo Médio" sortable class="text-center">
            <template #body="{ data }">
              <span class="font-mono text-gray-800 dark:text-gray-100">
                {{ formatDuration(data.avgTalkTime) }}
              </span>
            </template>
          </Column>

          <Column field="totalTalkTime" header="Tempo Total" sortable class="text-center">
            <template #body="{ data }">
              <span class="font-mono text-gray-800 dark:text-gray-100">
                {{ formatDuration(data.totalTalkTime) }}
              </span>
            </template>
          </Column>

          <Column header="Ações" class="text-center" style="width: 120px">
            <template #body="{ data }">
              <Button
                icon="pi pi-chart-line"
                text
                rounded
                severity="secondary"
                @click="viewAgentDetails(data.agent.id)"
                v-tooltip.top="'Ver detalhes'"
              />
              <Button
                icon="pi pi-file"
                text
                rounded
                severity="secondary"
                @click="viewAgentCalls(data.agent.id)"
                v-tooltip.top="'Ver chamadas'"
              />
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-chart-bar text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <p class="text-gray-600 dark:text-gray-400">
                Nenhum dado de análise encontrado
              </p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Agent } from '~/types/agent'

definePageMeta({
  middleware: ['admin'],
  layout: 'default',
})

useHead({
  title: 'Analytics - Admin - stCall',
})

// Composables
const agentStore = useAgentStore()
const { execute } = useCommandExecutor()
const { formatDuration } = useCallFormatters()
const router = useRouter()

// State
const isLoading = ref(false)
const searchQuery = ref('')
const selectedPeriod = ref('today')
const agentAnalytics = ref<AgentAnalytics[]>([])

// Period options
const periodOptions = [
  { label: 'Hoje', value: 'today' },
  { label: 'Esta Semana', value: 'week' },
  { label: 'Este Mês', value: 'month' },
  { label: 'Últimos 90 dias', value: '90days' },
]

interface AgentAnalytics {
  agent: Agent
  totalCalls: number
  answeredCalls: number
  missedCalls: number
  answerRate: number
  avgTalkTime: number // seconds
  totalTalkTime: number // seconds
}

const filteredAnalytics = computed(() => {
  if (!searchQuery.value) return agentAnalytics.value

  const query = searchQuery.value.toLowerCase()
  return agentAnalytics.value.filter(
    analytics =>
      analytics.agent.name.toLowerCase().includes(query) ||
      analytics.agent.extension?.includes(query)
  )
})

const summaryStats = computed(() => {
  const stats = {
    totalCalls: 0,
    avgTalkTime: 0,
    answerRate: 0,
    missedCalls: 0,
  }

  if (agentAnalytics.value.length === 0) return stats

  let totalTalkTime = 0
  let totalAnswered = 0

  agentAnalytics.value.forEach(analytics => {
    stats.totalCalls += analytics.totalCalls
    stats.missedCalls += analytics.missedCalls
    totalTalkTime += analytics.totalTalkTime
    totalAnswered += analytics.answeredCalls
  })

  stats.avgTalkTime = totalAnswered > 0 ? Math.floor(totalTalkTime / totalAnswered) : 0
  stats.answerRate =
    stats.totalCalls > 0 ? Math.round((totalAnswered / stats.totalCalls) * 100) : 0

  return stats
})

// Methods
async function loadAnalytics() {
  isLoading.value = true

  await execute({
    action: async () => {
      await agentStore.fetchAllAgents()

      // Generate analytics for each agent (mock data for now)
      agentAnalytics.value = agentStore.agents.map(agent => {
        // TODO: Replace with actual API call
        const totalCalls = Math.floor(Math.random() * 100) + 20
        const answeredCalls = Math.floor(totalCalls * (0.7 + Math.random() * 0.3))
        const missedCalls = totalCalls - answeredCalls
        const answerRate = Math.round((answeredCalls / totalCalls) * 100)
        const avgTalkTime = Math.floor(Math.random() * 300) + 120 // 2-7 minutes
        const totalTalkTime = answeredCalls * avgTalkTime

        return {
          agent,
          totalCalls,
          answeredCalls,
          missedCalls,
          answerRate,
          avgTalkTime,
          totalTalkTime,
        }
      })
    },
    errorMessage: 'Falha ao carregar análises',
    logPrefix: 'Analytics:Load',
    showSuccessToast: false,
    onSuccess: () => {
      isLoading.value = false
    },
    onError: () => {
      isLoading.value = false
    },
    rethrow: false,
  })
}

function getAnswerRateSeverity(rate: number): 'success' | 'warn' | 'danger' {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'warn'
  return 'danger'
}

function exportData() {
  // TODO: Implement CSV export
  const toast = useToast()
  toast.add({
    severity: 'info',
    summary: 'Exportação',
    detail: 'Funcionalidade de exportação em desenvolvimento',
    life: 3000,
  })
}

function viewAgentDetails(agentId: string) {
  router.push(`/admin/analytics/${agentId}`)
}

function viewAgentCalls(agentId: string) {
  router.push({
    path: '/history',
    query: { agentId },
  })
}

// Lifecycle
onMounted(() => {
  loadAnalytics()
})
</script>
