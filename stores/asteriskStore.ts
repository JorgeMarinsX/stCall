import { defineStore } from 'pinia'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface AsteriskEvent {
  type: string
  data: any
  timestamp: Date
}

interface PendingCommand {
  resolve: (value: any) => void
  reject: (reason: any) => void
}

interface WebSocketMessage {
  type: 'event' | 'system' | 'pong' | 'command_response' | 'ping' | 'command'
  requestId?: string
  data?: any
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
    pendingCommands: new Map<string, PendingCommand>(),
    heartbeatInterval: null as NodeJS.Timeout | null,
    lastPongTime: 0,
    jwtToken: null as string | null,
  }),

  getters: {
    isConnected: (state) => state.connectionStatus === 'connected',
    hasError: (state) => state.connectionStatus === 'error',
    canReconnect: (state) => state.reconnectAttempts < state.maxReconnectAttempts,
  },

  actions: {
    async connect(jwtToken: string) {
      if (this.websocket && this.connectionStatus === 'connected') {
        console.warn('WebSocket already connected')
        return
      }

      this.connectionStatus = 'connecting'
      this.lastError = null
      this.jwtToken = jwtToken

      try {
        // Get WebSocket URL from runtime config
        const config = useRuntimeConfig()
        const wsUrl = `${config.public.wsUrl}/?token=${jwtToken}`

        console.log('Connecting to stCall WebSocket Server:', config.public.wsUrl)

        this.websocket = new WebSocket(wsUrl)

        this.websocket.onopen = () => {
          console.log('✅ WebSocket connected to stCall server')
          this.connectionStatus = 'connected'
          this.reconnectAttempts = 0
          this.isReconnecting = false

          // Start heartbeat
          this.startHeartbeat()

          // Show success notification
          const toast = useToast()
          toast.add({
            severity: 'success',
            summary: 'Conectado',
            detail: 'Conexão estabelecida com sucesso',
            life: 3000
          })
        }

        this.websocket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.connectionStatus = 'error'
          this.lastError = 'Erro de conexão com o servidor'
        }

        this.websocket.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason)
          this.connectionStatus = 'disconnected'
          this.websocket = null

          // Stop heartbeat
          this.stopHeartbeat()

          // Show notification
          const toast = useToast()
          toast.add({
            severity: 'warn',
            summary: 'Conexão perdida',
            detail: 'Tentando reconectar...',
            life: 3000
          })

          // Auto-reconnect logic
          if (this.canReconnect && !this.isReconnecting && this.jwtToken) {
            this.attemptReconnect()
          }
        }
      } catch (error: any) {
        console.error('Failed to connect:', error)
        this.connectionStatus = 'error'
        this.lastError = error.message || 'Falha ao estabelecer conexão'

        const toast = useToast()
        toast.add({
          severity: 'error',
          summary: 'Erro de conexão',
          detail: this.lastError,
          life: 5000
        })
      }
    },

    disconnect() {
      if (this.websocket) {
        this.isReconnecting = false
        this.websocket.close()
        this.websocket = null
      }

      this.stopHeartbeat()
      this.connectionStatus = 'disconnected'
      this.reconnectAttempts = 0
      this.jwtToken = null

      // Reject all pending commands
      this.pendingCommands.forEach((pending) => {
        pending.reject(new Error('WebSocket disconnected'))
      })
      this.pendingCommands.clear()
    },

    async attemptReconnect() {
      if (!this.canReconnect || !this.jwtToken) {
        console.error('Cannot reconnect: max attempts reached or no token')
        return
      }

      this.isReconnecting = true
      this.reconnectAttempts++

      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        if (this.jwtToken) {
          this.connect(this.jwtToken)
        }
      }, delay)
    },

    handleMessage(message: WebSocketMessage) {
      switch (message.type) {
        case 'event':
          // Asterisk ARI event wrapped in data
          this.handleAsteriskEvent(message.data)
          break

        case 'system':
          // Server notification
          console.log('System message:', message.data)
          break

        case 'pong':
          // Heartbeat response
          this.lastPongTime = Date.now()
          break

        case 'command_response':
          // Response to command we sent
          this.handleCommandResponse(message)
          break

        default:
          console.warn('Unknown message type:', message.type)
      }
    },

    handleAsteriskEvent(event: any) {
      // Store event
      this.events.unshift({
        type: event.type || 'unknown',
        data: event,
        timestamp: new Date(),
      })

      if (this.events.length > 100) {
        this.events.pop()
      }

      console.log('📡 Asterisk event:', event.type, event)

      // Route events to appropriate stores
      const callStore = useCallStore()

      switch (event.type) {
        case 'StasisStart':
          // New call entering application
          callStore.receiveIncomingCall({
            number: event.channel.caller.number,
            callerName: event.channel.caller.name,
            callId: event.channel.id
          })
          break

        case 'ChannelStateChange':
          // Call state changed (Ring → Up, etc.)
          callStore.updateCallStatus(event.channel.id, event.channel.state)
          break

        case 'ChannelHangupRequest':
        case 'StasisEnd':
          // Call ended
          callStore.hangup()
          break

        default:
          // Log unknown events for debugging
          console.log('Unhandled event type:', event.type)
      }
    },

    sendCommand(action: string, params: any): Promise<any> {
      return new Promise((resolve, reject) => {
        if (!this.isConnected) {
          reject(new Error('WebSocket não conectado'))
          return
        }

        // Generate unique request ID
        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Store pending request
        this.pendingCommands.set(requestId, { resolve, reject })

        // Send command
        const message: WebSocketMessage = {
          type: 'command',
          requestId,
          data: { action, params }
        }

        this.sendMessage(message)

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.pendingCommands.has(requestId)) {
            this.pendingCommands.delete(requestId)
            reject(new Error('Comando expirou (timeout)'))
          }
        }, 10000)
      })
    },

    handleCommandResponse(message: WebSocketMessage) {
      if (!message.requestId) return

      const pending = this.pendingCommands.get(message.requestId)
      if (pending) {
        if (message.data?.success) {
          pending.resolve(message.data.result)
        } else {
          pending.reject(new Error(message.data?.error || 'Comando falhou'))
        }
        this.pendingCommands.delete(message.requestId)
      }
    },

    sendMessage(message: WebSocketMessage) {
      if (this.websocket && this.isConnected) {
        this.websocket.send(JSON.stringify(message))
      } else {
        console.error('Cannot send message: WebSocket not connected')
      }
    },

    startHeartbeat() {
      // Stop existing heartbeat
      this.stopHeartbeat()

      // Send ping every 30 seconds
      this.heartbeatInterval = setInterval(() => {
        if (this.isConnected) {
          this.sendMessage({ type: 'ping' })
        }
      }, 30000)
    },

    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }
    },

    handleEvent(event: AsteriskEvent) {
      // Legacy method for compatibility
      this.events.unshift(event)
      if (this.events.length > 100) {
        this.events.pop()
      }
    },

    send(data: any) {
      // Legacy method for compatibility
      this.sendMessage(data)
    },

    clearEvents() {
      this.events = []
    },
  },
})
