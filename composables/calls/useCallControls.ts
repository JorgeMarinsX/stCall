export const useCallControls = () => {
  const callStore = useCallStore()
  const { execute, executeAsteriskCommand } = useCommandExecutor()
  const webrtcPhone = useWebRTCPhone()

  const toggleMute = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const willBeMuted = !activeCall.isMuted

    await execute({
      action: async () => {
        webrtcPhone.setMuted(willBeMuted)
      },
      showSuccessToast: false,
      showErrorToast: false,
      onSuccess: () => {
        callStore.setMuted(willBeMuted)
      },
      logPrefix: `WebRTC:${willBeMuted ? 'Mute' : 'Unmute'}:${activeCall.id}`,
      rethrow: true,
    })
  }

  const toggleHold = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const willBeOnHold = !activeCall.isOnHold

    await execute({
      action: async () => {
        await webrtcPhone.setHold(willBeOnHold)
      },
      showSuccessToast: false,
      showErrorToast: false,
      onSuccess: () => {
        callStore.setHold(willBeOnHold)
      },
      logPrefix: `WebRTC:${willBeOnHold ? 'Hold' : 'Unhold'}:${activeCall.id}`,
      rethrow: true,
    })
  }

  const transferCall = async (targetNumber: string): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    callStore.setCallStatus('transferring')

    await executeAsteriskCommand(
      'redirect',
      {
        channelId: activeCall.id,
        endpoint: `PJSIP/${targetNumber}`,
      },
      {
        successMessage: {
          title: 'Transferindo',
          detail: `Transferindo para ${targetNumber}`,
          life: 3000,
        },
        errorMessage: 'Erro ao transferir chamada',
        onSuccess: () => {
          callStore.addToHistory({
            id: activeCall.id,
            number: activeCall.number,
            callerName: activeCall.callerName,
            direction: activeCall.direction,
            duration: callStore.activCallDuration,
            timestamp: activeCall.startTime,
            status: 'completed',
          })
          callStore.clearActiveCall()
        },
        onError: () => {
          // Revert status if transfer fails
          if (callStore.activeCall) {
            callStore.setCallStatus('active')
          }
        },
        logPrefix: `Transfer:${targetNumber}`,
      }
    )
  }

  return {
    toggleMute,
    toggleHold,
    transferCall,
  }
}
