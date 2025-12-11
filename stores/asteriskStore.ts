import { defineStore } from 'pinia'
import type { ConnectionStatus, PendingCommand, AsteriskEvent } from '~/types'

export const useAsteriskStore = defineStore('asterisk', {
  state: () => ({
    connectionStatus: 'disconnected' as ConnectionStatus,
    websocket: null as WebSocket | null,
    lastError: undefined as string | undefined,

    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    isReconnecting: false,

    jwtToken: null as string | null,

    events: [] as AsteriskEvent[],

    pendingCommands: new Map<string, PendingCommand>(),

    heartbeatInterval: null as ReturnType<typeof setInterval> | null,
    lastPongTime: 0,

    webrtcRegistered: false,
    webrtcExtension: null as string | null,
  }),

  getters: {
    isConnected: (state) => state.connectionStatus === 'connected',
    hasError: (state) => state.connectionStatus === 'error',
    canReconnect: (state) => state.reconnectAttempts < state.maxReconnectAttempts,
  },

  actions: {
 
    async connect(jwtToken: string) {
      const { connect } = useWebSocketConnection()
      await connect(jwtToken)
    },

    disconnect() {
      const { disconnect } = useWebSocketConnection()
      disconnect()
    },

    sendCommand(action: string, params: any): Promise<any> {
      const { sendCommand } = useWebSocketCommands()
      return sendCommand(action, params)
    },

    handleEvent(event: AsteriskEvent) {
      this.events.unshift(event)
      if (this.events.length > 100) {
        this.events.pop()
      }
    },

    send(data: any) {
      if (this.websocket && this.isConnected) {
        this.websocket.send(JSON.stringify(data))
      }
    },

    clearEvents() {
      this.events = []
    },

    setWebRTCRegistered(extension: string) {
      this.webrtcRegistered = true
      this.webrtcExtension = extension
      console.log(`✅ WebRTC registered for extension ${extension}`)
    },

    clearWebRTCRegistration() {
      this.webrtcRegistered = false
      this.webrtcExtension = null
    },
  },
})