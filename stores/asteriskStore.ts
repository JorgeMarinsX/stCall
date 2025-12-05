import { defineStore } from 'pinia'
import type { ConnectionStatus, PendingCommand, WebSocketMessage, AsteriskEvent } from '~/types'

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
    heartbeatInterval: null as ReturnType<typeof setInterval> | null,
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

        // Get toast instance before setting up callbacks (only on client)
        let toast: any = null
        if (import.meta.client) {
          try {
            toast = useToast()
          } catch (e) {
            console.warn('Toast not available in this context')
          }
        }

        this.websocket = new WebSocket(wsUrl)

        this.websocket.onopen = () => {
          console.log('✅ WebSocket connected to stCall server')
          const wasReconnecting = this.isReconnecting

          this.connectionStatus = 'connected'
          this.reconnectAttempts = 0
          this.isReconnecting = false

          // Start heartbeat
          this.startHeartbeat()

          // Show appropriate success notification
          if (wasReconnecting) {
            const { handleReconnectSuccess } = useWebSocketErrors()
            handleReconnectSuccess()
          } else if (toast) {
            toast.add({
              severity: 'success',
              summary: 'Conectado',
              detail: 'Conexão estabelecida com sucesso',
              life: 3000
            })
          }
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

          // Notify user of connection error
          const { handleConnectionError } = useWebSocketErrors()
          handleConnectionError(this.lastError)
        }

        this.websocket.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason)
          this.connectionStatus = 'disconnected'
          this.websocket = null

          // Stop heartbeat
          this.stopHeartbeat()

          // Check if there was an active call - warn user
          const callStore = useCallStore()
          const hadActiveCall = callStore.hasActiveCall

          // Clear active call state on disconnect (prevents stale data)
          if (hadActiveCall) {
            console.warn('Active call lost due to WebSocket disconnection')
            // Don't clear the call here - let callStore handle it
            // But warn the user
          }

          // Show notification (toast already captured above)
          if (toast) {
            if (hadActiveCall) {
              toast.add({
                severity: 'error',
                summary: 'Conexão perdida',
                detail: 'Chamada ativa pode ter sido perdida. Tentando reconectar...',
                life: 5000
              })
            } else {
              toast.add({
                severity: 'warn',
                summary: 'Conexão perdida',
                detail: 'Tentando reconectar...',
                life: 3000
              })
            }
          }

          // Auto-reconnect logic
          if (this.canReconnect && !this.isReconnecting && this.jwtToken) {
            this.attemptReconnect()
          }
        }
      } catch (error: any) {
        console.error('Failed to connect:', error)
        this.connectionStatus = 'error'
        this.lastError = error.message || 'Falha ao estabelecer conexão'

        // Try to get toast instance for error notification
        if (import.meta.client) {
          try {
            const toast = useToast()
            toast.add({
              severity: 'error',
              summary: 'Erro de conexão',
              detail: this.lastError,
              life: 5000
            })
          } catch (e) {
            console.error('Could not show toast notification:', e)
          }
        }
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

      // Reject all pending commands and clear their timeouts to prevent memory leaks
      this.pendingCommands.forEach((pending) => {
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId)
        }
        pending.reject(new Error('WebSocket disconnected'))
      })
      this.pendingCommands.clear()
    },

    async attemptReconnect() {
      if (!this.canReconnect || !this.jwtToken) {
        console.error('Cannot reconnect: max attempts reached or no token')

        // Notify user that reconnection failed
        const { handleReconnectFailure } = useWebSocketErrors()
        handleReconnectFailure()
        return
      }

      this.isReconnecting = true
      this.reconnectAttempts++

      // Notify user about reconnection attempt
      const { handleReconnectAttempt } = useWebSocketErrors()
      handleReconnectAttempt(this.reconnectAttempts, this.maxReconnectAttempts)

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
          // Server notification - display to user
          this.handleSystemMessage(message.data)
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
          callStore.endCall(event.channel.id)
          break

        default:
          // Log unknown events for debugging
          console.log('Unhandled event type:', event.type)
      }
    },

    sendCommand(action: string, params: any): Promise<any> {
      return new Promise((resolve, reject) => {
        if (!this.isConnected) {
          const error = new Error('WebSocket não conectado')
          const { handleConnectionError } = useWebSocketErrors()
          handleConnectionError('Não foi possível executar o comando: WebSocket desconectado')
          reject(error)
          return
        }

        // Generate unique request ID
        const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

        // Timeout after 10 seconds (store timeout ID to clear it on success)
        const timeoutId = setTimeout(() => {
          if (this.pendingCommands.has(requestId)) {
            this.pendingCommands.delete(requestId)
            const { handleTimeout } = useWebSocketErrors()
            handleTimeout(action)
            reject(new Error('Comando expirou (timeout)'))
          }
        }, 10000)

        // Store pending request with timeout ID
        this.pendingCommands.set(requestId, { resolve, reject, timeoutId })

        // Send command
        const message: WebSocketMessage = {
          type: 'command',
          requestId,
          data: { action, params }
        }

        this.sendMessage(message)
      })
    },

    handleCommandResponse(message: WebSocketMessage) {
      if (!message.requestId) return

      const pending = this.pendingCommands.get(message.requestId)
      if (pending) {
        // Clear timeout to prevent memory leak
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId)
        }

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

    handleSystemMessage(data: any) {
      console.log('System message:', data)

      // Display system messages as toast notifications (only on client)
      if (import.meta.client) {
        try {
          const toast = useToast()

          // Map severity from backend to PrimeVue toast severity
          let severity: 'success' | 'info' | 'warn' | 'error' = 'info'
          if (data.severity === 'warning') {
            severity = 'warn'
          } else if (data.severity === 'error') {
            severity = 'error'
          } else if (data.severity === 'success') {
            severity = 'success'
          }

          // Show toast notification
          toast.add({
            severity,
            summary: severity === 'error' ? 'Erro' : severity === 'warn' ? 'Atenção' : 'Informação',
            detail: data.message,
            life: severity === 'error' ? 10000 : 5000, // Errors stay longer
          })
        } catch (e) {
          console.error('Could not show system message toast:', e)
        }
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
