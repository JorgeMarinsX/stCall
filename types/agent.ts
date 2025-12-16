export type AgentStatus = 'available' | 'on_call' | 'unavailable' | 'offline'


export interface Agent {
  id: string
  name: string
  email: string
  extension?: string
  avatar?: string
  status: AgentStatus
  currentCallId?: string
  currentCallNumber?: string
  callStartTime?: Date
  isConnected: boolean
  activeCall?: {
    number: string
    startTime: Date
  }
}

export interface AgentStats {
  totalCalls: number
  answeredCalls: number
  missedCalls: number
  averageDuration: number
  todayCalls: number
}
