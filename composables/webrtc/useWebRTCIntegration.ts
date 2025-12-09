/**
 * WebRTC Integration with ARI
 * Bridges WebRTC call state with Asterisk ARI events
 * Ensures both systems stay in sync
 *
 * RESPONSIBILITY: Sync WebRTC state ↔ CallStore ↔ ARI Events
 */

export const useWebRTCIntegration = () => {
  const phone = useWebRTCPhone()
  const callStore = useCallStore()
  const asteriskStore = useAsteriskStore()


  watch(() => phone.callState.value, (newState) => {
    if (!newState) {
      // Call ended
      if (callStore.activeCall) {
        callStore.clearActiveCall()
      }
      return
    }

    const mappedCall = {
      id: newState.id,
      number: newState.remoteNumber,
      callerName: newState.remoteName,
      direction: newState.direction,
      status: newState.state === 'active' ? 'active' as const :
              newState.state === 'ringing' ? 'ringing' as const :
              newState.state === 'held' ? 'hold' as const :
              'idle' as const,
      startTime: newState.startTime,
      duration: 0,
      isMuted: false,
      isOnHold: newState.state === 'held',
    }

    if (newState.direction === 'inbound' && newState.state === 'ringing') {
      callStore.setIncomingCall(mappedCall)
    } else {
      callStore.setActiveCall(mappedCall)
      callStore.clearIncomingCall()
    }
  })

  /**
   * Watch for ARI events that affect WebRTC calls
   * Example: Remote party hangs up through ARI
   */
  watch(() => asteriskStore.events, (events) => {
    if (!events.length || !phone.callState.value) return

    const latestEvent = events[0]

    // Remote hangup
    if (latestEvent.type === 'ChannelHangupRequest' || latestEvent.type === 'StasisEnd') {
      const channelId = latestEvent.data?.channel?.id

      // Check if this event is for our WebRTC call
      if (channelId && phone.callState.value?.id === channelId) {
        console.log('📞 Remote party hung up (ARI event), ending WebRTC call')
        phone.hangup()
      }
    }
  }, { deep: true })


  watch(() => phone.isRegistered.value, (isRegistered) => {
    if (isRegistered) {
      const authStore = useAuthStore()
      const extension = authStore.user?.extension

      if (extension) {
        // Update asteriskStore to track WebRTC registration
        asteriskStore.webrtcRegistered = isRegistered
        asteriskStore.webrtcExtension = extension
        console.log(`✅ Asterisk store notified: WebRTC registered for ${extension}`)
      }
    } else {
      asteriskStore.webrtcRegistered = false
      asteriskStore.webrtcExtension = null
    }
  })

  return {
    phone,

    isIntegrated: computed(() =>
      phone.isRegistered.value && asteriskStore.isConnected
    ),
  }
}
