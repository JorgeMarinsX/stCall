/**
 * Main composable for handling WebSocket operations
 * Wraps asteriskStore methods and provides retry functionality
 * Similar to useCallHandler pattern for calls
 */
export const useWebSocketHandler = () => {
  const asteriskStore = useAsteriskStore()
  const authStore = useAuthStore()
  const { globalToast } = useGlobalToast()

  /**
   * Retry WebSocket connection manually
   * Resets reconnection attempts and tries to connect with stored token
   */
  const retryWebSocketConnection = async (): Promise<void> => {
    try {
      // Reset reconnection attempts to allow retry
      asteriskStore.reconnectAttempts = 0
      asteriskStore.isReconnecting = false

      // Get fresh token from auth store
      const tokenFromStore = authStore.token
      const tokenFromStorage = localStorage.getItem('auth_token')
      const token = tokenFromStore || tokenFromStorage

      if (!token) {
        globalToast.error('Token não encontrado. Faça o login novamente')
        return
      }

      globalToast.info('Reconectando', 'Tentando reconectar ao WebSocket...', 2000)

      // Disconnect first if needed
      if (asteriskStore.websocket) {
        asteriskStore.disconnect()
        // Wait a moment before reconnecting
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Reconnect with the token
      await asteriskStore.connect(token)
    } catch (error: any) {
      console.error('Manual reconnection failed:', error)
      globalToast.error('Falha ao reconectar', error.message)
      throw error
    }
  }

  return {
    retryWebSocketConnection,
  }
}
