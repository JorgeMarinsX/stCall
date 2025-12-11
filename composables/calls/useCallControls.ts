/**
 * Composable for handling in-call controls
 * Manages mute, hold, and transfer operations during active calls
 */
export const useCallControls = () => {
  const callStore = useCallStore()
  const { executeAsteriskCommand } = useCommandExecutor()

  const toggleMute = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const willBeMuted = !activeCall.isMuted
    const action = activeCall.isMuted ? 'unmute' : 'mute'

    await executeAsteriskCommand(
      action,
      {
        channelId: activeCall.id,
        direction: 'in',
      },
      {
        successMessage: {
          title: willBeMuted ? 'Microfone desativado' : 'Microfone ativado',
          detail: willBeMuted ? 'Você está no mudo' : 'Você está audível',
          life: 2000,
        },
        errorMessage: 'Erro ao alternar mudo',
        onSuccess: () => {
          callStore.setMuted(willBeMuted)
        },
        logPrefix: `${action}:${activeCall.id}`,
      }
    )
  }

  const toggleHold = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const willBeOnHold = !activeCall.isOnHold
    const action = activeCall.isOnHold ? 'unhold' : 'hold'

    await executeAsteriskCommand(
      action,
      {
        channelId: activeCall.id,
      },
      {
        successMessage: {
          title: willBeOnHold ? 'Chamada em espera' : 'Chamada retomada',
          detail: willBeOnHold ? 'O contato está em espera' : 'Chamada ativa',
          life: 2000,
        },
        errorMessage: 'Erro ao alternar espera',
        onSuccess: () => {
          callStore.setHold(willBeOnHold)
        },
        logPrefix: `${action}:${activeCall.id}`,
      }
    )
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
