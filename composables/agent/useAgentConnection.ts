export const useAgentConnection = () => {
  const agentStore = useAgentStore()
  const authStore = useAuthStore()
  const callStore = useCallStore()
  const { executeAsteriskCommand } = useCommandExecutor()

  const connectToQueue = async (): Promise<void> => {
    await executeAsteriskCommand(
      'registerAgent',
      {
        agentId: authStore.user?.id,
        extension: authStore.user?.extension,
      },
      {
        successMessage: {
          title: 'Conectado',
          detail: 'Você está pronto para receber chamadas',
          life: 3000,
        },
        errorMessage: 'Erro ao conectar',
        onSuccess: () => {
          agentStore.setConnectedToQueue(true)
          agentStore.setStatus('available')
        },
        onError: () => {
          agentStore.setConnectedToQueue(false)
          agentStore.setStatus('offline')
        },
        logPrefix: `ConnectAgent:${authStore.user?.extension}`,
      }
    )
  }


  const disconnectFromQueue = async (): Promise<void> => {
    if (callStore.hasActiveCall) {
      console.warn('⚠️ Disconnecting while on active call')
    }

    await executeAsteriskCommand(
      'unregisterAgent',
      {
        agentId: authStore.user?.id,
      },
      {
        successMessage: {
          title: 'Desconectado',
          detail: 'Você não receberá mais chamadas',
          life: 3000,
        },
        errorMessage: 'Erro ao desconectar',
        onSuccess: () => {
          agentStore.setConnectedToQueue(false)
          agentStore.setStatus('offline')
        },
        logPrefix: `DisconnectAgent:${authStore.user?.extension}`,
      }
    )
  }

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
