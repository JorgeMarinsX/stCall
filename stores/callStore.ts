import { defineStore } from 'pinia'

export type CallStatus = 'idle' | 'ringing' | 'active' | 'hold' | 'transferring'
export type CallDirection = 'inbound' | 'outbound'

export interface Call {
  id: string
  number: string
  callerName?: string
  direction: CallDirection
  status: CallStatus
  startTime: Date
  duration: number
  isMuted: boolean
  isOnHold: boolean
}

export interface CallHistory {
  id: string
  number: string
  callerName?: string
  direction: CallDirection
  duration: number
  timestamp: Date
  recordingUrl?: string
  status: 'completed' | 'missed' | 'rejected'
}

export const useCallStore = defineStore('call', {
  state: () => ({
    activeCall: null as Call | null,
    callHistory: [] as CallHistory[],
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
  },

  actions: {
    startOutboundCall(number: string) {
      this.isDialing = true

      const call: Call = {
        id: `call-${Date.now()}`,
        number,
        direction: 'outbound',
        status: 'ringing',
        startTime: new Date(),
        duration: 0,
        isMuted: false,
        isOnHold: false,
      }

      this.activeCall = call

      // TODO: Send call request to Asterisk via asteriskStore
      console.log('Starting outbound call to:', number)

      // Mock: Set to active after 2 seconds
      setTimeout(() => {
        if (this.activeCall?.id === call.id) {
          this.activeCall.status = 'active'
          this.isDialing = false
        }
      }, 2000)
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

    answerCall() {
      if (this.incomingCall) {
        this.activeCall = { ...this.incomingCall, status: 'active' }
        this.incomingCall = null

        // TODO: Send answer command to Asterisk
        console.log('Call answered')
      }
    },

    rejectCall() {
      if (this.incomingCall) {
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

        // TODO: Send reject command to Asterisk
        console.log('Call rejected')
      }
    },

    hangup() {
      if (this.activeCall) {
        const duration = this.activCallDuration

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

        // TODO: Send hangup command to Asterisk
        console.log('Call ended')
      }
    },

    toggleMute() {
      if (this.activeCall) {
        this.activeCall.isMuted = !this.activeCall.isMuted

        // TODO: Send mute/unmute command to Asterisk
        console.log('Mute toggled:', this.activeCall.isMuted)
      }
    },

    toggleHold() {
      if (this.activeCall) {
        this.activeCall.isOnHold = !this.activeCall.isOnHold
        this.activeCall.status = this.activeCall.isOnHold ? 'hold' : 'active'

        // TODO: Send hold/unhold command to Asterisk
        console.log('Hold toggled:', this.activeCall.isOnHold)
      }
    },

    transferCall(targetNumber: string) {
      if (this.activeCall) {
        this.activeCall.status = 'transferring'

        // TODO: Send transfer command to Asterisk
        console.log('Transferring call to:', targetNumber)

        // Mock: Complete transfer after 1 second
        setTimeout(() => {
          this.hangup()
        }, 1000)
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

    updateCallStatus(callId: string, status: CallStatus) {
      if (this.activeCall?.id === callId) {
        this.activeCall.status = status
      }
    },
  },
})
