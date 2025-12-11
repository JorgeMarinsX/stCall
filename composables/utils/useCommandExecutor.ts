
export interface ExecuteOptions {
  action: () => Promise<any>
  successMessage?: string | { title: string; detail?: string; life?: number }
  errorMessage?: string | { title: string; detail?: string; life?: number }
  onSuccess?: (result: any) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
  logPrefix?: string
  showSuccessToast?: boolean
  showErrorToast?: boolean
  rethrow?: boolean
  errorMessageExtractor?: (error: any) => string
}

export const useCommandExecutor = () => {
  const { globalToast } = useGlobalToast()

  const execute = async <T = any>(options: ExecuteOptions): Promise<T | null> => {
    const {
      action,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      logPrefix = 'Command',
      showSuccessToast = !!successMessage,
      showErrorToast = true,
      rethrow = true,
      errorMessageExtractor = (error) => error.message || 'Erro desconhecido',
    } = options

    try {
      console.log(`🔄 [${logPrefix}] Executing...`)

      const result = await action()

      console.log(`✅ [${logPrefix}] Success`, result)

      if (showSuccessToast && successMessage) {
        if (typeof successMessage === 'string') {
          globalToast.success('Sucesso', successMessage, 3000)
        } else {
          globalToast.success(
            successMessage.title,
            successMessage.detail,
            successMessage.life || 3000
          )
        }
      }

      if (onSuccess) {
        await onSuccess(result)
      }

      return result
    } catch (error: any) {
      console.error(`❌ [${logPrefix}] Failed:`, error)

      if (error.technicalError) {
        console.error(`[${logPrefix}] Technical error:`, error.technicalError)
      }

      const extractedErrorMessage = errorMessageExtractor(error)

      if (showErrorToast) {
        if (errorMessage) {
          if (typeof errorMessage === 'string') {
            globalToast.error('Erro', errorMessage, 5000)
          } else {
            globalToast.error(
              errorMessage.title,
              errorMessage.detail || extractedErrorMessage,
              errorMessage.life || 5000
            )
          }
        } else {
          globalToast.error('Erro', extractedErrorMessage, 5000)
        }
      }

      if (onError) {
        await onError(error)
      }

      if (rethrow) {
        throw error
      }

      return null
    }
  }

  const executeAsteriskCommand = async <T = any>(
    action: string,
    params: any,
    options: Omit<ExecuteOptions, 'action'> = {}
  ): Promise<T | null> => {
    const asteriskStore = useAsteriskStore()

    return execute<T>({
      action: () => asteriskStore.sendCommand(action, params),
      logPrefix: `Asterisk:${action}`,
      ...options,
    })
  }

  return {
    execute,
    executeAsteriskCommand,
  }
}