import { useAgentStatus } from '~/composables/agent/useAgentStatus'

/**
 * Composable for handling WebSocket events related to calls
 * Processes incoming call events, status changes, and call termination
 */
export const useCallEvents = () => {
  const callStore = useCallStore()
  const { onCallStarted, onCallEnded } = useAgentStatus()

  /**
   * Handle incoming call event from WebSocket
   */
  const handleIncomingCall = (data: { channelId: string; callerNumber: string; callerName?: string }): void => {
    callStore.receiveIncomingCall({
      callId: data.channelId,
      number: data.callerNumber,
      callerName: data.callerName,
    })

    console.log('📞 Incoming call from:', data.callerNumber)
  }

  /**
   * Handle call status change event from WebSocket
   */
  const handleCallStatusChange = (channelId: string, newState: string): void => {
    const activeCall = callStore.activeCall

    if (activeCall?.id === channelId) {
      // Map Asterisk channel states to our call statuses
      const statusMap: Record<string, any> = {
        'Up': 'active',
        'Ring': 'ringing',
        'Ringing': 'ringing',
        'Down': 'idle',
      }

      const mappedStatus = statusMap[newState] || 'active'
      const previousStatus = activeCall.status

      callStore.setCallStatus(mappedStatus)

      console.log(`📞 Call status updated: ${channelId} -> ${newState} (mapped to ${mappedStatus})`)

      // Update agent status when outbound call becomes active
      if (previousStatus === 'ringing' && mappedStatus === 'active') {
        onCallStarted(channelId, activeCall.number)
      }

      // Handle call end
      if (newState === 'Down') {
        handleCallEnded(channelId)
      }
    }
  }

  /**
   * Handle call ended event from WebSocket
   */
  const handleCallEnded = (channelId: string): void => {
    const activeCall = callStore.activeCall

    // Handle active call end
    if (activeCall?.id === channelId) {
      const duration = callStore.activCallDuration

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

      console.log('📞 Call ended by remote party, duration:', duration, 'seconds')
    }

    // Handle missed incoming call
    const incomingCall = callStore.incomingCall
    if (incomingCall?.id === channelId) {
      callStore.addToHistory({
        id: incomingCall.id,
        number: incomingCall.number,
        callerName: incomingCall.callerName,
        direction: incomingCall.direction,
        duration: 0,
        timestamp: new Date(),
        status: 'missed',
      })

      callStore.clearIncomingCall()
      console.log('📞 Incoming call ended/missed')
    }
  }

  return {
    handleIncomingCall,
    handleCallStatusChange,
    handleCallEnded,
  }
}
