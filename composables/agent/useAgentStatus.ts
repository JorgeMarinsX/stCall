/**
 * Composable for managing agent status changes
 * Handles agent availability state transitions
 */
export const useAgentStatus = () => {
  const agentStore = useAgentStore()

  /**
   * Update agent status when a call starts
   */
  const onCallStarted = (callId: string, number: string): void => {
    agentStore.setStatus('on_call')
    console.log('📞 Agent status: on_call', { callId, number })
  }

  /**
   * Update agent status when a call ends
   */
  const onCallEnded = (): void => {
    if (agentStore.isConnectedToQueue) {
      agentStore.setStatus('available')
    } else {
      agentStore.setStatus('offline')
    }
    console.log('📞 Agent status:', agentStore.currentAgentStatus)
  }

  /**
   * Manually set agent as available
   */
  const setAvailable = (): void => {
    if (agentStore.isConnectedToQueue) {
      agentStore.setStatus('available')
      console.log('📞 Agent status: available')
    }
  }

  /**
   * Manually set agent as unavailable (busy, break, etc.)
   */
  const setUnavailable = (): void => {
    agentStore.setStatus('unavailable')
    console.log('📞 Agent status: unavailable')
  }

  return {
    onCallStarted,
    onCallEnded,
    setAvailable,
    setUnavailable,
  }
}
