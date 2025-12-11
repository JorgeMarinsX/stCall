/**
 * useWebSocketConnection - WebSocket Connection Lifecycle Management
 * Handles connection, event handlers, and cleanup.
 */

import type { WebSocketMessage } from '~/types'

interface WebSocketConnectionOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
}

export const useWebSocketConnection = (options: WebSocketConnectionOptions = {}) => {
  const asteriskStore = useAsteriskStore()
  const callStore = useCallStore()
  const { globalToast } = useGlobalToast()
  const { handleConnectionError } = useWebSocketErrors()
  const { execute } = useCommandExecutor()
  const { canReconnect, attemptReconnect } = useWebSocketReconnection(options)

  const connect = async (jwtToken: string): Promise<void> => {
    if (asteriskStore.websocket && asteriskStore.connectionStatus === 'connected') {
      console.warn('WebSocket already connected')
      return
    }

    asteriskStore.connectionStatus = 'connecting'
    asteriskStore.lastError = undefined
    asteriskStore.jwtToken = jwtToken

    await execute({
      action: async () => {
        const config = useRuntimeConfig()
        const wsUrl = `${config.public.wsUrl}/?token=${jwtToken}`
        console.log('Connecting to stCall WebSocket Server:', config.public.wsUrl)
        asteriskStore.websocket = new WebSocket(wsUrl)
        setupEventHandlers(asteriskStore.websocket)
        return { success: true }
      },
      errorMessage: 'Falha ao estabelecer conexão',
      logPrefix: 'WebSocket Connect',
      onError: (error) => {
        asteriskStore.connectionStatus = 'error'
        asteriskStore.lastError = error.message
      },
      showSuccessToast: false,
      showErrorToast: true
    })
  }
  const setupEventHandlers = (websocket: WebSocket): void => {
    websocket.onopen = handleOpen
    websocket.onmessage = handleMessage
    websocket.onerror = handleError
    websocket.onclose = handleClose
  }

  const handleOpen = (): void => {
    console.log('✅ WebSocket connected to stCall server')
    const wasReconnecting = asteriskStore.isReconnecting
    asteriskStore.connectionStatus = 'connected'
    asteriskStore.reconnectAttempts = 0
    asteriskStore.isReconnecting = false
    const { startHeartbeat } = useWebSocketHeartbeat()
    startHeartbeat()

    if (wasReconnecting) {
      globalToast.success(
        'Reconectado',
        'Conexão restabelecida com sucesso',
        3000
      )
    } else {
      globalToast.success(
        'Conectado',
        'Conexão estabelecida com sucesso',
        3000
      )
    }
  }

  const handleMessage = (event: MessageEvent): void => {
    execute({
      action: async () => {
        const message: WebSocketMessage = JSON.parse(event.data)
        const { routeMessage } = useWebSocketMessageRouter()
        routeMessage(message)
        return { success: true }
      },
      errorMessage: 'Falha ao processar mensagem do servidor',
      logPrefix: 'WebSocket Message',
      showErrorToast: false,
      rethrow: false
    })
  }

  const handleError = (error: Event): void => {
    console.error('❌ WebSocket error:', error)
    asteriskStore.connectionStatus = 'error'
    asteriskStore.lastError = 'Erro de conexão com o servidor'
    handleConnectionError(asteriskStore.lastError)
  }

  const handleClose = (event: CloseEvent): void => {
    console.log('WebSocket disconnected', event.code, event.reason)
    asteriskStore.connectionStatus = 'disconnected'
    asteriskStore.websocket = null

    const { stopHeartbeat } = useWebSocketHeartbeat()
    stopHeartbeat()
    const hadActiveCall = callStore.hasActiveCall
    if (hadActiveCall) {
      console.warn('Active call lost due to WebSocket disconnection')
      globalToast.error(
        'Conexão perdida',
        'Chamada ativa pode ter sido perdida. Tentando reconectar...',
        5000
      )
    } else {
      globalToast.warn(
        'Conexão perdida',
        'Tentando reconectar...',
        3000
      )
    }

    if (canReconnect() && !asteriskStore.isReconnecting && asteriskStore.jwtToken) {
      attemptReconnect(connect)
    }
  }
  const disconnect = (): void => {
    execute({
      action: async () => {
        if (asteriskStore.websocket) {
          asteriskStore.isReconnecting = false
          asteriskStore.websocket.close()
          asteriskStore.websocket = null
        }

        const { stopHeartbeat } = useWebSocketHeartbeat()
        stopHeartbeat()

        asteriskStore.connectionStatus = 'disconnected'
        asteriskStore.reconnectAttempts = 0
        asteriskStore.jwtToken = null

        asteriskStore.pendingCommands.forEach((pending) => {
          if (pending.timeoutId) {
            clearTimeout(pending.timeoutId)
          }
          pending.reject(new Error('WebSocket disconnected'))
        })
        asteriskStore.pendingCommands.clear()

        return { success: true }
      },
      logPrefix: 'WebSocket Disconnect',
      showSuccessToast: false,
      showErrorToast: false,
      rethrow: false
    })
  }

  return {
    connect,
    disconnect
  }
}