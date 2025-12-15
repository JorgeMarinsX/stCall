/**
 * Main WebRTC Phone Composable
 * Aggregates all WebRTC functionality into a single interface
 * Pattern: Similar to useCallHandler - combines specialized composables
 *
 * USAGE:
 * const phone = useWebRTCPhone()
 * await phone.register({ wsServer, domain, username, password })
 * await phone.call('1002')
 * phone.hangup()
 */

export const useWebRTCPhone = () => {
  // Import specialized composables
  const state = useWebRTCState()
  const session = useWebRTCSession()
  const callOps = useWebRTCCall()
  const media = useWebRTCMedia()

  // Re-export all methods and state through a single interface
  return {
    // State (reactive refs)
    isRegistered: state.isRegistered,
    callState: state.callState,
    localStream: state.localStream,
    remoteStream: state.remoteStream,
    registrationError: state.registrationError,

    // Computed
    hasActiveCall: state.hasActiveCall,
    isCallRinging: state.isCallRinging,
    isCallActive: state.isCallActive,
    isIncomingCall: state.isIncomingCall,

    // Session methods
    register: session.register,
    unregister: session.unregister,

    // Call methods
    call: callOps.call,
    answer: callOps.answer,
    reject: callOps.reject,
    hangup: callOps.hangup,
    setHold: callOps.setHold,

    // Media methods
    setMuted: media.setMuted,
    sendDTMF: media.sendDTMF,
  }
}
