import { useAgentStatus } from '~/composables/agent/useAgentStatus'

export const useCallLifecycle = () => {
  const callStore = useCallStore()
  const { onCallStarted, onCallEnded } = useAgentStatus()
  const { execute } = useCommandExecutor()
  const webrtcPhone = useWebRTCPhone()

  const startOutboundCall = async (number: string): Promise<void> => {
    callStore.setIsDialing(true)

    await execute({
      action: () => webrtcPhone.call(number),
      showSuccessToast: false,
      showErrorToast: true,
      errorMessage: {
        title: 'Erro ao ligar',
      },
      errorMessageExtractor: (error: any) => error.message || 'Erro desconhecido ao realizar chamada',
      onSuccess: () => {
        onCallStarted(`webrtc-${Date.now()}`, number)
      },
      onError: () => {
        callStore.setIsDialing(false)
      },
      logPrefix: `WebRTC:OutboundCall:${number}`,
      rethrow: true,
    })
  }
  const answerCall = async (): Promise<void> => {
    const incomingCall = callStore.incomingCall
    if (!incomingCall) return

    await execute({
      action: () => webrtcPhone.answer(),
      showSuccessToast: false,
      showErrorToast: true,
      errorMessage: {
        title: 'Erro ao atender',
        detail: 'Não foi possível atender a chamada',
      },
      onSuccess: () => {
        onCallStarted(incomingCall.id, incomingCall.number)

        callStore.setActiveCall({
          ...incomingCall,
          status: 'active',
        })
        callStore.clearIncomingCall()

        navigateTo('/call')
      },
      logPrefix: `WebRTC:Answer:${incomingCall.id}`,
      rethrow: true,
    })
  }

  const rejectCall = async (): Promise<void> => {
    const incomingCall = callStore.incomingCall
    if (!incomingCall) return

    await execute({
      action: () => webrtcPhone.reject(),
      showSuccessToast: false,
      showErrorToast: true,
      errorMessage: {
        title: 'Erro ao recusar',
        detail: 'Não foi possível recusar a chamada',
      },
      onSuccess: () => {
        callStore.clearIncomingCall()
      },
      logPrefix: `WebRTC:Reject:${incomingCall.id}`,
      rethrow: true,
    })
  }

  const hangup = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    await execute({
      action: () => webrtcPhone.hangup(),
      showSuccessToast: false,
      showErrorToast: false,
      onSuccess: () => {
        callStore.setIsDialing(false)
        onCallEnded()
      },
      logPrefix: `WebRTC:Hangup:${activeCall.id}`,
      rethrow: true,
    })
  }

  return {
    startOutboundCall,
    answerCall,
    rejectCall,
    hangup,
  }
}
