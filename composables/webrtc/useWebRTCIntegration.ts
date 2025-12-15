export const useWebRTCIntegration = () => {
  const phone = useWebRTCPhone()
  const callStore = useCallStore()
  const asteriskStore = useAsteriskStore()


  watch(() => phone.callState.value, (newState, oldState) => {
    if (!newState) {
      if (oldState && callStore.activeCall) {
        const duration = Math.floor((Date.now() - callStore.activeCall.startTime.getTime()) / 1000)

        callStore.addToHistory({
          id: callStore.activeCall.id,
          number: callStore.activeCall.number,
          callerName: callStore.activeCall.callerName,
          direction: callStore.activeCall.direction,
          duration,
          timestamp: callStore.activeCall.startTime,
          status: 'completed',
        })
        callStore.clearActiveCall()
        callStore.setIsDialing(false)
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
      if (newState.state === 'ringing') {
        callStore.setIsDialing(false)
      }
    }
  })


  watch(() => asteriskStore.events, (events) => {
    if (!events.length || !phone.callState.value) return

    const latestEvent = events[0]

    if (latestEvent.type === 'ChannelHangupRequest' || latestEvent.type === 'StasisEnd') {
      const channelId = latestEvent.data?.channel?.id

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
