/**
 * useAsteriskEventHandler - Asterisk Event Processing
 *
 * @description
 * Processes Asterisk ARI events and system messages.
 * Routes events to appropriate stores (callStore) for state updates.
 *
 * This composable follows SRP by focusing ONLY on event processing logic.
 *
 * Supported events:
 * - StasisStart: New call entering application
 * - ChannelStateChange: Call state changed
 * - ChannelHangupRequest/StasisEnd: Call ended
 *
 * @example
 * ```typescript
 * const { handleEvent, handleSystemMessage } = useAsteriskEventHandler()
 *
 * // Process an Asterisk event
 * handleEvent({
 *   type: 'StasisStart',
 *   channel: { ... }
 * })
 *
 * // Process a system message
 * handleSystemMessage({
 *   severity: 'info',
 *   message: 'System notification'
 * })
 * ```
 */

import type { AsteriskEvent } from '~/types'
import { globalToast } from '~/utils/toastManager'

export const useAsteriskEventHandler = () => {
  const asteriskStore = useAsteriskStore()
  const callStore = useCallStore()

  /**
   * Handle Asterisk ARI event
   * Stores event and routes to callStore for state updates
   *
   * @param event - Asterisk ARI event data
   */
  const handleEvent = (event: any): void => {
    // Store event in history
    storeEventInHistory(event)

    // Log event
    console.log('📡 Asterisk event:', event.type, event)

    // Route event to appropriate handler
    routeEventToStore(event)
  }

  /**
   * Store event in history
   * Keeps last 100 events for debugging
   */
  const storeEventInHistory = (event: any): void => {
    asteriskStore.events.unshift({
      type: event.type || 'unknown',
      data: event,
      timestamp: new Date(),
    })

    // Keep only last 100 events
    if (asteriskStore.events.length > 100) {
      asteriskStore.events.pop()
    }
  }

  /**
   * Route event to appropriate store
   * Delegates event handling to callStore based on event type
   */
  const routeEventToStore = (event: any): void => {
    switch (event.type) {
      case 'StasisStart':
        // New call entering application
        handleStasisStart(event)
        break

      case 'ChannelStateChange':
        // Call state changed (Ring → Up, etc.)
        handleChannelStateChange(event)
        break

      case 'ChannelHangupRequest':
      case 'StasisEnd':
        // Call ended
        handleCallEnd(event)
        break

      default:
        // Log unknown events for debugging
        console.log('Unhandled event type:', event.type)
    }
  }

  /**
   * Handle StasisStart event
   * New call entering the application
   */
  const handleStasisStart = (event: any): void => {
    callStore.receiveIncomingCall({
      number: event.channel.caller.number,
      callerName: event.channel.caller.name,
      callId: event.channel.id
    })
  }

  /**
   * Handle ChannelStateChange event
   * Call state changed
   */
  const handleChannelStateChange = (event: any): void => {
    callStore.updateCallStatus(event.channel.id, event.channel.state)
  }

  /**
   * Handle call end events
   * ChannelHangupRequest or StasisEnd
   */
  const handleCallEnd = (event: any): void => {
    callStore.endCall(event.channel.id)
  }

  /**
   * Handle system message from server
   * Displays toast notification to user
   *
   * @param data - System message data
   */
  const handleSystemMessage = (data: any): void => {
    console.log('System message:', data)

    // Map severity from backend to toast methods
    const severity = data.severity === 'warning' ? 'warn' :
                     data.severity === 'error' ? 'error' :
                     data.severity === 'success' ? 'success' : 'info'

    const summary = severity === 'error' ? 'Erro' :
                   severity === 'warn' ? 'Atenção' : 'Informação'

    const life = severity === 'error' ? 10000 : 5000

    globalToast.add({
      severity,
      summary,
      detail: data.message,
      life
    })
  }

  return {
    handleEvent,
    handleSystemMessage
  }
}
