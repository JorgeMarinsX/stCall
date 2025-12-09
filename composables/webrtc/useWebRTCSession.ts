import { UserAgent, Registerer, SessionState, URI } from 'sip.js'
import type { UserAgentOptions, RegistererOptions } from 'sip.js'

/**
 * WebRTC Session Management
 * Handles SIP registration and UserAgent lifecycle
 * RESPONSIBILITY: Connect, register, disconnect from Asterisk PJSIP
 */

/**
 * Build ICE servers from runtime config
 */
const buildIceServers = (): RTCIceServer[] => {
  const config = useRuntimeConfig()
  const iceServers: RTCIceServer[] = []

  // Always add STUN server
  if (config.public.webrtcStunServer) {
    iceServers.push({ urls: config.public.webrtcStunServer })
  }

  // Add TURN server if configured
  if (config.public.webrtcTurnServer) {
    iceServers.push({
      urls: config.public.webrtcTurnServer,
      username: config.public.webrtcTurnUsername,
      credential: config.public.webrtcTurnPassword,
    })
  }

  return iceServers
}

export const useWebRTCSession = () => {
  const state = useWebRTCState()
  const { globalToast } = useGlobalToast()

  /**
   * Register to Asterisk PJSIP WebRTC endpoint
   */
  const register = async (config: {
    wsServer: string
    domain: string
    username: string
    password: string
    displayName?: string
  }): Promise<void> => {
    try {
      // Store config for potential reconnection
      state.config.value = config

      const uri = new URI('sip', config.username, config.domain)

      const userAgentOptions: UserAgentOptions = {
        uri,
        transportOptions: {
          server: config.wsServer,
          connectionTimeout: 5,
        },
        authorizationUsername: config.username,
        authorizationPassword: config.password,
        displayName: config.displayName || config.username,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: buildIceServers()
          }
        },
        delegate: {
          onInvite: (invitation) => {
            // Handle incoming call - delegate to call handler
            const callHandler = useWebRTCCall()
            callHandler.handleIncomingInvitation(invitation)
          },
          onConnect: () => {
            console.log('✅ WebRTC UserAgent connected')
          },
          onDisconnect: (error) => {
            console.warn('⚠️ WebRTC UserAgent disconnected', error)
            state.isRegistered.value = false

            globalToast.warn(
              'WebRTC desconectado',
              'Conexão WebRTC perdida',
              3000
            )
          }
        }
      }

      // Create and start UserAgent
      state.userAgent.value = new UserAgent(userAgentOptions)
      await state.userAgent.value.start()

      // Create and register
      const registererOptions: RegistererOptions = {
        expires: 300, // Re-register every 5 minutes
      }

      state.registerer.value = new Registerer(state.userAgent.value as UserAgent, registererOptions)
      await state.registerer.value.register()

      state.isRegistered.value = true
      state.registrationError.value = null

      console.log(`✅ WebRTC registered as ${config.username}@${config.domain}`)

      globalToast.success(
        'WebRTC conectado',
        `Registrado como ${config.username}`,
        3000
      )
    } catch (error: any) {
      console.error('❌ WebRTC registration failed:', error)
      state.registrationError.value = error.message || 'Falha ao registrar WebRTC'
      state.isRegistered.value = false

      globalToast.error(
        'Erro WebRTC',
        `Falha ao conectar: ${error.message}`,
        5000
      )

      throw error
    }
  }

  /**
   * Unregister and disconnect from Asterisk
   */
  const unregister = async (): Promise<void> => {
    try {
      if (state.registerer.value) {
        await state.registerer.value.unregister()
        state.registerer.value = null
      }

      if (state.userAgent.value) {
        await state.userAgent.value.stop()
        state.userAgent.value = null
      }

      state.isRegistered.value = false
      console.log('✅ WebRTC unregistered')

      globalToast.info('WebRTC desconectado', 'Desregistrado com sucesso', 2000)
    } catch (error: any) {
      console.error('Error during unregister:', error)
      // Still reset state even if unregister fails
      state.resetState()
    }
  }

  return {
    register,
    unregister,
  }
}
