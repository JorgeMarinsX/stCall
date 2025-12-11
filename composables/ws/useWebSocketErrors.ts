export function useWebSocketErrors() {
  const { globalToast } = useGlobalToast()

  /**
   * Handle WebSocket connection errors
   * Shows error toast with connection-specific messaging
   */
  const handleConnectionError = (error: string) => {
    globalToast.error(
      'Erro de Conexão',
      error || 'Falha ao conectar ao servidor WebSocket',
      5000
    )
  }

  const handleCommandError = (action: string, error: string) => {
    const actionNames: Record<string, string> = {
      'originate': 'Iniciar chamada',
      'answer': 'Atender chamada',
      'hangup': 'Encerrar chamada',
      'mute': 'Silenciar',
      'unmute': 'Ativar microfone',
      'hold': 'Colocar em espera',
      'unhold': 'Retomar chamada',
      'redirect': 'Transferir chamada',
      'registerAgent': 'Conectar ao sistema',
      'unregisterAgent': 'Desconectar do sistema'
    }

    const friendlyAction = actionNames[action] || action

    globalToast.error(
      `Falha: ${friendlyAction}`,
      error || 'Ocorreu um erro ao executar a operação',
      5000
    )
  }

  const handleReconnectAttempt = (attempt: number, maxAttempts: number) => {
    globalToast.info(
      'Reconectando',
      `Tentativa ${attempt} de ${maxAttempts}...`,
      3000
    )
  }

  const handleReconnectSuccess = () => {
    globalToast.success(
      'Reconectado',
      'Conexão restabelecida com sucesso',
      3000
    )
  }

  const handleReconnectFailure = () => {
    globalToast.error(
      'Falha na Reconexão',
      'Não foi possível restabelecer a conexão. Por favor, recarregue a página ou faça login novamente.',
      0 
    )
  }

  const handleTimeout = (operation: string) => {
    globalToast.warn(
      'Timeout',
      `A operação "${operation}" demorou muito para responder. Tente novamente.`,
      5000
    )
  }

  const handleAuthError = () => {
    globalToast.error(
      'Erro de Autenticação',
      'Sua sessão expirou. Por favor, faça login novamente.',
      0 
    )
  }

  return {
    handleConnectionError,
    handleCommandError,
    handleReconnectAttempt,
    handleReconnectSuccess,
    handleReconnectFailure,
    handleTimeout,
    handleAuthError
  }
}
