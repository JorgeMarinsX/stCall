import type { UserAgent, Registerer, Session } from 'sip.js'

/**
 * WebRTC State Management
 * Centralized reactive state for WebRTC phone
 * Similar to how stores manage state, but scoped to WebRTC session
 */

export interface WebRTCCallState {
  id: string
  remoteNumber: string
  remoteName?: string
  state: 'ringing' | 'active' | 'held' | 'ended'
  direction: 'inbound' | 'outbound'
  startTime: Date
}

export const useWebRTCState = () => {
  // SIP.js core instances
  const userAgent = ref<UserAgent | null>(null)
  const registerer = ref<Registerer | null>(null)
  const currentSession = ref<Session | null>(null)

  // Registration state
  const isRegistered = ref(false)
  const registrationError = ref<string | null>(null)

  // Call state
  const callState = ref<WebRTCCallState | null>(null)

  // Media streams
  const localStream = ref<MediaStream | null>(null)
  const remoteStream = ref<MediaStream | null>(null)

  // Connection config (stored for reconnection)
  const config = ref<{
    wsServer: string
    domain: string
    username: string
    password: string
    displayName?: string
  } | null>(null)

  /**
   * Getters (computed properties)
   */
  const hasActiveCall = computed(() =>
    callState.value !== null &&
    callState.value.state !== 'ended'
  )

  const isCallRinging = computed(() =>
    callState.value?.state === 'ringing'
  )

  const isCallActive = computed(() =>
    callState.value?.state === 'active'
  )

  const isIncomingCall = computed(() =>
    callState.value?.direction === 'inbound' &&
    callState.value?.state === 'ringing'
  )

  /**
   * Reset all state (for cleanup/disconnect)
   */
  const resetState = () => {
    userAgent.value = null
    registerer.value = null
    currentSession.value = null
    isRegistered.value = false
    registrationError.value = null
    callState.value = null
    localStream.value = null
    remoteStream.value = null
    config.value = null
  }

  return {
    // SIP instances
    userAgent,
    registerer,
    currentSession,

    // Registration
    isRegistered,
    registrationError,
    config,

    // Call state
    callState,

    // Media
    localStream,
    remoteStream,

    // Computed
    hasActiveCall,
    isCallRinging,
    isCallActive,
    isIncomingCall,

    // Actions
    resetState,
  }
}
