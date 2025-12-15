import { Inviter, SessionState, UserAgent, URI } from 'sip.js'
import type { Session, InviterOptions } from 'sip.js'

export const useWebRTCCall = () => {
  const state = useWebRTCState()
  const media = useWebRTCMedia()
  const { execute } = useCommandExecutor()

  const setupSessionHandlers = (
    session: Session,
    direction: 'inbound' | 'outbound',
    remoteNumber: string,
    remoteName?: string,
    rejectHandler?: (reason: string) => void
  ): void => {
    session.stateChange.addListener((sessionState: SessionState) => {
      console.log(`📞 Call state changed: ${sessionState}`)

      if (!state.callState.value) return

      switch (sessionState) {
        case SessionState.Establishing:
          state.callState.value.state = 'ringing'
          break

        case SessionState.Established:
          state.callState.value.state = 'active'
          media.attachMediaStreams(session)
          break

        case SessionState.Terminated:
          state.callState.value.state = 'ended'
          media.cleanupStreams()
          state.currentSession.value = null
          state.callState.value = null

          const inviter = session as any
          if (inviter._response && inviter._response.statusCode >= 400 && rejectHandler) {
            const statusCode = inviter._response.statusCode
            const reasonPhrase = inviter._response.reasonPhrase
            const errorMessage = getSIPErrorMessage(statusCode, reasonPhrase)
            rejectHandler(errorMessage)
          }
          break
      }
    })
  }

  const getSIPErrorMessage = (statusCode: number, reasonPhrase?: string): string => {
    const errorMap: Record<number, string> = {
      400: 'Requisição inválida',
      403: 'Chamada não autorizada',
      404: 'Número não encontrado',
      408: 'Tempo de resposta esgotado',
      480: 'Destinatário temporariamente indisponível',
      486: 'Ocupado',
      487: 'Chamada cancelada',
      503: 'Serviço indisponível - verifique configuração do Asterisk',
      603: 'Chamada recusada',
    }

    return errorMap[statusCode] || reasonPhrase || `Erro ${statusCode}`
  }

  const call = async (number: string): Promise<void> => {
    if (!state.userAgent.value || !state.isRegistered.value) {
      throw new Error('WebRTC não registrado. Conecte-se primeiro.')
    }

    const target = new URI('sip', number, state.config.value?.domain || '')

    const inviterOptions: InviterOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false,
        }
      }
    }

    await execute({
      action: () => new Promise<void>((resolve, reject) => {
        state.rejectionError.value = null

        const inviter = new Inviter(state.userAgent.value as UserAgent, target, inviterOptions)
        state.currentSession.value = inviter

        setupSessionHandlers(inviter, 'outbound', number, undefined, (errorMessage: string) => {
          state.rejectionError.value = errorMessage
        })

        state.callState.value = {
          id: inviter.id,
          remoteNumber: number,
          state: 'ringing',
          direction: 'outbound',
          startTime: new Date(),
        }

        const stateListener = (newState: SessionState) => {
          if (newState === SessionState.Established) {
            inviter.stateChange.removeListener(stateListener)
            resolve()
          } else if (newState === SessionState.Terminated) {
            inviter.stateChange.removeListener(stateListener)
            // Always reject with a proper error message
            const errorMessage = state.rejectionError.value || 'Chamada não completada'
            reject(new Error(errorMessage))
          }
        }

        inviter.stateChange.addListener(stateListener)

        inviter.invite().catch((error) => {
          inviter.stateChange.removeListener(stateListener)
          const errorMessage = state.rejectionError.value || error.message || 'Erro ao enviar convite'
          reject(new Error(errorMessage))
        })
      }),
      successMessage: {
        title: 'Ligando',
        detail: `Chamando ${number}...`,
        life: 2000,
      },
      showErrorToast: true,
      errorMessage: {
        title: 'Erro ao ligar',
      },
      errorMessageExtractor: (error: any) => {
        if (state.rejectionError.value) {
          return state.rejectionError.value
        }
        return error.message || 'Erro desconhecido ao realizar chamada'
      },
      onError: () => {
        state.currentSession.value = null
        state.callState.value = null
      },
      logPrefix: `WebRTC:Call:${number}`,
    })
  }

  const answer = async (): Promise<void> => {
    if (!state.currentSession.value) {
      throw new Error('Nenhuma chamada para atender')
    }

    await execute({
      action: async () => {
        const session = state.currentSession.value as any

        await session.accept({
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false,
            }
          }
        })

        if (state.callState.value) {
          state.callState.value.state = 'active'
        }
      },
      successMessage: {
        title: 'Chamada atendida',
        detail: 'Você está conectado',
        life: 2000,
      },
      errorMessage: 'Erro ao atender',
      logPrefix: 'WebRTC:Answer',
    })
  }

  const reject = async (): Promise<void> => {
    if (!state.currentSession.value) {
      throw new Error('Nenhuma chamada para recusar')
    }

    await execute({
      action: async () => {
        const session = state.currentSession.value as any
        await session.reject()

        state.currentSession.value = null
        state.callState.value = null
      },
      successMessage: {
        title: 'Chamada recusada',
        detail: 'A chamada foi recusada',
        life: 2000,
      },
      errorMessage: 'Erro ao recusar',
      logPrefix: 'WebRTC:Reject',
    })
  }

  const hangup = async (): Promise<void> => {
    if (!state.currentSession.value) {
      console.warn('No active session to hangup')
      return
    }

    await execute({
      action: async () => {
        await state.currentSession.value!.bye()

        state.currentSession.value = null
        if (state.callState.value) {
          state.callState.value.state = 'ended'
        }

        media.cleanupStreams()
      },
      successMessage: {
        title: 'Chamada encerrada',
        detail: 'A chamada foi finalizada',
        life: 2000,
      },
      errorMessage: 'Erro ao encerrar',
      onError: () => {
        state.currentSession.value = null
        state.callState.value = null
        media.cleanupStreams()
      },
      logPrefix: 'WebRTC:Hangup',
    })
  }

  const setHold = async (enable: boolean): Promise<void> => {
    if (!state.currentSession.value) {
      console.warn('No active session to hold')
      return
    }

    await execute({
      action: async () => {
        const sessionDescriptionHandler = state.currentSession.value!.sessionDescriptionHandler as any

        if (enable) {
          await sessionDescriptionHandler.hold()
          if (state.callState.value) {
            state.callState.value.state = 'held'
          }
        } else {
          await sessionDescriptionHandler.unhold()
          if (state.callState.value) {
            state.callState.value.state = 'active'
          }
        }
      },
      successMessage: {
        title: enable ? 'Chamada em espera' : 'Chamada retomada',
        detail: enable ? 'O contato está em espera' : 'Chamada ativa',
        life: 2000,
      },
      errorMessage: 'Erro ao alternar espera',
      logPrefix: `WebRTC:${enable ? 'Hold' : 'Unhold'}`,
    })
  }

  const handleIncomingInvitation = (invitation: any): void => {
    state.currentSession.value = invitation

    const callerNumber = invitation.remoteIdentity.uri.user
    const callerName = invitation.remoteIdentity.displayName

    state.callState.value = {
      id: invitation.id,
      remoteNumber: callerNumber,
      remoteName: callerName || undefined,
      state: 'ringing',
      direction: 'inbound',
      startTime: new Date(),
    }

    setupSessionHandlers(invitation, 'inbound', callerNumber, callerName)

    console.log(`📞 Incoming call from ${callerName || callerNumber}`)

    globalToast.info('Chamada recebida', `De: ${callerName || callerNumber}`, 5000)
  }

  return {
    call,
    answer,
    reject,
    hangup,
    setHold,
    handleIncomingInvitation,
  }
}