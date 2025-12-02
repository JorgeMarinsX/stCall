<template>
  <div class="p-6 w-full mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Chamadas</h1>

    <!-- Active Call Display -->
    <Card v-if="callStore.hasActiveCall" class="mb-6">
      <template #content>
        <div class="flex flex-col items-center text-center py-8">
          <!-- Caller Avatar/Icon -->
          <div class="relative mb-6">
            <Avatar
              v-if="activeCall?.callerName"
              :label="activeCall.callerName.charAt(0).toUpperCase()"
              size="xlarge"
              shape="circle"
              class="w-32 h-32 bg-orange-500 text-white text-5xl"
            />
            <Avatar
              v-else
              icon="pi pi-phone"
              size="xlarge"
              shape="circle"
              class="w-32 h-32 bg-gray-500 text-white text-5xl"
            />

            <!-- Status Indicator -->
            <div
              class="absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white dark:border-gray-800"
              :class="{
                'bg-green-500': activeCall?.status === 'active' && !activeCall?.isOnHold,
                'bg-orange-500': activeCall?.status === 'ringing',
                'bg-yellow-500': activeCall?.isOnHold,
                'bg-blue-500': activeCall?.status === 'transferring'
              }"
            ></div>
          </div>

          <!-- Caller Information -->
          <h2 class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ activeCall?.callerName || 'Desconhecido' }}
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-400 mb-1">
            {{ activeCall?.number }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {{ getCallStatusText() }}
          </p>

          <!-- Call Timer -->
          <div v-if="activeCall?.status === 'active'" class="mb-8">
            <p class="text-5xl font-mono font-bold text-orange-500">
              {{ formatDuration(callDuration) }}
            </p>
          </div>

          <!-- Ringing Animation -->
          <div v-if="activeCall?.status === 'ringing'" class="mb-8">
            <ProgressSpinner
              style="width: 60px; height: 60px"
              stroke-width="4"
              fill="transparent"
              animation-duration="1s"
            />
          </div>

          <!-- Call Controls -->
          <div class="flex gap-4 justify-center flex-wrap">
            <!-- Mute Button -->
            <Button
              v-tooltip.top="activeCall?.isMuted ? 'Ativar microfone' : 'Silenciar microfone'"
              :icon="activeCall?.isMuted ? 'pi pi-microphone-slash' : 'pi pi-microphone'"
              rounded
              :severity="activeCall?.isMuted ? 'danger' : 'secondary'"
              size="large"
              @click="toggleMute"
              :disabled="activeCall?.status !== 'active'"
            />

            <!-- Hold Button -->
            <Button
              v-tooltip.top="activeCall?.isOnHold ? 'Retomar chamada' : 'Colocar em espera'"
              :icon="activeCall?.isOnHold ? 'pi pi-play' : 'pi pi-pause'"
              rounded
              :severity="activeCall?.isOnHold ? 'warn' : 'secondary'"
              size="large"
              @click="toggleHold"
              :disabled="activeCall?.status === 'ringing' || activeCall?.status === 'transferring'"
            />

            <!-- Transfer Button -->
            <Button
              v-tooltip.top="'Transferir chamada'"
              icon="pi pi-arrow-right-arrow-left"
              rounded
              severity="secondary"
              size="large"
              @click="showTransferDialog"
              :disabled="activeCall?.status !== 'active' || activeCall?.isOnHold"
            />

            <!-- Hangup Button -->
            <Button
              v-tooltip.top="'Encerrar chamada'"
              icon="pi pi-phone"
              rounded
              severity="danger"
              size="large"
              class="rotate-[135deg]"
              @click="hangup"
            />
          </div>

          <!-- Call Direction Badge -->
          <div class="mt-6">
            <Tag
              :value="activeCall?.direction === 'inbound' ? 'Entrada' : 'Saída'"
              :icon="activeCall?.direction === 'inbound' ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
              :severity="activeCall?.direction === 'inbound' ? 'info' : 'warn'"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Dialer or Info Message (shown when no active call) -->
    <Card v-else>
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-phone text-orange-500"></i>
            <span class="text-base">Discar</span>
          </div>
        </div>
      </template>
      <template #content>
        <!-- Message when dialing is in progress -->
        <div v-if="callStore.isDialing" class="max-w-md mx-auto py-8 text-center">
          <ProgressSpinner
            style="width: 60px; height: 60px"
            stroke-width="4"
            fill="transparent"
            animation-duration="1s"
            class="mb-4"
          />
          <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">Discando...</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Aguarde enquanto conectamos sua chamada
          </p>
        </div>

        <!-- Dialer when idle -->
        <div v-else class="max-w-md mx-auto">
          <Dialer
            v-model:phone-number="phoneNumber"
            :is-dialing="callStore.isDialing"
            :show-recent-calls="true"
            :recent-calls="recentCalls"
            @call="startCall"
          />
        </div>
      </template>
    </Card>

    <!-- Incoming Call Notification -->
    <Dialog
      v-model:visible="showIncomingCall"
      header="Chamada recebida"
      modal
      :closable="false"
      :style="{ width: '450px' }"
    >
      <div class="flex flex-col items-center text-center py-4">
        <!-- Ringing Animation -->
        <div class="relative mb-6">
          <Avatar
            v-if="incomingCall?.callerName"
            :label="incomingCall.callerName.charAt(0).toUpperCase()"
            size="xlarge"
            shape="circle"
            class="w-32 h-32 bg-orange-500 text-white text-5xl animate-pulse"
          />
          <Avatar
            v-else
            icon="pi pi-phone"
            size="xlarge"
            shape="circle"
            class="w-32 h-32 bg-gray-500 text-white text-5xl animate-pulse"
          />
        </div>

        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {{ incomingCall?.callerName || 'Desconhecido' }}
        </h3>
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {{ incomingCall?.number }}
        </p>

        <div class="flex gap-4">
          <!-- Reject Button -->
          <Button
            label="Recusar"
            icon="pi pi-times"
            severity="danger"
            outlined
            size="large"
            class="flex-1"
            @click="rejectCall"
          />

          <!-- Answer Button -->
          <Button
            label="Atender"
            icon="pi pi-phone"
            severity="success"
            size="large"
            class="flex-1"
            @click="answerCall"
          />
        </div>
      </div>
    </Dialog>

    <!-- Transfer Call Dialog -->
    <Dialog
      v-model:visible="transferDialogVisible"
      header="Transferir chamada"
      modal
      :style="{ width: '450px' }"
    >
      <div class="space-y-4 py-4">
        <div>
          <label for="transfer-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de destino
          </label>
          <InputText
            id="transfer-number"
            v-model="transferNumber"
            placeholder="Digite o número"
            class="w-full"
            @keyup.enter="confirmTransfer"
          />
        </div>

        <Message v-if="transferNumber" severity="info" :closable="false">
          A chamada com {{ activeCall?.number }} será transferida para {{ transferNumber }}
        </Message>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="transferDialogVisible = false"
        />
        <Button
          label="Transferir"
          icon="pi pi-arrow-right"
          :disabled="!transferNumber || transferNumber.length < 8"
          @click="confirmTransfer"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useCallStore } from '~/stores/callStore'

useHead({
  title: 'stCall - Chamadas',
})

const callStore = useCallStore()
const toast = useToast()

// State
const phoneNumber = ref('')
const transferNumber = ref('')
const transferDialogVisible = ref(false)
const callDuration = ref(0)
let durationInterval: NodeJS.Timeout | null = null

// Computed
const activeCall = computed(() => callStore.activeCall)
const incomingCall = computed(() => callStore.incomingCall)
const recentCalls = computed(() => callStore.recentCalls)
const showIncomingCall = computed({
  get: () => callStore.hasIncomingCall,
  set: () => {} // Prevent direct modification
})

// Methods
const startCall = (number?: string) => {
  const numberToCall = number || phoneNumber.value

  if (!numberToCall || numberToCall.length < 8) {
    toast.add({
      severity: 'warn',
      summary: 'Número inválido',
      detail: 'Digite um número válido para iniciar a chamada',
      life: 3000,
    })
    return
  }

  callStore.startOutboundCall(numberToCall)
  phoneNumber.value = ''

  toast.add({
    severity: 'info',
    summary: 'Discando',
    detail: 'Iniciando chamada...',
    life: 2000,
  })
}

const answerCall = () => {
  callStore.answerCall()
  toast.add({
    severity: 'success',
    summary: 'Chamada atendida',
    detail: 'Você está conectado',
    life: 2000,
  })
}

const rejectCall = () => {
  callStore.rejectCall()
  toast.add({
    severity: 'warn',
    summary: 'Chamada recusada',
    detail: 'A chamada foi recusada',
    life: 2000,
  })
}

const hangup = () => {
  if (activeCall.value) {
    const duration = Math.floor((Date.now() - activeCall.value.startTime.getTime()) / 1000)
    callStore.hangup()

    toast.add({
      severity: 'info',
      summary: 'Chamada encerrada',
      detail: `Duração: ${formatDuration(duration)}`,
      life: 3000,
    })
  }
}

const toggleMute = () => {
  callStore.toggleMute()
  toast.add({
    severity: 'info',
    summary: activeCall.value?.isMuted ? 'Microfone desativado' : 'Microfone ativado',
    detail: activeCall.value?.isMuted ? 'Você está no mudo' : 'Você está audível',
    life: 2000,
  })
}

const toggleHold = () => {
  callStore.toggleHold()
  toast.add({
    severity: 'info',
    summary: activeCall.value?.isOnHold ? 'Chamada em espera' : 'Chamada retomada',
    detail: activeCall.value?.isOnHold ? 'O contato está em espera' : 'Chamada ativa',
    life: 2000,
  })
}

const showTransferDialog = () => {
  transferNumber.value = ''
  transferDialogVisible.value = true
}

const confirmTransfer = () => {
  if (!transferNumber.value || transferNumber.value.length < 8) {
    toast.add({
      severity: 'warn',
      summary: 'Número inválido',
      detail: 'Digite um número válido para transferir',
      life: 3000,
    })
    return
  }

  callStore.transferCall(transferNumber.value)
  transferDialogVisible.value = false

  toast.add({
    severity: 'success',
    summary: 'Transferindo',
    detail: `Transferindo para ${transferNumber.value}`,
    life: 3000,
  })
}

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getCallStatusText = () => {
  if (!activeCall.value) return ''

  if (activeCall.value.isOnHold) return 'Em espera'
  if (activeCall.value.status === 'active') return 'Conectado'
  if (activeCall.value.status === 'ringing') return activeCall.value.direction === 'outbound' ? 'Chamando...' : 'Recebendo...'
  if (activeCall.value.status === 'transferring') return 'Transferindo...'

  return ''
}

const updateCallDuration = () => {
  if (activeCall.value && activeCall.value.status === 'active') {
    callDuration.value = Math.floor((Date.now() - activeCall.value.startTime.getTime()) / 1000)
  }
}

// Watch for active call changes
watch(() => activeCall.value, (newCall) => {
  // Start duration timer when call becomes active
  if (newCall && newCall.status === 'active' && !durationInterval) {
    callDuration.value = 0
    durationInterval = setInterval(updateCallDuration, 1000)
  }

  // Stop duration timer when call ends
  if (!newCall && durationInterval) {
    clearInterval(durationInterval)
    durationInterval = null
    callDuration.value = 0
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  if (durationInterval) {
    clearInterval(durationInterval)
    durationInterval = null
  }
})

// Mock incoming call for testing (remove in production)
// Uncomment to test incoming call UI
// onMounted(() => {
//   setTimeout(() => {
//     callStore.receiveIncomingCall({
//       number: '+55 11 98765-4321',
//       callerName: 'João Silva',
//       callId: `call-test-${Date.now()}`
//     })
//   }, 3000)
// })
</script>
