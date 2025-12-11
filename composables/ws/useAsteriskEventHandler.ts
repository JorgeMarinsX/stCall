import { globalToast } from '~/utils/toastManager'

export const useAsteriskEventHandler = () => {
  const asteriskStore = useAsteriskStore()
  const callStore = useCallStore()

  const handleEvent = (event: any): void => {
    // Store event in history
    storeEventInHistory(event)

    // Log event
    console.log('📡 Asterisk event:', event.type, event)

    // Route event to appropriate handler
    routeEventToStore(event)
  }

  const storeEventInHistory = (event: any): void => {
    asteriskStore.events.unshift({
      type: event.type || 'unknown',
      data: event,
      timestamp: new Date(),
    })
    // Only keep last 100
    if (asteriskStore.events.length > 100) {
      asteriskStore.events.pop()
    }
  }


  const routeEventToStore = (event: any): void => {
    switch (event.type) {
      case 'StasisStart':
        // New call entering application
        handleStasisStart(event)
        break

      case 'ChannelStateChange':
        // Call state changed (Ring → Up, etc.)
        handleChannelStateChange(event)
        break

      case 'ChannelHangupRequest':
      case 'StasisEnd':
        // Call ended
        handleCallEnd(event)
        break

      default:
        // Log unknown events for debugging
        console.log('Unhandled event type:', event.type)
    }
  }


  const handleStasisStart = (event: any): void => {
    callStore.receiveIncomingCall({
      number: event.channel.caller.number,
      callerName: event.channel.caller.name,
      callId: event.channel.id
    })
  }


  const handleChannelStateChange = (event: any): void => {
    callStore.updateCallStatus(event.channel.id, event.channel.state)
  }

  const handleCallEnd = (event: any): void => {
    callStore.endCall(event.channel.id)
  }


  const handleSystemMessage = (data: any): void => {
    console.log('System message:', data)

    const severity = data.severity === 'warning' ? 'warn' :
                     data.severity === 'error' ? 'error' :
                     data.severity === 'success' ? 'success' : 'info'

    const summary = severity === 'error' ? 'Erro' :
                   severity === 'warn' ? 'Atenção' : 'Informação'

    const life = severity === 'error' ? 10000 : 5000

    globalToast.add({
      severity,
      summary,
      detail: data.message,
      life
    })
  }

  return {
    handleEvent,
    handleSystemMessage
  }
}