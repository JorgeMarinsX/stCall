// Re-export all types from stores for easy importing
export type {
  User,
} from '~/stores/authStore'

export type {
  ConnectionStatus,
  AsteriskEvent,
} from '~/stores/asteriskStore'

export type {
  Call,
  CallHistory,
  CallStatus,
  CallDirection,
} from '~/stores/callStore'

export type {
  Agent,
  AgentStats,
  AgentStatus,
} from '~/stores/agentStore'

export type {
  Notification,
  NotificationType,
  ReleaseNote,
} from '~/stores/uiStore'
