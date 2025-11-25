import { defineStore } from 'pinia'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface AsteriskEvent {
  type: string
  data: any
  timestamp: Date
}

export const useAsteriskStore = defineStore('asterisk', {
  state: () => ({
    connectionStatus: 'disconnected' as ConnectionStatus,
    websocket: null as WebSocket | null,
    lastError: null as string | null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    events: [] as AsteriskEvent[],
    isReconnecting: false,
  }),

  getters: {
    isConnected: (state) => state.connectionStatus === 'connected',
    hasError: (state) => state.connectionStatus === 'error',
    canReconnect: (state) => state.reconnectAttempts < state.maxReconnectAttempts,
  },

  actions: {
    async connect(url?: string) {
      if (this.websocket && this.connectionStatus === 'connected') {
        console.warn('WebSocket already connected')
        return
      }

      this.connectionStatus = 'connecting'
      this.lastError = null

      try {
        // TODO: Replace with actual Asterisk WebSocket URL from env
        const wsUrl = url || 'ws://localhost:8088/ws'

        this.websocket = new WebSocket(wsUrl)

        this.websocket.onopen = () => {
          console.log('WebSocket connected to Asterisk')
          this.connectionStatus = 'connected'
          this.reconnectAttempts = 0
          this.isReconnecting = false
        }

        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleEvent({
              type: data.type || 'unknown',
              data,
              timestamp: new Date(),
            })
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.connectionStatus = 'error'
          this.lastError = 'Connection error occurred'
        }

        this.websocket.onclose = () => {
          console.log('WebSocket disconnected')
          this.connectionStatus = 'disconnected'
          this.websocket = null

          // Auto-reconnect logic
          if (this.canReconnect && !this.isReconnecting) {
            this.attemptReconnect()
          }
        }
      } catch (error: any) {
        console.error('Failed to connect to Asterisk:', error)
        this.connectionStatus = 'error'
        this.lastError = error.message || 'Failed to establish connection'
      }
    },

    disconnect() {
      if (this.websocket) {
        this.isReconnecting = false
        this.websocket.close()
        this.websocket = null
      }
      this.connectionStatus = 'disconnected'
      this.reconnectAttempts = 0
    },

    async attemptReconnect() {
      if (!this.canReconnect) {
        console.error('Max reconnection attempts reached')
        return
      }

      this.isReconnecting = true
      this.reconnectAttempts++

      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connect()
      }, delay)
    },

    handleEvent(event: AsteriskEvent) {
      // Store last 100 events
      this.events.unshift(event)
      if (this.events.length > 100) {
        this.events.pop()
      }

      // Emit event for other stores to handle
      console.log('Asterisk event:', event.type, event.data)

      // TODO: Dispatch events to appropriate stores
      // Example: if event.type === 'NewCall' -> update callStore
    },

    send(data: any) {
      if (this.websocket && this.isConnected) {
        this.websocket.send(JSON.stringify(data))
      } else {
        console.error('Cannot send message: WebSocket not connected')
      }
    },

    clearEvents() {
      this.events = []
    },
  },
})
