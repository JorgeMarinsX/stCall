import { defineStore } from 'pinia'
import type { CallStatus, CallDirection, Call, CallHistory } from '~/types'

export const useCallStore = defineStore('call', {
  state: () => ({
    activeCall: null as Call | null,
    callHistory: [] as CallHistory[],
    isDialing: false,
    incomingCall: null as Call | null,
    isLoadingHistory: false,
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
    async initializeHistory() {
      this.isLoadingHistory = true

      const { executeAsteriskCommand } = useCommandExecutor()
      const { loadHistory, saveHistory } = useCallHistoryPersistence()

      const result = await executeAsteriskCommand<any[]>(
        'fetchCallHistory',
        { limit: 100 },
        {
          showErrorToast: false,
          rethrow: false,
        }
      )

      if (result && Array.isArray(result)) {
        this.callHistory = result.map((call: any) => ({
          id: call.id,
          number: call.direction === 'inbound' ? call.callerNumber : call.calledNumber,
          callerName: call.callerName,
          direction: call.direction,
          duration: call.talkDuration || 0,
          timestamp: new Date(call.startedAt),
          status: call.status === 'completed' ? 'completed' :
                  call.status === 'abandoned' ? 'missed' :
                  call.status === 'rejected' ? 'rejected' : 'completed',
          recordingUrl: call.recordingFilename ? `/recordings/${call.recordingFilename}` : undefined,
        }))

        saveHistory(this.callHistory)
      } else {
        this.callHistory = loadHistory()
      }

      this.isLoadingHistory = false
    },

    saveHistoryToStorage() {
      const { saveHistory } = useCallHistoryPersistence()
      saveHistory(this.callHistory)
    },

    setIsDialing(value: boolean) {
      this.isDialing = value
    },

    setActiveCall(call: Call | null) {
      this.activeCall = call
    },

    clearActiveCall() {
      this.activeCall = null
    },

    setIncomingCall(call: Call | null) {
      this.incomingCall = call
    },

    clearIncomingCall() {
      this.incomingCall = null
    },

    setMuted(isMuted: boolean) {
      if (this.activeCall) {
        this.activeCall.isMuted = isMuted
      }
    },

    setHold(isOnHold: boolean) {
      if (this.activeCall) {
        this.activeCall.isOnHold = isOnHold
        this.activeCall.status = isOnHold ? 'hold' : 'active'
      }
    },

    setCallStatus(status: CallStatus) {
      if (this.activeCall) {
        this.activeCall.status = status
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

    addToHistory(historyItem: CallHistory) {
      this.callHistory.unshift(historyItem)

      if (this.callHistory.length > 1000) {
        this.callHistory = this.callHistory.slice(0, 1000)
      }

      this.saveHistoryToStorage()
    },

    clearHistory() {
      this.callHistory = []
      const { clearHistory } = useCallHistoryPersistence()
      clearHistory()
    },

    updateCallStatus(callId: string, newState: string) {
      if (this.activeCall?.id === callId) {
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

        if (previousStatus === 'ringing' && mappedStatus === 'active') {
          const agentStore = useAgentStore()
          agentStore.setStatus('on_call')
          console.log('📞 Agent status: on_call')
        }

        if (newState === 'Down') {
          this.endCall(callId)
        }
      }
    },

    endCall(channelId: string) {
      const agentStore = useAgentStore()

      // Handle active call end
      if (this.activeCall?.id === channelId) {
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

        if (agentStore.isConnectedToQueue) {
          agentStore.setStatus('available')
        } else {
          agentStore.setStatus('offline')
        }

        console.log('📞 Call ended by remote party, duration:', duration, 'seconds')
      }

      if (this.incomingCall?.id === channelId) {
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
