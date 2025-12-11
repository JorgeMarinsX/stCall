/**
 * useWebSocketMessageRouter - WebSocket Message Routing
 *
 * @description
 * Routes incoming WebSocket messages to appropriate handlers based on message type.
 * Acts as a central dispatcher for all WebSocket communication.
 *
 * This composable follows SRP by focusing ONLY on message routing logic.
 *
 * Supported message types:
 * - 'event': Asterisk ARI events → Routes to event handler
 * - 'system': Server notifications → Routes to system message handler
 * - 'pong': Heartbeat responses → Routes to heartbeat handler
 * - 'command_response': Command responses → Routes to command handler
 *
 * @example
 * ```typescript
 * const { routeMessage } = useWebSocketMessageRouter()
 *
 * // Route an incoming message
 * routeMessage({
 *   type: 'event',
 *   data: { type: 'StasisStart', ... }
 * })
 * ```
 */

import type { WebSocketMessage } from '~/types'

export const useWebSocketMessageRouter = () => {
  const asteriskStore = useAsteriskStore()

  /**
   * Route incoming message to appropriate handler
   * Central dispatcher for all WebSocket messages
   *
   * @param message - WebSocket message from server
   */
  const routeMessage = (message: WebSocketMessage): void => {
    switch (message.type) {
      case 'event':
        // Asterisk ARI event → Route to event handler
        routeToEventHandler(message.data)
        break

      case 'system':
        // Server notification → Route to system message handler
        routeToSystemHandler(message.data)
        break

      case 'pong':
        // Heartbeat response → Route to heartbeat handler
        routeToPongHandler()
        break

      case 'command_response':
        // Response to command we sent → Route to command handler
        routeToCommandHandler(message)
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  /**
   * Route to Asterisk event handler
   * Delegates to useAsteriskEventHandler composable
   */
  const routeToEventHandler = (data: any): void => {
    const { handleEvent } = useAsteriskEventHandler()
    handleEvent(data)
  }

  /**
   * Route to system message handler
   * Handles server notifications and system messages
   */
  const routeToSystemHandler = (data: any): void => {
    const { handleSystemMessage } = useAsteriskEventHandler()
    handleSystemMessage(data)
  }

  /**
   * Route to pong handler
   * Updates heartbeat timestamp
   */
  const routeToPongHandler = (): void => {
    const { handlePong } = useWebSocketHeartbeat()
    handlePong()
  }

  /**
   * Route to command response handler
   * Resolves/rejects pending command promises
   */
  const routeToCommandHandler = (message: WebSocketMessage): void => {
    handleCommandResponse(message)
  }

  /**
   * Handle command response
   * Resolves or rejects the pending promise
   * (Kept here temporarily until command execution is extracted)
   */
  const handleCommandResponse = (message: WebSocketMessage): void => {
    if (!message.requestId) return

    const pending = asteriskStore.pendingCommands.get(message.requestId)
    if (pending) {
      // Clear timeout to prevent memory leak
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId)
      }

      if (message.data?.success) {
        pending.resolve(message.data.result)
      } else {
        // Log technical error if available
        if (message.data?.technicalError) {
          console.error('[Command Failed] Technical error:', message.data.technicalError)
        }

        const error = new Error(message.data?.error || 'Comando falhou')
        // Attach technical error for debugging
        if (message.data?.technicalError) {
          (error as any).technicalError = message.data.technicalError
        }
        pending.reject(error)
      }
      asteriskStore.pendingCommands.delete(message.requestId)
    }
  }

  return {
    routeMessage
  }
}
