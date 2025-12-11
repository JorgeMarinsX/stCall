<template>
  <div class="p-6 w-full mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Perfil</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <div class="lg:col-span-1">
        <Card>
          <template #content>
            <div class="flex flex-col items-center text-center">
              <!-- Avatar -->
              <div class="relative mb-4">
                <Avatar
                  v-if="user?.avatar"
                  :image="user.avatar"
                  size="xlarge"
                  shape="circle"
                  class="w-32 h-32"
                />
                <Avatar
                  v-else
                  :label="user?.name.charAt(0).toUpperCase()"
                  size="xlarge"
                  shape="circle"
                  class="w-32 h-32 bg-orange-500 text-white text-4xl"
                />
                <Button
                  icon="pi pi-camera"
                  rounded
                  severity="secondary"
                  class="absolute bottom-0 right-0"
                  @click="avatarFileInput?.click()"
                  v-tooltip.top="'Alterar foto'"
                />
                <input
                  ref="avatarFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleAvatarChange"
                />
              </div>

              <!-- User Info -->
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {{ user?.name }}
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ user?.email }}</p>
              <Tag
                :value="user?.role === 'admin' ? 'Administrador' : 'Agente'"
                :severity="user?.role === 'admin' ? 'warn' : 'info'"
              />

              <Divider />

              <!-- Quick Stats -->
              <div class="w-full space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Membro desde</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Nov 2024</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Ramal</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ currentAgent?.extension || 'N/A' }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Tag
                    :value="getStatusLabel(currentAgent?.status || 'offline')"
                    :severity="getStatusSeverity(currentAgent?.status || 'offline')"
                    class="text-xs"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Statistics Card (Agent only) -->
        <Card v-if="user?.role === 'agent'" class="mt-6">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-line text-orange-500"></i>
              <span class="text-base">Estatísticas</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Chamadas atendidas</span>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ stats.answeredCalls }}/{{ stats.totalCalls }}
                  </span>
                </div>
                <ProgressBar
                  :value="answerRate"
                  :show-value="false"
                  class="h-2"
                />
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ answerRate }}% de taxa de atendimento
                </span>
              </div>

              <Divider />

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Hoje</p>
                  <p class="text-xl font-semibold text-orange-500">{{ stats.todayCalls }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Perdidas</p>
                  <p class="text-xl font-semibold text-red-500">{{ stats.missedCalls }}</p>
                </div>
              </div>

              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Duração média</p>
                <p class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ formatDuration(stats.averageDuration) }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Edit Profile -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-orange-500"></i>
                <span class="text-base">Informações pessoais</span>
              </div>
              <Button
                v-if="!isEditingProfile"
                label="Editar"
                icon="pi pi-pencil"
                size="small"
                text
                @click="startEditingProfile"
              />
            </div>
          </template>
          <template #content>
            <div v-if="!isEditingProfile" class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Nome completo</label>
                <p class="text-base text-gray-900 dark:text-white mt-1">{{ user?.name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                <p class="text-base text-gray-900 dark:text-white mt-1">{{ user?.email }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Função</label>
                <p class="text-base text-gray-900 dark:text-white mt-1">
                  {{ user?.role === 'admin' ? 'Administrador' : 'Agente' }}
                </p>
              </div>
            </div>

            <div v-else class="space-y-4">
              <div>
                <label for="edit-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome completo *
                </label>
                <InputText
                  id="edit-name"
                  v-model="profileForm.name"
                  class="w-full"
                  :class="{ 'border-red-500': profileErrors.name }"
                />
                <small v-if="profileErrors.name" class="text-red-500">{{ profileErrors.name }}</small>
              </div>

              <div>
                <label for="edit-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <InputText
                  id="edit-email"
                  v-model="profileForm.email"
                  type="email"
                  class="w-full"
                  :class="{ 'border-red-500': profileErrors.email }"
                />
                <small v-if="profileErrors.email" class="text-red-500">{{ profileErrors.email }}</small>
              </div>

              <div class="flex justify-end gap-2 pt-4">
                <Button
                  label="Cancelar"
                  severity="secondary"
                  text
                  @click="cancelEditingProfile"
                />
                <Button
                  label="Salvar alterações"
                  :loading="savingProfile"
                  @click="saveProfile"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Change Password -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-lock text-orange-500"></i>
              <span class="text-base">Alterar senha</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div>
                <label for="current-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha atual *
                </label>
                <Password
                  id="current-password"
                  v-model="passwordForm.currentPassword"
                  :feedback="false"
                  toggle-mask
                  class="w-full"
                  :class="{ 'border-red-500': passwordErrors.currentPassword }"
                  input-class="w-full"
                />
                <small v-if="passwordErrors.currentPassword" class="text-red-500">
                  {{ passwordErrors.currentPassword }}
                </small>
              </div>

              <div>
                <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova senha *
                </label>
                <Password
                  id="new-password"
                  v-model="passwordForm.newPassword"
                  toggle-mask
                  class="w-full"
                  :class="{ 'border-red-500': passwordErrors.newPassword }"
                  input-class="w-full"
                >
                  <template #header>
                    <h6 class="font-semibold mb-2">Escolha uma senha</h6>
                  </template>
                  <template #footer>
                    <Divider />
                    <p class="text-xs mt-2">Sugestões</p>
                    <ul class="pl-2 ml-2 mt-1 text-xs" style="line-height: 1.5">
                      <li>Pelo menos uma letra minúscula</li>
                      <li>Pelo menos uma letra maiúscula</li>
                      <li>Pelo menos um número</li>
                      <li>Mínimo 8 caracteres</li>
                    </ul>
                  </template>
                </Password>
                <small v-if="passwordErrors.newPassword" class="text-red-500">
                  {{ passwordErrors.newPassword }}
                </small>
              </div>

              <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar nova senha *
                </label>
                <Password
                  id="confirm-password"
                  v-model="passwordForm.confirmPassword"
                  :feedback="false"
                  toggle-mask
                  class="w-full"
                  :class="{ 'border-red-500': passwordErrors.confirmPassword }"
                  input-class="w-full"
                />
                <small v-if="passwordErrors.confirmPassword" class="text-red-500">
                  {{ passwordErrors.confirmPassword }}
                </small>
              </div>

              <div class="flex justify-end pt-4">
                <Button
                  label="Alterar senha"
                  icon="pi pi-lock"
                  :loading="savingPassword"
                  @click="changePassword"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Danger Zone (Delete Account) -->
        <Card class="border-2 border-red-200 dark:border-red-900 w-full">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-red-500"></i>
              <span class="text-base text-red-600 dark:text-red-400">Zona de perigo</span>
            </div>
          </template>
          <template #content>
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white mb-1">Desativar conta</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Sua conta será desativada e você não poderá mais acessar o sistema.
                </p>
              </div>
              <Button
                label="Desativar"
                severity="danger"
                outlined
                @click="confirmDeactivate"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Deactivate Confirmation Dialog -->
    <Dialog
      v-model:visible="deactivateDialogVisible"
      header="Confirmar desativação de conta"
      modal
      :style="{ width: '500px' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-5xl text-red-500"></i>
        <div>
          <p class="text-gray-900 dark:text-white mb-3">
            Tem certeza que deseja desativar sua conta? Esta ação irá:
          </p>
          <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
            <li>Desconectar você de todas as chamadas</li>
            <li>Remover seu acesso ao sistema</li>
            <li>Seus dados serão mantidos, mas inacessíveis</li>
          </ul>
          <p class="text-sm font-medium text-red-600 dark:text-red-400">
            Contate um administrador para reativar sua conta.
          </p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="deactivateDialogVisible = false"
        />
        <Button
          label="Sim, desativar minha conta"
          severity="danger"
          :loading="deactivating"
          @click="deactivateAccount"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import { useAgentStore } from '~/stores/agentStore'

useHead({
  title: 'stCall - Perfil',
})

const authStore = useAuthStore()
const agentStore = useAgentStore()
const toast = useToast()
const router = useRouter()
const { execute } = useCommandExecutor()

// Refs
const avatarFileInput = ref<HTMLInputElement>()

// State
const isEditingProfile = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const deactivating = ref(false)
const deactivateDialogVisible = ref(false)

const profileForm = ref({
  name: '',
  email: '',
})

const profileErrors = ref({
  name: '',
  email: '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordErrors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Computed
const user = computed(() => authStore.user)
const stats = computed(() => agentStore.stats)
const currentAgent = computed(() =>
  agentStore.agents.find(a => a.email === user.value?.email)
)

const answerRate = computed(() => {
  if (stats.value.totalCalls === 0) return 0
  return Math.round((stats.value.answeredCalls / stats.value.totalCalls) * 100)
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

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // TODO: Upload avatar to server
    console.log('Avatar selected:', file.name)

    // Mock preview
    const reader = new FileReader()
    reader.onload = (e) => {
      if (user.value) {
        user.value.avatar = e.target?.result as string
      }
    }
    reader.readAsDataURL(file)

    toast.add({
      severity: 'info',
      summary: 'Em desenvolvimento',
      detail: 'Upload de avatar será implementado em breve',
      life: 3000,
    })
  }
}

const startEditingProfile = () => {
  if (user.value) {
    profileForm.value = {
      name: user.value.name,
      email: user.value.email,
    }
    profileErrors.value = {
      name: '',
      email: '',
    }
    isEditingProfile.value = true
  }
}

const cancelEditingProfile = () => {
  isEditingProfile.value = false
  profileErrors.value = {
    name: '',
    email: '',
  }
}

const validateProfile = () => {
  let isValid = true
  profileErrors.value = {
    name: '',
    email: '',
  }

  if (!profileForm.value.name.trim()) {
    profileErrors.value.name = 'Nome é obrigatório'
    isValid = false
  }

  if (!profileForm.value.email.trim()) {
    profileErrors.value.email = 'Email é obrigatório'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.value.email)) {
    profileErrors.value.email = 'Email inválido'
    isValid = false
  }

  return isValid
}

const saveProfile = async () => {
  if (!validateProfile()) {
    return
  }

  savingProfile.value = true

  await execute({
    action: async () => {
      // TODO: Update profile via API
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (user.value) {
        user.value.name = profileForm.value.name
        user.value.email = profileForm.value.email
      }
    },
    successMessage: 'Perfil atualizado com sucesso',
    errorMessage: 'Erro ao atualizar perfil',
    onSuccess: () => {
      isEditingProfile.value = false
    },
    logPrefix: 'Update Profile',
    rethrow: false,
  })

  savingProfile.value = false
}

const validatePassword = () => {
  let isValid = true
  passwordErrors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }

  if (!passwordForm.value.currentPassword) {
    passwordErrors.value.currentPassword = 'Senha atual é obrigatória'
    isValid = false
  }

  if (!passwordForm.value.newPassword) {
    passwordErrors.value.newPassword = 'Nova senha é obrigatória'
    isValid = false
  } else if (passwordForm.value.newPassword.length < 8) {
    passwordErrors.value.newPassword = 'Senha deve ter pelo menos 8 caracteres'
    isValid = false
  }

  if (!passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Confirmação de senha é obrigatória'
    isValid = false
  } else if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Senhas não coincidem'
    isValid = false
  }

  return isValid
}

const changePassword = async () => {
  if (!validatePassword()) {
    return
  }

  savingPassword.value = true

  await execute({
    action: async () => {
      // TODO: Change password via API
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    successMessage: 'Senha alterada com sucesso',
    errorMessage: 'Erro ao alterar senha. Verifique sua senha atual.',
    onSuccess: () => {
      // Clear form
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }
    },
    logPrefix: 'Change Password',
    rethrow: false,
  })

  savingPassword.value = false
}

const confirmDeactivate = () => {
  deactivateDialogVisible.value = true
}

const deactivateAccount = async () => {
  deactivating.value = true

  await execute({
    action: async () => {
      // TODO: Deactivate account via API
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    successMessage: {
      title: 'Conta desativada',
      detail: 'Sua conta foi desativada com sucesso',
    },
    errorMessage: 'Erro ao desativar conta',
    onSuccess: async () => {
      // Logout and redirect
      await authStore.logout()
      router.push('/login')
    },
    logPrefix: 'Deactivate Account',
    rethrow: false,
  })

  deactivating.value = false
  deactivateDialogVisible.value = false
}

// Load stats on mount
onMounted(() => {
  agentStore.fetchAgentStats()
})
</script>
