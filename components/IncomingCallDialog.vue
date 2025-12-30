<template>
  <Dialog
    v-model:visible="showDialog"
    header="Chamada recebida"
    modal
    :closable="true"
    :closeOnEscape="true"
    :style="{ width: '450px' }"
  >
    <div class="flex flex-col items-center text-center py-4">
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
        <Button
          label="Recusar"
          icon="pi pi-times"
          severity="danger"
          outlined
          size="large"
          class="flex-1"
          :disabled="isAnswering || isRejecting"
          :loading="isRejecting"
          @click="rejectCall"
        />

        <Button
          label="Atender"
          icon="pi pi-phone"
          severity="success"
          size="large"
          class="flex-1"
          :disabled="isAnswering || isRejecting"
          :loading="isAnswering"
          @click="answerCall"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const callStore = useCallStore()
const { answerCall: baseAnswerCall, rejectCall: baseRejectCall } = useCallHandler()
const { execute } = useCommandExecutor()

const showDialog = ref(false)
const isAnswering = ref(false)
const isRejecting = ref(false)

const incomingCall = computed(() => callStore.incomingCall)

const answerCall = async () => {
  if (isAnswering.value) return

  isAnswering.value = true
  await execute({
    action: () => baseAnswerCall(),
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: {
      title: 'Erro ao atender',
      detail: 'Não foi possível atender a chamada',
    },
    onSuccess: () => {
      // Navigate to call page on success
      navigateTo('/call')
    },
    onError: () => {
      // Force clear on error to prevent UI freeze
      callStore.clearIncomingCall()
    },
    logPrefix: 'IncomingCallDialog:Answer',
    rethrow: false,
  })
  isAnswering.value = false
}

const rejectCall = async () => {
  if (isRejecting.value) return

  isRejecting.value = true
  await execute({
    action: () => baseRejectCall(),
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: {
      title: 'Erro ao recusar',
      detail: 'Não foi possível recusar a chamada',
    },
    onError: () => {
      // Force clear on error to prevent UI freeze
      callStore.clearIncomingCall()
    },
    logPrefix: 'IncomingCallDialog:Reject',
    rethrow: false,
  })
  isRejecting.value = false
}

// Watch for incoming calls to control dialog visibility
watch(() => callStore.incomingCall, (newCall, oldCall) => {
  if (newCall) {
    showDialog.value = true
  } else if (oldCall) {
    showDialog.value = false
  }
})

// Watch for manual dialog close (X button or ESC) to trigger rejection
watch(showDialog, (visible, wasVisible) => {
  if (!visible && wasVisible && callStore.incomingCall && !isAnswering.value && !isRejecting.value) {
    rejectCall()
  }
})
</script>
