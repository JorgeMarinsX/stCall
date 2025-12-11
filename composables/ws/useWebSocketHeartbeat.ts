/**
 * useWebSocketHeartbeat - WebSocket Keep-Alive Management
 *
 * @description
 * Manages WebSocket heartbeat (ping/pong) to keep the connection alive.
 * Sends periodic ping messages and tracks pong responses.
 *
 * This composable follows SRP by focusing ONLY on heartbeat functionality.
 *
 * @example
 * ```typescript
 * const { startHeartbeat, stopHeartbeat } = useWebSocketHeartbeat()
 *
 * // Start sending pings every 30 seconds
 * startHeartbeat()
 *
 * // Stop heartbeat
 * stopHeartbeat()
 * ```
 */

import type { WebSocketMessage } from '~/types'

interface HeartbeatOptions {
  /** Interval between ping messages in milliseconds */
  interval?: number
}

export const useWebSocketHeartbeat = (options: HeartbeatOptions = {}) => {
  const { interval = 30000 } = options // Default: 30 seconds

  const asteriskStore = useAsteriskStore()

  /**
   * Start heartbeat interval
   * Sends ping every N seconds to keep connection alive
   */
  const startHeartbeat = (): void => {
    // Stop existing heartbeat first to avoid duplicates
    stopHeartbeat()

    // Send ping at regular intervals
    asteriskStore.heartbeatInterval = setInterval(() => {
      if (asteriskStore.isConnected) {
        sendPing()
      }
    }, interval)

    console.log(`💓 Heartbeat started (interval: ${interval}ms)`)
  }

  /**
   * Stop heartbeat interval
   * Called on disconnect or connection close
   */
  const stopHeartbeat = (): void => {
    if (asteriskStore.heartbeatInterval) {
      clearInterval(asteriskStore.heartbeatInterval)
      asteriskStore.heartbeatInterval = null
      console.log('💔 Heartbeat stopped')
    }
  }

  /**
   * Send ping message to server
   * Server should respond with pong
   */
  const sendPing = (): void => {
    if (asteriskStore.websocket && asteriskStore.isConnected) {
      const message: WebSocketMessage = { type: 'ping' }
      asteriskStore.websocket.send(JSON.stringify(message))
    }
  }

  /**
   * Handle pong response from server
   * Updates last pong timestamp
   */
  const handlePong = (): void => {
    asteriskStore.lastPongTime = Date.now()
  }

  return {
    startHeartbeat,
    stopHeartbeat,
    sendPing,
    handlePong
  }
}
