import { useAgentStatus } from '~/composables/agent/useAgentStatus'
export const useCallLifecycle = () => {
  const callStore = useCallStore()
  const authStore = useAuthStore()
  const { onCallStarted, onCallEnded } = useAgentStatus()
  const { executeAsteriskCommand } = useCommandExecutor()

  const startOutboundCall = async (number: string): Promise<void> => {
    if (!authStore.user?.extension) {
      throw new Error('Extensão do agente não configurada')
    }
    callStore.setIsDialing(true)
    const result = await executeAsteriskCommand(
      'originate',
      {
        endpoint: `PJSIP/${authStore.user.extension}`,
        extension: number,
        context: 'from-internal',
        priority: 1,
      },
      {
        successMessage: {
          title: 'Discando',
          detail: `Iniciando chamada para ${number}...`,
          life: 2000,
        },
        errorMessage: {
          title: 'Erro ao iniciar chamada',
          life: 8000, 
        },
        onSuccess: (result) => {
          callStore.setActiveCall({
            id: result.channelId || `call-${Date.now()}`,
            number,
            direction: 'outbound',
            status: 'ringing',
            startTime: new Date(),
            duration: 0,
            isMuted: false,
            isOnHold: false,
          })
        },
        onError: () => {
          callStore.setIsDialing(false)
        },
        logPrefix: `Originate:${number}`,
      }
    )
  }
  const answerCall = async (): Promise<void> => {
    const incomingCall = callStore.incomingCall
    if (!incomingCall) return

    await executeAsteriskCommand(
      'answer',
      { channelId: incomingCall.id },
      {
        successMessage: {
          title: 'Chamada atendida',
          detail: 'Você está conectado',
          life: 2000,
        },
        errorMessage: 'Erro ao atender chamada',
        onSuccess: () => {
          callStore.setActiveCall({ ...incomingCall, status: 'active' })
          callStore.clearIncomingCall()
          onCallStarted(incomingCall.id, incomingCall.number)
        },
        logPrefix: `Answer:${incomingCall.id}`,
      }
    )
  }

  const rejectCall = async (): Promise<void> => {
    const incomingCall = callStore.incomingCall
    if (!incomingCall) return

    await executeAsteriskCommand(
      'hangup',
      { channelId: incomingCall.id },
      {
        successMessage: {
          title: 'Chamada recusada',
          detail: 'A chamada foi recusada',
          life: 2000,
        },
        errorMessage: 'Erro ao recusar chamada',
        showSuccessToast: true,
        onSuccess: () => {
          callStore.addToHistory({
            id: incomingCall.id,
            number: incomingCall.number,
            callerName: incomingCall.callerName,
            direction: incomingCall.direction,
            duration: 0,
            timestamp: new Date(),
            status: 'rejected',
          })
          callStore.clearIncomingCall()
        },
        logPrefix: `Reject:${incomingCall.id}`,
      }
    )
  }

  const hangup = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const duration = callStore.activCallDuration
    const formattedDuration = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`

    await executeAsteriskCommand(
      'hangup',
      { channelId: activeCall.id },
      {
        successMessage: {
          title: 'Chamada encerrada',
          detail: `Duração: ${formattedDuration}`,
          life: 3000,
        },
        errorMessage: 'Erro ao encerrar chamada',
        onSuccess: () => {
          callStore.addToHistory({
            id: activeCall.id,
            number: activeCall.number,
            callerName: activeCall.callerName,
            direction: activeCall.direction,
            duration,
            timestamp: activeCall.startTime,
            status: 'completed',
          })
          callStore.clearActiveCall()
          callStore.setIsDialing(false)
          onCallEnded()
        },
        logPrefix: `Hangup:${activeCall.id}`,
      }
    )
  }

  return {
    startOutboundCall,
    answerCall,
    rejectCall,
    hangup,
  }
}
