export const useAgentConnection = () => {
  const agentStore = useAgentStore()
  const authStore = useAuthStore()
  const callStore = useCallStore()
  const phone = useWebRTCPhone()
  const config = useRuntimeConfig()
  const { execute, executeAsteriskCommand } = useCommandExecutor()

  const connectToQueue = async (): Promise<void> => {
    await execute({
      action: async () => {
        const user = authStore.user
        if (!user?.extension || !user?.sipPassword) {
          console.error('❌ Missing SIP credentials:', { hasUser: !!user, hasExtension: !!user?.extension, hasSipPassword: !!user?.sipPassword })
          throw new Error('Falta extensão ou senha SIP no perfil do usuário')
        }

        const { extension, sipPassword, name, id } = user
        console.log('🔄 Starting connection process...', { extension, id })

        await phone.register({
          wsServer: config.public.webrtcWssUrl,
          domain: config.public.webrtcDomain,
          username: extension,
          password: sipPassword,
          displayName: name,
        })

        await executeAsteriskCommand(
          'registerAgent',
          {
            agentId: id,
            extension,
          },
          {
            successMessage: {
              title: 'Conectado',
              detail: 'Você está pronto para receber chamadas',
              life: 3000,
            },
            errorMessage: 'Erro ao conectar à fila',
            onSuccess: () => {
              agentStore.setConnectedToQueue(true)
              agentStore.setStatus('available')
            },
            onError: async () => {
              console.error('❌ Agent registration failed - cleaning up WebRTC')
              agentStore.setConnectedToQueue(false)
              agentStore.setStatus('offline')
              await phone.unregister()
            },
            logPrefix: `ConnectAgent:${extension}`,
            rethrow: true,
          }
        )

        return { success: true }
      },
      errorMessage: 'Erro ao conectar',
      logPrefix: 'Connect to Queue',
      showSuccessToast: false,
      rethrow: false,
      onError: () => {
        agentStore.setConnectedToQueue(false)
        agentStore.setStatus('offline')
      }
    })
  }

  const disconnectFromQueue = async (): Promise<void> => {
    await execute({
      action: async () => {
        if (callStore.hasActiveCall) {
          console.warn('⚠️ Disconnecting while on active call')
        }

        console.log('🔄 Starting disconnection process...')

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
            rethrow: false,
          }
        )

        await phone.unregister()

        return { success: true }
      },
      logPrefix: 'Disconnect from Queue',
      showSuccessToast: false,
      showErrorToast: false,
      rethrow: false,
      onError: () => {
        agentStore.setConnectedToQueue(false)
        agentStore.setStatus('offline')
      }
    })
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