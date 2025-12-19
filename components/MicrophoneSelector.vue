<template>
  <div class="flex items-center gap-2">
    <Select
      :model-value="audioStore.selectedMicrophoneId"
      :options="audioStore.availableMicrophones"
      option-label="label"
      option-value="id"
      :class="compact ? 'w-32 text-xs' : 'w-48'"
      @update:model-value="handleMicrophoneChange"
    >
      <template #value="{ value }">
        <div class="flex items-center gap-2">
          <i class="pi pi-microphone text-orange-500" :class="compact ? 'text-xs' : 'text-sm'"></i>
          <span class="truncate" :class="compact ? 'text-xs' : ''">
            {{ audioStore.selectedMicrophone?.label || 'Padrão' }}
          </span>
        </div>
      </template>
    </Select>
  </div>
</template>

<script setup lang="ts">
interface Props {
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false,
})

const audioStore = useAudioStore()
const { globalToast } = useGlobalToast()

const handleMicrophoneChange = (deviceId: string) => {
  audioStore.setMicrophone(deviceId)
  globalToast.success('Microfone atualizado', 'Dispositivo de entrada alterado com sucesso', 3000)
}

onMounted(() => {
  if (!import.meta.client) return

  const { execute } = useCommandExecutor()

  execute({
    action: async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())

      const devices = await navigator.mediaDevices.enumerateDevices()

      const microphones = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          id: device.deviceId || 'default',
          label: device.label || `Microfone ${device.deviceId.slice(0, 8)}`,
        }))

      audioStore.setAvailableMicrophones(microphones)
    },
    showSuccessToast: false,
    showErrorToast: false,
    logPrefix: 'Load Microphones',
    rethrow: false,
  })
})
</script>
