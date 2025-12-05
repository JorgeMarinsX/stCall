/**
 * useWebSocketErrors - Centralized error handling composable for WebSocket operations
 *
 * @description
 * Provides standardized error handling and user notifications for WebSocket-related errors.
 * Includes connection errors, command errors, and automatic reconnection feedback.
 *
 * @example
 * ```typescript
 * const { handleConnectionError, handleCommandError, handleReconnectAttempt } = useWebSocketErrors()
 *
 * // On connection failure
 * handleConnectionError('Failed to connect to server')
 *
 * // On command failure
 * handleCommandError('originate', 'Channel not found')
 *
 * // On reconnection attempt
 * handleReconnectAttempt(3, 5)
 * ```
 */
export function useWebSocketErrors() {
  const toast = useToast()

  /**
   * Handle WebSocket connection errors
   * Shows error toast with connection-specific messaging
   */
  const handleConnectionError = (error: string) => {
    toast.add({
      severity: 'error',
      summary: 'Erro de Conexão',
      detail: error || 'Falha ao conectar ao servidor WebSocket',
      life: 5000
    })
  }

  /**
   * Handle command execution errors
   * Shows error toast with action-specific context
   */
  const handleCommandError = (action: string, error: string) => {
    // Map action names to user-friendly Portuguese
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

    toast.add({
      severity: 'error',
      summary: `Falha: ${friendlyAction}`,
      detail: error || 'Ocorreu um erro ao executar a operação',
      life: 5000
    })
  }

  /**
   * Handle reconnection attempts
   * Shows info toast about reconnection progress
   */
  const handleReconnectAttempt = (attempt: number, maxAttempts: number) => {
    toast.add({
      severity: 'info',
      summary: 'Reconectando',
      detail: `Tentativa ${attempt} de ${maxAttempts}...`,
      life: 3000
    })
  }

  /**
   * Handle successful reconnection
   * Shows success toast
   */
  const handleReconnectSuccess = () => {
    toast.add({
      severity: 'success',
      summary: 'Reconectado',
      detail: 'Conexão restabelecida com sucesso',
      life: 3000
    })
  }

  /**
   * Handle reconnection failure (max attempts reached)
   * Shows critical error toast with action instructions
   */
  const handleReconnectFailure = () => {
    toast.add({
      severity: 'error',
      summary: 'Falha na Reconexão',
      detail: 'Não foi possível restabelecer a conexão. Por favor, recarregue a página ou faça login novamente.',
      life: 0 // Don't auto-dismiss
    })
  }

  /**
   * Handle WebSocket timeout errors
   * Shows warning toast for slow responses
   */
  const handleTimeout = (operation: string) => {
    toast.add({
      severity: 'warn',
      summary: 'Timeout',
      detail: `A operação "${operation}" demorou muito para responder. Tente novamente.`,
      life: 5000
    })
  }

  /**
   * Handle authentication errors
   * Shows error toast with login suggestion
   */
  const handleAuthError = () => {
    toast.add({
      severity: 'error',
      summary: 'Erro de Autenticação',
      detail: 'Sua sessão expirou. Por favor, faça login novamente.',
      life: 0 // Don't auto-dismiss
    })
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
