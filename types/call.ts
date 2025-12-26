export type CallStatus = 'idle' | 'ringing' | 'active' | 'hold' | 'transferring'
export type CallDirection = 'inbound' | 'outbound'

export interface Call {
  id: string
  number: string
  callerName?: string
  direction: CallDirection
  status: CallStatus
  startTime: Date
  duration: number
  isMuted: boolean
  isOnHold: boolean
  isWebRTC?: boolean  // Flag to identify WebRTC calls vs ARI calls
}

export interface CallHistory {
  id: string
  number: string
  callerName?: string
  direction: CallDirection
  duration: number
  timestamp: Date
  recordingUrl?: string
  status: 'completed' | 'missed' | 'rejected' | 'abandoned' | 'queued'
  agentId?: string
  agentName?: string
  agentExtension?: string
  queueName?: string
  waitDuration?: number
}