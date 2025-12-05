export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
  timestamp: Date
}

export interface ReleaseNote {
  version: string
  date: Date
  changes: string[]
  isRead: boolean
}
