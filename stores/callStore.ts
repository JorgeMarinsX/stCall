import { defineStore } from 'pinia'
import type { CallStatus, CallDirection, Call, CallHistory } from '~/types'


// Mock call history data - remove when Asterisk integration is ready
const generateMockCallHistory = (): CallHistory[] => {
  const mockHistory: CallHistory[] = []
  const now = new Date()

  // Mock phone numbers
  const phoneNumbers = [
    { number: '+55 11 98765-4321', name: 'João Silva' },
    { number: '+55 11 97654-3210', name: 'Maria Santos' },
    { number: '+55 21 96543-2109', name: 'Pedro Costa' },
    { number: '+55 11 95432-1098', name: 'Ana Oliveira' },
    { number: '+55 11 94321-0987', name: 'Carlos Souza' },
    { number: '+55 21 93210-9876', name: 'Fernanda Lima' },
    { number: '+55 11 92109-8765', name: 'Roberto Alves' },
    { number: '+55 11 91098-7654', name: undefined }, // Unknown caller
    { number: '+55 21 90987-6543', name: 'Juliana Rocha' },
    { number: '+55 11 89876-5432', name: 'Ricardo Mendes' },
  ]

  // Generate 50 mock calls over the last 30 days
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)
    const minutesAgo = Math.floor(Math.random() * 60)

    const timestamp = new Date(now)
    timestamp.setDate(timestamp.getDate() - daysAgo)
    timestamp.setHours(timestamp.getHours() - hoursAgo)
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo)

    const contact = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)]
    const direction: CallDirection = Math.random() > 0.5 ? 'inbound' : 'outbound'
    const statusRand = Math.random()
    const status: 'completed' | 'missed' | 'rejected' =
      statusRand > 0.8 ? 'missed' : statusRand > 0.7 ? 'rejected' : 'completed'

    // Duration in seconds (0 for missed/rejected calls)
    const duration = status === 'completed' ? Math.floor(Math.random() * 600) + 30 : 0

    mockHistory.push({
      id: `call-${i}-${timestamp.getTime()}`,
      number: contact.number,
      callerName: contact.name,
      direction,
      duration,
      timestamp,
      status,
      recordingUrl: status === 'completed' && Math.random() > 0.3
        ? `/recordings/call-${i}.mp3`
        : undefined,
    })
  }

  // Sort by timestamp descending (most recent first)
  return mockHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export const useCallStore = defineStore('call', {
  state: () => ({
    activeCall: null as Call | null,
    callHistory: generateMockCallHistory(),
    isDialing: false,
    incomingCall: null as Call | null,
  }),

  getters: {
    hasActiveCall: (state) => state.activeCall !== null,
    hasIncomingCall: (state) => state.incomingCall !== null,
    activCallDuration: (state) => {
      if (!state.activeCall) return 0
      return Math.floor((Date.now() - state.activeCall.startTime.getTime()) / 1000)
    },
    callStatusText: (state) => {
      if (state.activeCall) {
        const call = state.activeCall
        if (call.isOnHold) return 'Em espera'
        if (call.status === 'active') return `Chamada ativa - ${call.number}`
        if (call.status === 'ringing') return 'Chamando...'
        if (call.status === 'transferring') return 'Transferindo...'
      }
      return 'Nenhuma chamada ativa'
    },

    // Dashboard statistics
    todaysCalls: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return state.callHistory.filter(call => call.timestamp >= today).length
    },

    totalCompletedCalls: (state) => {
      return state.callHistory.filter(call => call.status === 'completed').length
    },

    totalMissedCalls: (state) => {
      return state.callHistory.filter(call => call.status === 'missed').length
    },

    totalCallTime: (state) => {
      return state.callHistory.reduce((total, call) => total + call.duration, 0)
    },

    averageCallDuration: (state) => {
      const completedCalls = state.callHistory.filter(call => call.status === 'completed')
      if (completedCalls.length === 0) return 0
      const totalDuration = completedCalls.reduce((total, call) => total + call.duration, 0)
      return Math.floor(totalDuration / completedCalls.length)
    },

    recentCalls: (state) => {
      return state.callHistory.slice(0, 10)
    },
  },

  actions: {
    async startOutboundCall(number: string) {
      const asteriskStore = useAsteriskStore()
      const authStore = useAuthStore()

      this.isDialing = true

      try {
        // Send originate command via WebSocket
        const result = await asteriskStore.sendCommand('originate', {
          endpoint: `PJSIP/${authStore.user?.extension}`, // Agent's extension
          extension: number,
          context: 'from-internal',
          priority: 1,
        })

        // Create local call object with channel ID from Asterisk
        const call: Call = {
          id: result.channelId || `call-${Date.now()}`, // Use channel ID from Asterisk
          number,
          direction: 'outbound',
          status: 'ringing',
          startTime: new Date(),
          duration: 0,
          isMuted: false,
          isOnHold: false,
        }

        this.activeCall = call
        console.log('✅ Outbound call initiated:', number, 'Channel ID:', call.id)

      } catch (error: any) {
        console.error('❌ Failed to start outbound call:', error)
        this.isDialing = false
        throw error
      }
    },

    receiveIncomingCall(callData: { number: string; callerName?: string; callId: string }) {
      const call: Call = {
        id: callData.callId,
        number: callData.number,
        callerName: callData.callerName,
        direction: 'inbound',
        status: 'ringing',
        startTime: new Date(),
        duration: 0,
        isMuted: false,
        isOnHold: false,
      }

      this.incomingCall = call
      console.log('Incoming call from:', callData.number)
    },

    async answerCall() {
      if (!this.incomingCall) return

      const asteriskStore = useAsteriskStore()
      const agentStore = useAgentStore()

      try {
        await asteriskStore.sendCommand('answer', {
          channelId: this.incomingCall.id,
        })

        // Update local state - actual status will be updated via WebSocket event
        this.activeCall = { ...this.incomingCall, status: 'active' }
        this.incomingCall = null

        // Update agent status to on_call
        agentStore.onCallStarted(this.activeCall.id, this.activeCall.number)

        console.log('✅ Call answered, channel ID:', this.activeCall.id)

      } catch (error: any) {
        console.error('❌ Failed to answer call:', error)
        throw error
      }
    },

    async rejectCall() {
      if (!this.incomingCall) return

      const asteriskStore = useAsteriskStore()

      try {
        await asteriskStore.sendCommand('hangup', {
          channelId: this.incomingCall.id,
        })

        // Add to history as rejected
        this.addToHistory({
          id: this.incomingCall.id,
          number: this.incomingCall.number,
          callerName: this.incomingCall.callerName,
          direction: this.incomingCall.direction,
          duration: 0,
          timestamp: new Date(),
          status: 'rejected',
        })

        this.incomingCall = null
        console.log('✅ Call rejected')

      } catch (error: any) {
        console.error('❌ Failed to reject call:', error)
        throw error
      }
    },

    async hangup() {
      if (!this.activeCall) return

      const asteriskStore = useAsteriskStore()
      const agentStore = useAgentStore()
      const duration = this.activCallDuration

      try {
        await asteriskStore.sendCommand('hangup', {
          channelId: this.activeCall.id,
        })

        // Add to history
        this.addToHistory({
          id: this.activeCall.id,
          number: this.activeCall.number,
          callerName: this.activeCall.callerName,
          direction: this.activeCall.direction,
          duration,
          timestamp: this.activeCall.startTime,
          status: 'completed',
        })

        this.activeCall = null
        this.isDialing = false

        // Update agent status back to available
        agentStore.onCallEnded()

        console.log('✅ Call ended, duration:', duration, 'seconds')

      } catch (error: any) {
        console.error('❌ Failed to hangup call:', error)
        throw error
      }
    },

    async toggleMute() {
      if (!this.activeCall) return

      const asteriskStore = useAsteriskStore()
      const action = this.activeCall.isMuted ? 'unmute' : 'mute'

      try {
        await asteriskStore.sendCommand(action, {
          channelId: this.activeCall.id,
          direction: 'in', // Mute incoming audio (microphone)
        })

        this.activeCall.isMuted = !this.activeCall.isMuted
        console.log('✅ Mute toggled:', this.activeCall.isMuted)

      } catch (error: any) {
        console.error('❌ Failed to toggle mute:', error)
        throw error
      }
    },

    async toggleHold() {
      if (!this.activeCall) return

      const asteriskStore = useAsteriskStore()
      const action = this.activeCall.isOnHold ? 'unhold' : 'hold'

      try {
        await asteriskStore.sendCommand(action, {
          channelId: this.activeCall.id,
        })

        this.activeCall.isOnHold = !this.activeCall.isOnHold
        this.activeCall.status = this.activeCall.isOnHold ? 'hold' : 'active'
        console.log('✅ Hold toggled:', this.activeCall.isOnHold)

      } catch (error: any) {
        console.error('❌ Failed to toggle hold:', error)
        throw error
      }
    },

    async transferCall(targetNumber: string) {
      if (!this.activeCall) return

      const asteriskStore = useAsteriskStore()

      this.activeCall.status = 'transferring'

      try {
        await asteriskStore.sendCommand('redirect', {
          channelId: this.activeCall.id,
          endpoint: `PJSIP/${targetNumber}`,
        })

        console.log('✅ Call transferred to:', targetNumber)

        // Add to history as transferred
        this.addToHistory({
          id: this.activeCall.id,
          number: this.activeCall.number,
          callerName: this.activeCall.callerName,
          direction: this.activeCall.direction,
          duration: this.activCallDuration,
          timestamp: this.activeCall.startTime,
          status: 'completed',
        })

        this.activeCall = null

      } catch (error: any) {
        console.error('❌ Failed to transfer call:', error)
        // Revert status if transfer fails
        if (this.activeCall) {
          this.activeCall.status = 'active'
        }
        throw error
      }
    },

    addToHistory(historyItem: CallHistory) {
      this.callHistory.unshift(historyItem)

      // Keep last 1000 calls
      if (this.callHistory.length > 1000) {
        this.callHistory = this.callHistory.slice(0, 1000)
      }
    },

    clearHistory() {
      this.callHistory = []
    },

    updateCallStatus(callId: string, newState: string) {
      if (this.activeCall?.id === callId) {
        const agentStore = useAgentStore()

        // Map Asterisk channel states to our call statuses
        const statusMap: Record<string, CallStatus> = {
          'Up': 'active',
          'Ring': 'ringing',
          'Ringing': 'ringing',
          'Down': 'idle',
        }

        const mappedStatus = statusMap[newState] || 'active'
        const previousStatus = this.activeCall.status
        this.activeCall.status = mappedStatus

        console.log(`📞 Call status updated: ${callId} -> ${newState} (mapped to ${mappedStatus})`)

        // Update agent status when call becomes active (for outbound calls)
        if (previousStatus === 'ringing' && mappedStatus === 'active') {
          agentStore.onCallStarted(callId, this.activeCall.number)
        }

        // If call went down, end it
        if (newState === 'Down') {
          this.endCall(callId)
        }
      }
    },

    endCall(channelId: string) {
      const agentStore = useAgentStore()

      // Handle call end from WebSocket event
      if (this.activeCall && this.activeCall.id === channelId) {
        const duration = this.activCallDuration

        this.addToHistory({
          id: this.activeCall.id,
          number: this.activeCall.number,
          callerName: this.activeCall.callerName,
          direction: this.activeCall.direction,
          duration,
          timestamp: this.activeCall.startTime,
          status: 'completed',
        })

        this.activeCall = null
        this.isDialing = false

        // Update agent status back to available
        agentStore.onCallEnded()

        console.log('📞 Call ended by remote party, duration:', duration, 'seconds')
      }

      // Also check if it's an incoming call that was hung up
      if (this.incomingCall && this.incomingCall.id === channelId) {
        this.addToHistory({
          id: this.incomingCall.id,
          number: this.incomingCall.number,
          callerName: this.incomingCall.callerName,
          direction: this.incomingCall.direction,
          duration: 0,
          timestamp: new Date(),
          status: 'missed',
        })

        this.incomingCall = null
        console.log('📞 Incoming call ended/missed')
      }
    },
  },
})
