<template>
  <div class="p-6 w-full">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gerenciar agentes</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ agents.length }} agente{{ agents.length !== 1 ? 's' : '' }} cadastrado{{ agents.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <Button
        label="Novo agente"
        icon="pi pi-plus"
        @click="openCreateDialog"
        severity="primary"
      />
    </div>

    <!-- Filters and Search -->
    <div class="mb-4 flex gap-3">
      <IconField class="flex-1">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="searchQuery"
          placeholder="Buscar por nome, email ou ramal"
          class="w-full"
        />
      </IconField>

      <Select
        v-model="statusFilter"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Filtrar por status"
        class="w-64"
        show-clear
      />
    </div>

    <!-- Agents Table -->
    <DataTable
      v-model:filters="filters"
      :value="filteredAgents"
      :loading="loading"
      paginator
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      striped-rows
      removable-sort
      :global-filter-fields="['name', 'email', 'extension']"
      class="bg-white dark:bg-gray-800"
    >
      <template #empty>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-users text-4xl mb-3"></i>
          <p>Nenhum agente encontrado</p>
        </div>
      </template>

      <Column field="name" header="Nome" sortable>
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <Avatar
              :label="data.name.charAt(0).toUpperCase()"
              shape="circle"
              class="bg-orange-500 text-white"
            />
            <div>
              <div class="font-medium text-gray-900 dark:text-white">{{ data.name }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ data.email }}</div>
            </div>
          </div>
        </template>
      </Column>

      <Column field="extension" header="Ramal" sortable>
        <template #body="{ data }">
          <span class="text-gray-700 dark:text-gray-300">{{ data.extension || '-' }}</span>
        </template>
      </Column>

      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
        </template>
      </Column>

      <Column field="isConnected" header="Conectado" sortable>
        <template #body="{ data }">
          <i
            :class="data.isConnected ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"
            class="text-lg"
          ></i>
        </template>
      </Column>

      <Column field="currentCallNumber" header="Chamada ativa">
        <template #body="{ data }">
          <div v-if="data.status === 'on_call' && data.currentCallNumber" class="text-sm">
            <div class="text-gray-900 dark:text-white">{{ data.currentCallNumber }}</div>
            <div class="text-gray-500 dark:text-gray-400" v-if="data.callStartTime">
              {{ formatCallDuration(data.callStartTime) }}
            </div>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>

      <Column header="Ações" :exportable="false" style="width: 120px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              @click="openEditDialog(data)"
              v-tooltip.top="'Editar'"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="confirmDelete(data)"
              v-tooltip.top="'Excluir'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Agent Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditMode ? 'Editar agente' : 'Novo agente'"
      modal
      :style="{ width: '500px' }"
    >
      <div class="flex flex-col gap-4 mt-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome completo *
          </label>
          <InputText
            id="name"
            v-model="formData.name"
            class="w-full"
            :class="{ 'border-red-500': formErrors.name }"
            placeholder="Ex: João Silva"
          />
          <small v-if="formErrors.name" class="text-red-500">{{ formErrors.name }}</small>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <InputText
            id="email"
            v-model="formData.email"
            type="email"
            class="w-full"
            :class="{ 'border-red-500': formErrors.email }"
            placeholder="Ex: joao.silva@empresa.com"
          />
          <small v-if="formErrors.email" class="text-red-500">{{ formErrors.email }}</small>
        </div>

        <div>
          <label for="extension" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ramal
          </label>
          <InputText
            id="extension"
            v-model="formData.extension"
            class="w-full"
            placeholder="Ex: 1001"
          />
        </div>

        <div v-if="!isEditMode">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Senha *
          </label>
          <InputText
            id="password"
            v-model="formData.password"
            type="password"
            class="w-full"
            :class="{ 'border-red-500': formErrors.password }"
            placeholder="Digite a senha"
          />
          <small v-if="formErrors.password" class="text-red-500">{{ formErrors.password }}</small>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="closeDialog"
        />
        <Button
          :label="isEditMode ? 'Salvar' : 'Criar'"
          :loading="saving"
          @click="saveAgent"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Confirmar exclusão"
      modal
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
        <div>
          <p class="text-gray-900 dark:text-white">
            Tem certeza que deseja excluir o agente <strong>{{ agentToDelete?.name }}</strong>?
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="deleteDialogVisible = false"
        />
        <Button
          label="Excluir"
          severity="danger"
          :loading="deleting"
          @click="deleteAgent"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useAgentStore } from '~/stores/agentStore'
import type { Agent } from '~/stores/agentStore'
import { FilterMatchMode } from '@primevue/core/api'

useHead({
  title: 'stCall - Gerenciar agentes',
})

const agentStore = useAgentStore()
const toast = useToast()

// State
const loading = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEditMode = ref(false)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')
const statusFilter = ref(null)

const formData = ref({
  name: '',
  email: '',
  extension: '',
  password: '',
})

const formErrors = ref({
  name: '',
  email: '',
  password: '',
})

const agentToDelete = ref<Agent | null>(null)
const agentToEdit = ref<Agent | null>(null)

// Filter configuration
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

// Status options for filter
const statusOptions = [
  { label: 'Todos os status', value: null },
  { label: 'Disponível', value: 'available' },
  { label: 'Em chamada', value: 'on_call' },
  { label: 'Indisponível', value: 'unavailable' },
  { label: 'Offline', value: 'offline' },
]

// Computed
const agents = computed(() => agentStore.agents)

const filteredAgents = computed(() => {
  let result = agents.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(agent =>
      agent.name.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query) ||
      agent.extension?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(agent => agent.status === statusFilter.value)
  }

  return result
})

// Methods
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    available: 'Disponível',
    on_call: 'Em chamada',
    unavailable: 'Indisponível',
    offline: 'Offline',
  }
  return labels[status] || status
}

const getStatusSeverity = (status: string) => {
  const severities: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
    available: 'success',
    on_call: 'warn',
    unavailable: 'secondary',
    offline: 'danger',
  }
  return severities[status] || 'secondary'
}

const formatCallDuration = (startTime: Date) => {
  const duration = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const openCreateDialog = () => {
  isEditMode.value = false
  formData.value = {
    name: '',
    email: '',
    extension: '',
    password: '',
  }
  formErrors.value = {
    name: '',
    email: '',
    password: '',
  }
  dialogVisible.value = true
}

const openEditDialog = (agent: Agent) => {
  isEditMode.value = true
  agentToEdit.value = agent
  formData.value = {
    name: agent.name,
    email: agent.email,
    extension: agent.extension || '',
    password: '',
  }
  formErrors.value = {
    name: '',
    email: '',
    password: '',
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  agentToEdit.value = null
}

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    name: '',
    email: '',
    password: '',
  }

  if (!formData.value.name.trim()) {
    formErrors.value.name = 'Nome é obrigatório'
    isValid = false
  }

  if (!formData.value.email.trim()) {
    formErrors.value.email = 'Email é obrigatório'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    formErrors.value.email = 'Email inválido'
    isValid = false
  }

  if (!isEditMode.value && !formData.value.password.trim()) {
    formErrors.value.password = 'Senha é obrigatória'
    isValid = false
  }

  return isValid
}

const saveAgent = async () => {
  if (!validateForm()) {
    return
  }

  saving.value = true

  try {
    if (isEditMode.value && agentToEdit.value) {
      await agentStore.updateAgent(agentToEdit.value.id, {
        name: formData.value.name,
        email: formData.value.email,
        extension: formData.value.extension || undefined,
      })
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Agente atualizado com sucesso',
        life: 3000,
      })
    } else {
      await agentStore.createAgent({
        name: formData.value.name,
        email: formData.value.email,
        extension: formData.value.extension || undefined,
      })
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Agente criado com sucesso',
        life: 3000,
      })
    }

    closeDialog()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Erro ao salvar agente',
      life: 3000,
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (agent: Agent) => {
  agentToDelete.value = agent
  deleteDialogVisible.value = true
}

const deleteAgent = async () => {
  if (!agentToDelete.value) return

  deleting.value = true

  try {
    await agentStore.deleteAgent(agentToDelete.value.id)
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Agente excluído com sucesso',
      life: 3000,
    })
    deleteDialogVisible.value = false
    agentToDelete.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Erro ao excluir agente',
      life: 3000,
    })
  } finally {
    deleting.value = false
  }
}

// Load agents on mount
onMounted(async () => {
  loading.value = true
  try {
    await agentStore.fetchAllAgents()
  } finally {
    loading.value = false
  }
})
</script>
