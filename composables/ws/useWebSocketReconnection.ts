import type { Ref } from 'vue'

interface ReconnectionOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
}

export const useWebSocketReconnection = (options: ReconnectionOptions = {}) => {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    maxDelay = 30000
  } = options

  const asteriskStore = useAsteriskStore()
  const { handleReconnectAttempt, handleReconnectFailure } = useWebSocketErrors()

  const canReconnect = (): boolean => {
    return asteriskStore.reconnectAttempts < maxAttempts
  }

  const attemptReconnect = async (connectFn: (token: string) => Promise<void>): Promise<void> => {
    if (!canReconnect() || !asteriskStore.jwtToken) {
      console.error('Cannot reconnect: max attempts reached or no token')
      handleReconnectFailure()
      return
    }

    asteriskStore.isReconnecting = true
    asteriskStore.reconnectAttempts++

    handleReconnectAttempt(asteriskStore.reconnectAttempts, maxAttempts)

    const delay = Math.min(
      baseDelay * Math.pow(2, asteriskStore.reconnectAttempts),
      maxDelay
    )

    console.log(
      `Attempting reconnection in ${delay}ms (attempt ${asteriskStore.reconnectAttempts}/${maxAttempts})`
    )

    setTimeout(() => {
      if (asteriskStore.jwtToken) {
        connectFn(asteriskStore.jwtToken)
      }
    }, delay)
  }

  return {
    canReconnect,
    attemptReconnect
  }
}
