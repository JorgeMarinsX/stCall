/**
 * useWebSocketCommands - WebSocket Command Execution
 *
 * @description
 * Manages command execution over WebSocket with promise-based API.
 * Handles request/response correlation, timeouts, and error handling.
 *
 * This composable follows SRP by focusing ONLY on command execution logic.
 *
 * Flow:
 * 1. Create unique requestId
 * 2. Store promise resolve/reject in pending map
 * 3. Send command via WebSocket
 * 4. Wait for response with timeout
 * 5. Resolve/reject promise based on response
 *
 * @example
 * ```typescript
 * const { sendCommand } = useWebSocketCommands()
 *
 * // Execute a command
 * const result = await sendCommand('originate', {
 *   endpoint: 'PJSIP/1001',
 *   context: 'from-internal'
 * })
 * ```
 */

import type { WebSocketMessage } from '~/types'

interface CommandOptions {
  timeout?: number
}

export const useWebSocketCommands = () => {
  const asteriskStore = useAsteriskStore()
  const { handleTimeout, handleConnectionError } = useWebSocketErrors()

  /**
   * Send command via WebSocket
   * Returns promise that resolves when server responds
   *
   * @param action - Command action name (e.g., 'originate', 'answer')
   * @param params - Command parameters
   * @param options - Command options (timeout, etc.)
   * @returns Promise with command result
   */
  const sendCommand = (
    action: string,
    params: any,
    options: CommandOptions = {}
  ): Promise<any> => {
    const { timeout = 10000 } = options

    return new Promise((resolve, reject) => {
      // Check connection
      if (!asteriskStore.isConnected) {
        const error = new Error('WebSocket não conectado')
        handleConnectionError('Não foi possível executar o comando: WebSocket desconectado')
        reject(error)
        return
      }

      // Generate unique request ID
      const requestId = generateRequestId()

      // Setup timeout
      const timeoutId = setTimeout(() => {
        if (asteriskStore.pendingCommands.has(requestId)) {
          asteriskStore.pendingCommands.delete(requestId)
          handleTimeout(action)
          reject(new Error('Comando expirou (timeout)'))
        }
      }, timeout)

      // Store pending command
      asteriskStore.pendingCommands.set(requestId, {
        resolve,
        reject,
        timeoutId
      })

      // Build message
      const message: WebSocketMessage = {
        type: 'command',
        requestId,
        data: { action, params }
      }

      // Send via WebSocket
      sendMessage(message)
    })
  }

  /**
   * Send message via WebSocket
   * Internal helper
   */
  const sendMessage = (message: WebSocketMessage): void => {
    if (asteriskStore.websocket && asteriskStore.isConnected) {
      asteriskStore.websocket.send(JSON.stringify(message))
    } else {
      console.error('Cannot send message: WebSocket not connected')
    }
  }

  /**
   * Generate unique request ID
   * Format: timestamp-randomString
   */
  const generateRequestId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  return {
    sendCommand
  }
}
