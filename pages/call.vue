<template>
  <div class="p-6 w-full mx-auto">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Chamadas</h1>

    <!-- Active Call Display -->
    <Card v-if="callStore.hasActiveCall" class="mb-6">
      <template #content>
        <ActiveCallDisplay
          :call="activeCall"
          :duration="callDuration"
          @toggle-mute="toggleMute"
          @toggle-hold="toggleHold"
          @show-transfer="showTransferDialog"
          @hangup="hangup"
        />
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

// Use call handler for all call operations
const {
  startOutboundCall,
  answerCall,
  rejectCall,
  hangup,
  toggleMute,
  toggleHold,
  transferCall,
} = useCallHandler()

// State
const phoneNumber = ref('')
const transferNumber = ref('')
const transferDialogVisible = ref(false)

// Computed
const activeCall = computed(() => callStore.activeCall)
const incomingCall = computed(() => callStore.incomingCall)
const recentCalls = computed(() => callStore.recentCalls)
const showIncomingCall = computed({
  get: () => callStore.hasIncomingCall,
  set: () => {} // Prevent direct modification
})

// Call duration tracking
const { callDuration } = useCallDuration(() => activeCall.value)

// Methods - wrapper for startCall with validation and UI updates
const startCall = async (number?: string) => {
  const numberToCall = number || phoneNumber.value

  if (!numberToCall || numberToCall.length < 8) {
    // Note: validation is minimal here; useCallHandler already shows error toasts
    return
  }

  try {
    await startOutboundCall(numberToCall)
    phoneNumber.value = ''
  } catch (error: any) {
    // Error already handled by useCallHandler
  }
}

const showTransferDialog = () => {
  transferNumber.value = ''
  transferDialogVisible.value = true
}

const confirmTransfer = async () => {
  if (!transferNumber.value || transferNumber.value.length < 8) {
    return
  }

  try {
    await transferCall(transferNumber.value)
    transferDialogVisible.value = false
  } catch (error: any) {
    // Error already handled by useCallHandler
  }
}


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
