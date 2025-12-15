import type { UserAgent, Registerer, Session } from 'sip.js'

/**
 * WebRTC State Management
 * Centralized reactive state for WebRTC phone
 * SINGLETON PATTERN: State created outside function so all calls share the same refs
 */

export interface WebRTCCallState {
  id: string
  remoteNumber: string
  remoteName?: string
  state: 'ringing' | 'active' | 'held' | 'ended'
  direction: 'inbound' | 'outbound'
  startTime: Date
}

// SINGLETON: Create refs outside function so they're shared across all calls
const userAgent = ref<UserAgent | null>(null)
const registerer = ref<Registerer | null>(null)
const currentSession = ref<Session | null>(null)

const isRegistered = ref(false)
const registrationError = ref<string | null>(null)

const callState = ref<WebRTCCallState | null>(null)

const localStream = ref<MediaStream | null>(null)
const remoteStream = ref<MediaStream | null>(null)

const config = ref<{
  wsServer: string
  domain: string
  username: string
  password: string
  displayName?: string
} | null>(null)

export const useWebRTCState = () => {

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
