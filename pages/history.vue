<template>
  <div class="p-6 w-full">
    <div class="mb-4">
      <h1 class="text-3xl font-semibold mb-2 w-full">Histórico de Chamadas</h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ authStore.isAdmin ? 'Visualizando chamadas de todos os agentes' : 'Visualizando suas chamadas' }}
      </p>
    </div>

  <div class="flex flex-row h-fit">
    <Card class="h-fit">
      <template #content>
        <div class="grid">
          <div class="col-12 md:col-4">
            <label for="dateRange" class="block text-sm font-medium mb-2">
              Período
            </label>
            <DatePicker
              id="dateRange"
              v-model="filters.dateRange"
              selection-mode="range"
              :manual-input="false"
              show-icon
              icon-display="input"
              date-format="dd/mm/yy"
              placeholder="Selecione o período"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-3">
            <label for="direction" class="block text-sm font-medium mb-2">
              Tipo
            </label>
            <Select
              id="direction"
              v-model="filters.direction"
              :options="directionOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos os tipos"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-3">
            <label for="status" class="block text-sm font-medium mb-2">
              Status
            </label>
            <Select
              id="status"
              v-model="filters.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos os status"
              class="w-full"
            />
          </div>

          <div v-if="authStore.isAdmin" class="col-12 md:col-3">
            <label for="agent" class="block text-sm font-medium mb-2">
              Agente
            </label>
            <Select
              id="agent"
              v-model="filters.agentId"
              :options="agentOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos os agentes"
              class="w-full"
              filter
            />
          </div>

          <div class="col-12 md:col-3">
            <label for="queue" class="block text-sm font-medium mb-2">
              Fila
            </label>
            <Select
              id="queue"
              v-model="filters.queueName"
              :options="queueOptions"
              option-label="label"
              option-value="value"
              placeholder="Todas as filas"
              class="w-full"
            />
          </div>

          <div :class="authStore.isAdmin ? 'col-12 md:col-3' : 'col-12 md:col-2'">
            <label for="search" class="block text-sm font-medium mb-2">
              Buscar
            </label>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                id="search"
                v-model="filters.search"
                placeholder="Número ou nome"
                class="w-full"
              />
            </IconField>
          </div>
        </div>

        <div class="flex justify-content-end mt-3">
          <Button
            label="Limpar filtros"
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            @click="clearFilters"
          />
        </div>
      </template>
    </Card>
    <Card class="flex flex-column ml-5 w-full">
      <template #content>
        <DataTable
          :value="filteredCalls"
          :rows="10"
          :paginator="true"
          :rows-per-page-options="[10, 25, 50]"
          striped-rows
          removable-sort
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          current-page-report-template="Mostrando {first} a {last} de {totalRecords} chamadas"
          class="flex-1 h-fit"
        >
          <Column field="direction" header="Tipo" sortable :style="{ width: '80px' }">
            <template #body="{ data }">
              <Avatar
                :icon="data.direction === 'inbound' ? 'pi pi-phone' : 'pi pi-arrow-up-right'"
                :style="{
                  backgroundColor: data.direction === 'inbound' ? 'var(--p-green-100)' : 'var(--p-blue-100)',
                  color: data.direction === 'inbound' ? 'var(--p-green-600)' : 'var(--p-blue-600)'
                }"
                size="normal"
                shape="circle"
              />
            </template>
          </Column>

          <Column field="callerName" header="Contato" sortable>
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ data.callerName || 'Desconhecido' }}</div>
                <div class="text-sm text-muted-color">{{ data.number }}</div>
              </div>
            </template>
          </Column>

          <Column v-if="authStore.isAdmin" field="agentName" header="Agente" sortable :style="{ width: '180px' }">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Avatar
                  :label="data.agentName?.charAt(0).toUpperCase() || 'A'"
                  shape="circle"
                  size="small"
                  class="bg-orange-600 text-white"
                />
                <div>
                  <div class="font-medium text-sm">{{ data.agentName || 'Desconhecido' }}</div>
                  <div class="text-xs text-muted-color">Ramal {{ data.agentExtension || '-' }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="queueName" header="Fila" sortable :style="{ width: '120px' }">
            <template #body="{ data }">
              <Tag v-if="data.queueName" :value="data.queueName" severity="secondary" />
              <span v-else class="text-muted-color text-sm">-</span>
            </template>
          </Column>

          <Column field="status" header="Status" sortable :style="{ width: '140px' }">
            <template #body="{ data }">
              <Tag
                :value="getStatusLabel(data.status)"
                :severity="getStatusSeverity(data.status)"
              />
            </template>
          </Column>

          <Column field="duration" header="Duração" sortable :style="{ width: '100px' }">
            <template #body="{ data }">
              {{ data.duration > 0 ? formatDuration(data.duration) : '-' }}
            </template>
          </Column>

          <Column v-if="hasQueueCalls" field="waitDuration" header="Espera" sortable :style="{ width: '100px' }">
            <template #body="{ data }">
              {{ data.waitDuration ? formatDuration(data.waitDuration) : '-' }}
            </template>
          </Column>

          <Column field="timestamp" header="Data e Hora" sortable :style="{ width: '180px' }">
            <template #body="{ data }">
              <div>
                <div class="text-sm">{{ formatDate(data.timestamp) }}</div>
                <div class="text-xs text-muted-color">{{ formatTime(data.timestamp) }}</div>
              </div>
            </template>
          </Column>

          <Column header="Gravação" :style="{ width: '120px' }">
            <template #body="{ data }">
              <Button
                v-if="data.recordingUrl"
                icon="pi pi-play"
                severity="secondary"
                text
                rounded
                @click="playRecording(data)"
              />
              <span v-else class="text-muted-color text-sm">-</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
</div>

    <Dialog
      v-model:visible="showPlayer"
      :header="`Gravação - ${selectedCall?.callerName || selectedCall?.number}`"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <AudioPlayer
        v-if="selectedCall?.recordingUrl"
        :recording-url="selectedCall.recordingUrl"
        :call-info="{
          number: selectedCall.number,
          callerName: selectedCall.callerName,
          timestamp: selectedCall.timestamp,
          duration: selectedCall.duration
        }"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCallStore } from '~/stores/callStore'
import { useCallHistoryFilters } from '~/composables/calls/useCallHistoryFilters'
import { useCallFormatters } from '~/composables/calls/useCallFormatters'
import { useCallStatus } from '~/composables/calls/useCallStatus'
import { useRecordingPlayer } from '~/composables/calls/useRecordingPlayer'

useHead({
  title: 'stCall - Histórico de Chamadas',
})

const callStore = useCallStore()
const authStore = useAuthStore()
const agentStore = useAgentStore()
const { execute } = useCommandExecutor()

// Filters
const {
  filters,
  directionOptions,
  statusOptions,
  queueOptions,
  agentOptions,
  filteredCalls,
  hasQueueCalls,
  clearFilters,
} = useCallHistoryFilters()

// Formatters
const { formatDuration, formatDate, formatTime } = useCallFormatters()

// Status helpers
const { getStatusLabel, getStatusSeverity } = useCallStatus()

// Recording player
const { showPlayer, selectedCall, playRecording } = useRecordingPlayer()

onMounted(async () => {
  await execute({
    action: () => callStore.initializeHistory(),
    errorMessage: 'Falha ao carregar histórico de chamadas',
    logPrefix: 'History:LoadHistory',
    showSuccessToast: false,
    rethrow: false,
  })

  if (authStore.isAdmin) {
    await execute({
      action: () => agentStore.fetchAllAgents(),
      errorMessage: 'Falha ao carregar lista de agentes',
      logPrefix: 'History:LoadAgents',
      showSuccessToast: false,
      rethrow: false,
    })
  }
})
</script>