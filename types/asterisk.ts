export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface AsteriskEvent {
  type: string
  data: any
  timestamp: Date
}

export interface PendingCommand {
  resolve: (value: any) => void
  reject: (reason: any) => void
  timeoutId?: ReturnType<typeof setTimeout>
}

export interface WebSocketMessage {
  type: 'event' | 'system' | 'pong' | 'command_response' | 'ping' | 'command'
  requestId?: string
  data?: any
}