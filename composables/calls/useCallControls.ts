/**
 * Composable for handling in-call controls
 * Manages mute, hold, and transfer operations during active calls
 */
export const useCallControls = () => {
  const callStore = useCallStore()
  const asteriskStore = useAsteriskStore()
  const { globalToast } = useGlobalToast()


  const toggleMute = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const action = activeCall.isMuted ? 'unmute' : 'mute'

    try {
      await asteriskStore.sendCommand(action, {
        channelId: activeCall.id,
        direction: 'in',
      })

      callStore.setMuted(!activeCall.isMuted)
      console.log('✅ Mute toggled:', !activeCall.isMuted)

      globalToast.info(
        !activeCall.isMuted ? 'Microfone desativado' : 'Microfone ativado',
        !activeCall.isMuted ? 'Você está no mudo' : 'Você está audível',
        2000
      )
    } catch (error: any) {
      globalToast.error('Erro ao alternar mudo', error.message || 'Falha ao alternar microfone')

      throw error
    }
  }


  const toggleHold = async (): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    const action = activeCall.isOnHold ? 'unhold' : 'hold'

    try {
      await asteriskStore.sendCommand(action, {
        channelId: activeCall.id,
      })

      callStore.setHold(!activeCall.isOnHold)
      console.log('✅ Hold toggled:', !activeCall.isOnHold)

      globalToast.info(
        !activeCall.isOnHold ? 'Chamada em espera' : 'Chamada retomada',
        !activeCall.isOnHold ? 'O contato está em espera' : 'Chamada ativa',
        2000
      )
    } catch (error: any) {
      globalToast.error('Erro ao alternar espera', error.message || 'Falha ao colocar/retirar de espera')

      throw error
    }
  }


  const transferCall = async (targetNumber: string): Promise<void> => {
    const activeCall = callStore.activeCall
    if (!activeCall) return

    callStore.setCallStatus('transferring')

    try {
      await asteriskStore.sendCommand('redirect', {
        channelId: activeCall.id,
        endpoint: `PJSIP/${targetNumber}`,
      })

      console.log('✅ Call transferred to:', targetNumber)

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

      globalToast.success('Transferindo', `Transferindo para ${targetNumber}`)
    } catch (error: any) {
      // Revert status if transfer fails
      if (callStore.activeCall) {
        callStore.setCallStatus('active')
      }

      globalToast.error('Erro ao transferir chamada', error.message || 'Falha ao transferir chamada')

      throw error
    }
  }

  return {
    toggleMute,
    toggleHold,
    transferCall,
  }
}
