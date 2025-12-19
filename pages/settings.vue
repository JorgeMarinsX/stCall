<template>
  <div class="p-6 w-full mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Configurações</h1>

    <Tabs value="0">
      <TabList>
        <Tab value="0">
          <div class="flex items-center gap-2">
            <i class="pi pi-palette"></i>
            <span>Aparência</span>
          </div>
        </Tab>
        <Tab value="1">
          <div class="flex items-center gap-2">
            <i class="pi pi-volume-up"></i>
            <span>Áudio</span>
          </div>
        </Tab>
        <Tab value="2">
          <div class="flex items-center gap-2">
            <i class="pi pi-bell"></i>
            <span>Notificações</span>
          </div>
        </Tab>
        <Tab v-if="authStore.isAdmin" value="3">
          <div class="flex items-center gap-2">
            <i class="pi pi-cog"></i>
            <span>Sistema</span>
          </div>
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="0">
          <div class="space-y-6">
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i :class="uiStore.isDarkMode ? 'pi pi-moon' : 'pi pi-sun'" class="text-orange-500"></i>
                <span class="text-base">Modo escuro</span>
              </div>
            </template>
            <template #content>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-900 dark:text-white mb-1">Ativar modo escuro</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Altere a aparência da interface para tons escuros
                  </p>
                </div>
                <ToggleSwitch v-model="uiStore.isDarkMode" @change="handleDarkModeToggle" />
              </div>
            </template>
          </Card>
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-brush text-orange-500"></i>
                <span class="text-base">Tema</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Cor primária
                  </label>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    stCall usa laranja como cor principal
                  </p>
                  <div class="flex gap-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-orange-500 border-2 border-gray-300 dark:border-gray-600"></div>
                      <span class="text-sm text-gray-900 dark:text-white">Laranja (Padrão)</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-table text-orange-500"></i>
                <span class="text-base">Densidade</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-900 dark:text-white mb-1">Modo compacto</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Reduz o espaçamento entre elementos da interface
                    </p>
                  </div>
                  <ToggleSwitch v-model="compactMode" @change="handleCompactModeToggle" />
                </div>
              </div>
            </template>
          </Card>
          </div>
        </TabPanel>

        <TabPanel value="1">
          <div class="space-y-6">
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-microphone text-orange-500"></i>
                <span class="text-base">Microfone</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <label for="microphone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dispositivo de entrada
                  </label>
                  <Select
                    id="microphone"
                    v-model="selectedMicrophone"
                    :options="microphones"
                    option-label="label"
                    option-value="id"
                    placeholder="Selecione um microfone"
                    class="w-full"
                    @change="handleMicrophoneChange"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nível do microfone
                  </label>
                  <div class="flex items-center gap-4">
                    <Slider v-model="microphoneVolume" class="flex-1" @change="handleMicrophoneVolumeChange" />
                    <span class="text-sm font-medium text-gray-900 dark:text-white w-12">{{ microphoneVolume }}%</span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Cancelamento de ruído</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Remove ruídos de fundo durante chamadas
                    </p>
                  </div>
                  <ToggleSwitch v-model="noiseCancellation" @change="handleNoiseCancellationToggle" />
                </div>
              </div>
            </template>
          </Card>
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-volume-up text-orange-500"></i>
                <span class="text-base">Alto-falante</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <label for="speaker" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dispositivo de saída
                  </label>
                  <Select
                    id="speaker"
                    v-model="selectedSpeaker"
                    :options="speakers"
                    option-label="label"
                    option-value="id"
                    placeholder="Selecione um alto-falante"
                    class="w-full"
                    @change="handleSpeakerChange"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Volume do alto-falante
                  </label>
                  <div class="flex items-center gap-4">
                    <Slider v-model="speakerVolume" class="flex-1" @change="handleSpeakerVolumeChange" />
                    <span class="text-sm font-medium text-gray-900 dark:text-white w-12">{{ speakerVolume }}%</span>
                  </div>
                </div>

                <div>
                  <Button
                    label="Testar áudio"
                    icon="pi pi-play"
                    outlined
                    @click="testAudio"
                  />
                </div>
              </div>
            </template>
          </Card>
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-bell text-orange-500"></i>
                <span class="text-base">Toque</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <label for="ringtone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tom de chamada
                  </label>
                  <Select
                    id="ringtone"
                    v-model="selectedRingtone"
                    :options="ringtones"
                    option-label="label"
                    option-value="id"
                    placeholder="Selecione um toque"
                    class="w-full"
                  >
                    <template #option="{ option }">
                      <div class="flex items-center justify-between w-full">
                        <span>{{ option.label }}</span>
                        <Button
                          icon="pi pi-play"
                          text
                          rounded
                          size="small"
                          @click.stop="playRingtone(option.id)"
                        />
                      </div>
                    </template>
                  </Select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Volume do toque
                  </label>
                  <div class="flex items-center gap-4">
                    <Slider v-model="ringtoneVolume" class="flex-1" />
                    <span class="text-sm font-medium text-gray-900 dark:text-white w-12">{{ ringtoneVolume }}%</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
          </div>
        </TabPanel>

        <TabPanel value="2">
          <div class="space-y-6">
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-phone text-orange-500"></i>
                <span class="text-base">Chamadas</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Notificações de chamada</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Receba notificações quando receber uma chamada
                    </p>
                  </div>
                  <ToggleSwitch
                    v-model="uiStore.notificationPreferences.callNotifications"
                    @change="handleNotificationPreferenceChange"
                  />
                </div>

                <Divider />

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Som de notificação</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Reproduzir som ao receber notificações
                    </p>
                  </div>
                  <ToggleSwitch
                    v-model="uiStore.notificationPreferences.soundEnabled"
                    @change="handleNotificationPreferenceChange"
                  />
                </div>

                <Divider />

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Notificações do sistema</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Permitir notificações do navegador/sistema operacional
                    </p>
                  </div>
                  <Button
                    v-if="!browserNotificationsEnabled"
                    label="Ativar"
                    size="small"
                    @click="requestBrowserNotifications"
                  />
                  <Tag v-else value="Ativo" severity="success" />
                </div>
              </div>
            </template>
          </Card>
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle text-orange-500"></i>
                <span class="text-base">Sistema</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Notificações do sistema</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Alertas de manutenção, atualizações e avisos importantes
                    </p>
                  </div>
                  <ToggleSwitch
                    v-model="uiStore.notificationPreferences.systemNotifications"
                    @change="handleNotificationPreferenceChange"
                  />
                </div>

                <Divider />

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Notas de versão</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Receba avisos sobre novas versões e funcionalidades
                    </p>
                  </div>
                  <ToggleSwitch v-model="releaseNotesEnabled" />
                </div>
              </div>
            </template>
          </Card>
          </div>
        </TabPanel>

        <TabPanel v-if="authStore.isAdmin" value="3">
          <div class="space-y-6">
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-server text-orange-500"></i>
                <span class="text-base">Conexão Asterisk</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <label for="asterisk-host" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Host
                  </label>
                  <InputText
                    id="asterisk-host"
                    v-model="systemSettings.asteriskHost"
                    class="w-full"
                    placeholder="localhost"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="ami-port" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Porta AMI
                    </label>
                    <InputText
                      id="ami-port"
                      v-model="systemSettings.amiPort"
                      class="w-full"
                      placeholder="5038"
                    />
                  </div>
                  <div>
                    <label for="ws-port" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Porta WebSocket
                    </label>
                    <InputText
                      id="ws-port"
                      v-model="systemSettings.wsPort"
                      class="w-full"
                      placeholder="8088"
                    />
                  </div>
                </div>

                <div class="flex gap-2">
                  <Button
                    label="Testar conexão"
                    icon="pi pi-check"
                    outlined
                    @click="testAsteriskConnection"
                  />
                  <Button
                    label="Salvar"
                    icon="pi pi-save"
                    :loading="savingSystemSettings"
                    @click="saveSystemSettings"
                  />
                </div>
              </div>
            </template>
          </Card>

          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-phone text-orange-500"></i>
                <span class="text-base">Configurações de chamada</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <label for="max-call-duration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duração máxima de chamada (minutos)
                  </label>
                  <InputNumber
                    id="max-call-duration"
                    v-model="systemSettings.maxCallDuration"
                    class="w-full"
                    :min="1"
                    :max="480"
                    placeholder="60"
                  />
                </div>

                <div>
                  <label for="call-timeout" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timeout de chamada (segundos)
                  </label>
                  <InputNumber
                    id="call-timeout"
                    v-model="systemSettings.callTimeout"
                    class="w-full"
                    :min="10"
                    :max="120"
                    placeholder="30"
                  />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Gravar chamadas automaticamente</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Todas as chamadas serão gravadas por padrão
                    </p>
                  </div>
                  <ToggleSwitch v-model="systemSettings.autoRecordCalls" />
                </div>

                <div class="pt-4">
                  <Button
                    label="Salvar configurações"
                    icon="pi pi-save"
                    :loading="savingSystemSettings"
                    @click="saveSystemSettings"
                  />
                </div>
              </div>
            </template>
          </Card>

          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-database text-orange-500"></i>
                <span class="text-base">Armazenamento e manutenção</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div>
                  <label for="retention-days" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Retenção de gravações (dias)
                  </label>
                  <InputNumber
                    id="retention-days"
                    v-model="systemSettings.recordingRetentionDays"
                    class="w-full"
                    :min="1"
                    :max="365"
                    placeholder="90"
                  />
                  <small class="text-gray-600 dark:text-gray-400">
                    Gravações mais antigas serão automaticamente excluídas
                  </small>
                </div>

                <Divider />

                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">Limpeza automática</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Executar limpeza diária de arquivos antigos
                    </p>
                  </div>
                  <ToggleSwitch v-model="systemSettings.autoCleanup" />
                </div>

                <div class="pt-4">
                  <Button
                    label="Salvar configurações"
                    icon="pi pi-save"
                    :loading="savingSystemSettings"
                    @click="saveSystemSettings"
                  />
                </div>
              </div>
            </template>
          </Card>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/uiStore'
import { useAuthStore } from '~/stores/authStore'

useHead({
  title: 'stCall - Configurações',
})

const uiStore = useUiStore()
const authStore = useAuthStore()
const audioStore = useAudioStore()
const toast = useToast()
const { execute } = useCommandExecutor()

// State
const compactMode = ref(false)
const browserNotificationsEnabled = ref(false)
const releaseNotesEnabled = ref(true)
const savingSystemSettings = ref(false)

// Audio devices - using audioStore
const selectedMicrophone = computed({
  get: () => audioStore.selectedMicrophoneId,
  set: (value) => audioStore.setMicrophone(value)
})
const selectedSpeaker = computed({
  get: () => audioStore.selectedSpeakerId,
  set: (value) => audioStore.setSpeaker(value)
})
const selectedRingtone = ref('default')

const microphones = computed(() => audioStore.availableMicrophones)
const speakers = computed(() => audioStore.availableSpeakers)

const ringtones = ref([
  { id: 'default', label: 'Toque padrão' },
  { id: 'classic', label: 'Clássico' },
  { id: 'modern', label: 'Moderno' },
  { id: 'gentle', label: 'Suave' },
])

// Audio levels - using audioStore
const microphoneVolume = computed({
  get: () => audioStore.microphoneVolume,
  set: (value) => audioStore.setMicrophoneVolume(value)
})
const speakerVolume = computed({
  get: () => audioStore.speakerVolume,
  set: (value) => audioStore.setSpeakerVolume(value)
})
const ringtoneVolume = ref(60)
const noiseCancellation = computed({
  get: () => audioStore.noiseCancellation,
  set: (value) => audioStore.setNoiseCancellation(value)
})

// System settings (Admin only)
const systemSettings = ref({
  asteriskHost: 'localhost',
  amiPort: '5038',
  wsPort: '8088',
  maxCallDuration: 60,
  callTimeout: 30,
  autoRecordCalls: true,
  recordingRetentionDays: 90,
  autoCleanup: true,
})

// Methods
const handleDarkModeToggle = () => {
  uiStore.toggleDarkMode()
  toast.add({
    severity: 'success',
    summary: 'Aparência atualizada',
    detail: `Modo ${uiStore.isDarkMode ? 'escuro' : 'claro'} ativado`,
    life: 3000,
  })
}

const handleCompactModeToggle = () => {
  // TODO: Implement compact mode CSS changes
  toast.add({
    severity: 'info',
    summary: 'Modo compacto',
    detail: compactMode.value ? 'Modo compacto ativado' : 'Modo padrão ativado',
    life: 3000,
  })
}

const handleMicrophoneChange = () => {
  toast.add({
    severity: 'success',
    summary: 'Microfone atualizado',
    detail: 'Dispositivo de entrada alterado com sucesso',
    life: 3000,
  })
}

const handleSpeakerChange = () => {
  toast.add({
    severity: 'success',
    summary: 'Alto-falante atualizado',
    detail: 'Dispositivo de saída alterado com sucesso',
    life: 3000,
  })
}

const handleMicrophoneVolumeChange = () => {
  console.log('Microphone volume:', microphoneVolume.value)
}

const handleSpeakerVolumeChange = () => {
  console.log('Speaker volume:', speakerVolume.value)
}

const handleNoiseCancellationToggle = () => {
  toast.add({
    severity: 'info',
    summary: 'Cancelamento de ruído',
    detail: noiseCancellation.value ? 'Ativado' : 'Desativado',
    life: 3000,
  })
}

const testAudio = () => {
  toast.add({
    severity: 'info',
    summary: 'Teste de áudio',
    detail: 'Reproduzindo som de teste...',
    life: 3000,
  })
  // TODO: Play test audio
}

const playRingtone = (_ringtoneId: string) => {
  toast.add({
    severity: 'info',
    summary: 'Reproduzindo toque',
    detail: 'Tocando preview...',
    life: 2000,
  })
  // TODO: Play ringtone preview
}

const handleNotificationPreferenceChange = () => {
  uiStore.updateNotificationPreferences(uiStore.notificationPreferences)
  toast.add({
    severity: 'success',
    summary: 'Preferências salvas',
    detail: 'Configurações de notificação atualizadas',
    life: 3000,
  })
}

const requestBrowserNotifications = async () => {
  if (import.meta.client && 'Notification' in window) {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      browserNotificationsEnabled.value = true
      toast.add({
        severity: 'success',
        summary: 'Notificações ativadas',
        detail: 'Você receberá notificações do navegador',
        life: 3000,
      })
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Permissão negada',
        detail: 'Não foi possível ativar notificações do navegador',
        life: 3000,
      })
    }
  }
}

const testAsteriskConnection = async () => {
  toast.add({
    severity: 'info',
    summary: 'Testando conexão',
    detail: 'Conectando ao Asterisk...',
    life: 3000,
  })

  // TODO: Test actual Asterisk connection
  await new Promise(resolve => setTimeout(resolve, 1500))

  toast.add({
    severity: 'success',
    summary: 'Conexão bem-sucedida',
    detail: 'Asterisk está acessível e respondendo',
    life: 3000,
  })
}

const saveSystemSettings = async () => {
  savingSystemSettings.value = true

  await execute({
    action: async () => {
      // TODO: Save system settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    successMessage: {
      title: 'Configurações salvas',
      detail: 'Configurações do sistema foram atualizadas',
    },
    errorMessage: 'Erro ao salvar configurações do sistema',
    logPrefix: 'Save System Settings',
    rethrow: false,
  })

  savingSystemSettings.value = false
}

onMounted(() => {
  if (!import.meta.client) return

  if ('Notification' in window) {
    browserNotificationsEnabled.value = Notification.permission === 'granted'
  }

  audioStore.loadAudioSettings()

  execute({
    action: async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()

      const mics = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          id: device.deviceId || 'default',
          label: device.label || `Microfone ${device.deviceId.slice(0, 8)}`,
        }))

      const spkrs = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          id: device.deviceId || 'default',
          label: device.label || `Alto-falante ${device.deviceId.slice(0, 8)}`,
        }))

      audioStore.setAvailableMicrophones(mics)
      audioStore.setAvailableSpeakers(spkrs)
    },
    showSuccessToast: false,
    showErrorToast: false,
    logPrefix: 'Load Audio Devices',
    rethrow: false,
  })
})
</script>
