<template>
  <div class="p-6 w-full">
    <div class="mb-4">
      <h1 class="text-3xl font-semibold mb-2 w-full">Histórico de Chamadas</h1>
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

          <div class="col-12 md:col-2">
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
import { ref, computed } from 'vue'
import { useCallStore } from '~/stores/callStore'
import type { CallHistory } from '~/types'

useHead({
  title: 'stCall - Histórico de Chamadas',
})

const callStore = useCallStore()

const filters = ref({
  dateRange: null as Date[] | null,
  direction: null as string | null,
  status: null as string | null,
  search: '',
})

const directionOptions = [
  { label: 'Todos', value: null },
  { label: 'Recebidas', value: 'inbound' },
  { label: 'Realizadas', value: 'outbound' },
]

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Completadas', value: 'completed' },
  { label: 'Perdidas', value: 'missed' },
  { label: 'Rejeitadas', value: 'rejected' },
]

const showPlayer = ref(false)
const selectedCall = ref<CallHistory | null>(null)

const filteredCalls = computed(() => {
  let calls = [...callStore.callHistory]

  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    const [start, end] = filters.value.dateRange
    if (start && end) {
      calls = calls.filter(call => {
        const callDate = new Date(call.timestamp)
        return callDate >= start && callDate <= end
      })
    }
  }

  if (filters.value.direction) {
    calls = calls.filter(call => call.direction === filters.value.direction)
  }

  if (filters.value.status) {
    calls = calls.filter(call => call.status === filters.value.status)
  }

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    calls = calls.filter(call =>
      call.number.toLowerCase().includes(searchLower) ||
      call.callerName?.toLowerCase().includes(searchLower)
    )
  }

  return calls
})

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'completed': return 'Completada'
    case 'missed': return 'Perdida'
    case 'rejected': return 'Rejeitada'
    default: return status
  }
}

const getStatusSeverity = (status: string): 'success' | 'danger' | 'secondary' => {
  switch (status) {
    case 'completed': return 'success'
    case 'missed': return 'danger'
    case 'rejected': return 'secondary'
    default: return 'secondary'
  }
}

const clearFilters = () => {
  filters.value = {
    dateRange: null,
    direction: null,
    status: null,
    search: '',
  }
}

const playRecording = (call: CallHistory) => {
  selectedCall.value = call
  showPlayer.value = true
}
</script>
