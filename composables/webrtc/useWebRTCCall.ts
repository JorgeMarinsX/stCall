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
    remoteName?: string
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
          break
      }
    })
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
      action: async () => {
        const inviter = new Inviter(state.userAgent.value as UserAgent, target, inviterOptions)
        state.currentSession.value = inviter

        setupSessionHandlers(inviter, 'outbound', number)

        // Create call state
        state.callState.value = {
          id: inviter.id,
          remoteNumber: number,
          state: 'ringing',
          direction: 'outbound',
          startTime: new Date(),
        }

        await inviter.invite()

        return inviter
      },
      successMessage: {
        title: 'Ligando',
        detail: `Chamando ${number}...`,
        life: 2000,
      },
      errorMessage: 'Erro ao ligar',
      onError: () => {
        state.currentSession.value = null
        state.callState.value = null
      },
      logPrefix: `WebRTC:Call:${number}`,
    })
  }

  /**
   * Answer an incoming call
   */
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

  /**
   * Reject an incoming call
   */
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

  /**
   * Hangup active call
   */
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

  /**
   * Hold/unhold call
   */
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

  /**
   * Handle incoming invitation
   * Called by UserAgent delegate when receiving incoming call
   */
  const handleIncomingInvitation = (invitation: any): void => {
    state.currentSession.value = invitation

    // Get caller info from SIP headers
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