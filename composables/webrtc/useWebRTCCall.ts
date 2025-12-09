import { Inviter, SessionState, UserAgent, URI } from 'sip.js'
import type { Session, InviterOptions } from 'sip.js'

/**
 * WebRTC Call Operations
 * Handles making calls, answering, rejecting, hanging up, and hold
 * RESPONSIBILITY: Call lifecycle and call control operations
 */

export const useWebRTCCall = () => {
  const state = useWebRTCState()
  const media = useWebRTCMedia()
  const { globalToast } = useGlobalToast()

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

  /**
   * Make an outbound call
   */
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

    try {
      // Create Inviter (outbound session)
      const inviter = new Inviter(state.userAgent.value as UserAgent, target, inviterOptions)
      state.currentSession.value = inviter

      // Setup handlers
      setupSessionHandlers(inviter, 'outbound', number)

      // Create call state
      state.callState.value = {
        id: inviter.id,
        remoteNumber: number,
        state: 'ringing',
        direction: 'outbound',
        startTime: new Date(),
      }

      // Send INVITE
      await inviter.invite()

      console.log(`📞 Calling ${number}...`)

      globalToast.info('Ligando', `Chamando ${number}...`, 2000)
    } catch (error: any) {
      console.error('Failed to make call:', error)
      state.currentSession.value = null
      state.callState.value = null

      globalToast.error('Erro ao ligar', error.message || 'Falha ao iniciar chamada')
      throw error
    }
  }

  /**
   * Answer an incoming call
   */
  const answer = async (): Promise<void> => {
    if (!state.currentSession.value) {
      throw new Error('Nenhuma chamada para atender')
    }

    try {
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

      console.log('✅ Call answered')

      globalToast.success('Chamada atendida', 'Você está conectado', 2000)
    } catch (error: any) {
      console.error('Failed to answer call:', error)
      globalToast.error('Erro ao atender', error.message || 'Falha ao atender chamada')
      throw error
    }
  }

  /**
   * Reject an incoming call
   */
  const reject = async (): Promise<void> => {
    if (!state.currentSession.value) {
      throw new Error('Nenhuma chamada para recusar')
    }

    try {
      const session = state.currentSession.value as any
      await session.reject()

      state.currentSession.value = null
      state.callState.value = null

      console.log('❌ Call rejected')

      globalToast.info('Chamada recusada', 'A chamada foi recusada', 2000)
    } catch (error: any) {
      console.error('Failed to reject call:', error)
      throw error
    }
  }

  /**
   * Hangup active call
   */
  const hangup = async (): Promise<void> => {
    if (!state.currentSession.value) {
      console.warn('No active session to hangup')
      return
    }

    try {
      await state.currentSession.value.bye()

      state.currentSession.value = null
      if (state.callState.value) {
        state.callState.value.state = 'ended'
      }

      media.cleanupStreams()

      console.log('✅ Call ended')

      globalToast.info('Chamada encerrada', 'A chamada foi finalizada', 2000)
    } catch (error: any) {
      console.error('Failed to hangup:', error)
      // Still cleanup even if hangup fails
      state.currentSession.value = null
      state.callState.value = null
      media.cleanupStreams()
    }
  }

  /**
   * Hold/unhold call
   */
  const setHold = async (enable: boolean): Promise<void> => {
    if (!state.currentSession.value) {
      console.warn('No active session to hold')
      return
    }

    try {
      const sessionDescriptionHandler = state.currentSession.value.sessionDescriptionHandler as any

      if (enable) {
        await sessionDescriptionHandler.hold()
        if (state.callState.value) {
          state.callState.value.state = 'held'
        }
        globalToast.info('Chamada em espera', 'O contato está em espera', 2000)
      } else {
        await sessionDescriptionHandler.unhold()
        if (state.callState.value) {
          state.callState.value.state = 'active'
        }
        globalToast.info('Chamada retomada', 'Chamada ativa', 2000)
      }

      console.log(`📞 Call ${enable ? 'on hold' : 'resumed'}`)
    } catch (error: any) {
      console.error('Failed to toggle hold:', error)
      globalToast.error('Erro ao alternar espera', error.message)
      throw error
    }
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
