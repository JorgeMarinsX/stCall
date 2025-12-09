import { useAgentStatus } from '~/composables/agent/useAgentStatus'

/**
 * Composable for handling call lifecycle operations
 * Manages call initiation, answering, rejection, and termination
 */
export const useCallLifecycle = () => {
  const callStore = useCallStore()
  const asteriskStore = useAsteriskStore()
  const authStore = useAuthStore()
  const { globalToast } = useGlobalToast()
  const { onCallStarted, onCallEnded } = useAgentStatus()

  /**
   * Start an outbound call
   */
  const startOutboundCall = async (number: string): Promise<void> => {
    callStore.setIsDialing(true)

    try {
      // First, verify the agent has an extension
      if (!authStore.user?.extension) {
        throw new Error('Agent extension not configured')
      }

      console.log('🔄 Originating call to', number, 'from extension', authStore.user.extension)
      console.log('Full endpoint:', `PJSIP/${authStore.user.extension}`)

      const result = await asteriskStore.sendCommand('originate', {
        endpoint: `PJSIP/${authStore.user.extension}`,
        extension: number,
        context: 'from-internal',
        priority: 1,
      })

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

      console.log('✅ Outbound call initiated:', number, 'Channel ID:', result.channelId)

      globalToast.info('Discando', `Iniciando chamada para ${number}...`, 2000)
    } catch (error: any) {
      callStore.setIsDialing(false)

      globalToast.error('Erro ao iniciar chamada', error.message || 'Falha ao iniciar chamada')

      throw error
    }
  }

  /**
   * Answer an incoming call
   */
  const answerCall = async (): Promise<void> => {
    const incomingCall = callStore.incomingCall
    if (!incomingCall) return

    try {
      await asteriskStore.sendCommand('answer', {
        channelId: incomingCall.id,
      })

      callStore.setActiveCall({ ...incomingCall, status: 'active' })
      callStore.clearIncomingCall()

      onCallStarted(incomingCall.id, incomingCall.number)

      console.log('✅ Call answered, channel ID:', incomingCall.id)

      globalToast.success('Chamada atendida', 'Você está conectado', 2000)
    } catch (error: any) {
      globalToast.error('Erro ao atender chamada', error.message || 'Falha ao atender chamada')

      throw error
    }
  }

  /**
   * Reject an incoming call
   */
  const rejectCall = async (): Promise<void> => {
    const incomingCall = callStore.incomingCall
    if (!incomingCall) return

    try {
      await asteriskStore.sendCommand('hangup', {
        channelId: incomingCall.id,
      })

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
      console.log('✅ Call rejected')

      globalToast.warn('Chamada recusada', 'A chamada foi recusada', 2000)
    } catch (error: any) {
      globalToast.error('Erro ao recusar chamada', error.message || 'Falha ao recusar chamada')

      throw error
    }
  }

  /**
   * Hang up an active call
   */
  const hangup = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const duration = callStore.activCallDuration

    try {
      await asteriskStore.sendCommand('hangup', {
        channelId: activeCall.id,
      })

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

      const formattedDuration = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
      console.log('✅ Call ended, duration:', duration, 'seconds')

      globalToast.info('Chamada encerrada', `Duração: ${formattedDuration}`)
    } catch (error: any) {
      globalToast.error('Erro ao encerrar chamada', error.message || 'Falha ao encerrar chamada')

      throw error
    }
  }

  return {
    startOutboundCall,
    answerCall,
    rejectCall,
    hangup,
  }
}
