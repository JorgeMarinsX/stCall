/**
 * useWebSocketErrors - Centralized error handling composable for WebSocket operations
 *
 * @description
 * Provides standardized error handling and user notifications for WebSocket-related errors.
 * Includes connection errors, command errors, and automatic reconnection feedback.
 *
 * Uses the global toast manager to work both inside and outside component context.
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

    globalToast.error(
      `Falha: ${friendlyAction}`,
      error || 'Ocorreu um erro ao executar a operação',
      5000
    )
  }

  /**
   * Handle reconnection attempts
   * Shows info toast about reconnection progress
   */
  const handleReconnectAttempt = (attempt: number, maxAttempts: number) => {
    globalToast.info(
      'Reconectando',
      `Tentativa ${attempt} de ${maxAttempts}...`,
      3000
    )
  }

  /**
   * Handle successful reconnection
   * Shows success toast
   */
  const handleReconnectSuccess = () => {
    globalToast.success(
      'Reconectado',
      'Conexão restabelecida com sucesso',
      3000
    )
  }

  /**
   * Handle reconnection failure (max attempts reached)
   * Shows critical error toast with action instructions
   */
  const handleReconnectFailure = () => {
    globalToast.error(
      'Falha na Reconexão',
      'Não foi possível restabelecer a conexão. Por favor, recarregue a página ou faça login novamente.',
      0 // Don't auto-dismiss
    )
  }

  /**
   * Handle WebSocket timeout errors
   * Shows warning toast for slow responses
   */
  const handleTimeout = (operation: string) => {
    globalToast.warn(
      'Timeout',
      `A operação "${operation}" demorou muito para responder. Tente novamente.`,
      5000
    )
  }

  /**
   * Handle authentication errors
   * Shows error toast with login suggestion
   */
  const handleAuthError = () => {
    globalToast.error(
      'Erro de Autenticação',
      'Sua sessão expirou. Por favor, faça login novamente.',
      0 // Don't auto-dismiss
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
