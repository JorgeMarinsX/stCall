/**
 * Composable for handling agent queue connection/disconnection
 * Implements business logic for connecting agents to receive calls
 */
export const useAgentConnection = () => {
  const agentStore = useAgentStore()
  const asteriskStore = useAsteriskStore()
  const authStore = useAuthStore()
  const callStore = useCallStore()
  const { globalToast } = useGlobalToast()

  /**
   * Connect agent to queue to start receiving calls
   */
  const connectToQueue = async (): Promise<void> => {
    try {
      // Register agent to receive calls via WebSocket
      await asteriskStore.sendCommand('registerAgent', {
        agentId: authStore.user?.id,
        extension: authStore.user?.extension,
      })

      agentStore.setConnectedToQueue(true)
      agentStore.setStatus('available')

      console.log('✅ Agent connected to queue, extension:', authStore.user?.extension)

      globalToast.success('Conectado', 'Você está pronto para receber chamadas')
    } catch (error: any) {
      console.error('❌ Failed to connect to queue:', error)

      agentStore.setConnectedToQueue(false)
      agentStore.setStatus('offline')

      globalToast.error('Erro ao conectar', error.message || 'Falha ao conectar na fila')

      throw error
    }
  }

  /**
   * Disconnect agent from queue to stop receiving calls
   */
  const disconnectFromQueue = async (): Promise<void> => {
    try {
      // Check if there's an active call - warn but allow disconnect
      if (callStore.hasActiveCall) {
        console.warn('⚠️ Disconnecting while on active call')
      }

      // Unregister agent from receiving calls
      await asteriskStore.sendCommand('unregisterAgent', {
        agentId: authStore.user?.id,
      })

      agentStore.setConnectedToQueue(false)
      agentStore.setStatus('offline')

      console.log('✅ Agent disconnected from queue')

      globalToast.info('Desconectado', 'Você não receberá mais chamadas')
    } catch (error: any) {
      console.error('❌ Failed to disconnect from queue:', error)

      globalToast.error('Erro ao desconectar', error.message || 'Falha ao desconectar da fila')

      throw error
    }
  }

  /**
   * Toggle connection status (convenience method)
   */
  const toggleConnection = async (): Promise<void> => {
    if (agentStore.isConnectedToQueue) {
      await disconnectFromQueue()
    } else {
      await connectToQueue()
    }
  }

  return {
    connectToQueue,
    disconnectFromQueue,
    toggleConnection,
  }
}
